import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

/**
 * Captures one or multiple HTML elements and downloads a crisp, fully-styled multi-page A4 PDF.
 * When multiple targets (e.g. ['swim-pdf-export-a', 'swim-pdf-export-b']) are passed,
 * each target is guaranteed to start on its own distinct page in the PDF without awkward slicing!
 * Ensures identical font rendering across Windows, Android, iOS, and macOS.
 */
export async function generateAndDownloadPdf(
  targets: string | string[],
  filename: string = '競泳練習メニュー.pdf'
): Promise<boolean> {
  const targetIds = Array.isArray(targets) ? targets : [targets];

  // Resolve target DOM elements
  const elementsToCapture: HTMLElement[] = [];

  for (const id of targetIds) {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`Target element #${id} for PDF export not found.`);
      continue;
    }

    // If a single container ID was passed, check if it contains multiple marked pdf pages
    const subPages = el.querySelectorAll<HTMLElement>('.printable-pdf-page, [data-pdf-page="true"]');
    if (subPages.length > 1 && targetIds.length === 1) {
      subPages.forEach((subEl) => elementsToCapture.push(subEl));
    } else {
      elementsToCapture.push(el);
    }
  }

  if (elementsToCapture.length === 0) {
    console.error('No valid elements found for PDF export.');
    return false;
  }

  try {
    // 1. クロスプラットフォーム統一フォント（Noto Sans JP）のロード完了を確実に待機
    if (typeof document !== 'undefined' && 'fonts' in document) {
      try {
        await document.fonts.ready;
        await Promise.race([
          Promise.all([
            document.fonts.load('400 11px "Noto Sans JP"'),
            document.fonts.load('700 11px "Noto Sans JP"'),
            document.fonts.load('800 20px "Noto Sans JP"')
          ]),
          new Promise((resolve) => setTimeout(resolve, 800))
        ]);
      } catch (fontErr) {
        console.warn('Font loading check non-critical warning:', fontErr);
      }
    }

    // 2. Create jsPDF instance (A4 size: 210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const margin = 5; // 5mm margin
    const availableWidth = pdfWidth - (margin * 2); // 200mm
    const availableHeight = pdfHeight - (margin * 2); // 287mm

    let isFirstPdfPage = true;

    // 3. Render each element as a distinct page
    for (let index = 0; index < elementsToCapture.length; index++) {
      const element = elementsToCapture[index];

      // If this is a subsequent menu (e.g. Menu B), ALWAYS start on a new page!
      if (!isFirstPdfPage) {
        pdf.addPage();
      }
      isFirstPdfPage = false;

      // Measure element & indivisible blocks BEFORE capture for row-aware pagination
      const elementRect = element.getBoundingClientRect();
      const cssHeight = elementRect.height || element.scrollHeight || 1150;

      const avoidNodes = Array.from(
        element.querySelectorAll<HTMLElement>('[data-pdf-avoid-break="true"], tbody tr')
      );
      const uniqueAvoidSet = new Set<HTMLElement>(avoidNodes);
      const cssBlocks = Array.from(uniqueAvoidSet)
        .map((node) => {
          const r = node.getBoundingClientRect();
          return {
            top: r.top - elementRect.top,
            bottom: r.bottom - elementRect.top,
          };
        })
        .filter((b) => b.bottom > b.top)
        .sort((a, b) => a.top - b.top);

      const theadEl = element.querySelector<HTMLElement>('[data-pdf-thead="true"], thead');
      const tbodyEl = element.querySelector<HTMLElement>('[data-pdf-tbody="true"], tbody');
      const tableWrapperEl = element.querySelector<HTMLElement>('[data-pdf-table-wrapper="true"]');

      const theadRect = theadEl?.getBoundingClientRect();
      const tbodyRect = tbodyEl?.getBoundingClientRect();
      const tableWrapperRect = tableWrapperEl?.getBoundingClientRect();

      const cssTheadTop = theadRect ? theadRect.top - elementRect.top : 0;
      const cssTheadBottom = theadRect ? theadRect.bottom - elementRect.top : 0;
      const cssTbodyTop = tbodyRect ? tbodyRect.top - elementRect.top : 0;
      const cssTbodyBottom = tbodyRect ? tbodyRect.bottom - elementRect.top : 0;
      const cssTableLeft = tableWrapperRect ? tableWrapperRect.left - elementRect.left : 0;
      const cssTableWidth = tableWrapperRect ? tableWrapperRect.width : elementRect.width;

      // html2canvas でキャプチャ（800px固定・scale 2.5の高品質レンダリング）
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        windowHeight: element.scrollHeight || 1150,
        onclone: (clonedDoc) => {
          if (!clonedDoc.querySelector('link[href*="Noto+Sans+JP"]')) {
            const fontLink = clonedDoc.createElement('link');
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap';
            clonedDoc.head.appendChild(fontLink);
          }

          const styleOverride = clonedDoc.createElement('style');
          styleOverride.textContent = `
            * {
              -webkit-text-size-adjust: 100% !important;
              text-size-adjust: 100% !important;
            }
          `;
          clonedDoc.head.appendChild(styleOverride);

          // Force standard layout styles
          element.style.position = 'static';
          element.style.width = '800px';
          element.style.minWidth = '800px';
          element.style.maxWidth = '800px';
          element.style.boxSizing = 'border-box';
        }
      });

      const unscaledImgHeight = (canvas.height * availableWidth) / canvas.width;

      // Intelligent A4 Fit:
      // If the content height is slightly larger than A4 (within 10% threshold),
      // scale it subtly so it fits completely within a single, pristine A4 page
      // without leaving an accidental blank or 1-line spillover page!
      if (unscaledImgHeight <= availableHeight * 1.10) {
        const imgData = canvas.toDataURL('image/png');
        const fitScale = Math.min(1, availableHeight / unscaledImgHeight);
        const renderWidth = availableWidth * fitScale;
        const renderHeight = unscaledImgHeight * fitScale;
        const xOffset = margin + (availableWidth - renderWidth) / 2;
        const yOffset = margin;

        pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderWidth, renderHeight, undefined, 'FAST');
      } else {
        // Row-aware multi-page pagination: break strictly between table rows/blocks and repeat thead
        const scaleRatio = canvas.height / cssHeight;
        const maxPageCanvasHeight = Math.floor((availableHeight / availableWidth) * canvas.width);

        const blocks = cssBlocks.map((b) => ({
          top: Math.max(0, Math.floor(b.top * scaleRatio)),
          bottom: Math.min(canvas.height, Math.ceil(b.bottom * scaleRatio)),
        }));

        const theadTopPx = Math.max(0, Math.floor(cssTheadTop * scaleRatio));
        const theadBottomPx = Math.min(canvas.height, Math.ceil(cssTheadBottom * scaleRatio));
        const theadHeightPx = Math.max(0, theadBottomPx - theadTopPx);
        const tbodyTopPx = Math.max(0, Math.floor(cssTbodyTop * scaleRatio));
        const tbodyBottomPx = Math.min(canvas.height, Math.ceil(cssTbodyBottom * scaleRatio));
        const tableLeftPx = Math.max(0, Math.floor(cssTableLeft * scaleRatio));
        const tableWidthPx = Math.min(canvas.width - tableLeftPx, Math.ceil(cssTableWidth * scaleRatio));

        let pageStart = 0;
        let isFirstSliceOfMenu = true;

        while (pageStart < canvas.height) {
          const needsThead =
            theadHeightPx > 0 &&
            pageStart > tbodyTopPx + Math.ceil(4 * scaleRatio) &&
            pageStart < tbodyBottomPx - Math.ceil(4 * scaleRatio);

          const budgetPx = needsThead
            ? Math.max(Math.floor(maxPageCanvasHeight * 0.4), maxPageCanvasHeight - theadHeightPx)
            : maxPageCanvasHeight;

          const rawEnd = Math.min(canvas.height, pageStart + budgetPx);
          let pageEnd = rawEnd;

          if (rawEnd < canvas.height) {
            // Find the earliest indivisible block that straddles rawEnd
            const straddling = blocks.find((b) => b.top < rawEnd && b.bottom > rawEnd);
            if (straddling && straddling.top > pageStart + Math.ceil(8 * scaleRatio)) {
              pageEnd = straddling.top;
            }
          }

          // Safety guard against zero-progress infinite loops
          if (pageEnd <= pageStart) {
            pageEnd = rawEnd;
          }

          const sliceHeight = pageEnd - pageStart;
          const totalSliceHeight = (needsThead ? theadHeightPx : 0) + sliceHeight;

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = totalSliceHeight;
          const ctx = pageCanvas.getContext('2d');

          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

            let destY = 0;
            if (needsThead) {
              ctx.drawImage(
                canvas,
                0,
                theadTopPx,
                canvas.width,
                theadHeightPx,
                0,
                0,
                canvas.width,
                theadHeightPx
              );
              if (tableWidthPx > 0) {
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(tableLeftPx, 0, tableWidthPx, 2);
              }
              destY = theadHeightPx;
            }

            ctx.drawImage(
              canvas,
              0,
              pageStart,
              canvas.width,
              sliceHeight,
              0,
              destY,
              canvas.width,
              sliceHeight
            );

            // If this page ends mid-table, draw a clean closing horizontal rule at the table bottom
            const endsMidTable =
              tableWidthPx > 0 &&
              pageEnd > tbodyTopPx + Math.ceil(4 * scaleRatio) &&
              pageEnd < tbodyBottomPx - Math.ceil(4 * scaleRatio);
            if (endsMidTable) {
              ctx.fillStyle = '#cbd5e1';
              ctx.fillRect(tableLeftPx, totalSliceHeight - 2, tableWidthPx, 2);
            }
          }

          if (!isFirstSliceOfMenu) {
            pdf.addPage();
          }
          isFirstSliceOfMenu = false;

          const pageImgData = pageCanvas.toDataURL('image/png');
          const renderedPageHeightMm = (totalSliceHeight * availableWidth) / canvas.width;
          pdf.addImage(pageImgData, 'PNG', margin, margin, availableWidth, renderedPageHeightMm, undefined, 'FAST');

          pageStart = pageEnd;
        }
      }
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    return false;
  }
}

/**
 * Triggers native browser print dialog for crisp vector printing.
 */
export function triggerBrowserPrint(): void {
  window.print();
}


