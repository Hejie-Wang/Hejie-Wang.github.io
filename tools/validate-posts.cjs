const fs = require('node:fs')
const path = require('node:path')
const yaml = require('js-yaml')

const postsDir = path.resolve(__dirname, '..', 'source', '_posts')
const errors = []

for (const entry of fs.readdirSync(postsDir, { withFileTypes: true })) {
  if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.md') continue

  const file = path.join(postsDir, entry.name)
  const content = fs.readFileSync(file, 'utf8')
  const frontMatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)

  if (!frontMatter) {
    errors.push(`${entry.name}: 缺少由 --- 包围的 front matter`)
    continue
  }

  try {
    const metadata = yaml.load(frontMatter[1]) || {}
    if (!metadata.title) errors.push(`${entry.name}: front matter 缺少 title`)
    if (!metadata.date) errors.push(`${entry.name}: front matter 缺少 date`)
  } catch (error) {
    errors.push(`${entry.name}: front matter YAML 无效 (${error.message})`)
  }

  const assetDir = path.join(postsDir, path.basename(entry.name, '.md'))
  const imagePattern = /!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g
  for (const match of content.matchAll(imagePattern)) {
    const reference = match[1].replace(/^<|>$/g, '')
    if (/^(?:[a-z]+:|\/|#)/i.test(reference)) continue

    let decodedReference = reference
    try {
      decodedReference = decodeURIComponent(reference)
    } catch {
      errors.push(`${entry.name}: 图片路径不是有效的 URL 编码 (${reference})`)
      continue
    }

    const directPath = path.resolve(path.dirname(file), decodedReference)
    const postAssetPath = path.resolve(assetDir, decodedReference)
    if (!fs.existsSync(directPath) && !fs.existsSync(postAssetPath)) {
      errors.push(`${entry.name}: 找不到图片 ${reference}`)
    }
  }
}

if (errors.length) {
  console.error(`文章校验失败:\n- ${errors.join('\n- ')}`)
  process.exit(1)
}

console.log('文章 front matter 与本地图片引用校验通过。')
