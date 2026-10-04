import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Car as CarIcon,
  AlertTriangle,
  Wrench,
  Gauge,
  DollarSign,
  Tag,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  FileText,
  Printer,
  Trash2,
  Eye,
  Sliders,
  Sparkles,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { AppSettings, Car, CarCategory, CarStatus, Currency, Language, VehicleInspectionReport } from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { VehicleInspectionModal } from './VehicleInspectionModal';

interface CarModuleProps {
  cars: Car[];
  onAddCar: (car: Car) => void;
  onUpdateCar: (car: Car) => void;
  onDeleteCar: (id: string) => void;
  settings: AppSettings;
  inspectionReports?: VehicleInspectionReport[];
  onSaveInspectionReport?: (report: VehicleInspectionReport) => void;
  onDeleteInspectionReport?: (id: string) => void;
  currency: Currency;
  lang: Language;
  selectedCarId?: string;
  onClearTarget?: () => void;
  onAddMaintenanceRecord?: (record: any) => void;
}

export const CarModule: React.FC<CarModuleProps> = ({
  cars,
  onAddCar,
  onUpdateCar,
  onDeleteCar,
  settings,
  inspectionReports = [],
  onSaveInspectionReport,
  onDeleteInspectionReport,
  currency,
  lang,
  selectedCarId,
  onClearTarget,
  onAddMaintenanceRecord,
}) => {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  useEffect(() => {
    if (selectedCarId) {
      const found = cars.find((c) => c.id === selectedCarId);
      if (found) {
        setSearchTerm(found.plateNumber || `${found.brand} ${found.model}`);
        setStatusFilter('all');
      }
    }
  }, [selectedCarId, cars]);

  // Inspection Modal State
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedCarForInspection, setSelectedCarForInspection] = useState<Car | null>(null);
  const [activeInspectionReport, setActiveInspectionReport] = useState<VehicleInspectionReport | null>(null);
  const [isReportsArchiveOpen, setIsReportsArchiveOpen] = useState(false);
  const [reportsSearchTerm, setReportsSearchTerm] = useState('');

  // Odometer Update Modal
  const [odometerCar, setOdometerCar] = useState<Car | null>(null);
  const [newMileage, setNewMileage] = useState<number>(0);

  // Form State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [plateNumber, setPlateNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [motorNumber, setMotorNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerCivilId, setOwnerCivilId] = useState('');
  const [category, setCategory] = useState<CarCategory>('sedan');
  const [color, setColor] = useState('');
  const [status, setStatus] = useState<CarStatus>('available');
  const [dailyRate, setDailyRate] = useState<number>(200);
  const [salePrice, setSalePrice] = useState<number>(80000);
  const [currentMileage, setCurrentMileage] = useState<number>(10000);
  const [maintenanceThreshold, setMaintenanceThreshold] = useState<number>(10000);
  const [lastServiceMileage, setLastServiceMileage] = useState<number>(0);
  const [nextServiceMileage, setNextServiceMileage] = useState<number>(20000);
  const [isEarlyOilChangeOdometer, setIsEarlyOilChangeOdometer] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingCar(null);
    setBrand('');
    setModel('');
    setYear(2025);
    setPlateNumber('');
    setChassisNumber('');
    setMotorNumber('');
    setOwnerName('');
    setOwnerPhone('');
    setOwnerCivilId('');
    setCategory('sedan');
    setColor('');
    setStatus('available');
    setDailyRate(200);
    setSalePrice(80000);
    setCurrentMileage(5000);
    setMaintenanceThreshold(10000);
    setLastServiceMileage(5000);
    setNextServiceMileage(15000);
    setPhotoUrl('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (car: Car) => {
    setEditingCar(car);
    setBrand(car.brand);
    setModel(car.model);
    setYear(car.year);
    setPlateNumber(car.plateNumber);
    setChassisNumber(car.chassisNumber);
    setMotorNumber(car.motorNumber || '');
    setOwnerName(car.ownerName || '');
    setOwnerPhone(car.ownerPhone || '');
    setOwnerCivilId(car.ownerCivilId || '');
    setCategory(car.category);
    setColor(car.color);
    setStatus(car.status);
    setDailyRate(car.dailyRate);
    setSalePrice(car.salePrice);
    setCurrentMileage(car.currentMileage);
    setMaintenanceThreshold(car.maintenanceThreshold || 10000);
    const lastServ = car.lastServiceMileage ?? car.currentMileage;
    const th = car.maintenanceThreshold || 10000;
    setLastServiceMileage(lastServ);
    setNextServiceMileage(car.nextServiceMileage ?? (lastServ + th));
    setPhotoUrl(car.photoUrl || '');
    setNotes(car.notes || '');
    setIsModalOpen(true);
  };

  const handleOpenInspection = (car?: Car) => {
    setSelectedCarForInspection(car || null);
    setActiveInspectionReport(null);
    setIsInspectionModalOpen(true);
  };

  const handleViewExistingReport = (report: VehicleInspectionReport) => {
    setActiveInspectionReport(report);
    const associatedCar = cars.find((c) => c.id === report.carId);
    setSelectedCarForInspection(associatedCar || null);
    setIsInspectionModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !model || !plateNumber) return;

    const threshold = maintenanceThreshold || 10000;
    const computedNextDue = nextServiceMileage > lastServiceMileage
      ? nextServiceMileage
      : (lastServiceMileage + threshold);

    if (editingCar) {
      onUpdateCar({
        ...editingCar,
        brand,
        model,
        year,
        plateNumber,
        chassisNumber,
        motorNumber,
        ownerName,
        ownerPhone,
        ownerCivilId,
        category,
        color,
        status,
        dailyRate,
        salePrice,
        currentMileage,
        maintenanceThreshold: threshold,
        lastServiceMileage,
        nextServiceMileage: computedNextDue,
        photoUrl,
        notes,
      });
    } else {
      const newCarObj: Car = {
        id: `car_${Date.now()}`,
        brand,
        model,
        year,
        plateNumber,
        chassisNumber,
        motorNumber,
        ownerName,
        ownerPhone,
        ownerCivilId,
        category,
        color,
        status,
        dailyRate,
        salePrice,
        currentMileage,
        maintenanceThreshold: threshold,
        lastServiceMileage: currentMileage,
        nextServiceMileage: currentMileage + threshold,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        notes,
      };
      onAddCar(newCarObj);
    }
    setIsModalOpen(false);
  };

  const handleUpdateOdometer = () => {
    if (!odometerCar) return;
    const th = odometerCar.maintenanceThreshold || 10000;
    
    if (isEarlyOilChangeOdometer) {
      const calculatedNextDue = newMileage + th;
      const updated: Car = {
        ...odometerCar,
        currentMileage: newMileage,
        lastServiceMileage: newMileage,
        nextServiceMileage: calculatedNextDue,
        status: odometerCar.status === 'maintenance' ? 'available' : odometerCar.status,
      };
      onUpdateCar(updated);

      if (onAddMaintenanceRecord) {
        onAddMaintenanceRecord({
          id: `maint_${Date.now()}`,
          carId: odometerCar.id,
          carModel: `${odometerCar.brand} ${odometerCar.model} ${odometerCar.year}`,
          carPlate: odometerCar.plateNumber,
          serviceDate: new Date().toISOString().split('T')[0],
          mileageAtService: newMileage,
          serviceType: 'oil_change',
          cost: 0,
          vendor: lang === 'ar' ? 'صيانة زيت مبكرة (تحديث العداد)' : 'Early Oil Service (Odometer Update)',
          status: 'completed',
          completedDate: new Date().toISOString().split('T')[0],
          notes: lang === 'ar'
            ? `تم تحديث العداد إلى ${newMileage.toLocaleString()} كم وتسجيل صيانة زيت مبكرة، واستحقاق الصيانة القادمة عند ${calculatedNextDue.toLocaleString()} كم.`
            : `Odometer updated to ${newMileage.toLocaleString()} KM with early oil service. Next service at ${calculatedNextDue.toLocaleString()} KM.`,
          nextDueMileage: calculatedNextDue,
        });
      }
    } else {
      const updated: Car = {
        ...odometerCar,
        currentMileage: newMileage,
      };
      onUpdateCar(updated);
    }
    setOdometerCar(null);
  };

  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.chassisNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (car.motorNumber && car.motorNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (car.ownerName && car.ownerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || car.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredInspectionReports = inspectionReports.filter((rep) => {
    const term = reportsSearchTerm.toLowerCase();
    return (
      rep.reportNumber.toLowerCase().includes(term) ||
      rep.carModel.toLowerCase().includes(term) ||
      rep.plateNumber.toLowerCase().includes(term) ||
      rep.chassisNumber.toLowerCase().includes(term) ||
      rep.inspectorName.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (st: CarStatus) => {
    switch (st) {
      case 'available':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.available}
          </span>
        );
      case 'rented':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {t.rented}
          </span>
        );
      case 'maintenance':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5" />
            {t.maintenanceStatus}
          </span>
        );
      case 'sold':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {t.sold}
          </span>
        );
      default:
        return null;
    }
  };

  const overdueCars = cars.filter(
    (c) => c.currentMileage >= c.nextServiceMileage && c.status !== 'maintenance' && c.status !== 'sold'
  );

  return (
    <div className="space-y-6">
      {/* Maintenance Alert Banner */}
      {overdueCars.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-amber-900 dark:text-amber-200 text-sm">
                {t.maintenanceAlert} ({overdueCars.length} {lang === 'ar' ? 'سيارات مستحقة الصيانة' : 'vehicles due for service'})
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                {t.overdueMaintenanceAlert}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {overdueCars.map((c) => (
              <button
                key={c.id}
                onClick={() => onUpdateCar({ ...c, status: 'maintenance' })}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                {t.sendToMaintenance}: {c.plateNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CarIcon className="w-6 h-6 text-blue-600" />
            <span>{t.carList}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar' ? 'إدارة الأسطول، الفحص الفني الشامل، متابعة العدادات وحالة المركبات' : 'Fleet management, vehicle inspection forms, and odometer tracking'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Inspection Reports Archive Button */}
          {inspectionReports.length > 0 && (
            <button
              onClick={() => setIsReportsArchiveOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs border border-slate-300 dark:border-slate-700 transition shadow-xs"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>تقارير الفحص ({inspectionReports.length})</span>
            </button>
          )}

          {/* New Vehicle Inspection Form Button */}
          <button
            onClick={() => handleOpenInspection()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>📝 نموذج فحص سيارة</span>
          </button>

          {/* Add Car Button */}
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addCar}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-3.5 rtl:right-3.5 ltr:left-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rtl:pr-10 ltr:pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{lang === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
          <option value="available">{t.available}</option>
          <option value="rented">{t.rented}</option>
          <option value="maintenance">{t.maintenanceStatus}</option>
          <option value="sold">{t.sold}</option>
        </select>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCars.map((car) => {
          const isServiceDue = car.currentMileage >= car.nextServiceMileage && car.status !== 'maintenance' && car.status !== 'sold';

          return (
            <div
              key={car.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                isServiceDue
                  ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30'
                  : 'border-slate-200 dark:border-slate-800'
              } p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden relative`}
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-4">
                  <img
                    src={car.photoUrl}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 rtl:right-2 ltr:left-2">
                    {getStatusBadge(car.status)}
                  </div>
                  {isServiceDue && (
                    <div className="absolute top-2 rtl:left-2 ltr:right-2 px-2.5 py-1 bg-amber-500 text-white font-extrabold text-[10px] rounded-full shadow-md flex items-center gap-1 animate-bounce">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'صيانة مستحقة' : 'Service Due'}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
                      {car.brand} {car.model}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {car.year}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                        <span>{t.color}: {car.color || (lang === 'ar' ? 'غير محدد' : 'Unspecified')}</span>
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">
                        {car.plateNumber}
                      </span>
                    </div>
                  </div>
                  <div className="text-right rtl:text-left">
                    <span className="text-xs text-slate-400 block">{t.dailyRate}</span>
                    <span className="font-black text-blue-600 dark:text-blue-400 text-base">
                      {formatCurrency(car.dailyRate, currency, lang)}
                    </span>
                  </div>
                </div>

                {/* Mileage & Maintenance Meter */}
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t.currentMileage}</span>
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {car.currentMileage.toLocaleString()} KM
                    </span>
                  </div>

                  {/* Progress towards service */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        isServiceDue ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          ((car.currentMileage - car.lastServiceMileage) /
                            car.maintenanceThreshold) *
                            100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>{t.nextServiceMileage}: {car.nextServiceMileage.toLocaleString()} KM</span>
                    <button
                      onClick={() => {
                        setOdometerCar(car);
                        setNewMileage(car.currentMileage);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      {t.updateOdometer}
                    </button>
                  </div>
                </div>
              </div>

              {/* Technical & Owner Info Section */}
              {(car.motorNumber || car.ownerName) && (
                <div className="mt-3 p-2.5 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 text-xs space-y-1">
                  {car.motorNumber && (
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">{t.motorNumber}:</span>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{car.motorNumber}</span>
                    </div>
                  )}
                  {car.ownerName && (
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">{t.ownerName}:</span>
                      <span className="font-bold">{car.ownerName}</span>
                    </div>
                  )}
                  {car.ownerPhone && (
                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">{t.ownerPhone}:</span>
                      <span dir="ltr">{car.ownerPhone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500 truncate max-w-[150px]">
                  {t.chassisNumber}: {car.chassisNumber}
                </span>
                
                <div className="flex items-center gap-1.5">
                  {/* Quick Complete Maintenance Button if vehicle is under maintenance */}
                  {car.status === 'maintenance' && (
                    <button
                      onClick={() => {
                        const updated: Car = {
                          ...car,
                          status: 'available',
                          lastServiceMileage: car.currentMileage,
                          nextServiceMileage: car.currentMileage + (car.maintenanceThreshold || 10000),
                        };
                        onUpdateCar(updated);
                      }}
                      title={lang === 'ar' ? 'إتمام الصيانة وخروج السيارة - إتاحة فورية' : 'Complete Maintenance & Release'}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'إتمام الصيانة' : 'Finish Service'}</span>
                    </button>
                  )}

                  {/* Inspection Button for this specific car */}
                  <button
                    onClick={() => handleOpenInspection(car)}
                    title="نموذج وفحص فني للسيارة"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>فحص فني</span>
                  </button>

                  <button
                    onClick={() => openEditModal(car)}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    {t.edit}
                  </button>

                  <button
                    onClick={() => onDeleteCar(car.id)}
                    className="px-2.5 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 transition"
                  >
                    {t.delete}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inspection Reports Archive Modal */}
      {isReportsArchiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  سجل تقارير الفحص الفني للسيارات ({inspectionReports.length})
                </h3>
              </div>
              <button
                onClick={() => setIsReportsArchiveOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Search Input in Archive */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute top-3 rtl:right-3 ltr:left-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="بحث برقم التقرير، اسم السيارة، اللوحة، أو الفاحص..."
                  value={reportsSearchTerm}
                  onChange={(e) => setReportsSearchTerm(e.target.value)}
                  className="w-full rtl:pr-9 ltr:pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Reports List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {filteredInspectionReports.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  لا توجد تقارير فحص تطابق البحث
                </div>
              ) : (
                filteredInspectionReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          {rep.reportNumber}
                        </span>
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm">
                          {rep.carModel} ({rep.year})
                        </h4>
                        <span className="font-mono font-extrabold text-xs text-slate-700 dark:text-slate-300">
                          [{rep.plateNumber}]
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        التاريخ: {rep.inspectionDate} | الفاحص: {rep.inspectorName} | العداد: {rep.mileage.toLocaleString()} كم
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        rep.recommendation === 'good_condition'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rep.recommendation === 'minor_repairs'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {rep.recommendation === 'good_condition'
                          ? 'بحالة جيدة'
                          : rep.recommendation === 'minor_repairs'
                          ? 'إصلاحات بسيطة'
                          : 'إصلاحات كبيرة'}
                      </span>

                      <button
                        onClick={() => {
                          setIsReportsArchiveOpen(false);
                          handleViewExistingReport(rep);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>عرض وطباعة</span>
                      </button>

                      {onDeleteInspectionReport && (
                        <button
                          onClick={() => onDeleteInspectionReport(rep.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="حذف التقرير"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Car Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
                {editingCar ? t.edit : t.addCar}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.brand} *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g., Toyota"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.model} *
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g., Camry SE"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.year}
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.plateNumber} *
                  </label>
                  <input
                    type="text"
                    required
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="رقم اللوحة"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>{t.color} *</span>
                    <span className="text-[10px] text-blue-600 font-semibold">{lang === 'ar' ? 'اختر أو اكتب' : 'Pick or type'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: أبيض لؤلؤي، أسود ملكي...' : 'e.g., Pearl White, Black...'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['أبيض لؤلؤي', 'أسود ملكي', 'فضي ميتالك', 'رمادي فاخر', 'كحلي', 'أحمر', 'ذهبي', 'بني', 'بيج'].map((clr) => (
                      <button
                        key={clr}
                        type="button"
                        onClick={() => setColor(clr)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                          color === clr
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {clr}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.chassisNumber}
                  </label>
                  <input
                    type="text"
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value)}
                    placeholder="رقم الشاسيه / الهيكل (VIN)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.motorNumber}
                  </label>
                  <input
                    type="text"
                    value={motorNumber}
                    onChange={(e) => setMotorNumber(e.target.value)}
                    placeholder="رقم المحرك / الموتور"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Owner Information Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {t.ownerInfo}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.ownerName}
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="اسم المالك أو الشركة"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.ownerPhone}
                    </label>
                    <input
                      type="text"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="+966 ..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t.ownerCivilId}
                    </label>
                    <input
                      type="text"
                      value={ownerCivilId}
                      onChange={(e) => setOwnerCivilId(e.target.value)}
                      placeholder="الهوية الوطنية / السجل"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.category}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CarCategory)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="economy">Economy (اقتصادي)</option>
                    <option value="sedan">Sedan (سيدان)</option>
                    <option value="suv">SUV (عائلية)</option>
                    <option value="luxury">Luxury (فاخرة)</option>
                    <option value="delivery_van">Delivery Van (فان شحن)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.status}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CarStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="available">{t.available}</option>
                    <option value="rented">{t.rented}</option>
                    <option value="maintenance">{t.maintenanceStatus}</option>
                    <option value="sold">{t.sold}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.dailyRate} ({currency})
                  </label>
                  <input
                    type="number"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.currentMileage} (KM)
                  </label>
                  <input
                    type="number"
                    value={currentMileage}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCurrentMileage(val);
                      if (nextServiceMileage <= val) {
                        setNextServiceMileage(val + maintenanceThreshold);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.maintenanceThreshold} (KM)
                  </label>
                  <input
                    type="number"
                    value={maintenanceThreshold}
                    onChange={(e) => {
                      const th = Number(e.target.value);
                      setMaintenanceThreshold(th);
                      setNextServiceMileage(lastServiceMileage + th);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.salePrice} ({currency})
                  </label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Maintenance cycle & early oil change helper in car modal */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'ar' ? 'عداد آخر صيانة زيت:' : 'Last Service Mileage:'}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {lastServiceMileage.toLocaleString()} كم
                    </span>
                    <span className="text-slate-400">➔</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {lang === 'ar' ? 'استحقاق الصيانة القادمة:' : 'Next Due Service:'}
                    </span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {nextServiceMileage.toLocaleString()} كم
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ar'
                      ? 'عند إجراء صيانة زيت مبكرة، اضغط على الزر المقابل لضبط الحساب فوراً من العداد الحالي وإلغاء أي تنبيه.'
                      : 'For early oil service, click below to recalculate next due odometer from current reading.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLastServiceMileage(currentMileage);
                    setNextServiceMileage(currentMileage + maintenanceThreshold);
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>{lang === 'ar' ? 'صيانة زيت مبكرة (ضبط من العداد الحالي)' : 'Early Oil Service (Reset From Current)'}</span>
                </button>
              </div>

              {/* Car Photo Upload from Computer & URL */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>{lang === 'ar' ? 'صورة السيارة (رفع من الكمبيوتر أو رابط)' : 'Car Photo (Upload or URL)'}</span>
                  </span>
                  {photoUrl && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      {lang === 'ar' ? 'تم اختيار صورة' : 'Photo Attached'}
                    </span>
                  )}
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {photoUrl ? (
                    <div className="relative w-28 h-20 rounded-xl overflow-hidden border-2 border-blue-500 shadow-sm shrink-0 bg-slate-950">
                      <img src={photoUrl} alt="Car Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition"
                        title={lang === 'ar' ? 'حذف الصورة' : 'Remove Photo'}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-900 shrink-0">
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                      <span className="text-[10px] mt-1 font-bold">{lang === 'ar' ? 'معاينة' : 'Preview'}</span>
                    </div>
                  )}

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? '📁 اختيار صورة من الكمبيوتر' : '📁 Browse Computer File'}</span>
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
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-700 dark:text-slate-300 hover:text-rose-600 rounded-xl text-xs font-bold transition"
                        >
                          {lang === 'ar' ? 'إزالة' : 'Clear'}
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={photoUrl.startsWith('data:') ? (lang === 'ar' ? '[صورة مرفوعة من الجهاز مباشرة]' : '[Local uploaded image]') : photoUrl}
                      onChange={(e) => {
                        if (!e.target.value.startsWith('[')) {
                          setPhotoUrl(e.target.value);
                        }
                      }}
                      placeholder={lang === 'ar' ? 'أو الصق رابط صورة خارجي (https://...)' : 'Or paste direct image URL (https://...)'}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Odometer Update Modal */}
      {odometerCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-xl">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                    {t.updateOdometer}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    {odometerCar.brand} {odometerCar.model} ({odometerCar.plateNumber})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOdometerCar(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current status stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block text-[10px]">{lang === 'ar' ? 'العداد السابق' : 'Previous Odometer'}</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono text-sm">
                  {odometerCar.currentMileage.toLocaleString()} كم
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block text-[10px]">{lang === 'ar' ? 'الصيانة الدورية المجدولة' : 'Scheduled Service'}</span>
                <span className="font-extrabold text-amber-700 dark:text-amber-400 font-mono text-sm">
                  {odometerCar.nextServiceMileage.toLocaleString()} كم
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'ar' ? 'القراءة الجديدة لعداد الكيلومترات (كم) *' : 'New Odometer Reading (KM) *'}
              </label>
              <input
                type="number"
                min="0"
                value={newMileage}
                onChange={(e) => setNewMileage(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-black text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Early oil maintenance toggle */}
            <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition ${
              isEarlyOilChangeOdometer
                ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}>
              <input
                type="checkbox"
                checked={isEarlyOilChangeOdometer}
                onChange={(e) => setIsEarlyOilChangeOdometer(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  {lang === 'ar' ? '🛢️ تم تغيير الزيت (صيانة زيت مبكرة أو دورية)' : '🛢️ Oil service performed (early or regular)'}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300 block leading-tight">
                  {lang === 'ar'
                    ? `إعادة حساب موعد الصيانة القادمة تلقائياً ليبدأ من القراءة الجديدة (${newMileage.toLocaleString()} كم) ويستحق عند (${(newMileage + (odometerCar.maintenanceThreshold || 10000)).toLocaleString()} كم)، وإزالة أي تنبيه صيانة مستحقة.`
                    : `Recalculate next service due starting from the new odometer (${newMileage.toLocaleString()} KM) due at (${(newMileage + (odometerCar.maintenanceThreshold || 10000)).toLocaleString()} KM), and clear any service alert.`}
                </span>
              </div>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOdometerCar(null)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleUpdateOdometer}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Inspection Report Modal */}
      {isInspectionModalOpen && (
        <VehicleInspectionModal
          isOpen={isInspectionModalOpen}
          onClose={() => {
            setIsInspectionModalOpen(false);
            setSelectedCarForInspection(null);
            setActiveInspectionReport(null);
          }}
          cars={cars}
          selectedCar={selectedCarForInspection}
          settings={settings}
          lang={lang}
          initialData={activeInspectionReport}
          onSaveReport={(report) => {
            if (onSaveInspectionReport) {
              onSaveInspectionReport(report);
            }
          }}
        />
      )}
    </div>
  );
};
