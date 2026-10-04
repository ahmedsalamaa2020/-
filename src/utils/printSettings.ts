export type FontSizeOption = 'small' | 'medium' | 'large' | 'custom';
export type MarginOption = 'narrow' | 'normal' | 'wide' | 'custom';

export interface PrintSettings {
  fontSize: FontSizeOption;
  customFontSizePt: number;
  customFontScalePercent: number;
  marginWidth: MarginOption;
  customMarginTopMm: number;        // Dedicated top margin to prevent clipping at the top edge
  customMarginBottomMm: number;     // Dedicated bottom margin
  customMarginTopBottomMm: number;  // Fallback / legacy support
  customMarginLeftRightMm: number;
  customPaperWidthMm: number;
  customPaperHeightMm: number;
  showImages: boolean;
  // Watermark Settings
  showWatermark: boolean;           // Enable/disable watermark on contracts & documents
  watermarkText: string;            // Default: 'SHAKER MOTORS'
  watermarkOpacity: number;         // Watermark opacity percent (e.g. 8 for 8%)
}

export const PRINT_SETTINGS_STORAGE_KEY = 'autofleet_print_settings';

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  fontSize: 'custom',
  customFontSizePt: 9.5,
  customFontScalePercent: 100,
  marginWidth: 'custom',
  customMarginTopMm: 14,           // Default 14mm safe top margin (leaves ample clearance to prevent printer hardware clipping)
  customMarginBottomMm: 4,         // Default 4mm bottom margin
  customMarginTopBottomMm: 14,
  customMarginLeftRightMm: 6,
  customPaperWidthMm: 210,
  customPaperHeightMm: 297,
  showImages: true,
  showWatermark: true,             // Enabled by default with SHAKER MOTORS
  watermarkText: 'SHAKER MOTORS',
  watermarkOpacity: 8,             // 8% opacity for clean readable text and subtle watermark
};

export function getSavedPrintSettings(): PrintSettings {
  try {
    const saved = localStorage.getItem(PRINT_SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure top margin is at least 12-14mm to prevent top frame border clipping
      const rawTop = typeof parsed.customMarginTopMm === 'number' 
        ? parsed.customMarginTopMm 
        : (typeof parsed.customMarginTopBottomMm === 'number' ? parsed.customMarginTopBottomMm : 14);
      const topMargin = rawTop <= 8 ? 14 : rawTop;
      const bottomMargin = typeof parsed.customMarginBottomMm === 'number'
        ? parsed.customMarginBottomMm
        : (typeof parsed.customMarginTopBottomMm === 'number' ? parsed.customMarginTopBottomMm : 4);

      return {
        fontSize: parsed.fontSize || 'custom',
        customFontSizePt: typeof parsed.customFontSizePt === 'number' ? parsed.customFontSizePt : 9.5,
        customFontScalePercent: typeof parsed.customFontScalePercent === 'number' ? parsed.customFontScalePercent : 100,
        marginWidth: parsed.marginWidth || 'custom',
        customMarginTopMm: topMargin,
        customMarginBottomMm: bottomMargin,
        customMarginTopBottomMm: topMargin,
        customMarginLeftRightMm: typeof parsed.customMarginLeftRightMm === 'number' ? parsed.customMarginLeftRightMm : 6,
        customPaperWidthMm: typeof parsed.customPaperWidthMm === 'number' ? parsed.customPaperWidthMm : 210,
        customPaperHeightMm: typeof parsed.customPaperHeightMm === 'number' ? parsed.customPaperHeightMm : 297,
        showImages: typeof parsed.showImages === 'boolean' ? parsed.showImages : true,
        showWatermark: typeof parsed.showWatermark === 'boolean' ? parsed.showWatermark : true,
        watermarkText: parsed.watermarkText?.trim() ? parsed.watermarkText : 'SHAKER MOTORS',
        watermarkOpacity: typeof parsed.watermarkOpacity === 'number' ? parsed.watermarkOpacity : 8,
      };
    }
  } catch (e) {
    console.error('Error loading print settings from localStorage:', e);
  }
  return { ...DEFAULT_PRINT_SETTINGS };
}

export function savePrintSettings(settings: PrintSettings): void {
  try {
    localStorage.setItem(PRINT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    applyPrintSettingsToDOM(settings);
  } catch (e) {
    console.error('Error saving print settings to localStorage:', e);
  }
}

export function applyPrintSettingsToDOM(settings: PrintSettings): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  const fontPt = `${settings.customFontSizePt || 9.5}pt`;
  const fontPercent = `${settings.customFontScalePercent || 100}%`;
  const topMarginMm = settings.customMarginTopMm || 8;
  const bottomMarginMm = settings.customMarginBottomMm || 4;
  const sideMarginMm = settings.customMarginLeftRightMm || 6;

  const pageMargin = `${topMarginMm}mm ${sideMarginMm}mm ${bottomMarginMm}mm ${sideMarginMm}mm`;

  root.style.setProperty('--print-font-size', fontPt);
  root.style.setProperty('--print-font-scale', fontPercent);
  root.style.setProperty('--print-page-margin', pageMargin);
  root.style.setProperty('--print-top-margin', `${topMarginMm}mm`);
  root.style.setProperty('--print-bottom-margin', `${bottomMarginMm}mm`);
  root.style.setProperty('--print-side-margin', `${sideMarginMm}mm`);
  root.style.setProperty('--print-watermark-opacity', `${(settings.watermarkOpacity ?? 8) / 100}`);

  if (!settings.showImages) {
    document.body.classList.add('print-hide-images');
  } else {
    document.body.classList.remove('print-hide-images');
  }

  if (settings.showWatermark) {
    document.body.classList.add('print-show-watermark');
    document.body.classList.remove('print-hide-watermark');
  } else {
    document.body.classList.add('print-hide-watermark');
    document.body.classList.remove('print-show-watermark');
  }
}

// Convert font option to percentage scale number for style inline zoom/fontSize
export function getFontScalePercentage(fontSize: FontSizeOption | number): number {
  if (typeof fontSize === 'number') return fontSize;
  switch (fontSize) {
    case 'small':
      return 85;
    case 'large':
      return 115;
    case 'medium':
      return 100;
    default:
      return 100;
  }
}
