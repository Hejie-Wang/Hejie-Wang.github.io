/* global hexo */
'use strict'

/**
 * 让图片目录与文章目录同构：
 *
 *   source/_posts/2026/09/某篇文章.md
 *   source/_posts/2026/09/assets/某篇文章/截图.png
 *
 * 文章里写 `![](assets/某篇文章/截图.png)`，构建后挂到：
 *   /2026/09/…/某篇文章/assets/某篇文章/截图.png
 *
 * 这样 VS Code 的 `${documentBaseName}` 粘贴规则（图片落在文档同级的
 * assets/<文档名>/ 下）不用任何额外操作就能被 Hexo 识别。
 */

const fs = require('node:fs')
const path = require('node:path')

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i

function listAssets(dir) {
  const found = []
  const stack = [dir]
  while (stack.length) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) stack.push(full)
      else if (entry.isFile() && IMAGE_EXT.test(entry.name)) found.push(full)
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
    hexo.log.debug('post_assets: %d 个图片已挂载', routes.length)
  }
  return routes
})

/* 把文章里的 assets/<文章名>/… 相对引用改写成站点绝对路径，首页/归档/RSS 都不会断图 */
hexo.extend.filter.register('before_post_render', function (data) {
  if (!data || typeof data.content !== 'string' || !data.path) return data

  const { base, permalink } = postPaths(data)
  const root = hexo.config.root || '/'
  const prefix = `${root.endsWith('/') ? root : `${root}/`}${permalink}assets/${base}/`
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // 只改写指向本文档 assets 目录的引用；其余相对路径保持原样
  data.content = data.content.replace(
    new RegExp(`(\\]\\(|src=(["']))(?:\\./)?assets/${escaped}/`, 'g'),
    (match, head) => `${head}${prefix}`
  )

  return data
})
