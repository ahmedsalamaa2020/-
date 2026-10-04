import React, { useState, useMemo, useRef } from 'react';
import {
  Printer,
  FileSpreadsheet,
  Download,
  X,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Receipt,
  Landmark,
  Building2,
  CheckCircle2,
  Filter,
  Layers,
  Clock,
  ShieldCheck,
  FileText,
  User,
  Wallet,
  CreditCard,
  Globe,
} from 'lucide-react';
import {
  AppSettings,
  Currency,
  Language,
  OperatingExpense,
  SystemUser,
  TreasuryAccount,
  TreasuryTransaction,
  TreasuryTransfer,
} from '../types';
import { formatCurrency, translations } from '../translations/i18n';
import { exportToExcel } from '../utils/excelExport';
import { exportElementToPdf, triggerBrowserPrint } from '../utils/pdfExport';

interface PrintTreasuryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  treasuries: TreasuryAccount[];
  transactions: TreasuryTransaction[];
  transfers: TreasuryTransfer[];
  expenses: OperatingExpense[];
  settings: AppSettings;
  currency: Currency;
  lang: Language;
  currentUser: SystemUser | null;
  initialTreasuryId?: string;
  initialPaymentMethod?: string;
}

export const PrintTreasuryReportModal: React.FC<PrintTreasuryReportModalProps> = ({
  isOpen,
  onClose,
  startDate: initialStartDate,
  endDate: initialEndDate,
  treasuries,
  transactions,
  transfers,
  expenses,
  settings,
  currency,
  lang,
  currentUser,
  initialTreasuryId = 'all',
  initialPaymentMethod = 'all',
}) => {
  const t = translations[lang];
  const [localStartDate, setLocalStartDate] = useState(initialStartDate || '');
  const [localEndDate, setLocalEndDate] = useState(initialEndDate || '');
  const [selectedTreasuryId, setSelectedTreasuryId] = useState<string>(initialTreasuryId);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(initialPaymentMethod);
  const [reportSection, setReportSection] = useState<'all' | 'inflow' | 'expense' | 'transfer' | 'outflow'>('all');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Sync state if props change
  React.useEffect(() => {
    if (initialStartDate) setLocalStartDate(initialStartDate);
    if (initialEndDate) setLocalEndDate(initialEndDate);
    if (initialTreasuryId) setSelectedTreasuryId(initialTreasuryId);
    if (initialPaymentMethod) setSelectedPaymentMethod(initialPaymentMethod);
  }, [initialStartDate, initialEndDate, initialTreasuryId, initialPaymentMethod]);

  // Quick Date Range Presets
  const applyPreset = (preset: 'today' | 'this_week' | 'this_month' | 'last_month' | 'last_30_days' | 'this_quarter' | 'this_year' | 'all') => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    let start = '';
    let end = todayStr;

    if (preset === 'today') {
      start = todayStr;
      end = todayStr;
    } else if (preset === 'this_week') {
      const dayOfWeek = today.getDay();
      const diffToSat = (dayOfWeek + 1) % 7;
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - diffToSat);
      start = startOfWeek.toISOString().slice(0, 10);
      end = todayStr;
    } else if (preset === 'this_month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
    } else if (preset === 'last_month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 10);
      end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().slice(0, 10);
    } else if (preset === 'last_30_days') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      start = past30.toISOString().slice(0, 10);
      end = todayStr;
    } else if (preset === 'this_quarter') {
      const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
      start = new Date(today.getFullYear(), quarterMonth, 1).toISOString().slice(0, 10);
      end = new Date(today.getFullYear(), quarterMonth + 3, 0).toISOString().slice(0, 10);
    } else if (preset === 'this_year') {
      start = `${today.getFullYear()}-01-01`;
      end = `${today.getFullYear()}-12-31`;
    } else if (preset === 'all') {
      start = '';
      end = '';
    }

    setLocalStartDate(start);
    setLocalEndDate(end);
  };

  // Helper date checker
  const isDateInRange = (dateStr?: string) => {
    if (!dateStr) return true;
    const itemDate = dateStr.slice(0, 10);
    if (localStartDate && itemDate < localStartDate) return false;
    if (localEndDate && itemDate > localEndDate) return false;
    return true;
  };

  // Helper payment method matcher
  const isMatchingMethod = (method: string) => {
    if (!selectedPaymentMethod || selectedPaymentMethod === 'all') return true;
    if (selectedPaymentMethod === 'cash') return method === 'cash';
    if (selectedPaymentMethod === 'bank_transfer') return method === 'bank_transfer';
    if (selectedPaymentMethod === 'electronic_gateway') {
      return (
        method === 'electronic_gateway' ||
        method === 'electronic' ||
        method === 'pos' ||
        method === 'pos_card' ||
        method === 'credit_card'
      );
    }
    if (selectedPaymentMethod === 'pos') return method === 'pos' || method === 'pos_card';
    if (selectedPaymentMethod === 'check') return method === 'check' || method === 'cheque';
    return method === selectedPaymentMethod;
  };

  // Filtered Datasets based on Date Range, Selected Treasury, and Payment Method
  const filteredInflows = useMemo(() => {
    return transactions.filter((trx) => {
      if (trx.type !== 'inflow') return false;
      const matchTreasury = selectedTreasuryId === 'all' || trx.treasuryId === selectedTreasuryId;
      const matchPayment = isMatchingMethod(trx.paymentMethod);
      return matchTreasury && matchPayment && isDateInRange(trx.date);
    });
  }, [transactions, selectedTreasuryId, selectedPaymentMethod, localStartDate, localEndDate]);

  const filteredOutflows = useMemo(() => {
    return transactions.filter((trx) => {
      if (trx.type !== 'outflow') return false;
      // Do not duplicate operating expense transactions if user views expenses separately
      if (trx.category === 'operating_expense') return false;
      const matchTreasury = selectedTreasuryId === 'all' || trx.treasuryId === selectedTreasuryId;
      const matchPayment = isMatchingMethod(trx.paymentMethod);
      return matchTreasury && matchPayment && isDateInRange(trx.date);
    });
  }, [transactions, selectedTreasuryId, selectedPaymentMethod, localStartDate, localEndDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchTreasury = selectedTreasuryId === 'all' || exp.treasuryId === selectedTreasuryId;
      const matchPayment = isMatchingMethod(exp.paymentMethod);
      return matchTreasury && matchPayment && isDateInRange(exp.date);
    });
  }, [expenses, selectedTreasuryId, selectedPaymentMethod, localStartDate, localEndDate]);

  const filteredTransfers = useMemo(() => {
    return transfers.filter((trf) => {
      const matchTreasury =
        selectedTreasuryId === 'all' ||
        trf.fromTreasuryId === selectedTreasuryId ||
        trf.toTreasuryId === selectedTreasuryId;
      return matchTreasury && isDateInRange(trf.date);
    });
  }, [transfers, selectedTreasuryId, localStartDate, localEndDate]);

  // Aggregate Totals
  const totalInflows = useMemo(() => {
    return filteredInflows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredInflows]);

  const totalExpensesBase = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalExpensesTax = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.taxAmount) || 0), 0);
  }, [filteredExpenses]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.totalWithTax) || 0), 0);
  }, [filteredExpenses]);

  const totalOutflows = useMemo(() => {
    return filteredOutflows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredOutflows]);

  const totalTransfersAmount = useMemo(() => {
    return filteredTransfers.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredTransfers]);

  const netCashFlow = totalInflows - (totalExpenses + totalOutflows);

  const selectedTreasuryObj = useMemo(() => {
    if (selectedTreasuryId === 'all') return null;
    return treasuries.find((tr) => tr.id === selectedTreasuryId) || null;
  }, [treasuries, selectedTreasuryId]);

  // Translate category labels
  const getCategoryName = (cat: string) => {
    const map: Record<string, string> = {
      rental_revenue: lang === 'ar' ? 'إيرادات إيجارات' : 'Rental Revenue',
      deposit_received: lang === 'ar' ? 'استلام تأمين' : 'Security Deposit',
      sale_revenue: lang === 'ar' ? 'مبيعات سيارات' : 'Car Sales',
      delivery_fee: lang === 'ar' ? 'رسوم توصيل' : 'Delivery Fees',
      penalty_collection: lang === 'ar' ? 'مخالفات وغرامات' : 'Fines & Penalties',
      capital_deposit: lang === 'ar' ? 'تغذية رأسمال' : 'Capital Deposit',
      deposit_refund: lang === 'ar' ? 'استرداد تأمين' : 'Deposit Refund',
      operating_expense: lang === 'ar' ? 'مصروفات تشغيلية' : 'Operating Expense',
      maintenance_payout: lang === 'ar' ? 'صيانة وقطع غيار' : 'Maintenance & Parts',
      supplier_payout: lang === 'ar' ? 'سداد موردين' : 'Supplier Payout',
      owner_withdrawal: lang === 'ar' ? 'سحب أرباح ملاك' : 'Owner Withdrawal',
      rent: lang === 'ar' ? 'إيجار مقار وفروع' : 'Office Rent',
      utilities: lang === 'ar' ? 'كهرباء ومياه' : 'Utilities',
      internet_phone: lang === 'ar' ? 'اتصالات وإنترنت' : 'Internet & Telecom',
      fuel_oil: lang === 'ar' ? 'محروقات وبنزين' : 'Fuel & Gas',
      cleaning_hospitality: lang === 'ar' ? 'نظافة وضيافة' : 'Cleaning & Hospitality',
      office_supplies: lang === 'ar' ? 'أدوات مكتبية ومطبوعات' : 'Office Supplies',
      salaries_wages: lang === 'ar' ? 'رواتب وعمولات' : 'Salaries & Wages',
      government_fees: lang === 'ar' ? 'رسوم وتراخيص حكومية' : 'Government Fees',
      marketing_ads: lang === 'ar' ? 'دعاية وتسويق' : 'Marketing & Ads',
      insurance: lang === 'ar' ? 'تأمين ورخص' : 'Insurance',
      other: lang === 'ar' ? 'أخرى ونثريات' : 'Other Expenses',
    };
    return map[cat] || cat;
  };

  const getMethodName = (m: string) => {
    const map: Record<string, string> = {
      cash: lang === 'ar' ? 'نقداً (كاش)' : 'Cash',
      bank_transfer: lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer',
      electronic_gateway: lang === 'ar' ? 'بوابة دفع إلكتروني' : 'Electronic Gateway',
      pos: lang === 'ar' ? 'بطاقة مدى / POS' : 'POS / Mada',
      pos_card: lang === 'ar' ? 'بطاقة مدى / POS' : 'POS / Card',
      credit_card: lang === 'ar' ? 'بطاقة ائتمان' : 'Credit Card',
      cheque: lang === 'ar' ? 'شيك بنكي' : 'Cheque',
      check: lang === 'ar' ? 'شيك بنكي' : 'Cheque',
      electronic: lang === 'ar' ? 'سداد إلكتروني' : 'Electronic',
    };
    return map[m] || m;
  };

  // Payment Breakdown Stats by classification (Cash, Bank Transfer, Electronic Gateway)
  const paymentBreakdown = useMemo(() => {
    const isGateway = (m: string) =>
      m === 'electronic_gateway' || m === 'electronic' || m === 'pos' || m === 'pos_card' || m === 'credit_card';

    // Cash
    const cashIn = filteredInflows.filter((t) => t.paymentMethod === 'cash').reduce((s, t) => s + Number(t.amount || 0), 0);
    const cashExp = filteredExpenses.filter((e) => e.paymentMethod === 'cash').reduce((s, e) => s + Number(e.totalWithTax || 0), 0);
    const cashOut = filteredOutflows.filter((t) => t.paymentMethod === 'cash').reduce((s, t) => s + Number(t.amount || 0), 0);
    const cashCount =
      filteredInflows.filter((t) => t.paymentMethod === 'cash').length +
      filteredExpenses.filter((e) => e.paymentMethod === 'cash').length +
      filteredOutflows.filter((t) => t.paymentMethod === 'cash').length;

    // Bank Transfer
    const bankIn = filteredInflows.filter((t) => t.paymentMethod === 'bank_transfer').reduce((s, t) => s + Number(t.amount || 0), 0);
    const bankExp = filteredExpenses.filter((e) => e.paymentMethod === 'bank_transfer').reduce((s, e) => s + Number(e.totalWithTax || 0), 0);
    const bankOut = filteredOutflows.filter((t) => t.paymentMethod === 'bank_transfer').reduce((s, t) => s + Number(t.amount || 0), 0);
    const bankCount =
      filteredInflows.filter((t) => t.paymentMethod === 'bank_transfer').length +
      filteredExpenses.filter((e) => e.paymentMethod === 'bank_transfer').length +
      filteredOutflows.filter((t) => t.paymentMethod === 'bank_transfer').length;

    // Electronic Gateway
    const gatewayIn = filteredInflows.filter((t) => isGateway(t.paymentMethod)).reduce((s, t) => s + Number(t.amount || 0), 0);
    const gatewayExp = filteredExpenses.filter((e) => isGateway(e.paymentMethod)).reduce((s, e) => s + Number(e.totalWithTax || 0), 0);
    const gatewayOut = filteredOutflows.filter((t) => isGateway(t.paymentMethod)).reduce((s, t) => s + Number(t.amount || 0), 0);
    const gatewayCount =
      filteredInflows.filter((t) => isGateway(t.paymentMethod)).length +
      filteredExpenses.filter((e) => isGateway(e.paymentMethod)).length +
      filteredOutflows.filter((t) => isGateway(t.paymentMethod)).length;

    return {
      cash: { in: cashIn, out: cashExp + cashOut, net: cashIn - (cashExp + cashOut), count: cashCount },
      bank: { in: bankIn, out: bankExp + bankOut, net: bankIn - (bankExp + bankOut), count: bankCount },
      gateway: { in: gatewayIn, out: gatewayExp + gatewayOut, net: gatewayIn - (gatewayExp + gatewayOut), count: gatewayCount },
    };
  }, [filteredInflows, filteredExpenses, filteredOutflows]);

  // Actions: Print, PDF, Excel
  const handlePrint = () => {
    triggerBrowserPrint('printable-treasury-financial-report');
  };

  const handlePdfExport = async () => {
    setIsExportingPdf(true);
    try {
      const fileName = `تقرير-الخزينة-المفصل-${localStartDate || 'البداية'}_إلى_${localEndDate || 'اليوم'}`;
      await exportElementToPdf('printable-treasury-financial-report', fileName);
    } catch (e) {
      console.error('PDF generation error:', e);
      triggerBrowserPrint('printable-treasury-financial-report');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExcelExport = () => {
    const fileName = `تقرير-الخزينة-${localStartDate || 'البداية'}_إلى_${localEndDate || 'اليوم'}.xls`;
    const exportRows: any[] = [];

    // Inflows
    filteredInflows.forEach((item) => {
      exportRows.push({
        section: lang === 'ar' ? 'وارد (قبض)' : 'Inflow',
        number: item.transactionNumber,
        date: item.date,
        treasury: item.treasuryName,
        party: item.partyName,
        category: getCategoryName(item.category),
        method: getMethodName(item.paymentMethod),
        desc: item.description,
        amount: Number(item.amount),
        tax: 0,
        total: Number(item.amount),
      });
    });

    // Expenses
    filteredExpenses.forEach((item) => {
      exportRows.push({
        section: lang === 'ar' ? 'مصروف تشغيلي' : 'Expense',
        number: item.expenseNumber,
        date: item.date,
        treasury: item.treasuryName,
        party: item.beneficiary,
        category: getCategoryName(item.category),
        method: getMethodName(item.paymentMethod),
        desc: `${item.title} ${item.carPlate ? `(مركبة: ${item.carPlate})` : ''}`,
        amount: Number(item.amount),
        tax: Number(item.taxAmount),
        total: Number(item.totalWithTax),
      });
    });

    // Transfers
    filteredTransfers.forEach((item) => {
      exportRows.push({
        section: lang === 'ar' ? 'تحويل بين الخزائن' : 'Transfer',
        number: item.transferNumber,
        date: item.date,
        treasury: `${item.fromTreasuryName} ⬅ ${item.toTreasuryName}`,
        party: lang === 'ar' ? 'تحويل داخلي' : 'Internal Transfer',
        category: lang === 'ar' ? 'تحويل سيولة' : 'Cash Transfer',
        method: lang === 'ar' ? 'مناقلة داخلية' : 'Internal',
        desc: item.description,
        amount: Number(item.amount),
        tax: Number(item.transferFee || 0),
        total: Number(item.amount),
      });
    });

    // Outflows
    filteredOutflows.forEach((item) => {
      exportRows.push({
        section: lang === 'ar' ? 'منصرف (سند صرف)' : 'Outflow',
        number: item.transactionNumber,
        date: item.date,
        treasury: item.treasuryName,
        party: item.partyName,
        category: getCategoryName(item.category),
        method: getMethodName(item.paymentMethod),
        desc: item.description,
        amount: Number(item.amount),
        tax: 0,
        total: Number(item.amount),
      });
    });

    exportToExcel({
      fileName,
      sheetName: 'التقرير المالي المفصل',
      title: `${settings.organizationName || settings.appName || 'SHAKER MOTORS'} - التقرير المالي لحركة الخزائن والتدفقات النقدية`,
      subtitle: `الفترة من: ${localStartDate || 'البداية'} إلى: ${localEndDate || 'اليوم'} | الخزينة: ${selectedTreasuryObj ? selectedTreasuryObj.name : 'كافة الخزائن'} | طريقة الدفع: ${selectedPaymentMethod !== 'all' ? getMethodName(selectedPaymentMethod) : (lang === 'ar' ? 'كافة طرق الدفع' : 'All Methods')}`,
      columns: [
        { header: lang === 'ar' ? 'القسم' : 'Section', key: 'section' },
        { header: lang === 'ar' ? 'رقم الحركة' : 'Number', key: 'number' },
        { header: lang === 'ar' ? 'التاريخ' : 'Date', key: 'date' },
        { header: lang === 'ar' ? 'الخزينة / الحساب' : 'Treasury', key: 'treasury' },
        { header: lang === 'ar' ? 'المستفيد / العميل' : 'Party', key: 'party' },
        { header: lang === 'ar' ? 'التصنيف' : 'Category', key: 'category' },
        { header: lang === 'ar' ? 'طريقة الدفع' : 'Payment Method', key: 'method' },
        { header: lang === 'ar' ? 'البيان' : 'Description', key: 'desc' },
        { header: lang === 'ar' ? 'المبلغ الأساسي' : 'Amount', key: 'amount' },
        { header: lang === 'ar' ? 'الضريبة' : 'Tax', key: 'tax' },
        { header: lang === 'ar' ? 'الإجمالي' : 'Total', key: 'total' },
      ],
      data: exportRows,
      summaryRows: [
        { label: lang === 'ar' ? 'إجمالي الواردات' : 'Total Inflows', value: formatCurrency(totalInflows, currency, lang) },
        { label: lang === 'ar' ? 'إجمالي المصروفات التشغيلية' : 'Total Operating Expenses', value: formatCurrency(totalExpenses, currency, lang) },
        { label: lang === 'ar' ? 'إجمالي التحويلات الداخلية' : 'Total Internal Transfers', value: formatCurrency(totalTransfersAmount, currency, lang) },
        { label: lang === 'ar' ? 'إجمالي المنصرفات الأخرى' : 'Total Other Outflows', value: formatCurrency(totalOutflows, currency, lang) },
        { label: lang === 'ar' ? 'صافي التدفق النقدي للفترة' : 'Net Cash Flow', value: formatCurrency(netCashFlow, currency, lang) },
        { label: lang === 'ar' ? 'صافي السيولة النقدية (كاش)' : 'Net Cash (Cash Safe)', value: formatCurrency(paymentBreakdown.cash.net, currency, lang) },
        { label: lang === 'ar' ? 'صافي التحويلات البنكية' : 'Net Bank Transfers', value: formatCurrency(paymentBreakdown.bank.net, currency, lang) },
        { label: lang === 'ar' ? 'صافي بوابات الدفع الإلكتروني' : 'Net Electronic Gateways', value: formatCurrency(paymentBreakdown.gateway.net, currency, lang) },
      ],
    });
  };

  const periodLabel =
    localStartDate && localEndDate
      ? `${lang === 'ar' ? 'من' : 'From'} ${localStartDate} ${lang === 'ar' ? 'إلى' : 'To'} ${localEndDate}`
      : localStartDate
      ? `${lang === 'ar' ? 'من تاريخ' : 'From'} ${localStartDate}`
      : localEndDate
      ? `${lang === 'ar' ? 'حتى تاريخ' : 'Until'} ${localEndDate}`
      : lang === 'ar' ? 'كافة الفترات المسجلة' : 'All Recorded Time';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[96vh] overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-2xl border border-blue-500/40">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black flex items-center gap-2">
                <span>{lang === 'ar' ? 'تقرير حركة الخزينة والتدفق المالي المفصل' : 'Treasury & Cash Flow Financial Statement'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono">
                  {periodLabel}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'ar'
                  ? 'تقرير محاسبي معتمد يشمل كافة الواردات والمصروفات والتحويلات مع الطباعة والتصدير'
                  : 'Comprehensive certified financial report with full inflows, expenses, and transfers'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExcelExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title={lang === 'ar' ? 'تصدير لإكسيل' : 'Export Excel'}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إكسيل' : 'Excel'}</span>
            </button>

            <button
              type="button"
              onClick={handlePdfExport}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
              title={lang === 'ar' ? 'تنزيل التقرير بصيغة PDF' : 'Download PDF Report'}
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? (lang === 'ar' ? 'جاري التصدير...' : 'Exporting...') : 'PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة التقرير (Print)' : 'Print Report'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title={lang === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Period Controls Toolbar (Hidden on Print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-3 print:hidden">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Date Pickers */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs shadow-xs">
                <span className="text-slate-500 font-bold">{lang === 'ar' ? 'من:' : 'From:'}</span>
                <input
                  type="date"
                  value={localStartDate}
                  onChange={(e) => setLocalStartDate(e.target.value)}
                  className="bg-transparent font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs shadow-xs">
                <span className="text-slate-500 font-bold">{lang === 'ar' ? 'إلى:' : 'To:'}</span>
                <input
                  type="date"
                  value={localEndDate}
                  onChange={(e) => setLocalEndDate(e.target.value)}
                  className="bg-transparent font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              {/* Treasury Selector */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs shadow-xs">
                <Wallet className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-500 font-bold">{lang === 'ar' ? 'الخزينة:' : 'Treasury:'}</span>
                <select
                  value={selectedTreasuryId}
                  onChange={(e) => setSelectedTreasuryId(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden"
                >
                  <option value="all">{lang === 'ar' ? '🏛️ كافة الخزائن والحسابات' : 'All Treasuries'}</option>
                  {treasuries.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name} ({formatCurrency(tr.currentBalance, currency, lang)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method Selector */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs shadow-xs">
                <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-slate-500 font-bold">{lang === 'ar' ? 'طريقة الدفع:' : 'Payment:'}</span>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">{lang === 'ar' ? '🏛️ كافة طرق الدفع' : 'All Methods'}</option>
                  <option value="cash">{lang === 'ar' ? '💵 نقدي (كاش)' : 'Cash'}</option>
                  <option value="bank_transfer">{lang === 'ar' ? '🏦 تحويل بنكي' : 'Bank Transfer'}</option>
                  <option value="electronic_gateway">{lang === 'ar' ? '🌐 بوابة دفع إلكتروني' : 'Electronic Gateway'}</option>
                  <option value="pos">{lang === 'ar' ? '💳 بطاقة مدى / POS' : 'POS / Mada'}</option>
                  <option value="check">{lang === 'ar' ? '📜 شيك بنكي' : 'Cheque'}</option>
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="text-slate-400 text-2xs hidden sm:inline">{lang === 'ar' ? 'فترات سريعة:' : 'Presets:'}</span>
              <button
                type="button"
                onClick={() => applyPreset('today')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {lang === 'ar' ? 'اليوم' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('this_week')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {lang === 'ar' ? 'هذا الأسبوع' : 'Week'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('this_month')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {lang === 'ar' ? 'هذا الشهر' : 'Month'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('last_month')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {lang === 'ar' ? 'الشهر الماضي' : 'Last Month'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('this_quarter')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {lang === 'ar' ? 'الربع الحالي' : 'Quarter'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('this_year')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {lang === 'ar' ? 'هذه السنة' : 'Year'}
              </button>
              <button
                type="button"
                onClick={() => applyPreset('all')}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {lang === 'ar' ? 'الكل' : 'All'}
              </button>
            </div>
          </div>

          {/* Section Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 font-bold px-1">{lang === 'ar' ? 'عرض التقرير:' : 'View Section:'}</span>
            <button
              type="button"
              onClick={() => setReportSection('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                reportSection === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              📑 {lang === 'ar' ? 'التقرير الشامل (كافة الأقسام)' : 'Comprehensive Statement'}
            </button>

            <button
              type="button"
              onClick={() => setReportSection('inflow')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                reportSection === 'inflow'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              📥 {lang === 'ar' ? 'الواردات والمقبوضات فقط' : 'Inflows Only'} ({filteredInflows.length})
            </button>

            <button
              type="button"
              onClick={() => setReportSection('expense')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                reportSection === 'expense'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              🧾 {lang === 'ar' ? 'المصروفات التشغيلية فقط' : 'Expenses Only'} ({filteredExpenses.length})
            </button>

            <button
              type="button"
              onClick={() => setReportSection('transfer')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                reportSection === 'transfer'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              🔄 {lang === 'ar' ? 'التحويلات بين الخزائن فقط' : 'Transfers Only'} ({filteredTransfers.length})
            </button>

            <button
              type="button"
              onClick={() => setReportSection('outflow')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                reportSection === 'outflow'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              📤 {lang === 'ar' ? 'المنصرفات وسندات الصرف' : 'Outflows Only'} ({filteredOutflows.length})
            </button>
          </div>
        </div>

        {/* Scrollable Report Content Area (Prints perfectly) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/60 print:overflow-visible print:p-0 print:bg-white">
          
          {/* Printable Element Wrapper with precise ID */}
          <div
            id="printable-treasury-financial-report"
            className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-5xl mx-auto space-y-6 print:border-none print:shadow-none print:p-4 print:max-w-none print:rounded-none"
          >
            {/* Header with Official Company Identity */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl">
                    SM
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">
                      {settings.organizationName || settings.appName || 'SHAKER MOTORS'}
                    </h1>
                    <p className="text-xs font-bold text-slate-600">
                      {lang === 'ar' ? 'نظام إدارة الخزائن والتدفقات النقدية والمحاسبة' : 'Automated Fleet & Financial Management System'}
                    </p>
                  </div>
                </div>
                {settings.commercialRegistration && (
                  <p className="text-xs text-slate-500 font-mono">
                    <span className="font-bold">{lang === 'ar' ? 'س.ت:' : 'CR:'}</span> {settings.commercialRegistration}
                    {settings.taxId && (
                      <span className="mx-2">
                        | <span className="font-bold">{lang === 'ar' ? 'الرقم الضريبي:' : 'VAT:'}</span> {settings.taxId}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="text-left rtl:text-right space-y-1">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black rounded-lg">
                  {lang === 'ar' ? 'تقرير مالي معتمد' : 'Certified Financial Statement'}
                </span>
                <div className="text-2xs text-slate-500 font-mono space-y-0.5 mt-1">
                  <div>
                    <span className="font-bold">{lang === 'ar' ? 'تاريخ الطباعة:' : 'Print Date:'}</span> {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <span className="font-bold">{lang === 'ar' ? 'المستخدم المصدر:' : 'Generated By:'}</span> {currentUser?.fullName || currentUser?.username || 'مدير النظام'}
                  </div>
                  <div>
                    <span className="font-bold">{lang === 'ar' ? 'نطاق التقرير:' : 'Scope:'}</span> {selectedTreasuryObj ? selectedTreasuryObj.name : (lang === 'ar' ? 'كافة الخزائن والحسابات' : 'All Accounts')}
                  </div>
                </div>
              </div>
            </div>

            {/* Title & Filter Summary Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {lang === 'ar' ? 'كشف تفصيلي لحركات الخزينة والتدفقات النقدية' : 'Detailed Treasury & Cash Movement Statement'}
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  <span className="font-bold">{lang === 'ar' ? 'الفترة الزمنية:' : 'Period:'}</span>{' '}
                  <span className="font-mono font-bold text-blue-800">{periodLabel}</span>
                  {selectedTreasuryObj && (
                    <span className="mx-2 text-slate-600">
                      | <span className="font-bold">{lang === 'ar' ? 'الخزينة المحددة:' : 'Treasury:'}</span> {selectedTreasuryObj.name} ({selectedTreasuryObj.code})
                    </span>
                  )}
                  {selectedPaymentMethod !== 'all' && (
                    <span className="mx-2 text-purple-700 font-bold">
                      | <span className="font-bold">{lang === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}</span> {getMethodName(selectedPaymentMethod)}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-2xs font-bold text-slate-500 block">{lang === 'ar' ? 'صافي السيولة النقدية' : 'Net Cash Flow'}</span>
                  <span className={`text-base font-black font-mono ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow, currency, lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI Cards Ribbon for Report */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-2xs font-bold text-emerald-800 block">{lang === 'ar' ? '📥 إجمالي الواردات' : 'Total Inflows'}</span>
                <span className="text-sm font-black font-mono text-emerald-950 mt-1 block">
                  {formatCurrency(totalInflows, currency, lang)}
                </span>
                <span className="text-3xs text-emerald-700 font-mono mt-0.5 block">{filteredInflows.length} {lang === 'ar' ? 'حركة' : 'items'}</span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-2xs font-bold text-amber-800 block">{lang === 'ar' ? '🧾 المصروفات التشغيلية' : 'Total Expenses'}</span>
                <span className="text-sm font-black font-mono text-amber-950 mt-1 block">
                  {formatCurrency(totalExpenses, currency, lang)}
                </span>
                <span className="text-3xs text-amber-700 font-mono mt-0.5 block">{filteredExpenses.length} {lang === 'ar' ? 'مصروف (شامل الضريبة)' : 'expenses'}</span>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-2xs font-bold text-blue-800 block">{lang === 'ar' ? '🔄 التحويلات بين الخزائن' : 'Transfers Volume'}</span>
                <span className="text-sm font-black font-mono text-blue-950 mt-1 block">
                  {formatCurrency(totalTransfersAmount, currency, lang)}
                </span>
                <span className="text-3xs text-blue-700 font-mono mt-0.5 block">{filteredTransfers.length} {lang === 'ar' ? 'تحويل' : 'transfers'}</span>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-2xs font-bold text-rose-800 block">{lang === 'ar' ? '📤 المنصرفات الأخرى' : 'Other Outflows'}</span>
                <span className="text-sm font-black font-mono text-rose-950 mt-1 block">
                  {formatCurrency(totalOutflows, currency, lang)}
                </span>
                <span className="text-3xs text-rose-700 font-mono mt-0.5 block">{filteredOutflows.length} {lang === 'ar' ? 'سند صرف' : 'outflows'}</span>
              </div>

              <div className={`p-3 border rounded-xl ${netCashFlow >= 0 ? 'bg-teal-50 border-teal-200' : 'bg-red-50 border-red-200'}`}>
                <span className={`text-2xs font-bold block ${netCashFlow >= 0 ? 'text-teal-800' : 'text-red-800'}`}>
                  {lang === 'ar' ? '⚖️ الفائض / العجز' : 'Net Surplus/Deficit'}
                </span>
                <span className={`text-sm font-black font-mono mt-1 block ${netCashFlow >= 0 ? 'text-teal-950' : 'text-red-950'}`}>
                  {formatCurrency(netCashFlow, currency, lang)}
                </span>
                <span className="text-3xs text-slate-600 font-bold mt-0.5 block">
                  {netCashFlow >= 0 ? (lang === 'ar' ? 'فائض نقدي' : 'Surplus') : (lang === 'ar' ? 'عجز نقدي' : 'Deficit')}
                </span>
              </div>
            </div>

            {/* Classification Breakdown: Cash, Bank Transfer, Electronic Payment Gateway */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                  <span>{lang === 'ar' ? '📊 ملخص التدفقات المالية حسب تصنيفات الدفع المعتمدة (نقدي / تحويل بنكي / بوابة دفع إلكتروني):' : 'Financial Flow by Payment Classification:'}</span>
                </h4>
                <span className="text-3xs font-mono text-slate-400">
                  {paymentBreakdown.cash.count + paymentBreakdown.bank.count + paymentBreakdown.gateway.count} {lang === 'ar' ? 'إجمالي الحركات المفحوصة' : 'total items'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Cash */}
                <div className="p-3 bg-white rounded-xl border border-emerald-200/90 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1.5 pb-1 border-b border-emerald-100">
                    <span className="flex items-center gap-1">💵 {lang === 'ar' ? 'المدفوعات النقدية' : 'Cash Payments'}</span>
                    <span className="text-3xs font-mono px-2 py-0.5 bg-emerald-50 rounded-md text-emerald-700 font-bold">{paymentBreakdown.cash.count} {lang === 'ar' ? 'حركة' : 'tx'}</span>
                  </div>
                  <div className="space-y-1 text-2xs font-mono">
                    <div className="flex items-center justify-between text-emerald-700">
                      <span className="text-slate-500">{lang === 'ar' ? 'إجمالي الوارد:' : 'Inflow:'}</span>
                      <span className="font-bold">+{formatCurrency(paymentBreakdown.cash.in, currency, lang)}</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-700">
                      <span className="text-slate-500">{lang === 'ar' ? 'إجمالي المنصرف:' : 'Outflow:'}</span>
                      <span className="font-bold">-{formatCurrency(paymentBreakdown.cash.out, currency, lang)}</span>
                    </div>
                    <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between font-bold">
                      <span className="text-slate-700">{lang === 'ar' ? 'الصافي النقدي:' : 'Net Cash:'}</span>
                      <span className={`text-xs ${paymentBreakdown.cash.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {paymentBreakdown.cash.net >= 0 ? '+' : ''}{formatCurrency(paymentBreakdown.cash.net, currency, lang)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Bank Transfer */}
                <div className="p-3 bg-white rounded-xl border border-blue-200/90 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-800 mb-1.5 pb-1 border-b border-blue-100">
                    <span className="flex items-center gap-1">🏦 {lang === 'ar' ? 'التحويلات البنكية' : 'Bank Transfers'}</span>
                    <span className="text-3xs font-mono px-2 py-0.5 bg-blue-50 rounded-md text-blue-700 font-bold">{paymentBreakdown.bank.count} {lang === 'ar' ? 'حركة' : 'tx'}</span>
                  </div>
                  <div className="space-y-1 text-2xs font-mono">
                    <div className="flex items-center justify-between text-emerald-700">
                      <span className="text-slate-500">{lang === 'ar' ? 'إجمالي الوارد:' : 'Inflow:'}</span>
                      <span className="font-bold">+{formatCurrency(paymentBreakdown.bank.in, currency, lang)}</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-700">
                      <span className="text-slate-500">{lang === 'ar' ? 'إجمالي المنصرف:' : 'Outflow:'}</span>
                      <span className="font-bold">-{formatCurrency(paymentBreakdown.bank.out, currency, lang)}</span>
                    </div>
                    <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between font-bold">
                      <span className="text-slate-700">{lang === 'ar' ? 'الصافي البنكي:' : 'Net Bank:'}</span>
                      <span className={`text-xs ${paymentBreakdown.bank.net >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                        {paymentBreakdown.bank.net >= 0 ? '+' : ''}{formatCurrency(paymentBreakdown.bank.net, currency, lang)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Electronic Gateway */}
                <div className="p-3 bg-white rounded-xl border border-purple-200/90 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-800 mb-1.5 pb-1 border-b border-purple-100">
                    <span className="flex items-center gap-1">🌐 {lang === 'ar' ? 'بوابة الدفع الإلكتروني' : 'Electronic Gateway'}</span>
                    <span className="text-3xs font-mono px-2 py-0.5 bg-purple-50 rounded-md text-purple-700 font-bold">{paymentBreakdown.gateway.count} {lang === 'ar' ? 'حركة' : 'tx'}</span>
                  </div>
                  <div className="space-y-1 text-2xs font-mono">
                    <div className="flex items-center justify-between text-emerald-700">
                      <span className="text-slate-500">{lang === 'ar' ? 'إجمالي الوارد:' : 'Inflow:'}</span>
                      <span className="font-bold">+{formatCurrency(paymentBreakdown.gateway.in, currency, lang)}</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-700">
                      <span className="text-slate-500">{lang === 'ar' ? 'إجمالي المنصرف:' : 'Outflow:'}</span>
                      <span className="font-bold">-{formatCurrency(paymentBreakdown.gateway.out, currency, lang)}</span>
                    </div>
                    <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between font-bold">
                      <span className="text-slate-700">{lang === 'ar' ? 'الصافي الإلكتروني:' : 'Net Electronic:'}</span>
                      <span className={`text-xs ${paymentBreakdown.gateway.net >= 0 ? 'text-purple-700' : 'text-rose-700'}`}>
                        {paymentBreakdown.gateway.net >= 0 ? '+' : ''}{formatCurrency(paymentBreakdown.gateway.net, currency, lang)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 1: INFLOWS TABLE */}
            {(reportSection === 'all' || reportSection === 'inflow') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-1.5">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'ar' ? 'أولاً: بيان الواردات والمقبوضات المالية (سندات القبض)' : '1. Inflows & Receipt Vouchers'}</span>
                  </h3>
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    {lang === 'ar' ? 'المجموع:' : 'Subtotal:'} {formatCurrency(totalInflows, currency, lang)}
                  </span>
                </div>

                {filteredInflows.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg">
                    {lang === 'ar' ? 'لا توجد حركات وارد مسجلة خلال الفترة المحددة.' : 'No inflow records for the selected period.'}
                  </p>
                ) : (
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-300 text-2xs">
                        <th className="py-2 px-2.5">#</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'رقم السند' : 'Voucher #'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'الخزينة' : 'Treasury'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'العميل / المصدر' : 'Party'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'التصنيف' : 'Category'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'طريقة الدفع' : 'Method'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'البيان' : 'Description'}</th>
                        <th className="py-2 px-2.5 text-left">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredInflows.map((trx, idx) => (
                        <tr key={trx.id} className="hover:bg-slate-50 font-medium">
                          <td className="py-2 px-2.5 text-slate-400 text-3xs font-mono">{idx + 1}</td>
                          <td className="py-2 px-2.5 font-bold font-mono text-emerald-800">{trx.transactionNumber}</td>
                          <td className="py-2 px-2.5 font-mono text-slate-600">{trx.date}</td>
                          <td className="py-2 px-2.5 text-slate-800">{trx.treasuryName}</td>
                          <td className="py-2 px-2.5 font-bold text-slate-900">{trx.partyName}</td>
                          <td className="py-2 px-2.5 text-slate-600">{getCategoryName(trx.category)}</td>
                          <td className="py-2 px-2.5 text-slate-600">{getMethodName(trx.paymentMethod)}</td>
                          <td className="py-2 px-2.5 text-slate-500 max-w-[200px] truncate">{trx.description}</td>
                          <td className="py-2 px-2.5 font-bold font-mono text-emerald-700 text-left">
                            {formatCurrency(trx.amount, currency, lang)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50/70 border-t-2 border-emerald-600 font-bold text-emerald-950">
                        <td colSpan={8} className="py-2 px-2.5 text-right font-black">
                          {lang === 'ar' ? 'إجمالي المقبوضات والواردات:' : 'Total Inflows:'}
                        </td>
                        <td className="py-2 px-2.5 text-left font-mono font-black text-sm">
                          {formatCurrency(totalInflows, currency, lang)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}

            {/* SECTION 2: OPERATING EXPENSES TABLE */}
            {(reportSection === 'all' || reportSection === 'expense') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b-2 border-amber-600 pb-1.5">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'ar' ? 'ثانياً: بيان المصروفات التشغيلية والنثريات والفواتير' : '2. Operating Expenses & Invoices'}</span>
                  </h3>
                  <span className="text-xs font-bold text-amber-700 font-mono">
                    {lang === 'ar' ? 'المجموع شامل الضريبة:' : 'Subtotal (Incl. VAT):'} {formatCurrency(totalExpenses, currency, lang)}
                  </span>
                </div>

                {filteredExpenses.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg">
                    {lang === 'ar' ? 'لا توجد مصروفات مسجلة خلال الفترة المحددة.' : 'No expense records for the selected period.'}
                  </p>
                ) : (
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-300 text-2xs">
                        <th className="py-2 px-2.5">#</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'رقم المصروف' : 'Ref #'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'الخزينة' : 'Treasury'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'طريقة السداد' : 'Method'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'بند المصروف' : 'Title / Category'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'المورد / المستفيد' : 'Vendor'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'رقم الفاتورة' : 'Inv #'}</th>
                        <th className="py-2 px-2.5 text-left">{lang === 'ar' ? 'المبلغ الصافي' : 'Base'}</th>
                        <th className="py-2 px-2.5 text-left">{lang === 'ar' ? 'الضريبة' : 'VAT'}</th>
                        <th className="py-2 px-2.5 text-left">{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredExpenses.map((exp, idx) => (
                        <tr key={exp.id} className="hover:bg-slate-50 font-medium">
                          <td className="py-2 px-2.5 text-slate-400 text-3xs font-mono">{idx + 1}</td>
                          <td className="py-2 px-2.5 font-bold font-mono text-amber-800">{exp.expenseNumber}</td>
                          <td className="py-2 px-2.5 font-mono text-slate-600">{exp.date}</td>
                          <td className="py-2 px-2.5 text-slate-800">{exp.treasuryName}</td>
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            <span className="inline-block px-2 py-0.5 rounded-md text-3xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {getMethodName(exp.paymentMethod)}
                            </span>
                          </td>
                          <td className="py-2 px-2.5">
                            <span className="font-bold text-slate-900 block">{exp.title}</span>
                            <span className="text-3xs text-slate-500">{getCategoryName(exp.category)} {exp.carPlate ? `(${exp.carPlate})` : ''}</span>
                          </td>
                          <td className="py-2 px-2.5 text-slate-800 font-medium">{exp.beneficiary}</td>
                          <td className="py-2 px-2.5 font-mono text-slate-600">{exp.invoiceNumber || '-'}</td>
                          <td className="py-2 px-2.5 font-mono text-slate-700 text-left">{formatCurrency(exp.amount, currency, lang)}</td>
                          <td className="py-2 px-2.5 font-mono text-slate-500 text-left">
                            {exp.taxAmount > 0 ? formatCurrency(exp.taxAmount, currency, lang) : '-'}
                          </td>
                          <td className="py-2 px-2.5 font-bold font-mono text-amber-800 text-left">
                            {formatCurrency(exp.totalWithTax, currency, lang)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-amber-50/70 border-t-2 border-amber-600 font-bold text-amber-950">
                        <td colSpan={8} className="py-2 px-2.5 text-right font-black">
                          {lang === 'ar' ? 'إجمالي المصروفات التشغيلية (الصافي + الضريبة):' : 'Total Expenses:'}
                        </td>
                        <td className="py-2 px-2.5 text-left font-mono font-bold">{formatCurrency(totalExpensesBase, currency, lang)}</td>
                        <td className="py-2 px-2.5 text-left font-mono font-bold text-amber-800">{formatCurrency(totalExpensesTax, currency, lang)}</td>
                        <td className="py-2 px-2.5 text-left font-mono font-black text-sm text-amber-950">{formatCurrency(totalExpenses, currency, lang)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}

            {/* SECTION 3: INTERNAL TRANSFERS TABLE */}
            {(reportSection === 'all' || reportSection === 'transfer') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b-2 border-blue-600 pb-1.5">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-4 h-4 text-blue-600" />
                    <span>{lang === 'ar' ? 'ثالثاً: بيان التحويلات والمناقلات النقدية بين الخزائن والحسابات' : '3. Internal Account Transfers'}</span>
                  </h3>
                  <span className="text-xs font-bold text-blue-700 font-mono">
                    {lang === 'ar' ? 'حجم التحويلات:' : 'Total Volume:'} {formatCurrency(totalTransfersAmount, currency, lang)}
                  </span>
                </div>

                {filteredTransfers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg">
                    {lang === 'ar' ? 'لا توجد تحويلات بين الخزائن خلال الفترة المحددة.' : 'No transfers for the selected period.'}
                  </p>
                ) : (
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-300 text-2xs">
                        <th className="py-2 px-2.5">#</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'رقم التحويل' : 'Transfer #'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'من خزينة' : 'From'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'إلى خزينة' : 'To'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'البيان' : 'Description'}</th>
                        <th className="py-2 px-2.5">{lang === 'ar' ? 'بواسطة' : 'User'}</th>
                        <th className="py-2 px-2.5 text-left">{lang === 'ar' ? 'رسوم التحويل' : 'Fee'}</th>
                        <th className="py-2 px-2.5 text-left">{lang === 'ar' ? 'المبلغ المحول' : 'Amount'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredTransfers.map((trf, idx) => (
                        <tr key={trf.id} className="hover:bg-slate-50 font-medium">
                          <td className="py-2 px-2.5 text-slate-400 text-3xs font-mono">{idx + 1}</td>
                          <td className="py-2 px-2.5 font-bold font-mono text-blue-800">{trf.transferNumber}</td>
                          <td className="py-2 px-2.5 font-mono text-slate-600">{trf.date}</td>
                          <td className="py-2 px-2.5 font-bold text-rose-700">{trf.fromTreasuryName}</td>
                          <td className="py-2 px-2.5 font-bold text-emerald-700">{trf.toTreasuryName}</td>
                          <td className="py-2 px-2.5 text-slate-500 max-w-[200px] truncate">{trf.description}</td>
                          <td className="py-2 px-2.5 text-slate-600">{trf.transferredBy}</td>
                          <td className="py-2 px-2.5 font-mono text-slate-500 text-left">
                            {trf.transferFee ? formatCurrency(trf.transferFee, currency, lang) : '-'}
                          </td>
                          <td className="py-2 px-2.5 font-bold font-mono text-blue-800 text-left">
                            {formatCurrency(trf.amount, currency, lang)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50/70 border-t-2 border-blue-600 font-bold text-blue-950">
                        <td colSpan={8} className="py-2 px-2.5 text-right font-black">
                          {lang === 'ar' ? 'إجمالي المبالغ المحولة بين الخزائن والحسابات:' : 'Total Transferred Amount:'}
                        </td>
                        <td className="py-2 px-2.5 text-left font-mono font-black text-sm text-blue-950">
                          {formatCurrency(totalTransfersAmount, currency, lang)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}

            {/* SECTION 4: OTHER OUTFLOWS TABLE */}
            {(reportSection === 'all' || reportSection === 'outflow') && filteredOutflows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b-2 border-rose-600 pb-1.5">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                    <span>{lang === 'ar' ? 'رابعاً: بيان سندات الصرف والمدفوعات الأخرى' : '4. Other Outflow Vouchers'}</span>
                  </h3>
                  <span className="text-xs font-bold text-rose-700 font-mono">
                    {lang === 'ar' ? 'المجموع:' : 'Subtotal:'} {formatCurrency(totalOutflows, currency, lang)}
                  </span>
                </div>

                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-300 text-2xs">
                      <th className="py-2 px-2.5">#</th>
                      <th className="py-2 px-2.5">{lang === 'ar' ? 'رقم السند' : 'Voucher #'}</th>
                      <th className="py-2 px-2.5">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                      <th className="py-2 px-2.5">{lang === 'ar' ? 'الخزينة' : 'Treasury'}</th>
                      <th className="py-2 px-2.5">{lang === 'ar' ? 'طريقة الصرف' : 'Method'}</th>
                      <th className="py-2 px-2.5">{lang === 'ar' ? 'المستفيد' : 'Beneficiary'}</th>
                      <th className="py-2 px-2.5">{lang === 'ar' ? 'التصنيف' : 'Category'}</th>
                      <th className="py-2 px-2.5">{lang === 'ar' ? 'البيان' : 'Description'}</th>
                      <th className="py-2 px-2.5 text-left">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredOutflows.map((trx, idx) => (
                      <tr key={trx.id} className="hover:bg-slate-50 font-medium">
                        <td className="py-2 px-2.5 text-slate-400 text-3xs font-mono">{idx + 1}</td>
                        <td className="py-2 px-2.5 font-bold font-mono text-rose-800">{trx.transactionNumber}</td>
                        <td className="py-2 px-2.5 font-mono text-slate-600">{trx.date}</td>
                        <td className="py-2 px-2.5 text-slate-800">{trx.treasuryName}</td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-md text-3xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {getMethodName(trx.paymentMethod)}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 font-bold text-slate-900">{trx.partyName}</td>
                        <td className="py-2 px-2.5 text-slate-600">{getCategoryName(trx.category)}</td>
                        <td className="py-2 px-2.5 text-slate-500 max-w-[200px] truncate">{trx.description}</td>
                        <td className="py-2 px-2.5 font-bold font-mono text-rose-700 text-left">
                          {formatCurrency(trx.amount, currency, lang)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-rose-50/70 border-t-2 border-rose-600 font-bold text-rose-950">
                      <td colSpan={8} className="py-2 px-2.5 text-right font-black">
                        {lang === 'ar' ? 'إجمالي سندات الصرف الأخرى:' : 'Total Other Outflows:'}
                      </td>
                      <td className="py-2 px-2.5 text-left font-mono font-black text-sm">
                        {formatCurrency(totalOutflows, currency, lang)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* SECTION 5: CURRENT TREASURY BALANCES SNAPSHOT */}
            {reportSection === 'all' && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between border-b-2 border-slate-700 pb-1.5">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    <span>{lang === 'ar' ? 'خامساً: موقف السيولة والأرصدة الحالية لجميع الخزائن والحسابات' : '5. Current Account Balances Snapshot'}</span>
                  </h3>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {lang === 'ar' ? 'إجمالي السيولة الحالية:' : 'Total Current Liquidity:'}{' '}
                    {formatCurrency(
                      treasuries.reduce((s, t) => s + (Number(t.currentBalance) || 0), 0),
                      currency,
                      lang
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {treasuries.map((tr) => (
                    <div key={tr.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{tr.name}</span>
                        <span className="text-3xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">{tr.code}</span>
                      </div>
                      <div className="text-2xs text-slate-500">
                        {tr.responsiblePerson ? `${lang === 'ar' ? 'المسؤول:' : 'Resp:'} ${tr.responsiblePerson}` : tr.branchName}
                      </div>
                      <div className="pt-1 flex items-center justify-between border-t border-slate-200">
                        <span className="text-2xs text-slate-400 font-bold">{lang === 'ar' ? 'الرصيد اللحظي:' : 'Balance:'}</span>
                        <span className="font-black font-mono text-slate-900">{formatCurrency(tr.currentBalance, currency, lang)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Signatures & Verification Block */}
            <div className="border-t-2 border-slate-900 pt-6 mt-8">
              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                <div className="space-y-8">
                  <span className="font-bold text-slate-800 block">{lang === 'ar' ? 'المحاسب المسؤول' : 'Accountant'}</span>
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
                  <span className="text-2xs text-slate-500 block">{lang === 'ar' ? 'التوقيع والختم' : 'Signature'}</span>
                </div>

                <div className="space-y-8">
                  <span className="font-bold text-slate-800 block">{lang === 'ar' ? 'أمين الخزينة / العهد' : 'Treasury Custodian'}</span>
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
                  <span className="text-2xs text-slate-500 block">{lang === 'ar' ? 'التوقيع والختم' : 'Signature'}</span>
                </div>

                <div className="space-y-8">
                  <span className="font-bold text-slate-800 block">{lang === 'ar' ? 'المدير المالي / اعتماد الإدارة' : 'Financial Controller'}</span>
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
                  <span className="text-2xs text-slate-500 block">{lang === 'ar' ? 'التوقيع والختم الرسمي' : 'Official Seal'}</span>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-3xs text-slate-400 font-mono">
                <span>{settings.organizationName || settings.appName} - {lang === 'ar' ? 'نظام أوتوفليت برو المتطور' : 'AutoFleet Pro'}</span>
                <span>{lang === 'ar' ? 'صفحة التقرير المالي المعتمد' : 'Official Treasury Statement Page'}</span>
                <span>{new Date().toISOString()}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
