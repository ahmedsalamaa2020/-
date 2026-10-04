import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  UserCheck,
  Star,
  Phone,
  Shield,
  MapPin,
  Calendar,
  Trash2,
  Edit,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Coffee,
  Briefcase,
  Users,
  Printer,
  Sparkles,
  Calculator,
  Download,
  Filter,
  CheckSquare,
  FileSpreadsheet,
} from 'lucide-react';
import { Driver, DriverStatus, DriverAttendance, AttendanceStatus, AppSettings, Language } from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { triggerBrowserPrint } from '../utils/pdfExport';

interface DriverModuleProps {
  drivers: Driver[];
  attendances?: DriverAttendance[];
  onAddDriver: (driver: Driver) => void;
  onUpdateDriver: (driver: Driver) => void;
  onDeleteDriver: (id: string) => void;
  onAddAttendance?: (att: DriverAttendance) => void;
  onUpdateAttendance?: (att: DriverAttendance) => void;
  onDeleteAttendance?: (id: string) => void;
  onBatchAddAttendance?: (atts: DriverAttendance[]) => void;
  settings?: AppSettings;
  lang: Language;
  selectedDriverId?: string;
  onClearTarget?: () => void;
}

export const DriverModule: React.FC<DriverModuleProps> = ({
  drivers,
  attendances = [],
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
  onAddAttendance,
  onUpdateAttendance,
  onDeleteAttendance,
  onBatchAddAttendance,
  settings,
  lang,
  selectedDriverId,
  onClearTarget,
}) => {
  const t = translations[lang];

  // Active Tab
  const [activeTab, setActiveTab] = useState<'roster' | 'attendance' | 'monthly_summary'>('roster');

  // Drivers Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  useEffect(() => {
    if (selectedDriverId) {
      const found = drivers.find((d) => d.id === selectedDriverId);
      if (found) {
        setActiveTab('roster');
        setSearchTerm(found.name);
        setStatusFilter('all');
      }
    }
  }, [selectedDriverId, drivers]);

  // Driver Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [role, setRole] = useState<'driver' | 'receptionist' | 'mechanic' | 'shift_manager' | 'admin'>('driver');
  const [baseSalary, setBaseSalary] = useState<number>(3500);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<DriverStatus>('available');
  const [rating, setRating] = useState<number>(5.0);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Attendance State
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM e.g. "2026-08"
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  );
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [attStatusFilter, setAttStatusFilter] = useState<string>('all');

  // Attendance Record Modal
  const [isAttModalOpen, setIsAttModalOpen] = useState(false);
  const [editingAtt, setEditingAtt] = useState<DriverAttendance | null>(null);
  const [attDriverId, setAttDriverId] = useState<string>('');
  const [attDate, setAttDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [attCheckIn, setAttCheckIn] = useState<string>('08:00');
  const [attCheckOut, setAttCheckOut] = useState<string>('16:30');
  const [attStatus, setAttStatus] = useState<AttendanceStatus>('present');
  const [attWorkHours, setAttWorkHours] = useState<number>(8.5);
  const [attOvertime, setAttOvertime] = useState<number>(0.5);
  const [attNotes, setAttNotes] = useState<string>('');

  // Batch Check-in Modal
  const [isBatchAttModalOpen, setIsBatchAttModalOpen] = useState(false);
  const [batchDate, setBatchDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [batchCheckIn, setBatchCheckIn] = useState<string>('08:00');
  const [batchCheckOut, setBatchCheckOut] = useState<string>('16:30');
  const [batchDefaultStatus, setBatchDefaultStatus] = useState<AttendanceStatus>('present');
  const [batchSelectedDriverIds, setBatchSelectedDriverIds] = useState<string[]>(
    drivers.map((d) => d.id)
  );

  // Auto calculate work hours when check-in/out changes
  const calcHours = (inTime: string, outTime: string) => {
    if (!inTime || !outTime) return { work: 8, ot: 0 };
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    let totalMins = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMins < 0) totalMins += 24 * 60; // next day
    const hours = Math.round((totalMins / 60) * 10) / 10;
    const baseStandard = 8.0;
    const ot = hours > baseStandard ? Math.round((hours - baseStandard) * 10) / 10 : 0;
    return { work: hours, ot };
  };

  const handleCheckInOutChange = (newIn: string, newOut: string) => {
    setAttCheckIn(newIn);
    setAttCheckOut(newOut);
    const { work, ot } = calcHours(newIn, newOut);
    setAttWorkHours(work);
    setAttOvertime(ot);
  };

  // Drivers Handlers
  const openAddModal = () => {
    setEditingDriver(null);
    setName('');
    setPhone('');
    setNationalId('');
    setRole('driver');
    setBaseSalary(3500);
    setLicenseNumber('');
    setLicenseExpiry('2028-12-31');
    setAddress('');
    setStatus('available');
    setRating(5.0);
    setNotes('');
    setPhotoUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (drv: Driver) => {
    setEditingDriver(drv);
    setName(drv.name);
    setPhone(drv.phone);
    setNationalId(drv.nationalId || '');
    setRole(drv.role || 'driver');
    setBaseSalary(drv.baseSalary || 3500);
    setLicenseNumber(drv.licenseNumber);
    setLicenseExpiry(drv.licenseExpiry);
    setAddress(drv.address || '');
    setStatus(drv.status);
    setRating(drv.rating || 5.0);
    setNotes(drv.notes || '');
    setPhotoUrl(drv.photoUrl || '');
    setIsModalOpen(true);
  };

  const handleSubmitDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !licenseNumber) return;

    if (editingDriver) {
      onUpdateDriver({
        ...editingDriver,
        name,
        phone,
        nationalId,
        role,
        baseSalary,
        licenseNumber,
        licenseExpiry,
        address,
        status,
        rating,
        notes,
        photoUrl,
      });
    } else {
      const newDriver: Driver = {
        id: `drv_${Date.now()}`,
        name,
        phone,
        nationalId,
        role,
        baseSalary,
        licenseNumber,
        licenseExpiry,
        address,
        status,
        rating,
        notes,
        totalTrips: 0,
        photoUrl:
          photoUrl ||
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      };
      onAddDriver(newDriver);
    }
    setIsModalOpen(false);
  };

  // Attendance Handlers
  const openAddAttModal = (defaultDate?: string, defaultDrvId?: string) => {
    setEditingAtt(null);
    setAttDriverId(defaultDrvId || (drivers[0]?.id ?? ''));
    setAttDate(defaultDate || selectedDate);
    setAttCheckIn('08:00');
    setAttCheckOut('16:30');
    setAttStatus('present');
    setAttWorkHours(8.5);
    setAttOvertime(0.5);
    setAttNotes('');
    setIsAttModalOpen(true);
  };

  const openEditAttModal = (att: DriverAttendance) => {
    setEditingAtt(att);
    setAttDriverId(att.driverId);
    setAttDate(att.date);
    setAttCheckIn(att.checkIn || '08:00');
    setAttCheckOut(att.checkOut || '16:30');
    setAttStatus(att.status);
    setAttWorkHours(att.workHours ?? 8.5);
    setAttOvertime(att.overtimeHours ?? 0.5);
    setAttNotes(att.notes || '');
    setIsAttModalOpen(true);
  };

  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const drv = drivers.find((d) => d.id === attDriverId);
    if (!drv) return;

    const record: DriverAttendance = {
      id: editingAtt?.id || `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      driverId: drv.id,
      driverName: drv.name,
      date: attDate,
      checkIn: attStatus === 'absent' || attStatus === 'leave' ? undefined : attCheckIn,
      checkOut: attStatus === 'absent' || attStatus === 'leave' ? undefined : attCheckOut,
      status: attStatus,
      workHours: attStatus === 'absent' || attStatus === 'leave' ? 0 : attWorkHours,
      overtimeHours: attStatus === 'absent' || attStatus === 'leave' ? 0 : attOvertime,
      notes: attNotes,
      recordedBy: 'admin',
      createdAt: editingAtt?.createdAt || new Date().toISOString().slice(0, 10),
    };

    if (editingAtt && onUpdateAttendance) {
      onUpdateAttendance(record);
    } else if (onAddAttendance) {
      onAddAttendance(record);
    }
    setIsAttModalOpen(false);
  };

  // Quick Daily Check-in / Out for a Driver
  const handleQuickMarkStatus = (drv: Driver, stat: AttendanceStatus, customNotes?: string) => {
    const existing = attendances.find(
      (a) => a.driverId === drv.id && a.date === selectedDate
    );

    const record: DriverAttendance = {
      id: existing?.id || `att_${Date.now()}_${drv.id}`,
      driverId: drv.id,
      driverName: drv.name,
      date: selectedDate,
      checkIn: stat === 'absent' || stat === 'leave' ? undefined : '08:00',
      checkOut: stat === 'absent' || stat === 'leave' ? undefined : '16:30',
      status: stat,
      workHours: stat === 'absent' || stat === 'leave' ? 0 : 8.5,
      overtimeHours: stat === 'absent' || stat === 'leave' ? 0 : 0.5,
      notes: customNotes || existing?.notes || (stat === 'late' ? 'تسجيل تأخير صباحي' : ''),
      recordedBy: 'admin',
      createdAt: existing?.createdAt || new Date().toISOString().slice(0, 10),
    };

    if (existing && onUpdateAttendance) {
      onUpdateAttendance(record);
    } else if (onAddAttendance) {
      onAddAttendance(record);
    }
  };

  // Batch Check-in
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchSelectedDriverIds.length === 0) return;

    const newAtts: DriverAttendance[] = batchSelectedDriverIds.map((drvId) => {
      const drv = drivers.find((d) => d.id === drvId);
      const { work, ot } = calcHours(batchCheckIn, batchCheckOut);
      return {
        id: `att_${Date.now()}_${drvId}`,
        driverId: drvId,
        driverName: drv?.name || 'سائق',
        date: batchDate,
        checkIn: batchDefaultStatus === 'absent' || batchDefaultStatus === 'leave' ? undefined : batchCheckIn,
        checkOut: batchDefaultStatus === 'absent' || batchDefaultStatus === 'leave' ? undefined : batchCheckOut,
        status: batchDefaultStatus,
        workHours: batchDefaultStatus === 'absent' || batchDefaultStatus === 'leave' ? 0 : work,
        overtimeHours: batchDefaultStatus === 'absent' || batchDefaultStatus === 'leave' ? 0 : ot,
        notes: 'تسجيل حضور جماعي تلقائي',
        recordedBy: 'admin',
        createdAt: batchDate,
      };
    });

    if (onBatchAddAttendance) {
      onBatchAddAttendance(newAtts);
    } else if (onAddAttendance) {
      newAtts.forEach((a) => onAddAttendance(a));
    }

    setIsBatchAttModalOpen(false);
  };

  // Filtered Lists
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      d.licenseNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Monthly Attendance Data & Computations
  const monthlyAttendances = useMemo(() => {
    return attendances.filter((a) => a.date.startsWith(selectedMonth));
  }, [attendances, selectedMonth]);

  const filteredAttendances = useMemo(() => {
    return monthlyAttendances.filter((a) => {
      const matchesDriver = driverFilter === 'all' || a.driverId === driverFilter;
      const matchesStatus = attStatusFilter === 'all' || a.status === attStatusFilter;
      return matchesDriver && matchesStatus;
    });
  }, [monthlyAttendances, driverFilter, attStatusFilter]);

  // Monthly Calculations Per Driver
  const driverMonthlySummaries = useMemo(() => {
    const [yr, mo] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(yr, mo, 0).getDate();

    return drivers.map((drv) => {
      const drvLogs = monthlyAttendances.filter((a) => a.driverId === drv.id);
      const presentDays = drvLogs.filter((a) => a.status === 'present').length;
      const lateDays = drvLogs.filter((a) => a.status === 'late').length;
      const onDutyDays = drvLogs.filter((a) => a.status === 'on_duty_trip').length;
      const totalAttendedDays = presentDays + lateDays + onDutyDays;
      const absentDays = drvLogs.filter((a) => a.status === 'absent').length;
      const leaveDays = drvLogs.filter((a) => a.status === 'leave').length;

      const totalWorkHours = drvLogs.reduce((acc, a) => acc + (a.workHours || 0), 0);
      const totalOvertime = drvLogs.reduce((acc, a) => acc + (a.overtimeHours || 0), 0);

      // Estimated standard working days in month (approx 26 days or recorded logs)
      const recordedDaysCount = drvLogs.length;
      const attendanceRate =
        recordedDaysCount > 0
          ? Math.min(100, Math.round((totalAttendedDays / recordedDaysCount) * 100))
          : 0;

      return {
        driver: drv,
        totalAttendedDays,
        presentDays,
        lateDays,
        onDutyDays,
        absentDays,
        leaveDays,
        totalWorkHours: Math.round(totalWorkHours * 10) / 10,
        totalOvertime: Math.round(totalOvertime * 10) / 10,
        attendanceRate,
        daysInMonth,
        logs: drvLogs,
      };
    });
  }, [drivers, monthlyAttendances, selectedMonth]);

  // Overall Totals for Month
  const overallMonthTotals = useMemo(() => {
    const totalPresent = monthlyAttendances.filter((a) => a.status === 'present').length;
    const totalLate = monthlyAttendances.filter((a) => a.status === 'late').length;
    const totalAbsent = monthlyAttendances.filter((a) => a.status === 'absent').length;
    const totalLeaves = monthlyAttendances.filter((a) => a.status === 'leave').length;
    const totalOnDuty = monthlyAttendances.filter((a) => a.status === 'on_duty_trip').length;
    const totalAttended = totalPresent + totalLate + totalOnDuty;
    const totalHours = monthlyAttendances.reduce((acc, a) => acc + (a.workHours || 0), 0);
    const totalOvertime = monthlyAttendances.reduce((acc, a) => acc + (a.overtimeHours || 0), 0);

    return {
      totalAttended,
      totalPresent,
      totalLate,
      totalAbsent,
      totalLeaves,
      totalOnDuty,
      totalHours: Math.round(totalHours * 10) / 10,
      totalOvertime: Math.round(totalOvertime * 10) / 10,
    };
  }, [monthlyAttendances]);

  // Status Badge UI
  const getStatusBadge = (st: DriverStatus) => {
    switch (st) {
      case 'available':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-full border border-emerald-300 dark:border-emerald-800">
            {t.availableDriver}
          </span>
        );
      case 'on_trip':
        return (
          <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-xs rounded-full border border-blue-300 dark:border-blue-800">
            {t.onTrip}
          </span>
        );
      case 'off_duty':
        return (
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-full border border-slate-300 dark:border-slate-700">
            {t.offDuty}
          </span>
        );
      case 'on_leave':
        return (
          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-full border border-amber-300 dark:border-amber-800">
            {lang === 'ar' ? 'في إجازة' : 'On Leave'}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-full">
            {st}
          </span>
        );
    }
  };

  const getAttendanceStatusBadge = (st: AttendanceStatus) => {
    switch (st) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-full border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'ar' ? 'حاضر' : 'Present'}</span>
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-full border border-amber-300 dark:border-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{lang === 'ar' ? 'متأخر' : 'Late'}</span>
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-xs rounded-full border border-rose-300 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>{lang === 'ar' ? 'غائب' : 'Absent'}</span>
          </span>
        );
      case 'leave':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-xs rounded-full border border-blue-300 dark:border-blue-800">
            <Coffee className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{lang === 'ar' ? 'إجازة' : 'Leave'}</span>
          </span>
        );
      case 'on_duty_trip':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold text-xs rounded-full border border-purple-300 dark:border-purple-800">
            <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>{lang === 'ar' ? 'مهمة عمل / في رحلة' : 'On Trip / Duty'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            <span>
              {lang === 'ar'
                ? 'إدارة السائقين وتسجيل الحضور والانصراف'
                : 'Driver Management & Daily Attendance'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar'
              ? 'متابعة بيانات السائقين، تسجيل الحضور والانصراف اليومي، وحساب إجمالي أيام وساعات الحضور خلال الشهر'
              : 'Driver roster, daily clock-in/out tracking, and monthly attendance day calculation'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'roster' && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addDriver}</span>
            </button>
          )}

          {activeTab === 'attendance' && (
            <>
              <button
                onClick={() => setIsBatchAttModalOpen(true)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{lang === 'ar' ? '⚡ تسجيل حضور جماعي' : '⚡ Batch Check-in'}</span>
              </button>

              <button
                onClick={() => openAddAttModal()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تسجيل حضور سائق' : 'Log Attendance'}</span>
              </button>
            </>
          )}

          {activeTab === 'monthly_summary' && (
            <button
              onClick={() => triggerBrowserPrint('printable-driver-attendance-summary')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة كشف الشهر' : 'Print Monthly Sheet'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'roster'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{lang === 'ar' ? 'قائمة السائقين والموظفين' : 'Driver & Staff Roster'}</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{lang === 'ar' ? 'سجل الحضور والانصراف اليومي' : 'Daily Attendance Register'}</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly_summary')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'monthly_summary'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>{lang === 'ar' ? 'حساب عدد أيام الحضور وساعات الشهر' : 'Monthly Attendance & Payroll Totals'}</span>
        </button>
      </div>

      {/* TAB 1: DRIVER ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-5">
          {/* Filter Bar */}
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
              <option value="available">{t.availableDriver}</option>
              <option value="on_trip">{t.onTrip}</option>
              <option value="off_duty">{t.offDuty}</option>
              <option value="on_leave">{lang === 'ar' ? 'في إجازة' : 'On Leave'}</option>
            </select>
          </div>

          {/* Drivers Roster Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDrivers.map((drv) => {
              // Get today's attendance for this driver
              const todayAtt = attendances.find(
                (a) => a.driverId === drv.id && a.date === selectedDate
              );
              // Get month's attended days
              const drvMonthSummary = driverMonthlySummaries.find((s) => s.driver.id === drv.id);

              return (
                <div
                  key={drv.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={drv.photoUrl}
                          alt={drv.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-xs"
                        />
                        <div>
                          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                            {drv.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            {getStatusBadge(drv.status)}
                            <span className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                              <span>{drv.rating}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(drv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title={t.edit}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteDriver(drv.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title={t.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{drv.phone}</span>
                      </div>
                      {drv.nationalId && (
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {lang === 'ar' ? 'الهوية / الإقامة:' : 'National ID:'} {drv.nationalId}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {t.licenseNumber}: {drv.licenseNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {t.licenseExpiry}: {drv.licenseExpiry}
                        </span>
                      </div>
                    </div>

                    {/* Monthly Attendance Quick Metric Box */}
                    <div className="mt-3.5 p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-xl">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200 mb-1">
                        <span>{lang === 'ar' ? 'حضور هذا الشهر:' : 'This Month Attendance:'}</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          {drvMonthSummary?.totalAttendedDays || 0} {lang === 'ar' ? 'يوم' : 'days'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                        <span>{lang === 'ar' ? 'ساعات العمل:' : 'Hours:'} {drvMonthSummary?.totalWorkHours || 0}h</span>
                        <span>{lang === 'ar' ? 'تأخير:' : 'Late:'} {drvMonthSummary?.lateDays || 0}</span>
                        <span>{lang === 'ar' ? 'غياب:' : 'Absent:'} {drvMonthSummary?.absentDays || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Today Attendance Action Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">{lang === 'ar' ? 'حالة اليوم:' : 'Today:'}</span>
                      {todayAtt ? (
                        getAttendanceStatusBadge(todayAtt.status)
                      ) : (
                        <span className="text-amber-500 font-bold text-[11px]">{lang === 'ar' ? 'لم يسجل بعد' : 'Not recorded'}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => handleQuickMarkStatus(drv, 'present')}
                        className="p-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[10px] font-bold text-center transition"
                      >
                        ✓ {lang === 'ar' ? 'حاضر' : 'Present'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickMarkStatus(drv, 'late')}
                        className="p-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[10px] font-bold text-center transition"
                      >
                        ⏱ {lang === 'ar' ? 'متأخر' : 'Late'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickMarkStatus(drv, 'absent')}
                        className="p-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[10px] font-bold text-center transition"
                      >
                        ✕ {lang === 'ar' ? 'غائب' : 'Absent'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openAddAttModal(selectedDate, drv.id)}
                        className="p-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[10px] font-bold text-center transition"
                      >
                        + {lang === 'ar' ? 'تفاصيل' : 'Details'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DAILY ATTENDANCE REGISTER */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{lang === 'ar' ? 'التاريخ المحدد:' : 'Date:'}</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    if (e.target.value) {
                      setSelectedMonth(e.target.value.slice(0, 7));
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-900 dark:text-white"
                />
              </div>

              {/* Driver Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{lang === 'ar' ? 'السائق:' : 'Driver:'}</span>
                <select
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="all">{lang === 'ar' ? 'جميع السائقين' : 'All Drivers'}</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{lang === 'ar' ? 'الحالة:' : 'Status:'}</span>
                <select
                  value={attStatusFilter}
                  onChange={(e) => setAttStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="all">{lang === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
                  <option value="present">{lang === 'ar' ? 'حاضر' : 'Present'}</option>
                  <option value="late">{lang === 'ar' ? 'متأخر' : 'Late'}</option>
                  <option value="absent">{lang === 'ar' ? 'غائب' : 'Absent'}</option>
                  <option value="leave">{lang === 'ar' ? 'إجازة' : 'Leave'}</option>
                  <option value="on_duty_trip">{lang === 'ar' ? 'مهمة عمل / في رحلة' : 'On Duty'}</option>
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBatchAttModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تحضير الجميع اليوم' : 'Check-in All Today'}</span>
              </button>
            </div>
          </div>

          {/* Today's Quick Status Grid */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {lang === 'ar'
                    ? `لوحة تحضير السائقين ليوم (${selectedDate}):`
                    : `Daily Attendance Board (${selectedDate}):`}
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'انقر على الأزرار السريعة لتحديث حالة الحضور فورياً'
                  : 'Click quick status buttons for instant update'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {drivers.map((drv) => {
                const dayAtt = attendances.find(
                  (a) => a.driverId === drv.id && a.date === selectedDate
                );

                return (
                  <div
                    key={drv.id}
                    className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                      dayAtt?.status === 'present'
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                        : dayAtt?.status === 'late'
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                        : dayAtt?.status === 'absent'
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                        : dayAtt?.status === 'leave'
                        ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40'
                        : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={drv.photoUrl}
                          alt={drv.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {drv.name}
                          </h4>
                          <span className="text-[10.5px] text-slate-500 truncate block">
                            {drv.phone}
                          </span>
                        </div>
                      </div>

                      {dayAtt ? (
                        getAttendanceStatusBadge(dayAtt.status)
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-bold">
                          {lang === 'ar' ? 'لم يُسجّل' : 'Pending'}
                        </span>
                      )}
                    </div>

                    {dayAtt && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mb-2 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                        <span>
                          {lang === 'ar' ? 'حضور:' : 'In:'} <strong className="font-mono text-slate-800 dark:text-slate-100">{dayAtt.checkIn || '—'}</strong>
                        </span>
                        <span>
                          {lang === 'ar' ? 'انصراف:' : 'Out:'} <strong className="font-mono text-slate-800 dark:text-slate-100">{dayAtt.checkOut || '—'}</strong>
                        </span>
                        <span>
                          {lang === 'ar' ? 'ساعات:' : 'Hrs:'} <strong className="font-mono text-blue-600 dark:text-blue-400">{dayAtt.workHours || 0}h</strong>
                        </span>
                      </div>
                    )}

                    {dayAtt?.notes && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-md mb-2 truncate" title={dayAtt.notes}>
                        💬 {dayAtt.notes}
                      </p>
                    )}

                    {/* Quick Toggle Buttons */}
                    <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => handleQuickMarkStatus(drv, 'present')}
                        className={`p-1.5 rounded-lg text-[10px] font-bold text-center transition ${
                          dayAtt?.status === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                        }`}
                      >
                        ✓ {lang === 'ar' ? 'حاضر' : 'Present'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickMarkStatus(drv, 'late')}
                        className={`p-1.5 rounded-lg text-[10px] font-bold text-center transition ${
                          dayAtt?.status === 'late'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                        }`}
                      >
                        ⏱ {lang === 'ar' ? 'متأخر' : 'Late'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickMarkStatus(drv, 'absent')}
                        className={`p-1.5 rounded-lg text-[10px] font-bold text-center transition ${
                          dayAtt?.status === 'absent'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 hover:bg-rose-200'
                        }`}
                      >
                        ✕ {lang === 'ar' ? 'غائب' : 'Absent'}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditAttModal(dayAtt || {
                          id: '',
                          driverId: drv.id,
                          driverName: drv.name,
                          date: selectedDate,
                          status: 'present',
                          createdAt: selectedDate,
                        })}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold text-center transition"
                      >
                        {dayAtt ? (lang === 'ar' ? 'تعديل' : 'Edit') : (lang === 'ar' ? '+ وقت' : '+ Time')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Attendance Logs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>
                  {lang === 'ar'
                    ? `سجل الحضور والانصراف لشهر (${selectedMonth}) — إجمالي (${filteredAttendances.length} حركة مسجلة):`
                    : `Attendance Logs for (${selectedMonth}) — (${filteredAttendances.length} records):`}
                </span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th className="p-3">{t.driverName}</th>
                    <th className="p-3">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="p-3">{lang === 'ar' ? 'وقت الحضور' : 'Check In'}</th>
                    <th className="p-3">{lang === 'ar' ? 'وقت الانصراف' : 'Check Out'}</th>
                    <th className="p-3">{lang === 'ar' ? 'ساعات العمل' : 'Hours'}</th>
                    <th className="p-3">{lang === 'ar' ? 'الإضافي' : 'Overtime'}</th>
                    <th className="p-3">{lang === 'ar' ? 'الملاحظات' : 'Notes'}</th>
                    <th className="p-3 text-center">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredAttendances.length > 0 ? (
                    filteredAttendances.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {att.date}
                        </td>
                        <td className="p-3 font-extrabold">{att.driverName}</td>
                        <td className="p-3">{getAttendanceStatusBadge(att.status)}</td>
                        <td className="p-3 font-mono font-semibold">{att.checkIn || '—'}</td>
                        <td className="p-3 font-mono font-semibold">{att.checkOut || '—'}</td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                          {att.workHours ?? 0} {lang === 'ar' ? 'س' : 'hrs'}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {att.overtimeHours ? `+${att.overtimeHours} س` : '—'}
                        </td>
                        <td className="p-3 max-w-[200px] truncate text-slate-500" title={att.notes}>
                          {att.notes || '—'}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditAttModal(att)}
                              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title={t.edit}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteAttendance && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(lang === 'ar' ? 'هل تريد حذف هذا السجل؟' : 'Delete record?')) {
                                    onDeleteAttendance(att.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title={t.delete}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                        {lang === 'ar' ? 'لا توجد سجلات حضور مسجلة لهذا الفلتر' : 'No attendance logs found for this filter'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MONTHLY ATTENDANCE SUMMARY & PAYROLL CALCULATION (حساب عدد أيام الحضور خلال الشهر) */}
      {activeTab === 'monthly_summary' && (
        <div className="space-y-6" id="printable-driver-attendance-summary">
          {/* Header Bar with Month Picker & Print */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs print:border-none print:shadow-none">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <span>{lang === 'ar' ? 'كشف وحسابات أيام الحضور الشهرية للسائقين والموظفين' : 'Driver Monthly Attendance & Days Count'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'ar'
                  ? 'حساب تلقائي لعدد أيام الحضور الفعلي، الغياب، التأخير، ساعات العمل وساعات الإضافي خلال الشهر'
                  : 'Automatic calculations of present days, absences, late days, working hours and overtime'}
              </p>
            </div>

            <div className="flex items-center gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{lang === 'ar' ? 'شهر الحساب:' : 'Month:'}</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={() => triggerBrowserPrint('printable-driver-attendance-summary')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'ar' ? 'طباعة الكشف الرسمي' : 'Print Official Sheet'}</span>
              </button>
            </div>
          </div>

          {/* Monthly Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-6">
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm">
              <span className="block text-[11px] font-bold text-slate-400 mb-1">
                {lang === 'ar' ? 'إجمالي أيام الحضور' : 'Total Days Present'}
              </span>
              <div className="text-2xl font-black text-emerald-400">
                {overallMonthTotals.totalAttended} <span className="text-xs font-normal text-slate-400">{lang === 'ar' ? 'يوم' : 'days'}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {lang === 'ar' ? 'لجميع السائقين' : 'Across all drivers'}
              </span>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
              <span className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                {lang === 'ar' ? 'حضور في الموعد' : 'On-Time Present'}
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {overallMonthTotals.totalPresent}
              </div>
              <span className="text-[10px] text-emerald-600/80 mt-1 block font-bold">
                ✓ {lang === 'ar' ? 'بدون تأخير' : 'Without delay'}
              </span>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded-2xl border border-amber-200 dark:border-amber-800/60 shadow-xs">
              <span className="block text-[11px] font-bold text-amber-700 dark:text-amber-300 mb-1">
                {lang === 'ar' ? 'أيام التأخير' : 'Late Days'}
              </span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {overallMonthTotals.totalLate}
              </div>
              <span className="text-[10px] text-amber-600/80 mt-1 block font-bold">
                ⏱ {lang === 'ar' ? 'تأخير صباحي' : 'Morning delay'}
              </span>
            </div>

            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 rounded-2xl border border-rose-200 dark:border-rose-800/60 shadow-xs">
              <span className="block text-[11px] font-bold text-rose-700 dark:text-rose-300 mb-1">
                {lang === 'ar' ? 'أيام الغياب' : 'Absent Days'}
              </span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {overallMonthTotals.totalAbsent}
              </div>
              <span className="text-[10px] text-rose-600/80 mt-1 block font-bold">
                ✕ {lang === 'ar' ? 'غياب بدون عذر' : 'Unexcused'}
              </span>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 rounded-2xl border border-blue-200 dark:border-blue-800/60 shadow-xs">
              <span className="block text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-1">
                {lang === 'ar' ? 'إجمالي الساعات' : 'Total Hours'}
              </span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {overallMonthTotals.totalHours} <span className="text-xs font-normal">{lang === 'ar' ? 'س' : 'h'}</span>
              </div>
              <span className="text-[10px] text-blue-600/80 mt-1 block font-bold">
                {lang === 'ar' ? 'ساعات العمل الفعلية' : 'Worked hours'}
              </span>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 rounded-2xl border border-purple-200 dark:border-purple-800/60 shadow-xs">
              <span className="block text-[11px] font-bold text-purple-700 dark:text-purple-300 mb-1">
                {lang === 'ar' ? 'ساعات الإضافي' : 'Overtime Hours'}
              </span>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                +{overallMonthTotals.totalOvertime} <span className="text-xs font-normal">{lang === 'ar' ? 'س' : 'h'}</span>
              </div>
              <span className="text-[10px] text-purple-600/80 mt-1 block font-bold">
                ⭐ {lang === 'ar' ? 'ساعات إضافية' : 'Extra hours'}
              </span>
            </div>
          </div>

          {/* Master Monthly Summary Table Per Driver */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {lang === 'ar'
                    ? `جدول الحضور الفعلي وحساب عدد الأيام لكل سائق (${selectedMonth}):`
                    : `Driver Attendance Day Calculation Table (${selectedMonth}):`}
                </h3>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {settings?.organizationName || settings?.appName || 'AutoFleet Management'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3.5">#</th>
                    <th className="p-3.5">{t.driverName}</th>
                    <th className="p-3.5">{t.phone}</th>
                    <th className="p-3.5 text-center bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                      {lang === 'ar' ? 'أيام الحضور الفعلي' : 'Days Present'}
                    </th>
                    <th className="p-3.5 text-center bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
                      {lang === 'ar' ? 'أيام التأخير' : 'Late Days'}
                    </th>
                    <th className="p-3.5 text-center bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300">
                      {lang === 'ar' ? 'أيام الغياب' : 'Absent Days'}
                    </th>
                    <th className="p-3.5 text-center bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300">
                      {lang === 'ar' ? 'الإجازات' : 'Leaves'}
                    </th>
                    <th className="p-3.5 text-center font-mono">
                      {lang === 'ar' ? 'إجمالي الساعات' : 'Total Hours'}
                    </th>
                    <th className="p-3.5 text-center font-mono text-purple-700 dark:text-purple-300">
                      {lang === 'ar' ? 'ساعات الإضافي' : 'Overtime'}
                    </th>
                    <th className="p-3.5 text-center">
                      {lang === 'ar' ? 'نسبة الالتزام' : 'Attendance Rate'}
                    </th>
                    <th className="p-3.5 print:table-cell hidden text-center">
                      {lang === 'ar' ? 'توقيع المستلم / السائق' : 'Signature'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {driverMonthlySummaries.map((summary, idx) => (
                    <tr
                      key={summary.driver.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="p-3.5 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-extrabold flex items-center gap-2">
                        <img
                          src={summary.driver.photoUrl}
                          alt={summary.driver.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-300 shrink-0 print:hidden"
                        />
                        <span>{summary.driver.name}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {summary.driver.phone}
                      </td>
                      <td className="p-3.5 text-center font-black text-sm bg-emerald-50/40 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-300">
                        {summary.totalAttendedDays} {lang === 'ar' ? 'يوم' : 'd'}
                      </td>
                      <td className="p-3.5 text-center font-bold bg-amber-50/40 dark:bg-amber-950/10 text-amber-700 dark:text-amber-300">
                        {summary.lateDays}
                      </td>
                      <td className="p-3.5 text-center font-bold bg-rose-50/40 dark:bg-rose-950/10 text-rose-700 dark:text-rose-300">
                        {summary.absentDays}
                      </td>
                      <td className="p-3.5 text-center font-bold bg-blue-50/40 dark:bg-blue-950/10 text-blue-700 dark:text-blue-300">
                        {summary.leaveDays}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {summary.totalWorkHours} {lang === 'ar' ? 'ساعة' : 'hrs'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                        {summary.totalOvertime > 0 ? `+${summary.totalOvertime} س` : '—'}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
                            {summary.attendanceRate}%
                          </span>
                          <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden print:hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${summary.attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 print:table-cell hidden text-center border-b border-dashed border-slate-300">
                        ...........................
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Print Footer */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 print:block hidden">
              <div className="grid grid-cols-3 gap-8 text-center text-xs text-slate-700 pt-4">
                <div>
                  <p className="font-bold">مسؤول شؤون الموظفين</p>
                  <p className="mt-8">......................................</p>
                </div>
                <div>
                  <p className="font-bold">مدير إدارة الأسطول والتشغيل</p>
                  <p className="mt-8">......................................</p>
                </div>
                <div>
                  <p className="font-bold">المدير العام / الاعتماد</p>
                  <p className="mt-8">......................................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
                {editingDriver ? t.edit : t.addDriver}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDriver} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.driverName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.phone} *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'رقم الهوية / الإقامة' : 'National ID / Iqama'}
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'المسمى الوظيفي / الدور' : 'Role / Position'}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="driver">{lang === 'ar' ? 'سائق' : 'Driver'}</option>
                    <option value="shift_manager">{lang === 'ar' ? 'مشرف ورديات' : 'Shift Supervisor'}</option>
                    <option value="mechanic">{lang === 'ar' ? 'فني صيانة وفحص' : 'Mechanic / Inspector'}</option>
                    <option value="receptionist">{lang === 'ar' ? 'موظف استقبال' : 'Receptionist'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.licenseNumber} *
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.licenseExpiry}
                  </label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.driverStatus}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DriverStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="available">{t.availableDriver}</option>
                    <option value="on_trip">{t.onTrip}</option>
                    <option value="off_duty">{t.offDuty}</option>
                    <option value="on_leave">{lang === 'ar' ? 'في إجازة' : 'On Leave'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.address}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'ملاحظات إضافية' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                />
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

      {/* Attendance Single Record Modal */}
      {isAttModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>{editingAtt ? (lang === 'ar' ? 'تعديل تسجيل الحضور' : 'Edit Attendance') : (lang === 'ar' ? 'تسجيل حضور وانصراف سائق' : 'Log Driver Attendance')}</span>
              </h3>
              <button
                onClick={() => setIsAttModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAttendance} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.driverName} *
                </label>
                <select
                  required
                  value={attDriverId}
                  onChange={(e) => setAttDriverId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'تاريخ الحضور' : 'Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'حالة الحضور' : 'Status'} *
                  </label>
                  <select
                    value={attStatus}
                    onChange={(e) => setAttStatus(e.target.value as AttendanceStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="present">{lang === 'ar' ? 'حاضر (في الموعد)' : 'Present'}</option>
                    <option value="late">{lang === 'ar' ? 'متأخر' : 'Late'}</option>
                    <option value="absent">{lang === 'ar' ? 'غائب' : 'Absent'}</option>
                    <option value="leave">{lang === 'ar' ? 'إجازة' : 'Leave'}</option>
                    <option value="on_duty_trip">{lang === 'ar' ? 'مهمة عمل / في رحلة' : 'On Trip / Duty'}</option>
                  </select>
                </div>
              </div>

              {attStatus !== 'absent' && attStatus !== 'leave' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'ar' ? 'وقت الحضور (دخول)' : 'Check In'}
                      </label>
                      <input
                        type="time"
                        value={attCheckIn}
                        onChange={(e) => handleCheckInOutChange(e.target.value, attCheckOut)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'ar' ? 'وقت الانصراف (خروج)' : 'Check Out'}
                      </label>
                      <input
                        type="time"
                        value={attCheckOut}
                        onChange={(e) => handleCheckInOutChange(attCheckIn, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'ar' ? 'ساعات العمل الفعلية' : 'Work Hours'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={attWorkHours}
                        onChange={(e) => setAttWorkHours(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {lang === 'ar' ? 'ساعات الإضافي' : 'Overtime'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={attOvertime}
                        onChange={(e) => setAttOvertime(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-purple-600 dark:text-purple-400"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'ملاحظات اليوم / سبب التأخير أو الغياب' : 'Daily Notes / Reason'}
                </label>
                <textarea
                  rows={2}
                  placeholder={lang === 'ar' ? 'مثال: تأخير بسبب الزحام، استئذان مبكر، إلخ' : 'e.g. Traffic delay, approved permission'}
                  value={attNotes}
                  onChange={(e) => setAttNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAttModalOpen(false)}
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

      {/* Batch Attendance Modal */}
      {isBatchAttModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>{lang === 'ar' ? 'تسجيل حضور جماعي لكافة السائقين' : 'Batch Driver Check-in'}</span>
              </h3>
              <button
                onClick={() => setIsBatchAttModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'تاريخ اليوم' : 'Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'الحالة الافتراضية' : 'Default Status'}
                  </label>
                  <select
                    value={batchDefaultStatus}
                    onChange={(e) => setBatchDefaultStatus(e.target.value as AttendanceStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="present">{lang === 'ar' ? 'حاضر (في الموعد)' : 'Present'}</option>
                    <option value="late">{lang === 'ar' ? 'متأخر' : 'Late'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'وقت الحضور القياسي' : 'Standard Check-in'}
                  </label>
                  <input
                    type="time"
                    value={batchCheckIn}
                    onChange={(e) => setBatchCheckIn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'وقت الانصراف القياسي' : 'Standard Check-out'}
                  </label>
                  <input
                    type="time"
                    value={batchCheckOut}
                    onChange={(e) => setBatchCheckOut(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Drivers Checkbox List */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'تحديد السائقين المراد تحضيرهم:' : 'Select Drivers:'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (batchSelectedDriverIds.length === drivers.length) {
                        setBatchSelectedDriverIds([]);
                      } else {
                        setBatchSelectedDriverIds(drivers.map((d) => d.id));
                      }
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    {batchSelectedDriverIds.length === drivers.length
                      ? (lang === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All')
                      : (lang === 'ar' ? 'تحديد الكل' : 'Select All')}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  {drivers.map((d) => {
                    const isSelected = batchSelectedDriverIds.includes(d.id);
                    return (
                      <label
                        key={d.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-500"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBatchSelectedDriverIds([...batchSelectedDriverIds, d.id]);
                              } else {
                                setBatchSelectedDriverIds(
                                  batchSelectedDriverIds.filter((id) => id !== d.id)
                                );
                              }
                            }}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-0"
                          />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {d.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{d.phone}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBatchAttModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition"
                >
                  {lang === 'ar' ? 'تأكيد وحفظ التحضير الجماعي' : 'Confirm Batch Check-in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
