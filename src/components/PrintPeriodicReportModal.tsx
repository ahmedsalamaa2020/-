import React, { useState, useMemo, useRef } from 'react';
import {
  Printer,
  FileSpreadsheet,
  Download,
  X,
  Calendar,
  DollarSign,
  TrendingUp,
  Car as CarIcon,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Layers,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  AppSettings,
  Car,
  CarSale,
  Currency,
  DeliveryService,
  Driver,
  Invoice,
  Language,
  PaymentVoucher,
  RentalContract,
} from '../types';
import { formatCurrency, translations } from '../translations/i18n';
import { exportToExcel } from '../utils/excelExport';
import { exportElementToPdf, triggerBrowserPrint } from '../utils/pdfExport';

interface PrintPeriodicReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onDateRangeChange?: (start: string, end: string) => void;
  contracts: RentalContract[];
  sales: CarSale[];
  deliveries: DeliveryService[];
  invoices?: Invoice[];
  vouchers?: PaymentVoucher[];
  cars?: Car[];
  drivers?: Driver[];
  settings: AppSettings;
  currency: Currency;
  lang: Language;
  initialScope?: 'all' | 'rentals' | 'sales' | 'deliveries' | 'financial';
}

export const PrintPeriodicReportModal: React.FC<PrintPeriodicReportModalProps> = ({
  isOpen,
  onClose,
  startDate: initialStartDate,
  endDate: initialEndDate,
  onDateRangeChange,
  contracts,
  sales,
  deliveries,
  invoices = [],
  vouchers = [],
  cars = [],
  drivers = [],
  settings,
  currency,
  lang,
  initialScope = 'all',
}) => {
  const t = translations[lang];
  const printRef = useRef<HTMLDivElement>(null);

  const [localStartDate, setLocalStartDate] = useState(initialStartDate || '');
  const [localEndDate, setLocalEndDate] = useState(initialEndDate || '');
  const [reportScope, setReportScope] = useState<'all' | 'rentals' | 'sales' | 'deliveries' | 'financial'>(initialScope);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Sync state if props change
  React.useEffect(() => {
    if (initialStartDate) setLocalStartDate(initialStartDate);
    if (initialEndDate) setLocalEndDate(initialEndDate);
  }, [initialStartDate, initialEndDate]);

  const handleStartDateChange = (val: string) => {
    setLocalStartDate(val);
    if (onDateRangeChange) onDateRangeChange(val, localEndDate);
  };

  const handleEndDateChange = (val: string) => {
    setLocalEndDate(val);
    if (onDateRangeChange) onDateRangeChange(localStartDate, val);
  };

  // Quick Date Range Presets
  const applyPreset = (preset: 'today' | 'this_week' | 'this_month' | 'last_month' | 'last_30_days' | 'this_year' | 'all') => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    let start = '';
    let end = todayStr;

    if (preset === 'today') {
      start = todayStr;
      end = todayStr;
    } else if (preset === 'this_week') {
      const dayOfWeek = today.getDay(); // 0 is Sunday
      const diffToSaturday = (dayOfWeek + 1) % 7; // For Middle East week start
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - diffToSaturday);
      start = startOfWeek.toISOString().slice(0, 10);
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      start = firstDay.toISOString().slice(0, 10);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end = lastDay.toISOString().slice(0, 10);
    } else if (preset === 'last_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      start = firstDay.toISOString().slice(0, 10);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      end = lastDay.toISOString().slice(0, 10);
    } else if (preset === 'last_30_days') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      start = past30.toISOString().slice(0, 10);
    } else if (preset === 'this_year') {
      start = `${today.getFullYear()}-01-01`;
      end = `${today.getFullYear()}-12-31`;
    } else if (preset === 'all') {
      start = '';
      end = '';
    }

    setLocalStartDate(start);
    setLocalEndDate(end);
    if (onDateRangeChange) onDateRangeChange(start, end);
  };

  // Helper date checker
  const isDateInRange = (dateStr?: string) => {
    if (!dateStr) return true;
    const itemDate = dateStr.slice(0, 10);
    if (localStartDate && itemDate < localStartDate) return false;
    if (localEndDate && itemDate > localEndDate) return false;
    return true;
  };

  // Filtered Datasets
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const dateToCheck = c.startDate || c.createdAt || '';
      return isDateInRange(dateToCheck);
    });
  }, [contracts, localStartDate, localEndDate]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const dateToCheck = s.saleDate || '';
      return isDateInRange(dateToCheck);
    });
  }, [sales, localStartDate, localEndDate]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const dateToCheck = d.scheduledDate || d.createdAt || '';
      return isDateInRange(dateToCheck);
    });
  }, [deliveries, localStartDate, localEndDate]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => isDateInRange(inv.issueDate));
  }, [invoices, localStartDate, localEndDate]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => isDateInRange(v.date));
  }, [vouchers, localStartDate, localEndDate]);

  // Financial Computations for Period
  const rentalRevenue = filteredContracts.reduce((sum, c) => sum + (c.status !== 'cancelled' ? (c.totalAmount || 0) : 0), 0);
  const rentalPaid = filteredContracts.reduce((sum, c) => sum + (c.status !== 'cancelled' ? (c.paidAmount || (c.paymentStatus === 'paid' ? c.totalAmount : 0)) : 0), 0);
  const rentalRemaining = Math.max(0, rentalRevenue - rentalPaid);

  const salesRevenue = filteredSales.reduce((sum, s) => sum + (s.salePrice || 0), 0);
  const salesPaid = filteredSales.reduce((sum, s) => sum + (s.paidDeposit ?? (s.paymentStatus === 'paid' ? s.salePrice : 0)), 0);
  const salesRemaining = Math.max(0, salesRevenue - salesPaid);

  const deliveryRevenue = filteredDeliveries.reduce((sum, d) => sum + (d.status !== 'cancelled' ? (d.price || 0) : 0), 0);
  const deliveryPaid = filteredDeliveries.reduce((sum, d) => sum + (d.paymentStatus === 'paid' ? (d.price || 0) : 0), 0);
  const deliveryRemaining = Math.max(0, deliveryRevenue - deliveryPaid);

  // Total Period Numbers
  const totalPeriodRevenue = rentalRevenue + salesRevenue + deliveryRevenue;
  const totalPeriodPaid = rentalPaid + salesPaid + deliveryPaid;
  const totalPeriodRemaining = rentalRemaining + salesRemaining + deliveryRemaining;
  const totalTransactionsCount = filteredContracts.length + filteredSales.length + filteredDeliveries.length;

  if (!isOpen) return null;

  const handlePrint = () => {
    triggerBrowserPrint('periodic-report-print-content');
  };

  const handlePdfExport = async () => {
    setIsExportingPdf(true);
    const fileName = `Periodic-Report-${localStartDate || 'start'}-to-${localEndDate || 'now'}.pdf`;
    await exportElementToPdf('periodic-report-print-content', fileName);
    setIsExportingPdf(false);
  };

  const handleExcelExport = () => {
    const fileName = `تقرير_الفترة_${localStartDate || 'البداية'}_إلى_${localEndDate || 'النهاية'}`;

    if (reportScope === 'rentals' || reportScope === 'all') {
      const rentalCols = [
        { header: lang === 'ar' ? 'رقم العقد' : 'Contract #', key: 'contractNumber', width: 16 },
        { header: lang === 'ar' ? 'العميل' : 'Customer', key: 'customerName', width: 22 },
        { header: lang === 'ar' ? 'رقم الهاتف' : 'Phone', key: 'customerPhone', width: 16 },
        { header: lang === 'ar' ? 'السيارة' : 'Vehicle', key: 'carModel', width: 20 },
        { header: lang === 'ar' ? 'اللوحة' : 'Plate', key: 'carPlate', width: 14 },
        { header: lang === 'ar' ? 'تاريخ البدء' : 'Start Date', key: 'startDate', width: 14 },
        { header: lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date', key: 'endDate', width: 14 },
        { header: lang === 'ar' ? 'المدة' : 'Duration', key: 'duration', width: 12 },
        { header: lang === 'ar' ? 'إجمالي العقد' : 'Total', key: 'totalAmountFormatted', width: 16 },
        { header: lang === 'ar' ? 'المدفوع' : 'Paid', key: 'paidAmountFormatted', width: 16 },
        { header: lang === 'ar' ? 'المتبقي' : 'Remaining', key: 'remainingFormatted', width: 16 },
        { header: lang === 'ar' ? 'حالة العقد' : 'Status', key: 'status', width: 14 },
      ];

      const rentalData = filteredContracts.map((c) => ({
        contractNumber: c.contractNumber,
        customerName: c.customerName,
        customerPhone: c.customerPhone || '-',
        carModel: c.carModel,
        carPlate: c.carPlate,
        startDate: c.startDate,
        endDate: c.endDate,
        duration: c.rentalDurationType === 'hours' ? `${c.totalHours || 1} ساعة` : `${c.totalDays} يوم`,
        totalAmountFormatted: `${c.totalAmount} ${currency}`,
        paidAmountFormatted: `${c.paidAmount || 0} ${currency}`,
        remainingFormatted: `${Math.max(0, c.totalAmount - (c.paidAmount || 0))} ${currency}`,
        status: c.status === 'active' ? 'ساري' : c.status === 'completed' ? 'منتهي' : 'ملغي',
      }));

      exportToExcel({
        fileName,
        sheetName: 'عقود الإيجار',
        title: `${settings.organizationName || settings.appName} - تقرير عقود الإيجار بالفترة`,
        subtitle: `الفترة من: ${localStartDate || 'البداية'} إلى: ${localEndDate || 'تاريخ اليوم'}`,
        columns: rentalCols,
        data: rentalData,
        summaryRows: [
          { label: 'إجمالي قيمة العقود', value: `${rentalRevenue} ${currency}` },
          { label: 'إجمالي المحصل', value: `${rentalPaid} ${currency}` },
          { label: 'إجمالي المتبقي', value: `${rentalRemaining} ${currency}` },
        ],
      });
    }
  };

  const periodLabel = localStartDate && localEndDate
    ? `${lang === 'ar' ? 'من' : 'From'} ${localStartDate} ${lang === 'ar' ? 'إلى' : 'To'} ${localEndDate}`
    : localStartDate
    ? `${lang === 'ar' ? 'من تاريخ' : 'From'} ${localStartDate}`
    : localEndDate
    ? `${lang === 'ar' ? 'حتى تاريخ' : 'Until'} ${localEndDate}`
    : lang === 'ar' ? 'كافة الفترات المسجلة' : 'All Recorded Time';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[96vh] overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/40">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black flex items-center gap-2">
                <span>{lang === 'ar' ? 'طباعة تقرير الفترة المخصصة' : 'Custom Periodic Report'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {periodLabel}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'ar'
                  ? 'حدد تاريخ البداية والنهاية لاستخراج ومعاينة وطباعة التقرير بدقة'
                  : 'Select exact start and end dates to filter and print operational statements'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExcelExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
              title={lang === 'ar' ? 'تصدير لإكسيل' : 'Export Excel'}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إكسيل' : 'Excel'}</span>
            </button>

            <button
              onClick={handlePdfExport}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
              title={lang === 'ar' ? 'تنزيل ملف PDF' : 'Download PDF'}
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? (lang === 'ar' ? 'جاري...' : '...') : 'PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة التقرير (Print)' : 'Print Report'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title={lang === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Filter & Scope Controls Toolbar (Hidden on Print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-3 print:hidden">
          {/* Exact Date Inputs + Quick Presets */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Custom Date Inputs */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs shadow-xs">
                <span className="text-slate-500 font-bold">{lang === 'ar' ? 'من تاريخ:' : 'From:'}</span>
                <input
                  type="date"
                  value={localStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="bg-transparent font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs shadow-xs">
                <span className="text-slate-500 font-bold">{lang === 'ar' ? 'إلى تاريخ:' : 'To:'}</span>
                <input
                  type="date"
                  value={localEndDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="bg-transparent font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              {(localStartDate || localEndDate) && (
                <button
                  onClick={() => applyPreset('all')}
                  className="text-[11px] text-red-600 dark:text-red-400 hover:underline px-2 font-bold"
                >
                  {lang === 'ar' ? 'مسح التحديد' : 'Clear Dates'}
                </button>
              )}
            </div>

            {/* Quick Presets Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lang === 'ar' ? 'فترات سريعة:' : 'Presets:'}
              </span>
              {[
                { id: 'today', label: lang === 'ar' ? 'اليوم' : 'Today' },
                { id: 'this_week', label: lang === 'ar' ? 'هذا الأسبوع' : 'This Week' },
                { id: 'this_month', label: lang === 'ar' ? 'هذا الشهر' : 'This Month' },
                { id: 'last_month', label: lang === 'ar' ? 'الشهر الماضي' : 'Last Month' },
                { id: 'last_30_days', label: lang === 'ar' ? 'آخر 30 يوم' : 'Last 30 Days' },
                { id: 'this_year', label: lang === 'ar' ? 'هذا العام' : 'This Year' },
                { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id as any)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 rounded-lg text-[11px] font-bold transition shadow-xs"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scope Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1">
            {[
              { id: 'all', label: lang === 'ar' ? '📑 شامل كافة العمليات' : 'All Operations', count: totalTransactionsCount },
              { id: 'rentals', label: lang === 'ar' ? '🚗 عقود التأجير' : 'Rental Contracts', count: filteredContracts.length },
              { id: 'sales', label: lang === 'ar' ? '🏷️ مبيعات السيارات' : 'Car Sales', count: filteredSales.length },
              { id: 'deliveries', label: lang === 'ar' ? '✈️ رحلات التوصيل والنقل' : 'Deliveries & Chauffeur', count: filteredDeliveries.length },
              { id: 'financial', label: lang === 'ar' ? '💰 الملخص المالي والخزينة' : 'Financial Summary' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReportScope(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  reportScope === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    reportScope === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Printable Report Canvas */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950 print:bg-white print:p-0 print:overflow-visible">
          <div
            id="periodic-report-print-content"
            ref={printRef}
            className="max-w-[210mm] mx-auto bg-white text-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 print:border-none print:shadow-none print:p-2 print:max-w-none space-y-6"
          >
            {/* Header with Official Branding */}
            <div className="border-b-2 border-blue-900 pb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center font-black text-lg">
                    {settings.organizationName ? settings.organizationName.charAt(0) : 'S'}
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-blue-950 tracking-tight">
                      {settings.organizationName || settings.appName}
                    </h1>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {lang === 'ar' ? 'منظومة إدارة وتأجير ومبيعات السيارات' : 'Automotive & Fleet Management System'}
                    </p>
                  </div>
                </div>

                <div className="text-[9.5px] text-slate-600 space-y-0.5 mt-2">
                  {settings.commercialRegistration && (
                    <p><span className="font-bold">س.ت / CR:</span> {settings.commercialRegistration}</p>
                  )}
                  {settings.taxId && (
                    <p><span className="font-bold">الرقم الضريبي / Tax ID:</span> {settings.taxId}</p>
                  )}
                  <p><span className="font-bold">العنوان:</span> {settings.address || 'المملكة العربية السعودية - الرياض'}</p>
                </div>
              </div>

              {/* Report Title & Metadata Box */}
              <div className="text-left rtl:text-right bg-blue-50 border border-blue-200 rounded-xl p-3.5 min-w-[220px]">
                <div className="inline-block px-2.5 py-1 bg-blue-900 text-white rounded-lg text-xs font-black mb-1.5">
                  {reportScope === 'rentals'
                    ? (lang === 'ar' ? 'تقرير عقود الإيجار بالفترة' : 'Periodic Rentals Report')
                    : reportScope === 'sales'
                    ? (lang === 'ar' ? 'تقرير مبيعات السيارات بالفترة' : 'Periodic Sales Report')
                    : reportScope === 'deliveries'
                    ? (lang === 'ar' ? 'تقرير رحلات التوصيل بالفترة' : 'Periodic Deliveries Report')
                    : reportScope === 'financial'
                    ? (lang === 'ar' ? 'كشف الحساب والمركز المالي بالفترة' : 'Financial Statement for Period')
                    : (lang === 'ar' ? 'التقرير التشغيلي والمالي الشامل بالفترة' : 'Comprehensive Operational Report')}
                </div>
                
                <div className="text-[10px] space-y-1 text-slate-700">
                  <p className="font-bold text-blue-950 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-700" />
                    <span>{periodLabel}</span>
                  </p>
                  <p className="text-slate-500">
                    {lang === 'ar' ? 'تاريخ الطباعة:' : 'Print Date:'} {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')} - {new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-slate-500 font-mono">
                    REF: PR-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}-{Math.floor(100 + Math.random() * 900)}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial & KPIs Summary Grid */}
            <div className="grid grid-cols-4 gap-2.5 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[9.5px] font-bold text-slate-500 block mb-0.5">
                  {lang === 'ar' ? 'إجمالي إيرادات الفترة' : 'Total Period Revenue'}
                </span>
                <span className="text-base font-black text-blue-950">
                  {formatCurrency(totalPeriodRevenue, currency, lang)}
                </span>
                <span className="text-[8.5px] text-slate-400 block mt-0.5 font-mono">
                  {totalTransactionsCount} {lang === 'ar' ? 'عملية مسجلة' : 'records'}
                </span>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-[9.5px] font-bold text-emerald-800 block mb-0.5">
                  {lang === 'ar' ? 'المحصل نقداً / بنكياً' : 'Total Collected (Paid)'}
                </span>
                <span className="text-base font-black text-emerald-700">
                  {formatCurrency(totalPeriodPaid, currency, lang)}
                </span>
                <span className="text-[8.5px] text-emerald-600 block mt-0.5">
                  {totalPeriodRevenue > 0 ? Math.round((totalPeriodPaid / totalPeriodRevenue) * 100) : 100}% {lang === 'ar' ? 'نسبة التحصيل' : 'collected'}
                </span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-[9.5px] font-bold text-amber-800 block mb-0.5">
                  {lang === 'ar' ? 'المبالغ المتبقية / المعلقة' : 'Outstanding Balance'}
                </span>
                <span className="text-base font-black text-amber-700">
                  {formatCurrency(totalPeriodRemaining, currency, lang)}
                </span>
                <span className="text-[8.5px] text-amber-600 block mt-0.5">
                  {totalPeriodRemaining === 0 ? (lang === 'ar' ? 'لا يوجد متبقي' : 'No balance') : (lang === 'ar' ? 'مستحق السداد' : 'Due for collection')}
                </span>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                <span className="text-[9.5px] font-bold text-purple-800 block mb-0.5">
                  {lang === 'ar' ? 'أقسام النشاط' : 'Sector Split'}
                </span>
                <div className="text-[8.5px] text-purple-900 font-bold space-y-0.5 text-right rtl:text-right">
                  <p>🚗 تأجير: {formatCurrency(rentalRevenue, currency, lang)}</p>
                  <p>🏷️ مبيعات: {formatCurrency(salesRevenue, currency, lang)}</p>
                  <p>✈️ توصيل: {formatCurrency(deliveryRevenue, currency, lang)}</p>
                </div>
              </div>
            </div>

            {/* SECTION 1: RENTAL CONTRACTS TABLE */}
            {(reportScope === 'all' || reportScope === 'rentals') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h3 className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <CarIcon className="w-3.5 h-3.5 text-blue-700" />
                    <span>{lang === 'ar' ? 'سجل عقود تأجير السيارات خلال الفترة' : 'Rental Contracts Ledger for Period'}</span>
                    <span className="text-[10px] text-slate-500 font-normal">({filteredContracts.length} {lang === 'ar' ? 'عقد' : 'contracts'})</span>
                  </h3>
                  <span className="text-[10px] font-bold text-blue-900">
                    {lang === 'ar' ? 'إجمالي التأجير:' : 'Total Rentals:'} {formatCurrency(rentalRevenue, currency, lang)}
                  </span>
                </div>

                {filteredContracts.length === 0 ? (
                  <div className="p-4 bg-slate-50 text-center text-xs text-slate-500 rounded-lg">
                    {lang === 'ar' ? 'لا توجد عقود تأجير مسجلة في هذه الفترة المحددة.' : 'No rental contracts found for this period.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right rtl:text-right text-[9.5px] border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold">
                          <th className="p-1.5 border border-slate-300 text-center w-8">#</th>
                          <th className="p-1.5 border border-slate-300">{lang === 'ar' ? 'رقم العقد' : 'Contract'}</th>
                          <th className="p-1.5 border border-slate-300">{lang === 'ar' ? 'اسم المستأجر' : 'Lessee Name'}</th>
                          <th className="p-1.5 border border-slate-300">{lang === 'ar' ? 'السيارة واللوحة' : 'Car & Plate'}</th>
                          <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'الفترة (من - إلى)' : 'Period'}</th>
                          <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'المدة' : 'Duration'}</th>
                          <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                          <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'المدفوع' : 'Paid'}</th>
                          <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'المتبقي' : 'Balance'}</th>
                          <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContracts.map((c, idx) => {
                          const paid = c.paidAmount || (c.paymentStatus === 'paid' ? c.totalAmount : 0);
                          const remaining = Math.max(0, c.totalAmount - paid);
                          return (
                            <tr key={c.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                              <td className="p-1.5 border border-slate-300 text-center font-mono text-slate-500">{idx + 1}</td>
                              <td className="p-1.5 border border-slate-300 font-mono font-bold text-blue-900">{c.contractNumber}</td>
                              <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{c.customerName}</td>
                              <td className="p-1.5 border border-slate-300">
                                {c.carModel} <span className="font-mono text-slate-500 font-bold">({c.carPlate})</span>
                              </td>
                              <td className="p-1.5 border border-slate-300 text-center font-mono text-[9px]">
                                {c.startDate} ➜ {c.endDate}
                              </td>
                              <td className="p-1.5 border border-slate-300 text-center font-bold">
                                {c.rentalDurationType === 'hours' ? `${c.totalHours || 1} س` : `${c.totalDays} ي`}
                              </td>
                              <td className="p-1.5 border border-slate-300 text-center font-bold text-slate-900">
                                {formatCurrency(c.totalAmount, currency, lang)}
                              </td>
                              <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-700">
                                {formatCurrency(paid, currency, lang)}
                              </td>
                              <td className="p-1.5 border border-slate-300 text-center font-bold text-amber-700">
                                {remaining > 0 ? formatCurrency(remaining, currency, lang) : '-'}
                              </td>
                              <td className="p-1.5 border border-slate-300 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                                  c.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                  c.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {c.status === 'active' ? 'ساري' : c.status === 'completed' ? 'منتهي' : 'ملغي'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-200/80 font-black text-slate-900 border-t-2 border-slate-400">
                          <td colSpan={6} className="p-1.5 border border-slate-300 text-left rtl:text-left">
                            {lang === 'ar' ? 'إجمالي عقود التأجير الموضحة أعلاه:' : 'Total Rentals Summary:'}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center text-blue-950 font-black">
                            {formatCurrency(rentalRevenue, currency, lang)}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center text-emerald-800 font-black">
                            {formatCurrency(rentalPaid, currency, lang)}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center text-amber-800 font-black">
                            {formatCurrency(rentalRemaining, currency, lang)}
                          </td>
                          <td className="p-1.5 border border-slate-300"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: CAR SALES TABLE */}
            {(reportScope === 'all' || reportScope === 'sales') && filteredSales.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h3 className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-700" />
                    <span>{lang === 'ar' ? 'سجل مبيعات السيارات خلال الفترة' : 'Car Sales Ledger for Period'}</span>
                    <span className="text-[10px] text-slate-500 font-normal">({filteredSales.length} {lang === 'ar' ? 'سيارة مباعة' : 'sales'})</span>
                  </h3>
                  <span className="text-[10px] font-bold text-purple-900">
                    {lang === 'ar' ? 'إجمالي المبيعات:' : 'Total Sales:'} {formatCurrency(salesRevenue, currency, lang)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right rtl:text-right text-[9.5px] border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-purple-50 text-purple-950 border-b border-slate-300 font-bold">
                        <th className="p-1.5 border border-slate-300 text-center w-8">#</th>
                        <th className="p-1.5 border border-slate-300">{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice'}</th>
                        <th className="p-1.5 border border-slate-300">{lang === 'ar' ? 'اسم المشتري' : 'Buyer'}</th>
                        <th className="p-1.5 border border-slate-300">{lang === 'ar' ? 'السيارة المباعة' : 'Car Sold'}</th>
                        <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'تاريخ البيع' : 'Sale Date'}</th>
                        <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'سعر البيع' : 'Sale Price'}</th>
                        <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'المدفوع' : 'Paid'}</th>
                        <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'طريقة الدفع' : 'Payment Type'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((s, idx) => (
                        <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-purple-50/30'}>
                          <td className="p-1.5 border border-slate-300 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-300 font-mono font-bold text-purple-900">{s.invoiceNumber}</td>
                          <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{s.buyerName}</td>
                          <td className="p-1.5 border border-slate-300">{s.carModel} ({s.carPlate})</td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono">{s.saleDate}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold text-slate-900">{formatCurrency(s.salePrice, currency, lang)}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-700">
                            {formatCurrency(s.paidDeposit ?? (s.paymentStatus === 'paid' ? s.salePrice : 0), currency, lang)}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold text-slate-700">
                            {s.paymentMethod === 'cash' ? 'نقداً' : s.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : s.paymentMethod === 'installments' ? 'أقساط' : 'شيك'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 3: PASSENGER TRIPS / CHAUFFEUR */}
            {(reportScope === 'all' || reportScope === 'deliveries') && filteredDeliveries.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <h3 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{lang === 'ar' ? 'سجل رحلات نقل وتوصيل الركاب خلال الفترة' : 'Passenger Transfers Ledger for Period'}</span>
                    <span className="text-[10px] text-slate-500 font-normal">({filteredDeliveries.length} {lang === 'ar' ? 'رحلة' : 'trips'})</span>
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-900">
                    {lang === 'ar' ? 'إجمالي التوصيل:' : 'Total Deliveries:'} {formatCurrency(deliveryRevenue, currency, lang)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right rtl:text-right text-[9.5px] border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-emerald-50 text-emerald-950 border-b border-slate-300 font-bold">
                        <th className="p-1.5 border border-slate-300 text-center w-8">#</th>
                        <th className="p-1.5 border border-slate-300">{lang === 'ar' ? 'رقم الرحلة' : 'Trip #'}</th>
                        <th className="p-1.5 border border-slate-300">{lang === 'ar' ? 'العميل' : 'Customer'}</th>
                        <th className="p-1.5 border border-slate-300">{lang === 'ar' ? 'مسار الرحلة (من ➜ إلى)' : 'Route'}</th>
                        <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</th>
                        <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'السائق' : 'Driver'}</th>
                        <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'المبلغ' : 'Price'}</th>
                        <th className="p-1.5 border border-slate-300 text-center">{lang === 'ar' ? 'السداد' : 'Payment'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeliveries.map((d, idx) => (
                        <tr key={d.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}>
                          <td className="p-1.5 border border-slate-300 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-300 font-mono font-bold text-emerald-900">{d.orderNumber}</td>
                          <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{d.customerName}</td>
                          <td className="p-1.5 border border-slate-300 text-[9px]">{d.pickupAddress} ➜ {d.dropoffAddress}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono text-[9px]">{d.scheduledDate} {d.scheduledTime}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold text-slate-700">{d.driverName || '-'}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold text-slate-900">{formatCurrency(d.price, currency, lang)}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-700">
                            {d.paymentStatus === 'paid' ? 'مدفوع' : 'معلق'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Official Report Signatures & Authorization Box */}
            <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
              <div className="space-y-12">
                <p className="font-bold text-slate-700">{lang === 'ar' ? 'إعداد المحاسب / المالي:' : 'Prepared by Accountant:'}</p>
                <div className="border-b border-dashed border-slate-400 mx-6"></div>
                <p className="text-[10px] text-slate-500">{lang === 'ar' ? 'التوقيع والاعتماد' : 'Signature'}</p>
              </div>

              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-blue-900 flex items-center justify-center text-[10px] font-bold text-blue-900 text-center p-2">
                  <span>{lang === 'ar' ? 'ختم المنشأة والاعتماد الرسمي' : 'Official Seal'}</span>
                </div>
                <span className="text-[8.5px] text-slate-400 font-mono">VERIFIED BY SMART SYSTEM</span>
              </div>

              <div className="space-y-12">
                <p className="font-bold text-slate-700">{lang === 'ar' ? 'اعتماد الإدارة العامة:' : 'General Manager Approval:'}</p>
                <div className="border-b border-dashed border-slate-400 mx-6"></div>
                <p className="text-[10px] text-slate-500">{settings.organizationName || (lang === 'ar' ? 'إدارة الشركة' : 'Management')}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
