import React, { useState, useEffect } from 'react';
import { X, Printer, FileText, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, ShieldCheck, Car, User, Building2, Scale, Eye, CheckCircle2, Download, Settings, Sparkles } from 'lucide-react';
import { AppSettings, CarSale, Currency, Language } from '../types';
import { formatCurrency, translations } from '../translations/i18n';
import { exportElementToPdf, triggerBrowserPrint } from '../utils/pdfExport';
import { exportSaleContractToWord } from '../utils/wordExport';
import { PrintSettingsModal } from './PrintSettingsModal';
import { getSavedPrintSettings, savePrintSettings, applyPrintSettingsToDOM, getFontScalePercentage } from '../utils/printSettings';

interface PrintSaleContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: CarSale | null;
  settings: AppSettings;
  currency: Currency;
  lang: Language;
}

export const PrintSaleContractModal: React.FC<PrintSaleContractModalProps> = ({
  isOpen,
  onClose,
  sale,
  settings,
  currency,
  lang,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [fontScale, setFontScale] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [activeTemplate, setActiveTemplate] = useState<'preliminary' | 'final'>('preliminary');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('SHAKER MOTORS');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(8);

  useEffect(() => {
    if (isOpen) {
      const printSettings = getSavedPrintSettings();
      applyPrintSettingsToDOM(printSettings);
      setFontScale(getFontScalePercentage(printSettings.fontSize));
      setShowWatermark(printSettings.showWatermark ?? true);
      setWatermarkText(printSettings.watermarkText || 'SHAKER MOTORS');
      setWatermarkOpacity(printSettings.watermarkOpacity ?? 8);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (sale?.contractType) {
      setActiveTemplate(sale.contractType);
    } else {
      setActiveTemplate('preliminary');
    }
  }, [sale]);

  if (!isOpen || !sale) return null;

  const t = translations[lang];

  const handlePrint = () => {
    triggerBrowserPrint('printable-sale-contract');
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    await exportElementToPdf('printable-sale-contract', `Car-Sale-Contract-${sale.invoiceNumber}.pdf`);
    setIsExportingPdf(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 60));
  const handleZoomReset = () => setZoom(100);

  // Default values if fields omitted
  const sellerName = sale.sellerName || settings.organizationName || 'شركة أسطول السيارات الذكية';
  const sellerNationalId = sale.sellerNationalId || settings.commercialRegistration || '1010889201';
  const sellerAddress = sale.sellerAddress || settings.address || 'الرياض - المملكة العربية السعودية';

  const buyerName = sale.buyerName;
  const buyerNationalId = sale.buyerNationalId || 'غير مدخل';
  const buyerAddress = sale.buyerAddress || 'العنوان الرئيسي للعميل';

  const penaltyAmount = sale.penaltyAmount || Math.round(sale.salePrice * 0.1) || 5000;
  const courtName = sale.jurisdictionCourt || (lang === 'ar' ? 'المحاكم المختصة' : 'Competent Courts');
  const transferDeadline = sale.transferDeadline || (lang === 'ar' ? '15 يوماً' : '15 days');

  const witness1Name = sale.witness1Name || (lang === 'ar' ? 'أحمد بن عبد الرحمن السليم' : 'Witness 1');
  const witness1NationalId = sale.witness1NationalId || '1029384756';

  const witness2Name = sale.witness2Name || (lang === 'ar' ? 'محمود بن خالد الشمري' : 'Witness 2');
  const witness2NationalId = sale.witness2NationalId || '1092837465';

  const paymentMethodLabel = {
    cash: lang === 'ar' ? 'نقدًا (Cash)' : 'Cash',
    bank_transfer: lang === 'ar' ? 'تحويل بنكي (Bank Transfer)' : 'Bank Transfer',
    installments: lang === 'ar' ? 'أقساط (Installments)' : 'Installments',
    cheque: lang === 'ar' ? 'شيك (Cheque)' : 'Cheque',
  }[sale.paymentMethod] || sale.paymentMethod;

  return (
    <div className={`fixed inset-0 z-50 flex justify-center items-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-transparent print:overflow-visible print:h-auto print:block print:inset-auto ${isFullscreen ? 'p-0' : ''}`}>
      <div className={`bg-slate-900 text-slate-100 rounded-2xl shadow-2xl w-full border border-slate-800 flex flex-col h-[95vh] max-h-[95vh] overflow-hidden transition-all duration-200 print:max-h-none print:h-auto print:overflow-visible print:shadow-none print:border-none print:my-0 print:w-full print:max-w-none print:rounded-none ${
        isFullscreen ? 'max-w-none h-screen max-h-screen rounded-none my-0' : 'max-w-5xl my-auto'
      }`}>
        {/* Controls Header - Always fixed at top */}
        <div className="flex-none print:hidden flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b border-slate-800 bg-slate-950 text-white rounded-t-2xl shadow-md z-30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-xs sm:text-base tracking-wide">
                  {lang === 'ar' ? 'عقد بيع سيارة ابتدائي (صياغة قانونية مع الشهود)' : 'Legal Car Sale Contract Preview'} - {sale.invoiceNumber}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{lang === 'ar' ? 'عقد موثق مع الشهود' : 'Legal Witness Attested'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
                {lang === 'ar' ? 'صياغة نموذج عقد بيع ابتدائي مع توقيع البائع والمشتري والشاهدين' : 'Formal legal preliminary car sale contract with witness signatures'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Contract Template Selector */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTemplate('preliminary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                  activeTemplate === 'preliminary'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {lang === 'ar' ? 'عقد ابتدائي مع الشهود' : 'Preliminary with Witnesses'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplate('final')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                  activeTemplate === 'final'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {lang === 'ar' ? 'عقد بيع نهائي (11 بنداً)' : 'Full Final Contract'}
              </button>
            </div>

            {/* Font & Input Size Scale - Manual Numeric Typing */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-[11px] text-amber-400 font-bold whitespace-nowrap">
                {lang === 'ar' ? 'حجم الخط:' : 'Font Size:'}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={40}
                  max={250}
                  step={1}
                  value={fontScale}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setFontScale(isNaN(val) ? 100 : Math.max(40, Math.min(250, val)));
                  }}
                  className="w-14 bg-slate-950 text-amber-300 font-mono font-black text-xs text-center px-1 py-1 rounded-lg border border-amber-500/50 focus:border-amber-400 focus:outline-none"
                  placeholder="100"
                />
                <span className="text-[11px] text-amber-400 font-mono font-bold">%</span>
              </div>
            </div>

            {/* Print Paper Scale - Manual Numeric Typing */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-[11px] text-blue-400 font-bold whitespace-nowrap">
                {lang === 'ar' ? 'حجم الورقة:' : 'Paper Scale:'}
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={30}
                  max={250}
                  step={1}
                  value={zoom}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setZoom(isNaN(val) ? 100 : Math.max(30, Math.min(250, val)));
                  }}
                  className="w-14 bg-slate-950 text-blue-300 font-mono font-black text-xs text-center px-1 py-1 rounded-lg border border-blue-500/50 focus:border-blue-400 focus:outline-none"
                  placeholder="100"
                />
                <span className="text-[11px] text-blue-400 font-mono font-bold">%</span>
              </div>
              <div className="flex items-center gap-0.5 mr-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title={lang === 'ar' ? 'تصغير' : 'Zoom Out'}
                  className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  title={lang === 'ar' ? 'إعادة ضبط الحجم' : 'Reset Scale'}
                  className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title={lang === 'ar' ? 'تكبير' : 'Zoom In'}
                  className="p-1 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? (lang === 'ar' ? 'تصغير النافذة' : 'Exit Fullscreen') : (lang === 'ar' ? 'ملء الشاشة' : 'Fullscreen')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Quick Watermark Toggle Button */}
            <button
              type="button"
              onClick={() => {
                const nextVal = !showWatermark;
                setShowWatermark(nextVal);
                const curr = getSavedPrintSettings();
                savePrintSettings({ ...curr, showWatermark: nextVal });
              }}
              title={
                showWatermark
                  ? lang === 'ar'
                    ? 'إزالة العلامة المائية (SHAKER MOTORS)'
                    : 'Remove Watermark (SHAKER MOTORS)'
                  : lang === 'ar'
                    ? 'وضع العلامة المائية (SHAKER MOTORS)'
                    : 'Add Watermark (SHAKER MOTORS)'
              }
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                showWatermark
                  ? 'bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border-purple-500/50 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${showWatermark ? 'text-purple-400' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">
                {showWatermark
                  ? lang === 'ar'
                    ? 'علامة مائية: مفعلة'
                    : 'Watermark: ON'
                  : lang === 'ar'
                    ? 'بدون علامة مائية'
                    : 'Watermark: OFF'}
              </span>
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

            {/* Export Word (.doc) Button */}
            <button
              type="button"
              onClick={() =>
                exportSaleContractToWord({
                  sale,
                  settings,
                  currency,
                  lang,
                })
              }
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-800 hover:bg-blue-700 text-blue-100 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition border border-blue-600/50"
              title={lang === 'ar' ? 'تنزيل عقد البيع كملف وورد Microsoft Word (.doc)' : 'Download as Microsoft Word'}
            >
              <FileText className="w-4 h-4 text-blue-300" />
              <span>{lang === 'ar' ? 'تصدير وورد (Word)' : 'Export Word'}</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-900/40 transition border border-emerald-400/30 disabled:opacity-50"
              title={lang === 'ar' ? 'تنزيل كملف PDF مباشر' : 'Download direct PDF file'}
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? (lang === 'ar' ? 'جاري التحميل...' : 'Exporting...') : (lang === 'ar' ? 'تنزيل PDF' : 'Download PDF')}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-900/40 transition border border-blue-400/30"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة عقد البيع' : 'Print Contract'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-950/90 p-3 sm:p-8 print:p-0 print:bg-white print:overflow-visible">
          <div
            id="printable-sale-contract"
            style={{
              zoom: zoom / 100,
              fontSize: `${fontScale}%`,
              ['--print-font-size' as any]: `${(fontScale / 100) * 8}pt`,
            }}
            className="print-page-frame relative p-6 sm:p-10 bg-white text-slate-900 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-slate-300 max-w-4xl mx-auto text-xs sm:text-sm font-sans leading-relaxed transition-all duration-150 print:overflow-visible print:h-auto print:max-h-none print:block print:w-full print:shadow-none print:rounded-none"
          >
            {/* Watermark Background Overlay (SHAKER MOTORS) */}
            {showWatermark && (
              <div
                className="contract-watermark-overlay absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 overflow-hidden"
                style={{
                  opacity: Math.max((watermarkOpacity ?? 12) / 100, 0.12),
                }}
              >
                <div
                  className="contract-watermark-text font-black text-slate-900 uppercase whitespace-nowrap select-none tracking-widest"
                  style={{
                    fontSize: '48pt',
                    transform: 'rotate(-28deg)',
                    fontFamily: 'Arial, Tahoma, sans-serif',
                  }}
                >
                  {watermarkText || 'SHAKER MOTORS'}
                </div>
                <div
                  className="contract-watermark-subtext font-bold text-slate-800 uppercase whitespace-nowrap select-none tracking-widest"
                  style={{
                    fontSize: '12pt',
                    transform: 'rotate(-28deg)',
                    fontFamily: 'Arial, Tahoma, sans-serif',
                    marginTop: '10px',
                  }}
                >
                  ★ عقد بيع مركبة نهائي معتمد ★
                </div>
              </div>
            )}

            {/* Header / Logo */}
            <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900 mb-6 print:break-inside-avoid">
              <div className="flex items-center gap-4">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-lg" />
                ) : (
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-2xl">
                    <Car className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900">{settings.organizationName || 'شركة بيع وإيجار السيارات'}</h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {lang === 'ar' ? 'س.ت:' : 'CR:'} {settings.commercialRegistration || '1010000000'} | {lang === 'ar' ? 'الرقم الضريبي:' : 'Tax ID:'} {settings.taxId || '300000000000003'}
                  </p>
                  <p className="text-xs text-slate-500">{settings.address} • {settings.contactPhone}</p>
                </div>
              </div>

              <div className="text-left rtl:text-right">
                <div className="inline-block px-3 py-1 bg-blue-50 text-blue-900 rounded-lg border border-blue-200 text-xs font-black mb-2">
                  {activeTemplate === 'preliminary' ? (lang === 'ar' ? 'عقد بيع ابتدائي موثق' : 'Preliminary Sale Contract') : (lang === 'ar' ? 'عقد بيع سيارة نهائي' : 'Final Car Sale Contract')}
                </div>
                <div className="text-xs font-bold text-slate-800">{lang === 'ar' ? 'رقم العقد:' : 'Contract No:'} <span className="font-mono text-blue-600 font-black">{sale.invoiceNumber}</span></div>
                <div className="text-xs text-slate-500">{lang === 'ar' ? 'التاريخ:' : 'Date:'} {sale.saleDate}</div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-4 pb-4 border-b border-slate-200 print:break-inside-avoid">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-wide">
                {activeTemplate === 'preliminary'
                  ? (lang === 'ar' ? 'عقد بيع سيارة ابتدائي (صياغة قانونية مع الشهود)' : 'Preliminary Car Sale Contract (With Witness Attestation)')
                  : (lang === 'ar' ? 'عقد بيع سيارة نهائي ومبرم بين الطرفين' : 'Final Car Purchase & Sale Agreement')}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {lang === 'ar'
                  ? 'تم الاتفاق والتراضي في هذا اليوم بين الطرفين الموضحين أدناه على بيع وشراء المركبة المبينة مواصفاتها بالشروط التالية:'
                  : 'It has been agreed on this date between the two parties specified below to sell and purchase the vehicle according to the following terms:'}
              </p>
            </div>

            {/* Parties Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 print:break-inside-avoid">
              {/* Seller Details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>{lang === 'ar' ? 'الطرف الأول (البائع):' : 'First Party (Seller):'}</span>
                </h3>
                <div className="space-y-1.5 text-xs">
                  <div><span className="font-semibold text-slate-500">{lang === 'ar' ? 'الاسم:' : 'Name:'}</span> <strong className="text-slate-900">{sellerName}</strong></div>
                  <div><span className="font-semibold text-slate-500">{lang === 'ar' ? 'الرقم القومي / السجل:' : 'National ID / CR:'}</span> <strong className="font-mono text-slate-900">{sellerNationalId}</strong></div>
                  <div><span className="font-semibold text-slate-500">{lang === 'ar' ? 'العنوان:' : 'Address:'}</span> <span className="text-slate-800">{sellerAddress}</span></div>
                </div>
              </div>

              {/* Buyer Details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-1.5 text-xs sm:text-sm">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>{lang === 'ar' ? 'الطرف الثاني (المشتري):' : 'Second Party (Buyer):'}</span>
                </h3>
                <div className="space-y-1.5 text-xs">
                  <div><span className="font-semibold text-slate-500">{lang === 'ar' ? 'الاسم:' : 'Name:'}</span> <strong className="text-slate-900">{buyerName}</strong></div>
                  <div><span className="font-semibold text-slate-500">{lang === 'ar' ? 'الرقم القومي / الهوية:' : 'National ID:'}</span> <strong className="font-mono text-slate-900">{buyerNationalId}</strong></div>
                  <div><span className="font-semibold text-slate-500">{lang === 'ar' ? 'العنوان:' : 'Address:'}</span> <span className="text-slate-800">{buyerAddress}</span></div>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6 print:break-inside-avoid">
              <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3 flex items-center gap-1.5 text-xs sm:text-sm">
                <Car className="w-4 h-4 text-blue-600" />
                <span>{lang === 'ar' ? 'بيانات السيارة المباعة:' : 'Vehicle Details:'}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span className="text-slate-500 block">{lang === 'ar' ? 'الماركة:' : 'Make:'}</span><strong className="text-slate-900">{sale.brand || sale.carModel.split(' ')[0]}</strong></div>
                <div><span className="text-slate-500 block">{lang === 'ar' ? 'الموديل:' : 'Model:'}</span><strong className="text-slate-900">{sale.model || sale.carModel}</strong></div>
                <div><span className="text-slate-500 block">{lang === 'ar' ? 'سنة الصنع:' : 'Year:'}</span><strong className="text-slate-900">{sale.year || '2024'}</strong></div>
                <div><span className="text-slate-500 block">{lang === 'ar' ? 'اللون:' : 'Color:'}</span><strong className="text-slate-900">{sale.color || (lang === 'ar' ? 'أسود ملكي' : 'Black')}</strong></div>
                <div><span className="text-slate-500 block">{lang === 'ar' ? 'رقم الشاسيه:' : 'Chassis No:'}</span><strong className="font-mono text-slate-900">{sale.chassisNumber || 'CH-9920184710293'}</strong></div>
                <div><span className="text-slate-500 block">{lang === 'ar' ? 'رقم الموتور:' : 'Engine No:'}</span><strong className="font-mono text-slate-900">{sale.engineNumber || 'ENG-33910842'}</strong></div>
                <div className="col-span-2"><span className="text-slate-500 block">{lang === 'ar' ? 'رقم اللوحة المعدنية:' : 'Plate No:'}</span><strong className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mt-0.5">{sale.carPlate}</strong></div>
              </div>
            </div>

            {/* Template 1: Preliminary Contract Legal Clauses (Exact Prompt Layout) */}
            {activeTemplate === 'preliminary' ? (
              <div className="space-y-4 mb-6">
                <h3 className="font-black text-slate-900 text-sm border-b-2 border-slate-800 pb-1.5 flex items-center gap-2 print:break-inside-avoid">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>{lang === 'ar' ? 'بنود العقد (الصياغة القانونية المعتمدة):' : 'Contract Clauses:'}</span>
                </h3>

                <div className="space-y-3 text-xs leading-relaxed text-slate-800">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">البند الأول:</strong>
                    <p>يقر الطرف الأول (البائع) بأنه المالك الشرعي للسيارة محل هذا العقد، وأنها خالية من أي رهون أو حجوزات أو حقوق للغير.</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">البند الثاني:</strong>
                    <p>
                      اتفق الطرفان على أن ثمن السيارة هو مبلغ وقدره (
                      <strong className="text-emerald-800 font-extrabold font-mono text-sm px-1.5 py-0.5 bg-emerald-50 rounded border border-emerald-300 mx-1">
                        {formatCurrency(sale.salePrice, currency, lang)}
                      </strong>
                      )، وقد استلم الطرف الأول كامل الثمن عند التوقيع على هذا العقد وطريقة السداد ({paymentMethodLabel}).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">البند الثالث:</strong>
                    <p>يلتزم الطرف الأول بتسليم السيارة وجميع مستنداتها (الرخصة – شهادة البيانات – إيصالات سداد الرسوم) فور التوقيع.</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">البند الرابع:</strong>
                    <p>
                      يلتزم الطرف الثاني بإنهاء إجراءات نقل الملكية أمام إدارة المرور المختصة خلال مدة أقصاها (
                      <strong className="font-bold text-blue-800 px-1">{transferDeadline}</strong>
                      ) من تاريخ هذا العقد.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">البند الخامس:</strong>
                    <p>يضمن الطرف الأول سلامة السيارة وعدم وجود عيوب جوهرية أو مخالفات مرورية أو أقساط مستحقة عليها.</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">البند السادس:</strong>
                    <p>
                      في حالة إخلال أي طرف ببنود هذا العقد، يحق للطرف الآخر المطالبة بالتعويض المناسب أمام القضاء (بالإضافة إلى شرط جزائي قدره{' '}
                      <strong className="text-rose-800 font-mono font-bold px-1">{formatCurrency(penaltyAmount, currency, lang)}</strong>).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">البند السابع:</strong>
                    <p>
                      تختص محاكم (
                      <strong className="font-bold text-slate-900 px-1">{courtName}</strong>
                      ) بالفصل في أي نزاع ينشأ عن هذا العقد.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Template 2: Detailed 11 Clauses Contract */
              <div className="space-y-3 mb-6">
                <h3 className="font-black text-slate-900 text-sm border-b-2 border-slate-800 pb-1.5 flex items-center gap-2 print:break-inside-avoid">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>{lang === 'ar' ? 'الشروط والأحكام القانونية لبيوع المركبات (11 بنداً)' : 'Vehicle Purchase & Sale Legal Terms'}</span>
                </h3>

                <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-800">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">4. حالة السيارة وسند الملكية:</strong>
                    <p>يقر البائع أن السيارة خالية تماماً من الحجز أو الرهن أو أي حقوق أو ديون أو التزامات للغير.</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">5. الثمن وطريقة الدفع:</strong>
                    <p>
                      يلتزم المشتري بدفع مبلغ وقدره{' '}
                      <strong className="text-emerald-700 font-extrabold text-sm font-mono mx-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded">
                        {formatCurrency(sale.salePrice, currency, lang)}
                      </strong>
                      تم السداد بواسطة ({paymentMethodLabel}).
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">6. التسليم والاستلام:</strong>
                    <p>يتم تسليم السيارة وكافة المستندات والأوراق الخاصة بها فور التوقيع على هذا العقد من الطرفين.</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">7. الضمانات وصحة الأوراق:</strong>
                    <p>يضمن البائع صحة وسلامة كافة المستندات والوثائق الخاصة بالسيارة وعدم وجود أي مخالفات مرورية سابقة أو أقساط مستحقة حتى تاريخ التسليم.</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">8. نقل الملكية:</strong>
                    <p>يلتزم الطرفان بإنهاء كافة الإجراءات الرسمية لنقل ملكية السيارة أمام إدارة المرور المختصة خلال المدة المحددة.</p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">9. الشرط الجزائي:</strong>
                    <p>
                      في حالة إخلال أي طرف بأي بند، يلتزم الطرف المخل بدفع تعويض اتفاقي قدره{' '}
                      <strong className="text-red-700 font-bold font-mono px-1.5 py-0.5 bg-red-50 border border-red-200 rounded">
                        {formatCurrency(penaltyAmount, currency, lang)}
                      </strong>{' '}
                      للطرف الآخر.
                    </p>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 print:break-inside-avoid">
                    <strong className="text-slate-900 block mb-0.5">10. الاختصاص القضائي:</strong>
                    <p>تختص محاكم ({courtName}) بالفصل في أي نزاع ينشأ عن تفسير أو تنفيذ هذا العقد.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes if present */}
            {sale.notes && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs mb-6 print:break-inside-avoid">
                <strong className="text-amber-900 block mb-0.5">{lang === 'ar' ? 'ملاحظات إضافية:' : 'Additional Notes:'}</strong>
                <p className="text-amber-800">{sale.notes}</p>
              </div>
            )}

            {/* Primary Signatures Section */}
            <div className="pt-6 border-t-2 border-slate-900 mt-6 print:break-inside-avoid">
              <div className="grid grid-cols-2 gap-8 text-center text-xs mb-6">
                <div>
                  <h4 className="font-extrabold text-slate-900 mb-1">{lang === 'ar' ? 'توقيع الطرف الأول (البائع):' : 'Seller Signature (First Party):'}</h4>
                  <p className="text-slate-500 mb-4">{sellerName}</p>
                  <div className="border-b-2 border-dashed border-slate-400 w-3/4 mx-auto h-12 flex items-center justify-center">
                    {sale.sellerSignature ? (
                      <img src={sale.sellerSignature} alt="Seller signature" className="max-h-12 object-contain" />
                    ) : (
                      <span className="text-slate-300 italic">{lang === 'ar' ? 'التوقيع والختم هنا' : 'Signature & Stamp'}</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 mb-1">{lang === 'ar' ? 'توقيع الطرف الثاني (المشتري):' : 'Buyer Signature (Second Party):'}</h4>
                  <p className="text-slate-500 mb-4">{buyerName}</p>
                  <div className="border-b-2 border-dashed border-slate-400 w-3/4 mx-auto h-12 flex items-center justify-center">
                    {sale.buyerSignature ? (
                      <img src={sale.buyerSignature} alt="Buyer signature" className="max-h-12 object-contain" />
                    ) : (
                      <span className="text-slate-300 italic">{lang === 'ar' ? 'توقيع المشتري هنا' : 'Buyer Sign'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Witnesses Section (قسم الشهود) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 mt-4 print:break-inside-avoid">
                <h3 className="font-extrabold text-slate-900 border-b border-slate-300 pb-2 mb-3 text-xs sm:text-sm flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-600" />
                  <span>{lang === 'ar' ? 'الشهود (شهادة وإقرار قانوني بالبيع):' : 'Witnesses (Legal Attestation):'}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Witness 1 */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <div className="font-black text-slate-900 border-b pb-1 flex justify-between items-center">
                      <span>{lang === 'ar' ? 'الشاهد الأول:' : 'First Witness:'}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{lang === 'ar' ? 'شاهد عيان' : 'Witness'}</span>
                    </div>
                    <div><span className="text-slate-500 font-semibold">{lang === 'ar' ? 'الاسم:' : 'Name:'}</span> <strong className="text-slate-900">{witness1Name}</strong></div>
                    <div><span className="text-slate-500 font-semibold">{lang === 'ar' ? 'الرقم القومي:' : 'National ID:'}</span> <strong className="font-mono text-slate-900">{witness1NationalId}</strong></div>
                    <div className="pt-1">
                      <span className="text-slate-500 font-semibold block mb-1">{lang === 'ar' ? 'التوقيع:' : 'Signature:'}</span>
                      <div className="border-b-2 border-dashed border-slate-400 h-10 flex items-center justify-center text-slate-400 font-mono italic text-[11px]">
                        {sale.witness1Signature ? (
                          <img src={sale.witness1Signature} alt="Witness 1 signature" className="max-h-9 object-contain" />
                        ) : (
                          '...................................................'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Witness 2 */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <div className="font-black text-slate-900 border-b pb-1 flex justify-between items-center">
                      <span>{lang === 'ar' ? 'الشاهد الثاني:' : 'Second Witness:'}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{lang === 'ar' ? 'شاهد عيان' : 'Witness'}</span>
                    </div>
                    <div><span className="text-slate-500 font-semibold">{lang === 'ar' ? 'الاسم:' : 'Name:'}</span> <strong className="text-slate-900">{witness2Name}</strong></div>
                    <div><span className="text-slate-500 font-semibold">{lang === 'ar' ? 'الرقم القومي:' : 'National ID:'}</span> <strong className="font-mono text-slate-900">{witness2NationalId}</strong></div>
                    <div className="pt-1">
                      <span className="text-slate-500 font-semibold block mb-1">{lang === 'ar' ? 'التوقيع:' : 'Signature:'}</span>
                      <div className="border-b-2 border-dashed border-slate-400 h-10 flex items-center justify-center text-slate-400 font-mono italic text-[11px]">
                        {sale.witness2Signature ? (
                          <img src={sale.witness2Signature} alt="Witness 2 signature" className="max-h-9 object-contain" />
                        ) : (
                          '...................................................'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 flex justify-between items-center">
                <span>{settings.appName} • {lang === 'ar' ? 'نظام إدارة العقود والمبيعات الرقمية' : 'Digital Sales & Contract System'}</span>
                <span>{lang === 'ar' ? 'حرر هذا العقد من نسختين بيد كل طرف نسخة للعمل بموجبها' : 'Executed in two original counterparts'}</span>
              </div>
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
