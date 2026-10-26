/* global hexo */
'use strict'

/**
 * 让附件目录与文章目录同构：
 *
 *   source/_posts/2026/09/某篇文章.md
 *   source/_posts/2026/09/assets/某篇文章/截图.png
 *   source/_posts/2026/09/assets/某篇文章/手册.pdf
 *
 * 文章里写 `![](assets/某篇文章/截图.png)` 或
 * `{% pdf assets/某篇文章/手册.pdf %}`，构建后挂到：
 *   /2026/09/…/某篇文章/assets/某篇文章/截图.png
 *   /2026/09/…/某篇文章/assets/某篇文章/手册.pdf
 *
 * 这样 VS Code 的 `${documentBaseName}` 粘贴规则（文件落在文档同级的
 * assets/<文档名>/ 下）不用任何额外操作就能被 Hexo 识别。
 * 图片、PDF、压缩包等任意附件都会被挂载，只有 .md 会被忽略。
 */

const fs = require('node:fs')
const path = require('node:path')

function listAssets(dir) {
  const found = []
  const stack = [dir]
  while (stack.length) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) stack.push(full)
      else if (entry.isFile() && !entry.name.toLowerCase().endsWith('.md')) found.push(full)
    }
  }
  return found
}

function postPaths(post) {
  const source = String(post.source || '').replace(/\\/g, '/')
  const dir = path.posix.dirname(source)
  const base = path.posix.basename(source, path.posix.extname(source))
  const permalink = String(post.path || '').replace(/\\/g, '/')
  return { dir, base, permalink: permalink.endsWith('/') ? permalink : `${permalink}/` }
}

function assetPrefix(post) {
  const { base, permalink } = postPaths(post)
  const root = hexo.config.root || '/'
  return {
    base,
    prefix: `${root.endsWith('/') ? root : `${root}/`}${permalink}assets/${base}/`
  }
}

function escapeRe(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/* 把 assets/<文章名>/** 挂到文章自己的 URL 下面 */
hexo.extend.generator.register('post_assets', function (locals) {
  const sourceDir = path.join(hexo.base_dir, hexo.config.source_dir)
  const routes = []

  locals.posts.filter(post => post.published !== false).forEach(post => {
    const { dir, base, permalink } = postPaths(post)
    const assetsDir = path.join(sourceDir, dir, 'assets', base)
    if (!fs.existsSync(assetsDir)) return

    for (const file of listAssets(assetsDir)) {
      const rel = path.relative(assetsDir, file).split(path.sep).join('/')
      routes.push({
        path: `${permalink}assets/${base}/${rel}`,
        data: () => fs.createReadStream(file)
      })
    }
  })

  if (routes.length) {
    hexo.log.debug('post_assets: %d 个附件已挂载', routes.length)
  }
  return routes
})

/* Markdown 阶段：把 assets/<文章名>/… 的相对引用改写成站点绝对路径 */
hexo.extend.filter.register('before_post_render', function (data) {
  if (!data || typeof data.content !== 'string' || !data.path) return data

  const { base, prefix } = assetPrefix(data)
  const escaped = escapeRe(base)

  // 只改写指向本文档 assets 目录的引用；其余相对路径保持原样
  data.content = data.content.replace(
    new RegExp(`(\\]\\(|src=(["']))(?:\\./)?assets/${escaped}/`, 'g'),
    (match, head) => `${head}${prefix}`
  )

  return data
})

/* HTML 阶段：处理 {% pdf %} 之类的标签输出、以及正文里的裸 HTML 属性 */
hexo.extend.filter.register('after_post_render', function (data) {
  if (!data || typeof data.content !== 'string' || !data.path) return data

  const { base, prefix } = assetPrefix(data)
  const escaped = escapeRe(base)

  data.content = data.content.replace(
    new RegExp(`(src|href|data-pdf-src)=(["'])(?:\\./)?assets/${escaped}/`, 'g'),
    (match, attr, quote) => `${attr}=${quote}${prefix}`
  )

  return data
})
