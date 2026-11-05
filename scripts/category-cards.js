/* global hexo */
'use strict'

/**
 * {% category_cards %} —— 把 /categories/ 渲染成卡片网格：
 * 封面（分类内最新文章的插图）+ 分类名 + 篇数 + 最近几篇标题。
 *
 * 注意：这里刻意不用 category.posts / hexo.locals.get('posts')。
 * warehouse 的 Query 在构造时就把数组固定住了，而 hexo.locals.get('posts')
 * 的结果会被 Cache 缓存——页面渲染时可能拿到「只处理了一部分文章」的快照，
 * 导致分类明明有文章却取不到。直接查 model 与 PostCategory 关系才可靠。
 *
 * 封面取图顺序：
 *   1. 文章的 index_img / cover / top_img 字段
 *   2. 文章 assets/<文章名>/ 下的第一张图片
 *   3. 按分类名生成渐变色块（兜底，不至于开天窗）
 */

const fs = require('node:fs')
const path = require('node:path')
const { encodeURL } = require('hexo-util')

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i
const MAX_TITLES = 3

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const rootPath = () => {
  const value = hexo.config.root || '/'
  return value.endsWith('/') ? value : `${value}/`
}

function toArray(value) {
  if (!value) return []
  if (typeof value.toArray === 'function') return value.toArray()
  return Array.isArray(value) ? value.slice() : []
}

const timeOf = (post) => {
  const date = post.date instanceof Date ? post.date : new Date(post.date)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function formatDate(date) {
  if (!date) return ''
  const value = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(value.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: hexo.config.timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(value)
  } catch {
    return value.toISOString().slice(0, 10)
  }
}

/* 分类 -> 文章列表（走 model + PostCategory，不碰 locals 快照） */
function postsByCategory() {
  const map = new Map()
  const posts = toArray(hexo.model('Post')).filter((post) => post.published !== false)

  for (const post of posts) {
    for (const category of toArray(post.categories)) {
      const key = String(category._id)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(post)
    }
  }

  for (const list of map.values()) list.sort((a, b) => timeOf(b) - timeOf(a))
  return map
}

function sourceAssetsUrl(post, fileName) {
  const source = String(post.source || '').replace(/\\/g, '/')
  const slug = path.posix.basename(source, path.posix.extname(source))
  return encodeURL(`${rootPath()}${String(post.path || '')}assets/${slug}/${fileName}`)
}

function frontMatterImage(post) {
  for (const key of ['index_img', 'cover', 'top_img']) {
    const value = post[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

function assetImage(post) {
  const source = String(post.source || '').replace(/\\/g, '/')
  if (!source) return undefined

  const slug = path.posix.basename(source, path.posix.extname(source))
  const assetsDir = path.join(
    hexo.base_dir,
    hexo.config.source_dir,
    path.posix.dirname(source),
    'assets',
    slug
  )
  if (!fs.existsSync(assetsDir)) return undefined

  const files = fs
    .readdirSync(assetsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_EXT.test(entry.name) && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))

  return files.length ? sourceAssetsUrl(post, files[0]) : undefined
}

function gradient(name) {
  let hash = 0
  for (const char of String(name)) hash = (hash * 31 + char.codePointAt(0)) % 360
  return `linear-gradient(135deg, hsl(${hash}, 46%, 62%), hsl(${(hash + 42) % 360}, 54%, 40%))`
}

/* 正文摘录：直接读源文件，避开渲染时序（页面与文章是并发渲染的） */
function stripInline(value) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/* 迁移回来的 HTML 里，<p> 经常把 <figure> 包的代码一起吞进去 */
const looksLikeCode = (value) =>
  /(?:\b\d{1,2}\b\s+){3,}|[{}]|;|\/\/|#include|\bint\b|\bvoid\b/.test(value)

function snippetOf(post) {
  let text = ''
  try {
    const file = path.join(hexo.base_dir, hexo.config.source_dir, String(post.source || ''))
    const raw = fs.readFileSync(file, 'utf8')
    const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
    const lines = body.split(/\r?\n/)

    let inCode = false
    for (const line of lines) {
      const trimmed = line.trim()
      if (/^(?:```|~~~)/.test(trimmed)) {
        inCode = !inCode
        continue
      }
      if (inCode || !trimmed) continue
      if (/^[<|!{%]/.test(trimmed)) continue
      if (/^#{1,6}\s/.test(trimmed)) continue
      if (/^(?:[-*+>]\s|\d+\.\s)/.test(trimmed)) continue
      if (/^[-=]{3,}$/.test(trimmed)) continue

      const candidate = stripInline(trimmed)
      if (candidate.length >= 16 && !looksLikeCode(candidate)) {
        text = candidate
        break
      }
    }

    // 老文章是从生成后的 HTML 迁回来的，正文没有 Markdown 段落
    if (!text) {
      const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
        .map((match) => stripInline(match[1].replace(/<[^>]+>/g, ' ')))
        .filter((value) => value.length >= 16)
      text = paragraphs.find((value) => !looksLikeCode(value)) || paragraphs[0] || ''
    }

    if (!text) {
      text = stripInline(body.replace(/<[^>]+>/g, ' ')).replace(/^(?:\d+\s+){2,}/, '')
    }
  } catch {
    text = ''
  }

  const title = String(post.title || '').trim()
  if (title && text.startsWith(title)) {
    text = text.slice(title.length).replace(/^\s*[:：\-—]?\s*/, '')
  }

  return text.length > 60 ? `${text.slice(0, 60)}…` : text
}

function coverStyle(category, posts) {
  for (const post of posts) {
    const image = frontMatterImage(post) || assetImage(post)
    if (image) return `background-image: url(&quot;${escapeHtml(image)}&quot;)`
  }
  return `background-image: ${gradient(category.name)}`
}

function cardFor(category, posts) {
  const latest = posts[0]
  const name = escapeHtml(category.name)
  const href = encodeURL(`${rootPath()}${String(category.path || '').replace(/^\/+/, '')}`)
  const date = formatDate(latest && latest.date)
  const latestTitle = escapeHtml((latest && latest.title) || '（无标题）')
  const snippet = latest ? snippetOf(latest) : ''
  const rest = posts.length - 1

  return [
    `<a class="cc-card" href="${href}" title="${name}">`,
    `  <div class="cc-cover" style="${coverStyle(category, posts)}">`,
    `    <span class="cc-count">${posts.length} 篇</span>`,
    `    <span class="cc-name">${name}</span>`,
    '  </div>',
    '  <div class="cc-body">',
    date ? `    <p class="cc-date">最近更新 ${date}</p>` : '',
    `    <p class="cc-latest">${latestTitle}</p>`,
    snippet ? `    <p class="cc-snippet">${escapeHtml(snippet)}</p>` : '',
    rest > 0 ? `    <p class="cc-more">同一分类还有 ${rest} 篇</p>` : '',
    '  </div>',
    '</a>'
  ]
    .filter(Boolean)
    .join('\n')
}

hexo.extend.tag.register('category_cards', function () {
  const grouped = postsByCategory()
  const categories = toArray(hexo.model('Category'))
    .map((category) => ({ category, posts: grouped.get(String(category._id)) || [] }))
    .filter((entry) => entry.posts.length > 0)
    .sort(
      (a, b) =>
        b.posts.length - a.posts.length ||
        String(a.category.name).localeCompare(String(b.category.name))
    )

  if (!categories.length) {
    return '<p class="cc-empty">还没有任何分类。</p>'
  }

  const cards = categories.map((entry) => cardFor(entry.category, entry.posts)).join('\n')
  return `<div class="cc-grid">\n${cards}\n</div>`
})
