const fs = require('node:fs')
const path = require('node:path')
const yaml = require('js-yaml')

const postsDir = path.resolve(__dirname, '..', 'source', '_posts')
const errors = new Set()
const warnings = []

const FILE_LIKE =
  /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico|pdf|zip|7z|rar|tar|gz|docx?|pptx?|xlsx?|epub|txt|csv|json|ya?ml|tex|bib|ipynb|md)$/i

const referencePatterns = [
  /!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g, // ![alt](图片)
  /<img[^>]+src=["']([^"']+)["']/g, // <img src>
  /\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g, // [文字](链接)
  /<a[^>]+href=["']([^"']+)["']/g, // <a href>
  /\{%\s*pdf\s+([^\s%}]+)/g // {% pdf 文件 %}
]

function walk(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'assets') continue
      files.push(...walk(full))
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.md') {
      files.push(full)
    }
  }
  return files
}

function checkReference(relative, file, reference) {
  const clean = reference.replace(/^<|>$/g, '').replace(/[?#].*$/, '')
  if (!clean) return
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(clean)) return
  if (!FILE_LIKE.test(clean)) return

  let decoded = clean
  try {
    decoded = decodeURIComponent(clean)
  } catch {
    errors.add(`${relative}: 路径不是有效的 URL 编码 (${clean})`)
    return
  }

  const target = path.resolve(path.dirname(file), decoded)
  if (!fs.existsSync(target)) {
    const expected = path.relative(postsDir, target).replace(/\\/g, '/')
    errors.add(`${relative}: 找不到文件 ${clean}（期望位置 ${expected}）`)
  }
}

for (const file of walk(postsDir)) {
  const relative = path.relative(postsDir, file).replace(/\\/g, '/')
  const name = path.basename(file)
  const folder = path.relative(postsDir, path.dirname(file)).replace(/\\/g, '/')

  if (!/^\d{4}\/\d{2}$/.test(folder)) {
    warnings.push(
      `${relative}: 建议放在 年/月 目录下（例如 2026/09/${name}），当前在 ${folder || '_posts 根目录'}`
    )
  }

  // 月份级 assets/ 里直接躺着的文件不属于任何文章，不会被挂载
  const looseAssets = path.join(path.dirname(file), 'assets')
  if (fs.existsSync(looseAssets)) {
    const loose = fs
      .readdirSync(looseAssets, { withFileTypes: true })
      .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
      .map((entry) => entry.name)
    if (loose.length) {
      warnings.push(`${relative}: ${folder}/assets/ 下的 ${loose.join('、')} 不在 assets/<文章名>/ 里，不会被挂载`)
    }
  }

  const content = fs.readFileSync(file, 'utf8')
  const frontMatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)

  if (!frontMatter) {
    errors.add(`${relative}: 缺少由 --- 包围的 front matter`)
    continue
  }

  try {
    const metadata = yaml.load(frontMatter[1]) || {}
    if (!metadata.title) errors.add(`${relative}: front matter 缺少 title`)
    if (!metadata.date) errors.add(`${relative}: front matter 缺少 date`)
  } catch (error) {
    errors.add(`${relative}: front matter YAML 无效 (${error.message})`)
  }

  for (const pattern of referencePatterns) {
    for (const match of content.matchAll(pattern)) {
      checkReference(relative, file, match[1] || '')
    }
  }
}

for (const warning of warnings) console.warn(`提示: ${warning}`)

if (errors.size) {
  console.error(`文章校验失败:\n- ${[...errors].join('\n- ')}`)
  process.exit(1)
}

console.log('文章 front matter、图片与附件引用校验通过。')
