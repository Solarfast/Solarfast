const PAGE_FOOTER_HEIGHT = 42

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null
}

export function isPdfDebugMode() {
  return typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('pdfDebug') === '1'
}

export function createPdfLayoutLogger(reportName, enabled = isPdfDebugMode()) {
  if (!enabled) return undefined

  return (renderResult) => {
    const root = renderResult?._INTERNAL__LAYOUT__DATA_
    const pages = root?.children?.filter((node) => node.type === 'PAGE') || []

    if (!pages.length) {
      console.warn(`[${reportName} PDF layout] React-PDF returned no page layout data.`)
      return
    }

    pages.forEach((page, index) => {
      const pageWidth = page.box?.width || 595.28
      const pageHeight = page.box?.height || 841.89
      const safeBottom = pageHeight - PAGE_FOOTER_HEIGHT

      const walk = (node, parentX = 0, parentY = 0, fixedAncestor = false) => {
        const box = node.box
        const fixed = fixedAncestor || Boolean(node.props?.fixed)
        let absoluteX = parentX
        let absoluteY = parentY

        if (box && node.type !== 'PAGE') {
          absoluteX += Number(box.left) || 0
          absoluteY += Number(box.top) || 0
        }

        if (box && Number.isFinite(box.width) && Number.isFinite(box.height)) {
          const details = {
            page: index + 1,
            element: node.props?.debugName || node.props?.id || node.type,
            type: node.type,
            x: round(absoluteX),
            y: round(absoluteY),
            width: round(box.width),
            height: round(box.height),
            availableWidth: round(Math.max(0, pageWidth - absoluteX)),
            availableHeight: round(Math.max(0, safeBottom - absoluteY)),
          }

          console.info(`[${reportName} PDF layout]`, details)

          const outsidePage = absoluteX < -0.5 ||
            absoluteY < -0.5 ||
            absoluteX + box.width > pageWidth + 0.5 ||
            absoluteY + box.height > pageHeight + 0.5
          const overlapsFooterArea = !fixed &&
            node.type !== 'PAGE' &&
            absoluteY + box.height > safeBottom + 0.5

          if (outsidePage || overlapsFooterArea) {
            console.warn(`[${reportName} PDF overflow]`, details)
          }
        }

        node.children?.forEach((child) => walk(child, absoluteX, absoluteY, fixed))
      }

      walk(page)
    })
  }
}