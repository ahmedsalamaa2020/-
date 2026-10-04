import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Users, MapPin, Calendar, Clock, User, CheckCircle2, AlertCircle, Printer, Car, ShieldCheck, Edit2, Trash2, FileSpreadsheet } from 'lucide-react';
import { AppSettings, Car as CarType, DeliveryService, DeliveryStatus, Driver, Currency, Language } from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { PrintInvoiceModal } from './PrintInvoiceModal';
import { PrintDeliveryMonthlyReportModal } from './PrintDeliveryMonthlyReportModal';
import { exportToExcel } from '../utils/excelExport';

interface DeliveryModuleProps {
  deliveries: DeliveryService[];
  cars: CarType[];
  drivers: Driver[];
  settings: AppSettings;
  onAddDelivery: (delivery: DeliveryService) => void;
  onUpdateDelivery: (delivery: DeliveryService) => void;
  onDeleteDelivery?: (deliveryId: string) => void;
  currency: Currency;
  lang: Language;
  selectedDeliveryId?: string;
  onClearTarget?: () => void;
}

export const DeliveryModule: React.FC<DeliveryModuleProps> = ({
  deliveries,
  cars,
  drivers,
  settings,
  onAddDelivery,
  onUpdateDelivery,
  onDeleteDelivery,
  currency,
  lang,
  selectedDeliveryId,
  onClearTarget,
}) => {
  const t = translations[lang];

  // View switch: 'list' | 'report'
  const [activeView, setActiveView] = useState<'list' | 'report'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryService | null>(null);
  const [printData, setPrintData] = useState<any | null>(null);

  useEffect(() => {
    if (selectedDeliveryId) {
      const found = deliveries.find((d) => d.id === selectedDeliveryId);
      if (found) {
        setActiveView('list');
        setSearchTerm(found.customerName || found.orderNumber || '');
        setStatusFilter('all');
      }
    }
  }, [selectedDeliveryId, deliveries]);

  // Report Period State
  const [reportStartDate, setReportStartDate] = useState<string>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [reportEndDate, setReportEndDate] = useState<string>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  });
  const [reportCustomer, setReportCustomer] = useState<string>('all');
  const [reportStatus, setReportStatus] = useState<string>('all');
  const [isPrintMonthlyReportModalOpen, setIsPrintMonthlyReportModalOpen] = useState<boolean>(false);

  const applyDeliveryPreset = (preset: 'today' | 'this_week' | 'this_month' | 'last_month' | 'last_30_days' | 'all') => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (preset === 'today') {
      setReportStartDate(todayStr);
      setReportEndDate(todayStr);
    } else if (preset === 'this_week') {
      const dayOfWeek = today.getDay();
      const diff = (dayOfWeek + 1) % 7;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - diff);
      setReportStartDate(startOfWeek.toISOString().slice(0, 10));
      setReportEndDate(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setReportStartDate(firstDay.toISOString().slice(0, 10));
      setReportEndDate(lastDay.toISOString().slice(0, 10));
    } else if (preset === 'last_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      setReportStartDate(firstDay.toISOString().slice(0, 10));
      setReportEndDate(lastDay.toISOString().slice(0, 10));
    } else if (preset === 'last_30_days') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      setReportStartDate(past30.toISOString().slice(0, 10));
      setReportEndDate(todayStr);
    } else if (preset === 'all') {
      setReportStartDate('');
      setReportEndDate('');
    }
  };

  // Extract all unique customer names for selection
  const allCustomerNames = useMemo(() => {
    const names = new Set<string>();
    deliveries.forEach((d) => {
      if (d.customerName && d.customerName.trim()) {
        names.add(d.customerName.trim());
      }
    });
    return Array.from(names);
  }, [deliveries]);

  const handleExportDeliveriesExcel = () => {
    const targetTrips = deliveries.filter((del) => {
      const tripDate = (del.scheduledDate || '').slice(0, 10);
      const matchesPeriod = (!reportStartDate || tripDate >= reportStartDate) && (!reportEndDate || tripDate <= reportEndDate);
      const matchesCust = reportCustomer === 'all' || del.customerName === reportCustomer;
      const matchesStat = reportStatus === 'all' || del.status === reportStatus;
      return matchesPeriod && matchesCust && matchesStat;
    }).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

    const totalTrips = targetTrips.length;
    const completedCount = targetTrips.filter((d) => d.status === 'completed').length;
    const pendingCount = targetTrips.filter((d) => d.status === 'pending').length;
    const inProgressCount = targetTrips.filter((d) => d.status === 'in_progress').length;
    const totalRevenue = targetTrips.reduce((sum, d) => sum + (d.price || 0), 0);
    const totalPassengers = targetTrips.reduce((sum, d) => sum + (d.passengerCount || 1), 0);

    const columns = [
      { header: lang === 'ar' ? 'رقم الرحلة' : 'Trip ID', key: 'id', width: 14 },
      { header: lang === 'ar' ? 'التاريخ' : 'Date', key: 'scheduledDate', width: 14 },
      { header: lang === 'ar' ? 'الوقت' : 'Time', key: 'scheduledTime', width: 12 },
      { header: lang === 'ar' ? 'العميل / الشركة' : 'Customer / Company', key: 'customerName', width: 22 },
      { header: lang === 'ar' ? 'الهاتف' : 'Phone', key: 'customerPhone', width: 16 },
      { header: lang === 'ar' ? 'نوع الخدمة' : 'Service Type', key: 'serviceType', width: 20 },
      { header: lang === 'ar' ? 'نقطة الانطلاق (البداية)' : 'Pickup', key: 'pickupAddress', width: 25 },
      { header: lang === 'ar' ? 'نقطة الوصول (النهاية)' : 'Dropoff', key: 'dropoffAddress', width: 25 },
      { header: lang === 'ar' ? 'عدد الركاب' : 'Passengers', key: 'passengerCount', width: 12 },
      { header: lang === 'ar' ? 'السائق' : 'Driver', key: 'driverName', width: 18 },
      { header: lang === 'ar' ? 'السيارة' : 'Vehicle', key: 'carPlate', width: 16 },
      { header: `${lang === 'ar' ? 'المبلغ' : 'Amount'} (${currency})`, key: 'price', width: 14 },
      { header: lang === 'ar' ? 'الحالة' : 'Status', key: 'statusText', width: 16 },
      { header: lang === 'ar' ? 'الملاحظات' : 'Notes', key: 'notes', width: 30 },
    ];

    const data = targetTrips.map((del) => {
      const assignedDriver = drivers.find((d) => d.id === del.driverId);
      const assignedCar = cars.find((c) => c.id === del.carId);

      let serviceTypeName = 'نقل ركاب';
      if (del.tripType === 'airport') serviceTypeName = lang === 'ar' ? 'استقبال وتوصيل مطار' : 'Airport Transfer';
      else if (del.tripType === 'vip_chauffeur') serviceTypeName = lang === 'ar' ? 'ليموزين وسائق VIP' : 'VIP Chauffeur';
      else if (del.tripType === 'city_transfer') serviceTypeName = lang === 'ar' ? 'مشاوير وتنقلات مدن' : 'City Transfer';
      else if (del.tripType === 'corporate_commute') serviceTypeName = lang === 'ar' ? 'نقل موظفين وشركات' : 'Corporate Commute';

      let statusText = 'معلقة';
      if (del.status === 'completed') statusText = lang === 'ar' ? 'مكتملة ✓' : 'Completed';
      else if (del.status === 'in_progress') statusText = lang === 'ar' ? 'جارية' : 'In Progress';
      else if (del.status === 'cancelled') statusText = lang === 'ar' ? 'ملغاة' : 'Cancelled';

      return {
        id: del.id,
        scheduledDate: del.scheduledDate,
        scheduledTime: del.scheduledTime,
        customerName: del.customerName,
        customerPhone: del.customerPhone,
        serviceType: serviceTypeName,
        pickupAddress: del.pickupAddress,
        dropoffAddress: del.dropoffAddress,
        passengerCount: del.passengerCount || 1,
        driverName: assignedDriver ? assignedDriver.name : '-',
        carPlate: assignedCar ? assignedCar.plateNumber : '-',
        price: del.price || 0,
        statusText,
        notes: del.notes || '-',
      };
    });

    const summaryRows = [
      { label: lang === 'ar' ? 'إجمالي عدد الرحلات:' : 'Total Trips Count:', value: totalTrips },
      { label: lang === 'ar' ? 'الرحلات المكتملة بنجاح:' : 'Completed Trips:', value: completedCount },
      { label: lang === 'ar' ? 'الرحلات الجارية / المعلقة:' : 'In Progress / Pending:', value: `${inProgressCount + pendingCount}` },
      { label: lang === 'ar' ? 'إجمالي المبالغ المستحقة:' : 'Total Due Amount:', value: `${totalRevenue} ${currency}` },
      { label: lang === 'ar' ? 'إجمالي حركة الركاب المنقولين:' : 'Total Passengers Transferred:', value: totalPassengers },
    ];

    const periodLabel = reportStartDate && reportEndDate
      ? `${reportStartDate}_إلى_${reportEndDate}`
      : reportStartDate || reportEndDate || 'كافة_الفترات';

    exportToExcel({
      fileName: `تقرير_رحلات_التوصيل_${reportCustomer === 'all' ? 'كافة_العملاء' : reportCustomer}_${periodLabel}`,
      sheetName: 'سجل الرحلات',
      title: `${settings.organizationName || settings.appName} - ${lang === 'ar' ? 'تقرير رحلات نقل وتوصيل الركاب بالفترة' : 'Passenger Transfer & Chauffeur Period Report'}`,
      subtitle: `${lang === 'ar' ? 'العميل / الشركة:' : 'Client:'} ${reportCustomer === 'all' ? (lang === 'ar' ? 'كافة العملاء والشركات' : 'All Clients') : reportCustomer} | ${lang === 'ar' ? 'الفترة:' : 'Period:'} ${reportStartDate || 'الكل'} إلى ${reportEndDate || 'الآن'}`,
      columns,
      data,
      summaryRows,
    });
  };

  // Form State for Human Passenger Transfer & Monthly Contracts
  const [isMonthlyContract, setIsMonthlyContract] = useState(false);
  const [contractDurationMonths, setContractDurationMonths] = useState<number>(1);
  const [subscriptionFee, setSubscriptionFee] = useState<number>(2500);
  const [renewalType, setRenewalType] = useState<'automatic' | 'manual'>('automatic');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [passengerNames, setPassengerNames] = useState('');
  const [tripType, setTripType] = useState<'airport' | 'vip_chauffeur' | 'city_transfer' | 'corporate_commute'>('airport');
  const [cargoDescription, setCargoDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('10:00 AM');
  const [selectedCarId, setSelectedCarId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [price, setPrice] = useState<number>(350);
  const [notes, setNotes] = useState('');

  const handleOpenCreateModal = () => {
    setEditingDelivery(null);
    setIsMonthlyContract(false);
    setContractDurationMonths(1);
    setSubscriptionFee(2500);
    setRenewalType('automatic');
    setCustomerName('');
    setCustomerPhone('');
    setPickupAddress('');
    setDropoffAddress('');
    setPassengerCount(1);
    setPassengerNames('');
    setTripType('airport');
    setCargoDescription('');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setScheduledTime('10:00 AM');
    setSelectedCarId(cars[0]?.id || '');
    setSelectedDriverId(drivers[0]?.id || '');
    setPrice(350);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (del: DeliveryService) => {
    setEditingDelivery(del);
    setIsMonthlyContract(!!del.isMonthlyContract);
    setContractDurationMonths(del.contractDurationMonths || 1);
    setSubscriptionFee(del.subscriptionFee || (del.price / (del.contractDurationMonths || 1)) || 2500);
    setRenewalType(del.renewalType || 'automatic');
    setCustomerName(del.customerName || '');
    setCustomerPhone(del.customerPhone || '');
    setPickupAddress(del.pickupAddress || '');
    setDropoffAddress(del.dropoffAddress || '');
    setPassengerCount(del.passengerCount || 1);
    setPassengerNames(del.passengerNames || '');
    setTripType(del.tripType || 'airport');
    setCargoDescription(del.cargoDescription || '');
    setScheduledDate(del.scheduledDate || new Date().toISOString().split('T')[0]);
    setScheduledTime(del.scheduledTime || '10:00 AM');
    setSelectedCarId(del.carId || cars[0]?.id || '');
    setSelectedDriverId(del.driverId || drivers[0]?.id || '');
    setPrice(del.price || 350);
    setNotes(del.notes || '');
    setIsModalOpen(true);
  };

  const handleDeleteDeliveryClick = (del: DeliveryService) => {
    const confirmMsg = lang === 'ar'
      ? `هل أنت متأكد من حذف رحلة / خدمة التوصيل رقم (${del.orderNumber}) للعميل (${del.customerName})؟`
      : `Are you sure you want to delete delivery order (${del.orderNumber}) for customer (${del.customerName})?`;
    
    if (window.confirm(confirmMsg)) {
      if (onDeleteDelivery) {
        onDeleteDelivery(del.id);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !pickupAddress || !dropoffAddress) return;

    const car = cars.find((c) => c.id === selectedCarId);
    const drv = drivers.find((d) => d.id === selectedDriverId);

    const calculatedPrice = isMonthlyContract ? (subscriptionFee * contractDurationMonths) : price;

    const detailsText = cargoDescription || (
      isMonthlyContract
        ? `${lang === 'ar' ? 'عقد اشتراك شهري' : 'Monthly Subscription'} (${contractDurationMonths} ${lang === 'ar' ? 'أشهر' : 'Months'}) - ${tripType.toUpperCase()}`
        : `${lang === 'ar' ? 'توصيل ركاب' : 'Passenger Ride'} (${passengerCount} ${lang === 'ar' ? 'ركاب' : 'Passengers'}) - ${tripType.toUpperCase()}`
    );

    if (editingDelivery) {
      const updatedDel: DeliveryService = {
        ...editingDelivery,
        customerName,
        customerPhone,
        pickupAddress,
        dropoffAddress,
        cargoDescription: detailsText,
        passengerCount,
        passengerNames,
        tripType,
        isMonthlyContract,
        contractDurationMonths: isMonthlyContract ? contractDurationMonths : undefined,
        subscriptionFee: isMonthlyContract ? subscriptionFee : undefined,
        renewalType: isMonthlyContract ? renewalType : undefined,
        autoRenew: isMonthlyContract ? renewalType === 'automatic' : undefined,
        scheduledDate,
        scheduledTime,
        carId: car?.id,
        carPlate: car?.plateNumber,
        driverId: drv?.id,
        driverName: drv?.name,
        price: calculatedPrice,
        notes,
      };

      onUpdateDelivery(updatedDel);
      setIsModalOpen(false);
      setEditingDelivery(null);
      return;
    }

    const prefix = isMonthlyContract ? 'SUB' : 'TRIP';
    const newOrderNumber = `${prefix}-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newDel: DeliveryService = {
      id: `del_${Date.now()}`,
      orderNumber: newOrderNumber,
      customerName,
      customerPhone,
      pickupAddress,
      dropoffAddress,
      cargoDescription: detailsText,
      passengerCount,
      passengerNames,
      tripType,
      isMonthlyContract,
      contractDurationMonths: isMonthlyContract ? contractDurationMonths : undefined,
      subscriptionFee: isMonthlyContract ? subscriptionFee : undefined,
      renewalType: isMonthlyContract ? renewalType : undefined,
      autoRenew: isMonthlyContract ? renewalType === 'automatic' : undefined,
      scheduledDate,
      scheduledTime,
      carId: car?.id,
      carPlate: car?.plateNumber,
      driverId: drv?.id,
      driverName: drv?.name,
      price: calculatedPrice,
      status: 'pending',
      paymentStatus: 'paid',
      notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddDelivery(newDel);
    setIsModalOpen(false);
    setEditingDelivery(null);
  };

  const handleStatusChange = (delivery: DeliveryService, newStatus: DeliveryStatus) => {
    onUpdateDelivery({
      ...delivery,
      status: newStatus,
    });
  };

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesSearch =
      d.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.dropoffAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.passengerNames && d.passengerNames.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (st: DeliveryStatus) => {
    switch (st) {
      case 'pending':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-xs rounded-full border border-amber-300">{t.pending}</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-xs rounded-full border border-blue-300">{t.inProgress}</span>;
      case 'completed':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs rounded-full border border-emerald-300">{t.completed}</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-xs rounded-full border border-rose-300">{t.cancelledContract}</span>;
    }
  };

  const getTripTypeLabel = (type?: string) => {
    switch (type) {
      case 'airport':
        return lang === 'ar' ? 'توصيل مطار VIP' : 'Airport VIP Transfer';
      case 'vip_chauffeur':
        return lang === 'ar' ? 'سائق خاص وكبار الشخصيات' : 'VIP Chauffeur Ride';
      case 'city_transfer':
        return lang === 'ar' ? 'تنقل داخل المدينة' : 'City Passenger Ride';
      case 'corporate_commute':
        return lang === 'ar' ? 'نقل موظفين وتنفيذيين' : 'Corporate Commute';
      default:
        return lang === 'ar' ? 'خدمة نقل ركاب' : 'Passenger Transfer';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>{t.deliveriesList}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar'
              ? 'خدمة نقل وإيصال الركاب والأفراد (Chauffeur & Passenger Transfer)، تعيين السائق الخاص وتتبع الرحلات الفاخرة'
              : 'Dedicated Human Passenger Transport & Chauffeur Services. Assign private drivers and track passenger trips.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveView('report');
              setIsPrintMonthlyReportModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-bold text-xs shadow-md transition border border-slate-700"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>{lang === 'ar' ? 'طباعة تقرير الشهر' : 'Print Month Report'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportDeliveriesExcel}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إكسيل الشهر (XLSX)' : 'Export Excel'}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.scheduleDelivery}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveView('list')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeView === 'list'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{lang === 'ar' ? 'قائمة وسجل رحلات التوصيل' : 'All Trips & Bookings'}</span>
        </button>

        <button
          onClick={() => setActiveView('report')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeView === 'report'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>{lang === 'ar' ? '📊 التقرير الشهري وحسابات العملاء (إكسيل + طباعة)' : 'Monthly Customer Trips Report (Excel & Print)'}</span>
        </button>
      </div>

      {/* VIEW 1: TRIPS LIST */}
      {activeView === 'list' && (
        <div className="space-y-6">
          {/* Passenger Service Notice Banner */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="text-xs text-blue-900 dark:text-blue-200">
              <span className="font-extrabold block">
                {lang === 'ar' ? 'خدمة نقل الركاب والأفراد المباشرة' : 'Human Passenger Delivery & Chauffeur Service'}
              </span>
              <span>
                {lang === 'ar'
                  ? 'هذا القسم مخصص حصرياً لرحلات ونقل الأشخاص والركاب مع سائق خاص (استقبال المطار، تنقلات الوفود، ورحلات VIP)، وليس للبضائع أو الشحن.'
                  : 'This module is exclusively dedicated to human passenger transport, airport pickups, and executive chauffeur services.'}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute top-3.5 rtl:right-3.5 ltr:left-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rtl:pr-10 ltr:pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{lang === 'ar' ? 'جميع حالات الرحلات' : 'All Trip Statuses'}</option>
              <option value="pending">{t.pending}</option>
              <option value="in_progress">{t.inProgress}</option>
              <option value="completed">{t.completed}</option>
            </select>
          </div>

          {/* Deliveries Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredDeliveries.map((del) => (
          <div
            key={del.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                    {del.orderNumber}
                  </span>
                  <span className="text-xs text-slate-500">• {del.customerName}</span>
                </div>
                {getStatusBadge(del.status)}
              </div>

              {/* Trip Type & Passenger Tag / Monthly Contract Tag */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] rounded-lg">
                    {getTripTypeLabel(del.tripType)}
                  </span>
                  {del.isMonthlyContract && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-200 font-black text-[10px] rounded-lg border border-purple-300">
                      📅 {lang === 'ar' ? `عقد شهري (${del.contractDurationMonths || 1} أشهر)` : `Monthly Contract (${del.contractDurationMonths || 1} mos)`}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>{del.passengerCount || 1} {lang === 'ar' ? 'ركاب' : 'Passenger(s)'}</span>
                </span>
              </div>

              {/* Route */}
              <div className="space-y-2 text-xs mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 block">{t.pickupAddress}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{del.pickupAddress}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 block">{t.dropoffAddress}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{del.dropoffAddress}</span>
                  </div>
                </div>
              </div>

              {/* Passenger Details & Driver */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
                <div>
                  <span className="font-semibold text-slate-400 block">{t.cargoDescription}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2">{del.cargoDescription}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block">{t.driverName}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{del.driverName || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">{t.totalAmount}</span>
                <span className="font-black text-blue-600 text-sm">{formatCurrency(del.price, currency, lang)}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {del.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(del, 'in_progress')}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    {lang === 'ar' ? 'بدء الرحلة' : 'Start Trip'}
                  </button>
                )}

                {del.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange(del, 'completed')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    {lang === 'ar' ? 'إكمال الرحلة' : 'Complete Ride'}
                  </button>
                )}

                {/* Edit Button */}
                <button
                  onClick={() => handleOpenEditModal(del)}
                  className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-lg border border-amber-200 dark:border-amber-800 transition"
                  title={t.edit}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Print Button */}
                <button
                  onClick={() =>
                    setPrintData({
                      invoiceNumber: del.orderNumber,
                      date: del.scheduledDate,
                      type: 'delivery',
                      customerName: del.customerName,
                      customerPhone: del.customerPhone,
                      itemName: `قسيمة حجز رحلة نقل ركاب: ${del.cargoDescription}`,
                      itemDetails: `من: ${del.pickupAddress} ➔ إلى: ${del.dropoffAddress} (${del.passengerCount || 1} ركاب)`,
                      amount: del.price,
                      totalAmount: del.price,
                      paymentMethod: 'cash',
                      paymentStatus: del.paymentStatus,
                      notes: del.notes,
                    })
                  }
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-lg transition"
                  title={t.print}
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                {onDeleteDelivery && (
                  <button
                    onClick={() => handleDeleteDeliveryClick(del)}
                    className="p-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 hover:bg-rose-100 rounded-lg border border-rose-200 dark:border-rose-800 transition"
                    title={lang === 'ar' ? 'حذف الرحلة' : 'Delete Trip'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* VIEW 2: MONTHLY REPORT & STATEMENT */}
  {activeView === 'report' && (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>{lang === 'ar' ? 'التقرير الشهري الشامل لرحلات نقل الركاب والعملاء (إكسيل + طباعة)' : 'Monthly Passenger Trips Statement & Excel Export'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'ar'
                ? 'اختر العميل أو الشركة والشهر لاستخراج كشف الحساب الفوري وتصديره إلى ملف إكسيل (.xlsx) وطباعته'
                : 'Select customer/company and month to generate monthly statement, export to Excel and print.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportDeliveriesExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تصدير إكسيل (Excel .xlsx)' : 'Export Excel (.xlsx)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintMonthlyReportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'معاينة وطباعة التقرير (Print)' : 'Print Statement'}</span>
            </button>
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 text-[11px] font-bold shrink-0">{lang === 'ar' ? 'فترات سريعة:' : 'Quick Filters:'}</span>
          <button
            type="button"
            onClick={() => applyDeliveryPreset('today')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 font-bold transition shrink-0"
          >
            {lang === 'ar' ? 'اليوم' : 'Today'}
          </button>
          <button
            type="button"
            onClick={() => applyDeliveryPreset('this_week')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 font-bold transition shrink-0"
          >
            {lang === 'ar' ? 'هذا الأسبوع' : 'This Week'}
          </button>
          <button
            type="button"
            onClick={() => applyDeliveryPreset('this_month')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 font-bold transition shrink-0"
          >
            {lang === 'ar' ? 'هذا الشهر' : 'This Month'}
          </button>
          <button
            type="button"
            onClick={() => applyDeliveryPreset('last_month')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 font-bold transition shrink-0"
          >
            {lang === 'ar' ? 'الشهر السابق' : 'Last Month'}
          </button>
          <button
            type="button"
            onClick={() => applyDeliveryPreset('last_30_days')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 font-bold transition shrink-0"
          >
            {lang === 'ar' ? 'آخر 30 يوم' : 'Last 30 Days'}
          </button>
          <button
            type="button"
            onClick={() => applyDeliveryPreset('all')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 font-bold transition shrink-0"
          >
            {lang === 'ar' ? 'كافة الفترات' : 'All Time'}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'ar' ? '👤 العميل أو الشركة:' : 'Customer / Company:'}
            </label>
            <select
              value={reportCustomer}
              onChange={(e) => setReportCustomer(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="all">{lang === 'ar' ? '👥 كافة العملاء والشركات' : 'All Customers & Companies'}</option>
              {allCustomerNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'ar' ? '📅 من تاريخ:' : 'From Date:'}
            </label>
            <input
              type="date"
              value={reportStartDate}
              onChange={(e) => setReportStartDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'ar' ? '📅 إلى تاريخ:' : 'To Date:'}
            </label>
            <input
              type="date"
              value={reportEndDate}
              onChange={(e) => setReportEndDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'ar' ? '📌 حالة الرحلة:' : 'Trip Status:'}
            </label>
            <select
              value={reportStatus}
              onChange={(e) => setReportStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="all">{lang === 'ar' ? 'جميع حالات الرحلات' : 'All Statuses'}</option>
              <option value="completed">{lang === 'ar' ? 'المكتملة بنجاح ✓' : 'Completed'}</option>
              <option value="in_progress">{lang === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
              <option value="pending">{lang === 'ar' ? 'المعلقة' : 'Pending'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Render KPI Cards for Deliveries Monthly Report */}
      {(() => {
        const reportDeliveries = deliveries.filter((del) => {
          const tripDate = (del.scheduledDate || '').slice(0, 10);
          const matchesPeriod = (!reportStartDate || tripDate >= reportStartDate) && (!reportEndDate || tripDate <= reportEndDate);
          const matchesCust = reportCustomer === 'all' || del.customerName === reportCustomer;
          const matchesStat = reportStatus === 'all' || del.status === reportStatus;
          return matchesPeriod && matchesCust && matchesStat;
        }).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

        const totalTrips = reportDeliveries.length;
        const completedCount = reportDeliveries.filter((d) => d.status === 'completed').length;
        const inProgressCount = reportDeliveries.filter((d) => d.status === 'in_progress').length;
        const pendingCount = reportDeliveries.filter((d) => d.status === 'pending').length;
        const totalRevenue = reportDeliveries.reduce((sum, d) => sum + (d.price || 0), 0);
        const totalPassengers = reportDeliveries.reduce((sum, d) => sum + (d.passengerCount || 1), 0);

        return (
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                <span className="text-xs font-bold text-slate-500 block">{lang === 'ar' ? 'إجمالي الرحلات المسجلة' : 'Total Trips'}</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1 block">{totalTrips}</span>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">{lang === 'ar' ? 'الرحلات المكتملة' : 'Completed'}</span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">{completedCount}</span>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block">{lang === 'ar' ? 'إجمالي المبالغ المستحقة' : 'Total Revenue'}</span>
                <span className="text-xl font-black text-purple-700 dark:text-purple-300 font-mono mt-1 block">
                  {formatCurrency(totalRevenue, currency, lang)}
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">{lang === 'ar' ? 'إجمالي الركاب المنقولين' : 'Total Passengers'}</span>
                <span className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono mt-1 block">{totalPassengers} {lang === 'ar' ? 'راكب' : 'pass.'}</span>
              </div>
            </div>

            {/* Detailed Trips Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>
                    {lang === 'ar' 
                      ? `كشف رحلات الفترة (${reportStartDate || 'الكل'} إلى ${reportEndDate || 'الآن'}) - ${reportCustomer === 'all' ? 'كافة العملاء والشركات' : reportCustomer}` 
                      : 'Period Trips Statement'}
                  </span>
                </h4>
                <span className="text-xs font-mono text-slate-500">{reportDeliveries.length} {lang === 'ar' ? 'رحلة' : 'trips'}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">{lang === 'ar' ? 'رقم وتاريخ الرحلة' : 'Trip & Date'}</th>
                      <th className="p-3.5">{lang === 'ar' ? 'العميل / الشركة' : 'Customer / Company'}</th>
                      <th className="p-3.5">{lang === 'ar' ? 'نوع الخدمة' : 'Service Type'}</th>
                      <th className="p-3.5">{lang === 'ar' ? 'خط السير (الانطلاق ➜ الوصول)' : 'Route'}</th>
                      <th className="p-3.5">{lang === 'ar' ? 'السائق والمركبة' : 'Driver & Vehicle'}</th>
                      <th className="p-3.5 text-center">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                      <th className="p-3.5 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reportDeliveries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          {lang === 'ar' ? 'لا توجد رحلات توصيل مسجلة لهذا الشهر والعميل المحدد' : 'No trips found for this month and customer.'}
                        </td>
                      </tr>
                    ) : (
                      reportDeliveries.map((del) => (
                        <tr key={del.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-blue-600 block">{del.orderNumber}</span>
                            <span className="font-mono text-slate-500 text-[11px]">{del.scheduledDate} • {del.scheduledTime}</span>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">{del.customerName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{del.customerPhone}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-semibold rounded-md text-[11px]">
                              {getTripTypeLabel(del.tripType)}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5">{del.passengerCount || 1} {lang === 'ar' ? 'ركاب' : 'passengers'}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="text-[11px] text-slate-700 dark:text-slate-300">
                              <span className="text-emerald-600 font-bold">من:</span> {del.pickupAddress}
                            </div>
                            <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                              <span className="text-rose-600 font-bold">إلى:</span> {del.dropoffAddress}
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-semibold text-slate-900 dark:text-white">{del.driverName || 'N/A'}</div>
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap font-mono font-black text-slate-900 dark:text-white">
                            {formatCurrency(del.price, currency, lang)}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            {getStatusBadge(del.status)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  )}

      {/* Schedule / Edit Passenger Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>
                  {editingDelivery
                    ? (lang === 'ar' ? 'تعديل بيانات حجز الرحلة / خدمة التوصيل' : 'Edit Delivery / Trip Booking')
                    : t.scheduleDelivery}
                </span>
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingDelivery(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Contract Mode Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsMonthlyContract(false)}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition ${
                    !isMonthlyContract
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🚗 {lang === 'ar' ? 'رحلة فردية' : 'Single Trip'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMonthlyContract(true)}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition ${
                    isMonthlyContract
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  📅 {lang === 'ar' ? 'عقد اشتراك شهري' : 'Monthly Subscription'}
                </button>
              </div>

              {/* Monthly Subscription Specific Fields */}
              {isMonthlyContract && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-purple-900 dark:text-purple-200">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>{lang === 'ar' ? 'تفاصيل عقد الاشتراك الشهري' : 'Monthly Subscription Details'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t.contractDurationMonths}
                      </label>
                      <select
                        value={contractDurationMonths}
                        onChange={(e) => setContractDurationMonths(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                      >
                        <option value={1}>1 {lang === 'ar' ? 'شهر واحد' : 'Month'}</option>
                        <option value={3}>3 {lang === 'ar' ? 'أشهر (ربع سنوي)' : 'Months'}</option>
                        <option value={6}>6 {lang === 'ar' ? 'أشهر (نصف سنوي)' : 'Months'}</option>
                        <option value={12}>12 {lang === 'ar' ? 'شهر (سنوي)' : 'Months'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t.subscriptionFee} ({currency} / {lang === 'ar' ? 'شهر' : 'mo'})
                      </label>
                      <input
                        type="number"
                        min="500"
                        value={subscriptionFee}
                        onChange={(e) => setSubscriptionFee(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t.renewalType}
                      </label>
                      <select
                        value={renewalType}
                        onChange={(e) => setRenewalType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                      >
                        <option value="automatic">{lang === 'ar' ? 'تجديد تلقائي' : 'Automatic Renewal'}</option>
                        <option value="manual">{lang === 'ar' ? 'تجديد يدوي' : 'Manual Renewal'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-xs font-extrabold text-purple-800 dark:text-purple-300 pt-1 flex justify-between border-t border-purple-200 dark:border-purple-800">
                    <span>{lang === 'ar' ? 'إجمالي قيمة العقد:' : 'Total Contract Value:'}</span>
                    <span className="font-mono">{formatCurrency(subscriptionFee * contractDurationMonths, currency, lang)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.customerName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.phone}
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Passenger & Trip Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.tripType}
                  </label>
                  <select
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    <option value="airport">{lang === 'ar' ? 'توصيل واستقبال مطار VIP' : 'Airport Transfer'}</option>
                    <option value="vip_chauffeur">{lang === 'ar' ? 'سائق خاص لكبار الشخصيات' : 'VIP Chauffeur'}</option>
                    <option value="city_transfer">{lang === 'ar' ? 'مشوار داخل المدينة' : 'City Passenger Ride'}</option>
                    <option value="corporate_commute">{lang === 'ar' ? 'تنقلات موظفين وتنفيذيين' : 'Corporate Commute'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.passengerCount}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.pickupAddress} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ar' ? 'مثال: مطار الملك خالد - الصالة 5' : 'e.g., Airport Terminal 5'}
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.dropoffAddress} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ar' ? 'مثال: فندق الفورسيزونز - الرياض' : 'e.g., Four Seasons Hotel'}
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.cargoDescription}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'ملاحظات الركاب أو لوحة الاستقبال' : 'Passenger notes or greeting sign details'}
                  value={cargoDescription}
                  onChange={(e) => setCargoDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.driverName}
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.cost} ({currency})
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      <PrintInvoiceModal
        isOpen={!!printData}
        onClose={() => setPrintData(null)}
        invoiceData={printData}
        settings={settings}
        lang={lang}
      />

      {/* Printable Monthly Statement Report Modal */}
      <PrintDeliveryMonthlyReportModal
        isOpen={isPrintMonthlyReportModalOpen}
        onClose={() => setIsPrintMonthlyReportModalOpen(false)}
        deliveries={deliveries}
        selectedClientName={reportCustomer}
        startDate={reportStartDate}
        endDate={reportEndDate}
        settings={settings}
        lang={lang}
      />
    </div>
  );
};
