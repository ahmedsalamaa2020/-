import React, { useState, useEffect } from 'react';
import { X, Printer, Building2, Calendar, ShieldCheck, Download, Eye, CheckCircle2, ZoomIn, ZoomOut, RotateCcw, Edit3, Settings, Sparkles } from 'lucide-react';
import { AppSettings, CorporateContract, Language } from '../types';
import { formatCurrency } from '../translations/i18n';
import { exportElementToPdf, triggerBrowserPrint } from '../utils/pdfExport';
import { exportCorporateContractToWord } from '../utils/wordExport';
import { PrintSettingsModal } from './PrintSettingsModal';
import { getSavedPrintSettings, savePrintSettings, applyPrintSettingsToDOM, getFontScalePercentage } from '../utils/printSettings';

interface PrintCorporateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: CorporateContract | null;
  settings: AppSettings;
  lang: Language;
}

export const PrintCorporateContractModal: React.FC<PrintCorporateContractModalProps> = ({
  isOpen,
  onClose,
  contract,
  settings,
  lang,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [fontScale, setFontScale] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isEditable, setIsEditable] = useState<boolean>(false);
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

  // Editable Form Overrides
  const [lessorName, setLessorName] = useState(contract?.lessorCompanyName || settings.organizationName || 'شركة الأسطول الذهبي لتأجير السيارات');
  const [lessorCR, setLessorCR] = useState(contract?.lessorCR || settings.commercialRegistration || settings.taxId || '1010987654');
  const [lessorAddress, setLessorAddress] = useState(contract?.lessorAddress || settings.address || 'الرياض - حي الملز - شارع الستين');
  const [lessorRep, setLessorRep] = useState(contract?.lessorRepName || 'عبدالله بن محمد العتيبي');
  const [lessorTitle, setLessorTitle] = useState(contract?.lessorRepTitle || 'الرئيس التنفيذي');

  const [tenantName, setTenantName] = useState(contract?.companyName || 'شركة التقنية المتقدمة للحلول الرقمية');
  const [tenantCR, setTenantCR] = useState(contract?.companyCR || contract?.companyTaxId || '1010345678');
  const [tenantAddress, setTenantAddress] = useState(contract?.companyAddress || 'الرياض - واجهة الرياض للأعمال');
  const [tenantRep, setTenantRep] = useState(contract?.companyRepName || contract?.contactPerson || 'مهندس/ أحمد السعيد');
  const [tenantTitle, setTenantTitle] = useState(contract?.companyRepTitle || 'مدير الموارد البشرية والعمليات');

  const [replacementDays, setReplacementDays] = useState<number>(contract?.replacementDays || 2);
  const [jurisdictionCourt, setJurisdictionCourt] = useState<string>(contract?.jurisdictionCourt || 'الرياض');
  const [monthlyRent, setMonthlyRent] = useState<number>(contract?.monthlyPrice || 18000);

  const [witness1Name, setWitness1Name] = useState(contract?.witness1Name || 'سعود بن عبدالعزيز الشمري');
  const [witness1ID, setWitness1ID] = useState(contract?.witness1NationalId || '1089234561');
  const [witness2Name, setWitness2Name] = useState(contract?.witness2Name || 'خالد بن فهد الدوسري');
  const [witness2ID, setWitness2ID] = useState(contract?.witness2NationalId || '1098472615');

  // React to contract changes
  React.useEffect(() => {
    if (contract) {
      setLessorName(contract.lessorCompanyName || settings.organizationName || 'شركة الأسطول الذهبي لتأجير السيارات');
      setLessorCR(contract.lessorCR || settings.commercialRegistration || settings.taxId || '1010987654');
      setLessorAddress(contract.lessorAddress || settings.address || 'الرياض - حي الملز - شارع الستين');
      setLessorRep(contract.lessorRepName || 'عبدالله بن محمد العتيبي');
      setLessorTitle(contract.lessorRepTitle || 'الرئيس التنفيذي');

      setTenantName(contract.companyName || 'شركة التقنية المتقدمة للحلول الرقمية');
      setTenantCR(contract.companyCR || contract.companyTaxId || '1010345678');
      setTenantAddress(contract.companyAddress || 'الرياض - واجهة الرياض للأعمال');
      setTenantRep(contract.companyRepName || contract.contactPerson || 'مهندس/ أحمد السعيد');
      setTenantTitle(contract.companyRepTitle || 'مدير الموارد البشرية والعمليات');

      setReplacementDays(contract.replacementDays || 2);
      setJurisdictionCourt(contract.jurisdictionCourt || 'الرياض');
      setMonthlyRent(contract.monthlyPrice || 18000);

      setWitness1Name(contract.witness1Name || 'سعود بن عبدالعزيز الشمري');
      setWitness1ID(contract.witness1NationalId || '1089234561');
      setWitness2Name(contract.witness2Name || 'خالد بن فهد الدوسري');
      setWitness2ID(contract.witness2NationalId || '1098472615');
    }
  }, [contract, settings]);

  if (!isOpen || !contract) return null;

  const handlePrint = () => {
    triggerBrowserPrint('printable-corporate-b2b-contract');
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    await exportElementToPdf('printable-corporate-b2b-contract', `Corporate-B2B-Lease-${contract.contractNumber}.pdf`);
    setIsExportingPdf(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 60));
  const handleZoomReset = () => setZoom(100);

  const defaultVehiclesList = contract.vehicles && contract.vehicles.length > 0 ? contract.vehicles : [
    { carType: 'تويوتا كامري أوتوماتيك', model: '2024', plateNumber: 'أ ب ج 1234', chassisNumber: 'JTD1837482910384', engineNumber: 'ENG-98273', monthlyRate: Math.round((contract.monthlyPrice || 18000) / (contract.fleetSize || 2)) },
    { carType: 'هيونداي H1 حافلة نقل موظفين', model: '2023', plateNumber: 'د هـ و 5678', chassisNumber: 'KNA982736192837', engineNumber: 'ENG-44512', monthlyRate: Math.round((contract.monthlyPrice || 18000) / (contract.fleetSize || 2)) }
  ];

  const currentDateFormatted = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden print:p-0 print:static print:bg-transparent print:overflow-visible print:h-auto print:block print:inset-auto">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl w-full border border-slate-800 flex flex-col h-[95vh] max-h-[95vh] overflow-hidden transition-all duration-200 print:max-h-none print:h-auto print:overflow-visible print:shadow-none print:border-none print:my-0 print:w-full print:max-w-none print:rounded-none max-w-5xl my-auto">
        
        {/* Top Control Bar */}
        <div className="flex-none print:hidden flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b border-slate-800 bg-slate-950 text-white rounded-t-2xl shadow-md z-30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-xs sm:text-base tracking-wide">
                  عقد إيجار سيارات بين شركتين (B2B) - {contract.contractNumber}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  نموذج رسمي معتمد
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                عقد قانوني شامل لجميع البنود والالتزامات وجدول المركبات بين الشركتين
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditable(!isEditable)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                isEditable
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
              title="تعديل بيانات الطرفين والبنود يدوياً قبل الطباعة"
            >
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>{isEditable ? 'إغلاق التعديل' : 'تعديل البيانات يدوياً'}</span>
            </button>

            {/* Font & Input Size Scale - Manual Numeric Typing */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-[11px] text-amber-400 font-bold whitespace-nowrap">حجم الخط:</span>
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
              <span className="text-[11px] text-blue-400 font-bold whitespace-nowrap">حجم الورقة:</span>
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
                <button onClick={handleZoomOut} className="p-1 text-slate-300 hover:text-white rounded-lg">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleZoomReset} title="إعادة ضبط" className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button onClick={handleZoomIn} className="p-1 text-slate-300 hover:text-white rounded-lg">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

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
                  ? 'إزالة العلامة المائية (SHAKER MOTORS)'
                  : 'وضع العلامة المائية (SHAKER MOTORS)'
              }
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                showWatermark
                  ? 'bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border-purple-500/50 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${showWatermark ? 'text-purple-400' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">
                {showWatermark ? 'علامة مائية: مفعلة' : 'بدون علامة مائية'}
              </span>
            </button>

            {/* Print Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              title="إعدادات الطباعة"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 transition"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">إعدادات الطباعة</span>
            </button>

            {/* Word Export Button */}
            <button
              onClick={() =>
                exportCorporateContractToWord({
                  contract,
                  settings,
                  lang,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-blue-100 border border-blue-600/50 rounded-xl font-bold text-xs shadow-xs transition"
              title="تصدير العقد بصيغة Microsoft Word (.doc) للتعديل"
            >
              <Download className="w-4 h-4 text-blue-300" />
              <span>تصدير وورد (Word)</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'جاري التصدير...' : 'تحميل PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة العقد</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Edit Panel overlay if enabled */}
        {isEditable && (
          <div className="bg-slate-800 p-3 border-b border-slate-700 text-xs grid grid-cols-1 md:grid-cols-3 gap-3 print:hidden">
            <div className="space-y-1">
              <span className="font-bold text-amber-400">الطرف الأول (المؤجر):</span>
              <input type="text" value={lessorName} onChange={(e) => setLessorName(e.target.value)} placeholder="اسم شركة المؤجر" className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
              <input type="text" value={lessorCR} onChange={(e) => setLessorCR(e.target.value)} placeholder="السجل التجاري للمؤجر" className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
              <input type="text" value={lessorAddress} onChange={(e) => setLessorAddress(e.target.value)} placeholder="العنوان" className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
              <div className="flex gap-1">
                <input type="text" value={lessorRep} onChange={(e) => setLessorRep(e.target.value)} placeholder="الممثل" className="w-1/2 p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
                <input type="text" value={lessorTitle} onChange={(e) => setLessorTitle(e.target.value)} placeholder="صفته" className="w-1/2 p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-blue-400">الطرف الثاني (المستأجر):</span>
              <input type="text" value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="اسم شركة المستأجر" className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
              <input type="text" value={tenantCR} onChange={(e) => setTenantCR(e.target.value)} placeholder="السجل التجاري للمستأجر" className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
              <input type="text" value={tenantAddress} onChange={(e) => setTenantAddress(e.target.value)} placeholder="العنوان" className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
              <div className="flex gap-1">
                <input type="text" value={tenantRep} onChange={(e) => setTenantRep(e.target.value)} placeholder="الممثل" className="w-1/2 p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
                <input type="text" value={tenantTitle} onChange={(e) => setTenantTitle(e.target.value)} placeholder="صفته" className="w-1/2 p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-emerald-400">بيانات القيمة والأحكام:</span>
              <div className="flex gap-1">
                <input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(Number(e.target.value))} placeholder="القيمة الشهرية" className="w-1/2 p-1 bg-slate-900 border border-slate-700 rounded text-slate-200 font-bold" />
                <input type="number" value={replacementDays} onChange={(e) => setReplacementDays(Number(e.target.value))} placeholder="أيام السيارة البديلة" className="w-1/2 p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
              </div>
              <input type="text" value={jurisdictionCourt} onChange={(e) => setJurisdictionCourt(e.target.value)} placeholder="محكمة الاختصاص" className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
              <div className="flex gap-1">
                <input type="text" value={witness1Name} onChange={(e) => setWitness1Name(e.target.value)} placeholder="الشاهد 1" className="w-1/2 p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
                <input type="text" value={witness2Name} onChange={(e) => setWitness2Name(e.target.value)} placeholder="الشاهد 2" className="w-1/2 p-1 bg-slate-900 border border-slate-700 rounded text-slate-200" />
              </div>
            </div>
          </div>
        )}

        {/* Contract Paper Display Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/50 print:p-0 print:bg-white print:overflow-visible">
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .b2b-page-1 {
                page-break-before: auto !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                height: 275mm !important;
                box-sizing: border-box !important;
                padding: 6mm 8mm !important;
              }
              .b2b-page-2 {
                page-break-before: always !important;
                break-before: page !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                height: 275mm !important;
                box-sizing: border-box !important;
                padding: 6mm 8mm !important;
              }
            }
          `}</style>
          <div
            id="printable-corporate-b2b-contract"
            style={{
              zoom: zoom / 100,
              fontSize: `${fontScale}%`,
              ['--print-font-size' as any]: `${(fontScale / 100) * 8.5}pt`,
            }}
            className="bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 max-w-4xl mx-auto transition-transform duration-150 print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full font-serif text-right rtl"
          >
            {/* ========================================================= */}
            {/* PAGE 1: Parties, Preamble, Fleet Schedule, Terms 1 to 5   */}
            {/* ========================================================= */}
            <div className="b2b-page-1 print-page-frame relative p-5 sm:p-7 space-y-2 bg-white rounded-t-lg print:rounded-none flex flex-col justify-between min-h-[268mm]">
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
                      fontSize: '50pt',
                      transform: 'rotate(-28deg)',
                      fontFamily: 'Arial, Tahoma, sans-serif',
                    }}
                  >
                    {watermarkText || 'SHAKER MOTORS'}
                  </div>
                  <div
                    className="contract-watermark-subtext font-bold text-slate-800 uppercase whitespace-nowrap select-none tracking-widest"
                    style={{
                      fontSize: '13pt',
                      transform: 'rotate(-28deg)',
                      fontFamily: 'Arial, Tahoma, sans-serif',
                      marginTop: '12px',
                    }}
                  >
                    ★ عقد إيجار شركات معتمد ★
                  </div>
                </div>
              )}

              <div className="relative z-10 space-y-2 flex-1 flex flex-col justify-between">
                {/* Header / Brand */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                  <div className="flex items-center gap-3">
                    {settings.logoUrl && (
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        className="w-12 h-12 object-cover rounded-lg border border-slate-300 shadow-xs"
                      />
                    )}
                    <div>
                      <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                        {settings.organizationName || 'شركة شاکر موتورز لتأجير السيارات'}
                      </h1>
                      <p className="text-[11px] text-slate-700 mt-0.5">
                        سجل تجاري: <span className="font-mono font-bold">{settings.commercialRegistration || settings.taxId || '1010987654'}</span> | هاتف: <span className="font-mono font-bold">{settings.contactPhone || '011-2345678'}</span>
                      </p>
                      <p className="text-[10px] text-slate-600">{settings.address || 'المملكة العربية السعودية - الرياض'}</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="inline-block border-2 border-slate-900 text-slate-950 px-3 py-1 rounded-xl font-black text-xs uppercase bg-slate-100 shadow-xs">
                      📑 عقد إيجار سيارات شركات (B2B)
                    </div>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                      رقم العقد: <span className="text-blue-900 font-black">{contract.contractNumber}</span>
                    </p>
                    <p className="text-[10px] text-slate-600">التاريخ: {contract.startDate || currentDateFormatted}</p>
                  </div>
                </div>

                {/* Intro Header */}
                <div className="text-center font-bold text-[11px] text-slate-900 bg-slate-100/90 py-1 px-2 rounded-lg border border-slate-300 shadow-2xs">
                  أنه في يوم ({new Date(contract.startDate || Date.now()).toLocaleDateString('ar-EG', { weekday: 'long' })}) الموافق ({contract.startDate || currentDateFormatted}) تم الاتفاق والتراضي بين كلٍّ من:
                </div>

                {/* Two Parties Details Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border border-slate-300 rounded-xl p-2.5 bg-slate-50/70 shadow-2xs">
                  {/* Party 1 */}
                  <div className="space-y-1 border-l rtl:border-l sm:rtl:border-l ltr:border-r pl-2.5">
                    <div className="font-black text-xs text-emerald-950 border-b border-emerald-300 pb-0.5 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-800" />
                        <span>الطرف الأول (المؤجر):</span>
                      </div>
                      <span className="text-[9px] bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.2 rounded">المؤجر</span>
                    </div>
                    <p className="text-[11px]"><span className="font-bold text-slate-600">الشركة:</span> <span className="font-black text-slate-900">{lessorName}</span></p>
                    <p className="text-[10px]"><span className="font-bold text-slate-600">السجل التجاري:</span> <span className="font-bold font-mono text-slate-900">{lessorCR}</span></p>
                    <p className="text-[10px]"><span className="font-bold text-slate-600">العنوان:</span> {lessorAddress}</p>
                    <p className="text-[10px]"><span className="font-bold text-slate-600">ويمثلها:</span> <span className="font-bold text-slate-900">{lessorRep}</span> بصفته (<span className="font-bold text-slate-800">{lessorTitle}</span>)</p>
                  </div>

                  {/* Party 2 */}
                  <div className="space-y-1">
                    <div className="font-black text-xs text-blue-950 border-b border-blue-300 pb-0.5 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-blue-800" />
                        <span>الطرف الثاني (المستأجر):</span>
                      </div>
                      <span className="text-[9px] bg-blue-100 text-blue-900 font-bold px-1.5 py-0.2 rounded">المستأجر</span>
                    </div>
                    <p className="text-[11px]"><span className="font-bold text-slate-600">الشركة:</span> <span className="font-black text-slate-900">{tenantName}</span></p>
                    <p className="text-[10px]"><span className="font-bold text-slate-600">السجل التجاري:</span> <span className="font-bold font-mono text-slate-900">{tenantCR}</span></p>
                    <p className="text-[10px]"><span className="font-bold text-slate-600">العنوان:</span> {tenantAddress}</p>
                    <p className="text-[10px]"><span className="font-bold text-slate-600">ويمثلها:</span> <span className="font-bold text-slate-900">{tenantRep}</span> بصفته (<span className="font-bold text-slate-800">{tenantTitle}</span>)</p>
                  </div>
                </div>

                {/* Preamble / تمهيد */}
                <div className="space-y-0.5 text-xs text-justify bg-slate-50 p-2 rounded-lg border border-slate-200 leading-relaxed shadow-2xs">
                  <h4 className="font-black text-[11px] text-slate-900 uppercase">تمهيد:</h4>
                  <p className="text-slate-800 text-[10.5px]">
                    حيث إن الطرف الأول شركة مرخصة ومتخصصة في تأجير المركبات وتمتلك أسطولاً من السيارات الحديثة المجهزة، وحيث إن الطرف الثاني شركة ترغب في استئجار أسطول سيارات لأداء أعمالها التشغيلية واللوجستية وخدمة موظفيها، وبعد إقرار الطرفين بأهليتهما المعتبرة شرعاً ونظاماً للتعاقد، فقد تلاقت الإرادتان على إبرام هذا العقد المكون من صفحتين والملزم لكلا الطرفين وفقاً للبنود والشروط التالية:
                  </p>
                </div>

                {/* Clause 1 & Fleet Table */}
                <div className="space-y-1 text-xs leading-relaxed text-slate-800">
                  <h4 className="font-black text-xs text-slate-900 border-b border-slate-300 pb-0.5 flex items-center justify-between">
                    <span>البند الأول – موضوع العقد ومدة الإيجار والتجديد:</span>
                    <span className="text-[10.5px] font-bold text-blue-900 font-mono">
                      من ({contract.startDate}) إلى ({contract.endDate})
                    </span>
                  </h4>
                  <p className="text-justify text-[10.5px]">
                    أجر الطرف الأول للطرف الثاني بموجب هذا العقد أسطول المركبات الموضحة تفاصيلها ومواصفاتها في الجدول أدناه لاستخدامها في أغراض الشركة الرسمية والمشروعة، وتسري مدة الإيجار اعتباراً من تاريخ الاستلام الفعلي وحتى نهاية العقد، وتجدد تلقائياً لمدد مماثلة ما لم يخطر أحد الطرفين الآخر كتابياً بعدم الرغبة بالتجديد قبل (30) يوماً من انتهائه.
                  </p>

                  {/* Vehicles Schedule Table */}
                  <div className="overflow-x-auto my-1 rounded border border-slate-400">
                    <table className="w-full text-[10px] text-center border-collapse">
                      <thead>
                        <tr className="bg-slate-200 font-black text-slate-900">
                          <th className="p-1 border border-slate-300">م</th>
                          <th className="p-1 border border-slate-300">نوع وفئة السيارة</th>
                          <th className="p-1 border border-slate-300">الموديل</th>
                          <th className="p-1 border border-slate-300">رقم اللوحة</th>
                          <th className="p-1 border border-slate-300">رقم الشاسيه (VIN)</th>
                          <th className="p-1 border border-slate-300">رقم المحرك</th>
                          <th className="p-1 border border-slate-300">الإيجار الشهري</th>
                        </tr>
                      </thead>
                      <tbody>
                        {defaultVehiclesList.map((v, i) => (
                          <tr key={i} className="hover:bg-slate-50 bg-white">
                            <td className="p-1 border border-slate-300 font-bold">{i + 1}</td>
                            <td className="p-1 border border-slate-300 font-bold text-slate-900">{v.carType}</td>
                            <td className="p-1 border border-slate-300">{v.model}</td>
                            <td className="p-1 border border-slate-300 font-mono font-bold text-blue-900">{v.plateNumber}</td>
                            <td className="p-1 border border-slate-300 font-mono text-[9px]">{v.chassisNumber || '—'}</td>
                            <td className="p-1 border border-slate-300 font-mono text-[9px]">{v.engineNumber || '—'}</td>
                            <td className="p-1 border border-slate-300 font-bold text-emerald-900">
                              {formatCurrency(v.monthlyRate, settings.currency, lang)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Clause 2 */}
                <div className="space-y-0.5">
                  <h4 className="font-black text-xs text-slate-900 border-b border-slate-300 pb-0.5">البند الثاني – القيمة الإيجارية وطريقة ومواعيد السداد:</h4>
                  <p className="text-justify text-[10.5px]">
                    القيمة الإيجارية الشهرية الإجمالية لأسطول المركبات هي (<span className="font-black text-emerald-900 font-mono">{formatCurrency(monthlyRent, settings.currency, lang)}</span>) غير شاملة ضريبة القيمة المضافة ما لم يذكر خلاف ذلك، وتلتزم الشركة المستأجرة بسداد القيمة مقدماً في بداية كل شهر ميلادي بموجب تحويل بنكي رسمي إلى حساب المؤجر المعتمد، وتصدر فاتورة ضريبية إلكترونية فور التحصيل.
                  </p>
                </div>

                {/* Clause 3 */}
                <div className="space-y-0.5">
                  <h4 className="font-black text-xs text-slate-900 border-b border-slate-200 pb-0.5">البند الثالث – التزامات الطرف الأول (المؤجر):</h4>
                  <ul className="list-disc rtl:pr-4 space-y-0.5 text-[10.5px] text-justify text-slate-800">
                    <li>تسليم السيارات بحالة ميكانيكية وفنية ممتازة ونظيفة ومجهزة بجميع وثائق ورخص السير الرسمية سارية المفعول وبطاقات التشغيل.</li>
                    <li>تحمل تكاليف تجديد رخص السير السنوية والفحص الفني الدوري والضرائب النظامية المقررة على ملكية المركبات والتأمين الشامل.</li>
                  </ul>
                </div>

                {/* Clause 4 */}
                <div className="space-y-0.5">
                  <h4 className="font-black text-xs text-slate-900 border-b border-slate-200 pb-0.5">البند الرابع – التزامات الطرف الثاني (المستأجر):</h4>
                  <ul className="list-disc rtl:pr-4 space-y-0.5 text-[10.5px] text-justify text-slate-800">
                    <li>استخدام السيارات في الأغراض الرسمية المرخصة للشركة وبواسطة سائقيها وموظفيها الحاملين لرخص قيادة سارية ومعتمدة نظاماً.</li>
                    <li>يحظر تأجير المركبات للغير من الباطن أو التنازل عن العقد أو رهنها أو استخدامها في السباقات أو نقل المواد الممنوعة والمحظورة.</li>
                    <li>تحمل تكاليف استهلاك الوقود والغسيل وكافة المخالفات المرورية المسجلة على المركبات خلال فترة سريان العقد وتفويض القيادة.</li>
                  </ul>
                </div>

                {/* Clause 5 */}
                <div className="space-y-0.5">
                  <h4 className="font-black text-xs text-slate-900 border-b border-slate-200 pb-0.5">البند الخامس – الصيانة الدورية وقطع الغيار والتلفيات:</h4>
                  <p className="text-justify text-[10.5px]">
                    يتحمل الطرف الأول تكاليف الصيانة الدورية المجدولة (الزيوت، الفلاتر، فحمات الفرامل، والإطارات الاستهلاكية) وفق جدول الصيانة المعتمد من الوكيل، ويلتزم الطرف الثاني بإحضار المركبات لمراكز الصيانة المعتمدة فور استحقاق موعد الصيانة، ويتحمل المستأجر أي أضرار ناتجة عن الإهمال أو التشغيل الخاطئ.
                  </p>
                </div>
              </div>

              {/* Page 1 Footer */}
              <div className="flex items-center justify-between text-[9.5px] text-slate-600 pt-2 border-t-2 border-slate-900 font-mono mt-auto relative z-10">
                <span>عقد إيجار شركات (B2B) - رقم: {contract.contractNumber}</span>
                <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">الصفحة (1) من (2)</span>
                <span>ختم المؤجر: ....................</span>
                <span>ختم المستأجر: ....................</span>
              </div>
            </div>

            {/* ========================================================= */}
            {/* PAGE 2: Legal Terms, Jurisdiction, Signatures & Witnesses */}
            {/* ========================================================= */}
            <div className="b2b-page-2 print-page-frame relative p-5 sm:p-7 space-y-2 bg-white border-t sm:border-t-2 border-slate-300 print:border-none rounded-b-lg print:rounded-none flex flex-col justify-between min-h-[268mm]">
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
                      fontSize: '50pt',
                      transform: 'rotate(-28deg)',
                      fontFamily: 'Arial, Tahoma, sans-serif',
                    }}
                  >
                    {watermarkText || 'SHAKER MOTORS'}
                  </div>
                  <div
                    className="contract-watermark-subtext font-bold text-slate-800 uppercase whitespace-nowrap select-none tracking-widest"
                    style={{
                      fontSize: '13pt',
                      transform: 'rotate(-28deg)',
                      fontFamily: 'Arial, Tahoma, sans-serif',
                      marginTop: '12px',
                    }}
                  >
                    ★ عقد إيجار شركات معتمد ★
                  </div>
                </div>
              )}

              <div className="relative z-10 space-y-2 flex-1 flex flex-col justify-between">
                {/* Mini Running Header */}
                <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-900 text-xs">
                  <span className="font-black text-slate-900">عقد إيجار شركات (B2B) - رقم العقد: <span className="font-mono text-blue-900 font-black">{contract.contractNumber}</span></span>
                  <span className="text-slate-700 text-[11px] font-bold">الطرفان: ({lessorName}) و ({tenantName})</span>
                  <span className="text-slate-700 text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">الصفحة (2) من (2)</span>
                </div>

                {/* Clauses 6 to 16 */}
                <div className="space-y-1.5 text-xs leading-relaxed text-slate-800">
                  {/* Clause 6 */}
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs text-slate-900 border-b border-slate-200 pb-0.5">البند السادس – السيارة البديلة والشروط الزمنية:</h4>
                    <p className="text-justify text-[10.5px]">
                      في حال تعطل أي سيارة لأكثر من 24 ساعة بسبب عطل ميكانيكي أو صيانة دورية أو حادث غير ناتج عن إهمال جسيم من السائق، يلتزم الطرف الأول بتوفير سيارة بديلة من نفس الفئة أو أعلى خلال (<span className="font-black text-blue-900">{replacementDays}</span>) أيام عمل من تاريخ الإبلاغ، وإلا تم تعليق وخصم القيمة الإيجارية اليومية عن فترة التوقف.
                    </p>
                  </div>

                  {/* Clause 7 */}
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs text-slate-900 border-b border-slate-200 pb-0.5">البند السابع – التأمين الشامل وإجراءات الحوادث:</h4>
                    <p className="text-justify text-[10.5px]">
                      يلتزم الطرف الأول بإبقاء سيارات الأسطول مشمولة بتأمين شامل سارٍ طوال مدة العقد. وفي حالة وقوع حادث مروري أو سرقة، يلتزم الطرف الثاني بإشعار الجهات الرسمية فوراً (المرور / نجم / الشرطة) وتزويد المؤجر بنسخة التقرير الرسمي خلال 48 ساعة لمتابعة إجراءات التعويض والإصلاح المعتمد.
                    </p>
                  </div>

                  {/* Clause 8 */}
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs text-slate-900 border-b border-slate-200 pb-0.5">البند الثامن – الكيلومترات المسموحة والنطاق الجغرافي:</h4>
                    <p className="text-justify text-[10.5px]">
                      الحد الأقصى للكيلومترات الشهرية المتاحة لكل سيارة هو (3,500 كم شهرياً)، وتحتسب الكيلومترات الإضافية الزائدة بقيمة محددة في الملحق. ويحق للمستأجر قيادة واستخدام المركبات في كافة أرجاء الدولة، مع حظر السفر بها خارج الحدود الدولية دون تفويض خطي مسبق وتربترك وتصريح سفر سياحي مصدق.
                    </p>
                  </div>

                  {/* Clause 9 */}
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs text-slate-900 border-b border-slate-200 pb-0.5">البند التاسع – محاضر الاستلام والفحص المشترك:</h4>
                    <p className="text-justify text-[10.5px]">
                      يوقع الطرفان محضر فحص واستلام فني رسمي لكل مركبة عند بدء الإيجار وعند الإعادة، يوضح قراءة عداد الكيلومترات، مستوى الوقود، وحالة الهيكل الخارجي والإطارات والمحتويات الداخلية، ويعد المحضر حجة رسمية قاطعة وملزمة للطرفين على حالة السيارة.
                    </p>
                  </div>

                  {/* Clause 10 */}
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs text-slate-900 border-b border-slate-200 pb-0.5">البند العاشر – المخالفات المرورية ورسوم بوابات التعرفة:</h4>
                    <p className="text-justify text-[10.5px]">
                      يتحمل الطرف الثاني كامل المسؤولية المدنية والمالية عن جميع المخالفات المرورية ورسوم بوابات الطرق والمواقف المسجلة على المركبات خلال فترة سريان العقد وتفويض القيادة، ويلتزم بسدادها للمؤجر فور إشعاره بها أو خصمها من الدفعات والضمان.
                    </p>
                  </div>

                  {/* Clause 11 */}
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs text-slate-900 border-b border-slate-200 pb-0.5">البند الحادي عشر – الفسخ والإنهاء المبكر وسحب المركبات:</h4>
                    <p className="text-justify text-[10.5px]">
                      يحق للطرف الأول فسخ العقد واسترداد المركبات فوراً دون الحاجة إلى إنذار قضائي في حال تأخر المستأجر عن سداد الأجرة لأكثر من (15) يوماً من تاريخ الاستحقاق أو استعمال المركبات في أغراض غير مشروعة. كما يحق للمستأجر الفسخ في حال إخلال المؤجر بتقديم الصيانة أو توفير السيارة البديلة.
                    </p>
                  </div>

                  {/* Clause 12, 13, 14, 15, 16 in clean balanced grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-0.5 bg-slate-50/70 p-1.5 rounded border border-slate-200">
                      <h4 className="font-black text-[11px] text-slate-900 border-b border-slate-200 pb-0.5">البند الثاني عشر – القوة القاهرة:</h4>
                      <p className="text-justify text-[10px]">
                        لا يعتبر أي طرف مخلاً بالتزاماته إذا تعذر تنفيذها كلياً أو جزئياً لظروف قاهرة أو قرارات سيادية أو كوارث طبيعية، ويتم التفاهم ودياً على التسوية المنصفة.
                      </p>
                    </div>
                    <div className="space-y-0.5 bg-slate-50/70 p-1.5 rounded border border-slate-200">
                      <h4 className="font-black text-[11px] text-slate-900 border-b border-slate-200 pb-0.5">البند الثالث عشر – سرية البيانات:</h4>
                      <p className="text-justify text-[10px]">
                        يلتزم الطرفان بالمحافظة التامة على سرية البيانات والمعلومات التجارية والتشغيلية وأسماء السائقين المتبادلة وعدم إفشائها لأي طرف ثالث.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-0.5 bg-slate-50/70 p-1.5 rounded border border-slate-200">
                    <h4 className="font-black text-[11px] text-slate-900 border-b border-slate-200 pb-0.5">البنود الرابع عشر والخامس عشر والسادس عشر – الإخطارات والاختصاص القضائي ونسخ العقد:</h4>
                    <p className="text-justify text-[10px]">
                      تعتبر العناوين الموضحة بصدر العقد موطناً مختاراً للإخطارات الرسمية والمراسلات. وتختص المحاكم التجارية بمدينة (<span className="font-black text-slate-900">{jurisdictionCourt}</span>) بالفصل في أي نزاع ينشأ عن تنفيذ أو تفسير هذا العقد. وحرر هذا العقد من صفحتين ومن نسختين أصليتين متطابقتين، بيد كل طرف نسخة للعمل بموجبها وتعتبر نافذة بمجرد التوقيع والختم.
                    </p>
                  </div>
                </div>

                {/* Signatures & Witnesses Section */}
                <div className="pt-2 border-t-2 border-slate-900 space-y-2 print:break-inside-avoid">
                  <div className="grid grid-cols-2 gap-3 text-center text-xs">
                    <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-300 shadow-2xs">
                      <p className="font-black text-slate-900">الطرف الأول (المؤجر):</p>
                      <p className="font-bold text-slate-800 text-[10.5px]">{lessorName}</p>
                      <p className="text-[10px] text-slate-600">الممثل: {lessorRep} ({lessorTitle})</p>
                      <div className="h-10 border-b border-dashed border-slate-400 mx-2 flex items-end justify-center pb-0.5">
                        <span className="text-[9px] text-slate-400">التوقيع والختم الرسمي للشركة</span>
                      </div>
                    </div>

                    <div className="space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-300 shadow-2xs">
                      <p className="font-black text-slate-900">الطرف الثاني (المستأجر):</p>
                      <p className="font-bold text-slate-800 text-[10.5px]">{tenantName}</p>
                      <p className="text-[10px] text-slate-600">الممثل: {tenantRep} ({tenantTitle})</p>
                      <div className="h-10 border-b border-dashed border-slate-400 mx-2 flex items-end justify-center pb-0.5">
                        <span className="text-[9px] text-slate-400">التوقيع والختم الرسمي للشركة</span>
                      </div>
                    </div>
                  </div>

                  {/* Witnesses Block */}
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-300 text-xs space-y-1 shadow-2xs">
                    <h5 className="font-black text-slate-900 text-center text-[10.5px]">إقرار وتوقيع الشهود:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                      <div className="space-y-0.5 border-l rtl:border-l pl-2">
                        <p><span className="font-bold text-slate-600">الشاهد الأول:</span> <span className="font-bold text-slate-900">{witness1Name}</span></p>
                        <p><span className="font-bold text-slate-600">رقم الهوية:</span> <span className="font-mono font-bold text-slate-900">{witness1ID}</span></p>
                        <p><span className="font-bold text-slate-600">التوقيع:</span> ....................................</p>
                      </div>

                      <div className="space-y-0.5">
                        <p><span className="font-bold text-slate-600">الشاهد الثاني:</span> <span className="font-bold text-slate-900">{witness2Name}</span></p>
                        <p><span className="font-bold text-slate-600">رقم الهوية:</span> <span className="font-mono font-bold text-slate-900">{witness2ID}</span></p>
                        <p><span className="font-bold text-slate-600">التوقيع:</span> ....................................</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 2 Footer */}
              <div className="flex items-center justify-between text-[9.5px] text-slate-600 pt-2 border-t-2 border-slate-900 font-mono mt-auto relative z-10">
                <span>حرر في: {currentDateFormatted}</span>
                <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">الصفحة (2) من (2) — النسخة الأصلية المعتمدة</span>
                <span>عقد إيجار شركات B2B</span>
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
