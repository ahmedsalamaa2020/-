import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  FileText,
  DollarSign,
  Briefcase,
  Sparkles,
  TrendingUp,
  Download,
  Printer,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Truck,
  FileCheck,
  CheckSquare,
  MessageSquare,
  Car as CarIcon,
  Phone,
  ShieldCheck,
  ExternalLink,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AppSettings,
  Car as CarType,
  CorporateContract,
  DailyShiftLog,
  Driver,
  Language,
} from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { exportElementToPdf, triggerBrowserPrint } from '../utils/pdfExport';
import { exportToExcel } from '../utils/excelExport';
import { PrintCorporateContractModal } from './PrintCorporateContractModal';
import { PrintShiftMonthlyReportModal } from './PrintShiftMonthlyReportModal';

interface CorporateModuleProps {
  shiftLogs: DailyShiftLog[];
  corporateContracts: CorporateContract[];
  drivers: Driver[];
  cars: CarType[];
  settings: AppSettings;
  lang: Language;
  selectedItemId?: string;
  onClearTarget?: () => void;
  onAddShiftLog: (log: DailyShiftLog) => void;
  onUpdateShiftLog: (log: DailyShiftLog) => void;
  onDeleteShiftLog: (id: string) => void;
  onAddCorporateContract: (contract: CorporateContract) => void;
  onUpdateCorporateContract: (contract: CorporateContract) => void;
  onDeleteCorporateContract: (id: string) => void;
}

export const CorporateModule: React.FC<CorporateModuleProps> = ({
  shiftLogs,
  corporateContracts,
  drivers,
  cars,
  settings,
  lang,
  selectedItemId,
  onClearTarget,
  onAddShiftLog,
  onUpdateShiftLog,
  onDeleteShiftLog,
  onAddCorporateContract,
  onUpdateCorporateContract,
  onDeleteCorporateContract,
}) => {
  const t = translations[lang];

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<'contracts' | 'daily' | 'shift_pages' | 'report'>('contracts');

  // Selected Company & Shift for the Dedicated Shift Pages
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>(() => {
    if (corporateContracts.length > 0) return corporateContracts[0].companyName;
    if (shiftLogs.length > 0) return shiftLogs[0].companyName;
    return 'شركة التقنية المتقدمة';
  });

  const [selectedShiftKey, setSelectedShiftKey] = useState<string>('all');

  // Calendar Month (YYYY-MM)
  const [calendarMonth, setCalendarMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (selectedItemId) {
      const foundContract = corporateContracts.find((c) => c.id === selectedItemId);
      if (foundContract) {
        setActiveTab('contracts');
        setSelectedCompanyName(foundContract.companyName);
        return;
      }
      const foundShift = shiftLogs.find((s) => s.id === selectedItemId);
      if (foundShift) {
        setActiveTab('daily');
        setSelectedCompanyName(foundShift.companyName);
        setSearchQuery(foundShift.shiftName || foundShift.companyName);
      }
    }
  }, [selectedItemId, corporateContracts, shiftLogs]);

  // Global Corporate Statistics & KPIs
  const corporateKPIs = useMemo(() => {
    const activeContracts = corporateContracts.filter((c) => c.status === 'active' || !c.status);
    const totalMonthlyRevenue = activeContracts.reduce((sum, c) => sum + (c.monthlyPrice || 0), 0);
    const totalDedicatedFleet = activeContracts.reduce((sum, c) => sum + (c.fleetSize || 1), 0);
    const totalStaffTransported = activeContracts.reduce((sum, c) => sum + (c.employeeCount || 0), 0);

    const todayLogs = shiftLogs.filter((l) => l.shiftDate === todayStr);
    const todayCompleted = todayLogs.filter((l) => l.isDepartureDone && l.isReturnDone).length;
    const todayInProgress = todayLogs.filter((l) => (l.isDepartureDone || l.isReturnDone) && !(l.isDepartureDone && l.isReturnDone)).length;
    const todayPending = todayLogs.length - todayCompleted - todayInProgress;

    const monthLogs = shiftLogs.filter((l) => l.shiftDate.startsWith(calendarMonth));
    const monthDoneTrips = monthLogs.reduce((sum, l) => sum + (l.isDepartureDone ? 1 : 0) + (l.isReturnDone ? 1 : 0), 0);
    const monthTotalExpectedTrips = monthLogs.length * 2;
    const monthRate = monthTotalExpectedTrips > 0 ? Math.round((monthDoneTrips / monthTotalExpectedTrips) * 100) : 0;

    return {
      activeContractsCount: activeContracts.length,
      totalMonthlyRevenue,
      totalDedicatedFleet,
      totalStaffTransported,
      todayTotal: todayLogs.length,
      todayCompleted,
      todayInProgress,
      todayPending,
      monthTotalShifts: monthLogs.length,
      monthRate,
    };
  }, [corporateContracts, shiftLogs, todayStr, calendarMonth]);

  // Month Navigation
  const handlePrevMonth = () => {
    const [yr, mo] = calendarMonth.split('-').map(Number);
    const d = new Date(yr, mo - 2, 1);
    const prevStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setCalendarMonth(prevStr);
  };

  const handleNextMonth = () => {
    const [yr, mo] = calendarMonth.split('-').map(Number);
    const d = new Date(yr, mo, 1);
    const nextStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setCalendarMonth(nextStr);
  };

  // List of all unique company names across contracts and logs
  const allCompanyNames = useMemo(() => {
    const names = new Set<string>();
    corporateContracts.forEach((c) => names.add(c.companyName));
    shiftLogs.forEach((l) => names.add(l.companyName));
    if (names.size === 0) names.add('شركة التقنية المتقدمة');
    return Array.from(names);
  }, [corporateContracts, shiftLogs]);

  // Ensure selected company is valid
  const activeCompany = allCompanyNames.includes(selectedCompanyName)
    ? selectedCompanyName
    : allCompanyNames[0] || 'شركة التقنية المتقدمة';

  const activeContract = corporateContracts.find((c) => c.companyName === activeCompany);

  // All shifts for the active company
  const companyShifts = useMemo(() => {
    return shiftLogs.filter((l) => l.companyName === activeCompany);
  }, [shiftLogs, activeCompany]);

  // Extract distinct shift profiles / routes for this company
  interface ShiftProfile {
    key: string;
    name: string;
    departureTime: string;
    arrivalTime: string;
    fromLocation: string;
    toLocation: string;
    driverName: string;
    carPlate: string;
    employeeCount: number;
  }

  const shiftProfiles = useMemo(() => {
    const map = new Map<string, ShiftProfile>();

    companyShifts.forEach((log) => {
      const shiftName =
        log.shiftName ||
        (log.departureTime <= '11:00'
          ? `وردية صباحية (${log.departureTime})`
          : log.departureTime <= '18:00'
          ? `وردية مسائية (${log.departureTime})`
          : `وردية ليلية (${log.departureTime})`);

      const key = `${log.departureTime}_${log.fromLocation || 'loc'}_${log.toLocation || 'dest'}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: shiftName,
          departureTime: log.departureTime,
          arrivalTime: log.arrivalTime,
          fromLocation: log.fromLocation || 'حي الملز',
          toLocation: log.toLocation || 'واجهة الرياض',
          driverName: log.driverName,
          carPlate: log.carPlate,
          employeeCount: log.employeeCount,
        });
      }
    });

    // If no shift logs exist yet for this company, provide default template shifts
    if (map.size === 0) {
      map.set('07:30_default', {
        key: '07:30_default',
        name: 'وردية صباحية (07:30 ص)',
        departureTime: '07:30',
        arrivalTime: '08:30',
        fromLocation: 'حي الملز - الرياض',
        toLocation: 'المقر الرئيسي للشركة',
        driverName: drivers[0]?.name || 'محمد الأحمد',
        carPlate: cars[0]?.plateNumber || 'أ ب ج 1234',
        employeeCount: activeContract?.employeeCount || 15,
      });

      map.set('16:30_default', {
        key: '16:30_default',
        name: 'وردية مسائية (16:30 م)',
        departureTime: '16:30',
        arrivalTime: '17:30',
        fromLocation: 'المقر الرئيسي للشركة',
        toLocation: 'حي الملز - الرياض',
        driverName: drivers[0]?.name || 'محمد الأحمد',
        carPlate: cars[0]?.plateNumber || 'أ ب ج 1234',
        employeeCount: activeContract?.employeeCount || 15,
      });
    }

    return Array.from(map.values());
  }, [companyShifts, activeContract, drivers, cars]);

  // Current Active Shift Profile
  const activeShiftProfile =
    shiftProfiles.find((s) => s.key === selectedShiftKey) || shiftProfiles[0];

  // Shift Logs for the Active Company in the Selected Month
  const monthCompanyLogs = useMemo(() => {
    return companyShifts.filter((l) => l.shiftDate.startsWith(calendarMonth));
  }, [companyShifts, calendarMonth]);

  // Shift Logs for the Active specific shift profile in the Selected Month
  const currentShiftCalendarLogs = useMemo(() => {
    if (selectedShiftKey === 'all') return monthCompanyLogs;
    return monthCompanyLogs.filter(
      (l) =>
        (l.shiftName && l.shiftName === activeShiftProfile?.name) ||
        (l.departureTime === activeShiftProfile?.departureTime &&
          (l.fromLocation === activeShiftProfile?.fromLocation || !l.fromLocation))
    );
  }, [monthCompanyLogs, selectedShiftKey, activeShiftProfile]);

  // Calculations for THIS Specific Shift / Company in THIS Month
  const shiftMonthStats = useMemo(() => {
    const scheduledDays = currentShiftCalendarLogs.length;
    const departureDone = currentShiftCalendarLogs.filter((l) => l.isDepartureDone ?? false).length;
    const returnDone = currentShiftCalendarLogs.filter((l) => l.isReturnDone ?? false).length;
    const totalDone = departureDone + returnDone;
    const totalExpected = scheduledDays * 2;
    const rate = totalExpected > 0 ? Math.round((totalDone / totalExpected) * 100) : 0;
    const notesCount = currentShiftCalendarLogs.filter((l) => l.notes && l.notes.trim() !== '').length;

    const estimatedValue = activeContract
      ? activeContract.monthlyPrice
      : totalDone * 150;

    return {
      scheduledDays,
      departureDone,
      returnDone,
      totalDone,
      totalExpected,
      rate,
      notesCount,
      estimatedValue,
    };
  }, [currentShiftCalendarLogs, activeContract]);

  // Fast Instant Toggles for Departure and Return
  const handleToggleDeparture = (log: DailyShiftLog) => {
    const current = log.isDepartureDone ?? false;
    const newDeparture = !current;
    const isCompleted = newDeparture && (log.isReturnDone ?? false);

    onUpdateShiftLog({
      ...log,
      isDepartureDone: newDeparture,
      isCompleted,
      completionStatus: isCompleted ? 'completed' : 'in_progress',
    });
  };

  const handleToggleReturn = (log: DailyShiftLog) => {
    const current = log.isReturnDone ?? false;
    const newReturn = !current;
    const isCompleted = (log.isDepartureDone ?? false) && newReturn;

    onUpdateShiftLog({
      ...log,
      isReturnDone: newReturn,
      isCompleted,
      completionStatus: isCompleted ? 'completed' : 'in_progress',
    });
  };

  const handleCompleteBothTrips = (log: DailyShiftLog) => {
    onUpdateShiftLog({
      ...log,
      isDepartureDone: true,
      isReturnDone: true,
      isCompleted: true,
      completionStatus: 'completed',
    });
  };

  // Quick Inline / Modal Note Editor State
  const [editingNoteLog, setEditingNoteLog] = useState<DailyShiftLog | null>(null);
  const [noteInputText, setNoteInputText] = useState<string>('');

  const handleOpenNoteModal = (log: DailyShiftLog) => {
    setEditingNoteLog(log);
    setNoteInputText(log.notes || '');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteLog) return;

    onUpdateShiftLog({
      ...editingNoteLog,
      notes: noteInputText,
    });
    setEditingNoteLog(null);
  };

  // Batch Month Generator for THIS Company & Shift
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [batchDriverId, setBatchDriverId] = useState<string>(drivers[0]?.id || '');
  const [batchCarId, setBatchCarId] = useState<string>(cars[0]?.id || '');
  const [batchDaysOption, setBatchDaysOption] = useState<'workdays_sun_thu' | 'workdays_all_week' | 'workdays_mon_fri'>('workdays_sun_thu');
  const [batchShiftName, setBatchShiftName] = useState<string>(activeShiftProfile?.name || 'وردية صباحية');
  const [batchDepartureTime, setBatchDepartureTime] = useState<string>(activeShiftProfile?.departureTime || '07:30');
  const [batchArrivalTime, setBatchArrivalTime] = useState<string>(activeShiftProfile?.arrivalTime || '16:30');
  const [batchFromLocation, setBatchFromLocation] = useState<string>(activeShiftProfile?.fromLocation || 'حي الملز');
  const [batchToLocation, setBatchToLocation] = useState<string>(activeShiftProfile?.toLocation || 'المقر الرئيسي للشركة');
  const [batchEmployeeCount, setBatchEmployeeCount] = useState<number>(activeShiftProfile?.employeeCount || 15);

  const handleOpenBatchForShift = () => {
    if (activeShiftProfile) {
      setBatchShiftName(activeShiftProfile.name);
      setBatchDepartureTime(activeShiftProfile.departureTime);
      setBatchArrivalTime(activeShiftProfile.arrivalTime);
      setBatchFromLocation(activeShiftProfile.fromLocation);
      setBatchToLocation(activeShiftProfile.toLocation);
      setBatchEmployeeCount(activeShiftProfile.employeeCount);
    }
    if (drivers.length > 0) setBatchDriverId(drivers[0].id);
    if (cars.length > 0) setBatchCarId(cars[0].id);
    setShowBatchModal(true);
  };

  const handleExecuteBatchMonth = (e: React.FormEvent) => {
    e.preventDefault();
    const [yr, mo] = calendarMonth.split('-').map(Number);
    const daysInMo = new Date(yr, mo, 0).getDate();

    const selectedDriver = drivers.find((d) => d.id === batchDriverId);
    const selectedCar = cars.find((c) => c.id === batchCarId);

    for (let day = 1; day <= daysInMo; day++) {
      const dObj = new Date(yr, mo - 1, day);
      const dayOfWeek = dObj.getDay(); // 0=Sun, 5=Fri, 6=Sat

      let isWorkday = true;
      if (batchDaysOption === 'workdays_sun_thu') {
        if (dayOfWeek === 5 || dayOfWeek === 6) isWorkday = false; // Exclude Fri & Sat
      } else if (batchDaysOption === 'workdays_mon_fri') {
        if (dayOfWeek === 0 || dayOfWeek === 6) isWorkday = false; // Exclude Sun & Sat
      }

      if (!isWorkday) continue;

      const dateStr = `${yr}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Check if log already exists for this date, company and shift
      const existing = shiftLogs.find(
        (s) =>
          s.shiftDate === dateStr &&
          s.companyName === activeCompany &&
          (s.shiftName === batchShiftName || s.departureTime === batchDepartureTime)
      );

      if (!existing) {
        const newLog: DailyShiftLog = {
          id: `shift_gen_${dateStr}_${activeCompany.slice(0, 4)}_${Math.floor(100 + Math.random() * 900)}`,
          shiftDate: dateStr,
          tripType: 'go_and_return',
          shiftName: batchShiftName,
          fromLocation: batchFromLocation,
          toLocation: batchToLocation,
          departureTime: batchDepartureTime,
          arrivalTime: batchArrivalTime,
          companyName: activeCompany,
          driverId: batchDriverId,
          driverName: selectedDriver ? selectedDriver.name : 'سائق معتمد',
          carId: batchCarId,
          carPlate: selectedCar ? selectedCar.plateNumber : '---',
          carModel: selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : 'حافلة نقل موظفين',
          employeeCount: batchEmployeeCount,
          isDepartureDone: false,
          isReturnDone: false,
          isCompleted: false,
          completionStatus: 'in_progress',
          notes: '',
          createdAt: new Date().toISOString().slice(0, 10),
        };
        onAddShiftLog(newLog);
      }
    }

    setShowBatchModal(false);
  };

  // Add / Edit Single Shift Entry Modal
  const [showShiftModal, setShowShiftModal] = useState<boolean>(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [shiftDate, setShiftDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [modalCompanyName, setModalCompanyName] = useState<string>(activeCompany);
  const [modalShiftName, setModalShiftName] = useState<string>('وردية صباحية');
  const [modalDepartureTime, setModalDepartureTime] = useState<string>('07:30');
  const [modalArrivalTime, setModalArrivalTime] = useState<string>('16:30');
  const [modalFromLocation, setModalFromLocation] = useState<string>('حي الملز - الرياض');
  const [modalToLocation, setModalToLocation] = useState<string>('المقر الرئيسي للشركة');
  const [modalDriverId, setModalDriverId] = useState<string>('');
  const [modalCarId, setModalCarId] = useState<string>('');
  const [modalEmployeeCount, setModalEmployeeCount] = useState<number>(15);
  const [modalNotes, setModalNotes] = useState<string>('');
  const [modalDepartureDone, setModalDepartureDone] = useState<boolean>(false);
  const [modalReturnDone, setModalReturnDone] = useState<boolean>(false);

  const applyCompanyDefaultsToModal = (targetCompany: string) => {
    const contract = corporateContracts.find((c) => c.companyName === targetCompany);
    const existingLog = shiftLogs.find((l) => l.companyName === targetCompany);
    if (contract) {
      if (contract.employeeCount) setModalEmployeeCount(contract.employeeCount);
      if (contract.shiftDetails && contract.shiftDetails.includes(':')) {
        setModalShiftName(contract.shiftDetails.split('|')[0]?.trim() || 'وردية صباحية');
      }
    }
    if (existingLog) {
      if (existingLog.driverId) setModalDriverId(existingLog.driverId);
      if (existingLog.carId) setModalCarId(existingLog.carId);
      if (existingLog.fromLocation) setModalFromLocation(existingLog.fromLocation);
      if (existingLog.toLocation) setModalToLocation(existingLog.toLocation);
      if (existingLog.departureTime) setModalDepartureTime(existingLog.departureTime);
      if (existingLog.arrivalTime) setModalArrivalTime(existingLog.arrivalTime);
    }
  };

  const handleOpenAddShiftForDate = (dateStr: string, presetCompany?: string) => {
    const targetComp = presetCompany || activeCompany;
    setEditingShiftId(null);
    setShiftDate(dateStr);
    setModalCompanyName(targetComp);
    setModalShiftName(activeShiftProfile?.name || 'وردية صباحية');
    setModalDepartureTime(activeShiftProfile?.departureTime || '07:30');
    setModalArrivalTime(activeShiftProfile?.arrivalTime || '16:30');
    setModalFromLocation(activeShiftProfile?.fromLocation || 'حي الملز - الرياض');
    setModalToLocation(activeShiftProfile?.toLocation || 'المقر الرئيسي للشركة');
    setModalDriverId(drivers[0]?.id || '');
    setModalCarId(cars[0]?.id || '');
    setModalEmployeeCount(activeShiftProfile?.employeeCount || 15);
    setModalNotes('');
    setModalDepartureDone(false);
    setModalReturnDone(false);
    applyCompanyDefaultsToModal(targetComp);
    setShowShiftModal(true);
  };

  const handleOpenEditShift = (log: DailyShiftLog) => {
    setEditingShiftId(log.id);
    setShiftDate(log.shiftDate);
    setModalCompanyName(log.companyName);
    setModalShiftName(log.shiftName || 'وردية صباحية');
    setModalDepartureTime(log.departureTime);
    setModalArrivalTime(log.arrivalTime);
    setModalFromLocation(log.fromLocation || 'حي الملز');
    setModalToLocation(log.toLocation || 'المقر الرئيسي');
    setModalDriverId(log.driverId);
    setModalCarId(log.carId);
    setModalEmployeeCount(log.employeeCount);
    setModalNotes(log.notes || '');
    setModalDepartureDone(log.isDepartureDone ?? false);
    setModalReturnDone(log.isReturnDone ?? false);
    setShowShiftModal(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    const selDriver = drivers.find((d) => d.id === modalDriverId);
    const selCar = cars.find((c) => c.id === modalCarId);

    const isCompleted = modalDepartureDone && modalReturnDone;

    const shiftData: DailyShiftLog = {
      id: editingShiftId || `shift_${Date.now()}`,
      shiftDate,
      tripType: 'go_and_return',
      shiftName: modalShiftName,
      departureTime: modalDepartureTime,
      arrivalTime: modalArrivalTime,
      fromLocation: modalFromLocation,
      toLocation: modalToLocation,
      companyName: modalCompanyName || activeCompany,
      driverId: modalDriverId,
      driverName: selDriver ? selDriver.name : 'سائق معتمد',
      carId: modalCarId,
      carPlate: selCar ? selCar.plateNumber : '---',
      carModel: selCar ? `${selCar.brand} ${selCar.model}` : 'حافلة نقل',
      employeeCount: modalEmployeeCount,
      isDepartureDone: modalDepartureDone,
      isReturnDone: modalReturnDone,
      isCompleted,
      completionStatus: isCompleted ? 'completed' : 'in_progress',
      notes: modalNotes,
      createdAt: editingShiftId ? shiftLogs.find((s) => s.id === editingShiftId)?.createdAt || shiftDate : shiftDate,
    };

    if (editingShiftId) {
      onUpdateShiftLog(shiftData);
    } else {
      onAddShiftLog(shiftData);
    }
    setShowShiftModal(false);
  };

  // Corporate Contract Form State
  const [showContractModal, setShowContractModal] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [corpCompanyName, setCorpCompanyName] = useState('');
  const [corpTaxId, setCorpTaxId] = useState('');
  const [corpCompanyCR, setCorpCompanyCR] = useState('');
  const [corpCompanyAddress, setCorpCompanyAddress] = useState('');
  const [corpPhone, setCorpPhone] = useState('');
  const [corpContactPerson, setCorpContactPerson] = useState('');
  const [corpCompanyRepName, setCorpCompanyRepName] = useState('');
  const [corpCompanyRepTitle, setCorpCompanyRepTitle] = useState('المدير التنفيذي');
  const [corpCompanyRepNationalId, setCorpCompanyRepNationalId] = useState('');
  const [corpCompanyRepPhone, setCorpCompanyRepPhone] = useState('');
  const [corpFleetSize, setCorpFleetSize] = useState<number>(3);
  const [corpEmployeeCount, setCorpEmployeeCount] = useState<number>(45);
  const [corpShiftDetails, setCorpShiftDetails] = useState('وردية صباحية: 07:30 ص | وردية مسائية: 04:30 م');
  const [corpMonthlyPrice, setCorpMonthlyPrice] = useState<number>(15000);
  const [corpStartDate, setCorpStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [corpDurationMonths, setCorpDurationMonths] = useState<number>(12);
  const [corpAutoRenew, setCorpAutoRenew] = useState<boolean>(true);

  // Print Contract Modal
  const [selectedCorporateContractForPrint, setSelectedCorporateContractForPrint] = useState<CorporateContract | null>(null);
  const [isPrintCorporateContractModalOpen, setIsPrintCorporateContractModalOpen] = useState(false);

  // Monthly Shifts Report & Billing Claims State
  const [isPrintShiftMonthlyReportModalOpen, setIsPrintShiftMonthlyReportModalOpen] = useState(false);
  const [reportCompany, setReportCompany] = useState<string>(activeCompany);
  const [reportMonth, setReportMonth] = useState<string>(calendarMonth);
  const [reportStartDate, setReportStartDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [reportEndDate, setReportEndDate] = useState<string>(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });
  const [reportRoute, setReportRoute] = useState<string>('all');

  const setCorporateDatePreset = (preset: 'today' | 'this_week' | 'this_month' | 'last_month' | 'last_30_days' | 'all') => {
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const today = formatDate(now);
      setReportStartDate(today);
      setReportEndDate(today);
    } else if (preset === 'this_week') {
      const day = now.getDay();
      const diffToSat = (day + 1) % 7;
      const start = new Date(now);
      start.setDate(now.getDate() - diffToSat);
      setReportStartDate(formatDate(start));
      setReportEndDate(formatDate(now));
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setReportStartDate(formatDate(start));
      setReportEndDate(formatDate(end));
      setReportMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    } else if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setReportStartDate(formatDate(start));
      setReportEndDate(formatDate(end));
      setReportMonth(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`);
    } else if (preset === 'last_30_days') {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      setReportStartDate(formatDate(start));
      setReportEndDate(formatDate(now));
    } else if (preset === 'all') {
      setReportStartDate('');
      setReportEndDate('');
    }
  };

  const handleOpenNoteEditor = (log: DailyShiftLog) => {
    const note = prompt(lang === 'ar' ? 'أدخل ملاحظة الوردية:' : 'Enter Shift Note:', log.notes || '');
    if (note !== null) {
      onUpdateShiftLog({ ...log, notes: note });
    }
  };

  const handleExportShiftsExcel = (
    targetComp = reportCompany,
    targetStartDate = reportStartDate,
    targetEndDate = reportEndDate,
    targetRt = reportRoute
  ) => {
    const targetLogs = shiftLogs.filter((log) => {
      const matchesComp = log.companyName === targetComp;
      const tripDate = (log.shiftDate || '').slice(0, 10);
      const matchesDate =
        (!targetStartDate || tripDate >= targetStartDate) &&
        (!targetEndDate || tripDate <= targetEndDate);
      const matchesRoute =
        targetRt === 'all' ||
        log.shiftName === targetRt ||
        `${log.fromLocation || ''} ➜ ${log.toLocation || ''}` === targetRt;
      return matchesComp && matchesDate && matchesRoute;
    }).sort((a, b) => a.shiftDate.localeCompare(b.shiftDate));

    const totalDays = targetLogs.length;
    const departureDoneCount = targetLogs.filter((l) => l.isDepartureDone).length;
    const returnDoneCount = targetLogs.filter((l) => l.isReturnDone).length;
    const totalTripsDone = departureDoneCount + returnDoneCount;
    const totalExpectedTrips = totalDays * 2;
    const completionRate = totalExpectedTrips > 0 ? Math.round((totalTripsDone / totalExpectedTrips) * 100) : 0;
    const totalPassengers = targetLogs.reduce((sum, l) => sum + (l.employeeCount || 0), 0);

    const columns = [
      { header: lang === 'ar' ? 'التاريخ' : 'Date', key: 'shiftDate', width: 14 },
      { header: lang === 'ar' ? 'اليوم' : 'Day', key: 'dayName', width: 14 },
      { header: lang === 'ar' ? 'اسم الوردية' : 'Shift Name', key: 'shiftName', width: 22 },
      { header: lang === 'ar' ? 'نقطة الانطلاق (البداية)' : 'From Location', key: 'fromLocation', width: 22 },
      { header: lang === 'ar' ? 'نقطة الوصول (النهاية)' : 'To Location', key: 'toLocation', width: 22 },
      { header: lang === 'ar' ? 'وقت الذهاب' : 'Departure Time', key: 'departureTime', width: 14 },
      { header: lang === 'ar' ? 'وقت العودة' : 'Return Time', key: 'arrivalTime', width: 14 },
      { header: lang === 'ar' ? 'السائق' : 'Driver', key: 'driverName', width: 18 },
      { header: lang === 'ar' ? 'لوحة المركبة' : 'Plate No', key: 'carPlate', width: 16 },
      { header: lang === 'ar' ? 'عدد الموظفين' : 'Staff Count', key: 'employeeCount', width: 14 },
      { header: lang === 'ar' ? 'رحلة الذهاب' : 'Departure Status', key: 'departureStatus', width: 16 },
      { header: lang === 'ar' ? 'رحلة العودة' : 'Return Status', key: 'returnStatus', width: 16 },
      { header: lang === 'ar' ? 'الملاحظات' : 'Notes', key: 'notes', width: 30 },
    ];

    const data = targetLogs.map((log) => {
      const dateObj = new Date(log.shiftDate);
      const dayName = dateObj.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' });
      return {
        shiftDate: log.shiftDate,
        dayName,
        shiftName: log.shiftName || (lang === 'ar' ? 'وردية نقل' : 'Commute Shift'),
        fromLocation: log.fromLocation || '-',
        toLocation: log.toLocation || '-',
        departureTime: log.departureTime || '-',
        arrivalTime: log.arrivalTime || '-',
        driverName: log.driverName,
        carPlate: log.carPlate,
        employeeCount: log.employeeCount,
        departureStatus: log.isDepartureDone ? (lang === 'ar' ? 'تم الذهاب ✓' : 'Completed') : (lang === 'ar' ? 'لم يتم' : 'Pending'),
        returnStatus: log.isReturnDone ? (lang === 'ar' ? 'تمت العودة ✓' : 'Completed') : (lang === 'ar' ? 'لم يتم' : 'Pending'),
        notes: log.notes || '-',
      };
    });

    const periodLabel = targetStartDate && targetEndDate
      ? `${targetStartDate} إلى ${targetEndDate}`
      : targetStartDate || targetEndDate || 'كافة الفترات';

    const periodFileLabel = targetStartDate && targetEndDate
      ? `${targetStartDate}_إلى_${targetEndDate}`
      : targetStartDate || targetEndDate || 'كافة_الفترات';

    const summaryRows = [
      { label: lang === 'ar' ? 'الفترة الزمنية المحددة:' : 'Report Period:', value: periodLabel },
      { label: lang === 'ar' ? 'إجمالي أيام العمل والورديات:' : 'Total Scheduled Days:', value: totalDays },
      { label: lang === 'ar' ? 'إجمالي رحلات الذهاب المنجزة:' : 'Total Departures Completed:', value: `${departureDoneCount} / ${totalDays}` },
      { label: lang === 'ar' ? 'إجمالي رحلات العودة المنجزة:' : 'Total Returns Completed:', value: `${returnDoneCount} / ${totalDays}` },
      { label: lang === 'ar' ? 'نسبة الالتزام والإنجاز الإجمالية:' : 'Total Completion Rate:', value: `${completionRate}%` },
      { label: lang === 'ar' ? 'إجمالي حركة الموظفين المنقولين:' : 'Total Employee Transits:', value: totalPassengers },
    ];

    exportToExcel({
      fileName: `تقرير_ورديات_${targetComp}_${periodFileLabel}`,
      sheetName: 'سجل الورديات',
      title: `${settings.organizationName || settings.appName} - ${lang === 'ar' ? 'تقرير الورديات ونقل الموظفين والمطالبات للفترة' : 'Shifts & Employee Commute Period Report'}`,
      subtitle: `${lang === 'ar' ? 'الشركة المستفيدة:' : 'Client:'} ${targetComp} | ${lang === 'ar' ? 'الفترة:' : 'Period:'} ${periodLabel}`,
      columns,
      data,
      summaryRows,
    });
  };

  const handleOpenContractModal = (contract?: CorporateContract) => {
    if (contract) {
      setEditingContractId(contract.id);
      setCorpCompanyName(contract.companyName);
      setCorpTaxId(contract.companyTaxId || '');
      setCorpCompanyCR(contract.companyCR || '');
      setCorpCompanyAddress(contract.companyAddress || '');
      setCorpPhone(contract.companyPhone);
      setCorpContactPerson(contract.contactPerson);
      setCorpCompanyRepName(contract.companyRepName || contract.contactPerson);
      setCorpCompanyRepTitle(contract.companyRepTitle || 'المدير التنفيذي');
      setCorpCompanyRepNationalId(contract.companyRepNationalId || '');
      setCorpCompanyRepPhone(contract.companyRepPhone || contract.companyPhone);
      setCorpFleetSize(contract.fleetSize);
      setCorpEmployeeCount(contract.employeeCount);
      setCorpShiftDetails(contract.shiftDetails);
      setCorpMonthlyPrice(contract.monthlyPrice);
      setCorpStartDate(contract.startDate);
      setCorpDurationMonths(contract.durationMonths);
      setCorpAutoRenew(contract.autoRenew);
    } else {
      setEditingContractId(null);
      setCorpCompanyName('');
      setCorpTaxId('');
      setCorpCompanyCR('');
      setCorpCompanyAddress('');
      setCorpPhone('');
      setCorpContactPerson('');
      setCorpCompanyRepName('');
      setCorpCompanyRepTitle('المدير التنفيذي');
      setCorpCompanyRepNationalId('');
      setCorpCompanyRepPhone('');
      setCorpFleetSize(3);
      setCorpEmployeeCount(45);
      setCorpShiftDetails('وردية صباحية: 07:30 ص | وردية مسائية: 04:30 م');
      setCorpMonthlyPrice(15000);
      setCorpStartDate(new Date().toISOString().slice(0, 10));
      setCorpDurationMonths(12);
      setCorpAutoRenew(true);
    }
    setShowContractModal(true);
  };

  const handleSaveCorporateContract = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(corpStartDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + corpDurationMonths);

    const existingContract = corporateContracts.find((c) => c.id === editingContractId);

    const contractData: CorporateContract = {
      id: editingContractId || `corp_cnt_${Date.now()}`,
      contractNumber:
        existingContract?.contractNumber ||
        `CORP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      companyName: corpCompanyName,
      companyTaxId: corpTaxId,
      companyCR: corpCompanyCR,
      companyAddress: corpCompanyAddress,
      companyPhone: corpPhone,
      contactPerson: corpContactPerson || corpCompanyRepName,
      companyRepName: corpCompanyRepName || corpContactPerson,
      companyRepTitle: corpCompanyRepTitle,
      companyRepNationalId: corpCompanyRepNationalId,
      companyRepPhone: corpCompanyRepPhone || corpPhone,
      fleetSize: corpFleetSize,
      employeeCount: corpEmployeeCount,
      shiftDetails: corpShiftDetails,
      monthlyPrice: corpMonthlyPrice,
      startDate: corpStartDate,
      endDate: end.toISOString().slice(0, 10),
      durationMonths: corpDurationMonths,
      autoRenew: corpAutoRenew,
      status: existingContract?.status || 'active',
      createdAt: existingContract?.createdAt || new Date().toISOString().slice(0, 10),
    };

    if (editingContractId) {
      onUpdateCorporateContract(contractData);
    } else {
      onAddCorporateContract(contractData);
    }
    setShowContractModal(false);
  };

  // All Shifts Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTripType, setFilterTripType] = useState<'all' | 'go' | 'return' | 'go_and_return'>('all');

  const filteredLogs = shiftLogs.filter((log) => {
    const matchesSearch =
      log.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.carPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterTripType === 'all' || log.tripType === filterTripType;
    return matchesSearch && matchesType;
  });

  // Calendar Day Matrix Calculations
  const [calYr, calMoNum] = calendarMonth.split('-').map(Number);
  const daysInCalMonth = new Date(calYr, calMoNum, 0).getDate();
  const firstDayOfWeekIdx = new Date(calYr, calMoNum - 1, 1).getDay(); // 0 = Sun

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {lang === 'ar'
                ? 'نقل الموظفين والورديات وعقود الشركات'
                : 'Corporate Employee Shifts & Fleet Management'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar'
              ? 'إدارة متكاملة لأسطول نقل الشركات، التسكين اليومي، التقويم التفاعلي مع علامات الذهاب والعودة، والتسوية المالية'
              : 'Dedicated workspace per company & shift, separate Go/Return checkmarks, interactive calendar, and monthly billing'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAddShiftForDate(new Date().toISOString().slice(0, 10))}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? '+ تسجيل وردية سريعة' : '+ New Shift'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenContractModal()}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition"
          >
            <Building2 className="w-4 h-4" />
            <span>{lang === 'ar' ? '+ عقد شركة جديد' : '+ New Contract'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setReportCompany(activeCompany);
              setReportMonth(calendarMonth);
              setReportRoute('all');
              setIsPrintShiftMonthlyReportModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-bold text-xs shadow-md transition border border-slate-700"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>{lang === 'ar' ? 'طباعة تقرير الشهر' : 'Print Month Report'}</span>
          </button>
        </div>
      </div>

      {/* Top Global Corporate KPIs Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {lang === 'ar' ? '🏢 عقود الشركات النشطة' : 'Active Contracts'}
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {corporateKPIs.activeContractsCount} <span className="text-xs font-bold text-slate-400">({corporateKPIs.totalDedicatedFleet} {lang === 'ar' ? 'حافلة' : 'buses'})</span>
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5 block">
              {corporateKPIs.totalStaffTransported} {lang === 'ar' ? 'موظف يتم نقلهم يومياً' : 'staff transported'}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {lang === 'ar' ? '💰 إجمالي الإيراد الشهري B2B' : 'Monthly B2B Revenue'}
            </span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(corporateKPIs.totalMonthlyRevenue, settings.currency, lang)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {lang === 'ar' ? 'مجموع قيمة العقود الشهرية' : 'Total contracted value'}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {lang === 'ar' ? '🕒 تشغيل ورديات اليوم' : "Today's Shifts"}
            </span>
            <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {corporateKPIs.todayCompleted} / {corporateKPIs.todayTotal} <span className="text-xs font-bold text-slate-400">{lang === 'ar' ? 'منجزة' : 'done'}</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {corporateKPIs.todayInProgress} {lang === 'ar' ? 'قيد التنفيذ' : 'in progress'} • {corporateKPIs.todayPending} {lang === 'ar' ? 'متبقية' : 'pending'}
            </span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {lang === 'ar' ? '📊 نسبة التزام ورديات الشهر' : 'Monthly Completion'}
            </span>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {corporateKPIs.monthRate}%
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {corporateKPIs.monthTotalShifts} {lang === 'ar' ? 'وردية مجدولة هذا الشهر' : 'shifts scheduled'}
            </span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'contracts'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{lang === 'ar' ? '1. عقود وملفات الشركات (B2B)' : '1. Corporate Contracts'}</span>
          <span className="px-1.5 py-0.2 bg-black/20 text-[10px] rounded-md">{corporateContracts.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'daily'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{lang === 'ar' ? '2. التسكين والتشغيل اليومي للورديات' : '2. Daily Dispatch & Shifts'}</span>
          <span className="px-1.5 py-0.2 bg-black/20 text-[10px] rounded-md">{shiftLogs.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('shift_pages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'shift_pages'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{lang === 'ar' ? '3. تقويم وجدول التشغيل الشهري' : '3. Monthly Visual Calendar'}</span>
        </button>

        <button
          onClick={() => {
            setReportCompany(activeCompany);
            setReportMonth(calendarMonth);
            setReportRoute('all');
            setActiveTab('report');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'report'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>{lang === 'ar' ? '4. المطالبات والفوترة الشهرية' : '4. Monthly Billing & Invoices'}</span>
        </button>
      </div>

      {/* TAB 1: DEDICATED PER-COMPANY & PER-SHIFT WORKSPACE & CALENDAR */}
      {activeTab === 'shift_pages' && (
        <div className="space-y-6">
          {/* Company Selector Cards / Pills Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>{lang === 'ar' ? 'اختر الشركة / المؤسسة:' : 'Select Company / Client:'}</span>
              </span>
              <button
                type="button"
                onClick={() => handleOpenContractModal()}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? '+ إضافة شركة / عقد جديد' : '+ New Company'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {allCompanyNames.map((compName) => {
                const isSelected = compName === activeCompany;
                const compContract = corporateContracts.find((c) => c.companyName === compName);
                const shiftCount = shiftLogs.filter((l) => l.companyName === compName).length;

                return (
                  <button
                    key={compName}
                    type="button"
                    onClick={() => {
                      setSelectedCompanyName(compName);
                      setSelectedShiftKey('all');
                    }}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-black transition text-right rtl:text-right ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <Building2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                    <div>
                      <div>{compName}</div>
                      <div className={`text-[10px] font-normal ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {compContract ? `${compContract.fleetSize} سيارات • ${formatCurrency(compContract.monthlyPrice, settings.currency, lang)}` : `${shiftCount} رحلات مسجلة`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shift Selector Sub-tabs for the Selected Company */}
          <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:to-slate-800 p-4 rounded-2xl border border-blue-100 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 dark:border-slate-700/60 pb-2.5">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>
                    {lang === 'ar'
                      ? `ورديات (${activeCompany}): اختر الوردية لتسجيل تقويمها المخصص`
                      : `Shifts for (${activeCompany}): Select a shift for dedicated calendar`}
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={handleOpenBatchForShift}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تهيئة أيام الشهر بالكامل' : 'Batch Generate Month'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedShiftKey('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                  selectedShiftKey === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? '📋 كافة ورديات الشركة معاً' : 'All Shifts Combined'}</span>
              </button>

              {shiftProfiles.map((shift) => {
                const isSelected = selectedShiftKey === shift.key;
                return (
                  <button
                    key={shift.key}
                    type="button"
                    onClick={() => setSelectedShiftKey(shift.key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                    }`}
                  >
                    <span>{shift.departureTime <= '11:00' ? '🌅' : shift.departureTime <= '18:00' ? '🌇' : '🌙'}</span>
                    <span>{shift.name}</span>
                    <span className="text-[10px] opacity-80 font-mono">({shift.fromLocation} ➜ {shift.toLocation})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Shift Profile Information & Monthly Stats Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-black rounded-lg">
                    {activeCompany}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {selectedShiftKey === 'all'
                      ? (lang === 'ar' ? 'صفحة تقويم كافة ورديات الشركة' : 'All Shifts Calendar')
                      : activeShiftProfile?.name}
                  </h3>
                </div>

                {activeShiftProfile && (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>{lang === 'ar' ? 'المسار:' : 'Route:'} <strong>{activeShiftProfile.fromLocation} ➜ {activeShiftProfile.toLocation}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{lang === 'ar' ? 'المواعيد:' : 'Time:'} <strong>{activeShiftProfile.departureTime} ص / {activeShiftProfile.arrivalTime} م</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      <span>{lang === 'ar' ? 'الموظفين:' : 'Employees:'} <strong>{activeShiftProfile.employeeCount} موظف</strong></span>
                    </span>
                  </div>
                )}
              </div>

              {/* Month Navigation & Print & Month Wipe */}
              <div className="flex items-center gap-2 flex-wrap">
                {currentShiftCalendarLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const count = currentShiftCalendarLogs.length;
                      if (
                        window.confirm(
                          lang === 'ar'
                            ? `هل أنت متأكد من رغبتك في مسح كافة ورديات شهر (${calendarMonth}) لشركة (${activeCompany})؟ سيتم مسح ${count} وردية مسجلة.`
                            : `Are you sure you want to delete all ${count} shift records for (${activeCompany}) in (${calendarMonth})?`
                        )
                      ) {
                        currentShiftCalendarLogs.forEach((log) => {
                          onDeleteShiftLog(log.id);
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 rounded-xl font-bold text-xs transition border border-rose-200 dark:border-rose-800"
                    title={lang === 'ar' ? 'مسح كافة ورديات هذا الشهر للشركة المحددة' : 'Wipe Month Shifts'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'مسح ورديات الشهر' : 'Clear Month'}</span>
                  </button>
                )}

                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition"
                    title={lang === 'ar' ? 'الشهر السابق' : 'Previous Month'}
                  >
                    <ChevronRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                  </button>

                  <input
                    type="month"
                    value={calendarMonth}
                    onChange={(e) => setCalendarMonth(e.target.value)}
                    className="bg-transparent border-none text-xs font-black text-slate-900 dark:text-white px-2 focus:ring-0 cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition"
                    title={lang === 'ar' ? 'الشهر التالي' : 'Next Month'}
                  >
                    <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPrintShiftMonthlyReportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'طباعة الكشف' : 'Print'}</span>
                </button>
              </div>
            </div>

            {/* Shift Month Operational Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-xs">
                <span className="block text-[10.5px] font-bold text-slate-400 mb-0.5">
                  {lang === 'ar' ? 'أيام الوردية بالشهر' : 'Scheduled Days'}
                </span>
                <div className="text-xl font-black text-white">
                  {shiftMonthStats.scheduledDays} <span className="text-xs font-normal text-slate-400">{lang === 'ar' ? 'يوم' : 'days'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                <span className="block text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 mb-0.5">
                  {lang === 'ar' ? 'رحلات الذهاب المنجزة' : 'Departure Done'}
                </span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {shiftMonthStats.departureDone} <span className="text-xs font-normal">/ {shiftMonthStats.scheduledDays}</span>
                </div>
              </div>

              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 rounded-xl border border-purple-200 dark:border-purple-800/60 shadow-xs">
                <span className="block text-[10.5px] font-bold text-purple-700 dark:text-purple-300 mb-0.5">
                  {lang === 'ar' ? 'رحلات العودة المنجزة' : 'Return Done'}
                </span>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                  {shiftMonthStats.returnDone} <span className="text-xs font-normal">/ {shiftMonthStats.scheduledDays}</span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 rounded-xl border border-blue-200 dark:border-blue-800/60 shadow-xs">
                <span className="block text-[10.5px] font-bold text-blue-700 dark:text-blue-300 mb-0.5">
                  {lang === 'ar' ? 'نسبة الإنجاز %' : 'Completion Rate'}
                </span>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {shiftMonthStats.rate}%
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded-xl border border-amber-200 dark:border-amber-800/60 shadow-xs">
                <span className="block text-[10.5px] font-bold text-amber-700 dark:text-amber-300 mb-0.5">
                  {lang === 'ar' ? 'الملاحظات المسجلة' : 'Shift Notes'}
                </span>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                  {shiftMonthStats.notesCount}
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 rounded-xl border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
                <span className="block text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5">
                  {lang === 'ar' ? 'القيمة الشهرية' : 'Monthly Fee'}
                </span>
                <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {formatCurrency(shiftMonthStats.estimatedValue, settings.currency, lang)}
                </div>
              </div>
            </div>
          </div>

          {/* THE INTERACTIVE CALENDAR GRID WITH SEPARATE GO / RETURN MARKERS & NOTES */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>
                  {lang === 'ar'
                    ? `تقويم تسجيل الوردية لشهر (${calendarMonth}) — ضع علامة للذهاب أو العودة كل واحدة منفصلة مع تسجيل الملاحظات:`
                    : `Shift Calendar (${calendarMonth}) — Mark Go / Return separately with notes:`}
                </span>
              </h3>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2">{lang === 'ar' ? 'الأحد' : 'Sun'}</div>
              <div className="p-2">{lang === 'ar' ? 'الإثنين' : 'Mon'}</div>
              <div className="p-2">{lang === 'ar' ? 'الثلاثاء' : 'Tue'}</div>
              <div className="p-2">{lang === 'ar' ? 'الأربعاء' : 'Wed'}</div>
              <div className="p-2">{lang === 'ar' ? 'الخميس' : 'Thu'}</div>
              <div className="p-2 text-rose-500">{lang === 'ar' ? 'الجمعة' : 'Fri'}</div>
              <div className="p-2 text-rose-500">{lang === 'ar' ? 'السبت' : 'Sat'}</div>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {/* Empty leading days */}
              {Array.from({ length: firstDayOfWeekIdx }).map((_, i) => (
                <div
                  key={`empty_${i}`}
                  className="min-h-[140px] bg-slate-50/40 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200/50 dark:border-slate-800/40 hidden lg:block"
                />
              ))}

              {/* Days of the Month */}
              {Array.from({ length: daysInCalMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `${calYr}-${String(calMoNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayOfWeek = new Date(calYr, calMoNum - 1, dayNum).getDay();
                const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

                // Find shift log(s) for this specific day
                const dayLogs = currentShiftCalendarLogs.filter((l) => l.shiftDate === dateStr);
                const hasShift = dayLogs.length > 0;
                const primaryLog = dayLogs[0];

                return (
                  <div
                    key={dateStr}
                    className={`min-h-[160px] p-2.5 rounded-xl border transition flex flex-col justify-between ${
                      hasShift
                        ? primaryLog.isDepartureDone && primaryLog.isReturnDone
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : primaryLog.isDepartureDone || primaryLog.isReturnDone
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-800/70 border-blue-200 dark:border-slate-700'
                        : isWeekend
                        ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 text-slate-400'
                        : 'bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                        {dayNum}
                      </span>
                      {hasShift ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditShift(primaryLog)}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition"
                            title={lang === 'ar' ? 'تعديل الوردية' : 'Edit Shift'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  lang === 'ar'
                                    ? `هل أنت متأكد من مسح وردية يوم (${primaryLog.shiftDate})؟`
                                    : `Delete shift on ${primaryLog.shiftDate}?`
                                )
                              ) {
                                onDeleteShiftLog(primaryLog.id);
                              }
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition"
                            title={lang === 'ar' ? 'مسح الوردية' : 'Delete Shift'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenAddShiftForDate(dateStr)}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          + {lang === 'ar' ? 'وردية' : 'Add'}
                        </button>
                      )}
                    </div>

                    {/* Shift Content If Exists */}
                    {hasShift ? (
                      <div className="space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          {/* 1. SEPARATE MARKER FOR DEPARTURE (علامة رحلة الذهاب) */}
                          <button
                            type="button"
                            onClick={() => handleToggleDeparture(primaryLog)}
                            className={`w-full py-1.5 px-2 rounded-lg text-[10.5px] font-black flex items-center justify-between transition border shadow-2xs ${
                              primaryLog.isDepartureDone
                                ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-500'
                                : 'bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-emerald-50'
                            }`}
                            title={lang === 'ar' ? 'انقر للتعليم على إنجاز رحلة الذهاب' : 'Click to toggle Departure'}
                          >
                            <span className="flex items-center gap-1 truncate">
                              <span className="text-xs">🚗</span>
                              <span>{lang === 'ar' ? 'الذهاب' : 'Go'}:</span>
                            </span>
                            <span className="flex items-center gap-1 font-bold">
                              {primaryLog.isDepartureDone ? (
                                <span className="flex items-center gap-0.5">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>{lang === 'ar' ? 'تم ✓' : 'Done'}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-[10px]">{lang === 'ar' ? '— لم يتم' : '— No'}</span>
                              )}
                            </span>
                          </button>

                          {/* 2. SEPARATE MARKER FOR RETURN (علامة رحلة العودة) */}
                          <button
                            type="button"
                            onClick={() => handleToggleReturn(primaryLog)}
                            className={`w-full py-1.5 px-2 rounded-lg text-[10.5px] font-black flex items-center justify-between transition border shadow-2xs ${
                              primaryLog.isReturnDone
                                ? 'bg-purple-600 text-white border-purple-700 hover:bg-purple-500'
                                : 'bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-purple-50'
                            }`}
                            title={lang === 'ar' ? 'انقر للتعليم على إنجاز رحلة العودة' : 'Click to toggle Return'}
                          >
                            <span className="flex items-center gap-1 truncate">
                              <span className="text-xs">🏁</span>
                              <span>{lang === 'ar' ? 'العودة' : 'Return'}:</span>
                            </span>
                            <span className="flex items-center gap-1 font-bold">
                              {primaryLog.isReturnDone ? (
                                <span className="flex items-center gap-0.5">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>{lang === 'ar' ? 'تم ✓' : 'Done'}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-[10px]">{lang === 'ar' ? '— لم يتم' : '— No'}</span>
                              )}
                            </span>
                          </button>
                        </div>

                        {/* 3. DEDICATED PLACE FOR NOTES (مكان تسجيل الملاحظات) */}
                        <div className="pt-1 border-t border-slate-100 dark:border-slate-700/50">
                          {primaryLog.notes ? (
                            <div
                              onClick={() => handleOpenNoteModal(primaryLog)}
                              className="p-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg text-[10px] text-amber-900 dark:text-amber-200 cursor-pointer hover:bg-amber-100 transition truncate"
                              title={primaryLog.notes}
                            >
                              💬 {primaryLog.notes}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenNoteModal(primaryLog)}
                              className="w-full py-1 text-slate-400 hover:text-blue-600 text-[10px] font-bold flex items-center justify-center gap-1 transition"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{lang === 'ar' ? '+ كتابة ملاحظة' : '+ Add Note'}</span>
                            </button>
                          )}
                        </div>

                        {/* 4. Quick Complete All (ذهاب + عودة) */}
                        {(!primaryLog.isDepartureDone || !primaryLog.isReturnDone) && (
                          <button
                            type="button"
                            onClick={() => handleCompleteBothTrips(primaryLog)}
                            className="w-full py-1 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 rounded-md text-[9.5px] font-extrabold text-center transition border border-emerald-200/60 dark:border-emerald-800/40"
                          >
                            ⚡ {lang === 'ar' ? 'إنجاز اليوم بالكامل' : 'Complete All'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
                        <span className="text-[11px] text-slate-400 italic">
                          {isWeekend ? (lang === 'ar' ? 'عطلة أسبوعية' : 'Weekend') : (lang === 'ar' ? 'لا توجد وردية' : 'No Shift')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenAddShiftForDate(dateStr)}
                          className="mt-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 rounded-md text-[10px] font-bold hover:bg-blue-100"
                        >
                          + {lang === 'ar' ? 'تسجيل وردية' : 'Add Shift'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: CORPORATE B2B CONTRACTS & ACCOUNTS */}
      {activeTab === 'contracts' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <span>{lang === 'ar' ? 'ملفات وعقود الشركات والمؤسسات (B2B)' : 'Corporate Accounts & Contracts'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar'
                  ? 'إدارة الحسابات، تفاصيل التسعير، حجم الأسطول المخصص، والوصول الفوري للتقويم والفوترة'
                  : 'Manage corporate accounts, pricing, assigned fleet size, and direct shortcuts to calendar & billing'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenContractModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? '+ إضافة عقد شركة جديد' : '+ New Contract'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {corporateContracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-mono text-[10px] font-extrabold rounded-md">
                        {contract.contractNumber}
                      </span>
                      <h3 className="font-black text-base text-slate-900 dark:text-white mt-1">
                        {contract.companyName}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold rounded-full">
                      {lang === 'ar' ? 'ساري ونشط' : 'Active'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3">
                    <div className="flex items-center justify-between">
                      <span>{lang === 'ar' ? 'مسؤول الاتصال:' : 'Contact:'}</span>
                      <strong className="text-slate-900 dark:text-white">{contract.contactPerson}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{lang === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                      <strong className="font-mono">{contract.companyPhone}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{lang === 'ar' ? 'حجم الأسطول:' : 'Fleet Size:'}</span>
                      <strong>{contract.fleetSize} {lang === 'ar' ? 'سيارات / باصات' : 'Vehicles'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{lang === 'ar' ? 'عدد الموظفين:' : 'Staff Count:'}</span>
                      <strong>{contract.employeeCount} {lang === 'ar' ? 'موظف' : 'Employees'}</strong>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 font-bold">
                      <span className="text-slate-500">{lang === 'ar' ? 'القيمة الشهرية:' : 'Monthly Fee:'}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm font-mono">
                        {formatCurrency(contract.monthlyPrice, settings.currency, lang)}
                      </span>
                    </div>
                  </div>

                  {/* Direct Module Shortcuts */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCompanyName(contract.companyName);
                        setActiveTab('shift_pages');
                      }}
                      className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تقويم التشغيل' : 'Calendar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setReportCompany(contract.companyName);
                        setReportMonth(calendarMonth);
                        setReportRoute('all');
                        setActiveTab('report');
                      }}
                      className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'المطالبة والفوترة' : 'Billing'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCorporateContractForPrint(contract);
                      setIsPrintCorporateContractModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'طباعة العقد' : 'Print'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenAddShiftForDate(new Date().toISOString().slice(0, 10), contract.companyName)}
                      className="px-2.5 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition"
                      title={lang === 'ar' ? 'تسجيل وردية سريعة لهذه الشركة' : 'Add Shift'}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenContractModal(contract)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg border border-blue-200 dark:border-blue-800 transition"
                      title={lang === 'ar' ? 'تعديل بيانات العقد' : 'Edit Contract'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            lang === 'ar'
                              ? `هل أنت متأكد من مسح عقد شركة (${contract.companyName})؟`
                              : `Delete contract for ${contract.companyName}?`
                          )
                        ) {
                          onDeleteCorporateContract(contract.id);
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg border border-rose-200 dark:border-rose-800 transition"
                      title={lang === 'ar' ? 'مسح العقد' : 'Delete Contract'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'مسح' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DAILY SHIFT REGISTER & DISPATCH OPERATIONS */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute rtl:right-3 ltr:left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث بالشركة، السائق، اللوحة، الملاحظة...' : 'Search logs...'}
                className="w-full rtl:pr-9 ltr:pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setSearchQuery(todayStr)}
                  className="px-2.5 py-1 rounded-lg font-bold bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs hover:bg-blue-50"
                >
                  {lang === 'ar' ? '📅 اليوم فقط' : 'Today'}
                </button>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-2.5 py-1 rounded-lg font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {lang === 'ar' ? 'كافة التواريخ' : 'All Dates'}
                </button>
              </div>

              <select
                value={filterTripType}
                onChange={(e: any) => setFilterTripType(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="all">{lang === 'ar' ? 'جميع أنواع الرحلات' : 'All Trips'}</option>
                <option value="go_and_return">{lang === 'ar' ? 'ذهاب وعودة' : 'Go & Return'}</option>
                <option value="go">{lang === 'ar' ? 'ذهاب فقط' : 'Go Only'}</option>
                <option value="return">{lang === 'ar' ? 'عودة فقط' : 'Return Only'}</option>
              </select>

              <button
                type="button"
                onClick={() => handleOpenAddShiftForDate(new Date().toISOString().slice(0, 10))}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تسجيل وردية' : 'New Shift'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">{lang === 'ar' ? 'التاريخ والشركة' : 'Date & Company'}</th>
                    <th className="p-3.5">{lang === 'ar' ? 'اسم الوردية والمسار' : 'Shift & Route'}</th>
                    <th className="p-3.5">{lang === 'ar' ? 'السائق والسيارة' : 'Driver & Car'}</th>
                    <th className="p-3.5 text-center bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                      {lang === 'ar' ? 'علامة الذهاب (الانطلاق)' : 'Departure'}
                    </th>
                    <th className="p-3.5 text-center bg-purple-50/50 dark:bg-purple-950/20 text-purple-800 dark:text-purple-300">
                      {lang === 'ar' ? 'علامة العودة (الوصول)' : 'Return'}
                    </th>
                    <th className="p-3.5">{lang === 'ar' ? 'الملاحظات' : 'Notes'}</th>
                    <th className="p-3.5 text-center">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        {lang === 'ar' ? 'لا توجد ورديات مطابقة لخيارات البحث الحالية' : 'No shifts match current filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      // Detect possible conflict if driver is assigned multiple shifts on the same date
                      const driverConflicts = shiftLogs.filter(
                        (l) => l.id !== log.id && l.shiftDate === log.shiftDate && l.driverId === log.driverId
                      );

                      return (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{log.shiftDate}</div>
                            <div className="font-extrabold text-slate-900 dark:text-white">{log.companyName}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-extrabold text-slate-900 dark:text-white">{log.shiftName || 'وردية نقل'}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {log.fromLocation} ➜ {log.toLocation}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-extrabold flex items-center gap-1.5">
                              <span>{log.driverName}</span>
                              {driverConflicts.length > 0 && (
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded text-[9px] font-bold" title="السائق لديه ورديات أخرى مسجلة في نفس اليوم">
                                  ⚠️ {lang === 'ar' ? 'أكثر من وردية' : 'Multi-shift'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{log.carPlate} ({log.carModel})</div>
                          </td>
                          <td className="p-3.5 text-center bg-emerald-50/30 dark:bg-emerald-950/10">
                            <button
                              type="button"
                              onClick={() => handleToggleDeparture(log)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition ${
                                log.isDepartureDone
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300'
                              }`}
                            >
                              {log.isDepartureDone ? (lang === 'ar' ? 'تم الذهاب ✓' : 'Go Done') : (lang === 'ar' ? 'تعليم الذهاب' : 'Check Go')}
                            </button>
                          </td>
                          <td className="p-3.5 text-center bg-purple-50/30 dark:bg-purple-950/10">
                            <button
                              type="button"
                              onClick={() => handleToggleReturn(log)}
                              className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition ${
                                log.isReturnDone
                                  ? 'bg-purple-600 text-white border-purple-700'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300'
                              }`}
                            >
                              {log.isReturnDone ? (lang === 'ar' ? 'تمت العودة ✓' : 'Return Done') : (lang === 'ar' ? 'تعليم العودة' : 'Check Return')}
                            </button>
                          </td>
                          <td className="p-3.5 max-w-[200px] truncate" title={log.notes}>
                            {log.notes ? (
                              <button
                                type="button"
                                onClick={() => handleOpenNoteEditor(log)}
                                className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded-lg text-[10.5px] block truncate w-full text-right"
                              >
                                💬 {log.notes}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenNoteEditor(log)}
                                className="text-slate-400 hover:text-blue-600 text-[11px] italic"
                              >
                                + {lang === 'ar' ? 'إضافة ملاحظة' : 'Add note'}
                              </button>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditShift(log)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg border border-blue-200 dark:border-blue-800 transition"
                                title={lang === 'ar' ? 'تعديل بيانات الوردية' : 'Edit Shift'}
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      lang === 'ar'
                                        ? `هل أنت متأكد من مسح وردية يوم (${log.shiftDate}) لشركة (${log.companyName})؟`
                                        : `Delete shift on ${log.shiftDate}?`
                                    )
                                  ) {
                                    onDeleteShiftLog(log.id);
                                  }
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg border border-rose-200 dark:border-rose-800 transition"
                                title={lang === 'ar' ? 'مسح الوردية' : 'Delete Shift'}
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{lang === 'ar' ? 'مسح' : 'Delete'}</span>
                              </button>
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

      {/* TAB 4: PERIOD SHIFTS EXCEL & PRINT REPORT & BILLING CLAIMS */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>{lang === 'ar' ? 'المطالبات والفوترة الشهرية وتقرير الورديات بالفترة المحددة' : 'Corporate Shift Billing & Flexible Period Claims'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'ar'
                    ? 'حدد تاريخ بداية ونهاية الفترة لحساب إجمالي الورديات المنجزة، المطالبة المالية، تصدير إكسيل والطباعة الرسمية'
                    : 'Select custom start and end date range to calculate shift operations, invoices, export to Excel and print.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportShiftsExcel(reportCompany, reportStartDate, reportEndDate, reportRoute)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تصدير إكسيل (Excel .xlsx)' : 'Export Excel (.xlsx)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintShiftMonthlyReportModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'معاينة وطباعة التقرير (Print)' : 'Print Statement'}</span>
                </button>
              </div>
            </div>

            {/* Quick Period Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold ml-1 rtl:ml-2 ltr:mr-2">
                {lang === 'ar' ? 'فترات سريعة:' : 'Quick Presets:'}
              </span>
              <button
                type="button"
                onClick={() => setCorporateDatePreset('today')}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition text-[11px]"
              >
                {lang === 'ar' ? 'اليوم' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() => setCorporateDatePreset('this_week')}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition text-[11px]"
              >
                {lang === 'ar' ? 'هذا الأسبوع' : 'This Week'}
              </button>
              <button
                type="button"
                onClick={() => setCorporateDatePreset('this_month')}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition text-[11px]"
              >
                {lang === 'ar' ? 'هذا الشهر' : 'This Month'}
              </button>
              <button
                type="button"
                onClick={() => setCorporateDatePreset('last_month')}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition text-[11px]"
              >
                {lang === 'ar' ? 'الشهر السابق' : 'Last Month'}
              </button>
              <button
                type="button"
                onClick={() => setCorporateDatePreset('last_30_days')}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition text-[11px]"
              >
                {lang === 'ar' ? 'آخر 30 يوماً' : 'Last 30 Days'}
              </button>
              <button
                type="button"
                onClick={() => setCorporateDatePreset('all')}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition text-[11px]"
              >
                {lang === 'ar' ? 'كافة الفترات' : 'All Dates'}
              </button>
            </div>

            {/* Filter Pickers Grid: Company + Start Date + End Date + Route */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? '🏢 اختر الشركة المستفيدة:' : 'Client Company:'}
                </label>
                <select
                  value={reportCompany}
                  onChange={(e) => {
                    setReportCompany(e.target.value);
                    setReportRoute('all');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  {allCompanyNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>{lang === 'ar' ? '📅 من تاريخ (البداية):' : 'Start Date:'}</span>
                  {reportStartDate && (
                    <button
                      type="button"
                      onClick={() => setReportStartDate('')}
                      className="text-[10px] text-slate-400 hover:text-rose-500 font-normal"
                    >
                      {lang === 'ar' ? 'مسح' : 'Clear'}
                    </button>
                  )}
                </label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>{lang === 'ar' ? '📅 إلى تاريخ (النهاية):' : 'End Date:'}</span>
                  {reportEndDate && (
                    <button
                      type="button"
                      onClick={() => setReportEndDate('')}
                      className="text-[10px] text-slate-400 hover:text-rose-500 font-normal"
                    >
                      {lang === 'ar' ? 'مسح' : 'Clear'}
                    </button>
                  )}
                </label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? '🚩 خط السير / الوردية:' : 'Route / Shift:'}
                </label>
                <select
                  value={reportRoute}
                  onChange={(e) => setReportRoute(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="all">{lang === 'ar' ? '📋 كافة خطوط السير والورديات' : 'All Routes & Shifts'}</option>
                  {shiftProfiles.map((sp) => (
                    <option key={sp.key} value={sp.name}>
                      {sp.name} ({sp.fromLocation} ➜ {sp.toLocation})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Render KPI Cards for the filtered data */}
          {(() => {
            const reportLogs = shiftLogs.filter((log) => {
              const matchesComp = log.companyName === reportCompany;
              const tripDate = (log.shiftDate || '').slice(0, 10);
              const matchesDate =
                (!reportStartDate || tripDate >= reportStartDate) &&
                (!reportEndDate || tripDate <= reportEndDate);
              const matchesRoute =
                reportRoute === 'all' ||
                log.shiftName === reportRoute ||
                `${log.fromLocation || ''} ➜ ${log.toLocation || ''}` === reportRoute;
              return matchesComp && matchesDate && matchesRoute;
            }).sort((a, b) => a.shiftDate.localeCompare(b.shiftDate));

            const totalDays = reportLogs.length;
            const departureDoneCount = reportLogs.filter((l) => l.isDepartureDone).length;
            const returnDoneCount = reportLogs.filter((l) => l.isReturnDone).length;
            const totalTripsDone = departureDoneCount + returnDoneCount;
            const totalExpectedTrips = totalDays * 2;
            const completionRate = totalExpectedTrips > 0 ? Math.round((totalTripsDone / totalExpectedTrips) * 100) : 0;
            const totalPassengers = reportLogs.reduce((sum, l) => sum + (l.employeeCount || 0), 0);
            const notesCount = reportLogs.filter((l) => l.notes && l.notes.trim() !== '').length;

            const matchingContract = corporateContracts.find((c) => c.companyName === reportCompany);
            const monthlyFee = matchingContract?.monthlyPrice || 0;
            const estimatedTripValue = totalExpectedTrips > 0 ? Math.round(monthlyFee / totalExpectedTrips) : 0;
            const deliveredValue = totalTripsDone * estimatedTripValue;

            const currentPeriodTitle = reportStartDate && reportEndDate
              ? `${reportStartDate} ${lang === 'ar' ? 'إلى' : 'to'} ${reportEndDate}`
              : reportStartDate
              ? `${lang === 'ar' ? 'من' : 'From'} ${reportStartDate}`
              : reportEndDate
              ? `${lang === 'ar' ? 'حتى' : 'Until'} ${reportEndDate}`
              : lang === 'ar' ? 'كافة الفترات المسجلة' : 'All Recorded Dates';

            return (
              <div className="space-y-6">
                {/* Billing Summary Banner */}
                <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-2xl border border-blue-900/60 shadow-lg space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-800/50 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-600/30 text-blue-300 rounded-xl border border-blue-500/30">
                        <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-[11px] font-mono text-blue-300 font-bold">
                          {lang === 'ar' ? `مطالبة الفاتورة للفترة: (${currentPeriodTitle})` : `Invoice Claim Period: (${currentPeriodTitle})`}
                        </div>
                        <h4 className="text-base font-black text-white">{reportCompany}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'جاهزة للاعتماد والمطالبة' : 'Ready for Invoicing'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-slate-400 block mb-0.5">{lang === 'ar' ? 'قيمة العقد الشهري الثابت:' : 'Base Monthly Fee:'}</span>
                      <strong className="text-emerald-400 text-base font-mono font-black">
                        {formatCurrency(monthlyFee, settings.currency, lang)}
                      </strong>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-slate-400 block mb-0.5">{lang === 'ar' ? 'إجمالي الرحلات المنجزة:' : 'Completed Trips:'}</span>
                      <strong className="text-white text-base font-mono font-black">
                        {totalTripsDone} <span className="text-xs text-slate-400">/ {totalExpectedTrips} {lang === 'ar' ? 'رحلة' : 'trips'}</span>
                      </strong>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-slate-400 block mb-0.5">{lang === 'ar' ? 'نسبة الالتزام التشغيلي:' : 'Operational Rate:'}</span>
                      <strong className="text-indigo-300 text-base font-mono font-black">
                        {completionRate}%
                      </strong>
                    </div>

                    <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-slate-400 block mb-0.5">{lang === 'ar' ? 'صافي المطالبة المقترحة:' : 'Net Claim Amount:'}</span>
                      <strong className="text-amber-300 text-base font-mono font-black">
                        {formatCurrency(monthlyFee > 0 ? monthlyFee : deliveredValue, settings.currency, lang)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                    <span className="text-xs font-bold text-slate-500 block">{lang === 'ar' ? 'أيام العمل المسجلة' : 'Scheduled Days'}</span>
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1 block">{totalDays}</span>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">{lang === 'ar' ? 'رحلات الذهاب المنجزة' : 'Departures Done'}</span>
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">{departureDoneCount} / {totalDays}</span>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block">{lang === 'ar' ? 'رحلات العودة المنجزة' : 'Returns Done'}</span>
                    <span className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono mt-1 block">{returnDoneCount} / {totalDays}</span>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">{lang === 'ar' ? 'نسبة الإنجاز والالتزام' : 'Completion Rate'}</span>
                    <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-1 block">{completionRate}%</span>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">{lang === 'ar' ? 'إجمالي الركاب / ملاحظات' : 'Staff / Notes'}</span>
                    <span className="text-base font-black text-slate-800 dark:text-slate-200 mt-1 block">{totalPassengers} {lang === 'ar' ? 'راكب' : 'pass.'} • {notesCount} {lang === 'ar' ? 'ملاحظة' : 'notes'}</span>
                  </div>
                </div>

                {/* Data Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>{lang === 'ar' ? `تفاصيل ورديات الفترة (${currentPeriodTitle}) - ${reportCompany}` : `Shift Logs (${currentPeriodTitle})`}</span>
                    </h4>
                    <span className="text-xs font-mono text-slate-500">{reportLogs.length} {lang === 'ar' ? 'سجل' : 'records'}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3.5">{lang === 'ar' ? 'التاريخ واليوم' : 'Date & Day'}</th>
                          <th className="p-3.5">{lang === 'ar' ? 'اسم الوردية وخط السير' : 'Shift & Route'}</th>
                          <th className="p-3.5">{lang === 'ar' ? 'المواعيد' : 'Time'}</th>
                          <th className="p-3.5">{lang === 'ar' ? 'السائق والمركبة' : 'Driver & Vehicle'}</th>
                          <th className="p-3.5 text-center">{lang === 'ar' ? 'الذهاب' : 'Departure'}</th>
                          <th className="p-3.5 text-center">{lang === 'ar' ? 'العودة' : 'Return'}</th>
                          <th className="p-3.5">{lang === 'ar' ? 'الملاحظات' : 'Notes'}</th>
                          <th className="p-3.5 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {reportLogs.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400">
                              {lang === 'ar' ? 'لا توجد ورديات مسجلة لهذا الشهر والشركة المحددة' : 'No shift logs found.'}
                            </td>
                          </tr>
                        ) : (
                          reportLogs.map((log) => {
                            const dateObj = new Date(log.shiftDate);
                            const dayName = dateObj.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' });
                            return (
                              <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                                <td className="p-3.5 whitespace-nowrap">
                                  <span className="font-mono font-bold text-slate-900 dark:text-white block">{log.shiftDate}</span>
                                  <span className="text-[11px] text-slate-500">{dayName}</span>
                                </td>
                                <td className="p-3.5">
                                  <div className="font-bold text-slate-900 dark:text-white">{log.shiftName || (lang === 'ar' ? 'وردية نقل' : 'Shift')}</div>
                                  <div className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span>{log.fromLocation || 'المقر'} ➜ {log.toLocation || 'الوجهة'}</span>
                                  </div>
                                </td>
                                <td className="p-3.5 whitespace-nowrap font-mono text-xs">
                                  <div><span className="text-slate-400 text-[10px]">{lang === 'ar' ? 'انطلاق:' : 'Dep:'}</span> {log.departureTime}</div>
                                  <div><span className="text-slate-400 text-[10px]">{lang === 'ar' ? 'رجوع:' : 'Ret:'}</span> {log.arrivalTime}</div>
                                </td>
                                <td className="p-3.5">
                                  <div className="font-semibold text-slate-900 dark:text-white">{log.driverName}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">{log.carPlate}</div>
                                </td>
                                <td className="p-3.5 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleDeparture(log)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                                      log.isDepartureDone
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300'
                                    }`}
                                  >
                                    {log.isDepartureDone ? (lang === 'ar' ? 'تم الذهاب ✓' : 'Done ✓') : (lang === 'ar' ? 'تعليم الذهاب' : 'Check')}
                                  </button>
                                </td>
                                <td className="p-3.5 text-center whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleReturn(log)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                                      log.isReturnDone
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300'
                                    }`}
                                  >
                                    {log.isReturnDone ? (lang === 'ar' ? 'تمت العودة ✓' : 'Done ✓') : (lang === 'ar' ? 'تعليم العودة' : 'Check')}
                                  </button>
                                </td>
                                <td className="p-3.5 max-w-[180px]">
                                  {log.notes ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenNoteEditor(log)}
                                      className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded-lg text-xs block text-right truncate w-full border border-amber-200 hover:border-amber-400"
                                    >
                                      💬 {log.notes}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenNoteEditor(log)}
                                      className="text-slate-400 hover:text-blue-600 text-xs italic"
                                    >
                                      + {lang === 'ar' ? 'إضافة ملاحظة' : 'Add Note'}
                                    </button>
                                  )}
                                </td>
                                <td className="p-3.5 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditShift(log)}
                                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg border border-blue-200 dark:border-blue-800 transition"
                                      title={lang === 'ar' ? 'تعديل' : 'Edit'}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            lang === 'ar'
                                              ? `هل أنت متأكد من مسح وردية يوم (${log.shiftDate})؟`
                                              : `Delete shift on ${log.shiftDate}?`
                                          )
                                        ) {
                                          onDeleteShiftLog(log.id);
                                        }
                                      }}
                                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded-lg border border-rose-200 dark:border-rose-800 transition"
                                      title={lang === 'ar' ? 'مسح' : 'Delete'}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>{lang === 'ar' ? 'مسح' : 'Delete'}</span>
                                    </button>
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
            );
          })()}
        </div>
      )}

      {/* Modal: Quick Note Editor for a Shift Day */}
      {editingNoteLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <span>{lang === 'ar' ? 'تسجيل وتعديل ملاحظات الوردية' : 'Edit Shift Note'}</span>
              </h3>
              <button onClick={() => setEditingNoteLog(null)} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveNote} className="p-5 space-y-4">
              <div className="text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div><span className="font-bold text-slate-500">{lang === 'ar' ? 'التاريخ:' : 'Date:'}</span> <strong>{editingNoteLog.shiftDate}</strong></div>
                <div><span className="font-bold text-slate-500">{lang === 'ar' ? 'الشركة:' : 'Company:'}</span> <strong>{editingNoteLog.companyName}</strong></div>
                <div><span className="font-bold text-slate-500">{lang === 'ar' ? 'السائق:' : 'Driver:'}</span> <strong>{editingNoteLog.driverName}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'الملاحظات (تأخير – غياب موظف – عطل في السيارة – توصيل كامل):' : 'Shift Notes:'}
                </label>
                <textarea
                  rows={4}
                  autoFocus
                  value={noteInputText}
                  onChange={(e) => setNoteInputText(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب ملاحظات الوردية هنا...' : 'Enter shift notes...'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingNoteLog(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  {lang === 'ar' ? 'حفظ الملاحظة' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Batch Generate Month Shifts for Active Company & Shift */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ar' ? `تهيئة ورديات شهر (${calendarMonth}) لشركة ${activeCompany}` : `Setup Month Shifts`}</span>
              </h3>
              <button onClick={() => setShowBatchModal(false)} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleExecuteBatchMonth} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'اسم الوردية' : 'Shift Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={batchShiftName}
                  onChange={(e) => setBatchShiftName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'السائق المعين' : 'Driver'} *
                  </label>
                  <select
                    value={batchDriverId}
                    onChange={(e) => setBatchDriverId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'السيارة / الباص' : 'Vehicle'} *
                  </label>
                  <select
                    value={batchCarId}
                    onChange={(e) => setBatchCarId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.plateNumber})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'وقت الانطلاق (الذهاب)' : 'Departure Time'}
                  </label>
                  <input
                    type="time"
                    value={batchDepartureTime}
                    onChange={(e) => setBatchDepartureTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'وقت الرجوع (العودة)' : 'Return Time'}
                  </label>
                  <input
                    type="time"
                    value={batchArrivalTime}
                    onChange={(e) => setBatchArrivalTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'نقطة الانطلاق' : 'From'}
                  </label>
                  <input
                    type="text"
                    value={batchFromLocation}
                    onChange={(e) => setBatchFromLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'وجهة الوصول' : 'To'}
                  </label>
                  <input
                    type="text"
                    value={batchToLocation}
                    onChange={(e) => setBatchToLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'أيام العمل المستهدفة خلال الشهر:' : 'Working Days Scheme:'}
                </label>
                <select
                  value={batchDaysOption}
                  onChange={(e: any) => setBatchDaysOption(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  <option value="workdays_sun_thu">
                    {lang === 'ar' ? 'أيام الدوام الرسمي (من الأحد إلى الخميس - 5 أيام أسبوعياً)' : 'Sunday to Thursday (5 days/wk)'}
                  </option>
                  <option value="workdays_all_week">
                    {lang === 'ar' ? 'طوال أيام الأسبوع بالكامل (7 أيام أسبوعياً)' : 'All 7 days a week'}
                  </option>
                  <option value="workdays_mon_fri">
                    {lang === 'ar' ? 'من الإثنين إلى الجمعة (5 أيام أسبوعياً)' : 'Monday to Friday'}
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  {lang === 'ar' ? '⚡ إنشاء وتوليد ورديات الشهر الآن' : 'Generate Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Single Shift Entry / Edit */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {editingShiftId
                  ? (lang === 'ar' ? 'تعديل بيانات الوردية' : 'Edit Shift')
                  : (lang === 'ar' ? `تسجيل وردية يوم (${shiftDate}) - ${activeCompany}` : 'New Shift Entry')}
              </h3>
              <button onClick={() => setShowShiftModal(false)} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveShift} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? '🏢 الشركة / الجهة المستفيدة:' : 'Client Company:'} *
                </label>
                <select
                  required
                  value={modalCompanyName}
                  onChange={(e) => {
                    const newComp = e.target.value;
                    setModalCompanyName(newComp);
                    applyCompanyDefaultsToModal(newComp);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  {allCompanyNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'تاريخ الوردية' : 'Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'اسم الوردية' : 'Shift Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalShiftName}
                    onChange={(e) => setModalShiftName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'السائق المعين' : 'Driver'} *
                  </label>
                  <select
                    value={modalDriverId}
                    onChange={(e) => setModalDriverId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'السيارة ورقم اللوحة' : 'Vehicle'} *
                  </label>
                  <select
                    value={modalCarId}
                    onChange={(e) => setModalCarId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.plateNumber})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'وقت الانطلاق (الذهاب)' : 'Departure Time'}
                  </label>
                  <input
                    type="time"
                    value={modalDepartureTime}
                    onChange={(e) => setModalDepartureTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'وقت الرجوع (العودة)' : 'Return Time'}
                  </label>
                  <input
                    type="time"
                    value={modalArrivalTime}
                    onChange={(e) => setModalArrivalTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? '🚩 نقطة الانطلاق (البداية)' : 'Start Point (Origin)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalFromLocation}
                    onChange={(e) => setModalFromLocation(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: حي الملز، المعادي...' : 'Origin location'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? '🏁 نقطة الوصول (النهاية)' : 'End Point (Destination)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalToLocation}
                    onChange={(e) => setModalToLocation(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: مقر الشركة، القرية الذكية...' : 'Destination'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/60 dark:border-blue-900/60">
                <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200">
                  {lang === 'ar' ? 'خط السير الحالي:' : 'Current Route:'} {modalFromLocation} ➜ {modalToLocation}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (modalFromLocation && modalToLocation) {
                      const period = modalDepartureTime <= '11:00' ? 'صباحية' : modalDepartureTime <= '18:00' ? 'مسائية' : 'ليلية';
                      setModalShiftName(`خط: ${modalFromLocation} ➜ ${modalToLocation} (${period})`);
                    }
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10.5px] font-bold transition flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'تسمية الوردية بخط السير' : 'Name Shift by Route'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalDepartureDone}
                    onChange={(e) => setModalDepartureDone(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                    {lang === 'ar' ? '✓ تم إنجاز رحلة الذهاب' : 'Departure Done'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalReturnDone}
                    onChange={(e) => setModalReturnDone(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-xs font-black text-purple-800 dark:text-purple-300">
                    {lang === 'ar' ? '✓ تمت إنجاز رحلة العودة' : 'Return Done'}
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'ملاحظات الوردية' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: تأخير 10 دقائق، غياب 2 موظفين...' : 'Notes...'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  {lang === 'ar' ? 'حفظ الوردية' : 'Save Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Corporate B2B Contract Form */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden my-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {editingContractId
                  ? (lang === 'ar' ? 'تعديل عقد الشركة' : 'Edit Corporate Contract')
                  : (lang === 'ar' ? 'إنشاء عقد نقل أسطول شركات جديد' : 'New Corporate Contract')}
              </h3>
              <button onClick={() => setShowContractModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSaveCorporateContract} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="text-xs font-black text-blue-600 dark:text-blue-400 border-b border-slate-200 dark:border-slate-800 pb-1">
                {lang === 'ar' ? 'أولاً: بيانات الشركة / المؤسسة' : '1. Company Details'}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'اسم الشركة / المؤسسة' : 'Company Name'} *</label>
                <input
                  type="text"
                  required
                  value={corpCompanyName}
                  onChange={(e) => setCorpCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'الرقم الضريبي' : 'Tax ID'}</label>
                  <input
                    type="text"
                    value={corpTaxId}
                    onChange={(e) => setCorpTaxId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'السجل التجاري' : 'CR No'}</label>
                  <input
                    type="text"
                    value={corpCompanyCR}
                    onChange={(e) => setCorpCompanyCR(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'هاتف التواصل' : 'Phone'} *</label>
                  <input
                    type="text"
                    required
                    value={corpPhone}
                    onChange={(e) => setCorpPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'مسؤول الاتصال' : 'Contact Person'} *</label>
                  <input
                    type="text"
                    required
                    value={corpContactPerson}
                    onChange={(e) => setCorpContactPerson(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'القيمة الشهرية' : 'Monthly Fee'} *</label>
                  <input
                    type="number"
                    required
                    value={corpMonthlyPrice}
                    onChange={(e) => setCorpMonthlyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'عدد السيارات' : 'Fleet Size'}</label>
                  <input
                    type="number"
                    min="1"
                    value={corpFleetSize}
                    onChange={(e) => setCorpFleetSize(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'عدد الموظفين' : 'Staff Count'}</label>
                  <input
                    type="number"
                    min="1"
                    value={corpEmployeeCount}
                    onChange={(e) => setCorpEmployeeCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-500">
                  {lang === 'ar' ? (editingContractId ? 'تعديل وحفظ العقد' : 'حفظ عقد الشركة') : 'Save Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Official B2B Contract Modal */}
      <PrintCorporateContractModal
        isOpen={isPrintCorporateContractModalOpen}
        onClose={() => {
          setIsPrintCorporateContractModalOpen(false);
          setSelectedCorporateContractForPrint(null);
        }}
        contract={selectedCorporateContractForPrint}
        settings={settings}
        lang={lang}
      />

      {/* Print Monthly Shifts & Commute Report Modal */}
      <PrintShiftMonthlyReportModal
        isOpen={isPrintShiftMonthlyReportModalOpen}
        onClose={() => setIsPrintShiftMonthlyReportModalOpen(false)}
        shiftLogs={shiftLogs}
        companyName={reportCompany}
        startDate={reportStartDate}
        endDate={reportEndDate}
        month={reportMonth}
        selectedShiftRoute={reportRoute}
        settings={settings}
        lang={lang}
      />
    </div>
  );
};
