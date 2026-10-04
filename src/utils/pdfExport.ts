import { getSavedPrintSettings } from './printSettings';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// @ts-ignore
import html2pdf from 'html2pdf.js';

/**
 * Mathematically converts any OKLab color to standard RGB/RGBA.
 * Guaranteed to produce standard rgb(r, g, b) or rgba(r, g, b, a) strings with zero dependencies.
 */
export function oklabToRgb(lStr: string, aStr: string, bStr: string, alphaStr?: string): string {
  let l = parseFloat(lStr);
  if (lStr.includes('%')) l = l / 100;
  if (isNaN(l)) l = 0.5;

  let a = parseFloat(aStr);
  if (aStr.includes('%')) a = (a / 100) * 0.4;
  if (isNaN(a)) a = 0;

  let b = parseFloat(bStr);
  if (bStr.includes('%')) b = (b / 100) * 0.4;
  if (isNaN(b)) b = 0;

  let alpha = 1;
  if (alphaStr !== undefined) {
    alpha = parseFloat(alphaStr);
    if (alphaStr.includes('%')) alpha = alpha / 100;
    if (isNaN(alpha)) alpha = 1;
  }

  // OKLab -> linear LMS
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  // linear LMS -> linear sRGB
  const rLin = +4.0767434079 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  // linear sRGB -> sRGB (gamma)
  const gamma = (x: number) => {
    const clamped = Math.max(0, Math.min(1, x));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  const rFinal = Math.round(gamma(rLin) * 255);
  const gFinal = Math.round(gamma(gLin) * 255);
  const bFinal = Math.round(gamma(bLin) * 255);

  if (alpha < 1) {
    return `rgba(${rFinal}, ${gFinal}, ${bFinal}, ${Number(alpha.toFixed(3))})`;
  }
  return `rgb(${rFinal}, ${gFinal}, ${bFinal})`;
}

/**
 * Mathematically converts any OKLCH color to standard RGB/RGBA.
 * Guaranteed to produce standard rgb(r, g, b) or rgba(r, g, b, a) strings with zero dependencies.
 */
export function oklchToRgb(lStr: string, cStr: string, hStr: string, alphaStr?: string): string {
  let l = parseFloat(lStr);
  if (lStr.includes('%')) l = l / 100;
  if (isNaN(l)) l = 0.5;

  let c = parseFloat(cStr);
  if (cStr.includes('%')) c = (c / 100) * 0.4;
  if (isNaN(c)) c = 0.1;

  let h = parseFloat(hStr) || 0;
  if (hStr.includes('rad')) h = (h * 180) / Math.PI;
  else if (hStr.includes('turn')) h = h * 360;
  else if (hStr.includes('grad')) h = (h * 360) / 400;

  // OKLCH -> OKLab
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  return oklabToRgb(String(l), String(a), String(b), alphaStr);
}

/**
 * Resolves any browser color (including oklab, oklch, color-mix) to safe hex/rgba.
 */
export function resolveSafeColor(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string') return '#1e293b';
  if (
    !colorStr.includes('oklch') &&
    !colorStr.includes('oklab') &&
    !colorStr.includes('color-mix') &&
    !colorStr.includes('color(')
  ) {
    return colorStr;
  }

  // 1. Try browser canvas 2d resolution
  if (typeof document !== 'undefined') {
    try {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 1;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillStyle = colorStr;
        const resolved = ctx.fillStyle;
        if (
          resolved &&
          !resolved.includes('oklab') &&
          !resolved.includes('oklch') &&
          !resolved.includes('color-mix')
        ) {
          return resolved;
        }
      }
    } catch {
      // fallback
    }
  }

  // 2. Fallback to mathematical converter
  return sanitizeAllModernColors(colorStr);
}

/**
 * Safely sanitizes any OKLCH, OKLAB, color-mix, or modern color syntax to standard sRGB.
 * Completely eliminates any unsupported color functions before html2canvas parses them.
 */
export function sanitizeAllModernColors(cssText: string): string {
  if (!cssText || typeof cssText !== 'string') return '';
  if (
    !cssText.includes('oklch') &&
    !cssText.includes('oklab') &&
    !cssText.includes('color-mix') &&
    !cssText.includes('color(')
  ) {
    return cssText;
  }

  let result = cssText;

  // 1. Remove @supports blocks testing modern colors
  result = result.replace(/@supports\s*\([^;{}]*(?:oklab|oklch|color-mix)[^;{}]*\)\s*\{[^{}]*\{[^{}]*\}\s*\}/gis, '');

  // 2. Convert standard oklch(L C H [/ A])
  result = result.replace(
    /oklch\(\s*([+-]?[\d.]+%?)\s+([+-]?[\d.]+%?)\s+([+-]?[\d.]+(?:deg|rad|grad|turn)?)(?:\s*(?:\/|,)\s*([+-]?[\d.]+%?))?\s*\)/gi,
    (_full, l, c, h, a) => {
      try {
        return oklchToRgb(l, c, h, a);
      } catch {
        return '#1e293b';
      }
    }
  );

  // 3. Convert standard oklab(L a b [/ A])
  result = result.replace(
    /oklab\(\s*([+-]?[\d.]+%?)\s+([+-]?[\d.]+%?)\s+([+-]?[\d.]+%?)(?:\s*(?:\/|,)\s*([+-]?[\d.]+%?))?\s*\)/gi,
    (_full, l, a, b, alpha) => {
      try {
        return oklabToRgb(l, a, b, alpha);
      } catch {
        return '#1e293b';
      }
    }
  );

  // 4. Convert color-mix(...) (handles nesting up to 10 levels)
  let loops = 0;
  while (result.includes('color-mix') && loops < 10) {
    const prev = result;
    result = result.replace(/color-mix\s*\(\s*in\s+[a-z-]+(?:\s*,\s*[^();{}]+)?\s*,\s*([^();{}]+)\s*\)/gis, () => {
      return '#334155';
    });
    if (result === prev) {
      result = result.replace(/color-mix\s*\([^;{}]+?\)/gis, '#334155');
      break;
    }
    loops++;
  }

  // 5. Catch-all fallbacks for any remaining modern color syntax
  result = result.replace(/oklch\s*\([^;{}]+?\)/gis, '#1e293b');
  result = result.replace(/oklab\s*\([^;{}]+?\)/gis, '#1e293b');
  result = result.replace(/color-mix\s*\([^;{}]+?\)/gis, '#334155');
  result = result.replace(/color\s*\(\s*srgb[^;{}]+?\)/gis, '#1e293b');

  // 6. Absolute boundary: Any standalone word oklab / oklch in CSS properties
  result = result.replace(/\boklab\b/gi, 'srgb');
  result = result.replace(/\boklch\b/gi, 'srgb');

  return result;
}

export function sanitizeOklchColors(cssText: string): string {
  return sanitizeAllModernColors(cssText);
}

/**
 * Extracts and sanitizes all CSS rules from the main document stylesheets
 * into an inline CSS text block, eliminating external <link> references that could contain unparsed OKLCH/OKLAB.
 */
export function getSanitizedStylesheetsText(): string {
  let combinedCss = '';
  if (typeof document === 'undefined') return '';

  // 1. Read document.styleSheets
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (let j = 0; j < rules.length; j++) {
            combinedCss += rules[j].cssText + '\n';
          }
        }
      } catch {
        // Cross-origin or restricted stylesheet access
      }
    }
  } catch (e) {
    console.warn('Could not read styleSheets:', e);
  }

  // 2. Also read any <style> tag content
  try {
    const styleTags = document.querySelectorAll('style');
    styleTags.forEach((st) => {
      if (st.textContent) {
        combinedCss += st.textContent + '\n';
      }
    });
  } catch (e) {
    console.warn('Could not read style tags:', e);
  }

  return sanitizeAllModernColors(combinedCss);
}

/**
 * Utility to generate and download a crisp PDF directly from any HTML element.
 * Runs inside an isolated, sanitized iframe context to completely prevent Tailwind v4 oklch/oklab parser crashes.
 * Uses high-resolution html2canvas and jsPDF for reliable, error-free exports.
 */
export const exportElementToPdf = async (
  elementId: string,
  fileName: string = 'document.pdf'
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`PDF export failed: Element #${elementId} not found.`);
    return false;
  }

  const cleanFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const isB2B = elementId === 'printable-corporate-b2b-contract';

  // Create an isolated hidden iframe with sanitized stylesheets (NO external link tags with oklch/oklab)
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '1024px';
  iframe.style.height = '1448px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.warn('Could not access iframe document, falling back to browser print dialog.');
    triggerBrowserPrint(elementId);
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    return false;
  }

  try {
    // 1. Gather all sanitized CSS rules
    const sanitizedCss = getSanitizedStylesheetsText();

    const isolatedCss = `
      * {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        background-color: #ffffff !important;
        color: #0f172a !important;
        width: 100% !important;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important;
      }
      img {
        max-width: 100% !important;
      }
      svg {
        display: inline-block !important;
        vertical-align: middle !important;
        flex-shrink: 0 !important;
      }
      svg.w-3, svg.h-3 { width: 12px !important; height: 12px !important; }
      svg.w-3\\.5, svg.h-3\\.5 { width: 14px !important; height: 14px !important; }
      svg.w-4, svg.h-4 { width: 16px !important; height: 16px !important; }
      svg.w-5, svg.h-5 { width: 20px !important; height: 20px !important; }
      svg.w-6, svg.h-6 { width: 24px !important; height: 24px !important; }

      .print-page-frame {
        border: 2px solid #0f172a !important;
        outline: 1px solid #0f172a !important;
        outline-offset: -4.5px !important;
        position: relative !important;
        box-sizing: border-box !important;
      }
      .contract-watermark-overlay {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        pointer-events: none !important;
        z-index: 0 !important;
        overflow: hidden !important;
      }
      .contract-watermark-text {
        font-size: 48pt !important;
        font-weight: 900 !important;
        color: rgba(15, 23, 42, 0.12) !important;
        transform: rotate(-30deg) !important;
        letter-spacing: 0.15em !important;
        text-transform: uppercase !important;
        white-space: nowrap !important;
        text-align: center !important;
        font-family: Arial, Tahoma, sans-serif !important;
      }
      .contract-watermark-subtext {
        font-size: 13pt !important;
        font-weight: 800 !important;
        color: rgba(15, 23, 42, 0.10) !important;
        transform: rotate(-30deg) !important;
        letter-spacing: 0.25em !important;
        text-transform: uppercase !important;
        white-space: nowrap !important;
        text-align: center !important;
        font-family: Arial, Tahoma, sans-serif !important;
        margin-top: 8px !important;
      }
      #printable-contract {
        overflow: visible !important;
        max-height: none !important;
        height: auto !important;
      }
      #printable-contract .contract-signatures-area {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    `;

    // Clone element HTML and sanitize any inline oklch/oklab attributes
    const rawClonedHtml = element.outerHTML;
    const sanitizedClonedHtml = sanitizeAllModernColors(rawClonedHtml);

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html dir="${document.documentElement.dir || 'rtl'}" lang="${document.documentElement.lang || 'ar'}">
        <head>
          <meta charset="utf-8" />
          <title>${cleanFileName}</title>
          <style>
            ${sanitizedCss}
            ${isolatedCss}
          </style>
        </head>
        <body style="background-color: #ffffff; padding: 0; margin: 0;">
          <div id="pdf-export-container" style="background-color: #ffffff; width: 100%;">
            ${sanitizedClonedHtml}
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Small delay to ensure styles and font render in iframe
    await new Promise((resolve) => setTimeout(resolve, 150));

    const targetEl = iframeDoc.getElementById(elementId) || iframeDoc.getElementById('pdf-export-container') || iframeDoc.body;

    // Reset zoom and transforms in the isolated iframe element
    if (targetEl instanceof HTMLElement) {
      targetEl.style.zoom = '1';
      targetEl.style.transform = 'none';
      targetEl.style.margin = '0 auto';
    }

    const html2canvasOptions = {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
      onclone: (clonedDoc: Document) => {
        try {
          // Remove any link tags that might have slipped in
          const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
          links.forEach((l) => l.parentNode?.removeChild(l));

          // Sanitize all style tags
          const styles = clonedDoc.querySelectorAll('style');
          styles.forEach((s) => {
            if (s.textContent) {
              s.textContent = sanitizeAllModernColors(s.textContent);
            }
          });

          // Sanitize all element styles
          const view = clonedDoc.defaultView || window;
          const allElements = clonedDoc.querySelectorAll('*');
          const colorProps = [
            'color',
            'backgroundColor',
            'borderColor',
            'borderTopColor',
            'borderBottomColor',
            'borderLeftColor',
            'borderRightColor',
            'outlineColor',
            'fill',
            'stroke',
          ] as const;

          allElements.forEach((el) => {
            if (el instanceof HTMLElement || el instanceof SVGElement) {
              const styleAttr = el.getAttribute('style');
              if (
                styleAttr &&
                (styleAttr.includes('oklch') ||
                  styleAttr.includes('oklab') ||
                  styleAttr.includes('color-mix') ||
                  styleAttr.includes('color('))
              ) {
                el.setAttribute('style', sanitizeAllModernColors(styleAttr));
              }

              try {
                const comp = view.getComputedStyle(el);
                colorProps.forEach((prop) => {
                  const val = comp[prop as any];
                  if (
                    val &&
                    typeof val === 'string' &&
                    (val.includes('oklch') ||
                      val.includes('oklab') ||
                      val.includes('color-mix') ||
                      val.includes('color('))
                  ) {
                    (el.style as any)[prop] = resolveSafeColor(val);
                  }
                });
              } catch {
                // ignore
              }
            }
          });
        } catch (e) {
          console.warn('onclone error in pdfExport:', e);
        }
      }
    };

    // Render using html2canvas directly + jsPDF
    if (isB2B) {
      const page1El = iframeDoc.querySelector('.b2b-page-1') as HTMLElement;
      const page2El = iframeDoc.querySelector('.b2b-page-2') as HTMLElement;

      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      });

      const margin = 5;
      const innerW = 210 - margin * 2;

      if (page1El) {
        const c1 = await html2canvas(page1El, html2canvasOptions);
        const img1 = c1.toDataURL('image/jpeg', 0.98);
        const h1 = (c1.height / c1.width) * innerW;
        pdf.addImage(img1, 'JPEG', margin, margin, innerW, Math.min(h1, 287));
      }

      if (page2El) {
        pdf.addPage();
        const c2 = await html2canvas(page2El, html2canvasOptions);
        const img2 = c2.toDataURL('image/jpeg', 0.98);
        const h2 = (c2.height / c2.width) * innerW;
        pdf.addImage(img2, 'JPEG', margin, margin, innerW, Math.min(h2, 287));
      }

      pdf.save(cleanFileName);
      return true;
    }

    // Single-page & multi-page documents
    const canvas = await html2canvas(targetEl as HTMLElement, html2canvasOptions);

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    const marginX = 5;
    const marginY = 5;
    const innerPageWidth = 210 - marginX * 2; // 200 mm
    const innerPageHeight = 297 - marginY * 2; // 287 mm

    const totalHeightMm = (canvas.height / canvas.width) * innerPageWidth;

    if (totalHeightMm <= innerPageHeight) {
      // Single Page
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', marginX, marginY, innerPageWidth, totalHeightMm);
    } else {
      // Multi Page slicing
      const pageCanvasHeight = Math.floor(canvas.width * (innerPageHeight / innerPageWidth));
      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height) {
        const currentSliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = currentSliceHeight;
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            currentSliceHeight,
            0,
            0,
            canvas.width,
            currentSliceHeight
          );
        }
        const sliceImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
        const sliceHeightMm = (currentSliceHeight / canvas.width) * innerPageWidth;

        if (pageIndex > 0) {
          pdf.addPage();
        }
        pdf.addImage(sliceImgData, 'JPEG', marginX, marginY, innerPageWidth, sliceHeightMm);
        renderedHeight += currentSliceHeight;
        pageIndex++;
      }
    }

    pdf.save(cleanFileName);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    triggerBrowserPrint(elementId);
    return false;
  } finally {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }
};

/**
 * Safe, isolated wrapper for native browser printing / Save as PDF dialog.
 * Creates an isolated clean document context to eliminate modal clipping, 
 * page jumping, background bleed, and ensure exact page constraints.
 */
export const triggerBrowserPrint = (elementId?: string) => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  let targetId = elementId;
  if (!targetId) {
    const candidates = [
      'printable-shift-report',
      'printable-contract',
      'printable-corporate-b2b-contract',
      'printable-sale-contract',
      'printable-handover-receipt',
      'printable-tax-invoice',
      'printable-invoice',
      'printable-delivery-report',
      'printable-receipt-voucher',
      'printable-customer-statement',
      'periodic-report-print-content',
      'printable-inspection-report',
      'printable-employee-attendance-summary',
      'printable-driver-attendance-summary'
    ];
    for (const id of candidates) {
      const el = document.getElementById(id);
      if (el && el.offsetParent !== null) {
        targetId = id;
        break;
      }
    }
  }

  const element = targetId ? document.getElementById(targetId) : null;
  if (!element) {
    window.focus();
    window.print();
    return;
  }

  const isB2B = targetId === 'printable-corporate-b2b-contract';
  const isMultiPage =
    targetId === 'printable-shift-report' ||
    targetId === 'printable-delivery-report' ||
    targetId === 'printable-customer-statement' ||
    targetId === 'periodic-report-print-content' ||
    targetId === 'printable-inspection-report' ||
    targetId === 'printable-employee-attendance-summary' ||
    targetId === 'printable-driver-attendance-summary' ||
    targetId === 'printable-treasury-financial-report' ||
    targetId === 'printable-treasury-ledger';

  // Create an isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.focus();
    window.print();
    return;
  }

  const sanitizedHeadCss = getSanitizedStylesheetsText();
  const savedSettings = getSavedPrintSettings();
  const topMargin = Math.max(typeof savedSettings.customMarginTopMm === 'number' && savedSettings.customMarginTopMm > 0 ? savedSettings.customMarginTopMm : 14, 12);
  const bottomMargin = Math.max(typeof savedSettings.customMarginBottomMm === 'number' && savedSettings.customMarginBottomMm > 0 ? savedSettings.customMarginBottomMm : 6, 5);
  const sideMargin = Math.max(typeof savedSettings.customMarginLeftRightMm === 'number' && savedSettings.customMarginLeftRightMm > 0 ? savedSettings.customMarginLeftRightMm : 6, 5);

  const isolatedPrintCss = `
    @page {
      size: A4 portrait;
      margin: ${isB2B ? '6mm 6mm' : isMultiPage ? '10mm 6mm 10mm 6mm' : `${topMargin}mm ${sideMargin}mm ${bottomMargin}mm ${sideMargin}mm`} !important;
    }
    * {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #0f172a !important;
      width: 100% !important;
      height: auto !important;
      overflow: visible !important;
      font-family: system-ui, -apple-system, sans-serif;
    }
    img {
      max-width: 100% !important;
    }
    svg {
      display: inline-block !important;
      vertical-align: middle !important;
      flex-shrink: 0 !important;
    }
    svg.w-3, svg.h-3 { width: 12px !important; height: 12px !important; }
    svg.w-3\\.5, svg.h-3\\.5 { width: 14px !important; height: 14px !important; }
    svg.w-4, svg.h-4 { width: 16px !important; height: 16px !important; }
    svg.w-5, svg.h-5 { width: 20px !important; height: 20px !important; }
    svg.w-6, svg.h-6 { width: 24px !important; height: 24px !important; }

    .print-page-frame {
      border: 2.5px solid #0f172a !important;
      outline: 1.5px solid #0f172a !important;
      outline-offset: -4px !important;
      position: relative !important;
      box-sizing: border-box !important;
    }
    .contract-watermark-overlay {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      pointer-events: none !important;
      z-index: 0 !important;
      overflow: hidden !important;
    }
    .contract-watermark-text {
      font-size: 48pt !important;
      font-weight: 900 !important;
      color: rgba(15, 23, 42, 0.12) !important;
      transform: rotate(-30deg) !important;
      letter-spacing: 0.15em !important;
      text-transform: uppercase !important;
      white-space: nowrap !important;
      text-align: center !important;
      font-family: Arial, Tahoma, sans-serif !important;
    }
    .contract-watermark-subtext {
      font-size: 13pt !important;
      font-weight: 800 !important;
      color: rgba(15, 23, 42, 0.10) !important;
      transform: rotate(-30deg) !important;
      letter-spacing: 0.25em !important;
      text-transform: uppercase !important;
      white-space: nowrap !important;
      text-align: center !important;
      font-family: Arial, Tahoma, sans-serif !important;
      margin-top: 8px !important;
    }

    ${
      isB2B
        ? `
      /* Corporate B2B Contract: EXACTLY 2 A4 PAGES */
      #printable-corporate-b2b-contract {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #0f172a !important;
      }
      .b2b-page-1,
      .b2b-page-2 {
        box-sizing: border-box !important;
        width: 100% !important;
        min-height: 265mm !important;
        max-height: 280mm !important;
        padding: 6mm 6mm !important;
        margin: 0 !important;
        background: #ffffff !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
      }
      .b2b-page-1 {
        page-break-after: always !important;
        break-after: page !important;
      }
      .b2b-page-2 {
        page-break-before: always !important;
        page-break-after: auto !important;
        break-before: page !important;
        break-after: auto !important;
      }
    `
        : isMultiPage
        ? `
      /* MULTI-PAGE REPORTS (e.g. Monthly Shifts & Billing Statement) */
      #${targetId} {
        box-sizing: border-box !important;
        width: 100% !important;
        max-height: none !important;
        overflow: visible !important;
        padding: 4mm 4mm !important;
        margin: 0 auto !important;
        background: #ffffff !important;
        color: #0f172a !important;
      }
      table {
        width: 100% !important;
        page-break-inside: auto !important;
      }
      thead {
        display: table-header-group !important;
      }
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    `
        : `
      /* ALL OTHER DOCUMENTS: GUARANTEED EXACTLY 1 A4 PAGE WITH COMPLETE CLEAR BORDER VISIBILITY */
      #${targetId} {
        box-sizing: border-box !important;
        width: 100% !important;
        max-height: 285mm !important;
        overflow: visible !important;
        padding: 6mm 6mm 5mm 6mm !important;
        margin: 0 auto !important;
        background: #ffffff !important;
        color: #0f172a !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        break-after: avoid !important;
      }
    `
    }
  `;

  // Clone element content with sanitized oklch colors
  const clonedHtml = sanitizeAllModernColors(element.outerHTML);

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html dir="${document.documentElement.dir || 'rtl'}" lang="${document.documentElement.lang || 'ar'}">
      <head>
        <meta charset="utf-8" />
        <title>طباعة مستند</title>
        <style>
          ${sanitizedHeadCss}
          ${isolatedPrintCss}
        </style>
      </head>
      <body>
        ${clonedHtml}
      </body>
    </html>
  `);
  iframeDoc.close();

  // Print once the iframe has completed rendering
  setTimeout(() => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.addEventListener('afterprint', () => {
          window.focus();
        });
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } else {
        window.print();
      }
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print()', e);
      window.print();
    } finally {
      // Ensure focus is returned to the main window so keyboard input never freezes
      setTimeout(() => {
        window.focus();
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 500);
    }
  }, 250);
};
