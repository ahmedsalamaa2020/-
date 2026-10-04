import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
  X,
  FileSpreadsheet,
  Car,
  User,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { AppSettings, DailyShiftLog, Language } from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { exportToExcel } from '../utils/excelExport';
import { triggerBrowserPrint, exportElementToPdf } from '../utils/pdfExport';

interface PrintShiftMonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  startDate?: string;
  endDate?: string;
  month?: string; // YYYY-MM fallback
  shiftLogs: DailyShiftLog[];
  settings: AppSettings;
  lang: Language;
  selectedShiftRoute?: string;
}

export const PrintShiftMonthlyReportModal: React.FC<PrintShiftMonthlyReportModalProps> = ({
  isOpen,
  onClose,
  companyName,
  startDate,
  endDate,
  month,
  shiftLogs,
  settings,
  lang,
  selectedShiftRoute = 'all',
}) => {
  const t = translations[lang];
  const printRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Local start & end date states for flexible interactive adjustment
  const [localStartDate, setLocalStartDate] = useState<string>(() => {
    if (startDate) return startDate;
    if (month) return `${month}-01`;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });

  const [localEndDate, setLocalEndDate] = useState<string>(() => {
    if (endDate) return endDate;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      return `${month}-${String(lastDay).padStart(2, '0')}`;
    }
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (startDate !== undefined) setLocalStartDate(startDate);
    else if (month) setLocalStartDate(`${month}-01`);

    if (endDate !== undefined) setLocalEndDate(endDate);
    else if (month) {
      const [y, m] = month.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      setLocalEndDate(`${month}-${String(lastDay).padStart(2, '0')}`);
    }
  }, [startDate, endDate, month, isOpen]);

  const applyPreset = (preset: 'today' | 'this_week' | 'this_month' | 'last_month' | 'last_30_days' | 'all') => {
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const today = formatDate(now);
      setLocalStartDate(today);
      setLocalEndDate(today);
    } else if (preset === 'this_week') {
      const day = now.getDay();
      const diffToSat = (day + 1) % 7;
      const start = new Date(now);
      start.setDate(now.getDate() - diffToSat);
      setLocalStartDate(formatDate(start));
      setLocalEndDate(formatDate(now));
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setLocalStartDate(formatDate(start));
      setLocalEndDate(formatDate(end));
    } else if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setLocalStartDate(formatDate(start));
      setLocalEndDate(formatDate(end));
    } else if (preset === 'last_30_days') {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      setLocalStartDate(formatDate(start));
      setLocalEndDate(formatDate(now));
    } else if (preset === 'all') {
      setLocalStartDate('');
      setLocalEndDate('');
    }
  };

  if (!isOpen) return null;

  // Filter logs for this company and date range
  const filteredLogs = shiftLogs.filter((log) => {
    const matchesComp = log.companyName === companyName;
    const tripDate = (log.shiftDate || '').slice(0, 10);
    const matchesDate =
      (!localStartDate || tripDate >= localStartDate) &&
      (!localEndDate || tripDate <= localEndDate);
    const matchesRoute =
      selectedShiftRoute === 'all' ||
      log.shiftName === selectedShiftRoute ||
      `${log.fromLocation || ''} ➜ ${log.toLocation || ''}` === selectedShiftRoute;
    return matchesComp && matchesDate && matchesRoute;
  }).sort((a, b) => a.shiftDate.localeCompare(b.shiftDate));

  // Calculations
  const totalDays = filteredLogs.length;
  const departureDoneCount = filteredLogs.filter((l) => l.isDepartureDone).length;
  const returnDoneCount = filteredLogs.filter((l) => l.isReturnDone).length;
  const fullyCompletedDays = filteredLogs.filter((l) => l.isDepartureDone && l.isReturnDone).length;
  const totalTripsDone = departureDoneCount + returnDoneCount;
  const totalExpectedTrips = totalDays * 2;
  const completionRate = totalExpectedTrips > 0 ? Math.round((totalTripsDone / totalExpectedTrips) * 100) : 0;
  const totalPassengers = filteredLogs.reduce((sum, l) => sum + (l.employeeCount || 0), 0);
  const notesCount = filteredLogs.filter((l) => l.notes && l.notes.trim() !== '').length;

  const periodLabel = localStartDate && localEndDate
    ? `${localStartDate} ${lang === 'ar' ? 'إلى' : 'to'} ${localEndDate}`
    : localStartDate
    ? `${lang === 'ar' ? 'من' : 'From'} ${localStartDate}`
    : localEndDate
    ? `${lang === 'ar' ? 'حتى' : 'Until'} ${localEndDate}`
    : lang === 'ar' ? 'كافة الفترات' : 'All Dates';

  const periodFileLabel = localStartDate && localEndDate
    ? `${localStartDate}_إلى_${localEndDate}`
    : localStartDate || localEndDate || 'كافة_الفترات';

  const handlePrint = () => {
    triggerBrowserPrint('printable-shift-report');
  };

  const handlePdfExport = async () => {
    try {
      setIsExportingPdf(true);
      await exportElementToPdf('printable-shift-report', `تقرير_ورديات_${companyName}_${periodFileLabel}.pdf`);
    } catch (e) {
      console.error('Failed to export PDF:', e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExcelExport = () => {
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

    const data = filteredLogs.map((log) => {
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

    const summaryRows = [
      { label: lang === 'ar' ? 'الفترة الزمنية للتقرير:' : 'Report Period:', value: periodLabel },
      { label: lang === 'ar' ? 'إجمالي أيام العمل والورديات:' : 'Total Scheduled Days:', value: totalDays },
      { label: lang === 'ar' ? 'إجمالي رحلات الذهاب المنجزة:' : 'Total Departures Completed:', value: `${departureDoneCount} / ${totalDays}` },
      { label: lang === 'ar' ? 'إجمالي رحلات العودة المنجزة:' : 'Total Returns Completed:', value: `${returnDoneCount} / ${totalDays}` },
      { label: lang === 'ar' ? 'نسبة الالتزام والإنجاز الإجمالية:' : 'Total Completion Rate:', value: `${completionRate}%` },
      { label: lang === 'ar' ? 'إجمالي حركة الموظفين المنقولين:' : 'Total Employee Transits:', value: totalPassengers },
    ];

    exportToExcel({
      fileName: `تقرير_ورديات_${companyName}_${periodFileLabel}`,
      sheetName: 'سجل الورديات',
      title: `${settings.organizationName || settings.appName} - ${lang === 'ar' ? 'تقرير الورديات ونقل الموظفين والمطالبات' : 'Corporate Shifts & Billing Period Report'}`,
      subtitle: `${lang === 'ar' ? 'الشركة المستفيدة:' : 'Client:'} ${companyName} | ${lang === 'ar' ? 'الفترة:' : 'Period:'} ${periodLabel}`,
      columns,
      data,
      summaryRows,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden my-auto print:max-h-none print:border-none print:shadow-none print:bg-white print:w-full print:rounded-none">
        {/* Modal Toolbar (Hidden during print) */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 print:hidden text-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm">
                  {lang === 'ar' ? `تقرير ومطالبة ورديات: ${companyName}` : `Shifts Billing & Report: ${companyName}`}
                </h3>
                <p className="text-xs text-slate-400">
                  {periodLabel} • {lang === 'ar' ? 'معاينة وطباعة وتصدير إكسيل رسمي' : 'Print & Excel Export'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExcelExport}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تصدير إكسيل (Excel)' : 'Export Excel'}</span>
              </button>

              <button
                type="button"
                disabled={isExportingPdf}
                onClick={handlePdfExport}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingPdf ? (lang === 'ar' ? 'جاري إنشاء PDF...' : 'Creating PDF...') : (lang === 'ar' ? 'تنزيل PDF' : 'Download PDF')}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'ar' ? 'طباعة التقرير' : 'Print Report'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Date Range Toolbar Controls in Modal */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>{lang === 'ar' ? 'تحديد فترة التقرير:' : 'Date Period:'}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">{lang === 'ar' ? 'من:' : 'From:'}</span>
                <input
                  type="date"
                  value={localStartDate}
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">{lang === 'ar' ? 'إلى:' : 'To:'}</span>
                <input
                  type="date"
                  value={localEndDate}
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => applyPreset('this_month')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition"
              >
                {lang === 'ar' ? 'هذا الشهر' : 'This Month'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('last_month')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition"
              >
                {lang === 'ar' ? 'الشهر السابق' : 'Last Month'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('last_30_days')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition"
              >
                {lang === 'ar' ? 'آخر 30 يوم' : 'Last 30 Days'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('all')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition"
              >
                {lang === 'ar' ? 'الكل' : 'All'}
              </button>
            </div>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 print:bg-white print:p-0 print:overflow-visible text-slate-900">
          <div
            ref={printRef}
            id="printable-shift-report"
            className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 max-w-4xl mx-auto space-y-5 print:space-y-4"
          >
            {/* Report Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 print:border-b-2 print:border-black">
              <div className="flex items-center gap-3">
                {settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                  />
                )}
                <div>
                  <h1 className="text-base font-black text-slate-900">
                    {settings.organizationName || settings.appName}
                  </h1>
                  <p className="text-xs text-slate-600">{settings.address}</p>
                  <p className="text-[11px] text-slate-600 font-mono">
                    {t.phone}: {settings.contactPhone} | {lang === 'ar' ? 'س.ت' : 'C.R'}: {settings.commercialRegistration || '-'} | {lang === 'ar' ? 'الرقم الضريبي' : 'Tax ID'}: {settings.taxId || '-'}
                  </p>
                </div>
              </div>

              <div className="text-left rtl:text-right">
                <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-bold text-xs rounded uppercase">
                  {lang === 'ar' ? 'تقرير ومطالبة الورديات بالفترة' : 'Corporate Shifts Period Report'}
                </span>
                <p className="text-xs font-black text-blue-900 mt-1 font-mono">{periodLabel}</p>
                <p className="text-[10px] text-slate-500">
                  {lang === 'ar' ? 'تاريخ الطباعة:' : 'Printed on:'} {new Date().toISOString().slice(0, 10)}
                </p>
              </div>
            </div>

            {/* Client & Route Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">{lang === 'ar' ? 'الشركة المستفيدة:' : 'Client Company:'}</span>
                <span className="font-black text-slate-900 text-sm">{companyName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">{lang === 'ar' ? 'فترة التقرير والمطالبة:' : 'Report Period:'}</span>
                <span className="font-mono font-bold text-blue-900 text-[11px]">{periodLabel}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">{lang === 'ar' ? 'خط السير المستهدف:' : 'Route Scope:'}</span>
                <span className="font-bold text-slate-800">{selectedShiftRoute === 'all' ? (lang === 'ar' ? 'كافة خطوط السير والورديات' : 'All Routes') : selectedShiftRoute}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">{lang === 'ar' ? 'إجمالي أيام العمل:' : 'Total Days:'}</span>
                <span className="font-bold text-slate-900 font-mono">{totalDays} {lang === 'ar' ? 'يوم' : 'Days'}</span>
              </div>
            </div>

            {/* Executive KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-800 block leading-tight">{lang === 'ar' ? 'أيام الورديات' : 'Scheduled Days'}</span>
                <span className="text-base font-black text-blue-950 font-mono">{totalDays}</span>
              </div>

              <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 block leading-tight">{lang === 'ar' ? 'رحلات الذهاب المنجزة' : 'Departures Done'}</span>
                <span className="text-base font-black text-emerald-950 font-mono">{departureDoneCount} / {totalDays}</span>
              </div>

              <div className="p-2.5 bg-purple-50/80 rounded-xl border border-purple-200">
                <span className="text-[10px] font-bold text-purple-800 block leading-tight">{lang === 'ar' ? 'رحلات العودة المنجزة' : 'Returns Done'}</span>
                <span className="text-base font-black text-purple-950 font-mono">{returnDoneCount} / {totalDays}</span>
              </div>

              <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-800 block leading-tight">{lang === 'ar' ? 'نسبة الالتزام والإنجاز' : 'Completion Rate'}</span>
                <span className="text-base font-black text-indigo-950 font-mono">{completionRate}%</span>
              </div>

              <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 block leading-tight">{lang === 'ar' ? 'إجمالي الركاب/الملاحظات' : 'Staff / Notes'}</span>
                <span className="text-xs font-black text-amber-950">{totalPassengers} {lang === 'ar' ? 'راكب' : 'pass.'} • {notesCount} {lang === 'ar' ? 'ملاحظة' : 'notes'}</span>
              </div>
            </div>

            {/* Shift Days Table */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-right rtl:text-right ltr:text-left text-[10px] sm:text-xs">
                <thead className="bg-slate-800 text-white font-bold text-[10px]">
                  <tr>
                    <th className="p-2">{lang === 'ar' ? 'التاريخ واليوم' : 'Date & Day'}</th>
                    <th className="p-2">{lang === 'ar' ? 'اسم الوردية وخط السير (البداية ➜ النهاية)' : 'Shift & Route (From ➜ To)'}</th>
                    <th className="p-2">{lang === 'ar' ? 'المواعيد' : 'Time'}</th>
                    <th className="p-2">{lang === 'ar' ? 'السائق والمركبة' : 'Driver & Car'}</th>
                    <th className="p-2 text-center">{lang === 'ar' ? 'الذهاب' : 'Departure'}</th>
                    <th className="p-2 text-center">{lang === 'ar' ? 'العودة' : 'Return'}</th>
                    <th className="p-2">{lang === 'ar' ? 'الملاحظات' : 'Notes'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400">
                        {lang === 'ar' ? 'لا توجد ورديات مسجلة لهذا الشهر والشركة' : 'No shifts recorded for this month.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const dateObj = new Date(log.shiftDate);
                      const dayName = dateObj.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
                      return (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-2 whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-900 block">{log.shiftDate}</span>
                            <span className="text-[9px] text-slate-500">{dayName}</span>
                          </td>
                          <td className="p-2">
                            <div className="font-bold text-slate-900">{log.shiftName || (lang === 'ar' ? 'وردية نقل' : 'Shift')}</div>
                            <div className="text-[9px] text-blue-700 font-mono">
                              {log.fromLocation || 'المقر'} ➜ {log.toLocation || 'الوجهة'}
                            </div>
                          </td>
                          <td className="p-2 whitespace-nowrap font-mono text-[9.5px]">
                            <div><span className="text-slate-400 text-[8px]">{lang === 'ar' ? 'انطلاق:' : 'Dep:'}</span> {log.departureTime}</div>
                            <div><span className="text-slate-400 text-[8px]">{lang === 'ar' ? 'رجوع:' : 'Ret:'}</span> {log.arrivalTime}</div>
                          </td>
                          <td className="p-2">
                            <div className="font-semibold text-slate-900">{log.driverName}</div>
                            <div className="text-[9px] text-slate-500 font-mono">{log.carPlate}</div>
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">
                            {log.isDepartureDone ? (
                              <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[9px] border border-emerald-300">
                                {lang === 'ar' ? 'تم الذهاب ✓' : 'Done ✓'}
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-semibold text-[9px]">
                                {lang === 'ar' ? 'لم يتم ✕' : 'Pending ✕'}
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-center whitespace-nowrap">
                            {log.isReturnDone ? (
                              <span className="inline-block px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[9px] border border-purple-300">
                                {lang === 'ar' ? 'تمت العودة ✓' : 'Done ✓'}
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-semibold text-[9px]">
                                {lang === 'ar' ? 'لم يتم ✕' : 'Pending ✕'}
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-[9.5px] max-w-[160px]">
                            {log.notes ? (
                              <span className="text-amber-900 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 block truncate">
                                {log.notes}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Official Certification & Signatures Box */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-slate-300 print:break-inside-avoid">
              <div className="text-center space-y-1">
                <p className="font-bold text-xs text-slate-800">
                  {lang === 'ar' ? 'إدارة الحركة والتشغيل (الطرف الأول)' : 'Transport Operations Manager'}
                </p>
                <div className="h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50/50">
                  <span className="text-[10px] text-slate-400 italic">
                    {settings.organizationName || (lang === 'ar' ? 'ختم وتوقيع الشركة' : 'Authorized Signature')}
                  </span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="font-bold text-xs text-slate-800">
                  {lang === 'ar' ? `اعتماد ممثل شركة (${companyName})` : 'Client Representative Acceptance'}
                </p>
                <div className="h-12 border border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50/50">
                  <span className="text-[10px] text-slate-400 italic">
                    {lang === 'ar' ? 'توقيع وختم استلام التقرير' : 'Client Signature & Stamp'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
