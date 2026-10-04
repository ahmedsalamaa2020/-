import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Ban,
  Car,
  User,
  Calendar,
  MapPin,
  FileText,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Receipt,
  Download,
  Trash2,
  Edit2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  TrafficFine,
  FineStatus,
  FineType,
  Car as CarType,
  Customer,
  RentalContract,
  Currency,
  Language,
  AppSettings,
  SystemUser,
} from '../types';
import { translations, formatCurrency } from '../translations/i18n';

interface TrafficFinesModuleProps {
  fines: TrafficFine[];
  onAddFine: (fine: Omit<TrafficFine, 'id' | 'createdAt'>) => void;
  onUpdateFine: (id: string, updates: Partial<TrafficFine>) => void;
  onDeleteFine: (id: string) => void;
  cars: CarType[];
  customers: Customer[];
  contracts: RentalContract[];
  currency: Currency;
  lang: Language;
  settings: AppSettings;
  currentUser: SystemUser | null;
}

export const TrafficFinesModule: React.FC<TrafficFinesModuleProps> = ({
  fines,
  onAddFine,
  onUpdateFine,
  onDeleteFine,
  cars,
  customers,
  contracts,
  currency,
  lang,
  settings,
  currentUser,
}) => {
  const t = translations[lang];

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FineStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | FineType>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFine, setEditingFine] = useState<TrafficFine | null>(null);

  // Form State
  const [fineNumber, setFineNumber] = useState('');
  const [selectedCarId, setSelectedCarId] = useState(cars[0]?.id || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedContractId, setSelectedContractId] = useState('');
  const [violationDate, setViolationDate] = useState(new Date().toISOString().split('T')[0]);
  const [violationTime, setViolationTime] = useState('12:00');
  const [violationLocation, setViolationLocation] = useState('');
  const [fineType, setFineType] = useState<FineType>('speeding');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(300);
  const [serviceFee, setServiceFee] = useState<number>(50);
  const [status, setStatus] = useState<FineStatus>('pending');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Auto match driver/customer when car and violation date are chosen
  const handleCarOrDateChange = (carId: string, date: string) => {
    setSelectedCarId(carId);
    if (!carId || !date) return;

    // Find if car had an active rental contract on this violation date
    const matchedContract = contracts.find((c) => {
      if (c.carId !== carId) return false;
      return date >= c.startDate && date <= c.endDate;
    });

    if (matchedContract) {
      setSelectedContractId(matchedContract.id);
      setSelectedCustomerId(matchedContract.customerId);
    }
  };

  const openCreateModal = () => {
    setEditingFine(null);
    setFineNumber(`FINE-${Date.now().toString().slice(-6)}`);
    const initialCar = cars[0]?.id || '';
    const today = new Date().toISOString().split('T')[0];
    setSelectedCarId(initialCar);
    setViolationDate(today);
    setViolationTime('12:00');
    setViolationLocation(lang === 'ar' ? 'الرياض - طريق الملك فهد' : 'King Fahd Road');
    setFineType('speeding');
    setDescription(lang === 'ar' ? 'رصد آلي: تجاوز السرعة المقررة' : 'Automated radar speeding violation');
    setAmount(300);
    setServiceFee(50);
    setStatus('pending');
    setEvidenceUrl('');
    setNotes('');

    // Try auto matching contract
    handleCarOrDateChange(initialCar, today);
    setIsModalOpen(true);
  };

  const openEditModal = (fine: TrafficFine) => {
    setEditingFine(fine);
    setFineNumber(fine.fineNumber);
    setSelectedCarId(fine.carId);
    setSelectedCustomerId(fine.customerId || '');
    setSelectedContractId(fine.contractId || '');
    setViolationDate(fine.violationDate);
    setViolationTime(fine.violationTime || '12:00');
    setViolationLocation(fine.violationLocation);
    setFineType(fine.type);
    setDescription(fine.description);
    setAmount(fine.amount);
    setServiceFee(fine.serviceFee || 0);
    setStatus(fine.status);
    setEvidenceUrl(fine.evidenceUrl || '');
    setNotes(fine.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selCar = cars.find((c) => c.id === selectedCarId);
    const selCust = customers.find((c) => c.id === selectedCustomerId);
    const selContract = contracts.find((c) => c.id === selectedContractId);

    const totalAmount = Number(amount) + Number(serviceFee || 0);

    const payload = {
      fineNumber,
      carId: selectedCarId,
      carPlateNumber: selCar?.plateNumber || '',
      carBrandModel: selCar ? `${selCar.brand} ${selCar.model}` : '',
      customerId: selCust?.id,
      customerName: selCust?.name,
      customerPhone: selCust?.phone,
      contractId: selContract?.id,
      contractNumber: selContract?.contractNumber,
      violationDate,
      violationTime,
      violationLocation,
      type: fineType,
      description,
      amount: Number(amount),
      serviceFee: Number(serviceFee),
      totalAmount,
      status,
      evidenceUrl,
      notes,
      registeredBy: currentUser?.username || 'admin',
    };

    if (editingFine) {
      onUpdateFine(editingFine.id, payload);
    } else {
      onAddFine(payload);
    }
    setIsModalOpen(false);
  };

  // Quick Action: Charge directly to customer account
  const handleQuickCharge = (fine: TrafficFine) => {
    onUpdateFine(fine.id, {
      status: 'charged_to_customer',
      paymentMethod: 'deducted_from_deposit',
      notes: (fine.notes || '') + `\n[${new Date().toISOString().split('T')[0]}] تم التحميل المالي على حساب المستأجر.`,
    });
  };

  // Quick Action: Settle fine
  const handleQuickSettle = (fine: TrafficFine) => {
    onUpdateFine(fine.id, {
      status: 'settled',
      paidDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'credit_card',
    });
  };

  // Filtered Fines
  const filteredFines = useMemo(() => {
    return fines.filter((fine) => {
      const matchesSearch =
        fine.fineNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fine.carPlateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fine.carBrandModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fine.customerName && fine.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (fine.violationLocation && fine.violationLocation.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || fine.status === statusFilter;
      const matchesType = typeFilter === 'all' || fine.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [fines, searchTerm, statusFilter, typeFilter]);

  // Financial KPIs
  const totalFineAmount = fines.reduce((acc, f) => acc + f.totalAmount, 0);
  const pendingAmount = fines
    .filter((f) => f.status === 'pending' || f.status === 'charged_to_customer')
    .reduce((acc, f) => acc + f.totalAmount, 0);
  const settledAmount = fines
    .filter((f) => f.status === 'settled')
    .reduce((acc, f) => acc + f.totalAmount, 0);
  const pendingCount = fines.filter((f) => f.status === 'pending').length;

  const getTypeLabel = (type: FineType) => {
    switch (type) {
      case 'speeding':
        return lang === 'ar' ? 'تجاوز السرعة (ساهر)' : 'Speeding';
      case 'red_light':
        return lang === 'ar' ? 'قطع الإشارة' : 'Red Light';
      case 'parking':
        return lang === 'ar' ? 'مواقف ومخالفات بلدية' : 'Illegal Parking';
      case 'toll':
        return lang === 'ar' ? 'بوابة سالك / تعرفة الطرق' : 'Road Toll';
      case 'seatbelt':
        return lang === 'ar' ? 'حزام الأمان' : 'Seatbelt';
      case 'mobile_phone':
        return lang === 'ar' ? 'استخدام الجوال' : 'Mobile Phone';
      case 'lane_violation':
        return lang === 'ar' ? 'مسار أو تجاوز ممنوع' : 'Lane Violation';
      default:
        return lang === 'ar' ? 'مخالفة أخرى' : 'Other Violation';
    }
  };

  const getStatusBadge = (status: FineStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 rounded-full text-xs font-black flex items-center gap-1 border border-rose-200 dark:border-rose-900 w-fit">
            <Clock className="w-3 h-3" />
            <span>{lang === 'ar' ? 'معلقة / غير مسددة' : 'Pending'}</span>
          </span>
        );
      case 'charged_to_customer':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 rounded-full text-xs font-black flex items-center gap-1 border border-amber-200 dark:border-amber-900 w-fit">
            <User className="w-3 h-3" />
            <span>{lang === 'ar' ? 'محملة على العميل' : 'Charged to Client'}</span>
          </span>
        );
      case 'settled':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 rounded-full text-xs font-black flex items-center gap-1 border border-emerald-200 dark:border-emerald-900 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            <span>{lang === 'ar' ? 'تمت التسوية والسداد' : 'Settled'}</span>
          </span>
        );
      case 'disputed':
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 rounded-full text-xs font-black flex items-center gap-1 border border-purple-200 dark:border-purple-900 w-fit">
            <AlertTriangle className="w-3 h-3" />
            <span>{lang === 'ar' ? 'قيد الاعتراض المروري' : 'Disputed'}</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-full text-xs font-bold w-fit">
            <span>{lang === 'ar' ? 'ملغاة' : 'Cancelled'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertOctagon className="w-7 h-7 text-rose-600" />
            <span>{t.trafficFines || (lang === 'ar' ? 'إدارة المخالفات المرورية ورسوم بوابات الطرق' : 'Traffic Fines & Tolls')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar'
              ? 'متابعة وإسقاط مخالفات ساهر والمرور، والربط الذكي بعقود الإيجار، وتخصيص الرسوم الإدارية للتحصيل'
              : 'Automated radar fine tracking, lease contract linking, surcharge fees, and customer chargeback'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t.recordFine || (lang === 'ar' ? 'تسجيل مخالفة جديدة' : 'Record Traffic Fine')}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'إجمالي المخالفات المسجلة' : 'Total Fines Logged'}</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalFineAmount, currency, lang)}
          </p>
          <span className="text-[11px] text-slate-500 font-semibold">{fines.length} {lang === 'ar' ? 'مخالفة مسجلة' : 'records'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{lang === 'ar' ? 'مخالفات معلقة ومستحقة' : 'Pending Unsettled'}</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(pendingAmount, currency, lang)}
          </p>
          <span className="text-[11px] text-rose-600/80 font-bold">{pendingCount} {lang === 'ar' ? 'مخالفة بانتظار السداد' : 'fines pending'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{lang === 'ar' ? 'المخالفات المسددة' : 'Settled Fines'}</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(settledAmount, currency, lang)}
          </p>
          <span className="text-[11px] text-emerald-600/80 font-bold">
            {fines.filter((f) => f.status === 'settled').length} {lang === 'ar' ? 'تمت تسويتها' : 'settled'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{lang === 'ar' ? 'عوائد الرسوم الإدارية' : 'Admin Surcharges'}</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {formatCurrency(fines.reduce((acc, f) => acc + (f.serviceFee || 0), 0), currency, lang)}
          </p>
          <span className="text-[11px] text-purple-500 font-semibold">{lang === 'ar' ? 'أرباح التحصيل المضافة' : 'Fleet net markup'}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-3.5 rtl:right-3.5 ltr:left-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'ar' ? 'ابحث برقم المخالفة، لوحة السيارة، الموديل، اسم العميل، الموقع...' : 'Search by fine number, plate, model, customer, location...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rtl:pr-10 ltr:pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          <option value="all">{lang === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
          <option value="pending">⏳ {lang === 'ar' ? 'معلقة / غير مسددة' : 'Pending'}</option>
          <option value="charged_to_customer">👤 {lang === 'ar' ? 'محملة على العميل' : 'Charged to Client'}</option>
          <option value="settled">✅ {lang === 'ar' ? 'مسددة بالكامل' : 'Settled'}</option>
          <option value="disputed">⚖️ {lang === 'ar' ? 'قيد الاعتراض' : 'Disputed'}</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          <option value="all">{lang === 'ar' ? 'جميع أنواع المخالفات' : 'All Types'}</option>
          <option value="speeding">{lang === 'ar' ? 'سرعة زائدة (ساهر)' : 'Speeding'}</option>
          <option value="red_light">{lang === 'ar' ? 'قطع إشارة' : 'Red Light'}</option>
          <option value="parking">{lang === 'ar' ? 'وقوف خاطئ' : 'Parking'}</option>
          <option value="toll">{lang === 'ar' ? 'رسوم عبور بوابات' : 'Toll Gate'}</option>
          <option value="seatbelt">{lang === 'ar' ? 'حزام أمان' : 'Seatbelt'}</option>
          <option value="mobile_phone">{lang === 'ar' ? 'استخدام الجوال' : 'Mobile Phone'}</option>
        </select>
      </div>

      {/* Fines Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {filteredFines.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <AlertOctagon className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">
              {lang === 'ar' ? 'لا توجد مخالفات مرورية مطابقة لمعايير البحث' : 'No traffic fines match your search'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-extrabold">
                  <th className="py-3 px-4">{lang === 'ar' ? 'رقم المخالفة والنوع' : 'Fine No. & Type'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'السيارة واللوحة' : 'Vehicle & Plate'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'المستأجر / السائق' : 'Driver / Lessee'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'تاريخ وموقع الرصد' : 'Date & Location'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'القيمة الإجمالية' : 'Total Amount'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'ar' ? 'إجراءات وسداد' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFines.map((fine) => (
                  <tr key={fine.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-mono font-black text-rose-600 dark:text-rose-400 block text-xs">
                          {fine.fineNumber}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {getTypeLabel(fine.type)}
                        </span>
                        {fine.description && (
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">{fine.description}</p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white leading-tight">
                            {fine.carBrandModel}
                          </p>
                          <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                            {fine.carPlateNumber}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {fine.customerName ? (
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{fine.customerName}</span>
                          </p>
                          {fine.contractNumber && (
                            <span className="text-[10px] text-blue-600 font-mono block">
                              {lang === 'ar' ? 'عقد:' : 'Contract:'} {fine.contractNumber}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">
                          {lang === 'ar' ? 'غير مسند لمستأجر (الشركة)' : 'Unassigned (Company)'}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-mono text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{fine.violationDate}</span>
                          {fine.violationTime && <span className="text-slate-400">({fine.violationTime})</span>}
                        </div>
                        {fine.violationLocation && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-xs">{fine.violationLocation}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-black text-sm text-slate-900 dark:text-white block">
                          {formatCurrency(fine.totalAmount, currency, lang)}
                        </span>
                        {fine.serviceFee ? (
                          <span className="text-[10px] text-slate-500 font-medium block">
                            ({fine.amount} + {fine.serviceFee} {lang === 'ar' ? 'أتعاب' : 'fee'})
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(fine.status)}</td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {fine.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleQuickCharge(fine)}
                            className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-lg text-[11px] font-extrabold border border-amber-300 transition"
                            title={lang === 'ar' ? 'تحميل مباشر على حساب العميل' : 'Charge to Customer'}
                          >
                            {lang === 'ar' ? 'تحميل ع العميل' : 'Charge Client'}
                          </button>
                        )}

                        {fine.status !== 'settled' && (
                          <button
                            type="button"
                            onClick={() => handleQuickSettle(fine)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black shadow-xs transition flex items-center gap-1"
                            title={lang === 'ar' ? 'تسوية وسداد المخالفة' : 'Settle fine'}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{lang === 'ar' ? 'تسوية' : 'Settle'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openEditModal(fine)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title={t.edit}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteFine(fine.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Fine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="p-4 bg-rose-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-white" />
                <h3 className="font-extrabold text-sm sm:text-base">
                  {editingFine
                    ? (lang === 'ar' ? 'تعديل بيانات المخالفة المرورية' : 'Edit Traffic Fine')
                    : (lang === 'ar' ? 'تسجيل مخالفة مرورية جديدة' : 'Record New Traffic Fine')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'رقم المخالفة / رقم الإشعار *' : 'Fine / Notice Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fineNumber}
                    onChange={(e) => setFineNumber(e.target.value)}
                    placeholder="SAHR-1234567"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'نوع المخالفة' : 'Violation Type'}
                  </label>
                  <select
                    value={fineType}
                    onChange={(e) => setFineType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="speeding">{lang === 'ar' ? 'تجاوز السرعة (ساهر)' : 'Speeding'}</option>
                    <option value="red_light">{lang === 'ar' ? 'قطع إشارة ضوئية' : 'Red Light'}</option>
                    <option value="parking">{lang === 'ar' ? 'وقوف خاطئ / ممنوع' : 'Parking'}</option>
                    <option value="toll">{lang === 'ar' ? 'رسوم بوابة عبور سالك' : 'Toll Gate'}</option>
                    <option value="seatbelt">{lang === 'ar' ? 'عدم ربط حزام الأمان' : 'Seatbelt'}</option>
                    <option value="mobile_phone">{lang === 'ar' ? 'استخدام الهاتف المحمول' : 'Mobile Phone'}</option>
                    <option value="lane_violation">{lang === 'ar' ? 'عدم الالتزام بالمسار' : 'Lane Violation'}</option>
                    <option value="other">{lang === 'ar' ? 'مخالفة مرورية أخرى' : 'Other'}</option>
                  </select>
                </div>
              </div>

              {/* Car & Auto-Match Link */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">
                      {lang === 'ar' ? 'السيارة المخالفة *' : 'Violating Vehicle *'}
                    </label>
                    <select
                      value={selectedCarId}
                      onChange={(e) => handleCarOrDateChange(e.target.value, violationDate)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {cars.map((car) => (
                        <option key={car.id} value={car.id}>
                          {car.brand} {car.model} ({car.plateNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">
                      {lang === 'ar' ? 'تاريخ المخالفة *' : 'Violation Date *'}
                    </label>
                    <input
                      type="date"
                      required
                      value={violationDate}
                      onChange={(e) => handleCarOrDateChange(selectedCarId, e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Auto Matched Customer / Contract Preview */}
                <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-blue-900 dark:text-blue-200">
                      {lang === 'ar' ? 'ربط تلقائي بالمستأجر في هذا التاريخ:' : 'Contract on this date:'}
                    </span>
                    {selectedContractId ? (
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 ms-1">
                        ✓ {customers.find((c) => c.id === selectedCustomerId)?.name || ''} ({contracts.find((c) => c.id === selectedContractId)?.contractNumber})
                      </span>
                    ) : (
                      <span className="text-slate-500 ms-1 italic">
                        {lang === 'ar' ? 'لم يتم العثور على عقد نشط في هذا التاريخ' : 'No active contract found on this date'}
                      </span>
                    )}
                  </div>

                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="px-2 py-1 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">{lang === 'ar' ? '-- إسناد يدوي لمستأجر --' : '-- Manual Customer Select --'}</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'وقت المخالفة' : 'Violation Time'}
                  </label>
                  <input
                    type="time"
                    value={violationTime}
                    onChange={(e) => setViolationTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'موقع المخالفة (الشارع / المدينة)' : 'Violation Location'}
                  </label>
                  <input
                    type="text"
                    value={violationLocation}
                    onChange={(e) => setViolationLocation(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: طريق الملك فهد - تقاطع التحلية' : 'King Fahd Rd / Intersection'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? `قيمة المخالفة الأصلية (${currency}) *` : `Original Fine (${currency}) *`}
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-rose-600 dark:text-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? `أتعاب إدارية للشركة (${currency})` : `Admin Surcharge (${currency})`}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={serviceFee}
                      onChange={(e) => setServiceFee(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-purple-600 dark:text-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? `الإجمالي المطلوب تحصيله (${currency})` : `Total Billable (${currency})`}
                    </label>
                    <div className="px-3 py-2 bg-slate-200 dark:bg-slate-700/60 rounded-xl text-xs font-black text-slate-900 dark:text-white flex items-center h-9">
                      {formatCurrency(Number(amount) + Number(serviceFee || 0), currency, lang)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'حالة السداد والتحصيل' : 'Status'}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="pending">⏳ {lang === 'ar' ? 'معلقة / غير مسددة' : 'Pending'}</option>
                  <option value="charged_to_customer">👤 {lang === 'ar' ? 'تحميل مباشر على العميل' : 'Charged to Customer'}</option>
                  <option value="settled">✅ {lang === 'ar' ? 'تمت التسوية والسداد' : 'Settled'}</option>
                  <option value="disputed">⚖️ {lang === 'ar' ? 'اعتراض مروري رسمي' : 'Disputed'}</option>
                  <option value="cancelled">❌ {lang === 'ar' ? 'ملغاة' : 'Cancelled'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'ملاحظات إضافية' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'ملاحظات عن طريقة التحصيل أو جهة الاستعلام...' : 'Additional notes...'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
