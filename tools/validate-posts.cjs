const fs = require('node:fs')
const path = require('node:path')
const yaml = require('js-yaml')

const postsDir = path.resolve(__dirname, '..', 'source', '_posts')
const errors = []
const warnings = []

function walk(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      // assets/ 目录只放图片，不当作文章扫描
      if (entry.name === 'assets') continue
      files.push(...walk(full))
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.md') {
      files.push(full)
    }
  }
  return files
}

const imagePattern = /!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)|<img[^>]+src=["']([^"']+)["']/g

for (const file of walk(postsDir)) {
  const relative = path.relative(postsDir, file).replace(/\\/g, '/')
  const name = path.basename(file)

  const folder = path.relative(postsDir, path.dirname(file)).replace(/\\/g, '/')
  if (!/^\d{4}\/\d{2}$/.test(folder)) {
    warnings.push(`${relative}: 建议放在 年/月 目录下（例如 2026/09/${name}），当前在 ${folder || '_posts 根目录'}`)
  }

  const content = fs.readFileSync(file, 'utf8')
  const frontMatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)

  if (!frontMatter) {
    errors.push(`${relative}: 缺少由 --- 包围的 front matter`)
    continue
  }

  try {
    const metadata = yaml.load(frontMatter[1]) || {}
    if (!metadata.title) errors.push(`${relative}: front matter 缺少 title`)
    if (!metadata.date) errors.push(`${relative}: front matter 缺少 date`)
  } catch (error) {
    errors.push(`${relative}: front matter YAML 无效 (${error.message})`)
  }

  for (const match of content.matchAll(imagePattern)) {
    const reference = (match[1] || match[2] || '').replace(/^<|>$/g, '')
    if (!reference || /^(?:[a-z]+:|\/|#)/i.test(reference)) continue

    let decodedReference = reference
    try {
      decodedReference = decodeURIComponent(reference)
    } catch {
      errors.push(`${relative}: 图片路径不是有效的 URL 编码 (${reference})`)
      continue
    }

    const target = path.resolve(path.dirname(file), decodedReference)
    if (!fs.existsSync(target)) {
      errors.push(`${relative}: 找不到图片 ${reference}（期望位置 ${path.relative(postsDir, target).replace(/\\/g, '/')}）`)
    }
  }
}

for (const warning of warnings) console.warn(`提示: ${warning}`)

if (errors.length) {
  console.error(`文章校验失败:\n- ${errors.join('\n- ')}`)
  process.exit(1)
}

console.log('文章 front matter 与本地图片引用校验通过。')
