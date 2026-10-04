import React, { useState, useEffect } from 'react';
import { X, Printer, Car, User, Calendar, ShieldCheck, FileText, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Eye, CheckCircle2, Download, Settings, Building2, Phone, CreditCard, IdCard, Mail, MapPin, Globe, Sparkles } from 'lucide-react';
import { AppSettings, RentalContract, Language, Customer, Car as CarType } from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { exportElementToPdf, triggerBrowserPrint } from '../utils/pdfExport';
import { exportRentalContractToWord } from '../utils/wordExport';
import { PrintSettingsModal } from './PrintSettingsModal';
import { getSavedPrintSettings, savePrintSettings, applyPrintSettingsToDOM, getFontScalePercentage } from '../utils/printSettings';

interface PrintContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentalContract | null;
  customers?: Customer[];
  cars?: CarType[];
  settings: AppSettings;
  lang: Language;
  isBlank?: boolean;
}

export const PrintContractModal: React.FC<PrintContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  customers = [],
  cars = [],
  settings,
  lang,
  isBlank = false,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [fontScale, setFontScale] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('SHAKER MOTORS');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(8);
  const [isBlankMode, setIsBlankMode] = useState<boolean>(isBlank || !contract);

  useEffect(() => {
    if (isOpen) {
      const printSettings = getSavedPrintSettings();
      applyPrintSettingsToDOM(printSettings);
      setFontScale(getFontScalePercentage(printSettings.fontSize));
      setShowWatermark(printSettings.showWatermark ?? true);
      setWatermarkText(printSettings.watermarkText || 'SHAKER MOTORS');
      setWatermarkOpacity(printSettings.watermarkOpacity ?? 8);
      setIsBlankMode(!!isBlank || !contract);
    }
  }, [isOpen, isBlank, contract]);

  if (!isOpen) return null;

  // Fallback contract object if opened directly in blank mode
  const effectiveContract: RentalContract = contract || {
    id: 'blank-contract',
    contractNumber: `CNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerNationalId: '',
    customerLicenseNumber: '',
    carId: '',
    carPlate: '',
    carModel: 'تويوتا كامري 2025',
    carColor: 'أبيض لؤلؤي',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    startTime: '10:00 ص',
    endTime: '10:00 ص',
    rentalDurationType: 'days',
    totalDays: 1,
    dailyRate: settings.defaultRentalPrice || 250,
    hourlyRate: Math.round((settings.defaultRentalPrice || 250) / 10),
    deposit: 0,
    dailyMileageLimit: settings.dailyMileageLimit || 300,
    excessMileageRate: settings.excessMileageCharge || 1.5,
    startMileage: 25000,
    totalAmount: 250,
    paidAmount: 250,
    remainingAmount: 0,
    carValueSecurity: 95000,
    hourlyDelayFee: settings.hourlyDelayFee || 50,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    termsAccepted: true,
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
  };

  const t = translations[lang];

  // Lookup full customer record from customers list
  const matchedCustomer = customers.find(
    (c) => c.id === effectiveContract.customerId || (effectiveContract.customerNationalId && c.nationalId === effectiveContract.customerNationalId)
  );

  // Lookup full car record from cars list
  const matchedCar = cars.find(
    (c) => c.id === effectiveContract.carId || (effectiveContract.carPlate && c.plateNumber === effectiveContract.carPlate)
  );

  // Lessee Enriched Data
  const lesseeName = effectiveContract.customerName || matchedCustomer?.name || '-';
  const lesseePhone = effectiveContract.customerPhone || matchedCustomer?.phone || '-';
  const lesseeNationalId = effectiveContract.customerNationalId || matchedCustomer?.nationalId || effectiveContract.customerId || '-';
  const lesseeLicenseNumber = effectiveContract.customerLicenseNumber || matchedCustomer?.licenseNumber || '-';
  const lesseeLicenseExpiry = effectiveContract.customerLicenseExpiryDate || matchedCustomer?.licenseExpiryDate;
  const lesseeNationality = effectiveContract.customerNationality || matchedCustomer?.nationality || (lang === 'ar' ? 'سعودي' : 'Saudi');
  const lesseeAddress = effectiveContract.customerAddress || matchedCustomer?.address || '-';
  const lesseeJobTitle = effectiveContract.customerJobTitle || matchedCustomer?.jobTitle;
  const lesseeEmail = effectiveContract.customerEmail || matchedCustomer?.email;
  const lesseeNotes = effectiveContract.customerNotes || matchedCustomer?.notes;
  const lesseePhoto = effectiveContract.customerPhotoUrl || matchedCustomer?.photoUrl;
  const lesseeDocPhoto = effectiveContract.customerDocPhotoUrl || matchedCustomer?.docPhotoUrl;

  // Full Car Price / Market Valuation
  const fullCarPrice = effectiveContract.carSalePrice || effectiveContract.carValueSecurity || matchedCar?.salePrice || 95000;

  const handlePrint = () => {
    triggerBrowserPrint('printable-contract');
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    await exportElementToPdf(
      'printable-contract',
      isBlankMode ? 'Rental-Contract-Blank-Template.pdf' : `Rental-Contract-${effectiveContract.contractNumber}.pdf`
    );
    setIsExportingPdf(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 60));
  const handleZoomReset = () => setZoom(100);

  return (
    <div className={`fixed inset-0 z-50 flex justify-center items-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-transparent print:overflow-visible print:h-auto print:block print:inset-auto ${isFullscreen ? 'p-0' : ''}`}>
      {/* Top Left Floating Close Button (Always visible on top-left of the screen) */}
      <button
        onClick={onClose}
        type="button"
        title={lang === 'ar' ? 'إغلاق نافذة المعاينة (Esc)' : 'Close preview (Esc)'}
        className="fixed top-4 left-4 z-[60] print:hidden flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-2xl shadow-rose-950 border-2 border-rose-400 cursor-pointer transition-all hover:scale-105 active:scale-95"
      >
        <X className="w-4 h-4 text-white stroke-[3]" />
        <span>{lang === 'ar' ? 'إغلاق' : 'Close'}</span>
      </button>

      <div className={`bg-slate-900 text-slate-100 rounded-2xl shadow-2xl w-full border border-slate-800 flex flex-col h-[95vh] max-h-[95vh] overflow-hidden transition-all duration-200 print:max-h-none print:h-auto print:overflow-visible print:shadow-none print:border-none print:my-0 print:w-full print:max-w-none print:rounded-none ${
        isFullscreen ? 'max-w-none h-screen max-h-screen rounded-none my-0' : 'max-w-5xl my-auto'
      }`}>
        {/* Modal Controls Header - Always fixed at top */}
        <div className="flex-none print:hidden flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b border-slate-800 bg-slate-950 text-white rounded-t-2xl shadow-md z-30">
          <div className="flex items-center gap-3">
            {/* Top Left Close Button inside header */}
            <button
              onClick={onClose}
              type="button"
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-black shadow-md border border-rose-400/50 transition cursor-pointer"
              title={lang === 'ar' ? 'إغلاق نافذة الطباعة' : 'Close'}
            >
              <X className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إغلاق' : 'Close'}</span>
            </button>

            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-xs sm:text-base tracking-wide">
                  {isBlankMode
                    ? (lang === 'ar' ? 'معاينة عقد إيجار سيارة رسمي (نموذج فارغ)' : 'Print Preview - Blank Agreement Form')
                    : `${lang === 'ar' ? 'معاينة العقد للطباعة' : 'Print Preview Window'} - ${effectiveContract.contractNumber}`}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{lang === 'ar' ? 'تخطيط A4 معتمد' : 'A4 Verified'}</span>
                </span>
                {isBlankMode && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/50 text-[11px] font-black animate-pulse">
                    ★ {lang === 'ar' ? 'نموذج فارغ' : 'Blank Form'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
                {isBlankMode
                  ? (lang === 'ar' ? 'نموذج عقد معتمد بخانات منقطة فارغة جاهزة للتعبئة اليدوية مع كامل البنود القانونية والتواقيع' : 'Official blank fillable agreement with full legal clauses, stamps and signature areas')
                  : (lang === 'ar' ? 'تحقق من محاذاة البيانات والتواقيع والبنود قبل إرسال العقد للطباعة' : 'Verify layout, clauses, and signatures before printing')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Blank Contract Template Toggle Button */}
            <button
              type="button"
              onClick={() => setIsBlankMode(!isBlankMode)}
              title={
                isBlankMode
                  ? lang === 'ar'
                    ? 'العودة لبيانات العقد الفعلي'
                    : 'Switch to populated contract data'
                  : lang === 'ar'
                    ? 'التحويل إلى نموذج عقد فارغ للتعبئة اليدوية والطباعة'
                    : 'Switch to blank contract template'
              }
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition border shadow-xs ${
                isBlankMode
                  ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 shadow-md ring-2 ring-amber-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>
                {isBlankMode
                  ? lang === 'ar'
                    ? 'نموذج فارغ (مفعل)'
                    : 'Blank Form (ON)'
                  : lang === 'ar'
                    ? 'طباعة عقد فارغ'
                    : 'Blank Form'}
              </span>
            </button>

            {/* Font & Input Size Scale - Manual Numeric Typing */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-[11px] text-amber-400 font-bold whitespace-nowrap">
                {lang === 'ar' ? 'حجم الخط والمدخلات:' : 'Text Size:'}
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
            </div>

            {/* Fine Zoom Adjuster */}
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
                <RotateCcw className="w-3 h-3 opacity-60" />
                <span className="text-[10px]">{lang === 'ar' ? 'إعادة' : 'Reset'}</span>
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
              onClick={() => setIsSettingsOpen(true)}
              title={lang === 'ar' ? 'إعدادات الطباعة' : 'Print Settings'}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 transition"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'إعدادات الطباعة' : 'Print Settings'}</span>
            </button>

            {/* Export Word (.doc) Button */}
            <button
              onClick={() =>
                exportRentalContractToWord({
                  contract: effectiveContract,
                  customer: isBlankMode ? undefined : matchedCustomer,
                  car: isBlankMode ? undefined : matchedCar,
                  settings,
                  lang,
                  isBlank: isBlankMode,
                })
              }
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-800 hover:bg-blue-700 text-blue-100 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition border border-blue-600/50"
              title={lang === 'ar' ? 'تنزيل العقد كملف وورد Microsoft Word (.doc) قابل للتعديل بالكامل' : 'Download contract as editable Microsoft Word (.doc)'}
            >
              <FileText className="w-4 h-4 text-blue-300" />
              <span>{lang === 'ar' ? 'تصدير وورد (Word)' : 'Export Word'}</span>
            </button>

            {/* Download PDF Button */}
            <button
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
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-900/40 transition border border-blue-400/30"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة العقد' : 'Print Document'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Paper Area */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-950/90 p-3 sm:p-8 print:p-0 print:bg-white print:overflow-visible">
          <div
            id="printable-contract"
            style={{
              zoom: zoom / 100,
              fontSize: `${fontScale}%`,
              ['--print-font-size' as any]: `${(fontScale / 100) * 7.8}pt`,
            }}
            className="print-page-frame relative p-4 sm:p-6 bg-white text-slate-900 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-slate-300 max-w-4xl mx-auto text-xs font-sans leading-tight transition-all duration-150 print:overflow-visible print:h-auto print:max-h-none print:block print:w-full print:shadow-none print:rounded-none"
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
                    marginTop: '8px',
                  }}
                >
                  ★ عقد إيجار سيارة رسمي معتمد ★
                </div>
              </div>
            )}

            {/* Screen-Only Layout Verification Watermark Banner */}
            <div className="print:hidden flex items-center justify-between p-2 mb-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800">
                  {lang === 'ar' ? 'معاينة العقد - منسق لطباعة صفحة A4 واحدة كاملة مع كافة التواقيع' : 'Print Preview - Full A4 Page with All Signatures'}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono text-[10px] font-bold rounded border border-blue-200">
                  {lang === 'ar' ? `المقياس: ${zoom}%` : `Scale: ${zoom}%`}
                </span>
                <span className="px-2 py-0.5 bg-white font-mono text-[10px] font-bold text-slate-700 rounded border border-slate-300">
                  1-Page A4
                </span>
              </div>
            </div>

            {/* Header with balanced top margin */}
            <div className="flex items-start justify-between pb-1.5 border-b-2 border-slate-900 mb-1.5 print:break-inside-avoid">
              <div className="flex items-center gap-2.5">
                {settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                )}
                <div>
                  <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none">{settings.organizationName || settings.appName}</h1>
                  <p className="text-[9.5px] text-slate-600 mt-0.5 leading-tight">{settings.address}</p>
                  <p className="text-[9px] text-slate-600 leading-tight">
                    {t.phone}: <span dir="ltr" className="font-semibold">{settings.contactPhone}</span> | {lang === 'ar' ? 'س.ت' : 'C.R.'}: <span className="font-mono">{settings.commercialRegistration || '-'}</span> | {lang === 'ar' ? 'الرقم الضريبي' : 'Tax ID'}: <span className="font-mono">{settings.taxId}</span>
                  </p>
                </div>
              </div>
              <div className="text-left rtl:text-right shrink-0">
                <span className="inline-block px-2 py-0.5 bg-slate-900 text-white font-bold text-[10px] rounded uppercase mb-0.5">
                  {isBlankMode ? (lang === 'ar' ? 'عقد إيجار سيارة رسمي (نموذج معتمد)' : 'Official Agreement Form') : t.printableContract}
                </span>
                <p className="text-[11px] font-black text-blue-900 font-mono leading-none">
                  {isBlankMode ? 'CNT-________' : effectiveContract.contractNumber}
                </p>
                <p className="text-[8.5px] text-slate-500 mt-0.5">
                  {lang === 'ar' ? 'تاريخ الإصدار' : 'Date'}: {isBlankMode ? '.... / .... / ........' : effectiveContract.createdAt}
                </p>
              </div>
            </div>

            {/* Customer & Lessor Section - Strictly Side-by-Side (2 Columns) with ENLARGED readable fonts */}
            <div className="grid grid-cols-2 gap-2 mb-2 print:grid-cols-2 print:gap-2 print:break-inside-avoid items-stretch">
              {/* First Party (Lessor) Box */}
              <div className="p-2 sm:p-2.5 border-2 border-emerald-300 dark:border-emerald-700/80 rounded-xl bg-emerald-50/40 flex flex-col justify-between text-xs space-y-1.5 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-1 mb-1.5">
                    <div className="flex items-center gap-1.5 font-black text-emerald-950 dark:text-emerald-900 text-xs sm:text-sm uppercase tracking-tight">
                      <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{lang === 'ar' ? 'الطرف الأول (المؤجر)' : 'First Party (Lessor)'}</span>
                    </div>
                    <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md border border-emerald-300">
                      {lang === 'ar' ? 'المؤجر المعتمد' : 'Lessor'}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[13px] sm:text-[14px] font-black text-slate-950 leading-tight">
                      {effectiveContract.lessorName || settings.organizationName || settings.appName}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-1 text-[10px] sm:text-[10.5px]">
                      <p className="text-slate-800 flex items-center gap-1.5">
                        <span className="font-bold text-slate-600">{t.phone}:</span>
                        <span dir="ltr" className="font-black text-slate-950 font-mono">{effectiveContract.lessorPhone || settings.contactPhone}</span>
                      </p>
                      <p className="text-slate-800">
                        <span className="font-bold text-slate-600">{lang === 'ar' ? 'السجل التجاري:' : 'C.R:'}</span>{' '}
                        <span className="font-mono font-black text-slate-950">{settings.commercialRegistration || '-'}</span>
                      </p>
                      <p className="text-slate-800">
                        <span className="font-bold text-slate-600">{lang === 'ar' ? 'الرقم الضريبي:' : 'Tax ID:'}</span>{' '}
                        <span className="font-mono font-black text-slate-950">{settings.taxId || '-'}</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                {settings.address && (
                  <div className="pt-1 border-t border-emerald-200/80 text-[9.5px] font-semibold text-slate-700 truncate">
                    <span className="font-bold text-slate-600">{lang === 'ar' ? 'العنوان:' : 'Addr:'}</span> {settings.address}
                  </div>
                )}
              </div>

              {/* Second Party (Lessee / Customer) Box */}
              <div className="p-2 sm:p-2.5 border-2 border-blue-300 dark:border-blue-700/80 rounded-xl bg-blue-50/40 flex flex-col justify-between text-xs space-y-1.5 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between border-b border-blue-200 pb-1 mb-1.5">
                    <div className="flex items-center gap-1.5 font-black text-blue-950 dark:text-blue-900 text-xs sm:text-sm uppercase tracking-tight">
                      <User className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{lang === 'ar' ? 'الطرف الثاني (المستأجر)' : 'Second Party (Lessee)'}</span>
                    </div>
                    <span className="text-[9px] font-extrabold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-md border border-blue-300">
                      {lang === 'ar' ? 'المستأجر للمركبة' : 'Lessee'}
                    </span>
                  </div>

                  {isBlankMode ? (
                    <div className="space-y-1.5 text-[10px] sm:text-[10.5px]">
                      <p className="text-[12.5px] font-black text-slate-950 leading-tight">
                        <span className="font-bold text-slate-600">{lang === 'ar' ? 'الاسم:' : 'Name:'}</span>{' '}
                        <span className="font-mono text-slate-900 font-bold">................................................................................</span>
                      </p>
                      
                      <div className="grid grid-cols-1 gap-1">
                        <p className="text-slate-800">
                          <span className="font-bold text-slate-600">{lang === 'ar' ? 'الهوية / الإقامة:' : 'ID:'}</span>{' '}
                          <span className="font-mono text-blue-950 font-black">....................................</span>{' '}
                          <span className="font-bold text-slate-600 mr-2">{lang === 'ar' ? 'الجنسية:' : 'Nat:'}</span>{' '}
                          <span className="text-slate-900">....................</span>
                        </p>
                        <p className="text-slate-800">
                          <span className="font-bold text-slate-600">{t.phone}:</span>{' '}
                          <span dir="ltr" className="font-mono text-slate-950 font-black">....................................</span>{' '}
                          <span className="font-bold text-slate-600 mr-2">{lang === 'ar' ? 'جهة العمل:' : 'Job:'}</span>{' '}
                          <span className="text-slate-900">....................................</span>
                        </p>
                      </div>

                      {/* Driving License Row */}
                      <div className="mt-1 pt-1 border-t border-blue-200 grid grid-cols-2 gap-1 text-[9.5px] bg-white/90 px-1.5 py-1 rounded-lg border border-blue-200">
                        <div>
                          <span className="text-slate-600 font-bold">{lang === 'ar' ? 'رخصة القيادة:' : 'License:'}</span>{' '}
                          <strong className="font-mono text-blue-950 font-black">............................</strong>
                        </div>
                        <div>
                          <span className="text-slate-600 font-bold">{lang === 'ar' ? 'الانتهاء:' : 'Expiry:'}</span>{' '}
                          <span className="font-mono font-black text-slate-900">.... / .... / ........</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-start">
                      {lesseePhoto ? (
                        <img
                          src={lesseePhoto}
                          alt="Customer"
                          className="w-11 h-12 object-cover rounded-lg border-2 border-blue-400 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 shrink-0 border border-slate-300">
                          <User className="w-5 h-5" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-[13px] sm:text-[14px] font-black text-slate-950 leading-tight truncate">
                          {lesseeName}
                        </p>
                        
                        <div className="grid grid-cols-1 gap-0.5 text-[10px] sm:text-[10.5px]">
                          <p className="text-slate-800 flex items-center gap-1.5">
                            <span className="font-bold text-slate-600">{lang === 'ar' ? 'الهوية / الإقامة:' : 'ID:'}</span>
                            <span className="font-mono font-black text-blue-950">{lesseeNationalId}</span>
                            <span className="text-[9px] text-slate-600 font-bold">({lesseeNationality})</span>
                          </p>
                          <p className="text-slate-800 flex items-center gap-1.5">
                            <span className="font-bold text-slate-600">{t.phone}:</span>
                            <span dir="ltr" className="font-mono font-black text-slate-950">{lesseePhone}</span>
                          </p>
                          {lesseeJobTitle && (
                            <p className="text-slate-800 flex items-center gap-1.5 truncate text-[9.5px]">
                              <span className="font-bold text-slate-600">{lang === 'ar' ? 'الوظيفة:' : 'Occupation:'}</span>
                              <span className="font-bold text-slate-900">{lesseeJobTitle}</span>
                            </p>
                          )}
                          {lesseeEmail && (
                            <p className="text-slate-700 truncate text-[9px]">
                              <span className="font-bold text-slate-600">{lang === 'ar' ? 'البريد:' : 'Email:'}</span> {lesseeEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!isBlankMode && (
                    <div className="mt-1.5 pt-1 border-t border-blue-200 grid grid-cols-2 gap-1 text-[9.5px] sm:text-[10px] bg-white/90 px-1.5 py-1 rounded-lg border border-blue-200">
                      <div>
                        <span className="text-slate-600 font-bold">{lang === 'ar' ? 'رخصة القيادة:' : 'License:'}</span>{' '}
                        <strong className="font-mono text-blue-950 font-black">{lesseeLicenseNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 font-bold">{lang === 'ar' ? 'الانتهاء:' : 'Expiry:'}</span>{' '}
                        <span className="font-mono font-black text-slate-900">{lesseeLicenseExpiry || '-'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Registered Residential Address */}
                <div className="pt-1 border-t border-blue-200 text-[9.5px] font-semibold text-slate-700 flex items-center justify-between">
                  <div className="truncate">
                    <span className="font-bold text-slate-600">{lang === 'ar' ? 'العنوان:' : 'Addr:'}</span>{' '}
                    {isBlankMode ? '................................................................................' : lesseeAddress}
                  </div>
                  {lesseeNotes && !isBlankMode && (
                    <span className="text-[8px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 shrink-0 ml-1 font-bold">
                      {lang === 'ar' ? 'ملاحظة' : 'Note'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle & Car Owner Specifications Box + Full Vehicle Valuation Banner */}
            <div className="p-1.5 sm:p-2 border border-slate-300 rounded-lg bg-slate-50/60 mb-1.5 space-y-1 print:break-inside-avoid text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                <div className="flex items-center gap-1 text-slate-900 font-black uppercase text-[10px]">
                  <Car className="w-3.5 h-3.5 text-blue-600" />
                  <span>{lang === 'ar' ? 'موضوع العقد وبيانات وسعر السيارة المؤجرة' : 'Subject of Agreement & Vehicle Specifications'}</span>
                </div>
                <span className="text-[8.5px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                  {lang === 'ar' ? 'مركبة سليمة ومطابقة للمواصفات' : 'Sound & Compliant Vehicle'}
                </span>
              </div>

              {/* Highlighted Full Car Price / Asset Valuation Banner */}
              <div className="p-1 sm:p-1.5 bg-gradient-to-r from-amber-500/10 via-blue-50 to-indigo-500/10 rounded-md border border-amber-400/80 flex flex-wrap items-center justify-between gap-1 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0">
                    💰
                  </div>
                  <div>
                    <span className="text-[9.5px] font-extrabold text-amber-950 block leading-tight">
                      {lang === 'ar' ? 'سعر وقيمة السيارة بالكامل (كأمانة تعاقدية معتمدة):' : 'Full Vehicle Value & Custody Valuation Price:'}
                    </span>
                    <p className="text-[8px] text-slate-600 leading-tight">
                      {lang === 'ar'
                        ? 'القيمة التقديرية المعتمدة للمركبة وقت توقيع العقد للمسؤولية والهلاك الكلي وضمان الأمانة'
                        : 'Official vehicle total market valuation for total loss compensation & custody liability'}
                    </p>
                  </div>
                </div>
                <div className="bg-white px-2 py-0.5 rounded border border-amber-500 shadow-2xs text-center">
                  <span className="text-[7.5px] font-bold text-amber-700 block uppercase tracking-wider leading-none">
                    {lang === 'ar' ? 'السعر الكامل' : 'Full Car Price'}
                  </span>
                  <span className="text-xs font-black text-slate-900 font-mono leading-tight">
                    {isBlankMode ? '........................ ريال' : formatCurrency(fullCarPrice, settings.currency, lang)}
                  </span>
                </div>
              </div>

              {/* Car Full Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs">
                <div className="p-1 bg-white rounded border border-slate-200">
                  <span className="font-semibold text-slate-500 block text-[8px] leading-none">{lang === 'ar' ? 'الماركة والموديل:' : 'Make & Model:'}</span>
                  <p className="font-black text-slate-900 text-[9.5px] truncate mt-0.5">
                    {isBlankMode ? '....................................' : effectiveContract.carModel}
                  </p>
                </div>

                <div className="p-1 bg-white rounded border border-slate-200">
                  <span className="font-semibold text-slate-500 block text-[8px] leading-none">{t.color}:</span>
                  <p className="font-black text-blue-900 text-[9.5px] flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                    <span>{isBlankMode ? '....................' : (effectiveContract.carColor || (lang === 'ar' ? 'أبيض' : 'White'))}</span>
                  </p>
                </div>

                <div className="p-1 bg-white rounded border border-slate-200">
                  <span className="font-semibold text-slate-500 block text-[8px] leading-none">{t.plateNumber}:</span>
                  <p className="font-mono font-black text-slate-900 text-[9.5px] mt-0.5">
                    {isBlankMode ? '....................' : effectiveContract.carPlate}
                  </p>
                </div>

                <div className="p-1 bg-white rounded border border-slate-200">
                  <span className="font-semibold text-slate-500 block text-[8px] leading-none">{t.startMileage}:</span>
                  <p className="font-mono font-bold text-slate-900 text-[9.5px] mt-0.5">
                    {isBlankMode ? '............ KM' : `${effectiveContract.startMileage.toLocaleString()} KM`}
                  </p>
                </div>

                <div className="p-1 bg-white rounded border border-slate-200">
                  <span className="font-semibold text-slate-500 block text-[8px] leading-none">{t.chassisNumber} (VIN):</span>
                  <p className="font-mono font-bold text-slate-800 text-[9px] truncate mt-0.5">
                    {isBlankMode ? '....................................' : (effectiveContract.carChassisNumber || 'JT2BF18K3R0123456')}
                  </p>
                </div>

                <div className="p-1 bg-white rounded border border-slate-200">
                  <span className="font-semibold text-slate-500 block text-[8px] leading-none">{t.motorNumber}:</span>
                  <p className="font-mono font-bold text-slate-800 text-[9px] truncate mt-0.5">
                    {isBlankMode ? '....................................' : (effectiveContract.carEngineNumber || 'MTR-2AR-FE-98124')}
                  </p>
                </div>

                <div className="p-1 bg-white rounded border border-slate-200">
                  <span className="font-semibold text-slate-500 block text-[8px] leading-none">{lang === 'ar' ? 'سنة الصنع والفئة:' : 'Year & Category:'}</span>
                  <p className="font-bold text-slate-800 text-[9px] mt-0.5">
                    {isBlankMode ? '....................................' : (effectiveContract.carCategory ? (t[effectiveContract.carCategory] || effectiveContract.carCategory) : (lang === 'ar' ? 'سيدان' : 'Sedan'))}
                  </p>
                </div>

                <div className="p-1 bg-white rounded border border-slate-200">
                  <span className="font-semibold text-slate-500 block text-[8px] leading-none">{lang === 'ar' ? 'سعر السيارة المقدر:' : 'Car Valuation:'}</span>
                  <p className="font-black text-emerald-800 text-[9.5px] font-mono mt-0.5">
                    {isBlankMode ? '........................ ريال' : formatCurrency(fullCarPrice, settings.currency, lang)}
                  </p>
                </div>
              </div>

              {/* Car Owner Section */}
              <div className="p-1 sm:p-1.5 bg-blue-50/70 rounded-md border border-blue-200">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9px] font-black text-blue-900 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-700" />
                    <span>{lang === 'ar' ? 'بيانات مالك السيارة المعتمدة:' : 'Registered Vehicle Owner Details:'}</span>
                  </span>
                  <span className="text-[8px] font-semibold text-blue-800 bg-white/80 px-1 py-0.2 rounded border border-blue-200">
                    {lang === 'ar' ? 'المالك النظامي للمركبة' : 'Legal Vehicle Owner'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs">
                  <div>
                    <span className="text-slate-500 text-[8px] block font-semibold leading-none">{lang === 'ar' ? 'اسم المالك:' : 'Owner Name:'}</span>
                    <p className="font-black text-slate-900 text-[9.5px] truncate mt-0.5">
                      {effectiveContract.carOwnerName || effectiveContract.lessorName || settings.organizationName || 'شركة الأسطول المتقدم لتأجير السيارات'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[8px] block font-semibold leading-none">{lang === 'ar' ? 'رقم هوية / سجل المالك:' : 'Owner Civil ID / C.R:'}</span>
                    <p className="font-mono font-black text-blue-900 text-[9.5px] mt-0.5">
                      {effectiveContract.carOwnerCivilId || settings.commercialRegistration || settings.taxId || '1010889922'}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[8px] block font-semibold leading-none">{lang === 'ar' ? 'رقم هاتف المالك:' : 'Owner Phone:'}</span>
                    <p className="font-bold text-slate-900 text-[9.5px] mt-0.5" dir="ltr">
                      {effectiveContract.carOwnerPhone || effectiveContract.lessorPhone || settings.contactPhone || '+966 9200 12345'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rental Duration Details Box */}
            <div className="p-1 sm:p-1.5 border border-slate-300 rounded-lg mb-1.5 bg-slate-50/40 print:break-inside-avoid">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="font-bold text-[9.5px] uppercase text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  <span>{lang === 'ar' ? 'تفاصيل الفترة المحددة للإيجار وساعات التأخير' : 'Rental Duration & Delay Terms'}</span>
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8.5px] font-black text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                    ⏱️ {lang === 'ar' ? `قيمة ساعة التأخير: ${formatCurrency(effectiveContract.hourlyDelayFee || settings.hourlyDelayFee || 50, settings.currency, lang)} / ساعة` : `Delay Fee: ${formatCurrency(effectiveContract.hourlyDelayFee || settings.hourlyDelayFee || 50, settings.currency, lang)}/hr`}
                  </span>
                  <span className="text-[8.5px] font-bold text-blue-900 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                    ⏰ {lang === 'ar' ? `الاستلام: ${isBlankMode ? '..........' : (effectiveContract.startTime || '10:00 ص')}` : `Pickup: ${isBlankMode ? '..........' : (effectiveContract.startTime || '10:00 AM')}`}
                  </span>
                  <span className="text-[8.5px] font-bold text-slate-900 bg-white px-1 py-0.2 rounded border border-slate-300">
                    🏁 {lang === 'ar' ? `الإرجاع: ${isBlankMode ? '..........' : (effectiveContract.endTime || effectiveContract.startTime || '10:00 ص')}` : `Return: ${isBlankMode ? '..........' : (effectiveContract.endTime || effectiveContract.startTime || '10:00 AM')}`}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center text-xs">
                <div>
                  <p className="text-[8px] text-slate-500">{t.startDate}</p>
                  <p className="font-bold text-slate-900 text-[9.5px]">
                    {isBlankMode ? '.... / .... / ........' : effectiveContract.startDate}
                  </p>
                  <p className="text-[8px] text-blue-700 font-extrabold">
                    {isBlankMode ? 'الساعة: ..........' : (effectiveContract.startTime || '10:00 ص')}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-500">{t.endDate}</p>
                  <p className="font-bold text-slate-900 text-[9.5px]">
                    {isBlankMode ? '.... / .... / ........' : effectiveContract.endDate}
                  </p>
                  <p className="text-[8px] text-slate-600 font-extrabold">
                    {isBlankMode ? 'الساعة: ..........' : (effectiveContract.endTime || effectiveContract.startTime || '10:00 ص')}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-500">{lang === 'ar' ? 'مدة الإيجار' : 'Duration'}</p>
                  <p className="font-black text-slate-900 text-[10px]">
                    {isBlankMode
                      ? '........ (يوم / شهر)'
                      : effectiveContract.rentalDurationType === 'hours' || (effectiveContract.totalHours && effectiveContract.totalHours > 0)
                      ? `${effectiveContract.totalHours || 1} ${lang === 'ar' ? 'ساعات' : 'Hours'}`
                      : `${effectiveContract.totalDays} ${lang === 'ar' ? 'أيام' : 'Days'}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Odometer Agreement Clause Box */}
            <div className="p-1 sm:p-1.5 border border-amber-300 bg-amber-50/50 rounded-lg mb-1.5 text-xs text-amber-950 print:break-inside-avoid">
              <div className="flex items-center justify-between font-black text-amber-900 border-b border-amber-200 pb-0.5 mb-0.5">
                <span className="flex items-center gap-1 text-[9.5px]">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>{t.odometerClauseTitle}</span>
                </span>
                <span className="text-[8.5px] font-bold font-mono">
                  {t.startMileage}: {isBlankMode ? '............' : effectiveContract.startMileage.toLocaleString()} KM | {t.endMileage}: {isBlankMode ? '............' : (effectiveContract.endMileage ? `${effectiveContract.endMileage.toLocaleString()} KM` : (lang === 'ar' ? 'عند الإرجاع' : 'Upon Return'))}
                </span>
              </div>

              <p className="text-[8px] leading-tight mb-0.5 text-slate-700">
                {t.odometerClauseDetails}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-0.5 font-bold bg-white/80 p-0.5 rounded border border-amber-200 text-center text-[8.5px]">
                <div>
                  <span className="text-slate-500 block font-normal text-[7.5px]">{t.startMileage}:</span>
                  <span className="text-slate-900">{isBlankMode ? '............ KM' : `${effectiveContract.startMileage.toLocaleString()} KM`}</span>
                </div>

                <div>
                  <span className="text-slate-500 block font-normal text-[7.5px]">{t.endMileage}:</span>
                  <span className="text-blue-900">{isBlankMode ? '............ KM' : (effectiveContract.endMileage ? `${effectiveContract.endMileage.toLocaleString()} KM` : (lang === 'ar' ? 'بانتظار العودة' : 'Pending'))}</span>
                </div>

                <div>
                  <span className="text-slate-500 block font-normal text-[7.5px]">{t.dailyMileageLimit}:</span>
                  <span>{effectiveContract.dailyMileageLimit || settings.dailyMileageLimit || 300} KM/{lang === 'ar' ? 'يوم' : 'day'}</span>
                </div>

                <div>
                  <span className="text-slate-500 block font-normal text-[7.5px]">{t.excessMileageRate}:</span>
                  <span>{effectiveContract.excessMileageRate || settings.excessMileageCharge || 1.50} {settings.currency}/KM</span>
                </div>

                <div className="bg-rose-50/80 rounded border border-rose-200">
                  <span className="text-rose-700 block font-bold text-[7.5px]">{lang === 'ar' ? 'ساعة التأخير:' : 'Delay / Hour:'}</span>
                  <span className="text-rose-900 font-black">{formatCurrency(effectiveContract.hourlyDelayFee || settings.hourlyDelayFee || 50, settings.currency, lang)}</span>
                </div>
              </div>
            </div>

            {/* Financial Breakdown Section (المبالغ المالية وسداد العقد) */}
            <div className="p-1 sm:p-1.5 border border-slate-300 rounded-lg mb-1.5 bg-slate-50/50 print:break-inside-avoid text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-0.5 mb-1">
                <span className="font-extrabold text-[9.5px] text-slate-900 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>{lang === 'ar' ? 'المبالغ المالية وتفاصيل السداد' : 'Financial Breakdown & Payment Details'}</span>
                </span>
                <span className="text-[8.5px] text-slate-600 font-bold">
                  {lang === 'ar' ? 'شامل الرسوم والضرائب المعتمدة' : 'Includes approved fees & taxes'}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-center">
                <div className="p-1 bg-white rounded border border-slate-200">
                  <span className="text-[7.5px] text-slate-500 block">{lang === 'ar' ? 'الأجرة المتفق عليها' : 'Rental Rate'}</span>
                  <span className="font-bold text-slate-900 text-[9.5px]">
                    {isBlankMode ? '............ ريال' : formatCurrency(effectiveContract.dailyRate, settings.currency, lang)}
                  </span>
                </div>
                <div className="p-1 bg-white rounded border border-slate-200">
                  <span className="text-[7.5px] text-slate-500 block">{lang === 'ar' ? 'مبلغ التأمين النقدي' : 'Deposit'}</span>
                  <span className="font-bold text-slate-900 text-[9.5px]">
                    {isBlankMode ? '............ ريال' : formatCurrency(effectiveContract.deposit || 0, settings.currency, lang)}
                  </span>
                </div>
                <div className="p-1 bg-blue-50/80 rounded border border-blue-200">
                  <span className="text-[7.5px] text-blue-700 block font-bold">{lang === 'ar' ? 'إجمالي العقد' : 'Total'}</span>
                  <span className="font-black text-blue-950 text-[10px]">
                    {isBlankMode ? '............ ريال' : formatCurrency(effectiveContract.totalAmount, settings.currency, lang)}
                  </span>
                </div>
                <div className="p-1 bg-emerald-50/80 rounded border border-emerald-200">
                  <span className="text-[7.5px] text-emerald-700 block font-bold">{lang === 'ar' ? 'المدفوع مقدماً' : 'Paid'}</span>
                  <span className="font-black text-emerald-800 text-[9.5px]">
                    {isBlankMode ? '............ ريال' : formatCurrency(effectiveContract.paidAmount, settings.currency, lang)}
                  </span>
                </div>
                <div className="p-1 bg-rose-50/80 rounded border border-rose-200">
                  <span className="text-[7.5px] text-rose-700 block font-bold">{lang === 'ar' ? 'المتبقي المستحق' : 'Remaining'}</span>
                  <span className="font-black text-rose-900 text-[9.5px]">
                    {isBlankMode ? '............ ريال' : formatCurrency(effectiveContract.remainingAmount, settings.currency, lang)}
                  </span>
                </div>
                <div className="p-1 bg-white rounded border border-slate-200 flex flex-col justify-center">
                  <span className="text-[7.5px] text-slate-500 block">{lang === 'ar' ? 'طريقة السداد' : 'Payment Method'}</span>
                  <span className="font-extrabold text-[8px] text-slate-800">
                    {isBlankMode
                      ? '[ ] نقدي [ ] مدى [ ] تحويل'
                      : effectiveContract.paymentMethod === 'cash'
                      ? (lang === 'ar' ? 'نقداً (Cash)' : 'Cash')
                      : effectiveContract.paymentMethod === 'bank_transfer'
                      ? (lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer')
                      : (lang === 'ar' ? 'بطاقة مدى / ائتمان' : 'Card / Mada')}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Car Rental Agreement Clauses */}
            <div className="mb-1.5 text-[8.5px] text-slate-700 bg-slate-50/80 p-1 sm:p-1.5 rounded-lg border border-slate-300 print:break-inside-avoid">
              <h4 className="font-extrabold text-[9.5px] text-slate-900 mb-0.5 flex items-center gap-1 border-b border-slate-200 pb-0.5">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>{t.contractTerms}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 leading-tight">
                {(t.contractClausesList || []).map((clause: any, index: number) => (
                  <div key={clause.id || index} className="p-0.5 sm:p-1 bg-white rounded border border-slate-200 print:break-inside-avoid">
                    <span className="font-bold text-slate-900 block text-[8px] leading-tight">
                      {index + 1}. {clause.title}
                    </span>
                    <p className="text-[7.5px] text-slate-600 leading-snug">
                      {clause.id === 'duration'
                        ? (lang === 'ar'
                            ? `تبدأ وتكتمل مدة العقد بالساعة واليوم. كل ساعة تأخير تُحتسب بـ (${formatCurrency(effectiveContract.hourlyDelayFee || 50, settings.currency, lang)} / ساعة) بحد أقصى خمس ساعات، بعدها يحق للمؤجر إبلاغ الجهات المسؤولة فوراً والمطالبة بالأجرة والتعويض.`
                            : `Contract duration is calculated strictly. Any delay is charged at (${formatCurrency(effectiveContract.hourlyDelayFee || 50, settings.currency, lang)}/hr) delay penalty up to 5 hours max.`)
                        : clause.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dedicated Car Handover & Total Valuation Legal Acknowledgment Box */}
            <div className="p-1 sm:p-1.5 border border-blue-600 bg-blue-50/70 rounded-lg mb-1.5 text-xs text-blue-950 print:break-inside-avoid">
              <div className="flex items-center justify-between font-black text-blue-900 border-b border-blue-200 pb-0.5 mb-0.5">
                <span className="flex items-center gap-1 uppercase text-[9.5px]">
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>{t.handoverAcknowledgmentTitle}</span>
                </span>
                <span className="text-[8.5px] font-bold bg-white px-1.5 py-0.2 rounded border border-blue-200 font-mono">
                  {isBlankMode
                    ? (lang === 'ar' ? 'قيمة الأمانة: ........................ ريال' : 'Custody: ........................')
                    : lang === 'ar'
                    ? `قيمة المركبة: ${formatCurrency(fullCarPrice, settings.currency, lang)}`
                    : `Custody: ${formatCurrency(fullCarPrice, settings.currency, lang)}`}
                </span>
              </div>
              <p className="text-[8px] font-medium leading-snug">
                "{t.handoverAcknowledgmentText}" - {lang === 'ar' ? `ويقر الطرف الثاني (المستأجر) بأن القيمة السوقية الإجمالية للمركبة كأمانة وقت التعاقد تبلغ (${isBlankMode ? '........................ ريال' : formatCurrency(fullCarPrice, settings.currency, lang)}) وهو مسؤول مسؤولية تامة عنها.` : `The second party acknowledges receiving the car valued at ${isBlankMode ? '........................' : formatCurrency(fullCarPrice, settings.currency, lang)} in custody.`}
              </p>
            </div>

            {/* Signatures & Fingerprints Area - Always firmly anchored and visible */}
            <div className="contract-signatures-area grid grid-cols-3 gap-2 pt-1 border-t-2 border-slate-300 mt-1 print:break-inside-avoid print:mt-1">
              {/* Lessor Signature */}
              <div className="text-center space-y-0.5">
                <p className="font-bold text-[9px] text-slate-800">{lang === 'ar' ? 'توقيع المؤجر (الطرف الأول)' : 'First Party (Lessor)'}</p>
                <div className="h-10 sm:h-11 border border-dashed border-slate-300 rounded-md flex items-center justify-center p-0.5 bg-white">
                  {!isBlankMode && effectiveContract.agentSignature ? (
                    <img src={effectiveContract.agentSignature} alt="Agent Signature" className="max-h-full object-contain" />
                  ) : (
                    <div className="text-center">
                      <span className="text-[8.5px] font-bold text-blue-900 block leading-none">{settings.organizationName || 'SHAKER MOTORS'}</span>
                      <span className="text-[7px] text-slate-500">{lang === 'ar' ? 'ختم الشركة المعتمد' : 'Authorized Stamp'}</span>
                    </div>
                  )}
                </div>
                <p className="text-[8.5px] font-semibold text-slate-800 leading-none">{effectiveContract.lessorName || (lang === 'ar' ? 'المؤجر المعتمد' : 'Authorized Officer')}</p>
              </div>

              {/* Lessee Signature */}
              <div className="text-center space-y-0.5">
                <p className="font-bold text-[9px] text-slate-800">{lang === 'ar' ? 'توقيع المستأجر (الطرف الثاني)' : 'Second Party Signature'}</p>
                <div className="h-10 sm:h-11 border border-dashed border-slate-300 rounded-md flex items-center justify-center p-0.5 bg-white">
                  {!isBlankMode && effectiveContract.customerSignature ? (
                    <img src={effectiveContract.customerSignature} alt="Customer Signature" className="max-h-full object-contain" />
                  ) : (
                    <span className="text-[8.5px] text-slate-400 italic">
                      {isBlankMode ? (lang === 'ar' ? 'توقيع المستأجر المعتمد' : 'Lessee Signature') : (lang === 'ar' ? 'توقيع المستأجر' : 'Lessee Signature')}
                    </span>
                  )}
                </div>
                <p className="text-[8.5px] font-semibold text-slate-800 leading-none">
                  {isBlankMode ? '............................................' : lesseeName}
                </p>
              </div>

              {/* Fingerprint Box */}
              <div className="text-center space-y-0.5">
                <p className="font-bold text-[9px] text-purple-900 flex items-center justify-center gap-1">
                  <span>{lang === 'ar' ? '📌 بصمة المستأجر' : '📌 Fingerprint'}</span>
                </p>
                <div className="h-10 sm:h-11 border border-purple-300 bg-purple-50/40 rounded-md flex flex-col items-center justify-center p-0.5 relative overflow-hidden">
                  {!isBlankMode && effectiveContract.customerFingerprint ? (
                    <img src={effectiveContract.customerFingerprint} alt="Fingerprint" className="max-h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center justify-center opacity-80">
                      <svg className="w-4 h-4 text-purple-800 opacity-70 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 11c-1.1 0-2 .9-2 2 0 2.5 1.8 4.3 3.5 6M8 13c0-2.2 1.8-4 4-4s4 1.8 4 4c0 3.3-2.5 5.7-5 8M6 13c0-3.3 2.7-6 6-6s6 2.7 6 6c0 4.2-3.1 7.2-6.5 10M12 3C6.5 3 2 7.5 2 13c0 3.5 1.5 6.5 4 8.5" />
                      </svg>
                      <span className="text-[7px] font-extrabold text-purple-900 border-t border-purple-200 uppercase tracking-tighter">
                        {lang === 'ar' ? 'بصمة الإبهام' : 'Thumbprint'}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[7.5px] text-slate-500 font-bold leading-none">{lang === 'ar' ? 'تعتمد رسمياً لدى المحكمة' : 'Legally Binding'}</p>
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
  </div>
);
};
