import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  ClipboardCheck,
  Car as CarIcon,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Cpu,
  Eye,
  Sliders,
  Settings,
  Save,
  Sparkles,
  Search,
  Activity,
  FileText
} from 'lucide-react';
import { AppSettings, Car, Language, VehicleInspectionReport } from '../types';
import { SignaturePad } from './SignaturePad';
import { PrintSettingsModal } from './PrintSettingsModal';
import { getSavedPrintSettings, savePrintSettings, applyPrintSettingsToDOM, getFontScalePercentage } from '../utils/printSettings';
import { exportElementToPdf, triggerBrowserPrint } from '../utils/pdfExport';

interface VehicleInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cars: Car[];
  selectedCar?: Car | null;
  settings: AppSettings;
  lang: Language;
  onSaveReport?: (report: VehicleInspectionReport) => void;
  initialData?: VehicleInspectionReport | null;
}

export const VehicleInspectionModal: React.FC<VehicleInspectionModalProps> = ({
  isOpen,
  onClose,
  cars,
  selectedCar,
  settings,
  lang,
  onSaveReport,
  initialData,
}) => {
  // 1. Car Details State
  const [carId, setCarId] = useState<string>(initialData?.carId || selectedCar?.id || '');
  const [carModel, setCarModel] = useState<string>(
    initialData?.carModel || (selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : '')
  );
  const [year, setYear] = useState<number>(initialData?.year || selectedCar?.year || new Date().getFullYear());
  const [chassisNumber, setChassisNumber] = useState<string>(
    initialData?.chassisNumber || selectedCar?.chassisNumber || ''
  );
  const [motorNumber, setMotorNumber] = useState<string>(
    initialData?.motorNumber || selectedCar?.motorNumber || ''
  );
  const [plateNumber, setPlateNumber] = useState<string>(
    initialData?.plateNumber || selectedCar?.plateNumber || ''
  );
  const [mileage, setMileage] = useState<number>(
    initialData?.mileage || selectedCar?.currentMileage || 0
  );
  const [inspectorName, setInspectorName] = useState<string>(
    initialData?.inspectorName || 'م. فحص الجودة الفنية'
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const [inspectionDate, setInspectionDate] = useState<string>(initialData?.inspectionDate || todayStr);
  const [inspectionTime, setInspectionTime] = useState<string>(
    initialData?.inspectionTime || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  );
  const [reportNumber] = useState<string>(
    initialData?.reportNumber || `INSP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // 2. Body Notes & Tags
  const [bodyNotes, setBodyNotes] = useState({
    front: initialData?.bodyNotes?.front || 'الكبوت والمصابيح والصدام سليم بحالة ممتازة',
    frontStatus: initialData?.bodyNotes?.frontStatus || 'سليم',
    side: initialData?.bodyNotes?.side || 'الأبواب والرفارف والمرايات سليمة بدون ملاحظات',
    sideStatus: initialData?.bodyNotes?.sideStatus || 'سليم',
    rear: initialData?.bodyNotes?.rear || 'الشنطة والمصابيح الخلفية والصدام سليم',
    rearStatus: initialData?.bodyNotes?.rearStatus || 'سليم',
    top: initialData?.bodyNotes?.top || 'السقف وفتحة السقف بحالة الوكالة',
    topStatus: initialData?.bodyNotes?.topStatus || 'سليم',
  });

  // 3. Exterior Inspection State
  const [exteriorBody, setExteriorBody] = useState<'good' | 'medium' | 'needs_repair'>(
    initialData?.exteriorBody || 'good'
  );
  const [exteriorPaint, setExteriorPaint] = useState<'good' | 'scratched' | 'rust'>(
    initialData?.exteriorPaint || 'good'
  );
  const [exteriorGlassMirrors, setExteriorGlassMirrors] = useState<'intact' | 'scratched' | 'broken'>(
    initialData?.exteriorGlassMirrors || 'intact'
  );
  const [exteriorTires, setExteriorTires] = useState<'good' | 'worn' | 'needs_replacement'>(
    initialData?.exteriorTires || 'good'
  );

  // 4. Interior Inspection State
  const [interiorSeats, setInteriorSeats] = useState<'good' | 'dirty' | 'torn'>(
    initialData?.interiorSeats || 'good'
  );
  const [interiorDashboard, setInteriorDashboard] = useState<'working' | 'faults'>(
    initialData?.interiorDashboard || 'working'
  );
  const [interiorACHeating, setInteriorACHeating] = useState<'working' | 'not_working'>(
    initialData?.interiorACHeating || 'working'
  );
  const [interiorAudioElectronics, setInteriorAudioElectronics] = useState<'working' | 'not_working'>(
    initialData?.interiorAudioElectronics || 'working'
  );

  // 5. Mechanical Inspection State
  const [mechanicalEngine, setMechanicalEngine] = useState<'good' | 'abnormal_sound' | 'oil_leak'>(
    initialData?.mechanicalEngine || 'good'
  );
  const [mechanicalTransmission, setMechanicalTransmission] = useState<'good' | 'shifting_issues' | 'needs_repair'>(
    initialData?.mechanicalTransmission || 'good'
  );
  const [mechanicalBrakes, setMechanicalBrakes] = useState<'good' | 'noise' | 'needs_replacement'>(
    initialData?.mechanicalBrakes || 'good'
  );
  const [mechanicalSuspension, setMechanicalSuspension] = useState<'good' | 'noise' | 'needs_repair'>(
    initialData?.mechanicalSuspension || 'good'
  );

  // 6. Electronic Inspection State
  const [electronicO2Sensor, setElectronicO2Sensor] = useState<'intact' | 'needs_replacement'>(
    initialData?.electronicO2Sensor || 'intact'
  );
  const [electronicABSSensor, setElectronicABSSensor] = useState<'intact' | 'needs_replacement'>(
    initialData?.electronicABSSensor || 'intact'
  );
  const [electronicCheckEngine, setElectronicCheckEngine] = useState<'off' | 'on'>(
    initialData?.electronicCheckEngine || 'off'
  );
  const [electronicOBD2Reading, setElectronicOBD2Reading] = useState<string>(
    initialData?.electronicOBD2Reading || 'لا توجد أكواد أعطال مسجلة (System Normal - PASS)'
  );

  // 7. General Notes
  const [generalNotes, setGeneralNotes] = useState<string>(
    initialData?.generalNotes || 'تم فحص السيارة ظاهرياً وميكانيكياً وإلكترونياً بدقة، وجميع الأجهزة الأساسية مطابقة للمواصفات.'
  );

  // 8. Recommendation
  const [recommendation, setRecommendation] = useState<'good_condition' | 'minor_repairs' | 'major_repairs'>(
    initialData?.recommendation || 'good_condition'
  );

  const [inspectorSignature, setInspectorSignature] = useState<string>(initialData?.inspectorSignature || '');
  const [recipientName, setRecipientName] = useState<string>(initialData?.recipientName || '');
  const [recipientCivilId, setRecipientCivilId] = useState<string>(initialData?.recipientCivilId || '');
  const [recipientSignature, setRecipientSignature] = useState<string>(initialData?.recipientSignature || '');

  // UI / Print Settings
  const [zoom, setZoom] = useState<number>(100);
  const [fontScale, setFontScale] = useState<number>(100);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('SHAKER MOTORS');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(8);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  const bodyConditionOptions = [
    { value: 'سليم', label: 'سليم (وكالة)', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { value: 'خدوش خفيفة', label: 'خدوش خفيفة', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
    { value: 'حكة / تجريح', label: 'حكة / تجريح', badge: 'bg-orange-100 text-orange-800 border-orange-300' },
    { value: 'صدمة خفيفة', label: 'صدمة خفيفة', badge: 'bg-rose-100 text-rose-800 border-rose-300' },
    { value: 'تعديل بدون دهان', label: 'تعديل بدون دهان (PDR)', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
    { value: 'يحتاج سمكرة ودهان', label: 'يحتاج سمكرة ودهان', badge: 'bg-red-100 text-red-900 border-red-400' },
    { value: 'كسر / استبدال', label: 'كسر / استبدال', badge: 'bg-slate-200 text-slate-800 border-slate-400' },
  ];

  const getStatusBadge = (status: string) => {
    const found = bodyConditionOptions.find((o) => o.value === status);
    return found ? found.badge : 'bg-slate-100 text-slate-800 border-slate-300';
  };

  useEffect(() => {
    if (isOpen) {
      const printSettings = getSavedPrintSettings();
      applyPrintSettingsToDOM(printSettings);
      setFontScale(getFontScalePercentage(printSettings.fontSize));
      setShowWatermark(printSettings.showWatermark ?? true);
      setWatermarkText(printSettings.watermarkText || 'SHAKER MOTORS');
      setWatermarkOpacity(printSettings.watermarkOpacity ?? 8);

      if (initialData) {
        setCarId(initialData.carId || '');
        setCarModel(initialData.carModel || '');
        setYear(initialData.year || 2025);
        setChassisNumber(initialData.chassisNumber || '');
        setMotorNumber(initialData.motorNumber || '');
        setPlateNumber(initialData.plateNumber || '');
        setMileage(initialData.mileage || 0);
        setInspectorName(initialData.inspectorName || 'م. فحص الجودة الفنية');
        setInspectionDate(initialData.inspectionDate || todayStr);
        setInspectionTime(initialData.inspectionTime || '');
        setBodyNotes({
          front: initialData.bodyNotes?.front || 'الكبوت والمصابيح والصدام سليم بحالة ممتازة',
          frontStatus: initialData.bodyNotes?.frontStatus || 'سليم',
          side: initialData.bodyNotes?.side || 'الأبواب والرفارف والمرايات سليمة بدون ملاحظات',
          sideStatus: initialData.bodyNotes?.sideStatus || 'سليم',
          rear: initialData.bodyNotes?.rear || 'الشنطة والمصابيح الخلفية والصدام سليم',
          rearStatus: initialData.bodyNotes?.rearStatus || 'سليم',
          top: initialData.bodyNotes?.top || 'السقف وفتحة السقف بحالة الوكالة',
          topStatus: initialData.bodyNotes?.topStatus || 'سليم',
        });
        setExteriorBody(initialData.exteriorBody || 'good');
        setExteriorPaint(initialData.exteriorPaint || 'good');
        setExteriorGlassMirrors(initialData.exteriorGlassMirrors || 'intact');
        setExteriorTires(initialData.exteriorTires || 'good');
        setInteriorSeats(initialData.interiorSeats || 'good');
        setInteriorDashboard(initialData.interiorDashboard || 'working');
        setInteriorACHeating(initialData.interiorACHeating || 'working');
        setInteriorAudioElectronics(initialData.interiorAudioElectronics || 'working');
        setMechanicalEngine(initialData.mechanicalEngine || 'good');
        setMechanicalTransmission(initialData.mechanicalTransmission || 'good');
        setMechanicalBrakes(initialData.mechanicalBrakes || 'good');
        setMechanicalSuspension(initialData.mechanicalSuspension || 'good');
        setElectronicO2Sensor(initialData.electronicO2Sensor || 'intact');
        setElectronicABSSensor(initialData.electronicABSSensor || 'intact');
        setElectronicCheckEngine(initialData.electronicCheckEngine || 'off');
        setElectronicOBD2Reading(initialData.electronicOBD2Reading || 'لا توجد أكواد أعطال مسجلة (System Normal - PASS)');
        setGeneralNotes(initialData.generalNotes || 'تم فحص السيارة ظاهرياً وميكانيكياً وإلكترونياً بدقة، وجميع الأجهزة الأساسية مطابقة للمواصفات.');
        setRecommendation(initialData.recommendation || 'good_condition');
        setInspectorSignature(initialData.inspectorSignature || '');
        setRecipientName(initialData.recipientName || '');
        setRecipientCivilId(initialData.recipientCivilId || '');
        setRecipientSignature(initialData.recipientSignature || '');
      } else if (selectedCar) {
        setCarId(selectedCar.id);
        setCarModel(`${selectedCar.brand} ${selectedCar.model}`);
        setYear(selectedCar.year);
        setChassisNumber(selectedCar.chassisNumber || '');
        setMotorNumber(selectedCar.motorNumber || '');
        setPlateNumber(selectedCar.plateNumber);
        setMileage(selectedCar.currentMileage || 0);
      }
    }
  }, [isOpen, initialData, selectedCar]);

  const handleCarSelect = (cId: string) => {
    setCarId(cId);
    const car = cars.find((c) => c.id === cId);
    if (car) {
      setCarModel(`${car.brand} ${car.model}`);
      setYear(car.year);
      setChassisNumber(car.chassisNumber || '');
      setMotorNumber(car.motorNumber || '');
      setPlateNumber(car.plateNumber);
      setMileage(car.currentMileage || 0);
    }
  };

  const handlePrint = () => {
    triggerBrowserPrint('printable-inspection-report');
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    await exportElementToPdf('printable-inspection-report', `Vehicle-Inspection-Report-${reportNumber}.pdf`);
    setIsExportingPdf(false);
  };

  const handleSave = () => {
    const report: VehicleInspectionReport = {
      id: initialData?.id || `insp_${Date.now()}`,
      reportNumber,
      carId,
      carModel,
      year,
      chassisNumber,
      motorNumber,
      plateNumber,
      mileage,
      inspectorName,
      inspectionDate,
      inspectionTime,
      bodyNotes,
      exteriorBody,
      exteriorPaint,
      exteriorGlassMirrors,
      exteriorTires,
      interiorSeats,
      interiorDashboard,
      interiorACHeating,
      interiorAudioElectronics,
      mechanicalEngine,
      mechanicalTransmission,
      mechanicalBrakes,
      mechanicalSuspension,
      electronicO2Sensor,
      electronicABSSensor,
      electronicCheckEngine,
      electronicOBD2Reading,
      generalNotes,
      recommendation,
      inspectorSignature,
      recipientName,
      recipientCivilId,
      recipientSignature,
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    if (onSaveReport) {
      onSaveReport(report);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[94vh] print:max-h-none print:max-w-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                نموذج فحص شامل للسيارة
              </h2>
              <p className="text-xs text-slate-400">
                تقرير فحص فني متكامل يشمل الهيكل الخارجي، الداخلي، الميكانيكي، والإلكتروني مع مخطط السيارة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Font Scale */}
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

            {/* Zoom Paper Scale */}
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

            {/* Watermark Toggle */}
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
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 transition"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">إعدادات الطباعة</span>
            </button>

            {/* Export PDF */}
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
              <span>طباعة التقرير</span>
            </button>

            {onSaveReport && (
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

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
          
          {/* Quick Edit Form (Hidden on Print) */}
          <div className="mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:hidden space-y-4">
            
            {/* Fleet Car Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <CarIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <label className="block text-xs font-bold text-slate-800">اختيار سيارة من أسطول الشركة:</label>
                  <p className="text-[10px] text-slate-500">سيتم ملء بيانات الموديل، الشاسيه، والموتور تلقائياً</p>
                </div>
              </div>

              <div className="w-72">
                <select
                  value={carId}
                  onChange={(e) => handleCarSelect(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                >
                  <option value="">-- فحص سيارة جديدة / كتابة يدوية --</option>
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {c.model} ({c.year}) - لوحة: {c.plateNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 1. Basic Fields Editor */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 border-b pb-1">1. بيانات السيارة والفحص</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">النوع / الموديل:</label>
                  <input
                    type="text"
                    value={carModel}
                    onChange={(e) => setCarModel(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">سنة الصنع:</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value, 10) || 2025)}
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">رقم الشاسيه (VIN):</label>
                  <input
                    type="text"
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">رقم الموتور:</label>
                  <input
                    type="text"
                    value={motorNumber}
                    onChange={(e) => setMotorNumber(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">رقم اللوحة:</label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs font-bold text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">عدد الكيلومترات (كم):</label>
                  <input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 2. Body Views & Condition Details Editor */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-700" />
                  <span>2. صور الهيكل مع التسميات وتحديد الحالة لكل جهة (تعديل وكتابة مباشر)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setBodyNotes({
                      front: 'الكبوت والمصابيح والصدام سليم بحالة الوكالة',
                      frontStatus: 'سليم',
                      side: 'الأبواب والرفارف والمرايات سليمة بالكامل',
                      sideStatus: 'سليم',
                      rear: 'الشنطة والمصابيح الخلفية والصدام سليم بحالة ممتازة',
                      rearStatus: 'سليم',
                      top: 'السقف وفتحة السقف بحالة الوكالة',
                      topStatus: 'سليم',
                    });
                  }}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-300 transition flex items-center gap-1 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تعيين الكل سليم (وكالة)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Front Editor */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-black text-xs text-slate-900">🚗 1. الجهة الأمامية</span>
                    <span className="text-[9.5px] text-slate-500 font-medium">الكبوت – الصدام</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الحالة المحددة:</label>
                    <select
                      value={bodyNotes.frontStatus || 'سليم'}
                      onChange={(e) => setBodyNotes({ ...bodyNotes, frontStatus: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900"
                    >
                      {bodyConditionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الوصف والتفاصيل المكتوبة:</label>
                    <textarea
                      rows={2}
                      value={bodyNotes.front}
                      onChange={(e) => setBodyNotes({ ...bodyNotes, front: e.target.value })}
                      placeholder="اكتب تفاصيل حالة الصدام والكبوت والمصابيح..."
                      className="w-full p-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-blue-500"
                    />
                  </div>
                </div>

                {/* Side Editor */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-black text-xs text-slate-900">🚘 2. الجهة الجانبية</span>
                    <span className="text-[9.5px] text-slate-500 font-medium">الأبواب – المرايات</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الحالة المحددة:</label>
                    <select
                      value={bodyNotes.sideStatus || 'سليم'}
                      onChange={(e) => setBodyNotes({ ...bodyNotes, sideStatus: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900"
                    >
                      {bodyConditionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الوصف والتفاصيل المكتوبة:</label>
                    <textarea
                      rows={2}
                      value={bodyNotes.side}
                      onChange={(e) => setBodyNotes({ ...bodyNotes, side: e.target.value })}
                      placeholder="اكتب تفاصيل حالة الأبواب والرفارف والمرايات..."
                      className="w-full p-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-blue-500"
                    />
                  </div>
                </div>

                {/* Rear Editor */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-black text-xs text-slate-900">🚙 3. الجهة الخلفية</span>
                    <span className="text-[9.5px] text-slate-500 font-medium">الشنطة – الصدام</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الحالة المحددة:</label>
                    <select
                      value={bodyNotes.rearStatus || 'سليم'}
                      onChange={(e) => setBodyNotes({ ...bodyNotes, rearStatus: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900"
                    >
                      {bodyConditionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الوصف والتفاصيل المكتوبة:</label>
                    <textarea
                      rows={2}
                      value={bodyNotes.rear}
                      onChange={(e) => setBodyNotes({ ...bodyNotes, rear: e.target.value })}
                      placeholder="اكتب تفاصيل حالة الشنطة والصدام الخلفي..."
                      className="w-full p-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-blue-500"
                    />
                  </div>
                </div>

                {/* Top Editor */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-black text-xs text-slate-900">🔲 4. السقف والعلوي</span>
                    <span className="text-[9.5px] text-slate-500 font-medium">السقف – الفتحة</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الحالة المحددة:</label>
                    <select
                      value={bodyNotes.topStatus || 'سليم'}
                      onChange={(e) => setBodyNotes({ ...bodyNotes, topStatus: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900"
                    >
                      {bodyConditionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">الوصف والتفاصيل المكتوبة:</label>
                    <textarea
                      rows={2}
                      value={bodyNotes.top}
                      onChange={(e) => setBodyNotes({ ...bodyNotes, top: e.target.value })}
                      placeholder="اكتب تفاصيل حالة السقف وفتحة السقف..."
                      className="w-full p-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Editors: 3 to 6 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2 border-t">
              {/* 3. Exterior */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <p className="font-black text-slate-900 text-xs">3. الفحص الخارجي</p>
                <div>
                  <label className="block text-[10px] text-slate-500">الهيكل الخارجي:</label>
                  <select
                    value={exteriorBody}
                    onChange={(e) => setExteriorBody(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="good">جيد</option>
                    <option value="medium">متوسط</option>
                    <option value="needs_repair">يحتاج إصلاح</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">الطلاء:</label>
                  <select
                    value={exteriorPaint}
                    onChange={(e) => setExteriorPaint(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="good">جيد</option>
                    <option value="scratched">خدوش</option>
                    <option value="rust">صدأ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">الزجاج والمرايات:</label>
                  <select
                    value={exteriorGlassMirrors}
                    onChange={(e) => setExteriorGlassMirrors(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="intact">سليم</option>
                    <option value="scratched">خدوش</option>
                    <option value="broken">كسر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">الإطارات:</label>
                  <select
                    value={exteriorTires}
                    onChange={(e) => setExteriorTires(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="good">جيدة</option>
                    <option value="worn">تآكل</option>
                    <option value="needs_replacement">تحتاج تغيير</option>
                  </select>
                </div>
              </div>

              {/* 4. Interior */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <p className="font-black text-slate-900 text-xs">4. الفحص الداخلي</p>
                <div>
                  <label className="block text-[10px] text-slate-500">المقاعد والفرش:</label>
                  <select
                    value={interiorSeats}
                    onChange={(e) => setInteriorSeats(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="good">جيد</option>
                    <option value="dirty">متسخ</option>
                    <option value="torn">ممزق</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">لوحة العدادات:</label>
                  <select
                    value={interiorDashboard}
                    onChange={(e) => setInteriorDashboard(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="working">تعمل</option>
                    <option value="faults">أعطال</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">أنظمة التكييف والتدفئة:</label>
                  <select
                    value={interiorACHeating}
                    onChange={(e) => setInteriorACHeating(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="working">تعمل</option>
                    <option value="not_working">لا تعمل</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">أنظمة الصوت والإلكترونيات:</label>
                  <select
                    value={interiorAudioElectronics}
                    onChange={(e) => setInteriorAudioElectronics(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="working">تعمل</option>
                    <option value="not_working">لا تعمل</option>
                  </select>
                </div>
              </div>

              {/* 5. Mechanical */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <p className="font-black text-slate-900 text-xs">5. الفحص الميكانيكي</p>
                <div>
                  <label className="block text-[10px] text-slate-500">المحرك:</label>
                  <select
                    value={mechanicalEngine}
                    onChange={(e) => setMechanicalEngine(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="good">جيد</option>
                    <option value="abnormal_sound">صوت غير طبيعي</option>
                    <option value="oil_leak">تسريب زيت</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">ناقل الحركة:</label>
                  <select
                    value={mechanicalTransmission}
                    onChange={(e) => setMechanicalTransmission(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="good">جيد</option>
                    <option value="shifting_issues">مشاكل تبديل</option>
                    <option value="needs_repair">يحتاج إصلاح</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">الفرامل:</label>
                  <select
                    value={mechanicalBrakes}
                    onChange={(e) => setMechanicalBrakes(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="good">جيدة</option>
                    <option value="noise">صوت</option>
                    <option value="needs_replacement">تحتاج تغيير</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">نظام التعليق:</label>
                  <select
                    value={mechanicalSuspension}
                    onChange={(e) => setMechanicalSuspension(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="good">جيد</option>
                    <option value="noise">أصوات</option>
                    <option value="needs_repair">يحتاج إصلاح</option>
                  </select>
                </div>
              </div>

              {/* 6. Electronic & OBD2 */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <p className="font-black text-slate-900 text-xs">6. الفحص الإلكتروني</p>
                <div>
                  <label className="block text-[10px] text-slate-500">حساس الأكسجين:</label>
                  <select
                    value={electronicO2Sensor}
                    onChange={(e) => setElectronicO2Sensor(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="intact">سليم</option>
                    <option value="needs_replacement">يحتاج تغيير</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">حساس ABS:</label>
                  <select
                    value={electronicABSSensor}
                    onChange={(e) => setElectronicABSSensor(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  >
                    <option value="intact">سليم</option>
                    <option value="needs_replacement">يحتاج تغيير</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">لمبة المكينة (Check Engine):</label>
                  <select
                    value={electronicCheckEngine}
                    onChange={(e) => setElectronicCheckEngine(e.target.value as any)}
                    className="w-full p-1 border rounded text-xs bg-white font-bold"
                  >
                    <option value="off">مطفأة</option>
                    <option value="on">مضاءة (تحذير)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500">قراءة جهاز OBD2:</label>
                  <input
                    type="text"
                    value={electronicOBD2Reading}
                    onChange={(e) => setElectronicOBD2Reading(e.target.value)}
                    className="w-full p-1 border rounded text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 7 & 8 Notes & Recommendation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">7. الملاحظات العامة:</label>
                <textarea
                  rows={2}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  className="w-full p-2 border rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">8. التوصية الفنية النهائية:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecommendation('good_condition')}
                    className={`p-2 rounded-lg border font-bold text-xs transition ${
                      recommendation === 'good_condition'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ✓ بحالة جيدة
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecommendation('minor_repairs')}
                    className={`p-2 rounded-lg border font-bold text-xs transition ${
                      recommendation === 'minor_repairs'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⚠ إصلاحات بسيطة
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecommendation('major_repairs')}
                    className={`p-2 rounded-lg border font-bold text-xs transition ${
                      recommendation === 'major_repairs'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⛔ إصلاحات كبيرة
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-500 whitespace-nowrap">اسم الفاحص / المهندس:</label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Signatures & Certification Drawer */}
            <div className="pt-3 border-t grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Inspector Section */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10.5px] font-bold text-slate-700 whitespace-nowrap">اسم الفاحص / المهندس:</label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-xs font-bold text-slate-900 bg-white"
                  />
                </div>
                <SignaturePad
                  label="توقيع واعتماد الفاحص الفني (إلكتروني):"
                  onSave={(dataUrl) => setInspectorSignature(dataUrl)}
                  initialSignature={inspectorSignature}
                  lang={lang}
                />
              </div>

              {/* Recipient Section */}
              <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 block mb-0.5">اسم المستلم / العميل:</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="اكتب اسم المستلم..."
                      className="w-full px-2 py-1 border border-blue-300 rounded text-xs font-bold text-blue-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 block mb-0.5">رقم الهوية / الإقامة:</label>
                    <input
                      type="text"
                      value={recipientCivilId}
                      onChange={(e) => setRecipientCivilId(e.target.value)}
                      placeholder="رقم الهوية الوطنية / الإقامة..."
                      className="w-full px-2 py-1 border border-blue-300 rounded text-xs bg-white"
                    />
                  </div>
                </div>
                <SignaturePad
                  label="توقيع المستلم (إلكتروني):"
                  onSave={(dataUrl) => setRecipientSignature(dataUrl)}
                  initialSignature={recipientSignature}
                  lang={lang}
                />
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* PRINTABLE DOCUMENT (A4 Single Page Layout)                 */}
          {/* ========================================================= */}
          <div
            id="printable-inspection-report"
            style={{
              zoom: zoom / 100,
              fontSize: `${fontScale}%`,
              ['--print-font-size' as any]: `${(fontScale / 100) * 8.5}pt`,
            }}
            className="print-page-frame relative w-full max-w-[210mm] mx-auto bg-white p-5 sm:p-6 border border-slate-300 rounded-xl shadow-md text-slate-900 font-sans text-xs print:m-0 print:w-full print:max-w-none print:bg-white flex flex-col justify-between"
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
                  ★ فحص فني معتمد للمركبة ★
                </div>
              </div>
            )}

            <div className="relative z-10 space-y-3">
              
              {/* Header */}
              <div className="flex items-start justify-between pb-2.5 border-b-2 border-slate-900 print:break-inside-avoid">
                <div className="flex items-center gap-3">
                  {settings.logoUrl && (
                    <img
                      src={settings.logoUrl}
                      alt="Logo"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-xs"
                    />
                  )}
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      {settings.organizationName || 'SHAKER MOTORS'}
                    </h1>
                    <p className="text-[10.5px] text-slate-600 mt-0.5">
                      سجل تجاري: <span className="font-bold">{settings.commercialRegistration || settings.taxId || '1010987654'}</span> | هاتف: <span className="font-bold font-mono">{settings.contactPhone || '011-2345678'}</span>
                    </p>
                    <p className="text-[9.5px] text-slate-500">{settings.address || 'المملكة العربية السعودية - الرياض'}</p>
                  </div>
                </div>

                <div className="text-left rtl:text-right flex flex-col items-end">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs rounded-md uppercase mb-1 shadow-xs">
                    📝 نموذج فحص سيارة شامل
                  </span>
                  <p className="text-xs font-mono font-extrabold text-blue-900">{reportNumber}</p>
                  <p className="text-[10px] text-slate-500">التاريخ: {inspectionDate} | الوقت: {inspectionTime}</p>
                </div>
              </div>

              {/* 1. بيانات السيارة (Car Details) */}
              <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/70 print:break-inside-avoid">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
                  <h3 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <CarIcon className="w-4 h-4 text-blue-700" />
                    <span>1. بيانات السيارة الأساسية</span>
                  </h3>
                  <span className="text-[10px] font-bold text-slate-600">
                    الفاحص المسؤول: <span className="font-black text-slate-900">{inspectorName}</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10.5px]">
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[9px] text-slate-500 block font-bold">النوع / الموديل:</span>
                    <span className="font-black text-slate-900">{carModel || '................'}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[9px] text-slate-500 block font-bold">سنة الصنع:</span>
                    <span className="font-black text-slate-900 font-mono">{year}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[9px] text-slate-500 block font-bold">رقم الشاسيه (VIN):</span>
                    <span className="font-black text-slate-900 font-mono">{chassisNumber || '................'}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[9px] text-slate-500 block font-bold">رقم الموتور:</span>
                    <span className="font-black text-slate-900 font-mono">{motorNumber || '................'}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[9px] text-slate-500 block font-bold">رقم اللوحة:</span>
                    <span className="font-black text-blue-900 font-mono">{plateNumber || '........'}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[9px] text-slate-500 block font-bold">عدد الكيلومترات:</span>
                    <span className="font-black text-slate-900 font-mono">{mileage.toLocaleString()} كم</span>
                  </div>
                </div>
              </div>

              {/* 2. صور ومخطط الهيكل مع التسميات وتحديد الحالة لكل جهة (Body Diagram & Labels) */}
              <div className="border border-slate-300 rounded-lg p-2.5 bg-white print:break-inside-avoid shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
                  <h3 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-700" />
                    <span>2. صور الهيكل مع التسميات وتحديد حالة كل جهة (مخطط الفحص الفني)</span>
                  </h3>
                  <span className="text-[9.5px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    أمامي • جانبي • خلفي • علوي
                  </span>
                </div>

                {/* 4 Views Diagram Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {/* Front View */}
                  <div className="border border-slate-200 rounded-lg p-1.5 bg-slate-50/70 flex flex-col justify-between text-center">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-slate-900">🚗 أمامي (Front)</span>
                      <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded border ${getStatusBadge(bodyNotes.frontStatus || 'سليم')}`}>
                        {bodyNotes.frontStatus || 'سليم'}
                      </span>
                    </div>
                    <div className="h-14 flex items-center justify-center p-1 bg-white rounded border border-slate-200">
                      <svg viewBox="0 0 100 60" className="w-full h-full text-slate-700 max-h-12">
                        {/* Front Car Schematic */}
                        <path d="M 20 45 L 25 25 L 35 15 L 65 15 L 75 25 L 80 45 Z" fill="#f1f5f9" stroke="#334155" strokeWidth="2" />
                        <rect x="35" y="18" width="30" height="15" rx="2" fill="#94a3b8" />
                        <circle cx="28" cy="40" r="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
                        <circle cx="72" cy="40" r="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
                        <rect x="38" y="38" width="24" height="6" rx="1" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                        <rect x="22" y="45" width="56" height="5" rx="2" fill="#64748b" />
                      </svg>
                    </div>
                    <p className="text-[8.5px] font-bold text-slate-600 mt-0.5">الكبوت – المصابيح – الصدام</p>
                    <div className="mt-1 pt-1 border-t border-slate-200">
                      <input
                        type="text"
                        value={bodyNotes.front}
                        onChange={(e) => setBodyNotes({ ...bodyNotes, front: e.target.value })}
                        className="w-full text-center text-[9px] font-bold text-slate-900 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
                        placeholder="حالة الجهة الأمامية..."
                      />
                    </div>
                  </div>

                  {/* Right Side View */}
                  <div className="border border-slate-200 rounded-lg p-1.5 bg-slate-50/70 flex flex-col justify-between text-center">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-slate-900">🚘 جانبي (Side)</span>
                      <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded border ${getStatusBadge(bodyNotes.sideStatus || 'سليم')}`}>
                        {bodyNotes.sideStatus || 'سليم'}
                      </span>
                    </div>
                    <div className="h-14 flex items-center justify-center p-1 bg-white rounded border border-slate-200">
                      <svg viewBox="0 0 120 50" className="w-full h-full text-slate-700 max-h-12">
                        {/* Side Car Schematic */}
                        <path d="M 10 35 L 15 25 L 30 25 L 45 12 L 80 12 L 100 25 L 115 30 L 115 38 L 10 38 Z" fill="#f1f5f9" stroke="#334155" strokeWidth="2" />
                        <path d="M 45 15 L 75 15 L 92 25 L 45 25 Z" fill="#94a3b8" />
                        <line x1="65" y1="15" x2="65" y2="35" stroke="#334155" strokeWidth="1.5" />
                        <circle cx="30" cy="38" r="8" fill="#1e293b" />
                        <circle cx="30" cy="38" r="4" fill="#94a3b8" />
                        <circle cx="95" cy="38" r="8" fill="#1e293b" />
                        <circle cx="95" cy="38" r="4" fill="#94a3b8" />
                      </svg>
                    </div>
                    <p className="text-[8.5px] font-bold text-slate-600 mt-0.5">الأبواب – الرفارف – المرايات</p>
                    <div className="mt-1 pt-1 border-t border-slate-200">
                      <input
                        type="text"
                        value={bodyNotes.side}
                        onChange={(e) => setBodyNotes({ ...bodyNotes, side: e.target.value })}
                        className="w-full text-center text-[9px] font-bold text-slate-900 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
                        placeholder="حالة الجهة الجانبية..."
                      />
                    </div>
                  </div>

                  {/* Rear View */}
                  <div className="border border-slate-200 rounded-lg p-1.5 bg-slate-50/70 flex flex-col justify-between text-center">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-slate-900">🚙 خلفي (Rear)</span>
                      <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded border ${getStatusBadge(bodyNotes.rearStatus || 'سليم')}`}>
                        {bodyNotes.rearStatus || 'سليم'}
                      </span>
                    </div>
                    <div className="h-14 flex items-center justify-center p-1 bg-white rounded border border-slate-200">
                      <svg viewBox="0 0 100 60" className="w-full h-full text-slate-700 max-h-12">
                        {/* Rear Car Schematic */}
                        <path d="M 22 45 L 25 25 L 35 15 L 65 15 L 75 25 L 78 45 Z" fill="#f1f5f9" stroke="#334155" strokeWidth="2" />
                        <rect x="35" y="18" width="30" height="14" rx="2" fill="#94a3b8" />
                        <rect x="25" y="36" width="10" height="5" rx="1" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
                        <rect x="65" y="36" width="10" height="5" rx="1" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
                        <rect x="40" y="36" width="20" height="6" rx="1" fill="#f8fafc" stroke="#475569" strokeWidth="1" />
                        <rect x="20" y="45" width="60" height="6" rx="2" fill="#64748b" />
                      </svg>
                    </div>
                    <p className="text-[8.5px] font-bold text-slate-600 mt-0.5">الشنطة – المصابيح – الصدام</p>
                    <div className="mt-1 pt-1 border-t border-slate-200">
                      <input
                        type="text"
                        value={bodyNotes.rear}
                        onChange={(e) => setBodyNotes({ ...bodyNotes, rear: e.target.value })}
                        className="w-full text-center text-[9px] font-bold text-slate-900 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
                        placeholder="حالة الجهة الخلفية..."
                      />
                    </div>
                  </div>

                  {/* Top View */}
                  <div className="border border-slate-200 rounded-lg p-1.5 bg-slate-50/70 flex flex-col justify-between text-center">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-slate-900">🔲 علوي (Top)</span>
                      <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded border ${getStatusBadge(bodyNotes.topStatus || 'سليم')}`}>
                        {bodyNotes.topStatus || 'سليم'}
                      </span>
                    </div>
                    <div className="h-14 flex items-center justify-center p-1 bg-white rounded border border-slate-200">
                      <svg viewBox="0 0 80 60" className="w-full h-full text-slate-700 max-h-12">
                        {/* Top View Schematic */}
                        <rect x="20" y="8" width="40" height="44" rx="10" fill="#f1f5f9" stroke="#334155" strokeWidth="2" />
                        <rect x="26" y="14" width="28" height="8" rx="2" fill="#94a3b8" />
                        <rect x="30" y="24" width="20" height="12" rx="2" fill="#cbd5e1" stroke="#475569" strokeDasharray="2 1" />
                        <rect x="26" y="38" width="28" height="8" rx="2" fill="#94a3b8" />
                      </svg>
                    </div>
                    <p className="text-[8.5px] font-bold text-slate-600 mt-0.5">السقف – فتحة السقف</p>
                    <div className="mt-1 pt-1 border-t border-slate-200">
                      <input
                        type="text"
                        value={bodyNotes.top}
                        onChange={(e) => setBodyNotes({ ...bodyNotes, top: e.target.value })}
                        className="w-full text-center text-[9px] font-bold text-slate-900 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
                        placeholder="حالة السقف والعلوي..."
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[9.5px] bg-slate-50 p-1.5 rounded border border-slate-200">
                  <div><span className="font-bold text-slate-700">أمامي ({bodyNotes.frontStatus || 'سليم'}):</span> <span className="text-slate-900 font-medium">{bodyNotes.front}</span></div>
                  <div><span className="font-bold text-slate-700">جانبي ({bodyNotes.sideStatus || 'سليم'}):</span> <span className="text-slate-900 font-medium">{bodyNotes.side}</span></div>
                  <div><span className="font-bold text-slate-700">خلفي ({bodyNotes.rearStatus || 'سليم'}):</span> <span className="text-slate-900 font-medium">{bodyNotes.rear}</span></div>
                  <div><span className="font-bold text-slate-700">علوي ({bodyNotes.topStatus || 'سليم'}):</span> <span className="text-slate-900 font-medium">{bodyNotes.top}</span></div>
                </div>
              </div>

              {/* Sections 3, 4, 5, 6 Tables Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 print:break-inside-avoid">
                
                {/* 3. الفحص الخارجي (Exterior) */}
                <div className="border border-slate-300 rounded-lg p-2 bg-white shadow-2xs">
                  <h4 className="font-black text-[11px] text-blue-900 border-b border-slate-200 pb-1 mb-1 flex items-center justify-between">
                    <span>3. الفحص الخارجي (Exterior)</span>
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  </h4>
                  <table className="w-full text-[10px]">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 font-bold text-slate-700">الهيكل الخارجي:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-2">
                            <span>{exteriorBody === 'good' ? '☑ جيد' : '☐ جيد'}</span>
                            <span>{exteriorBody === 'medium' ? '☑ متوسط' : '☐ متوسط'}</span>
                            <span className={exteriorBody === 'needs_repair' ? 'text-rose-700 font-bold' : ''}>
                              {exteriorBody === 'needs_repair' ? '☑ يحتاج إصلاح' : '☐ يحتاج إصلاح'}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 font-bold text-slate-700">الطلاء:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-2">
                            <span>{exteriorPaint === 'good' ? '☑ جيد' : '☐ جيد'}</span>
                            <span>{exteriorPaint === 'scratched' ? '☑ خدوش' : '☐ خدوش'}</span>
                            <span className={exteriorPaint === 'rust' ? 'text-rose-700 font-bold' : ''}>
                              {exteriorPaint === 'rust' ? '☑ صدأ' : '☐ صدأ'}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 font-bold text-slate-700">الزجاج والمرايات:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-2">
                            <span>{exteriorGlassMirrors === 'intact' ? '☑ سليم' : '☐ سليم'}</span>
                            <span>{exteriorGlassMirrors === 'scratched' ? '☑ خدوش' : '☐ خدوش'}</span>
                            <span className={exteriorGlassMirrors === 'broken' ? 'text-rose-700 font-bold' : ''}>
                              {exteriorGlassMirrors === 'broken' ? '☑ كسر' : '☐ كسر'}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 font-bold text-slate-700">الإطارات:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-2">
                            <span>{exteriorTires === 'good' ? '☑ جيدة' : '☐ جيدة'}</span>
                            <span>{exteriorTires === 'worn' ? '☑ تآكل' : '☐ تآكل'}</span>
                            <span className={exteriorTires === 'needs_replacement' ? 'text-rose-700 font-bold' : ''}>
                              {exteriorTires === 'needs_replacement' ? '☑ تحتاج تغيير' : '☐ تحتاج تغيير'}
                            </span>
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 4. الفحص الداخلي (Interior) */}
                <div className="border border-slate-300 rounded-lg p-2 bg-white shadow-2xs">
                  <h4 className="font-black text-[11px] text-emerald-900 border-b border-slate-200 pb-1 mb-1 flex items-center justify-between">
                    <span>4. الفحص الداخلي (Interior)</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </h4>
                  <table className="w-full text-[10px]">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 font-bold text-slate-700">المقاعد والفرش:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-2">
                            <span>{interiorSeats === 'good' ? '☑ جيد' : '☐ جيد'}</span>
                            <span>{interiorSeats === 'dirty' ? '☑ متسخ' : '☐ متسخ'}</span>
                            <span className={interiorSeats === 'torn' ? 'text-rose-700 font-bold' : ''}>
                              {interiorSeats === 'torn' ? '☑ ممزق' : '☐ ممزق'}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 font-bold text-slate-700">لوحة العدادات:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-2">
                            <span>{interiorDashboard === 'working' ? '☑ تعمل' : '☐ تعمل'}</span>
                            <span className={interiorDashboard === 'faults' ? 'text-rose-700 font-bold' : ''}>
                              {interiorDashboard === 'faults' ? '☑ أعطال' : '☐ أعطال'}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 font-bold text-slate-700">أنظمة التكييف والتدفئة:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-2">
                            <span>{interiorACHeating === 'working' ? '☑ تعمل' : '☐ تعمل'}</span>
                            <span className={interiorACHeating === 'not_working' ? 'text-rose-700 font-bold' : ''}>
                              {interiorACHeating === 'not_working' ? '☑ لا تعمل' : '☐ لا تعمل'}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 font-bold text-slate-700">أنظمة الصوت والإلكترونيات:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-2">
                            <span>{interiorAudioElectronics === 'working' ? '☑ تعمل' : '☐ تعمل'}</span>
                            <span className={interiorAudioElectronics === 'not_working' ? 'text-rose-700 font-bold' : ''}>
                              {interiorAudioElectronics === 'not_working' ? '☑ لا تعمل' : '☐ لا تعمل'}
                            </span>
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. الفحص الميكانيكي (Mechanical) */}
                <div className="border border-slate-300 rounded-lg p-2 bg-white shadow-2xs">
                  <h4 className="font-black text-[11px] text-amber-900 border-b border-slate-200 pb-1 mb-1 flex items-center justify-between">
                    <span>5. الفحص الميكانيكي (Mechanical)</span>
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                  </h4>
                  <table className="w-full text-[10px]">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 font-bold text-slate-700">المحرك:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-2">
                            <span>{mechanicalEngine === 'good' ? '☑ جيد' : '☐ جيد'}</span>
                            <span>{mechanicalEngine === 'abnormal_sound' ? '☑ صوت غير طبيعي' : '☐ صوت'}</span>
                            <span className={mechanicalEngine === 'oil_leak' ? 'text-rose-700 font-bold' : ''}>
                              {mechanicalEngine === 'oil_leak' ? '☑ تسريب زيت' : '☐ تسريب زيت'}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 font-bold text-slate-700">ناقل الحركة:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-2">
                            <span>{mechanicalTransmission === 'good' ? '☑ جيد' : '☐ جيد'}</span>
                            <span>{mechanicalTransmission === 'shifting_issues' ? '☑ مشاكل تبديل' : '☐ مشاكل تبديل'}</span>
                            <span className={mechanicalTransmission === 'needs_repair' ? 'text-rose-700 font-bold' : ''}>
                              {mechanicalTransmission === 'needs_repair' ? '☑ يحتاج إصلاح' : '☐ يحتاج إصلاح'}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 font-bold text-slate-700">الفرامل:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-2">
                            <span>{mechanicalBrakes === 'good' ? '☑ جيدة' : '☐ جيدة'}</span>
                            <span>{mechanicalBrakes === 'noise' ? '☑ صوت' : '☐ صوت'}</span>
                            <span className={mechanicalBrakes === 'needs_replacement' ? 'text-rose-700 font-bold' : ''}>
                              {mechanicalBrakes === 'needs_replacement' ? '☑ تحتاج تغيير' : '☐ تحتاج تغيير'}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 font-bold text-slate-700">نظام التعليق:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-2">
                            <span>{mechanicalSuspension === 'good' ? '☑ جيد' : '☐ جيد'}</span>
                            <span>{mechanicalSuspension === 'noise' ? '☑ أصوات' : '☐ أصوات'}</span>
                            <span className={mechanicalSuspension === 'needs_repair' ? 'text-rose-700 font-bold' : ''}>
                              {mechanicalSuspension === 'needs_repair' ? '☑ يحتاج إصلاح' : '☐ يحتاج إصلاح'}
                            </span>
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 6. الفحص الإلكتروني (Electronic & OBD2) */}
                <div className="border border-slate-300 rounded-lg p-2 bg-white shadow-2xs">
                  <h4 className="font-black text-[11px] text-purple-900 border-b border-slate-200 pb-1 mb-1 flex items-center justify-between">
                    <span>6. الفحص الإلكتروني (Electronic / OBD2)</span>
                    <Cpu className="w-3.5 h-3.5 text-purple-600" />
                  </h4>
                  <table className="w-full text-[10px]">
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 font-bold text-slate-700">حساس الأكسجين:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-3">
                            <span>{electronicO2Sensor === 'intact' ? '☑ سليم' : '☐ سليم'}</span>
                            <span className={electronicO2Sensor === 'needs_replacement' ? 'text-rose-700 font-bold' : ''}>
                              {electronicO2Sensor === 'needs_replacement' ? '☑ يحتاج تغيير' : '☐ يحتاج تغيير'}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 font-bold text-slate-700">حساس ABS:</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-3">
                            <span>{electronicABSSensor === 'intact' ? '☑ سليم' : '☐ سليم'}</span>
                            <span className={electronicABSSensor === 'needs_replacement' ? 'text-rose-700 font-bold' : ''}>
                              {electronicABSSensor === 'needs_replacement' ? '☑ يحتاج تغيير' : '☐ يحتاج تغيير'}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="py-1 font-bold text-slate-700">لمبة المكينة (Check Engine):</td>
                        <td className="py-1 text-left">
                          <span className="inline-flex gap-3 font-bold">
                            <span className={electronicCheckEngine === 'off' ? 'text-emerald-700' : ''}>
                              {electronicCheckEngine === 'off' ? '☑ مطفأة' : '☐ مطفأة'}
                            </span>
                            <span className={electronicCheckEngine === 'on' ? 'text-rose-700' : ''}>
                              {electronicCheckEngine === 'on' ? '☑ مضاءة' : '☐ مضاءة'}
                            </span>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 font-bold text-slate-700 whitespace-nowrap">قراءة جهاز OBD2:</td>
                        <td className="py-1 text-left font-mono font-bold text-blue-950 text-[9.5px]">
                          {electronicOBD2Reading || 'No Diagnostic Trouble Codes (DTC)'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* 7. الملاحظات العامة (General Notes) */}
              <div className="border border-slate-300 rounded-lg p-2 bg-slate-50/60 print:break-inside-avoid">
                <h4 className="font-black text-[11px] text-slate-900 mb-0.5">7. الملاحظات العامة:</h4>
                <p className="text-[10px] text-slate-800 leading-relaxed font-medium">
                  {generalNotes || 'لا توجد ملاحظات إضافية، تم تدقيق كافة العناصر طبقاً لدليل الفحص الفني المعتمد.'}
                </p>
              </div>

              {/* 8. التوصية الفنية (Recommendation Banner) */}
              <div className="border-2 border-slate-900 rounded-xl p-2.5 bg-white print:break-inside-avoid">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-xs text-slate-900 mb-1">8. التوصية الفنية المعتمدة:</h4>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                        recommendation === 'good_condition'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-black shadow-xs'
                          : 'text-slate-500 border-transparent opacity-60'
                      }`}>
                        {recommendation === 'good_condition' ? '☑' : '☐'} السيارة بحالة جيدة
                      </span>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                        recommendation === 'minor_repairs'
                          ? 'bg-amber-100 text-amber-900 border-amber-400 font-black shadow-xs'
                          : 'text-slate-500 border-transparent opacity-60'
                      }`}>
                        {recommendation === 'minor_repairs' ? '☑' : '☐'} تحتاج إصلاحات بسيطة
                      </span>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                        recommendation === 'major_repairs'
                          ? 'bg-rose-100 text-rose-900 border-rose-400 font-black shadow-xs'
                          : 'text-slate-500 border-transparent opacity-60'
                      }`}>
                        {recommendation === 'major_repairs' ? '☑' : '☐'} تحتاج إصلاحات كبيرة
                      </span>
                    </div>
                  </div>

                  {/* Recommendation Badge */}
                  <div className="text-center pl-2">
                    <span className="text-[9px] font-bold text-slate-500 block">نتيجة الفحص</span>
                    <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs uppercase ${
                      recommendation === 'good_condition'
                        ? 'bg-emerald-600 text-white'
                        : recommendation === 'minor_repairs'
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {recommendation === 'good_condition'
                        ? 'ناجح / معتمد'
                        : recommendation === 'minor_repairs'
                        ? 'صيانة دورية'
                        : 'فحص ميكانيكي عاجل'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures & Certification Footer (Inspector + Recipient + Seal) */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t-2 border-slate-900 print:break-inside-avoid text-center">
                {/* 1. Inspector Signature */}
                <div className="space-y-1">
                  <p className="font-black text-[10.5px] text-slate-900">1. توقيع الفاحص الفني</p>
                  <div className="h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-1 bg-white">
                    {inspectorSignature ? (
                      <img src={inspectorSignature} alt="Inspector Signature" className="max-h-full object-contain" />
                    ) : (
                      <span className="text-[9.5px] text-slate-400 italic">توقيع المهندس الفاحص</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full text-center text-[10px] font-bold text-slate-800 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
                    placeholder="اسم الفاحص..."
                  />
                </div>

                {/* 2. Recipient Signature & Name */}
                <div className="space-y-1">
                  <p className="font-black text-[10.5px] text-slate-900">2. اسم المستلم والتوقيع</p>
                  <div className="h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-1 bg-white">
                    {recipientSignature ? (
                      <img src={recipientSignature} alt="Recipient Signature" className="max-h-full object-contain" />
                    ) : (
                      <span className="text-[9.5px] text-slate-400 italic">توقيع المستلم / العميل</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full text-center text-[10px] font-black text-blue-900 bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 placeholder:text-slate-400"
                      placeholder="اسم المستلم: ...................."
                    />
                    {recipientCivilId ? (
                      <p className="text-[8.5px] text-slate-500 font-mono">هوية: {recipientCivilId}</p>
                    ) : null}
                  </div>
                </div>

                {/* 3. Company Seal */}
                <div className="space-y-1">
                  <p className="font-black text-[10.5px] text-slate-900">3. ختم ومصادقة الإدارة</p>
                  <div className="h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-1 bg-white">
                    <div className="text-center">
                      <span className="text-[10px] font-black text-blue-900 block">{settings.organizationName || 'SHAKER MOTORS'}</span>
                      <span className="text-[8px] text-slate-500">معتمد رسمياً للجودة والتشغيل</span>
                    </div>
                  </div>
                  <p className="text-[9.5px] font-bold text-slate-600">مركز الفحص والصيانة</p>
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
    </div>
  );
};
