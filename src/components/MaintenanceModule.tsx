import React, { useState } from 'react';
import {
  Plus,
  Search,
  Wrench,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  FileText,
  Edit,
  Trash2,
  Check,
  Clock,
  Car as CarIcon,
  Building,
  CheckCircle,
  Sparkles,
  Gauge,
  RotateCcw,
  BellOff,
  ArrowRight,
  X,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { Car, MaintenanceRecord, ServiceType, Currency, Language, CarStatus } from '../types';
import { translations, formatCurrency } from '../translations/i18n';

interface StatusResetPromptData {
  car: Car;
  record?: MaintenanceRecord;
  initialOdometer: number;
  threshold: number;
}

interface MaintenanceModuleProps {
  records: MaintenanceRecord[];
  cars: Car[];
  onAddRecord: (record: MaintenanceRecord) => void;
  onUpdateRecord?: (record: MaintenanceRecord) => void;
  onDeleteRecord?: (id: string) => void;
  onUpdateCarStatus?: (carId: string, status: CarStatus) => void;
  onUpdateCar?: (car: Car) => void;
  currency: Currency;
  lang: Language;
}

export const MaintenanceModule: React.FC<MaintenanceModuleProps> = ({
  records,
  cars,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onUpdateCarStatus,
  onUpdateCar,
  currency,
  lang,
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'log' | 'calendar' | 'alerts'>('log');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'pending' | 'completed' | 'in_progress'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);

  // Form State
  const [selectedCarId, setSelectedCarId] = useState('');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [mileageAtService, setMileageAtService] = useState<number>(10000);
  const [nextDueMileage, setNextDueMileage] = useState<number>(20000);
  const [isEarlyOilChange, setIsEarlyOilChange] = useState<boolean>(false);
  const [serviceType, setServiceType] = useState<ServiceType>('oil_change');
  const [cost, setCost] = useState<number>(350);
  const [vendor, setVendor] = useState('مركز بترومين إكسبرس');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('completed');
  const [notes, setNotes] = useState('');

  // Status-Reset Trigger & Recalibration State
  const [statusResetPrompt, setStatusResetPrompt] = useState<StatusResetPromptData | null>(null);
  const [promptOdometer, setPromptOdometer] = useState<number>(0);
  const [promptThreshold, setPromptThreshold] = useState<number>(10000);
  const [promptNextDue, setPromptNextDue] = useState<number>(0);
  const [promptNotes, setPromptNotes] = useState<string>('');
  const [dismissedCarAlertIds, setDismissedCarAlertIds] = useState<string[]>([]);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const openStatusResetPrompt = (car: Car, record?: MaintenanceRecord) => {
    const baseOdo = Math.max(car.currentMileage, record?.mileageAtService || 0);
    const th = car.maintenanceThreshold || 10000;
    setStatusResetPrompt({
      car,
      record,
      initialOdometer: baseOdo,
      threshold: th,
    });
    setPromptOdometer(baseOdo);
    setPromptThreshold(th);
    setPromptNextDue(baseOdo + th);
    setPromptNotes(record?.notes || '');
  };

  const handlePromptOdometerChange = (newOdo: number) => {
    setPromptOdometer(newOdo);
    setPromptNextDue(newOdo + promptThreshold);
  };

  const handlePromptThresholdChange = (newTh: number) => {
    setPromptThreshold(newTh);
    setPromptNextDue(promptOdometer + newTh);
  };

  const handleConfirmStatusReset = () => {
    if (!statusResetPrompt) return;
    const { car, record } = statusResetPrompt;
    const today = new Date().toISOString().split('T')[0];
    const newOdo = Number(promptOdometer) || car.currentMileage;
    const th = Number(promptThreshold) || car.maintenanceThreshold || 10000;
    const newNextDue = Number(promptNextDue) || (newOdo + th);

    // 1. Mark target maintenance record as completed if it exists
    if (record) {
      const updatedRecord: MaintenanceRecord = {
        ...record,
        status: 'completed',
        completedDate: today,
        mileageAtService: newOdo,
        nextDueMileage: newNextDue,
        notes: promptNotes || record.notes,
      };
      if (onUpdateRecord) {
        onUpdateRecord(updatedRecord);
      }
    } else {
      // Create a completed record for this service
      const newRec: MaintenanceRecord = {
        id: `maint_${Date.now()}`,
        carId: car.id,
        carModel: `${car.brand} ${car.model} ${car.year}`,
        carPlate: car.plateNumber,
        serviceDate: today,
        mileageAtService: newOdo,
        serviceType: 'inspection',
        cost: 0,
        vendor: 'ورشة الصيانة المعتمدة',
        status: 'completed',
        completedDate: today,
        notes: promptNotes || (lang === 'ar' ? 'إتمام صيانة ومعايرة العداد' : 'Service completed & milestone recalibrated'),
        nextDueMileage: newNextDue,
      };
      onAddRecord(newRec);
    }

    // 2. Mark any other in_progress records for this car as completed
    records.forEach((r) => {
      if ((r.carId === car.id || r.carPlate === car.plateNumber) && r.status !== 'completed' && (!record || r.id !== record.id)) {
        if (onUpdateRecord) {
          onUpdateRecord({
            ...r,
            status: 'completed',
            completedDate: today,
            nextDueMileage: newNextDue,
          });
        }
      }
    });

    // 3. Status-reset trigger on car:
    // Reset status to 'available', update currentMileage to the new reading,
    // recalibrate nextServiceMileage milestone and lastServiceMileage
    const updatedCar: Car = {
      ...car,
      status: 'available',
      currentMileage: newOdo,
      lastServiceMileage: newOdo,
      nextServiceMileage: newNextDue,
      maintenanceThreshold: th,
    };

    if (onUpdateCar) {
      onUpdateCar(updatedCar);
    } else if (onUpdateCarStatus) {
      onUpdateCarStatus(car.id, 'available');
    }

    // 4. Automatically remove associated maintenance notification
    setDismissedCarAlertIds((prev) => Array.from(new Set([...prev, car.id])));

    // 5. Provide feedback
    setSuccessBanner(
      lang === 'ar'
        ? `✅ تم إتمام الصيانة للسيارة (${car.brand} ${car.model} - ${car.plateNumber}): تم ضبط العداد على (${newOdo.toLocaleString()} كم)، ومعايرة موعد الصيانة القادمة عند (${newNextDue.toLocaleString()} كم)، وإلغاء تنبيه الصيانة فوراً.`
        : `✅ Maintenance completed for (${car.brand} ${car.model} - ${car.plateNumber}): Odometer set to (${newOdo.toLocaleString()} KM), next milestone recalibrated to (${newNextDue.toLocaleString()} KM), and maintenance notifications removed.`
    );

    setStatusResetPrompt(null);
  };

  const openAddModal = (defaultCarId?: string) => {
    setEditingRecord(null);
    const targetCar = (defaultCarId ? cars.find((c) => c.id === defaultCarId) : null) || (cars.length > 0 ? cars[0] : null);
    if (targetCar) {
      setSelectedCarId(targetCar.id);
      setMileageAtService(targetCar.currentMileage);
      const th = targetCar.maintenanceThreshold || 10000;
      setNextDueMileage(targetCar.currentMileage + th);
    } else {
      setSelectedCarId('');
      setMileageAtService(10000);
      setNextDueMileage(20000);
    }
    setIsEarlyOilChange(false);
    setServiceDate(new Date().toISOString().split('T')[0]);
    setServiceType('oil_change');
    setCost(350);
    setVendor('مركز بترومين إكسبرس');
    setStatus('completed');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (rec: MaintenanceRecord) => {
    setEditingRecord(rec);
    setSelectedCarId(rec.carId);
    setServiceDate(rec.serviceDate);
    setMileageAtService(rec.mileageAtService);
    const car = cars.find((c) => c.id === rec.carId);
    const th = car?.maintenanceThreshold || 10000;
    const nDue = rec.nextDueMileage && rec.nextDueMileage > rec.mileageAtService
      ? rec.nextDueMileage
      : (rec.mileageAtService + th);
    setNextDueMileage(nDue);
    setServiceType(rec.serviceType);
    setCost(rec.cost);
    setVendor(rec.vendor);
    setStatus(rec.status === 'completed' ? 'completed' : 'in_progress');
    setNotes(rec.notes || '');
    setIsEarlyOilChange(car ? rec.mileageAtService < car.nextServiceMileage : false);
    setIsModalOpen(true);
  };

  const handleCarSelect = (carId: string) => {
    setSelectedCarId(carId);
    const car = cars.find((c) => c.id === carId);
    if (car) {
      setMileageAtService(car.currentMileage);
      const th = car.maintenanceThreshold || 10000;
      setNextDueMileage(car.currentMileage + th);
      setIsEarlyOilChange(false);
    }
  };

  const handleMileageChange = (newMileage: number) => {
    setMileageAtService(newMileage);
    const car = cars.find((c) => c.id === selectedCarId);
    const th = car?.maintenanceThreshold || 10000;
    // Dynamically recalculate next service due odometer from new reading
    const calculatedNextDue = newMileage + th;
    setNextDueMileage(calculatedNextDue);

    if (car && car.nextServiceMileage && newMileage < car.nextServiceMileage) {
      setIsEarlyOilChange(true);
    } else {
      setIsEarlyOilChange(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarId) return;

    const car = cars.find((c) => c.id === selectedCarId);
    if (!car) return;

    const th = car.maintenanceThreshold || 10000;
    const calculatedNextDue = nextDueMileage && nextDueMileage > mileageAtService
      ? nextDueMileage
      : (mileageAtService + th);

    if (editingRecord) {
      const updated: MaintenanceRecord = {
        ...editingRecord,
        carId: car.id,
        carModel: `${car.brand} ${car.model} ${car.year}`,
        carPlate: car.plateNumber,
        serviceDate,
        mileageAtService,
        serviceType,
        cost,
        vendor,
        status,
        completedDate: status === 'completed' ? (editingRecord.completedDate || new Date().toISOString().split('T')[0]) : undefined,
        notes,
        nextDueMileage: calculatedNextDue,
      };

      if (onUpdateRecord) onUpdateRecord(updated);

      // If marked as completed, release car to available and advance service odometer thresholds
      if (status === 'completed') {
        handleReleaseCarFromMaintenance(car, mileageAtService, calculatedNextDue);
      } else if (status === 'in_progress') {
        const updatedCar: Car = {
          ...car,
          status: 'maintenance',
          currentMileage: Math.max(car.currentMileage, mileageAtService),
        };
        if (onUpdateCar) {
          onUpdateCar(updatedCar);
        } else if (onUpdateCarStatus) {
          onUpdateCarStatus(car.id, 'maintenance');
        }
      }
    } else {
      const newRec: MaintenanceRecord = {
        id: `maint_${Date.now()}`,
        carId: car.id,
        carModel: `${car.brand} ${car.model} ${car.year}`,
        carPlate: car.plateNumber,
        serviceDate,
        mileageAtService,
        serviceType,
        cost,
        vendor,
        status,
        completedDate: status === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
        notes,
        nextDueMileage: calculatedNextDue,
      };

      onAddRecord(newRec);

      // If marked as completed, release car to available and advance service odometer thresholds
      if (status === 'completed') {
        handleReleaseCarFromMaintenance(car, mileageAtService, calculatedNextDue);
      } else if (status === 'in_progress') {
        const updatedCar: Car = {
          ...car,
          status: 'maintenance',
          currentMileage: Math.max(car.currentMileage, mileageAtService),
        };
        if (onUpdateCar) {
          onUpdateCar(updatedCar);
        } else if (onUpdateCarStatus) {
          onUpdateCarStatus(car.id, 'maintenance');
        }
      }
    }

    setIsModalOpen(false);
  };

  // Helper to complete maintenance, release car to available and clear overdue alerts
  const handleReleaseCarFromMaintenance = (targetCar: Car, serviceMileage?: number, nextDueMileage?: number) => {
    const sMileage = serviceMileage ?? targetCar.currentMileage;
    const th = targetCar.maintenanceThreshold || 10000;
    const nDue = nextDueMileage && nextDueMileage > sMileage
      ? nextDueMileage
      : (sMileage + th);
    const newCurrent = Math.max(targetCar.currentMileage, sMileage);

    const updatedCar: Car = {
      ...targetCar,
      status: 'available',
      lastServiceMileage: sMileage,
      nextServiceMileage: nDue,
      currentMileage: newCurrent,
    };

    if (onUpdateCar) {
      onUpdateCar(updatedCar);
    } else if (onUpdateCarStatus) {
      onUpdateCarStatus(targetCar.id, 'available');
    }

    // Also automatically mark any in_progress maintenance records for this car as completed
    const today = new Date().toISOString().split('T')[0];
    records.forEach((r) => {
      if ((r.carId === targetCar.id || r.carPlate === targetCar.plateNumber) && r.status !== 'completed') {
        if (onUpdateRecord) {
          onUpdateRecord({
            ...r,
            status: 'completed',
            completedDate: today,
            nextDueMileage: r.nextDueMileage || nDue,
          });
        }
      }
    });
    // Also automatically remove any associated notification
    setDismissedCarAlertIds((prev) => Array.from(new Set([...prev, targetCar.id])));
    setSuccessBanner(
      lang === 'ar'
        ? `✅ تم إتمام الصيانة وخروج السيارة (${targetCar.brand} ${targetCar.model} - ${targetCar.plateNumber}) وإعادتها إلى (متاحة)، ومعايرة موعد الصيانة القادمة عند (${nDue.toLocaleString()} كم)، وإلغاء أي تنبيه صيانة مستحق.`
        : `✅ Vehicle (${targetCar.brand} ${targetCar.model} - ${targetCar.plateNumber}) released as available, next service set to (${nDue.toLocaleString()} KM), and maintenance alerts cleared.`
    );
  };

  // Status-reset trigger when marking a record as completed
  const handleMarkAsCompleted = (record: MaintenanceRecord) => {
    const targetCar = cars.find((c) => c.id === record.carId || c.plateNumber === record.carPlate);
    if (targetCar) {
      // Trigger status-reset prompt to calibrate new odometer and recalibrate next service milestone
      openStatusResetPrompt(targetCar, record);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const th = 10000;
      const sMileage = record.mileageAtService;
      const nDue = record.nextDueMileage && record.nextDueMileage > sMileage
        ? record.nextDueMileage
        : (sMileage + th);

      const updated: MaintenanceRecord = {
        ...record,
        status: 'completed',
        completedDate: today,
        nextDueMileage: nDue,
      };

      if (onUpdateRecord) {
        onUpdateRecord(updated);
      }
    }
  };

  const handleDelete = (id: string, carPlate: string) => {
    const confirmText =
      lang === 'ar'
        ? `هل أنت متأكد من مسح سجل الصيانة للسيارة (${carPlate})؟`
        : `Are you sure you want to delete this maintenance record for car (${carPlate})?`;

    if (window.confirm(confirmText)) {
      if (onDeleteRecord) {
        onDeleteRecord(id);
      }
    }
  };

  // Predictive Alerts List (excludes cars already in maintenance, sold, or whose alert was reset)
  const predictiveCars = cars.filter(
    (c) =>
      c.status !== 'maintenance' &&
      c.status !== 'sold' &&
      !dismissedCarAlertIds.includes(c.id) &&
      c.currentMileage >= c.nextServiceMileage
  );

  // Helper to accurately classify each maintenance record status: 'overdue' | 'pending' | 'completed'
  const getRecordStatus = (r: MaintenanceRecord): 'overdue' | 'pending' | 'completed' => {
    if (r.status === 'completed') {
      return 'completed';
    }
    const targetCar = cars.find((c) => c.id === r.carId || c.plateNumber === r.carPlate);
    const today = new Date().toISOString().split('T')[0];
    const isPastDate = r.serviceDate < today;
    const isMileageExceeded = targetCar
      ? (r.nextDueMileage > 0 && targetCar.currentMileage >= r.nextDueMileage) ||
        (targetCar.nextServiceMileage > 0 && targetCar.currentMileage >= targetCar.nextServiceMileage)
      : false;

    if (isMileageExceeded || isPastDate || (r.status as string) === 'overdue') {
      return 'overdue';
    }
    return 'pending';
  };

  const overdueCount = records.filter((r) => getRecordStatus(r) === 'overdue').length;
  const pendingCount = records.filter((r) => getRecordStatus(r) === 'pending').length;
  const completedCount = records.filter((r) => r.status === 'completed').length;
  const inProgressCount = records.filter((r) => r.status !== 'completed').length;
  const totalMaintenanceCost = records.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
  const carsInMaintenance = cars.filter((c) => c.status === 'maintenance');

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.carPlate.includes(searchTerm) ||
      r.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const statusKind = getRecordStatus(r);
    const matchesStatus =
      statusFilter === 'all' ||
      statusFilter === statusKind ||
      (statusFilter === 'in_progress' && statusKind !== 'completed');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Status-Reset Success Feedback Banner */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-400 dark:border-emerald-700 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Quick KPI Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            <span>{t.maintenance}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar'
              ? 'إدارة أوامر الشغل، سجلات الصيانة، انتهاء الصيانة، والتنبيهات التنبؤية للأسطول'
              : 'Log service records, manage job completion, predictive odometer alerts & maintenance calendar'}
          </p>
        </div>

        <button
          onClick={() => openAddModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addRecord}</span>
        </button>
      </div>

      {/* KPI Stats Ribbon with Quick Interactive Filter Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Overdue Urgent Card */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
          className={`p-4 rounded-2xl border-2 transition text-start flex items-center justify-between cursor-pointer ${
            statusFilter === 'overdue'
              ? 'bg-rose-100/90 dark:bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/30 shadow-md'
              : 'bg-white dark:bg-slate-900 border-rose-300/80 dark:border-rose-900/60 hover:border-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/20'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              <span className="text-[11px] font-black text-rose-700 dark:text-rose-400">
                {lang === 'ar' ? '🚨 متأخرة - عاجلة (Overdue)' : '🚨 Overdue (Urgent)'}
              </span>
            </div>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {overdueCount}
            </span>
            <span className="block text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5 font-bold">
              {lang === 'ar' ? 'تجاوزت العداد أو الموعد' : 'Exceeded mileage or date'}
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
        </button>

        {/* 2. Pending Card */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          className={`p-4 rounded-2xl border-2 transition text-start flex items-center justify-between cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-100/90 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
              : 'bg-white dark:bg-slate-900 border-amber-300/80 dark:border-amber-900/60 hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[11px] font-black text-amber-700 dark:text-amber-400">
                {lang === 'ar' ? '⏳ قيد الانتظار (Pending)' : '⏳ Pending'}
              </span>
            </div>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {pendingCount}
            </span>
            <span className="block text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 font-bold">
              {lang === 'ar' ? 'مجدولة أو قيد الصيانة' : 'Queued or in maintenance'}
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </button>

        {/* 3. Completed Card */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          className={`p-4 rounded-2xl border-2 transition text-start flex items-center justify-between cursor-pointer ${
            statusFilter === 'completed'
              ? 'bg-emerald-100/90 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
              : 'bg-white dark:bg-slate-900 border-emerald-300/80 dark:border-emerald-900/60 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                {lang === 'ar' ? '✅ مكتملة (Completed)' : '✅ Completed'}
              </span>
            </div>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {completedCount}
            </span>
            <span className="block text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 font-bold">
              {lang === 'ar' ? 'تمت الصيانة ومعايرة العداد' : 'Serviced & recalibrated'}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </button>

        {/* 4. Total Cost Card */}
        <div className="p-4 rounded-2xl border-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {lang === 'ar' ? '💰 إجمالي تكلفة الصيانة' : 'Total Service Costs'}
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {formatCurrency(totalMaintenanceCost, currency, lang)}
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-bold">
              {records.length} {lang === 'ar' ? 'سجل صيانة مسجل' : 'records logged'}
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Active Cars In Maintenance Notice & Release Action */}
      {carsInMaintenance.length > 0 && (
        <div className="bg-amber-50/80 dark:bg-amber-950/25 border-2 border-amber-300/80 dark:border-amber-800/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-900/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  {lang === 'ar' ? `السيارات الموجودة حالياً في الصيانة (${carsInMaintenance.length})` : `Vehicles Currently In Maintenance (${carsInMaintenance.length})`}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {lang === 'ar'
                    ? 'السيارات التي تم إرسالها للصيانة. بمجرد انتهاء الفحص أو الإصلاح، اضغط على "إتمام الصيانة وخروج السيارة" لإرجاعها فوراً إلى حالة (متاحة)'
                    : 'Click "Complete Service & Release" to return vehicle status to available immediately.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {carsInMaintenance.map((car) => {
              const activeRecord = records.find(
                (r) => (r.carId === car.id || r.carPlate === car.plateNumber) && r.status !== 'completed'
              );
              return (
                <div
                  key={car.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/50 flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                        {car.brand} {car.model} {car.year}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-md font-bold text-[10px] whitespace-nowrap">
                        {lang === 'ar' ? 'في الصيانة' : 'In Service'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-1">
                      {car.plateNumber} • {car.currentMileage.toLocaleString()} KM
                    </div>
                    {activeRecord && (
                      <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-amber-700 dark:text-amber-400">
                          {activeRecord.serviceType}:{' '}
                        </span>
                        <span>
                          {activeRecord.vendor} ({formatCurrency(Number(activeRecord.cost) || 0, currency, lang)})
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openStatusResetPrompt(car, activeRecord)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'إتمام الصيانة ومعايرة العداد (متاحة)' : 'Complete Service & Recalibrate'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('log')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'log'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>{t.maintenanceHistory}</span>
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-mono">
            {records.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'calendar'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>{t.maintenanceCalendar}</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 relative cursor-pointer ${
            activeTab === 'alerts'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{t.predictiveAlerts}</span>
          {predictiveCars.length > 0 && (
            <span className="w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
              {predictiveCars.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: LOG HISTORY */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          {/* Search, Filter Controls & Quick Status Pills */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute top-3.5 rtl:right-3.5 ltr:left-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rtl:pr-10 ltr:pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">{lang === 'ar' ? 'جميع الحالات (All)' : 'All Statuses'}</option>
                  <option value="overdue">{lang === 'ar' ? '🚨 متأخرة - عاجلة (Overdue)' : '🚨 Overdue (Urgent)'}</option>
                  <option value="pending">{lang === 'ar' ? '⏳ قيد الانتظار (Pending)' : '⏳ Pending'}</option>
                  <option value="completed">{lang === 'ar' ? '✅ تمت الصيانة (Completed)' : '✅ Completed'}</option>
                </select>
              </div>
            </div>

            {/* Quick Segmented Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <span>{lang === 'ar' ? 'الكل' : 'All'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10 dark:bg-white/10">
                  {records.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('overdue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer border ${
                  statusFilter === 'overdue'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300" />
                <span>{lang === 'ar' ? 'متأخرة وعاجلة (Overdue)' : 'Overdue (Urgent)'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-200 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100">
                  {overdueCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60 hover:border-amber-400'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
                <span>{lang === 'ar' ? 'قيد الانتظار (Pending)' : 'Pending'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100">
                  {pendingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                <span>{lang === 'ar' ? 'مكتملة (Completed)' : 'Completed'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-100">
                  {completedCount}
                </span>
              </button>
            </div>

            {/* Visual Color-Coded Status Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-extrabold text-slate-500 dark:text-slate-400">
                  {lang === 'ar' ? 'دليل تمييز الحالات:' : 'Status Legend:'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping"></span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400">
                    {lang === 'ar' ? '🔴 متأخرة (Overdue): تجاوزت عداد الصيانة أو التاريخ (تدخل فوري)' : '🔴 Overdue: Exceeded mileage or date (Immediate action)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {lang === 'ar' ? '🟡 قيد الانتظار (Pending): قيد الفحص بالورشة أو مجدولة' : '🟡 Pending: In workshop or scheduled'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {lang === 'ar' ? '🟢 مكتملة (Completed): تمت صيانتها ومعايرة العداد وجاهزة' : '🟢 Completed: Serviced, milestone recalibrated & ready'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-extrabold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">{t.selectCar}</th>
                    <th className="py-3.5 px-4">{t.serviceDate}</th>
                    <th className="py-3.5 px-4">{t.serviceType}</th>
                    <th className="py-3.5 px-4">{t.currentMileage}</th>
                    <th className="py-3.5 px-4">{t.vendor}</th>
                    <th className="py-3.5 px-4">{t.cost}</th>
                    <th className="py-3.5 px-4">{lang === 'ar' ? 'حالة الصيانة ومؤشر الإلحاح' : 'Status & Urgency'}</th>
                    <th className="py-3.5 px-4">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                    <th className="py-3.5 px-4 text-center">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-800 dark:text-slate-200">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                        {lang === 'ar' ? 'لا توجد سجلات صيانة مطابقة' : 'No maintenance records found'}
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => {
                      const statusKind = getRecordStatus(r);
                      const isCompleted = statusKind === 'completed';
                      const isOverdue = statusKind === 'overdue';
                      const isPending = statusKind === 'pending';

                      const targetCar = cars.find((c) => c.id === r.carId || c.plateNumber === r.carPlate);
                      const currentCarMileage = targetCar ? targetCar.currentMileage : r.mileageAtService;
                      const nextDue = r.nextDueMileage || (targetCar?.nextServiceMileage ?? 0);
                      const overdueKm = (currentCarMileage > nextDue && nextDue > 0) ? (currentCarMileage - nextDue) : 0;
                      const today = new Date().toISOString().split('T')[0];
                      const isPastDate = r.serviceDate < today && !isCompleted;

                      return (
                        <tr
                          key={r.id}
                          className={`transition border-b border-slate-100 dark:border-slate-800/80 ${
                            isOverdue
                              ? 'bg-rose-50/50 hover:bg-rose-100/60 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rtl:border-r-4 ltr:border-l-4 border-r-rose-500 ltr:border-l-rose-500 shadow-xs'
                              : isPending
                              ? 'bg-amber-50/30 hover:bg-amber-100/40 dark:bg-amber-950/15 dark:hover:bg-amber-950/30 rtl:border-r-4 ltr:border-l-4 border-r-amber-400 ltr:border-l-amber-400'
                              : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rtl:border-r-4 ltr:border-l-4 border-r-emerald-500/40 ltr:border-l-emerald-500/40'
                          }`}
                        >
                          {/* Car Identity with Overdue Visual Dot */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              {isOverdue && (
                                <span className="relative flex h-2.5 w-2.5 shrink-0" title={lang === 'ar' ? 'صيانة متأخرة عاجلة!' : 'Urgent Overdue Service!'}>
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                                </span>
                              )}
                              <div>
                                <span className="font-bold block text-slate-900 dark:text-slate-100">{r.carModel}</span>
                                <span className="text-[10px] font-mono text-slate-500">{r.carPlate}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span>{r.serviceDate}</span>
                              {isPastDate && (
                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                  {lang === 'ar' ? '⚠️ فات الموعد' : '⚠️ Past Date'}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded font-bold text-[10px]">
                              {r.serviceType.toUpperCase()}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold font-mono">
                            {r.mileageAtService.toLocaleString()} KM
                          </td>

                          <td className="py-3.5 px-4">{r.vendor}</td>

                          <td className="py-3.5 px-4 font-black text-rose-600 dark:text-rose-400 whitespace-nowrap font-mono">
                            {formatCurrency(r.cost, currency, lang)}
                          </td>

                          {/* Distinct Visual Badges & Color-Coded Indicators */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isOverdue ? (
                              <div className="flex flex-col gap-1 items-start">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 rounded-full text-[11px] font-black border-2 border-rose-400 dark:border-rose-700 shadow-xs shadow-rose-500/20">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                                  </span>
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-300 shrink-0" />
                                  <span>{lang === 'ar' ? 'متأخرة - عاجلة' : 'Overdue (Urgent)'}</span>
                                </span>
                                {overdueKm > 0 ? (
                                  <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 font-mono flex items-center gap-0.5">
                                    <span>+{overdueKm.toLocaleString()} {lang === 'ar' ? 'كم تجاوز' : 'KM over'}</span>
                                  </span>
                                ) : isPastDate ? (
                                  <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                                    {lang === 'ar' ? 'تجاوزت التاريخ المحدد' : 'Past scheduled date'}
                                  </span>
                                ) : null}
                              </div>
                            ) : isPending ? (
                              <div className="flex flex-col gap-1 items-start">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 rounded-full text-[11px] font-extrabold border-2 border-amber-300 dark:border-amber-700 shadow-xs">
                                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span>{lang === 'ar' ? 'قيد الانتظار' : 'Pending'}</span>
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                  {lang === 'ar' ? 'قيد الفحص / بالورشة' : 'In workshop / queue'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1 items-start">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 rounded-full text-[11px] font-extrabold border-2 border-emerald-400/80 dark:border-emerald-700 shadow-xs">
                                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>{lang === 'ar' ? 'تمت الصيانة' : 'Completed'}</span>
                                </span>
                                {r.completedDate ? (
                                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                    {r.completedDate}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    {lang === 'ar' ? 'جاهزة ومتاحة ✅' : 'Available & Ready ✅'}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            {r.notes ? (
                              <div className="p-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] flex items-start gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{r.notes}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">{lang === 'ar' ? '-' : '-'}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Urgent Overdue Fix button vs Standard Complete Service button */}
                              {isOverdue && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkAsCompleted(r)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black transition shadow-xs shadow-rose-500/30 cursor-pointer animate-pulse"
                                  title={lang === 'ar' ? 'إجراء عاجل: إتمام الصيانة ومعايرة العداد وإزالة التنبيه' : 'Urgent: Complete & Recalibrate Milestone'}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>{lang === 'ar' ? 'معالجة عاجلة' : 'Fix Urgent'}</span>
                                </button>
                              )}

                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkAsCompleted(r)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                                  title={lang === 'ar' ? 'انتهاء الصيانة - تم الصيانة وإتاحة السيارة' : 'Complete Service & Make Available'}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{lang === 'ar' ? 'تم الصيانة' : 'Complete'}</span>
                                </button>
                              )}

                              {/* Edit Record Button */}
                              <button
                                type="button"
                                onClick={() => openEditModal(r)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition cursor-pointer"
                                title={lang === 'ar' ? 'تعديل سجل الصيانة' : 'Edit Maintenance Record'}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Record Button */}
                              {onDeleteRecord && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(r.id, r.carPlate)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold transition cursor-pointer"
                                  title={lang === 'ar' ? 'مسح سجل الصيانة' : 'Delete Record'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="font-black text-slate-900 dark:text-slate-100 text-base mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <span>{t.maintenanceCalendar} - أغسطس 2026</span>
          </h3>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">
            <div>الأحد</div>
            <div>الإثنين</div>
            <div>الثلاثاء</div>
            <div>الأربعاء</div>
            <div>الخميس</div>
            <div>الجمعة</div>
            <div>السبت</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `2026-08-${dayNum < 10 ? '0' + dayNum : dayNum}`;
              const dayRecords = records.filter((r) => r.serviceDate === dateStr);

              return (
                <div
                  key={dayNum}
                  className={`min-h-[80px] p-2 rounded-xl border text-xs flex flex-col justify-between ${
                    dayRecords.length > 0
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800'
                      : 'bg-slate-50/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="font-black text-slate-700 dark:text-slate-300">{dayNum}</span>

                  {dayRecords.map((dr) => (
                    <div
                      key={dr.id}
                      onClick={() => openEditModal(dr)}
                      className={`p-1 font-bold text-[9px] rounded truncate shadow-xs mt-1 cursor-pointer transition ${
                        dr.status === 'completed'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-amber-600 hover:bg-amber-500 text-white'
                      }`}
                      title={`${dr.carPlate}: ${dr.serviceType} (${dr.status === 'completed' ? 'تمت الصيانة' : 'قيد الصيانة'})`}
                    >
                      {dr.carPlate}: {dr.serviceType}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PREDICTIVE ALERTS */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {predictiveCars.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-emerald-600">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
              <p className="font-extrabold text-base">
                {lang === 'ar' ? 'جميع السيارات بحالة جيدة ولا توجد صيانة مستحقة متأخرة' : 'All vehicles are in good standing! No overdue maintenance.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictiveCars.map((car) => (
                <div
                  key={car.id}
                  className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 rounded-2xl p-5 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <h4 className="font-black text-amber-900 dark:text-amber-200 text-base">
                        {car.brand} {car.model} ({car.plateNumber})
                      </h4>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      العداد الحالي: <strong className="font-extrabold">{car.currentMileage.toLocaleString()} KM</strong> | الصيانة المستحقة عند: <strong className="font-extrabold">{car.nextServiceMileage.toLocaleString()} KM</strong>
                    </p>
                    <p className="text-[11px] text-rose-600 font-bold mt-1">
                      ⚠️ تجاوزت الصيانة بمقدار {(car.currentMileage - car.nextServiceMileage).toLocaleString()} كم!
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openStatusResetPrompt(car)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition"
                      title={lang === 'ar' ? 'إتمام الصيانة ومعايرة العداد وإزالة التنبيه' : 'Complete Service & Recalibrate Milestone'}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'إتمام ومعايرة' : 'Recalibrate'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openAddModal(car.id)}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shrink-0 cursor-pointer transition"
                    >
                      {t.addRecord}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Maintenance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                <span>
                  {editingRecord
                    ? (lang === 'ar' ? 'تعديل سجل الصيانة والخدمة' : 'Edit Maintenance Record')
                    : t.addRecord}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.selectCar} *
                </label>
                <select
                  value={selectedCarId}
                  onChange={(e) => handleCarSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {c.model} ({c.plateNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.serviceDate} *
                  </label>
                  <input
                    type="date"
                    required
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.serviceType}
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="oil_change">{t.oilChange}</option>
                    <option value="tires">{t.tires}</option>
                    <option value="brakes">{t.brakes}</option>
                    <option value="engine">{t.engine}</option>
                    <option value="inspection">{t.inspection}</option>
                    <option value="bodywork">{t.bodywork}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'قراءة العداد عند الصيانة (كم) *' : 'Odometer at Service (KM) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={mileageAtService}
                    onChange={(e) => handleMileageChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'عداد الصيانة القادمة المستحق (كم) *' : 'Next Due Service Odometer (KM) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={nextDueMileage}
                    onChange={(e) => setNextDueMileage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-amber-700 dark:text-amber-400"
                  />
                </div>
              </div>

              {/* Early oil change notice if triggered */}
              {isEarlyOilChange && (
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {lang === 'ar'
                      ? `تم اكتشاف صيانة زيت مبكرة: تم تعديل دورة الكيلومترات القادمة تلقائياً لتبدأ من القراءة الجديدة (${mileageAtService.toLocaleString()} كم) وتستحق عند (${nextDueMileage.toLocaleString()} كم).`
                      : `Early oil service detected: next service odometer recalculated starting from ${mileageAtService.toLocaleString()} KM due at ${nextDueMileage.toLocaleString()} KM.`}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.cost} ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.vendor}
                  </label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'حالة الصيانة والإنجاز' : 'Job Status'}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-bold ${
                      status === 'completed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                        : status === 'pending'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                        : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    <option value="completed">{lang === 'ar' ? '✅ تم الصيانة ومكتملة (خروج السيارة ومتاحة)' : 'Completed (Ready & Available)'}</option>
                    <option value="pending">{lang === 'ar' ? '⏳ قيد الانتظار والجدولة (Pending)' : 'Pending (Queued)'}</option>
                    <option value="in_progress">{lang === 'ar' ? '🔧 قيد الصيانة والإصلاح (In Progress)' : 'In Progress (In Workshop)'}</option>
                  </select>
                </div>
              </div>

              {status === 'completed' && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {lang === 'ar'
                      ? `إتمام الصيانة: سيتم إتاحة السيارة فوراً، وتحديث عداد الصيانة القادمة إلى (${nextDueMileage.toLocaleString()} كم)، وإزالة أي تنبيه صيانة مستحقة فور الحفظ.`
                      : `Completed service: vehicle will be marked available, next service set to ${nextDueMileage.toLocaleString()} KM, and service alerts cleared immediately.`}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'ملاحظات الصيانة والتقرير الفني' : 'Service Notes & Technical Report'}
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب ملاحظات الفحص أو القطع التي تم استبدالها...' : 'Enter inspection details, parts replaced, or technician remarks...'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Status-Reset Trigger & Recalibration Prompt Modal */}
      {statusResetPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden space-y-0">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                    {lang === 'ar' ? 'إتمام الصيانة ومعايرة عداد الاستحقاق القادم' : 'Complete Service & Recalibrate Milestone'}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    {statusResetPrompt.car.brand} {statusResetPrompt.car.model} {statusResetPrompt.car.year} ({statusResetPrompt.car.plateNumber})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusResetPrompt(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Status transition indicator */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  {lang === 'ar' ? 'إعادة ضبط حالة السيارة:' : 'Vehicle Status Reset:'}
                </span>
                <div className="flex items-center gap-2 font-bold">
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded text-[11px]">
                    {lang === 'ar' ? 'قيد الصيانة ⏳' : 'In Maintenance'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded text-[11px] font-extrabold">
                    {lang === 'ar' ? 'متاحة وجاهزة للعمل ✅' : 'Available ✅'}
                  </span>
                </div>
              </div>

              {/* Input for new car odometer reading */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-blue-600" />
                    <span>{lang === 'ar' ? 'قراءة عداد الكيلومترات الجديدة للسيارة (كم) *' : 'New Car Odometer Reading (KM) *'}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {lang === 'ar' ? 'العداد السابق:' : 'Previous:'} {statusResetPrompt.car.currentMileage.toLocaleString()} كم
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={promptOdometer}
                  onChange={(e) => handlePromptOdometerChange(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-blue-500/70 dark:border-blue-600 rounded-xl text-lg font-black text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Quick adjustments */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
                  <span className="text-slate-400">{lang === 'ar' ? 'تعديل سريع:' : 'Quick set:'}</span>
                  <button
                    type="button"
                    onClick={() => handlePromptOdometerChange(statusResetPrompt.car.currentMileage)}
                    className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    {lang === 'ar' ? 'العداد الحالي' : 'Current'} ({statusResetPrompt.car.currentMileage.toLocaleString()})
                  </button>
                  {statusResetPrompt.record && statusResetPrompt.record.mileageAtService > 0 && (
                    <button
                      type="button"
                      onClick={() => handlePromptOdometerChange(statusResetPrompt.record!.mileageAtService)}
                      className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      {lang === 'ar' ? 'قراءة الفاتورة' : 'Invoice'} ({statusResetPrompt.record.mileageAtService.toLocaleString()})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handlePromptOdometerChange(promptOdometer + 1000)}
                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-semibold cursor-pointer"
                  >
                    +1,000 كم
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePromptOdometerChange(promptOdometer + 5000)}
                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-semibold cursor-pointer"
                  >
                    +5,000 كم
                  </button>
                </div>
              </div>

              {/* Maintenance Cycle Threshold */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {lang === 'ar' ? 'مسافة دورة الصيانة (كم لكل صيانة)' : 'Maintenance Cycle Interval (KM)'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5000, 10000, 15000, 20000].map((th) => (
                    <button
                      key={th}
                      type="button"
                      onClick={() => handlePromptThresholdChange(th)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        promptThreshold === th
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {th.toLocaleString()} كم
                    </button>
                  ))}
                </div>
              </div>

              {/* Milestone Recalibration Calculation Result */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/80 rounded-2xl border-2 border-amber-300 dark:border-amber-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'ar' ? 'معادلة معايرة محطة الصيانة القادمة (Next Service):' : 'Recalibrated Next Service Milestone:'}</span>
                  </span>
                  <span className="font-mono font-black text-amber-800 dark:text-amber-300 text-sm">
                    {promptNextDue.toLocaleString()} كم
                  </span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 p-2 bg-white/80 dark:bg-slate-900/70 rounded-xl border border-amber-200 dark:border-slate-700 font-mono font-bold">
                  <span>{promptOdometer.toLocaleString()} كم</span>
                  <span className="font-sans text-slate-400">+</span>
                  <span>{promptThreshold.toLocaleString()} كم</span>
                  <span className="font-sans text-slate-400">=</span>
                  <span className="text-amber-600 dark:text-amber-400">{promptNextDue.toLocaleString()} كم</span>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-400">
                  {lang === 'ar'
                    ? `ستعتبر الصيانة القادمة مستحقة فور وصول العداد إلى (${promptNextDue.toLocaleString()} كم)، ولن يظهر أي تنبيه قبل هذا العداد.`
                    : `Next service due alert will only trigger once the vehicle odometer reaches (${promptNextDue.toLocaleString()} KM).`}
                </p>
              </div>

              {/* Automatic Notification Removal Notice */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <BellOff className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">
                    {lang === 'ar' ? 'إزالة تنبيه الصيانة تلقائياً فور التأكيد:' : 'Automatic Notification Removal:'}
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    {lang === 'ar'
                      ? 'سيتم حذف جميع إشعارات وتنبيهات الصيانة المستحقة المرتبطة بهذه السيارة من الرادار واللوحة الرئيسية وقائمة التنبيهات فوراً.'
                      : 'All overdue maintenance warnings and predictive notifications for this vehicle will be removed immediately.'}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'ملاحظة إتمام الصيانة (اختياري)' : 'Completion Remark (Optional)'}
                </label>
                <input
                  type="text"
                  value={promptNotes}
                  onChange={(e) => setPromptNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: تم تغيير الزيت والفلتر وفحص الإطارات بنجاح' : 'e.g., Oil and filter replaced, vehicle inspected'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusResetPrompt(null)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusReset}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تأكيد إتمام الصيانة ومعايرة العداد' : 'Confirm & Recalibrate Milestone'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
