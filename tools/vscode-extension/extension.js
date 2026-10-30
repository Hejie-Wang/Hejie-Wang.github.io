const vscode = require('vscode')
const { execFile } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')
const {
  frontMatterRange,
  readList,
  writeList,
  permalinkOf,
  encodePermalink
} = require('./lib/front-matter')

const fsp = fs.promises

let output
let statusItem
let treeProvider
let treeView

/* ---------------- 基础工具 ---------------- */

function safeRoot() {
  const folder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]
  return folder ? folder.uri.fsPath : undefined
}

function workspaceRoot() {
  const root = safeRoot()
  if (!root) throw new Error('请先打开博客仓库文件夹（File → Open Folder）再运行这个命令。')
  return root
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

const config = () => vscode.workspace.getConfiguration('blogPublisher')

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
    return `post: ${path.basename(post).replace(/\.md$/i, '')}（${timestamp()}）`
  }
  return `chore: 更新博客（${timestamp()}）`
}

async function repoInfo(root) {
  try {
    const remotes = await git(['remote', '-v'], root)
    const match = remotes.stdout.match(/github\.com[:/]([^/\s]+)\/([^/\s]+?)(?:\.git)?(?=\s|$)/)
    if (!match) return undefined
    const repo = match[2].replace(/\.git$/, '')
    return { owner: match[1], repo, web: `https://github.com/${match[1]}/${repo}` }
  } catch {
    return undefined
  }
}

function siteUrl() {
  return String(config().get('siteUrl') || '').replace(/\/+$/, '')
}

/* ---------------- 文章相关 ---------------- */

const postsDirOf = (root) => path.join(root, 'source', '_posts')

function isPostFile(fsPath, root) {
  if (!fsPath) return false
  const postsDir = postsDirOf(root)
  const normalized = path.resolve(fsPath)
  return (
    normalized.startsWith(postsDir + path.sep) &&
    normalized.toLowerCase().endsWith('.md') &&
    !normalized.includes(`${path.sep}assets${path.sep}`)
  )
}

async function listPosts(root) {
  const postsDir = postsDirOf(root)
  const found = []
  const stack = [postsDir]

  while (stack.length) {
    const current = stack.pop()
    if (!fs.existsSync(current)) continue
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== 'assets') stack.push(full)
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        found.push({ file: full, mtime: fs.statSync(full).mtimeMs })
      }
    }
  }

  return found.sort((a, b) => b.mtime - a.mtime).map((post) => post.file)
}

function fallbackDate(file) {
  const date = new Date(fs.statSync(file).mtimeMs)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function postDate(file) {
  try {
    const text = fs.readFileSync(file, 'utf8')
    const frontMatter = frontMatterRange(text)
    const match = frontMatter ? /^date:\s*(.+)$/m.exec(frontMatter.body) : null
    if (match) return match[1].trim()
  } catch {
    /* 读不到就用文件时间 */
  }
  return fallbackDate(file)
}

function postUrl(file) {
  const base = siteUrl()
  if (!base) return undefined
  const slug = path.basename(file, '.md')
  const permalink = permalinkOf(postDate(file), slug)
  return permalink ? `${base}/${encodePermalink(permalink)}/` : undefined
}

function currentPostFile(root) {
  const editor = vscode.window.activeTextEditor
  if (editor && isPostFile(editor.document.uri.fsPath, root)) return editor.document.uri.fsPath
  return undefined
}

async function resolveTargetPost(root) {
  const active = currentPostFile(root)
  if (active) return active

  const posts = await listPosts(root)
  if (!posts.length) {
    vscode.window.showWarningMessage('没找到任何文章（source/_posts 下没有 .md）。')
    return undefined
  }

  const items = posts.map((file) => ({
    label: path.basename(file, '.md'),
    description: path.relative(postsDirOf(root), file).replace(/\\/g, '/'),
    file
  }))

  const picked = await vscode.window.showQuickPick(items, {
    title: '选择文章',
    placeHolder: '用来编辑标签 / 分类的文章',
    matchOnDescription: true
  })

  return picked ? picked.file : undefined
}

async function collectFacets(root) {
  const posts = await listPosts(root)
  const tags = new Map()
  const categories = new Map()

  for (const file of posts) {
    try {
      const text = await fsp.readFile(file, 'utf8')
      for (const tag of readList(text, 'tags')) tags.set(tag, (tags.get(tag) || 0) + 1)
      for (const category of readList(text, 'categories')) {
        categories.set(category, (categories.get(category) || 0) + 1)
      }
    } catch {
      /* 单个文件读失败就跳过 */
    }
  }

  const toItems = (map) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, count }))

  return { tags: toItems(tags), categories: toItems(categories) }
}

/* ---------------- 多选 + 新建 的 QuickPick ---------------- */

function pickValues({ title, placeholder, existing, selected }) {
  return new Promise((resolve) => {
    const quickPick = vscode.window.createQuickPick()
    quickPick.title = title
    quickPick.placeholder = placeholder
    quickPick.canSelectMany = true
    quickPick.ignoreFocusOut = true

    const seen = new Set()
    const items = []

    for (const { value, count } of existing) {
      seen.add(value)
      items.push({ label: value, description: `${count} 篇`, picked: selected.includes(value) })
    }
    for (const value of selected) {
      if (seen.has(value)) continue
      seen.add(value)
      items.push({ label: value, description: '当前文章', picked: true })
    }

    quickPick.items = items
    quickPick.selectedItems = items.filter((item) => item.picked)
    quickPick.buttons = [{ iconPath: new vscode.ThemeIcon('add'), tooltip: '新建一个' }]

    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      resolve(value)
      quickPick.hide()
    }

    quickPick.onDidTriggerButton(async () => {
      const created = await vscode.window.showInputBox({
        title: `${title}（新建）`,
        prompt: '输入后回车，可继续多选',
        ignoreFocusOut: true
      })
      const value = (created || '').trim()
      if (!value) {
        quickPick.show()
        return
      }

      let target = items.find((item) => item.label === value)
      if (!target) {
        target = { label: value, description: '新建', picked: true }
        items.push(target)
        quickPick.items = items
      }
      quickPick.selectedItems = [...quickPick.selectedItems, target]
      quickPick.show()
    })

    quickPick.onDidAccept(() => finish(quickPick.selectedItems.map((item) => item.label)))
    quickPick.onDidHide(() => {
      finish(undefined)
      quickPick.dispose()
    })

    quickPick.show()
  })
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
          title: '博客：发布博客',
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

        const info = await repoInfo(root)
        const actions = []
        if (siteUrl()) actions.push('打开站点')
        if (info) actions.push('查看构建')

        const choice = await vscode.window.showInformationMessage(`已推送：${message}`, ...actions)
        if (choice === '打开站点') {
          await openSite()
        } else if (choice === '查看构建' && info) {
          vscode.env.openExternal(vscode.Uri.parse(`${info.web}/actions`))
        }
      } catch (error) {
        output.show(true)
        vscode.window.showErrorMessage(`发布失败：${describeError(error)}`)
      } finally {
        refreshSidebar()
      }
    }
  )
}

async function validate() {
  const root = workspaceRoot()
  try {
    await runNode(root, [path.join('tools', 'validate-posts.cjs')])
    vscode.window.showInformationMessage('校验通过：front matter、图片与附件引用都没问题。')
  } catch (error) {
    output.show(true)
    const firstLine = describeError(error).split('\n').filter(Boolean)[0] || '校验失败'
    vscode.window.showErrorMessage(`校验失败：${firstLine}`)
  }
  refreshSidebar()
}

async function pickTagsAndCategories() {
  const root = workspaceRoot()

  try {
    const file = await resolveTargetPost(root)
    if (!file) return

    const document = await vscode.workspace.openTextDocument(file)
    if (document.isDirty) await document.save()

    const text = document.getText()
    if (!frontMatterRange(text)) {
      vscode.window.showErrorMessage(`${path.basename(file)} 没有 front matter，先补上 --- 包围的头部再选标签。`)
      return
    }

    const facets = await collectFacets(root)
    const currentTags = readList(text, 'tags')
    const currentCategories = readList(text, 'categories')

    const tags = await pickValues({
      title: '选择标签',
      placeholder: '可多选；右上角 + 可以新建',
      existing: facets.tags,
      selected: currentTags
    })
    if (tags === undefined) return

    const categories = await pickValues({
      title: '选择分类',
      placeholder: '可多选；右上角 + 可以新建',
      existing: facets.categories,
      selected: currentCategories
    })
    if (categories === undefined) return

    const updated = writeList(writeList(text, 'tags', tags), 'categories', categories)
    if (updated === text) {
      vscode.window.showInformationMessage('标签和分类没有变化。')
      return
    }

    const edit = new vscode.WorkspaceEdit()
    edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(text.length)), updated)
    const applied = await vscode.workspace.applyEdit(edit)
    if (!applied) {
      vscode.window.showErrorMessage('写入 front matter 失败。')
      return
    }
    await document.save()

    const summary = [
      tags.length ? `tags: ${tags.join('、')}` : 'tags 已清空',
      categories.length ? `categories: ${categories.join('、')}` : 'categories 已清空'
    ]
    vscode.window.showInformationMessage(`已更新 ${path.basename(file)} — ${summary.join(' / ')}`)
  } catch (error) {
    output.show(true)
    vscode.window.showErrorMessage(`选择标签/分类失败：${describeError(error)}`)
  } finally {
    refreshSidebar()
  }
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
    const target = created ? path.join(root, created[1].trim().replace(/[\\/]+/g, path.sep)) : (await listPosts(root))[0]

    if (target && fs.existsSync(target)) {
      const document = await vscode.workspace.openTextDocument(target)
      await vscode.window.showTextDocument(document)
    } else {
      vscode.window.showInformationMessage('文章已创建，请到 source/_posts 下查看。')
    }
  } catch (error) {
    output.show(true)
    vscode.window.showErrorMessage(`新建失败：${describeError(error)}`)
  } finally {
    refreshSidebar()
  }
}

async function openSite() {
  const base = siteUrl()
  if (!base) {
    vscode.window.showWarningMessage('请先在设置里填写 blogPublisher.siteUrl。')
    return
  }
  await vscode.env.openExternal(vscode.Uri.parse(`${base}/`))
}

async function openCurrentPost() {
  const root = workspaceRoot()
  const file = await resolveTargetPost(root)
  if (!file) return

  const url = postUrl(file)
  if (!url) {
    vscode.window.showWarningMessage('拼不出线上地址，请检查 blogPublisher.siteUrl 与文章的 date。')
    return
  }
  await vscode.env.openExternal(vscode.Uri.parse(url))
}

async function openSource() {
  const root = workspaceRoot()
  const info = await repoInfo(root)
  if (!info) {
    vscode.window.showWarningMessage('没找到 GitHub 远端（origin）。')
    return
  }

  const file = await resolveTargetPost(root)
  if (!file) return

  const relative = path
    .relative(root, file)
    .split(path.sep)
    .map(encodeURIComponent)
    .join('/')
  const branch = (await git(['rev-parse', '--abbrev-ref', 'HEAD'], root)).stdout.trim() || 'master'
  await vscode.env.openExternal(vscode.Uri.parse(`${info.web}/blob/${branch}/${relative}`))
}

async function openActions() {
  const root = workspaceRoot()
  const info = await repoInfo(root)
  if (!info) {
    vscode.window.showWarningMessage('没找到 GitHub 远端（origin）。')
    return
  }
  await vscode.env.openExternal(vscode.Uri.parse(`${info.web}/actions`))
}

async function openRepo() {
  const root = workspaceRoot()
  const info = await repoInfo(root)
  if (!info) {
    vscode.window.showWarningMessage('没找到 GitHub 远端（origin）。')
    return
  }
  await vscode.env.openExternal(vscode.Uri.parse(info.web))
}

function refreshSidebar() {
  if (treeProvider) treeProvider.refresh()
}

/* ---------------- 侧边栏 ---------------- */

const cmd = (command, title) => ({ command, title })

async function pendingChanges(root) {
  try {
    const status = await git(['status', '--porcelain'], root)
    return status.stdout.split('\n').filter((line) => line.trim()).length
  } catch {
    return undefined
  }
}

async function sidebarNodes(root) {
  const pending = await pendingChanges(root)
  const active = currentPostFile(root)
  const info = await repoInfo(root)
  const remoteHost = info ? `${info.owner}/${info.repo}` : '未配置远端'

  return [
    {
      label: '发布博客',
      description: pending === undefined ? 'git 不可用' : pending === 0 ? '无改动' : `${pending} 个文件待提交`,
      tooltip: '校验 → 提交 → 推送（Ctrl+Alt+P）',
      icon: 'rocket',
      command: cmd('blogPublisher.publish', '发布博客')
    },
    {
      label: '选择标签和分类',
      description: active ? path.basename(active, '.md') : '选择文章…',
      tooltip: '给文章挑选 tags / categories，可新建',
      icon: 'tag',
      command: cmd('blogPublisher.pickTagsAndCategories', '选择标签和分类')
    },
    {
      label: '进行校验',
      description: 'front matter · 图片 · 附件',
      tooltip: '运行 tools/validate-posts.cjs',
      icon: 'check-all',
      command: cmd('blogPublisher.validate', '进行校验')
    },
    {
      label: '新建文章',
      description: 'hexo new',
      tooltip: '在 source/_posts/<年>/<月>/ 下新建并打开',
      icon: 'new-file',
      command: cmd('blogPublisher.newPost', '新建文章')
    },
    {
      label: '打开远端网页',
      description: remoteHost,
      tooltip: '站点、线上文章、源码、Actions、仓库',
      icon: 'globe',
      children: [
        {
          label: '站点首页',
          description: siteUrl() || undefined,
          icon: 'home',
          command: cmd('blogPublisher.openSite', '站点首页')
        },
        {
          label: '当前文章的线上页面',
          description: active ? path.basename(active, '.md') : '选择文章…',
          icon: 'link-external',
          command: cmd('blogPublisher.openCurrentPost', '当前文章的线上页面')
        },
        {
          label: '当前文章的 GitHub 源码',
          icon: 'github',
          command: cmd('blogPublisher.openSource', '当前文章的 GitHub 源码')
        },
        {
          label: 'Actions 构建记录',
          icon: 'history',
          command: cmd('blogPublisher.openActions', 'Actions 构建记录')
        },
        {
          label: 'GitHub 仓库',
          description: info ? info.web.replace(/^https?:\/\//, '') : undefined,
          icon: 'repo',
          command: cmd('blogPublisher.openRepo', 'GitHub 仓库')
        }
      ]
    }
  ]
}

class BlogSidebarProvider {
  constructor() {
    this.emitter = new vscode.EventEmitter()
    this.onDidChangeTreeData = this.emitter.event
    this.cache = { at: 0, nodes: [] }
  }

  refresh() {
    this.cache = { at: 0, nodes: [] }
    this.emitter.fire()
  }

  async getChildren(node) {
    if (node && node.children) return node.children
    if (node) return []

    const root = safeRoot()
    if (!root) return []

    const now = Date.now()
    if (!this.cache.nodes.length || now - this.cache.at > 2000) {
      this.cache = { at: now, nodes: await sidebarNodes(root) }
    }
    return this.cache.nodes
  }

  getTreeItem(node) {
    const collapsible = node.children
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None

    const item = new vscode.TreeItem(node.label, collapsible)
    if (node.icon) item.iconPath = new vscode.ThemeIcon(node.icon)
    if (node.description) item.description = node.description
    if (node.tooltip) item.tooltip = node.tooltip
    if (node.command) {
      item.command = { command: node.command.command, title: node.command.title, arguments: [] }
    }
    return item
  }
}

/* ---------------- 生命周期 ---------------- */

function activate(context) {
  output = vscode.window.createOutputChannel('博客发布')
  treeProvider = new BlogSidebarProvider()
  treeView = vscode.window.createTreeView('blogPublisher.sidebar', {
    treeDataProvider: treeProvider,
    showCollapseAll: false
  })

  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusItem.text = '$(cloud-upload) 发布博客'
  statusItem.tooltip = '博客：发布博客（Ctrl+Alt+P）'
  statusItem.command = 'blogPublisher.publish'
  statusItem.show()

  context.subscriptions.push(
    output,
    treeView,
    statusItem,
    vscode.commands.registerCommand('blogPublisher.publish', publish),
    vscode.commands.registerCommand('blogPublisher.pickTagsAndCategories', pickTagsAndCategories),
    vscode.commands.registerCommand('blogPublisher.validate', validate),
    vscode.commands.registerCommand('blogPublisher.newPost', newPost),
    vscode.commands.registerCommand('blogPublisher.openSite', openSite),
    vscode.commands.registerCommand('blogPublisher.openCurrentPost', openCurrentPost),
    vscode.commands.registerCommand('blogPublisher.openSource', openSource),
    vscode.commands.registerCommand('blogPublisher.openActions', openActions),
    vscode.commands.registerCommand('blogPublisher.openRepo', openRepo),
    vscode.commands.registerCommand('blogPublisher.refresh', refreshSidebar),
    vscode.window.onDidChangeActiveTextEditor(() => refreshSidebar()),
    vscode.workspace.onDidSaveTextDocument(() => refreshSidebar())
  )
}

function deactivate() {
  if (treeView) treeView.dispose()
  if (statusItem) statusItem.dispose()
}

module.exports = { activate, deactivate }
