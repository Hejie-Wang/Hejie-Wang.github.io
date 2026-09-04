/* Import the original articles/assets from this repository's generated site. */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const source = path.join(root, 'source')
const posts = path.join(source, '_posts')

function copyTree(from, to) {
  if (!fs.existsSync(from)) return
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name)
    const dst = path.join(to, entry.name)
    if (entry.isDirectory()) copyTree(src, dst)
    else if (!fs.existsSync(dst)) fs.copyFileSync(src, dst)
  }
}

function decodeEntities(value) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" }
  return value.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (entity, code) => {
    if (code[0] !== '#') return named[code] ?? entity
    const number = code[1].toLowerCase() === 'x'
      ? Number.parseInt(code.slice(2), 16)
      : Number.parseInt(code.slice(1), 10)
    return Number.isFinite(number) ? String.fromCodePoint(number) : entity
  })
}

function yamlString(value) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function findGeneratedPosts() {
  const found = []
  for (const year of fs.readdirSync(root, { withFileTypes: true })) {
    if (!year.isDirectory() || !/^\d{4}$/.test(year.name)) continue
    const yearDir = path.join(root, year.name)
    const stack = [yearDir]
    while (stack.length) {
      const dir = stack.pop()
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) stack.push(full)
        else if (entry.name === 'index.html') found.push(full)
      }
    }
  }
  return found
}

fs.mkdirSync(posts, { recursive: true })
copyTree(path.join(root, 'img'), path.join(source, 'img'))

for (const htmlFile of findGeneratedPosts()) {
  const html = fs.readFileSync(htmlFile, 'utf8')
  const titleMatch = html.match(/<h1 class="post-title">([\s\S]*?)<\/h1>/)
  const dateMatch = html.match(/property="article:published_time" content="([^"]+)"/)
  const updatedMatch = html.match(/property="article:modified_time" content="([^"]+)"/)
  const bodyMatch = html.match(/<article class="container post-content" id="article-container">([\s\S]*?)<\/article>/)
  if (!titleMatch || !dateMatch || !bodyMatch) continue

  const slug = path.basename(path.dirname(htmlFile))
  const markdownFile = path.join(posts, `${slug}.md`)
  if (fs.existsSync(markdownFile)) continue

  const categories = [...html.matchAll(/class="(?:post-meta-categories|post-meta__categories)"[^>]*>([^<]+)<\/a>/g)]
    .map(match => decodeEntities(match[1].trim()))
  const tags = [...html.matchAll(/class="post-meta__tags"[^>]*>([^<]+)<\/a>/g)]
    .map(match => decodeEntities(match[1].trim()))
  const frontMatter = [
    '---',
    `title: ${yamlString(decodeEntities(titleMatch[1].trim()))}`,
    `date: ${yamlString(dateMatch[1])}`,
    `updated: ${yamlString(updatedMatch?.[1] || dateMatch[1])}`,
    'author: 王赫杰'
  ]
  if (categories.length) {
    frontMatter.push('categories:', ...categories.map(value => `  - ${yamlString(value)}`))
  }
  if (tags.length) {
    frontMatter.push('tags:', ...tags.map(value => `  - ${yamlString(value)}`))
  }
  frontMatter.push('---', '', bodyMatch[1].trim(), '')
  fs.writeFileSync(markdownFile, frontMatter.join('\n'), 'utf8')

  const oldAssetDir = path.dirname(htmlFile)
  const newAssetDir = path.join(posts, slug)
  for (const entry of fs.readdirSync(oldAssetDir, { withFileTypes: true })) {
    if (!entry.isFile() || entry.name === 'index.html') continue
    fs.mkdirSync(newAssetDir, { recursive: true })
    fs.copyFileSync(path.join(oldAssetDir, entry.name), path.join(newAssetDir, entry.name))
  }
  console.log(`Imported ${path.relative(root, htmlFile)} as source/_posts/${slug}.md`)
}
