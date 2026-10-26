/* global hexo */
'use strict'

/**
 * {% pdf <地址> [显示标题] %}
 *
 * 例如：
 *   {% pdf assets/如何用好Latex-workshop/LaTeX_Workshop_编译配置教程.pdf %}
 *   {% pdf assets/如何用好Latex-workshop/手册.pdf LaTeX Workshop 配置手册 %}
 *
 * 相对地址（assets/…）会被 scripts/post-assets.js 在 HTML 阶段改写成
 * /<文章永久链接>/assets/<文章名>/…，因此文章搬家、换目录都不用改。
 */

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

hexo.extend.tag.register('pdf', function (args) {
  const source = String(args[0] || '').trim()
  if (!source) {
    return '<p class="pdf-preview__error">[pdf] 缺少文件地址，用法：<code>{% pdf assets/文章名/文件.pdf %}</code></p>'
  }

  const title = args.slice(1).join(' ').trim() || source.split('/').pop()
  const href = escapeAttr(source)
  const label = escapeAttr(title)

  return [
    `<div class="pdf-preview" data-pdf-src="${href}" data-pdf-title="${label}">`,
    '  <div class="pdf-preview__toolbar">',
    `    <span class="pdf-preview__title">${label}</span>`,
    '    <span class="pdf-preview__pages-count">正在加载…</span>',
    '    <span class="pdf-preview__spacer"></span>',
    '    <button type="button" data-pdf-action="zoom-out" title="缩小">−</button>',
    '    <button type="button" data-pdf-action="zoom-in" title="放大">＋</button>',
    '    <button type="button" data-pdf-action="fit" title="适应宽度">适应宽度</button>',
    `    <a class="pdf-preview__link" href="${href}" target="_blank" rel="noopener">新窗口</a>`,
    `    <a class="pdf-preview__link" href="${href}" download>下载</a>`,
    '  </div>',
    '  <div class="pdf-preview__pages"><span class="pdf-preview__placeholder">PDF 预览加载中…</span></div>',
    '</div>'
  ].join('\n')
})
