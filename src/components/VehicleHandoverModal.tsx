import React, { useState, useEffect } from 'react';
import { X, Printer, Camera, Fingerprint as FingerprintIcon, ShieldCheck, FileCheck, FileText, User, Car as CarIcon, CheckSquare, Save, Settings, Download, Sparkles } from 'lucide-react';
import { AppSettings, Customer, Car as CarType, VehicleHandoverReceipt, Language } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { FingerprintCaptureModal } from './FingerprintCaptureModal';
import { SignaturePad } from './SignaturePad';
import { PrintSettingsModal } from './PrintSettingsModal';
import { getSavedPrintSettings, savePrintSettings, applyPrintSettingsToDOM, getFontScalePercentage } from '../utils/printSettings';
import { exportElementToPdf, triggerBrowserPrint } from '../utils/pdfExport';
import { exportVehicleHandoverToWord } from '../utils/wordExport';

interface VehicleHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  cars: CarType[];
  settings: AppSettings;
  lang: Language;
  onSaveHandover?: (receipt: VehicleHandoverReceipt) => void;
  initialData?: VehicleHandoverReceipt | null;
  isBlank?: boolean;
}

export const VehicleHandoverModal: React.FC<VehicleHandoverModalProps> = ({
  isOpen,
  onClose,
  customers,
  cars,
  settings,
  lang,
  onSaveHandover,
  initialData,
  isBlank = false,
}) => {
  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialData?.customerId || '');
  const [selectedCarId, setSelectedCarId] = useState(initialData?.carId || '');
  const [isBlankMode, setIsBlankMode] = useState<boolean>(isBlank);

  // Recipient details
  const [recipientName, setRecipientName] = useState(initialData?.recipientName || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [nationalId, setNationalId] = useState(initialData?.nationalId || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [customerPhotoUrl, setCustomerPhotoUrl] = useState(initialData?.customerPhotoUrl || '');
  const [customerSignature, setCustomerSignature] = useState(initialData?.customerSignature || '');
  const [customerFingerprint, setCustomerFingerprint] = useState(initialData?.customerFingerprint || '');

  // Vehicle details
  const [carPlate, setCarPlate] = useState(initialData?.carPlate || '');
  const [carBrand, setCarBrand] = useState(initialData?.carBrand || '');
  const [carModel, setCarModel] = useState(initialData?.carModel || '');
  const [carChassis, setCarChassis] = useState(initialData?.carChassis || '');
  const [carColor, setCarColor] = useState(initialData?.carColor || '');

  // Handover Period
  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonthStr = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(initialData?.fromDate || todayStr);
  const [fromTime, setFromTime] = useState(initialData?.fromTime || '10:00 ص');
  const [toDate, setToDate] = useState(initialData?.toDate || nextMonthStr);
  const [toTime, setToTime] = useState(initialData?.toTime || '10:00 ص');

  // Checklist
  const [checklist, setChecklist] = useState({
    tank: initialData?.checklist?.tank || 'ممتلئ (4/4)',
    tires: initialData?.checklist?.tires || 'ممتازة',
    cassette: initialData?.checklist?.cassette || 'شغال',
    upholstery: initialData?.checklist?.upholstery || 'سليم ونظيف',
    hubcapsCount: initialData?.checklist?.hubcapsCount || '4 طاسات',
    fireExtinguisher: initialData?.checklist?.fireExtinguisher || 'موجودة ومجانية',
    seatsCount: initialData?.checklist?.seatsCount || '5 كراسي',
  });

  const [receiptNumber] = useState(initialData?.receiptNumber || `HND-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [createdAt] = useState(initialData?.createdAt || todayStr);

  // Modals for camera / fingerprint
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isFingerprintOpen, setIsFingerprintOpen] = useState(false);

  const [zoom, setZoom] = useState<number>(100);
  const [fontScale, setFontScale] = useState<number>(100);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('SHAKER MOTORS');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(8);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const printSettings = getSavedPrintSettings();
      applyPrintSettingsToDOM(printSettings);
      setFontScale(getFontScalePercentage(printSettings.fontSize));
      setShowWatermark(printSettings.showWatermark ?? true);
      setWatermarkText(printSettings.watermarkText || 'SHAKER MOTORS');
      setWatermarkOpacity(printSettings.watermarkOpacity ?? 8);
      setIsBlankMode(isBlank ?? false);
    }
  }, [isOpen, isBlank]);

  // Auto-fill customer when dropdown changes
  const handleCustomerSelect = (cId: string) => {
    setSelectedCustomerId(cId);
    const cust = customers.find((c) => c.id === cId);
    if (cust) {
      setRecipientName(cust.name);
      setAddress(cust.address || '');
      setNationalId(cust.nationalId || '');
      setPhone(cust.phone || '');
      if (cust.photoUrl) {
        setCustomerPhotoUrl(cust.photoUrl);
      }
    }
  };

  // Auto-fill car when dropdown changes
  const handleCarSelect = (cId: string) => {
    setSelectedCarId(cId);
    const car = cars.find((c) => c.id === cId);
    if (car) {
      setCarPlate(car.plateNumber);
      setCarBrand(car.brand);
      setCarModel(`${car.model} (${car.year})`);
      setCarChassis(car.chassisNumber || '');
      setCarColor(car.color || '');
    }
  };

  const handlePrint = () => {
    triggerBrowserPrint('printable-handover-receipt');
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    await exportElementToPdf(
      'printable-handover-receipt',
      isBlankMode ? 'Vehicle-Handover-Receipt-Blank-Template.pdf' : `Vehicle-Handover-Receipt-${receiptNumber}.pdf`
    );
    setIsExportingPdf(false);
  };

  const handleSave = () => {
    const newReceipt: VehicleHandoverReceipt = {
      id: initialData?.id || `handover_${Date.now()}`,
      receiptNumber,
      customerId: selectedCustomerId,
      recipientName,
      address,
      nationalId,
      phone,
      customerPhotoUrl,
      customerSignature,
      customerFingerprint,
      carId: selectedCarId,
      carPlate,
      carBrand,
      carModel,
      carChassis,
      carColor,
      fromDate,
      fromTime,
      toDate,
      toTime,
      checklist,
      createdAt,
    };

    if (onSaveHandover) {
      onSaveHandover(newReceipt);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh] print:max-h-none print:max-w-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Controls Header (Hidden on Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isBlankMode ? 'إقرار استلام سيارة (نموذج فارغ للتعبئة اليدوية)' : 'إقرار استلام سيارة رسمي'}</span>
                {isBlankMode && (
                  <span className="bg-amber-500/30 text-amber-200 border border-amber-400/50 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                    ★ نموذج فارغ
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {isBlankMode
                  ? 'نموذج إقرار استلام معتمد ومفرغ بخانات منقطة للتعبئة بالقلم مع كشف المحتويات والتواقيع الرسمية'
                  : 'مستند استلام رسمي مطبوع في ورقة واحدة شامل كشف المحتويات والشروط القانونية والتوقيعات'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Blank Handover Toggle Button */}
            <button
              type="button"
              onClick={() => setIsBlankMode(!isBlankMode)}
              title={isBlankMode ? 'العودة لبيانات الإقرار' : 'التحويل إلى نموذج فارغ للتعبئة اليدوية والطباعة'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition border shadow-xs ${
                isBlankMode
                  ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 ring-2 ring-amber-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
              }`}
            >
              <FileCheck className="w-4 h-4 text-amber-300" />
              <span>{isBlankMode ? 'نموذج فارغ (مفعل)' : 'طباعة إقرار فارغ'}</span>
            </button>

            {/* Font & Input Size Scale - Manual Numeric Typing */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
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
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
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

            {/* Print Settings Modal Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              title="إعدادات الطباعة وهوامش الصفحة"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 transition"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">إعدادات الطباعة</span>
            </button>

            {/* Export Word (.doc) Button */}
            <button
              type="button"
              onClick={() =>
                exportVehicleHandoverToWord({
                  receipt: {
                    receiptNumber,
                    recipientName,
                    address,
                    nationalId,
                    phone,
                    carPlate,
                    carBrand,
                    carModel,
                    carChassis,
                    carColor,
                    fromDate,
                    fromTime,
                    toDate,
                    toTime,
                    checklist,
                    createdAt,
                  },
                  settings,
                  lang,
                  isBlank: isBlankMode,
                })
              }
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-800 hover:bg-blue-700 text-blue-100 rounded-xl font-bold text-xs shadow-xs transition border border-blue-600/50"
              title="تنزيل الإقرار كملف وورد Microsoft Word (.doc) قابل للتعديل"
            >
              <FileText className="w-4 h-4 text-blue-300" />
              <span>تصدير وورد</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'جاري التصدير...' : 'تحميل PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المستند</span>
            </button>

            {onSaveHandover && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <Save className="w-4 h-4" />
                <span>حفظ في النظام</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Two Columns (Form Editor on side / Print Preview on main) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
          
          {/* Quick Edit Bar / Controls for Interactive Signing & Photo */}
          <div className="mb-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs print:hidden space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Select Customer */}
                <div className="w-48">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">اختيار العميل:</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="">-- عميل جديد أو غير مسجل --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.nationalId || c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Car */}
                <div className="w-48">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">اختيار السيارة:</label>
                  <select
                    value={selectedCarId}
                    onChange={(e) => handleCarSelect(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="">-- اختر السيارة --</option>
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brand} {c.model} - لوحة: {c.plateNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons for Capture */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold border border-blue-200 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>التقاط صورة المستلم</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsFingerprintOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold border border-purple-200 transition"
                >
                  <FingerprintIcon className="w-4 h-4 text-purple-700" />
                  <span>التقاط البصمة</span>
                </button>
              </div>
            </div>

            {/* Quick Field Editors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold text-slate-500">اسم المستلم:</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">رقم البطاقة / الهوية:</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">العنوان:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">رقم اللوحة:</label>
                <input
                  type="text"
                  value={carPlate}
                  onChange={(e) => setCarPlate(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs font-bold text-blue-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">السيارة والموديل:</label>
                <input
                  type="text"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">رقم الشاسيه:</label>
                <input
                  type="text"
                  value={carChassis}
                  onChange={(e) => setCarChassis(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500">اللون:</label>
                <input
                  type="text"
                  value={carColor}
                  onChange={(e) => setCarColor(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">تاريخ الاستلام (من):</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">ساعة الاستلام:</label>
                <input
                  type="text"
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">حتى تاريخ (إلى):</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">ساعة الانتهاء:</label>
                <input
                  type="text"
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500">رقم الهاتف:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-xs"
                />
              </div>
            </div>

            {/* Checklist Editor */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                كشف محتويات السيارة (تعديل سريع):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">التانك</span>
                  <input
                    type="text"
                    value={checklist.tank}
                    onChange={(e) => setChecklist({ ...checklist, tank: e.target.value })}
                    className="w-full px-1.5 py-0.5 border rounded text-[11px]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الكاوتش</span>
                  <input
                    type="text"
                    value={checklist.tires}
                    onChange={(e) => setChecklist({ ...checklist, tires: e.target.value })}
                    className="w-full px-1.5 py-0.5 border rounded text-[11px]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الكاسيت</span>
                  <input
                    type="text"
                    value={checklist.cassette}
                    onChange={(e) => setChecklist({ ...checklist, cassette: e.target.value })}
                    className="w-full px-1.5 py-0.5 border rounded text-[11px]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الفرش</span>
                  <input
                    type="text"
                    value={checklist.upholstery}
                    onChange={(e) => setChecklist({ ...checklist, upholstery: e.target.value })}
                    className="w-full px-1.5 py-0.5 border rounded text-[11px]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">عدد الطاسات</span>
                  <input
                    type="text"
                    value={checklist.hubcapsCount}
                    onChange={(e) => setChecklist({ ...checklist, hubcapsCount: e.target.value })}
                    className="w-full px-1.5 py-0.5 border rounded text-[11px]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">طفاية الحريق</span>
                  <input
                    type="text"
                    value={checklist.fireExtinguisher}
                    onChange={(e) => setChecklist({ ...checklist, fireExtinguisher: e.target.value })}
                    className="w-full px-1.5 py-0.5 border rounded text-[11px]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">عدد الكراسي</span>
                  <input
                    type="text"
                    value={checklist.seatsCount}
                    onChange={(e) => setChecklist({ ...checklist, seatsCount: e.target.value })}
                    className="w-full px-1.5 py-0.5 border rounded text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Signature Drawer in form */}
            <div className="pt-2 border-t border-slate-200">
              <SignaturePad
                label="توقيع المستلم الإلكتروني (حي):"
                onSave={(dataUrl) => setCustomerSignature(dataUrl)}
                initialSignature={customerSignature}
                lang={lang}
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* PRINTABLE DOCUMENT (A4 Single Page Layout - Formatted)    */}
          {/* ========================================================= */}
          <div
            id="printable-handover-receipt"
            style={{
              zoom: zoom / 100,
              fontSize: `${fontScale}%`,
              ['--print-font-size' as any]: `${(fontScale / 100) * 10}pt`,
            }}
            className="print-page-frame relative w-full max-w-[210mm] mx-auto bg-white p-5 sm:p-7 border border-slate-300 rounded-xl shadow-md text-slate-900 font-sans text-sm print:m-0 print:w-full print:max-w-none print:bg-white flex flex-col justify-between"
            dir="rtl"
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
                  ★ إقرار استلام مركبة رسمي ★
                </div>
              </div>
            )}

            <div className="relative z-10 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between pb-3.5 border-b-2 border-slate-900 print:break-inside-avoid">
                <div className="flex items-center gap-3.5">
                  {settings.logoUrl && (
                    <img
                      src={settings.logoUrl}
                      alt="Logo"
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-xs"
                    />
                  )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {settings.organizationName || 'SHAKER MOTORS'}
                    </h1>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      سجل تجاري: <span className="font-bold">{settings.commercialRegistration || settings.taxId || '1010987654'}</span> | هاتف: <span className="font-bold font-mono">{settings.contactPhone || '011-2345678'}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{settings.address || 'المملكة العربية السعودية - الرياض'}</p>
                  </div>
                </div>

                <div className="text-left rtl:text-right flex flex-col items-end">
                  <span className="inline-block px-3.5 py-1 bg-slate-900 text-white font-black text-xs sm:text-sm rounded-lg uppercase mb-1.5 shadow-xs">
                    📑 إقرار استلام سيارة
                  </span>
                  <p className="text-sm font-extrabold text-blue-900 font-mono tracking-wide">{receiptNumber}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">التاريخ: <span className="font-bold text-slate-700">{createdAt}</span></p>
                </div>
              </div>

              {/* Title Badge & Customer Photo / Fingerprint Preview Header */}
              <div className="p-3.5 border border-slate-300 rounded-xl bg-slate-50/80 flex items-center justify-between print:break-inside-avoid shadow-xs">
                <div className="space-y-1 flex-1">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                    <span>إقرار استلام سيارة (مسؤولية مدنية وجنائية كاملة)</span>
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    مستند رسمي محرر طبقاً للأنظمة واللوائح القانونية المعتمدة لعقود إيجار وتسليم المركبات.
                  </p>
                </div>

                {/* Photo & Fingerprint Preview Badges */}
                <div className="flex items-center gap-3 shrink-0 mr-4 rtl:mr-4">
                  {/* Photo Badge */}
                  <div className="text-center">
                    <span className="text-[10px] font-extrabold text-slate-600 block mb-1">صورة المستلم</span>
                    {customerPhotoUrl ? (
                      <img
                        src={customerPhotoUrl}
                        alt="Customer"
                        className="w-14 h-16 object-cover rounded-lg border-2 border-slate-300 shadow-xs"
                      />
                    ) : (
                      <div className="w-14 h-16 bg-slate-200 rounded-lg border-2 border-slate-300 flex items-center justify-center text-slate-400">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Fingerprint Badge */}
                  <div className="text-center">
                    <span className="text-[10px] font-extrabold text-purple-900 block mb-1">بصمة المستأجر</span>
                    <div className="w-14 h-16 bg-purple-50 rounded-lg border-2 border-purple-300 flex items-center justify-center overflow-hidden shadow-xs">
                      {customerFingerprint ? (
                        <img src={customerFingerprint} alt="Fingerprint" className="max-h-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center opacity-70">
                          <svg className="w-7 h-7 text-purple-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 11c-1.1 0-2 .9-2 2 0 2.5 1.8 4.3 3.5 6M8 13c0-2.2 1.8-4 4-4s4 1.8 4 4c0 3.3-2.5 5.7-5 8M6 13c0-3.3 2.7-6 6-6s6 2.7 6 6c0 4.2-3.1 7.2-6.5 10M12 3C6.5 3 2 7.5 2 13c0 3.5 1.5 6.5 4 8.5" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recipient & Vehicle Details Statement Block */}
              <div className="p-4 border border-slate-300 rounded-xl bg-white leading-relaxed text-xs sm:text-[13px] print:break-inside-avoid shadow-xs space-y-2.5">
                <p className="font-black text-blue-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <CarIcon className="w-4 h-4 text-blue-700" />
                  <span>بيانات المستلم والسيارة المستلمة:</span>
                </p>
                <div className="space-y-2 text-slate-800">
                  <p className="leading-loose">
                    <span className="font-bold text-slate-700">أقر أنا الموقع أدناه:</span>{' '}
                    <span className="font-black text-slate-900 underline decoration-slate-400 decoration-1 px-1.5 py-0.5 bg-slate-50 rounded">
                      {recipientName || '..................................................................'}
                    </span>
                    <span className="font-bold text-slate-700 mr-3">وعنواني:</span>{' '}
                    <span className="font-black text-slate-900 underline decoration-slate-400 decoration-1 px-1.5 py-0.5 bg-slate-50 rounded">
                      {address || '..................................................................'}
                    </span>
                    <span className="font-bold text-slate-700 mr-3">رقم البطاقة / الهوية:</span>{' '}
                    <span className="font-black text-slate-900 font-mono underline decoration-slate-400 decoration-1 px-1.5 py-0.5 bg-slate-50 rounded">
                      {nationalId || '....................................'}
                    </span>
                    {phone && (
                      <>
                        <span className="font-bold text-slate-700 mr-3">الهاتف:</span>{' '}
                        <span className="font-black text-slate-900 font-mono px-1.5 py-0.5 bg-slate-50 rounded">{phone}</span>
                      </>
                    )}
                  </p>
                  <p className="leading-loose">
                    <span className="font-bold text-slate-700">بأنني قد استلمت السيارة رقم لوحة:</span>{' '}
                    <span className="font-black text-blue-900 underline decoration-blue-400 decoration-2 px-2 py-0.5 bg-blue-50/70 rounded">
                      {carPlate || '............................'}
                    </span>
                    <span className="font-bold text-slate-700 mr-3">الماركة والموديل:</span>{' '}
                    <span className="font-black text-slate-900 underline decoration-slate-400 decoration-1 px-1.5 py-0.5 bg-slate-50 rounded">
                      {carBrand} {carModel || '............................'}
                    </span>
                    <span className="font-bold text-slate-700 mr-3">رقم الشاسيه:</span>{' '}
                    <span className="font-black text-slate-900 font-mono underline decoration-slate-400 decoration-1 px-1.5 py-0.5 bg-slate-50 rounded">
                      {carChassis || '............................................'}
                    </span>
                    <span className="font-bold text-slate-700 mr-3">اللون:</span>{' '}
                    <span className="font-black text-slate-900 underline decoration-slate-400 decoration-1 px-1.5 py-0.5 bg-slate-50 rounded">
                      {carColor || '....................'}
                    </span>
                  </p>
                  <p className="leading-loose">
                    <span className="font-bold text-slate-700">فترة الاستلام تبدأ من تاريخ:</span>{' '}
                    <span className="font-black text-slate-900 font-mono underline decoration-slate-400 decoration-1 px-1.5 py-0.5 bg-slate-50 rounded">{fromDate}</span>
                    <span className="font-bold text-slate-700 mr-2">الساعة:</span>{' '}
                    <span className="font-black text-slate-900 font-mono underline decoration-slate-400 decoration-1 px-1.5 py-0.5 bg-slate-50 rounded">{fromTime}</span>
                    <span className="font-bold text-slate-700 mr-4">وحتى تاريخ:</span>{' '}
                    <span className="font-black text-slate-900 font-mono underline decoration-slate-400 decoration-1 px-1.5 py-0.5 bg-slate-50 rounded">{toDate}</span>
                    <span className="font-bold text-slate-700 mr-2">الساعة:</span>{' '}
                    <span className="font-black text-slate-900 font-mono underline decoration-slate-400 decoration-1 px-1.5 py-0.5 bg-slate-50 rounded">{toTime}</span>.
                  </p>
                </div>
              </div>

              {/* Car Content Inspection Checklist Table */}
              <div className="p-3.5 border border-slate-300 rounded-xl bg-white print:break-inside-avoid shadow-xs">
                <p className="font-black text-xs sm:text-sm text-slate-900 mb-2 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>كشف حالة ومحتويات السيارة عند الاستلام:</span>
                </p>
                <table className="w-full text-xs border-collapse text-center">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-black border-y border-slate-300 text-xs">
                      <th className="py-2 px-1 border-r border-slate-200">التانك (الوقود)</th>
                      <th className="py-2 px-1 border-r border-slate-200">حالة الكاوتش</th>
                      <th className="py-2 px-1 border-r border-slate-200">الكاسيت والصوتيات</th>
                      <th className="py-2 px-1 border-r border-slate-200">الفرش والداخلية</th>
                      <th className="py-2 px-1 border-r border-slate-200">عدد الطاسات</th>
                      <th className="py-2 px-1 border-r border-slate-200">طفاية الحريق</th>
                      <th className="py-2 px-1">عدد المقاعد</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-bold text-slate-900 text-xs">
                      <td className="py-2 px-1 border-r border-slate-200 bg-slate-50 font-black text-blue-900">{checklist.tank}</td>
                      <td className="py-2 px-1 border-r border-slate-200">{checklist.tires}</td>
                      <td className="py-2 px-1 border-r border-slate-200 bg-slate-50">{checklist.cassette}</td>
                      <td className="py-2 px-1 border-r border-slate-200">{checklist.upholstery}</td>
                      <td className="py-2 px-1 border-r border-slate-200 bg-slate-50">{checklist.hubcapsCount}</td>
                      <td className="py-2 px-1 border-r border-slate-200">{checklist.fireExtinguisher}</td>
                      <td className="py-2 px-1 bg-slate-50">{checklist.seatsCount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Legal Conditions & Responsibility Text */}
              <div className="p-4 border border-slate-300 rounded-xl bg-slate-50/70 text-xs sm:text-[12.5px] leading-relaxed space-y-1.5 print:break-inside-avoid shadow-xs">
                <p className="font-black text-slate-900 text-sm border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>الشروط والتعهدات القانونية الملزمة:</span>
                </p>
                <div className="space-y-1 text-slate-800 text-justify">
                  <p>
                    <span className="font-black text-slate-900">١. الحالة الفنية والسلامة:</span> أقر بأنني استلمت السيارة الموضحة أعلاه بحالة فنية وميكانيكية ممتازة وخالية من العيوب وصالحة تماماً للاستخدام، وأصبحت مسؤولاً عنها مسؤولية مدنية وجنائية كاملة من لحظة الاستلام وحتى موعد إعادتها الرسمية للشركة.
                  </p>
                  <p>
                    <span className="font-black text-slate-900">٢. المخالفات والحوادث:</span> أتحمل منفرداً كافة المسؤوليات والتبعات عن أي مخالفات مرورية أو حوادث أو غرامات أو أضرار تقع بالسيارة أو الغير خلال فترة الاستلام، وألتزم بسدادها بالكامل فوراً.
                  </p>
                  <p>
                    <span className="font-black text-slate-900">٣. حظر التصرف والتأجير:</span> يمتنع عليّ منعاً باتاً بيع السيارة أو رهنها أو التنازل عنها أو تأجيرها للغير أو قيادتها خارج النطاق الجغرافي المصرح به دون إذن كتابي رسمي مسبق من الشركة.
                  </p>
                  <p>
                    <span className="font-black text-slate-900">٤. الإبلاغ الفوري والصيانة:</span> في حال حدوث أي عطل أو حادث أو سرقة ألتزم بإبلاغ الشركة فوراً والجهات الرسمية (المرور / نجم) وتقديم التقارير اللازمة، والالتزام بإجراء الصيانة الدورية في مواعيدها.
                  </p>
                  <p className="font-black text-rose-900 pt-0.5 text-xs">
                    * يُعد هذا الإقرار سنداً رسمياً وقانونياً ملزماً للمستلم أمام كافة الجهات القضائية والحكومية والرسمية المختصة.
                  </p>
                </div>
              </div>
            </div>

            {/* Final Signatures & Legal Endorsements (Expanded Height & Clean Style) */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-slate-900 mt-5 print:break-inside-avoid">
              {/* Recipient Signature */}
              <div className="text-center space-y-1.5">
                <p className="font-black text-xs sm:text-sm text-slate-900">توقيع المستلم (المتعهد بالاستلام)</p>
                <div className="h-16 sm:h-20 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center p-1.5 bg-white shadow-xs">
                  {customerSignature ? (
                    <img src={customerSignature} alt="Signature" className="max-h-full object-contain" />
                  ) : (
                    <span className="text-xs text-slate-400 italic">توقيع المستلم المعتمد</span>
                  )}
                </div>
                <p className="text-xs font-black text-slate-900">{recipientName || 'المستلم'}</p>
                <p className="text-[10px] text-slate-500 font-mono">{nationalId}</p>
              </div>

              {/* Company Officer Signature */}
              <div className="text-center space-y-1.5">
                <p className="font-black text-xs sm:text-sm text-slate-900">ختم وتوقيع الشركة (المُسلّم)</p>
                <div className="h-16 sm:h-20 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center p-1.5 bg-white shadow-xs">
                  <div className="text-center">
                    <span className="text-xs font-black text-blue-900 block">{settings.organizationName || 'SHAKER MOTORS'}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">الختم والمصادقة المعتمدة</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-800">مأمون التسليم المعتمد</p>
              </div>

              {/* Official Fingerprint Box */}
              <div className="text-center space-y-1.5">
                <p className="font-black text-xs sm:text-sm text-purple-900">📌 بصمة الإبهام المعتمدة</p>
                <div className="h-16 sm:h-20 border-2 border-purple-300 bg-purple-50/50 rounded-xl flex flex-col items-center justify-center p-1 relative overflow-hidden shadow-xs">
                  {customerFingerprint ? (
                    <img src={customerFingerprint} alt="Fingerprint" className="max-h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center opacity-70">
                      <svg className="w-6 h-6 text-purple-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 11c-1.1 0-2 .9-2 2 0 2.5 1.8 4.3 3.5 6M8 13c0-2.2 1.8-4 4-4s4 1.8 4 4c0 3.3-2.5 5.7-5 8M6 13c0-3.3 2.7-6 6-6s6 2.7 6 6c0 4.2-3.1 7.2-6.5 10M12 3C6.5 3 2 7.5 2 13c0 3.5 1.5 6.5 4 8.5" />
                      </svg>
                      <span className="text-[8px] font-extrabold text-purple-900 uppercase mt-0.5">مربع البصمة الرسمية</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-500">تعتمد رسمياً لدى كافة الجهات</p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Camera / Fingerprint Modals */}
        {isCameraOpen && (
          <CameraCaptureModal
            isOpen={isCameraOpen}
            onClose={() => setIsCameraOpen(false)}
            onCapture={(photoDataUrl) => {
              setCustomerPhotoUrl(photoDataUrl);
              setIsCameraOpen(false);
            }}
            lang={lang}
          />
        )}

        {isFingerprintOpen && (
          <FingerprintCaptureModal
            isOpen={isFingerprintOpen}
            onClose={() => setIsFingerprintOpen(false)}
            onSave={(fpDataUrl) => {
              setCustomerFingerprint(fpDataUrl);
              setIsFingerprintOpen(false);
            }}
            lang={lang}
          />
        )}

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
