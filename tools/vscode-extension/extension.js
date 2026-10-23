const vscode = require('vscode')
const { execFile } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')

let output
let statusItem

/* ---------------- 基础工具 ---------------- */

function workspaceRoot() {
  const folder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]
  if (!folder) throw new Error('请先打开博客仓库文件夹再运行这个命令。')
  return folder.uri.fsPath
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { cwd, windowsHide: true, maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (stdout) output.append(stdout)
      if (stderr) output.append(stderr)
      if (error) {
        error.stdout = stdout
        error.stderr = stderr
        reject(error)
        return
      }
      resolve({ stdout: stdout || '', stderr: stderr || '' })
    })
  })
}

const git = (args, cwd) => run('git', args, cwd)
const runNode = (root, args) => run(process.execPath, args, root)

function config() {
  return vscode.workspace.getConfiguration('blogPublisher')
}

function describeError(error) {
  const stderr = (error.stderr || '').trim()
  const stdout = (error.stdout || '').trim()
  return stderr || stdout || error.message
}

function timestamp() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function suggestMessage(porcelain) {
  const files = porcelain
    .split('\n')
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
  const post = files.find((file) => file.replace(/\\/g, '/').includes('source/_posts/'))

  if (post) {
    const name = path.basename(post).replace(/\.md$/i, '')
    return `post: ${name}（${timestamp()}）`
  }
  return `chore: 更新博客（${timestamp()}）`
}

async function actionsUrl(root) {
  try {
    const remotes = await git(['remote', '-v'], root)
    const match = remotes.stdout.match(/github\.com[:/]([^/]+)\/([^/\s]+?)(?:\.git)?(?:\s|$)/)
    if (!match) return undefined
    return `https://github.com/${match[1]}/${match[2]}/actions`
  } catch {
    return undefined
  }
}

/* ---------------- 命令实现 ---------------- */

async function publish() {
  const root = workspaceRoot()

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: '博客发布', cancellable: false },
    async (progress) => {
      try {
        progress.report({ message: '检查改动…' })
        const status = await git(['status', '--porcelain'], root)
        if (!status.stdout.trim()) {
          vscode.window.showInformationMessage('没有需要提交的改动，博客已经是最新的。')
          return
        }

        if (config().get('validateBeforePublish')) {
          progress.report({ message: '校验文章…' })
          await runNode(root, [path.join('tools', 'validate-posts.cjs')])
        }

        const message = await vscode.window.showInputBox({
          title: '博客：一键发布',
          prompt: '提交信息（回车确认，Esc 取消）',
          value: suggestMessage(status.stdout),
          ignoreFocusOut: true
        })
        if (message === undefined) {
          vscode.window.showInformationMessage('已取消发布。')
          return
        }

        progress.report({ message: '提交…' })
        await git(['add', '-A'], root)
        await git(['commit', '-m', message], root)

        const branch = (await git(['rev-parse', '--abbrev-ref', 'HEAD'], root)).stdout.trim()
        const remote = config().get('remote') || 'origin'

        progress.report({ message: `推送到 ${remote}/${branch}…` })
        await git(['push', remote, branch], root)

        statusItem.text = '$(check) 已发布'
        setTimeout(() => {
          statusItem.text = '$(cloud-upload) 发布博客'
        }, 8000)

        const actions = await actionsUrl(root)
        const items = ['打开站点']
        if (actions) items.push('查看构建')

        const choice = await vscode.window.showInformationMessage(`已推送：${message}`, ...items)
        if (choice === '打开站点') {
          openSite()
        } else if (choice === '查看构建' && actions) {
          vscode.env.openExternal(vscode.Uri.parse(actions))
        }
      } catch (error) {
        output.show(true)
        vscode.window.showErrorMessage(`发布失败：${describeError(error)}`)
      }
    }
  )
}

async function newPost() {
  const root = workspaceRoot()
  try {
    const title = await vscode.window.showInputBox({
      title: '博客：新建文章',
      prompt: '文章标题（会生成到 source/_posts/<年>/<月>/ 下）',
      placeHolder: '例如：我的新文章',
      ignoreFocusOut: true,
      validateInput: (value) => (value && value.trim() ? undefined : '标题不能为空')
    })
    if (!title) return

    const hexoBin = path.join(root, 'node_modules', 'hexo', 'bin', 'hexo')
    if (!fs.existsSync(hexoBin)) {
      vscode.window.showErrorMessage('没找到 hexo，请先在仓库根目录运行 npm install。')
      return
    }

    const result = await run(process.execPath, [hexoBin, 'new', title.trim()], root)
    const created = result.stdout.match(/Created:\s*(.+?\.md)/i)
    const target = created
      ? path.join(root, created[1].trim().replace(/[\\/]+/g, path.sep))
      : latestPost(root)

    if (target && fs.existsSync(target)) {
      const document = await vscode.workspace.openTextDocument(target)
      await vscode.window.showTextDocument(document)
    } else {
      vscode.window.showInformationMessage('文章已创建，请到 source/_posts 下查看。')
    }
  } catch (error) {
    output.show(true)
    vscode.window.showErrorMessage(`新建失败：${describeError(error)}`)
  }
}

function latestPost(root) {
  const postsDir = path.join(root, 'source', '_posts')
  let newest
  const stack = [postsDir]
  while (stack.length) {
    const current = stack.pop()
    if (!fs.existsSync(current)) continue
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== 'assets') stack.push(full)
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        const stat = fs.statSync(full)
        if (!newest || stat.mtimeMs > newest.time) newest = { file: full, time: stat.mtimeMs }
      }
    }
  }
  return newest && newest.file
}

function openSite() {
  const url = config().get('siteUrl')
  if (!url) {
    vscode.window.showWarningMessage('请先在设置里填写 blogPublisher.siteUrl。')
    return
  }
  vscode.env.openExternal(vscode.Uri.parse(url))
}

/* ---------------- 生命周期 ---------------- */

function activate(context) {
  output = vscode.window.createOutputChannel('博客发布')

  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusItem.text = '$(cloud-upload) 发布博客'
  statusItem.tooltip = '博客：一键发布（Ctrl+Alt+P）'
  statusItem.command = 'blogPublisher.publish'
  statusItem.show()

  context.subscriptions.push(
    output,
    statusItem,
    vscode.commands.registerCommand('blogPublisher.publish', publish),
    vscode.commands.registerCommand('blogPublisher.newPost', newPost),
    vscode.commands.registerCommand('blogPublisher.openSite', openSite)
  )
}

function deactivate() {
  if (statusItem) statusItem.dispose()
}

module.exports = { activate, deactivate }
