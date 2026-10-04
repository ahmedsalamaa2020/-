import React, { useState, useRef } from 'react';
import {
  AlertTriangle,
  Plus,
  Trash2,
  Camera,
  Upload,
  Eye,
  X,
  Info,
  Sparkles,
  Layers,
} from 'lucide-react';
import { DamagePoint, DamagePart, DamageType, DamageSeverity, Language } from '../types';

interface VehicleDamageInspectorProps {
  damagePoints: DamagePoint[];
  onChange: (points: DamagePoint[]) => void;
  lang: Language;
  readOnly?: boolean;
}

export const VehicleDamageInspector: React.FC<VehicleDamageInspectorProps> = ({
  damagePoints = [],
  onChange,
  lang,
  readOnly = false,
}) => {
  const [activePart, setActivePart] = useState<DamagePart>('top');
  const [selectedPoint, setSelectedPoint] = useState<DamagePoint | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number } | null>(null);

  // New Damage Point Form State
  const [damageType, setDamageType] = useState<DamageType>('scratch');
  const [severity, setSeverity] = useState<DamageSeverity>('minor');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const diagramRef = useRef<HTMLDivElement>(null);

  const partsList: { id: DamagePart; labelAr: string; labelEn: string; icon: string }[] = [
    { id: 'top', labelAr: 'المخطط العام (أعلى/هيكل كامل)', labelEn: 'Top / Full Body', icon: '🚗' },
    { id: 'front', labelAr: 'المقدمة والصدام الأمامي', labelEn: 'Front & Bumper', icon: '🚘' },
    { id: 'rear', labelAr: 'الخلفية والشنطة', labelEn: 'Rear & Trunk', icon: '🚙' },
    { id: 'left', labelAr: 'الجانب الأيسر', labelEn: 'Left Side', icon: '◀️' },
    { id: 'right', labelAr: 'الجانب الأيمن', labelEn: 'Right Side', icon: '▶️' },
    { id: 'interior', labelAr: 'المقصورة والفرش الداخلي', labelEn: 'Interior & Seats', icon: '💺' },
  ];

  const typeLabels: Record<DamageType, { ar: string; en: string; color: string }> = {
    scratch: { ar: 'خدش سطحي', en: 'Scratch', color: 'bg-amber-500' },
    dent: { ar: 'صدمة / انبعاج', en: 'Dent', color: 'bg-rose-500' },
    crack: { ar: 'كسر / شرخ', en: 'Crack', color: 'bg-red-600' },
    paint: { ar: 'تقشير أو بهتان دهان', en: 'Paint Chipping', color: 'bg-orange-500' },
    burn: { ar: 'حرق أو بقعة فرش', en: 'Burn / Stain', color: 'bg-purple-500' },
    missing: { ar: 'قطعة مفقودة / مكسورة', en: 'Missing Part', color: 'bg-slate-700' },
    other: { ar: 'ملاحظة أخرى', en: 'Other', color: 'bg-blue-500' },
  };

  const severityLabels: Record<DamageSeverity, { ar: string; en: string; badge: string }> = {
    minor: { ar: 'خفيف', en: 'Minor', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300' },
    medium: { ar: 'متوسط', en: 'Medium', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300' },
    severe: { ar: 'جسيم / كبير', en: 'Severe', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
  };

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    setPendingCoords({ x, y });
    setDamageType('scratch');
    setSeverity('minor');
    setNotes('');
    setPhotoUrl('');
    setIsAddModalOpen(true);
  };

  const handleSaveDamage = () => {
    if (!pendingCoords) return;
    const newPoint: DamagePoint = {
      id: `dmg_${Date.now()}`,
      part: activePart,
      x: pendingCoords.x,
      y: pendingCoords.y,
      type: damageType,
      severity,
      notes: notes.trim(),
      photoUrl: photoUrl || undefined,
      createdAt: new Date().toISOString(),
    };

    onChange([...damagePoints, newPoint]);
    setIsAddModalOpen(false);
    setPendingCoords(null);
  };

  const handleDeletePoint = (id: string) => {
    onChange(damagePoints.filter((p) => p.id !== id));
    if (selectedPoint?.id === id) {
      setSelectedPoint(null);
    }
  };

  const activePoints = damagePoints.filter((p) => p.part === activePart);

  return (
    <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
      {/* Header & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              {lang === 'ar' ? 'فاحص ومخطط صدمات وخدوش السيارة التفاعلي' : 'Interactive Vehicle Damage & Scratch Inspector'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {lang === 'ar'
                ? 'انقر على أي جزء من هيكل السيارة لتحديد موقع الخدش أو الصدمة وتوثيقها بالصور'
                : 'Click any car body area to pinpoint scratches or dents with photos & notes'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
            {lang === 'ar' ? `إجمالي الملاحظات: ${damagePoints.length}` : `Damages: ${damagePoints.length}`}
          </span>
        </div>
      </div>

      {/* Part Selection Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl">
        {partsList.map((part) => {
          const count = damagePoints.filter((p) => p.part === part.id).length;
          const isActive = activePart === part.id;
          return (
            <button
              key={part.id}
              type="button"
              onClick={() => setActivePart(part.id)}
              className={`flex-1 min-w-[120px] sm:min-w-0 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60'
              }`}
            >
              <span>{part.icon}</span>
              <span>{lang === 'ar' ? part.labelAr : part.labelEn}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive ? 'bg-white text-blue-700' : 'bg-rose-600 text-white'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Interactive Blueprint Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Visual Schematics (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[340px]">
            {!readOnly && (
              <div className="absolute top-2 right-2 z-10 bg-blue-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs pointer-events-none flex items-center gap-1">
                <Plus className="w-3 h-3" />
                <span>{lang === 'ar' ? 'اضغط لتحديد صدمة أو خدش' : 'Click to add marker'}</span>
              </div>
            )}

            {/* Render Diagram per active part */}
            <div
              ref={diagramRef}
              onClick={handleDiagramClick}
              className={`relative w-full max-w-[420px] aspect-[4/3] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner select-none ${
                readOnly ? 'cursor-default' : 'cursor-crosshair hover:ring-2 hover:ring-blue-500/30'
              }`}
            >
              {/* Car Graphic representation */}
              {activePart === 'top' && (
                <svg viewBox="0 0 400 300" className="w-full h-full p-4">
                  {/* Car body top view */}
                  <rect x="130" y="30" width="140" height="240" rx="35" fill="none" stroke="#64748b" strokeWidth="4" strokeDasharray="1 0" />
                  {/* Front Hood */}
                  <path d="M 135 65 Q 200 45 265 65" fill="none" stroke="#94a3b8" strokeWidth="3" />
                  <text x="200" y="45" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">الأمام (Front)</text>
                  {/* Windshield */}
                  <rect x="145" y="75" width="110" height="35" rx="8" fill="#e2e8f0" fillOpacity="0.4" stroke="#94a3b8" strokeWidth="2" />
                  {/* Roof */}
                  <rect x="145" y="115" width="110" height="70" rx="5" fill="none" stroke="#cbd5e1" strokeWidth="2" />
                  <text x="200" y="155" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">السقف (Roof)</text>
                  {/* Rear Windshield */}
                  <rect x="145" y="190" width="110" height="30" rx="8" fill="#e2e8f0" fillOpacity="0.4" stroke="#94a3b8" strokeWidth="2" />
                  {/* Trunk */}
                  <path d="M 135 235 Q 200 255 265 235" fill="none" stroke="#94a3b8" strokeWidth="3" />
                  <text x="200" y="260" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">الشنطة (Trunk / Rear)</text>
                  {/* Wheels */}
                  <rect x="108" y="55" width="18" height="40" rx="4" fill="#334155" />
                  <rect x="274" y="55" width="18" height="40" rx="4" fill="#334155" />
                  <rect x="108" y="200" width="18" height="40" rx="4" fill="#334155" />
                  <rect x="274" y="200" width="18" height="40" rx="4" fill="#334155" />
                  {/* Side Mirrors */}
                  <path d="M 125 80 L 115 75 L 125 70 Z" fill="#64748b" />
                  <path d="M 275 80 L 285 75 L 275 70 Z" fill="#64748b" />
                </svg>
              )}

              {activePart === 'front' && (
                <svg viewBox="0 0 400 300" className="w-full h-full p-4">
                  {/* Front View */}
                  <path d="M 80 180 Q 80 100 130 80 Q 200 70 270 80 Q 320 100 320 180 L 320 220 Q 320 240 290 240 L 110 240 Q 80 240 80 220 Z" fill="none" stroke="#64748b" strokeWidth="4" />
                  {/* Front Windshield */}
                  <path d="M 125 90 Q 200 82 275 90 L 290 140 Q 200 135 110 140 Z" fill="#e2e8f0" fillOpacity="0.4" stroke="#94a3b8" strokeWidth="2" />
                  {/* Headlights */}
                  <polygon points="90,165 140,165 130,190 90,185" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
                  <polygon points="310,165 260,165 270,190 310,185" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
                  {/* Front Grille */}
                  <rect x="155" y="165" width="90" height="35" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                  <text x="200" y="187" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">الشبك واللوحة</text>
                  {/* Bumper */}
                  <rect x="90" y="210" width="220" height="25" rx="5" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" />
                  <text x="200" y="226" textAnchor="middle" fill="#475569" fontSize="10" fontWeight="bold">الصدام الأمامي</text>
                </svg>
              )}

              {activePart === 'rear' && (
                <svg viewBox="0 0 400 300" className="w-full h-full p-4">
                  {/* Rear View */}
                  <path d="M 80 180 Q 80 100 130 80 Q 200 70 270 80 Q 320 100 320 180 L 320 220 Q 320 240 290 240 L 110 240 Q 80 240 80 220 Z" fill="none" stroke="#64748b" strokeWidth="4" />
                  {/* Rear Window */}
                  <path d="M 125 90 Q 200 82 275 90 L 290 140 Q 200 135 110 140 Z" fill="#e2e8f0" fillOpacity="0.4" stroke="#94a3b8" strokeWidth="2" />
                  {/* Taillights */}
                  <polygon points="90,165 140,165 130,190 90,185" fill="#fca5a5" stroke="#dc2626" strokeWidth="2" />
                  <polygon points="310,165 260,165 270,190 310,185" fill="#fca5a5" stroke="#dc2626" strokeWidth="2" />
                  {/* License Plate Area */}
                  <rect x="160" y="170" width="80" height="28" rx="4" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
                  <text x="200" y="188" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="bold">لوحة المركبة</text>
                  {/* Rear Bumper & Exhaust */}
                  <rect x="90" y="210" width="220" height="25" rx="5" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" />
                  <text x="200" y="226" textAnchor="middle" fill="#475569" fontSize="10" fontWeight="bold">الصدام الخلفي</text>
                </svg>
              )}

              {(activePart === 'left' || activePart === 'right') && (
                <svg viewBox="0 0 400 300" className="w-full h-full p-4">
                  {/* Car Profile View */}
                  <path d="M 40 180 Q 50 140 90 135 L 140 100 Q 180 85 240 85 L 300 105 L 350 140 Q 370 150 370 180 L 370 210 Q 370 220 350 220 L 40 220 Z" fill="none" stroke="#64748b" strokeWidth="3" />
                  {/* Windows */}
                  <path d="M 145 105 L 210 105 L 210 140 L 120 140 Z" fill="#e2e8f0" fillOpacity="0.4" stroke="#94a3b8" strokeWidth="2" />
                  <path d="M 220 105 L 285 115 L 310 140 L 220 140 Z" fill="#e2e8f0" fillOpacity="0.4" stroke="#94a3b8" strokeWidth="2" />
                  {/* Doors line */}
                  <line x1="215" y1="105" x2="215" y2="210" stroke="#94a3b8" strokeWidth="2" />
                  {/* Wheels Cutouts */}
                  <circle cx="100" cy="210" r="30" fill="#334155" />
                  <circle cx="100" cy="210" r="18" fill="#94a3b8" />
                  <circle cx="310" cy="210" r="30" fill="#334155" />
                  <circle cx="310" cy="210" r="18" fill="#94a3b8" />
                  <text x="200" y="180" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
                    {activePart === 'left' ? 'البابين والرفرف الأيسر' : 'البابين والرفرف الأيمن'}
                  </text>
                </svg>
              )}

              {activePart === 'interior' && (
                <svg viewBox="0 0 400 300" className="w-full h-full p-4">
                  {/* Interior / Seats view */}
                  <rect x="70" y="40" width="260" height="220" rx="20" fill="none" stroke="#64748b" strokeWidth="3" />
                  {/* Dashboard */}
                  <rect x="85" y="55" width="230" height="40" rx="8" fill="#334155" />
                  <text x="200" y="80" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold">لوحة القيادة والمكيف (Dashboard)</text>
                  {/* Front Driver Seat */}
                  <rect x="95" y="110" width="90" height="65" rx="10" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
                  <text x="140" y="147" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">مقعد السائق</text>
                  {/* Front Passenger Seat */}
                  <rect x="215" y="110" width="90" height="65" rx="10" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
                  <text x="260" y="147" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">مقعد الراكب</text>
                  {/* Rear Bench Seat */}
                  <rect x="95" y="195" width="210" height="50" rx="10" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
                  <text x="200" y="225" textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="bold">الكنبة الخلفية والفرش</text>
                </svg>
              )}

              {/* Render Damage Pin Markers on top */}
              {activePoints.map((point) => {
                const info = typeLabels[point.type] || typeLabels.other;
                const isSelected = selectedPoint?.id === point.id;
                return (
                  <button
                    key={point.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPoint(point);
                    }}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full text-white shadow-lg transition-transform hover:scale-125 focus:scale-125 z-20 cursor-pointer ${
                      info.color
                    } ${isSelected ? 'ring-4 ring-blue-500 scale-125' : 'ring-2 ring-white'}`}
                    title={`${info.ar} (${severityLabels[point.severity].ar})`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Damage Ledger & Selected Pin Details (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>{lang === 'ar' ? 'سجل الملاحظات والتلفيات المرصودة' : 'Logged Damage Marks'}</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              {damagePoints.length} {lang === 'ar' ? 'ملاحظة' : 'items'}
            </span>
          </div>

          {/* List of damages */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {damagePoints.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                <Info className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                <p>{lang === 'ar' ? 'السيارة سليمة تماماً ولا توجد ملاحظات أو خدوش مسجلة' : 'Vehicle is in pristine condition, no damage recorded'}</p>
              </div>
            ) : (
              damagePoints.map((point, idx) => {
                const typeInfo = typeLabels[point.type] || typeLabels.other;
                const partInfo = partsList.find((p) => p.id === point.part);
                const sevInfo = severityLabels[point.severity];
                const isSelected = selectedPoint?.id === point.id;

                return (
                  <div
                    key={point.id}
                    onClick={() => {
                      setActivePart(point.part);
                      setSelectedPoint(point);
                    }}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${typeInfo.color}`} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            #{idx + 1} {lang === 'ar' ? typeInfo.ar : typeInfo.en}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${sevInfo.badge}`}>
                            {lang === 'ar' ? sevInfo.ar : sevInfo.en}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {partInfo ? (lang === 'ar' ? partInfo.labelAr : partInfo.labelEn) : point.part}
                        </p>
                        {point.notes && (
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate mt-0.5">
                            {point.notes}
                          </p>
                        )}
                        {point.photoUrl && (
                          <div className="mt-1.5">
                            <img
                              src={point.photoUrl}
                              alt="Damage"
                              className="w-12 h-9 object-cover rounded-md border border-slate-300 shadow-2xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePoint(point.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                        title={lang === 'ar' ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Damage Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{lang === 'ar' ? 'تسجيل وتوثيق عيب / صدمة' : 'Record Damage Details'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'نوع الضرر / العيب' : 'Damage Type'}
                </label>
                <select
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value as DamageType)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                >
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {lang === 'ar' ? v.ar : v.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'درجة الخطورة / الحجم' : 'Severity'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(severityLabels).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSeverity(k as DamageSeverity)}
                      className={`py-1.5 px-2 rounded-xl font-bold text-center border transition ${
                        severity === k
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {lang === 'ar' ? v.ar : v.en}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'وصف تفصيلي للملاحظة' : 'Description / Notes'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثلاً: خدش طولي حوالي 10 سم في الرفرف...' : 'e.g. 10cm scratch on the bumper...'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Photo Upload */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="block font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'إرفاق صورة للضرر (اختياري)' : 'Attach Damage Photo (Optional)'}
                </span>

                <div className="flex items-center gap-3">
                  {photoUrl ? (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300 shrink-0">
                      <img src={photoUrl} alt="Damage Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-0 right-0 p-0.5 bg-rose-600 text-white rounded-bl-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}

                  <label className="cursor-pointer px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'رفع صورة من الجهاز' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setPhotoUrl(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveDamage}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition"
              >
                {lang === 'ar' ? 'حفظ وتثبيت العلامة' : 'Save Damage Marker'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
