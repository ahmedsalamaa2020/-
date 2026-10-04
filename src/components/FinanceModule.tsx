import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Printer,
  UserCheck,
  Car as CarIcon,
  FileText,
  Download,
  Calendar,
  Clock,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { AppSettings, Car, CarSale, DeliveryService, Driver, Invoice, PaymentVoucher, RentalContract, Currency, Language } from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { exportElementToPdf, triggerBrowserPrint } from '../utils/pdfExport';
import { exportToExcel } from '../utils/excelExport';
import { PrintPeriodicReportModal } from './PrintPeriodicReportModal';

interface FinanceModuleProps {
  contracts: RentalContract[];
  sales: CarSale[];
  deliveries: DeliveryService[];
  invoices?: Invoice[];
  vouchers?: PaymentVoucher[];
  cars: Car[];
  drivers: Driver[];
  settings: AppSettings;
  currency: Currency;
  lang: Language;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  contracts,
  sales,
  deliveries,
  invoices = [],
  vouchers = [],
  cars,
  drivers,
  settings,
  currency,
  lang,
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'vehicles' | 'detailed_ledger'>('overview');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isPeriodicReportModalOpen, setIsPeriodicReportModalOpen] = useState<boolean>(false);

  // Custom Date Range State (Start Date & End Date)
  const [startDate, setStartDate] = useState<string>(() => {
    // Default to start of current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    // Default to end of current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  });

  // Quick Date Range Presets
  const applyPreset = (preset: 'today' | 'this_week' | 'this_month' | 'last_month' | 'last_30_days' | 'this_year' | 'all') => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'this_week') {
      const dayOfWeek = today.getDay();
      const diffToSat = (dayOfWeek + 1) % 7;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - diffToSat);
      setStartDate(startOfWeek.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(lastDay.toISOString().slice(0, 10));
    } else if (preset === 'last_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(lastDay.toISOString().slice(0, 10));
    } else if (preset === 'last_30_days') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      setStartDate(past30.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === 'this_year') {
      setStartDate(`${today.getFullYear()}-01-01`);
      setEndDate(`${today.getFullYear()}-12-31`);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Helper date filter
  const isDateInRange = (dateStr?: string) => {
    if (!dateStr) return true;
    const d = dateStr.slice(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  // Filtered Datasets based on selected date period
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => isDateInRange(c.startDate || c.createdAt));
  }, [contracts, startDate, endDate]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => isDateInRange(s.saleDate));
  }, [sales, startDate, endDate]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => isDateInRange(d.scheduledDate || d.createdAt));
  }, [deliveries, startDate, endDate]);

  // Revenue totals for the active date range
  const totalRentalIncome = useMemo(() => {
    return filteredContracts.reduce((acc, c) => acc + (c.status !== 'cancelled' ? (c.totalAmount || 0) : 0), 0);
  }, [filteredContracts]);

  const totalSalesIncome = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (s.salePrice || 0), 0);
  }, [filteredSales]);

  const totalDeliveryIncome = useMemo(() => {
    return filteredDeliveries.reduce((acc, d) => acc + (d.status !== 'cancelled' ? (d.price || 0) : 0), 0);
  }, [filteredDeliveries]);

  const grandTotalRevenue = totalRentalIncome + totalSalesIncome + totalDeliveryIncome;

  const totalPaidRevenue = useMemo(() => {
    const rentPaid = filteredContracts.reduce((sum, c) => sum + (c.status !== 'cancelled' ? (c.paidAmount || (c.paymentStatus === 'paid' ? c.totalAmount : 0)) : 0), 0);
    const salePaid = filteredSales.reduce((sum, s) => sum + (s.paidDeposit ?? (s.paymentStatus === 'paid' ? s.salePrice : 0)), 0);
    const delivPaid = filteredDeliveries.reduce((sum, d) => sum + (d.paymentStatus === 'paid' ? (d.price || 0) : 0), 0);
    return rentPaid + salePaid + delivPaid;
  }, [filteredContracts, filteredSales, filteredDeliveries]);

  const totalRemainingBalance = Math.max(0, grandTotalRevenue - totalPaidRevenue);

  const handleExportFinancePdf = async () => {
    setIsExportingPdf(true);
    await exportElementToPdf('printable-finance', `Financial-Report-${startDate || 'start'}-to-${endDate || 'now'}.pdf`);
    setIsExportingPdf(false);
  };

  const handleExportFinanceExcel = () => {
    const fileName = `التقرير_المالي_للفترة_${startDate || 'البداية'}_إلى_${endDate || 'النهاية'}`;
    const columns = [
      { header: lang === 'ar' ? 'النوع' : 'Type', key: 'type', width: 18 },
      { header: lang === 'ar' ? 'الرقم المرجعي' : 'Reference', key: 'ref', width: 16 },
      { header: lang === 'ar' ? 'العميل / الطرف الآخر' : 'Client', key: 'client', width: 22 },
      { header: lang === 'ar' ? 'التاريخ' : 'Date', key: 'date', width: 14 },
      { header: lang === 'ar' ? 'الإجمالي' : 'Total', key: 'total', width: 16 },
      { header: lang === 'ar' ? 'المدفوع' : 'Paid', key: 'paid', width: 16 },
      { header: lang === 'ar' ? 'الحالة' : 'Status', key: 'status', width: 14 },
    ];

    const data: Record<string, any>[] = [];

    filteredContracts.forEach((c) => {
      data.push({
        type: lang === 'ar' ? 'عقد تأجير' : 'Rental Contract',
        ref: c.contractNumber,
        client: c.customerName,
        date: c.startDate,
        total: `${c.totalAmount} ${currency}`,
        paid: `${c.paidAmount || 0} ${currency}`,
        status: c.status === 'active' ? 'ساري' : c.status === 'completed' ? 'منتهي' : 'ملغي',
      });
    });

    filteredSales.forEach((s) => {
      data.push({
        type: lang === 'ar' ? 'بيع سيارة' : 'Car Sale',
        ref: s.invoiceNumber,
        client: s.buyerName,
        date: s.saleDate,
        total: `${s.salePrice} ${currency}`,
        paid: `${s.paidDeposit ?? (s.paymentStatus === 'paid' ? s.salePrice : 0)} ${currency}`,
        status: s.paymentStatus === 'paid' ? 'مدفوع' : 'معلق',
      });
    });

    filteredDeliveries.forEach((d) => {
      data.push({
        type: lang === 'ar' ? 'توصيل ونقل ركاب' : 'Passenger Transfer',
        ref: d.orderNumber,
        client: d.customerName,
        date: d.scheduledDate,
        total: `${d.price} ${currency}`,
        paid: `${d.paymentStatus === 'paid' ? d.price : 0} ${currency}`,
        status: d.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ',
      });
    });

    exportToExcel({
      fileName,
      sheetName: 'التقرير المالي بالفترة',
      title: `${settings.organizationName || settings.appName} - التقرير المالي والتشغيلي بالفترة`,
      subtitle: `من تاريخ: ${startDate || 'البداية'} إلى تاريخ: ${endDate || 'اليوم'}`,
      columns,
      data,
      summaryRows: [
        { label: 'إجمالي الإيرادات للفترة', value: `${grandTotalRevenue} ${currency}` },
        { label: 'إجمالي المحصل نقداً وبنكياً', value: `${totalPaidRevenue} ${currency}` },
        { label: 'إجمالي المتبقي', value: `${totalRemainingBalance} ${currency}` },
      ],
    });
  };

  // Dynamic Chart breakdown for the selected period
  const monthlyData = [
    { month: lang === 'ar' ? 'الفترة المحددة' : 'Selected Period', rental: totalRentalIncome, sales: totalSalesIncome, delivery: totalDeliveryIncome },
  ];

  const periodLabel = startDate && endDate
    ? `${lang === 'ar' ? 'من' : 'From'} ${startDate} ${lang === 'ar' ? 'إلى' : 'To'} ${endDate}`
    : startDate
    ? `${lang === 'ar' ? 'من تاريخ' : 'From'} ${startDate}`
    : endDate
    ? `${lang === 'ar' ? 'حتى تاريخ' : 'Until'} ${endDate}`
    : lang === 'ar' ? 'كافة الفترات المسجلة' : 'All Time';

  return (
    <div id="printable-finance" className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{t.finance}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                  {periodLabel}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'ar' ? 'تقارير الإيرادات الشاملة، تصفية الفترات، أرباح التأجير والمبيعات، وأداء الأسطول' : 'Comprehensive revenue reports, period filters, sales breakdowns, and fleet stats'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPeriodicReportModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-sm shadow-md transition"
            title={lang === 'ar' ? 'معاينة وطباعة تقرير الفترة المخصصة' : 'Preview & Print Custom Period Report'}
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ar' ? '🖨️ طباعة تقرير الفترة' : 'Print Period Report'}</span>
          </button>

          <button
            onClick={handleExportFinanceExcel}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition"
            title={lang === 'ar' ? 'تصدير بيانات الفترة كملف إكسيل' : 'Export Period Data to Excel'}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إكسيل' : 'Excel'}</span>
          </button>

          <button
            onClick={handleExportFinancePdf}
            disabled={isExportingPdf}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
            title={lang === 'ar' ? 'تنزيل التقرير كملف PDF' : 'Download PDF'}
          >
            <Download className="w-4 h-4" />
            <span>{isExportingPdf ? (lang === 'ar' ? 'جاري...' : 'Exporting...') : 'PDF'}</span>
          </button>
        </div>
      </div>

      {/* Date Range Selection & Filtering Panel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600/10 text-blue-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                {lang === 'ar' ? 'تحديد فترة التقرير (تاريخ البداية والنهاية)' : 'Select Report Date Period (Start & End Date)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'ar' ? 'اختر الفترة الزمنية المطلوبة لحساب الإيرادات والعقود والعمليات آلياً' : 'Choose custom start and end dates to dynamically calculate financials'}
              </p>
            </div>
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => applyPreset('all')}
              className="text-xs text-red-600 dark:text-red-400 hover:underline font-bold self-start md:self-auto"
            >
              {lang === 'ar' ? '✕ عرض كافة الفترات' : '✕ Clear Period'}
            </button>
          )}
        </div>

        {/* Start Date & End Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              📅 {lang === 'ar' ? 'تاريخ بداية التقرير (من):' : 'Report Start Date (From):'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              📅 {lang === 'ar' ? 'تاريخ نهاية التقرير (إلى):' : 'Report End Date (To):'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">
              {lang === 'ar' ? 'عدد العمليات في الفترة:' : 'Operations in Period:'}
            </span>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-900 dark:text-slate-100">
              <span className="text-blue-600">{filteredContracts.length} {lang === 'ar' ? 'عقد' : 'contracts'}</span>
              <span>•</span>
              <span className="text-purple-600">{filteredSales.length} {lang === 'ar' ? 'بيع' : 'sales'}</span>
              <span>•</span>
              <span className="text-emerald-600">{filteredDeliveries.length} {lang === 'ar' ? 'توصيل' : 'trips'}</span>
            </div>
          </div>
        </div>

        {/* Quick Presets Buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'فترات سريعة:' : 'Quick Presets:'}
          </span>
          {[
            { id: 'today', label: lang === 'ar' ? 'اليوم' : 'Today' },
            { id: 'this_week', label: lang === 'ar' ? 'هذا الأسبوع' : 'This Week' },
            { id: 'this_month', label: lang === 'ar' ? 'هذا الشهر' : 'This Month' },
            { id: 'last_month', label: lang === 'ar' ? 'الشهر الماضي' : 'Last Month' },
            { id: 'last_30_days', label: lang === 'ar' ? 'آخر 30 يوم' : 'Last 30 Days' },
            { id: 'this_year', label: lang === 'ar' ? 'هذا العام' : 'This Year' },
            { id: 'all', label: lang === 'ar' ? 'كافة الفترات (الكل)' : 'All Time' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id as any)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition shadow-xs"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t.revenueReports} ({periodLabel})</span>
        </button>

        <button
          onClick={() => setActiveTab('detailed_ledger')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'detailed_ledger'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{lang === 'ar' ? '📋 تفاصيل عمليات الفترة' : 'Period Ledger Details'}</span>
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'drivers'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{t.driverPerformance}</span>
        </button>

        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-3 transition border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'vehicles'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CarIcon className="w-4 h-4" />
          <span>{t.carUsageStats}</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & CARDS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Revenue Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 block font-bold mb-1">{t.totalRevenue} ({lang === 'ar' ? 'الفترة' : 'Period'})</span>
              <span className="font-black text-2xl text-slate-900 dark:text-slate-100">
                {formatCurrency(grandTotalRevenue, currency, lang)}
              </span>
              <span className="text-[11px] text-emerald-600 font-bold block mt-2">
                {totalPaidRevenue > 0 ? `${formatCurrency(totalPaidRevenue, currency, lang)} ${lang === 'ar' ? 'محصل' : 'collected'}` : ''}
              </span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 block font-bold mb-1">{t.rentalIncome}</span>
              <span className="font-black text-2xl text-blue-600 dark:text-blue-400">
                {formatCurrency(totalRentalIncome, currency, lang)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-2">{filteredContracts.length} {t.activeContracts}</span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 block font-bold mb-1">{t.salesIncome}</span>
              <span className="font-black text-2xl text-purple-600 dark:text-purple-400">
                {formatCurrency(totalSalesIncome, currency, lang)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-2">{filteredSales.length} {t.soldCars}</span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400 block font-bold mb-1">{t.deliveryIncome}</span>
              <span className="font-black text-2xl text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalDeliveryIncome, currency, lang)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-2">{filteredDeliveries.length} {t.deliveries}</span>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-base mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>{lang === 'ar' ? `مقارنة إيرادات القطاعات للفترة (${periodLabel})` : `Sector Revenue Comparison for Period`}</span>
            </h3>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="rental" fill="#2563eb" name={t.rentalIncome} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="sales" fill="#9333ea" name={t.salesIncome} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="delivery" fill="#10b981" name={t.deliveryIncome} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED LEDGER */}
      {activeTab === 'detailed_ledger' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
              {lang === 'ar' ? 'سجل العمليات والعقود المسجلة خلال الفترة' : 'Operations & Contracts Ledger for Period'}
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {periodLabel}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'الرقم المرجعي' : 'Ref #'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'العميل' : 'Client'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredContracts.map((c) => (
                  <tr key={`cnt_${c.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-blue-600">{lang === 'ar' ? '🚗 عقد تأجير' : 'Rental'}</td>
                    <td className="py-3 px-4 font-mono font-bold">{c.contractNumber}</td>
                    <td className="py-3 px-4">{c.customerName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{c.startDate}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{formatCurrency(c.totalAmount, currency, lang)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        c.status === 'active' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700' :
                        c.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredSales.map((s) => (
                  <tr key={`sale_${s.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-purple-600">{lang === 'ar' ? '🏷️ بيع سيارة' : 'Car Sale'}</td>
                    <td className="py-3 px-4 font-mono font-bold">{s.invoiceNumber}</td>
                    <td className="py-3 px-4">{s.buyerName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{s.saleDate}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{formatCurrency(s.salePrice, currency, lang)}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700">مكتمل</span></td>
                  </tr>
                ))}

                {filteredDeliveries.map((d) => (
                  <tr key={`deliv_${d.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-emerald-600">{lang === 'ar' ? '✈️ توصيل ركاب' : 'Delivery'}</td>
                    <td className="py-3 px-4 font-mono font-bold">{d.orderNumber}</td>
                    <td className="py-3 px-4">{d.customerName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{d.scheduledDate}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{formatCurrency(d.price, currency, lang)}</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700">{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DRIVERS PERFORMANCE */}
      {activeTab === 'drivers' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs p-6 space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
            {t.driverPerformance}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">{t.driverName}</th>
                  <th className="py-3 px-4">{t.phone}</th>
                  <th className="py-3 px-4">{t.totalTrips}</th>
                  <th className="py-3 px-4">{t.rating}</th>
                  <th className="py-3 px-4">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {drivers.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{d.name}</td>
                    <td className="py-3 px-4 text-slate-500">{d.phone}</td>
                    <td className="py-3 px-4 font-bold">{d.totalTrips}</td>
                    <td className="py-3 px-4 font-bold text-amber-500">★ {d.rating}</td>
                    <td className="py-3 px-4">{d.status.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: VEHICLE UTILIZATION */}
      {activeTab === 'vehicles' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs p-6 space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
            {t.carUsageStats}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cars.map((car) => (
              <div key={car.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm">{car.brand} {car.model}</h4>
                <p className="text-xs text-slate-500">{car.plateNumber} • {car.category.toUpperCase()}</p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs font-bold">
                  <span>{t.currentMileage}:</span>
                  <span className="text-blue-600">{car.currentMileage.toLocaleString()} KM</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Periodic Report Print Modal */}
      <PrintPeriodicReportModal
        isOpen={isPeriodicReportModalOpen}
        onClose={() => setIsPeriodicReportModalOpen(false)}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
        contracts={contracts}
        sales={sales}
        deliveries={deliveries}
        invoices={invoices}
        vouchers={vouchers}
        cars={cars}
        drivers={drivers}
        settings={settings}
        currency={currency}
        lang={lang}
      />
    </div>
  );
};

