/* 站点 PDF 预览：按需加载 pdf.js，逐页懒渲染；失败时回退到浏览器内嵌查看 */
(function () {
  'use strict'

  if (window.__pdfPreviewBooted) {
    if (typeof window.pdfPreviewScan === 'function') window.pdfPreviewScan()
    return
  }
  window.__pdfPreviewBooted = true

  var CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/'
  var pdfjsPromise = null

  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib)
    if (pdfjsPromise) return pdfjsPromise

    pdfjsPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script')
      script.src = CDN + 'pdf.min.js'
      script.async = true
      script.onload = function () {
        if (!window.pdfjsLib) {
          reject(new Error('pdf.js 未初始化'))
          return
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN + 'pdf.worker.min.js'
        resolve(window.pdfjsLib)
      }
      script.onerror = function () {
        reject(new Error('pdf.js 加载失败'))
      }
      document.head.appendChild(script)
    }).catch(function (error) {
      pdfjsPromise = null
      throw error
    })

    return pdfjsPromise
  }

  function setup(viewer) {
    if (!viewer || viewer.getAttribute('data-pdf-ready') === '1') return

    var url = viewer.getAttribute('data-pdf-src')
    var pagesWrap = viewer.querySelector('.pdf-preview__pages')
    if (!url || !pagesWrap) return
    viewer.setAttribute('data-pdf-ready', '1')

    var countLabel = viewer.querySelector('.pdf-preview__pages-count')
    var state = {
      zoom: 1,
      width: 0,
      doc: null,
      entries: [],
      observer: null,
      timer: null
    }

    function measure() {
      state.width = Math.max(pagesWrap.clientWidth || 0, 280)
    }

    function renderEntry(entry) {
      if (!entry.page) return
      if (entry.rendering) {
        entry.pending = true
        return
      }

      var pageWidth = entry.page.getViewport({ scale: 1 }).width
      var dpr = Math.min(window.devicePixelRatio || 1, 2)
      var viewport = entry.page.getViewport({ scale: (state.width * state.zoom * dpr) / pageWidth })

      entry.canvas.width = Math.max(1, Math.floor(viewport.width))
      entry.canvas.height = Math.max(1, Math.floor(viewport.height))
      entry.rendering = true

      entry.page
        .render({ canvasContext: entry.canvas.getContext('2d'), viewport: viewport })
        .promise.then(function () {
          entry.rendering = false
          entry.rendered = true
          entry.box.classList.add('is-rendered')
          if (entry.pending) {
            entry.pending = false
            renderEntry(entry)
          }
        })
        .catch(function () {
          entry.rendering = false
        })
    }

    function applyScale() {
      state.entries.forEach(function (entry) {
        entry.box.style.width = state.zoom * 100 + '%'
        if (entry.rendered) {
          entry.rendered = false
          renderEntry(entry)
        }
      })
    }

    function findEntry(node) {
      for (var i = 0; i < state.entries.length; i += 1) {
        if (state.entries[i].box === node) return state.entries[i]
      }
      return null
    }

    function observeAll() {
      if (!('IntersectionObserver' in window)) {
        state.entries.forEach(function (entry) {
          entry.visible = true
          renderEntry(entry)
        })
        return
      }

      state.observer = new IntersectionObserver(
        function (records) {
          records.forEach(function (record) {
            if (!record.isIntersecting) return
            var entry = findEntry(record.target)
            if (!entry) return
            entry.visible = true
            renderEntry(entry)
          })
        },
        { rootMargin: '600px 0px' }
      )

      state.entries.forEach(function (entry) {
        state.observer.observe(entry.box)
      })
    }

    function createPage(number) {
      var box = document.createElement('div')
      box.className = 'pdf-preview__page'
      box.style.width = state.zoom * 100 + '%'

      var canvas = document.createElement('canvas')
      box.appendChild(canvas)
      pagesWrap.appendChild(box)

      var entry = {
        number: number,
        box: box,
        canvas: canvas,
        page: null,
        rendered: false,
        rendering: false,
        pending: false,
        visible: false
      }
      state.entries.push(entry)

      state.doc
        .getPage(number)
        .then(function (page) {
          entry.page = page
          var viewport = page.getViewport({ scale: 1 })
          box.style.aspectRatio = viewport.width + ' / ' + viewport.height
          if (entry.visible) renderEntry(entry)
        })
        .catch(function () {})

      return entry
    }

    function fallback() {
      pagesWrap.innerHTML = ''
      var frame = document.createElement('iframe')
      frame.className = 'pdf-preview__frame'
      frame.src = url + '#view=FitH'
      frame.loading = 'lazy'
      frame.title = viewer.getAttribute('data-pdf-title') || 'PDF'
      pagesWrap.appendChild(frame)

      var tip = document.createElement('p')
      tip.className = 'pdf-preview__tip'
      tip.textContent = '若此处空白，说明浏览器不支持内嵌 PDF，请点右上角「新窗口」查看。'
      pagesWrap.appendChild(tip)
    }

    viewer.addEventListener('click', function (event) {
      var target = event.target
      var button = target && target.closest ? target.closest('[data-pdf-action]') : null
      if (!button) return
      event.preventDefault()

      var action = button.getAttribute('data-pdf-action')
      if (action === 'zoom-in') state.zoom = Math.min(2.5, state.zoom + 0.25)
      else if (action === 'zoom-out') state.zoom = Math.max(0.5, state.zoom - 0.25)
      else if (action === 'fit') state.zoom = 1
      else return

      applyScale()
    })

    window.addEventListener('resize', function () {
      clearTimeout(state.timer)
      state.timer = setTimeout(function () {
        measure()
        state.entries.forEach(function (entry) {
          if (entry.rendered && entry.visible) {
            entry.rendered = false
            renderEntry(entry)
          }
        })
      }, 250)
    })

    var placeholder = pagesWrap.querySelector('.pdf-preview__placeholder')
    if (placeholder) placeholder.parentNode.removeChild(placeholder)

    loadPdfJs()
      .then(function (pdfjsLib) {
        return pdfjsLib.getDocument({
          url: url,
          cMapUrl: CDN + 'cmaps/',
          cMapPacked: true
        }).promise
      })
      .then(function (doc) {
        state.doc = doc
        measure()
        if (countLabel) countLabel.textContent = '共 ' + doc.numPages + ' 页'
        for (var i = 1; i <= doc.numPages; i += 1) createPage(i)
        observeAll()
      })
      .catch(function () {
        if (countLabel) countLabel.textContent = '预览不可用'
        fallback()
      })
  }

  function scan(root) {
    var scope = root && root.querySelectorAll ? root : document
    var viewers = scope.querySelectorAll('.pdf-preview')
    Array.prototype.forEach.call(viewers, setup)
    if (scope.classList && scope.classList.contains('pdf-preview')) setup(scope)
  }

  window.pdfPreviewScan = scan

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      scan()
    })
  } else {
    scan()
  }

  // Butterfly 默认开启 Pjax，切页后需要重新扫描
  document.addEventListener('pjax:complete', function () {
    scan()
  })
  document.addEventListener('pjax:success', function () {
    scan()
  })
})()
