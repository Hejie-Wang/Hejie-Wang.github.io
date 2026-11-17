/* global hexo */
'use strict'

/**
 * 构建期 KaTeX 数学公式渲染。
 *
 * 为什么不用浏览器端 MathJax/KaTeX：
 *   hexo-renderer-marked 会把 `$$ ... $$`（尤其是跨行、中间有空行的写法）
 *   拆成好几个 <p>，前端按分隔符扫描的 auto-render 就再也配不上对，
 *   于是公式只能以纯文本出现。这里在 Markdown 渲染之前先把公式「挖」出来，
 *   渲染成 HTML 再放回去，跨行/空行/表格里的公式都不受影响。
 *
 * 支持写法：$$...$$、\[...\]（行间公式），$...$、\(...\)（行内公式）。
 * 代码块与行内代码里的 $ 不会被当成公式。
 *
 * 公式在构建时用 katex.renderToString 转成静态 HTML，页面不需要加载 JS，
 * 也不会出现「先看到 $$ 再闪成公式」。
 */

const fs = require('node:fs')
const path = require('node:path')
const katex = require('katex')

const KATEX_DIST = path.dirname(require.resolve('katex/dist/katex.min.css'))
const FONT_DIR = path.join(KATEX_DIST, 'fonts')
const FONT_EXT = /\.(woff2|woff)$/i

/* 每个文章渲染过程中暂存的公式，key 用 data.source（文件路径，全局唯一） */
const store = new Map()

/* 早期文章是从生成后的 HTML 迁回来的，公式里的 {} & 被转义成了实体 */
function decodeEntities(value) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
  return value.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (entity, code) => {
    if (code[0] !== '#') return named[code.toLowerCase()] ?? entity
    const number =
      code[1].toLowerCase() === 'x'
        ? Number.parseInt(code.slice(2), 16)
        : Number.parseInt(code.slice(1), 10)
    return Number.isFinite(number) ? String.fromCodePoint(number) : entity
  })
}

/* KaTeX 没有 LaTeX 的 var* 希腊字母别名，补上，免得整条公式报错 */
const MACROS = {
  '\\varDelta': '\\Delta',
  '\\varTheta': '\\Theta',
  '\\varGamma': '\\Gamma',
  '\\varLambda': '\\Lambda',
  '\\varXi': '\\Xi',
  '\\varPi': '\\Pi',
  '\\varSigma': '\\Sigma',
  '\\varUpsilon': '\\Upsilon',
  '\\varPhi': '\\Phi',
  '\\varPsi': '\\Psi',
  '\\varOmega': '\\Omega'
}

function makePlaceholder(index) {
  return `@@KATEX${index}@@`
}

function protectMath(content) {
  const formulas = []
  const placeholders = []

  const placeholderFor = (tex, display) => {
    const index = formulas.length
    formulas.push({ tex: decodeEntities(tex.trim()), display })
    const token = makePlaceholder(index)
    placeholders.push(token)
    return token
  }

  // 1) 先把代码摘出去，避免误伤：
  //    围栏代码块（此时还是原始 Markdown）、已渲染成 HTML 的高亮块、<pre>
  const fences = []
  const stashFence = (match) => {
    fences.push(match)
    return `\n@@KATEXFENCE${fences.length - 1}@@\n`
  }

  let text = content.replace(/(?:^|\n)(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:\n\1[^\n]*|$)/g, stashFence)
  text = text.replace(/<figure class="highlight[\s\S]*?<\/figure>/g, stashFence)
  text = text.replace(/<pre[\s\S]*?<\/pre>/g, stashFence)

  const codes = []
  text = text.replace(/`[^`\n]+`/g, (match) => {
    codes.push(match)
    return `@@KATEXCODE${codes.length - 1}@@`
  })

  // 2) 行间公式：$$...$$ 与 \[...\]
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, body) => placeholderFor(body, true))
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (match, body) => placeholderFor(body, true))

  // 3) 行内公式：$...$ 与 \(...\)
  //    排除 \$ 转义、行首/行尾空白、以及「$5 和 $10」这类金额写法
  text = text.replace(/(?<![\\$])\$(?![\s$])([^$\n]+?)(?<![\s\\])\$(?!\d)/g, (match, body) =>
    placeholderFor(body, false)
  )
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (match, body) => placeholderFor(body, false))

  // 4) 还原代码
  text = text.replace(/@@KATEXCODE(\d+)@@/g, (match, index) => codes[Number(index)] ?? '')
  text = text.replace(/@@KATEXFENCE(\d+)@@/g, (match, index) => fences[Number(index)] ?? '')

  return { text, formulas, placeholders }
}

function renderFormula(formula) {
  try {
    return katex.renderToString(formula.tex, {
      displayMode: formula.display,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      macros: MACROS
    })
  } catch (error) {
    hexo.log.warn('KaTeX 渲染失败：%s', error.message)
    return `<code class="katex-error">${formula.tex}</code>`
  }
}

function substitute(html, formulas) {
  if (!html || !formulas.length) return html

  // 独占一段的行间公式：把 <p>占位符</p> 整个换掉，避免出现 <p><div> 这种结构
  let output = html.replace(/<p>\s*@@KATEX(\d+)@@\s*<\/p>/g, (match, index) => {
    const formula = formulas[Number(index)]
    if (!formula) return match
    return formula.display
      ? `<div class="math-display">${renderFormula(formula)}</div>`
      : `<p>${renderFormula(formula)}</p>`
  })

  output = output.replace(/@@KATEX(\d+)@@/g, (match, index) => {
    const formula = formulas[Number(index)]
    return formula ? renderFormula(formula) : match
  })

  return output
}

/* KaTeX 样式与字体：直接从 node_modules 挂路由，不往 source/ 里拷文件 */
hexo.extend.generator.register('katex_assets', function () {
  const routes = []

  const cssFile = path.join(KATEX_DIST, 'katex.min.css')
  if (fs.existsSync(cssFile)) {
    routes.push({ path: 'katex/katex.min.css', data: () => fs.createReadStream(cssFile) })
  }

  if (fs.existsSync(FONT_DIR)) {
    for (const entry of fs.readdirSync(FONT_DIR, { withFileTypes: true })) {
      if (!entry.isFile() || !FONT_EXT.test(entry.name)) continue
      const file = path.join(FONT_DIR, entry.name)
      routes.push({ path: `katex/fonts/${entry.name}`, data: () => fs.createReadStream(file) })
    }
  }

  return routes
})

/* 优先级 1：必须排在 Hexo 内置的 backtick_code_block 之前，
   否则围栏代码块已经被转成 <figure class="highlight">，公式会被从代码块里挖出来 */
hexo.extend.filter.register(
  'before_post_render',
  function (data) {
    if (!data || typeof data.content !== 'string') return data
    if (!/\$|\\\(|\\\[/.test(data.content)) return data

    const { text, formulas } = protectMath(data.content)
    if (!formulas.length) return data

    data.content = text
    store.set(data.source || String(data.path || Math.random()), formulas)
    return data
  },
  1
)

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data) return data

  const key = data.source || String(data.path || '')
  const formulas = store.get(key)
  if (!formulas || !formulas.length) return data

  const count = formulas.length
  data.content = substitute(data.content, formulas)
  // 摘要 / more 也可能含公式（首页、归档、RSS 都会用到）
  if (data.excerpt) data.excerpt = substitute(data.excerpt, formulas)
  if (data.more) data.more = substitute(data.more, formulas)

  store.delete(key)
  hexo.log.debug('KaTeX: %d 个公式已渲染 (%s)', count, key)
  return data
})
