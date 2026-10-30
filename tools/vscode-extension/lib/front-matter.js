'use strict'

/**
 * front matter 里 tags / categories 的读取与写回。
 * 纯文本处理，不引 YAML 依赖，尽量保持原有格式与顺序。
 */

function frontMatterRange(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)
  if (!match) return null
  const body = match[1]
  const start = match[0].indexOf('\n') + 1
  return { body, start, end: start + body.length }
}

function unquote(value) {
  const trimmed = String(value).trim()
  if (trimmed.length >= 2) {
    const first = trimmed[0]
    const last = trimmed[trimmed.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1).replace(/\\"/g, '"')
    }
  }
  return trimmed
}

function splitInline(value) {
  const parts = []
  let current = ''
  let quote = null

  for (const char of value) {
    if (quote) {
      if (char === quote) quote = null
      else current += char
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === ',') {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }
  parts.push(current)

  return parts.map((part) => part.trim()).filter(Boolean)
}

function listFromBody(body, key) {
  const lines = body.split(/\r?\n/)
  const keyPattern = new RegExp(`^${key}:\\s*(.*)$`)

  for (let index = 0; index < lines.length; index += 1) {
    const match = keyPattern.exec(lines[index])
    if (!match) continue

    const rest = match[1].trim()
    if (rest.startsWith('[')) {
      const inner = rest.replace(/^\[/, '').replace(/\]\s*$/, '')
      return splitInline(inner).map(unquote).filter(Boolean)
    }
    if (rest) return [unquote(rest)]

    const values = []
    for (let next = index + 1; next < lines.length; next += 1) {
      const item = /^\s*-\s+(.+?)\s*$/.exec(lines[next])
      if (!item) break
      values.push(unquote(item[1]))
    }
    return values
  }

  return []
}

function formatScalar(value) {
  const text = String(value)
  const needsQuote = /[:#{}[\],&*?|>'"]/.test(text) || /^[-?\s]/.test(text) || /\s$/.test(text)
  return needsQuote ? `"${text.replace(/"/g, '\\"')}"` : text
}

function setInBody(body, key, values) {
  const eol = body.includes('\r\n') ? '\r\n' : '\n'
  const lines = body.split(/\r?\n/)
  const block = values.length
    ? [`${key}:`, ...values.map((value) => `  - ${formatScalar(value)}`)]
    : [`${key}:`]

  const index = lines.findIndex((line) => new RegExp(`^${key}:`).test(line))
  if (index === -1) return [...lines, ...block].join(eol)

  let end = index + 1
  while (end < lines.length && /^\s*-\s+/.test(lines[end])) end += 1

  return [...lines.slice(0, index), ...block, ...lines.slice(end)].join(eol)
}

function readList(text, key) {
  const frontMatter = frontMatterRange(text)
  return frontMatter ? listFromBody(frontMatter.body, key) : []
}

function writeList(text, key, values) {
  const frontMatter = frontMatterRange(text)
  if (!frontMatter) return text
  const body = setInBody(frontMatter.body, key, values)
  return text.slice(0, frontMatter.start) + body + text.slice(frontMatter.end)
}

/** '2026-10-26 17:38:00' → { year: '2026', month: '10', day: '26' } */
function parseDate(value) {
  if (value instanceof Date) {
    return {
      year: String(value.getFullYear()),
      month: String(value.getMonth() + 1).padStart(2, '0'),
      day: String(value.getDate()).padStart(2, '0')
    }
  }

  const match = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(value || ''))
  if (!match) return null

  return {
    year: match[1],
    month: match[2].padStart(2, '0'),
    day: match[3].padStart(2, '0')
  }
}

/** 与 _config.yml 的 permalink: :year/:month/:day/:title/ 保持一致 */
function permalinkOf(dateValue, slug) {
  const date = parseDate(dateValue)
  if (!date) return null
  return `${date.year}/${date.month}/${date.day}/${slug}`
}

function encodePermalink(permalink) {
  return String(permalink)
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

module.exports = {
  frontMatterRange,
  readList,
  writeList,
  parseDate,
  permalinkOf,
  encodePermalink
}
