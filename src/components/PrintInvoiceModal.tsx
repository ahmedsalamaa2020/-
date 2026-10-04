import React, { useState, useEffect } from 'react';
import { X, Printer, Receipt, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Download, Settings } from 'lucide-react';
import { AppSettings, Language } from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { exportElementToPdf, triggerBrowserPrint } from '../utils/pdfExport';
import { PrintSettingsModal } from './PrintSettingsModal';
import { getSavedPrintSettings, applyPrintSettingsToDOM, getFontScalePercentage } from '../utils/printSettings';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: {
    invoiceNumber: string;
    date: string;
    type: 'rental' | 'sale' | 'delivery';
    customerName: string;
    customerPhone: string;
    itemName: string;
    itemDetails?: string;
    amount: number;
    taxAmount?: number;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    notes?: string;
  } | null;
  settings: AppSettings;
  lang: Language;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceData,
  settings,
  lang,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [fontScale, setFontScale] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const printSettings = getSavedPrintSettings();
      applyPrintSettingsToDOM(printSettings);
      setFontScale(getFontScalePercentage(printSettings.fontSize));
    }
  }, [isOpen]);

  if (!isOpen || !invoiceData) return null;
  const t = translations[lang];

  const handlePrint = () => {
    triggerBrowserPrint('printable-invoice');
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    await exportElementToPdf('printable-invoice', `Receipt-${invoiceData.invoiceNumber}.pdf`);
    setIsExportingPdf(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 60));
  const handleZoomReset = () => setZoom(100);

  return (
    <div className={`fixed inset-0 z-50 flex justify-center items-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-transparent print:overflow-visible print:h-auto print:block print:inset-auto ${isFullscreen ? 'p-0' : ''}`}>
      <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full border border-slate-200 dark:border-slate-800 flex flex-col h-[94vh] max-h-[94vh] overflow-hidden transition-all duration-200 print:max-h-none print:h-auto print:overflow-visible print:shadow-none print:border-none print:my-0 print:w-full print:max-w-none print:rounded-none ${
        isFullscreen ? 'max-w-none h-screen max-h-screen rounded-none my-0' : 'max-w-3xl my-auto'
      }`}>
        {/* Controls Header - Always fixed at top */}
        <div className="flex-none print:hidden flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b border-slate-800 bg-slate-900 text-white rounded-t-2xl shadow-md z-30">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-xs sm:text-base tracking-wide">
              {t.printableReceipt} - {invoiceData.invoiceNumber}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Font & Input Size Scale Selector */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
              <span className="text-[11px] text-slate-400 font-bold px-1.5">
                {lang === 'ar' ? 'حجم الخط:' : 'Font Size:'}
              </span>
              <button
                type="button"
                onClick={() => setFontScale(85)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                  fontScale === 85 ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {lang === 'ar' ? 'صغير' : 'Small'} (85%)
              </button>
              <button
                type="button"
                onClick={() => setFontScale(100)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                  fontScale === 100 ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {lang === 'ar' ? 'عادي' : 'Normal'} (100%)
              </button>
              <button
                type="button"
                onClick={() => setFontScale(115)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                  fontScale === 115 ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {lang === 'ar' ? 'كبير' : 'Large'} (115%)
              </button>
            </div>

            {/* Print Scale Presets & Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
              <span className="text-[11px] text-slate-400 font-bold px-1.5">
                {lang === 'ar' ? 'حجم الطباعة:' : 'Print Scale:'}
              </span>
              <button
                type="button"
                onClick={() => setZoom(75)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                  zoom === 75 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => setZoom(85)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                  zoom === 85 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                85%
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                  zoom === 100 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setZoom(115)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                  zoom === 115 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                115%
              </button>
            </div>

            {/* Fine Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={handleZoomOut}
                title={lang === 'ar' ? 'تصغير' : 'Zoom Out'}
                className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomReset}
                title={lang === 'ar' ? 'إعادة ضبط الحجم' : 'Reset Scale'}
                className="px-2 py-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-mono font-bold text-[11px] transition flex items-center gap-1"
              >
                <span>{zoom}%</span>
                <RotateCcw className="w-2.5 h-2.5 opacity-60" />
              </button>
              <button
                onClick={handleZoomIn}
                title={lang === 'ar' ? 'تكبير' : 'Zoom In'}
                className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? (lang === 'ar' ? 'تصغير النافذة' : 'Exit Fullscreen') : (lang === 'ar' ? 'ملء الشاشة' : 'Fullscreen')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Print Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              title={lang === 'ar' ? 'إعدادات الطباعة' : 'Print Settings'}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 transition"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'إعدادات الطباعة' : 'Print Settings'}</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition disabled:opacity-50"
              title={lang === 'ar' ? 'تنزيل كملف PDF مباشر' : 'Download direct PDF file'}
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? (lang === 'ar' ? 'جاري التحميل...' : 'Exporting...') : (lang === 'ar' ? 'تنزيل PDF' : 'Download PDF')}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>{t.print}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Invoice View Area */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-3 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
          <div
            id="printable-invoice"
            style={{
              zoom: zoom / 100,
              fontSize: `${fontScale}%`,
            }}
            className="p-6 sm:p-8 bg-white text-slate-900 text-sm font-sans rounded-xl shadow-lg border border-slate-200 max-w-2xl mx-auto transition-all duration-150 print:p-0 print:overflow-visible print:h-auto print:max-h-none print:block print:w-full print:border-none print:shadow-none print:rounded-none"
          >
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b border-slate-200 print:break-inside-avoid">
            <div>
              <h2 className="text-xl font-black text-slate-900">{settings.organizationName || settings.appName}</h2>
              <p className="text-xs text-slate-500">{settings.address}</p>
              <p className="text-xs text-slate-500">{t.phone}: {settings.contactPhone}</p>
              <p className="text-xs text-slate-500">
                {lang === 'ar' ? 'السجل التجاري' : 'C.R.'}: {settings.commercialRegistration || '-'} | {lang === 'ar' ? 'الرقم الضريبي' : 'VAT ID'}: {settings.taxId}
              </p>
            </div>
            <div className="text-left rtl:text-right">
              <span className="inline-block px-3 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded uppercase mb-1">
                {t.printableReceipt}
              </span>
              <p className="font-black text-slate-900 text-sm">{invoiceData.invoiceNumber}</p>
              <p className="text-xs text-slate-500">{invoiceData.date}</p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="my-6 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">{t.customerName}</p>
              <p className="font-extrabold text-slate-900 text-base">{invoiceData.customerName}</p>
              <p className="text-xs text-slate-600">{invoiceData.customerPhone}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">{t.paymentMethod}</p>
              <p className="font-bold text-slate-800">{invoiceData.paymentMethod.toUpperCase()}</p>
              <p className="text-xs text-emerald-600 font-extrabold">{t.status}: {invoiceData.paymentStatus.toUpperCase()}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left rtl:text-right border-collapse mb-6">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-700 text-xs font-bold uppercase">
                <th className="py-2 px-1">{lang === 'ar' ? 'البيان / الخدمة' : 'Description'}</th>
                <th className="py-2 px-1 text-center">{lang === 'ar' ? 'التفاصيل' : 'Details'}</th>
                <th className="py-2 px-1 text-right rtl:text-left">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200 text-sm">
                <td className="py-3 px-1 font-bold text-slate-900">{invoiceData.itemName}</td>
                <td className="py-3 px-1 text-center text-xs text-slate-600">{invoiceData.itemDetails || '-'}</td>
                <td className="py-3 px-1 text-right rtl:text-left font-black">{formatCurrency(invoiceData.amount, settings.currency, lang)}</td>
              </tr>
            </tbody>
          </table>

          {/* Financial Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2 border-t border-slate-300 pt-3 text-right rtl:text-left">
              <div className="flex justify-between text-xs text-slate-600">
                <span>{lang === 'ar' ? 'المبلغ الفرعي' : 'Subtotal'}:</span>
                <span className="font-semibold">{formatCurrency(invoiceData.amount, settings.currency, lang)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-900">
                <span>{t.totalAmount}:</span>
                <span className="text-emerald-700">{formatCurrency(invoiceData.totalAmount, settings.currency, lang)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-700">{lang === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you for your business!'}</p>
            <p className="mt-0.5">{settings.organizationName} - {settings.contactPhone}</p>
          </div>
        </div>
      </div>
    </div>

    <PrintSettingsModal
      isOpen={isSettingsOpen}
      onClose={() => setIsSettingsOpen(false)}
      lang={lang}
      onSettingsChanged={(newSettings) => {
        setFontScale(getFontScalePercentage(newSettings.fontSize));
      }}
    />
  </div>
);
};
