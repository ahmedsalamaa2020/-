import React, { useState, useMemo } from 'react';
import {
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Receipt,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  Wallet,
  Building2,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  Clock,
  Trash2,
  Edit2,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  User,
  Tag,
  Calendar,
  Globe,
  BookOpen,
  Coins,
  Calculator,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  TreasuryAccount,
  TreasuryTransaction,
  TreasuryTransfer,
  OperatingExpense,
  ExpenseCategory,
  Currency,
  Language,
  SystemUser,
  RentalContract,
  Invoice,
  Car,
  AppSettings,
} from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { triggerBrowserPrint } from '../utils/pdfExport';
import { exportToExcel } from '../utils/excelExport';
import { PrintTreasuryReportModal } from './PrintTreasuryReportModal';
import { PrintCashDaybookModal } from './PrintCashDaybookModal';

interface TreasuryModuleProps {
  treasuries: TreasuryAccount[];
  transactions: TreasuryTransaction[];
  transfers: TreasuryTransfer[];
  expenses: OperatingExpense[];
  onAddTreasury: (treasury: Omit<TreasuryAccount, 'id' | 'createdAt'>) => void;
  onUpdateTreasury: (treasury: TreasuryAccount) => void;
  onDeleteTreasury: (id: string) => void;
  onAddTransaction: (trx: Omit<TreasuryTransaction, 'id' | 'createdAt'>) => void;
  onUpdateTransaction?: (trx: TreasuryTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddTransfer: (transfer: Omit<TreasuryTransfer, 'id' | 'createdAt'>) => void;
  onUpdateTransfer?: (transfer: TreasuryTransfer) => void;
  onDeleteTransfer?: (id: string) => void;
  onAddExpense: (expense: Omit<OperatingExpense, 'id' | 'createdAt'>) => void;
  onUpdateExpense?: (expense: OperatingExpense) => void;
  onDeleteExpense: (id: string) => void;
  contracts: RentalContract[];
  invoices: Invoice[];
  cars: Car[];
  settings: AppSettings;
  currency: Currency;
  lang: Language;
  currentUser: SystemUser | null;
}

export const TreasuryModule: React.FC<TreasuryModuleProps> = ({
  treasuries,
  transactions,
  transfers,
  expenses,
  onAddTreasury,
  onUpdateTreasury,
  onDeleteTreasury,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddTransfer,
  onUpdateTransfer,
  onDeleteTransfer,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  contracts,
  invoices,
  cars,
  settings,
  currency,
  lang,
  currentUser,
}) => {
  const t = translations[lang];

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'daybook' | 'inflow_outflow' | 'transfers' | 'expenses' | 'ledger'>('daybook');

  // Daybook States
  const [daybookDate, setDaybookDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [daybookTreasuryFilter, setDaybookTreasuryFilter] = useState<string>('all');
  const [daybookNotes, setDaybookNotes] = useState('');
  const [isDaybookPrintModalOpen, setIsDaybookPrintModalOpen] = useState(false);
  const [isDaybookAuditModalOpen, setIsDaybookAuditModalOpen] = useState(false);
  const [daybookDenominations, setDaybookDenominations] = useState({
    d500: 0,
    d200: 0,
    d100: 0,
    d50: 0,
    d20: 0,
    d10: 0,
    d5: 0,
    d1: 0,
  });
  const [customActualCount, setCustomActualCount] = useState<number | null>(null);

  // Edit / Delete Modal States
  const [editingTreasury, setEditingTreasury] = useState<TreasuryAccount | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<TreasuryTransaction | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<TreasuryTransfer | null>(null);
  const [editingExpense, setEditingExpense] = useState<OperatingExpense | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    type: 'treasury' | 'transaction' | 'transfer' | 'expense';
    id: string;
    title: string;
    description: string;
    warning?: string;
  } | null>(null);

  // Filters
  const [selectedTreasuryFilter, setSelectedTreasuryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  });

  // Modal States
  const [isTreasuryModalOpen, setIsTreasuryModalOpen] = useState(false);
  const [isInflowModalOpen, setIsInflowModalOpen] = useState(false);
  const [isOutflowModalOpen, setIsOutflowModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<any | null>(null);

  // Form States for Treasury Account
  const [treasuryForm, setTreasuryForm] = useState({
    name: '',
    code: '',
    type: 'cash_safe' as TreasuryAccount['type'],
    bankName: '',
    accountNumber: '',
    initialBalance: 0,
    currentBalance: 0,
    currency: currency,
    responsiblePerson: '',
    branchName: 'الفرع الرئيسي',
    notes: '',
    isActive: true,
  });

  // Form States for Inflow / Outflow
  const [trxForm, setTrxForm] = useState({
    treasuryId: treasuries[0]?.id || '',
    amount: 1000,
    category: 'rental_revenue',
    paymentMethod: 'cash' as const,
    partyName: '',
    date: new Date().toISOString().slice(0, 10),
    referenceNumber: '',
    description: '',
  });

  // Form States for Transfer
  const [transferForm, setTransferForm] = useState({
    fromTreasuryId: treasuries[0]?.id || '',
    toTreasuryId: treasuries[1]?.id || '',
    amount: 5000,
    transferFee: 0,
    date: new Date().toISOString().slice(0, 10),
    referenceNumber: '',
    description: '',
  });

  // Form States for Operating Expense
  const [expenseForm, setExpenseForm] = useState({
    treasuryId: treasuries[0]?.id || '',
    category: 'fuel_oil' as ExpenseCategory,
    title: '',
    amount: 500,
    taxRate: 15,
    paymentMethod: 'cash' as const,
    beneficiary: '',
    invoiceNumber: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
    carId: '',
  });

  // Calculations & KPIs
  const totalLiquidity = useMemo(() => {
    return treasuries.reduce((sum, tr) => sum + (Number(tr.currentBalance) || 0), 0);
  }, [treasuries]);

  // Helper for matching payment method filters
  const isMatchingPaymentMethod = (method?: string, filter?: string) => {
    if (!filter || filter === 'all') return true;
    if (!method) return false;
    if (filter === 'cash') return method === 'cash';
    if (filter === 'bank_transfer') return method === 'bank_transfer';
    if (filter === 'electronic_gateway') {
      return (
        method === 'electronic_gateway' ||
        method === 'electronic' ||
        method === 'pos' ||
        method === 'pos_card' ||
        method === 'credit_card'
      );
    }
    if (filter === 'pos') return method === 'pos' || method === 'pos_card';
    if (filter === 'check') return method === 'check' || method === 'cheque';
    return method === filter;
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      const matchTreasury = selectedTreasuryFilter === 'all' || trx.treasuryId === selectedTreasuryFilter;
      const matchType = typeFilter === 'all' || trx.type === typeFilter;
      const matchPayment = isMatchingPaymentMethod(trx.paymentMethod, paymentMethodFilter);
      const matchDate = (!startDate || trx.date >= startDate) && (!endDate || trx.date <= endDate);
      const matchSearch =
        !searchTerm ||
        trx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trx.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trx.transactionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trx.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTreasury && matchType && matchPayment && matchDate && matchSearch;
    });
  }, [transactions, selectedTreasuryFilter, typeFilter, paymentMethodFilter, startDate, endDate, searchTerm]);

  const periodInflows = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'inflow')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filteredTransactions]);

  const periodOutflows = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'outflow')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filteredTransactions]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchTreasury = selectedTreasuryFilter === 'all' || exp.treasuryId === selectedTreasuryFilter;
      const matchCategory = expenseCategoryFilter === 'all' || exp.category === expenseCategoryFilter;
      const matchPayment = isMatchingPaymentMethod(exp.paymentMethod, paymentMethodFilter);
      const matchDate = (!startDate || exp.date >= startDate) && (!endDate || exp.date <= endDate);
      const matchSearch =
        !searchTerm ||
        exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.beneficiary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.invoiceNumber && exp.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchTreasury && matchCategory && matchPayment && matchDate && matchSearch;
    });
  }, [expenses, selectedTreasuryFilter, expenseCategoryFilter, paymentMethodFilter, startDate, endDate, searchTerm]);

  const periodExpensesTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (Number(exp.totalWithTax) || 0), 0);
  }, [filteredExpenses]);

  const filteredTransfers = useMemo(() => {
    return transfers.filter((trf) => {
      const matchTreasury =
        selectedTreasuryFilter === 'all' ||
        trf.fromTreasuryId === selectedTreasuryFilter ||
        trf.toTreasuryId === selectedTreasuryFilter;
      const matchDate = (!startDate || trf.date >= startDate) && (!endDate || trf.date <= endDate);
      const matchSearch =
        !searchTerm ||
        trf.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trf.transferNumber.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTreasury && matchDate && matchSearch;
    });
  }, [transfers, selectedTreasuryFilter, startDate, endDate, searchTerm]);

  const periodTransfersTotal = useMemo(() => {
    return filteredTransfers.reduce((sum, trf) => sum + (Number(trf.amount) || 0), 0);
  }, [filteredTransfers]);

  const netCashFlow = periodInflows - (periodOutflows + periodExpensesTotal);

  // ==========================================
  // DAYBOOK (دفتر يومية النقدية) CALCULATIONS
  // ==========================================
  const denominationsTotal = useMemo(() => {
    return (
      daybookDenominations.d500 * 500 +
      daybookDenominations.d200 * 200 +
      daybookDenominations.d100 * 100 +
      daybookDenominations.d50 * 50 +
      daybookDenominations.d20 * 20 +
      daybookDenominations.d10 * 10 +
      daybookDenominations.d5 * 5 +
      daybookDenominations.d1 * 1
    );
  }, [daybookDenominations]);

  // Daily Transactions for the selected daybookDate
  const daybookTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      const matchDate = trx.date === daybookDate;
      const matchTreasury = daybookTreasuryFilter === 'all' || trx.treasuryId === daybookTreasuryFilter;
      return matchDate && matchTreasury;
    });
  }, [transactions, daybookDate, daybookTreasuryFilter]);

  const daybookInflow = useMemo(() => {
    return daybookTransactions
      .filter((t) => t.type === 'inflow')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [daybookTransactions]);

  const daybookOutflow = useMemo(() => {
    return daybookTransactions
      .filter((t) => t.type === 'outflow')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [daybookTransactions]);

  const daybookNetFlow = daybookInflow - daybookOutflow;

  // Opening Balance at 00:00 of daybookDate
  const daybookOpeningBalance = useMemo(() => {
    let base = 0;
    if (daybookTreasuryFilter === 'all') {
      base = treasuries.reduce((sum, tr) => sum + (Number(tr.initialBalance) || 0), 0);
    } else {
      const found = treasuries.find((tr) => tr.id === daybookTreasuryFilter);
      base = found ? Number(found.initialBalance) || 0 : 0;
    }

    // All transactions strictly before daybookDate
    const priorTransactions = transactions.filter((trx) => {
      const isBefore = trx.date < daybookDate;
      const matchTreasury = daybookTreasuryFilter === 'all' || trx.treasuryId === daybookTreasuryFilter;
      return isBefore && matchTreasury;
    });

    const priorDelta = priorTransactions.reduce((acc, trx) => {
      const amt = Number(trx.amount) || 0;
      return trx.type === 'inflow' ? acc + amt : acc - amt;
    }, 0);

    // Prior internal transfers if filtering a specific safe
    let transferDelta = 0;
    if (daybookTreasuryFilter !== 'all') {
      transfers.forEach((trf) => {
        if (trf.date < daybookDate) {
          const amt = Number(trf.amount) || 0;
          if (trf.toTreasuryId === daybookTreasuryFilter) transferDelta += amt;
          if (trf.fromTreasuryId === daybookTreasuryFilter) transferDelta -= amt;
        }
      });
    }

    return base + priorDelta + transferDelta;
  }, [treasuries, transactions, transfers, daybookDate, daybookTreasuryFilter]);

  const daybookClosingBalance = daybookOpeningBalance + daybookNetFlow;

  const actualDaybookCount =
    customActualCount !== null
      ? customActualCount
      : denominationsTotal > 0
      ? denominationsTotal
      : daybookClosingBalance;

  const daybookVariance = actualDaybookCount - daybookClosingBalance;

  // Running balance for daybook rows
  const daybookTransactionsWithRunning = useMemo(() => {
    let run = daybookOpeningBalance;
    return daybookTransactions.map((trx) => {
      if (trx.type === 'inflow') {
        run += Number(trx.amount);
      } else {
        run -= Number(trx.amount);
      }
      return {
        ...trx,
        runningBalance: run,
      };
    });
  }, [daybookTransactions, daybookOpeningBalance]);

  // Daybook Date Navigation
  const handleDaybookPrevDay = () => {
    const d = new Date(daybookDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setDaybookDate(d.toISOString().slice(0, 10));
  };

  const handleDaybookNextDay = () => {
    const d = new Date(daybookDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setDaybookDate(d.toISOString().slice(0, 10));
  };

  const handleDaybookToday = () => {
    setDaybookDate(new Date().toISOString().slice(0, 10));
  };

  const handleExportDaybookExcel = () => {
    exportToExcel({
      fileName: `Cash-Daybook-${daybookDate}.xls`,
      sheetName: 'Cash Daybook',
      title: lang === 'ar' ? 'دفتر يومية النقدية وحركة الصندوق' : 'Daily Cash Daybook',
      subtitle: `${daybookDate} (${daybookTreasuryFilter === 'all' ? 'كافة الخزائن' : treasuries.find(t => t.id === daybookTreasuryFilter)?.name || ''})`,
      columns: [
        { header: lang === 'ar' ? 'رقم السند' : 'Ref #', key: 'ref' },
        { header: lang === 'ar' ? 'الخزينة' : 'Treasury', key: 'treasury' },
        { header: lang === 'ar' ? 'النوع' : 'Type', key: 'type' },
        { header: lang === 'ar' ? 'التصنيف' : 'Category', key: 'category' },
        { header: lang === 'ar' ? 'الطرف / العميل' : 'Party', key: 'party' },
        { header: lang === 'ar' ? 'البيان' : 'Description', key: 'desc' },
        { header: lang === 'ar' ? 'طريقة الدفع' : 'Method', key: 'method' },
        { header: lang === 'ar' ? 'وارد (+)' : 'Inflow', key: 'inflow' },
        { header: lang === 'ar' ? 'منصرف (-)' : 'Outflow', key: 'outflow' },
        { header: lang === 'ar' ? 'الرصيد اللحظي' : 'Balance', key: 'balance' },
      ],
      data: daybookTransactionsWithRunning.map((trx) => ({
        ref: trx.transactionNumber,
        treasury: trx.treasuryName,
        type: trx.type === 'inflow' ? (lang === 'ar' ? 'وارد (قبض)' : 'Inflow') : (lang === 'ar' ? 'منصرف (صرف)' : 'Outflow'),
        category: trx.category,
        party: trx.partyName,
        desc: trx.description,
        method: trx.paymentMethod,
        inflow: trx.type === 'inflow' ? trx.amount : 0,
        outflow: trx.type === 'outflow' ? trx.amount : 0,
        balance: trx.runningBalance,
      })),
      summaryRows: [
        { label: lang === 'ar' ? 'رصيد بداية اليوم' : 'Opening Balance', value: formatCurrency(daybookOpeningBalance, currency, lang) },
        { label: lang === 'ar' ? 'إجمالي الوارد اليومي' : 'Total Inflow', value: formatCurrency(daybookInflow, currency, lang) },
        { label: lang === 'ar' ? 'إجمالي المنصرف اليومي' : 'Total Outflow', value: formatCurrency(daybookOutflow, currency, lang) },
        { label: lang === 'ar' ? 'صافي حركة اليوم' : 'Net Flow', value: formatCurrency(daybookNetFlow, currency, lang) },
        { label: lang === 'ar' ? 'الرصيد الدفتري الختامي' : 'Book Closing Balance', value: formatCurrency(daybookClosingBalance, currency, lang) },
        { label: lang === 'ar' ? 'الجرد الفعلي للنقدية' : 'Physical Cash Count', value: formatCurrency(actualDaybookCount, currency, lang) },
        { label: lang === 'ar' ? 'فارق الجرد' : 'Variance', value: formatCurrency(daybookVariance, currency, lang) },
      ],
    });
  };

  // Helper Labels
  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      rental_revenue: lang === 'ar' ? 'إيراد إيجار سيارات' : 'Rental Revenue',
      deposit_received: lang === 'ar' ? 'استلام تأمين نقدي' : 'Deposit Received',
      sale_revenue: lang === 'ar' ? 'إيراد بيع سيارات' : 'Vehicle Sale Revenue',
      delivery_fee: lang === 'ar' ? 'رسوم توصيل ونقل' : 'Delivery Fee',
      penalty_collection: lang === 'ar' ? 'تحصيل غرامات ومخالفات' : 'Fines & Penalties',
      capital_deposit: lang === 'ar' ? 'تغذية نقدية ورأس مال' : 'Capital Deposit',
      deposit_refund: lang === 'ar' ? 'استرداد تأمين للعميل' : 'Deposit Refund',
      operating_expense: lang === 'ar' ? 'مصروفات تشغيلية' : 'Operating Expense',
      maintenance_payout: lang === 'ar' ? 'سداد صيانة وقطع غيار' : 'Maintenance Payout',
      supplier_payout: lang === 'ar' ? 'سداد مستحقات مورد' : 'Supplier Payout',
      owner_withdrawal: lang === 'ar' ? 'سحب أرباح ملاك' : 'Owner Withdrawal',
      rent: lang === 'ar' ? 'إيجار مقار ومعارض' : 'Showroom Rent',
      utilities: lang === 'ar' ? 'كهرباء ومياه وخدمات' : 'Electricity & Utilities',
      telecom_internet: lang === 'ar' ? 'اتصالات وإنترنت' : 'Telecom & Internet',
      fuel_oil: lang === 'ar' ? 'بنزين ومحروقات' : 'Fuel & Oil',
      cleaning_hospitality: lang === 'ar' ? 'نظافة وضيافة' : 'Hospitality & Cleaning',
      office_supplies: lang === 'ar' ? 'مطبوعات وأدوات مكتبية' : 'Office Supplies',
      marketing_ads: lang === 'ar' ? 'دعاية وتسويق' : 'Marketing & Ads',
      salaries_commissions: lang === 'ar' ? 'رواتب وبدلات' : 'Salaries & Staff',
      government_fees: lang === 'ar' ? 'رسوم حكومية ورخص' : 'Government & Licenses',
      vehicle_insurance: lang === 'ar' ? 'تأمين سيارات' : 'Vehicle Insurance',
      it_software: lang === 'ar' ? 'برمجيات وسيرفرات' : 'Software & Tech',
      legal_accounting: lang === 'ar' ? 'أتعاب محاسبية وقانونية' : 'Legal & Accounting',
      other_expense: lang === 'ar' ? 'نثريات ومصروفات أخرى' : 'Other Expense',
    };
    return labels[cat] || cat;
  };

  const getTreasuryTypeBadge = (type: TreasuryAccount['type']) => {
    switch (type) {
      case 'bank_account':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            <Building2 className="w-3 h-3" />
            {lang === 'ar' ? 'حساب بنكي' : 'Bank Account'}
          </span>
        );
      case 'pos_terminal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
            <CreditCard className="w-3 h-3" />
            {lang === 'ar' ? 'جهاز نقاط بيع (POS)' : 'POS Terminal'}
          </span>
        );
      case 'petty_cash':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            <Banknote className="w-3 h-3" />
            {lang === 'ar' ? 'عهدة نقدية' : 'Petty Cash'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            <Wallet className="w-3 h-3" />
            {lang === 'ar' ? 'خزينة نقدية (كاش)' : 'Cash Safe'}
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (method?: string) => {
    switch (method) {
      case 'bank_transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>{lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</span>
          </span>
        );
      case 'electronic_gateway':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Globe className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>{lang === 'ar' ? 'بوابة دفع إلكتروني' : 'Electronic Gateway'}</span>
          </span>
        );
      case 'pos':
      case 'pos_card':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <CreditCard className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>{lang === 'ar' ? 'بطاقة مدى / POS' : 'POS / Mada'}</span>
          </span>
        );
      case 'check':
      case 'cheque':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
            <span>📜</span>
            <span>{lang === 'ar' ? 'شيك بنكي' : 'Check'}</span>
          </span>
        );
      case 'cash':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Banknote className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'ar' ? 'نقدي (كاش)' : 'Cash'}</span>
          </span>
        );
    }
  };

  // Handlers
  const handleSaveTreasury = (e: React.FormEvent) => {
    e.preventDefault();
    if (!treasuryForm.name) return;
    onAddTreasury({
      ...treasuryForm,
      code: treasuryForm.code || `TR-${Date.now().toString().slice(-4)}`,
      currentBalance: Number(treasuryForm.initialBalance) || 0,
      initialBalance: Number(treasuryForm.initialBalance) || 0,
    });
    setIsTreasuryModalOpen(false);
    setTreasuryForm({
      name: '',
      code: '',
      type: 'cash_safe',
      bankName: '',
      accountNumber: '',
      initialBalance: 0,
      currentBalance: 0,
      currency: currency,
      responsiblePerson: '',
      branchName: 'الفرع الرئيسي',
      notes: '',
      isActive: true,
    });
  };

  const handleSaveInflow = (e: React.FormEvent) => {
    e.preventDefault();
    const tr = treasuries.find((x) => x.id === trxForm.treasuryId);
    if (!tr || !trxForm.amount) return;

    const num = `TRX-IN-${Date.now().toString().slice(-4)}`;
    onAddTransaction({
      transactionNumber: num,
      treasuryId: tr.id,
      treasuryName: tr.name,
      type: 'inflow',
      category: trxForm.category,
      amount: Number(trxForm.amount),
      paymentMethod: trxForm.paymentMethod,
      date: trxForm.date,
      partyName: trxForm.partyName || (lang === 'ar' ? 'عميل نقدي' : 'Cash Client'),
      referenceNumber: trxForm.referenceNumber,
      description: trxForm.description || (lang === 'ar' ? 'توريد نقدية إلى الخزينة' : 'Cash Inflow'),
      runningBalanceAfter: Number(tr.currentBalance) + Number(trxForm.amount),
      registeredBy: currentUser?.fullName || currentUser?.username || 'admin',
    });
    setIsInflowModalOpen(false);
  };

  const handleSaveOutflow = (e: React.FormEvent) => {
    e.preventDefault();
    const tr = treasuries.find((x) => x.id === trxForm.treasuryId);
    if (!tr || !trxForm.amount) return;

    const num = `TRX-OUT-${Date.now().toString().slice(-4)}`;
    onAddTransaction({
      transactionNumber: num,
      treasuryId: tr.id,
      treasuryName: tr.name,
      type: 'outflow',
      category: trxForm.category,
      amount: Number(trxForm.amount),
      paymentMethod: trxForm.paymentMethod,
      date: trxForm.date,
      partyName: trxForm.partyName || (lang === 'ar' ? 'مستفيد' : 'Beneficiary'),
      referenceNumber: trxForm.referenceNumber,
      description: trxForm.description || (lang === 'ar' ? 'صرف نقدية من الخزينة' : 'Cash Outflow'),
      runningBalanceAfter: Number(tr.currentBalance) - Number(trxForm.amount),
      registeredBy: currentUser?.fullName || currentUser?.username || 'admin',
    });
    setIsOutflowModalOpen(false);
  };

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const fromTr = treasuries.find((x) => x.id === transferForm.fromTreasuryId);
    const toTr = treasuries.find((x) => x.id === transferForm.toTreasuryId);
    if (!fromTr || !toTr || fromTr.id === toTr.id || !transferForm.amount) return;

    const num = `TRF-${Date.now().toString().slice(-4)}`;
    onAddTransfer({
      transferNumber: num,
      fromTreasuryId: fromTr.id,
      fromTreasuryName: fromTr.name,
      toTreasuryId: toTr.id,
      toTreasuryName: toTr.name,
      amount: Number(transferForm.amount),
      transferFee: Number(transferForm.transferFee) || 0,
      date: transferForm.date,
      referenceNumber: transferForm.referenceNumber,
      description: transferForm.description || `تحويل من ${fromTr.name} إلى ${toTr.name}`,
      transferredBy: currentUser?.fullName || currentUser?.username || 'admin',
      status: 'completed',
    });
    setIsTransferModalOpen(false);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const tr = treasuries.find((x) => x.id === expenseForm.treasuryId);
    if (!tr || !expenseForm.title || !expenseForm.amount) return;

    const baseAmount = Number(expenseForm.amount);
    const taxRate = Number(expenseForm.taxRate) || 0;
    const taxAmount = (baseAmount * taxRate) / 100;
    const totalWithTax = baseAmount + taxAmount;
    const num = `EXP-${Date.now().toString().slice(-4)}`;

    const selectedCar = cars.find((c) => c.id === expenseForm.carId);

    onAddExpense({
      expenseNumber: num,
      treasuryId: tr.id,
      treasuryName: tr.name,
      category: expenseForm.category,
      title: expenseForm.title,
      amount: baseAmount,
      taxRate,
      taxAmount,
      totalWithTax,
      paymentMethod: expenseForm.paymentMethod,
      beneficiary: expenseForm.beneficiary || (lang === 'ar' ? 'مورد خدمات' : 'Vendor'),
      invoiceNumber: expenseForm.invoiceNumber,
      date: expenseForm.date,
      carId: selectedCar?.id,
      carPlate: selectedCar?.plateNumber,
      approvedBy: 'المدير المالي',
      registeredBy: currentUser?.fullName || currentUser?.username || 'admin',
      notes: expenseForm.notes,
    });
    setIsExpenseModalOpen(false);
  };

  // Save Edited Treasury Account
  const handleSaveEditTreasury = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTreasury) return;
    onUpdateTreasury(editingTreasury);
    setEditingTreasury(null);
  };

  // Save Edited Transaction
  const handleSaveEditTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    if (onUpdateTransaction) {
      onUpdateTransaction(editingTransaction);
    }
    setEditingTransaction(null);
  };

  // Save Edited Transfer
  const handleSaveEditTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransfer) return;
    if (onUpdateTransfer) {
      onUpdateTransfer(editingTransfer);
    }
    setEditingTransfer(null);
  };

  // Save Edited Operating Expense
  const handleSaveEditExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const baseAmount = Number(editingExpense.amount) || 0;
    const taxRate = Number(editingExpense.taxRate) || 0;
    const taxAmount = (baseAmount * taxRate) / 100;
    const totalWithTax = baseAmount + taxAmount;
    const updated = {
      ...editingExpense,
      amount: baseAmount,
      taxRate,
      taxAmount,
      totalWithTax,
    };
    if (onUpdateExpense) {
      onUpdateExpense(updated);
    }
    setEditingExpense(null);
  };

  // Confirm Delete Dispatcher
  const handleConfirmDelete = () => {
    if (!confirmDeleteModal) return;
    const { type, id } = confirmDeleteModal;
    if (type === 'treasury') {
      onDeleteTreasury(id);
    } else if (type === 'transaction') {
      onDeleteTransaction(id);
    } else if (type === 'transfer' && onDeleteTransfer) {
      onDeleteTransfer(id);
    } else if (type === 'expense') {
      onDeleteExpense(id);
    }
    setConfirmDeleteModal(null);
  };

  // Excel Export
  const handleExportExcel = () => {
    const getPaymentMethodText = (method?: string) => {
      switch (method) {
        case 'bank_transfer': return lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer';
        case 'electronic_gateway': return lang === 'ar' ? 'بوابة دفع إلكتروني' : 'Electronic Gateway';
        case 'pos':
        case 'pos_card': return lang === 'ar' ? 'بطاقة مدى / POS' : 'POS / Mada';
        case 'check':
        case 'cheque': return lang === 'ar' ? 'شيك بنكي' : 'Check';
        case 'cash':
        default: return lang === 'ar' ? 'نقدي (كاش)' : 'Cash';
      }
    };

    exportToExcel({
      fileName: `Treasury-Ledger-${new Date().toISOString().slice(0, 10)}.xls`,
      sheetName: 'Treasury Movement',
      title: lang === 'ar' ? 'كشف حساب حركة الخزينة والعهد' : 'Treasury & Cash Flow Ledger',
      subtitle: `${startDate} - ${endDate}`,
      columns: [
        { header: lang === 'ar' ? 'رقم الحركة' : 'Ref #', key: 'ref' },
        { header: lang === 'ar' ? 'التاريخ' : 'Date', key: 'date' },
        { header: lang === 'ar' ? 'الخزينة' : 'Treasury', key: 'treasury' },
        { header: lang === 'ar' ? 'طريقة الدفع' : 'Payment Method', key: 'method' },
        { header: lang === 'ar' ? 'النوع' : 'Type', key: 'type' },
        { header: lang === 'ar' ? 'البيان' : 'Description', key: 'desc' },
        { header: lang === 'ar' ? 'المستفيد / العميل' : 'Party', key: 'party' },
        { header: lang === 'ar' ? 'المبلغ' : 'Amount', key: 'amount' },
      ],
      data: filteredTransactions.map((trx) => ({
        ref: trx.transactionNumber,
        date: trx.date,
        treasury: trx.treasuryName,
        method: getPaymentMethodText(trx.paymentMethod),
        type: trx.type === 'inflow' ? (lang === 'ar' ? 'وارد (+)' : 'Inflow') : (lang === 'ar' ? 'منصرف (-)' : 'Outflow'),
        desc: trx.description,
        party: trx.partyName,
        amount: trx.amount,
      })),
      summaryRows: [
        { label: lang === 'ar' ? 'إجمالي الوارد' : 'Total Inflow', value: formatCurrency(periodInflows, currency, lang) },
        { label: lang === 'ar' ? 'إجمالي المنصرف' : 'Total Outflow', value: formatCurrency(periodOutflows, currency, lang) },
        { label: lang === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses', value: formatCurrency(periodExpensesTotal, currency, lang) },
        { label: lang === 'ar' ? 'صافي السيولة' : 'Net Cash Flow', value: formatCurrency(netCashFlow, currency, lang) },
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Module Title & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Landmark className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{lang === 'ar' ? 'إدارة الخزينة والعهد المالية' : 'Treasury & Cash Management'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold font-mono">
                {treasuries.length} {lang === 'ar' ? 'خزائن وحسابات' : 'Accounts'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'ar'
                ? 'متابعة دقيقة لأرصدة الخزائن والبنوك، حركات الوارد والمنصرف، التحويلات الداخلية، والمصروفات التشغيلية'
                : 'Real-time liquidity, inflow/outflow vouchers, internal transfers, and operational expenses'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Daybook Shortcut Button */}
          <button
            type="button"
            onClick={() => setActiveTab('daybook')}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            title={lang === 'ar' ? 'دفتر يومية النقدية وحركة الصندوق' : 'Daily Cash Daybook'}
          >
            <BookOpen className="w-4 h-4 text-emerald-200" />
            <span>{lang === 'ar' ? '📖 دفتر اليومية' : 'Cash Daybook'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsInflowModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>{lang === 'ar' ? '📥 تسجيل وارد (قبض)' : 'Record Inflow'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOutflowModalOpen(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{lang === 'ar' ? '📤 تسجيل منصرف (صرف)' : 'Record Outflow'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTransferModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>{lang === 'ar' ? '🔄 تحويل بين الخزائن' : 'Transfer'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>{lang === 'ar' ? '🧾 تسجيل مصروف' : 'Add Expense'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title={lang === 'ar' ? 'طباعة تقرير مالي مفصل وتصدير PDF' : 'Detailed Financial Statement & PDF'}
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ar' ? '📊 تقرير مالي مفصل (PDF)' : 'Financial Report (PDF)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTreasuryModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title={lang === 'ar' ? 'إضافة خزينة نقدية أو حساب بنكي' : 'Add Safe or Bank Account'}
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'خزينة جديدة' : 'New Account'}</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Liquid Balance */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
              {lang === 'ar' ? '💼 إجمالي السيولة الحالية' : 'Total Liquid Balance'}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {formatCurrency(totalLiquidity, currency, lang)}
            </span>
            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
              {treasuries.filter((t) => t.isActive).length} {lang === 'ar' ? 'حسابات مفعلة' : 'active accounts'}
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* 2. Total Inflow */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1 flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إجمالي الوارد (الفترة)' : 'Total Inflow'}</span>
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              +{formatCurrency(periodInflows, currency, lang)}
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {filteredTransactions.filter((t) => t.type === 'inflow').length} {lang === 'ar' ? 'سند قبض وتوريد' : 'receipts'}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* 3. Total Outflow */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block mb-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إجمالي المنصرف (الفترة)' : 'Total Outflow'}</span>
            </span>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
              -{formatCurrency(periodOutflows, currency, lang)}
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {filteredTransactions.filter((t) => t.type === 'outflow').length} {lang === 'ar' ? 'سند صرف واسترداد' : 'vouchers'}
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* 4. Total Operating Expenses */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-1 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'المصروفات التشغيلية' : 'Operating Expenses'}</span>
            </span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {formatCurrency(periodExpensesTotal, currency, lang)}
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {filteredExpenses.length} {lang === 'ar' ? 'فاتورة ومصروف مسجل' : 'bills logged'}
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        {/* 5. Net Cash Flow */}
        <div
          className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
            netCashFlow >= 0
              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              {lang === 'ar' ? '⚖️ صافي التدفق للفترة' : 'Net Period Cash Flow'}
            </span>
            <span
              className={`text-xl font-black font-mono ${
                netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {netCashFlow >= 0 ? '+' : ''}
              {formatCurrency(netCashFlow, currency, lang)}
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-bold">
              {netCashFlow >= 0 ? (lang === 'ar' ? 'فائض نقدي متاح' : 'Cash Surplus') : (lang === 'ar' ? 'عجز تدفق مؤقت' : 'Deficit')}
            </span>
          </div>
          <div
            className={`p-3 rounded-xl ${
              netCashFlow >= 0 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'
            }`}
          >
            <Banknote className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>{lang === 'ar' ? 'الخزائن والحسابات البنكية' : 'Treasuries & Banks'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10 dark:bg-white/10">
              {treasuries.length}
            </span>
          </button>

          {/* DAYBOOK TAB BUTTON */}
          <button
            type="button"
            onClick={() => setActiveTab('daybook')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'daybook'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ar' ? '📖 دفتر يومية النقدية' : 'Cash Daybook'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10 dark:bg-white/10">
              {daybookTransactions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inflow_outflow')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'inflow_outflow'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ar' ? 'حركات الوارد والمنصرف' : 'Inflow & Outflow'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10 dark:bg-white/10">
              {filteredTransactions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transfers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-blue-400" />
            <span>{lang === 'ar' ? 'التحويلات بين الخزائن' : 'Internal Transfers'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10 dark:bg-white/10">
              {filteredTransfers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>{lang === 'ar' ? 'المصروفات التشغيلية' : 'Operating Expenses'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10 dark:bg-white/10">
              {filteredExpenses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{lang === 'ar' ? 'كشف الحركة الشامل والرصيد' : 'Comprehensive Ledger'}</span>
          </button>
        </div>

        {/* Global Print & Excel Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تصدير إكسيل' : 'Excel'}</span>
          </button>

          <button
            type="button"
            onClick={() => triggerBrowserPrint()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'طباعة الكشف' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Date & Search Filter Bar for Active Tab Data */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute top-3 rtl:right-3 ltr:left-3 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'ar' ? 'بحث برقم الإيصال، البيان، المستفيد، أو الملاحظات...' : 'Search by reference, description, party...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rtl:pr-9 ltr:pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Treasury Selector */}
          <select
            value={selectedTreasuryFilter}
            onChange={(e) => setSelectedTreasuryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">{lang === 'ar' ? 'جميع الخزائن والحسابات' : 'All Treasuries'}</option>
            {treasuries.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.name} ({formatCurrency(tr.currentBalance, currency, lang)})
              </option>
            ))}
          </select>

          {/* Payment Method Selector */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="all">{lang === 'ar' ? '💳 كافة طرق الدفع' : 'All Payment Methods'}</option>
            <option value="cash">{lang === 'ar' ? '💵 نقدي (كاش)' : 'Cash'}</option>
            <option value="bank_transfer">{lang === 'ar' ? '🏦 تحويل بنكي' : 'Bank Transfer'}</option>
            <option value="electronic_gateway">{lang === 'ar' ? '🌐 بوابة دفع إلكتروني' : 'Electronic Gateway'}</option>
            <option value="pos">{lang === 'ar' ? '💳 بطاقة مدى / POS' : 'POS / Mada'}</option>
            <option value="check">{lang === 'ar' ? '📜 شيك بنكي' : 'Cheque'}</option>
          </select>

          {/* Date Range Controls */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span>{lang === 'ar' ? 'من:' : 'From:'}</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono"
            />
            <span>{lang === 'ar' ? 'إلى:' : 'To:'}</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono"
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: TREASURIES & BANK ACCOUNTS CARDS */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {treasuries.map((account) => {
              const accountTrx = transactions.filter((x) => x.treasuryId === account.id);
              const totalIn = accountTrx.filter((x) => x.type === 'inflow').reduce((s, x) => s + Number(x.amount), 0);
              const totalOut = accountTrx.filter((x) => x.type === 'outflow').reduce((s, x) => s + Number(x.amount), 0);

              return (
                <div
                  key={account.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-400 dark:hover:border-blue-700 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                            {account.code}
                          </span>
                          {getTreasuryTypeBadge(account.type)}
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-slate-100 text-base mt-1.5">
                          {account.name}
                        </h3>
                      </div>
                      {account.isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          {lang === 'ar' ? 'رئيسية' : 'Default'}
                        </span>
                      )}
                    </div>

                    {account.accountNumber && (
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 break-all">
                        <span className="font-bold block text-[10px] text-slate-400 uppercase">
                          {account.bankName ? account.bankName : (lang === 'ar' ? 'رقم الحساب / الآيبان:' : 'Account # / IBAN:')}
                        </span>
                        {account.accountNumber}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span>{lang === 'ar' ? 'المسؤول:' : 'Custodian:'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {account.responsiblePerson || (lang === 'ar' ? 'الإدارة المالية' : 'Finance')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{lang === 'ar' ? 'الفرع:' : 'Branch:'}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {account.branchName || (lang === 'ar' ? 'الفرع الرئيسي' : 'Main Branch')}
                      </span>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {lang === 'ar' ? 'الرصيد المتاح حالياً:' : 'Current Balance:'}
                      </span>
                      <span
                        className={`text-2xl font-black font-mono ${
                          account.currentBalance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-600'
                        }`}
                      >
                        {formatCurrency(account.currentBalance, currency, lang)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {lang === 'ar' ? 'وارد مسجل' : 'Inflows'}
                        </span>
                        +{formatCurrency(totalIn, currency, lang)}
                      </div>
                      <div className="text-rose-600 dark:text-rose-400 font-bold text-end">
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {lang === 'ar' ? 'منصرف مسجل' : 'Outflows'}
                        </span>
                        -{formatCurrency(totalOut, currency, lang)}
                      </div>
                    </div>
                  </div>

                  {/* Card Quick Actions */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTrxForm((prev) => ({ ...prev, treasuryId: account.id }));
                        setIsInflowModalOpen(true);
                      }}
                      className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-black transition text-center cursor-pointer"
                      title={lang === 'ar' ? 'تسجيل وارد (سند قبض)' : 'Record Inflow'}
                    >
                      + {lang === 'ar' ? 'قبض' : 'In'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTrxForm((prev) => ({ ...prev, treasuryId: account.id }));
                        setIsOutflowModalOpen(true);
                      }}
                      className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-black transition text-center cursor-pointer"
                      title={lang === 'ar' ? 'تسجيل منصرف (سند صرف)' : 'Record Outflow'}
                    >
                      - {lang === 'ar' ? 'صرف' : 'Out'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTreasuryFilter(account.id);
                        setActiveTab('ledger');
                      }}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition text-center cursor-pointer"
                      title={lang === 'ar' ? 'كشف حركة الخزينة' : 'Ledger'}
                    >
                      📋 {lang === 'ar' ? 'كشف' : 'Ledger'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTreasury(account)}
                      className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-black transition text-center cursor-pointer"
                      title={lang === 'ar' ? 'تعديل بيانات الخزينة والحساب' : 'Edit Account'}
                    >
                      <Edit2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDeleteModal({
                          type: 'treasury',
                          id: account.id,
                          title: account.name,
                          description: `هل أنت متأكد من حذف الخزينة (${account.name})؟`,
                          warning:
                            account.currentBalance !== 0
                              ? `تنبيه: يوجد رصيد حالي قدره (${formatCurrency(account.currentBalance, currency, lang)}) مسجل في هذه الخزينة!`
                              : undefined,
                        })
                      }
                      className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-black transition text-center cursor-pointer"
                      title={lang === 'ar' ? 'حذف الخزينة' : 'Delete Account'}
                    >
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: DAILY CASH DAYBOOK (دفتر يومية النقدية والصندوق) */}
      {/* ======================================================== */}
      {activeTab === 'daybook' && (
        <div className="space-y-6">
          {/* Daybook Control Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Date Navigator */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{lang === 'ar' ? 'تاريخ اليومية:' : 'Daybook Date:'}</span>
              </span>

              <button
                type="button"
                onClick={handleDaybookPrevDay}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title={lang === 'ar' ? 'اليوم السابق' : 'Previous Day'}
              >
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                <span>{lang === 'ar' ? 'السابق' : 'Prev'}</span>
              </button>

              <input
                type="date"
                value={daybookDate}
                onChange={(e) => setDaybookDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
              />

              <button
                type="button"
                onClick={handleDaybookNextDay}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title={lang === 'ar' ? 'اليوم التالي' : 'Next Day'}
              >
                <span>{lang === 'ar' ? 'التالي' : 'Next'}</span>
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
              </button>

              <button
                type="button"
                onClick={handleDaybookToday}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-black transition cursor-pointer"
              >
                {lang === 'ar' ? 'اليوم' : 'Today'}
              </button>
            </div>

            {/* Treasury Safe Selector & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={daybookTreasuryFilter}
                onChange={(e) => setDaybookTreasuryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">{lang === 'ar' ? 'كافة الخزائن وحسابات النقدية' : 'All Cash Safes & Accounts'}</option>
                {treasuries.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.name} ({getCategoryLabel(tr.type)})
                  </option>
                ))}
              </select>

              {/* Quick Record Inflow */}
              <button
                type="button"
                onClick={() => {
                  setTrxForm((prev) => ({
                    ...prev,
                    treasuryId: daybookTreasuryFilter === 'all' ? (treasuries[0]?.id || '') : daybookTreasuryFilter,
                    date: daybookDate,
                    paymentMethod: 'cash',
                  }));
                  setIsInflowModalOpen(true);
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>{lang === 'ar' ? 'وارد نقدي (+)' : 'Inflow (+)'}</span>
              </button>

              {/* Quick Record Outflow */}
              <button
                type="button"
                onClick={() => {
                  setTrxForm((prev) => ({
                    ...prev,
                    treasuryId: daybookTreasuryFilter === 'all' ? (treasuries[0]?.id || '') : daybookTreasuryFilter,
                    date: daybookDate,
                    paymentMethod: 'cash',
                  }));
                  setIsOutflowModalOpen(true);
                }}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{lang === 'ar' ? 'منصرف نقدي (-)' : 'Outflow (-)'}</span>
              </button>

              {/* Cash Denominations Audit Calculator */}
              <button
                type="button"
                onClick={() => setIsDaybookAuditModalOpen(true)}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title={lang === 'ar' ? 'حاسبة جرد فئات النقدية ومطابقة رصيد الدرج الفعلي' : 'Cash Count Calculator'}
              >
                <Calculator className="w-4 h-4 text-amber-200" />
                <span>{lang === 'ar' ? 'جرد الدرج' : 'Cash Audit'}</span>
              </button>

              {/* Print Daybook */}
              <button
                type="button"
                onClick={() => setIsDaybookPrintModalOpen(true)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'ar' ? 'طباعة اليومية A4' : 'Print Daybook'}</span>
              </button>

              {/* Excel Daybook */}
              <button
                type="button"
                onClick={handleExportDaybookExcel}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إكسيل' : 'Excel'}</span>
              </button>
            </div>
          </div>

          {/* 6 Financial KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Opening Balance */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                {lang === 'ar' ? 'رصيد الافتتاح' : 'Opening Balance'}
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                {formatCurrency(daybookOpeningBalance, currency, lang)}
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5">
                {lang === 'ar' ? 'بداية اليوم 00:00' : 'Start of day'}
              </span>
            </div>

            {/* Inflow */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-800 shadow-xs bg-emerald-50/20">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1 flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'وارد اليوم (+)' : 'Today Inflow'}</span>
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(daybookInflow, currency, lang)}
              </span>
              <span className="text-[9.5px] text-emerald-700/80 block mt-0.5 font-bold">
                {daybookTransactions.filter(t => t.type === 'inflow').length} {lang === 'ar' ? 'سندات قبض' : 'vouchers'}
              </span>
            </div>

            {/* Outflow */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-rose-300 dark:border-rose-800 shadow-xs bg-rose-50/20">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block mb-1 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'منصرف اليوم (-)' : 'Today Outflow'}</span>
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-rose-600 dark:text-rose-400">
                -{formatCurrency(daybookOutflow, currency, lang)}
              </span>
              <span className="text-[9.5px] text-rose-700/80 block mt-0.5 font-bold">
                {daybookTransactions.filter(t => t.type === 'outflow').length} {lang === 'ar' ? 'سندات صرف ومصروفات' : 'outflows'}
              </span>
            </div>

            {/* Net Flow */}
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-blue-300 dark:border-blue-800 shadow-xs bg-blue-50/20">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block mb-1">
                {lang === 'ar' ? 'صافي حركة اليوم' : 'Net Flow'}
              </span>
              <span className={`text-base sm:text-lg font-black font-mono ${daybookNetFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {daybookNetFlow >= 0 ? '+' : ''}{formatCurrency(daybookNetFlow, currency, lang)}
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5 font-bold">
                {daybookNetFlow >= 0 ? (lang === 'ar' ? 'فائض يومي' : 'Surplus') : (lang === 'ar' ? 'عجز يومي' : 'Deficit')}
              </span>
            </div>

            {/* Book Closing Balance */}
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-300 block mb-1">
                {lang === 'ar' ? 'الرصيد الدفتري الحالي' : 'Book Balance'}
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-amber-300">
                {formatCurrency(daybookClosingBalance, currency, lang)}
              </span>
              <span className="text-[9.5px] text-slate-400 block mt-0.5 font-bold">
                {lang === 'ar' ? 'رصيد الإقفال المحسوب' : 'Book balance'}
              </span>
            </div>

            {/* Actual Physical Count & Variance */}
            <div className={`p-3.5 rounded-2xl border shadow-xs ${daybookVariance === 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300' : daybookVariance > 0 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'ar' ? 'الجرد الفعلي للكاش' : 'Cash Count'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsDaybookAuditModalOpen(true)}
                  className="text-[9.5px] text-blue-600 hover:underline font-bold cursor-pointer"
                >
                  {lang === 'ar' ? 'تعديل' : 'Edit'}
                </button>
              </div>
              <span className="text-base sm:text-lg font-black font-mono text-slate-950 dark:text-slate-50">
                {formatCurrency(actualDaybookCount, currency, lang)}
              </span>
              <span className={`text-[9.5px] font-extrabold block mt-0.5 ${daybookVariance === 0 ? 'text-emerald-700 dark:text-emerald-300' : daybookVariance > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {daybookVariance === 0 ? '✓ مطابق تماماً' : daybookVariance > 0 ? `+ زيادة ${formatCurrency(daybookVariance, currency, lang)}` : `! عجز ${formatCurrency(daybookVariance, currency, lang)}`}
              </span>
            </div>
          </div>

          {/* Chronological Table of Daybook Entries */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'ar' ? `حركات يومية النقدية ليوم (${daybookDate})` : `Daily Cash Movement Log (${daybookDate})`}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'ar'
                    ? 'تسجيل زمني لحظي لجميع مقبوضات ومدفوعات النقدية مع الرصيد التراكمي وإمكانية التعديل والحذف'
                    : 'Real-time record of all cash receipts and disbursements'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">
                  {daybookTransactionsWithRunning.length} {lang === 'ar' ? 'حركة مسجلة' : 'records'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-3 text-start w-28">{lang === 'ar' ? 'رقم السند' : 'Voucher #'}</th>
                    <th className="py-3 px-3 text-start w-24">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                    <th className="py-3 px-3 text-start">{lang === 'ar' ? 'الخزينة' : 'Safe'}</th>
                    <th className="py-3 px-3 text-start">{lang === 'ar' ? 'التصنيف' : 'Category'}</th>
                    <th className="py-3 px-3 text-start">{lang === 'ar' ? 'الطرف / المستفيد' : 'Party'}</th>
                    <th className="py-3 px-3 text-start max-w-xs">{lang === 'ar' ? 'البيان والتفاصيل' : 'Description'}</th>
                    <th className="py-3 px-3 text-end font-mono text-emerald-700 bg-emerald-50/30 w-24">{lang === 'ar' ? 'وارد (+)' : 'Inflow'}</th>
                    <th className="py-3 px-3 text-end font-mono text-rose-700 bg-rose-50/30 w-24">{lang === 'ar' ? 'منصرف (-)' : 'Outflow'}</th>
                    <th className="py-3 px-3 text-end font-mono font-bold w-28">{lang === 'ar' ? 'الرصيد اللحظي' : 'Running'}</th>
                    <th className="py-3 px-3 text-center w-28">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {daybookTransactionsWithRunning.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                          <p className="font-bold text-slate-600 dark:text-slate-300">
                            {lang === 'ar' ? 'لا توجد حركات نقدية مسجلة في هذا اليوم' : 'No transactions recorded on this date'}
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setTrxForm((prev) => ({
                                  ...prev,
                                  treasuryId: daybookTreasuryFilter === 'all' ? (treasuries[0]?.id || '') : daybookTreasuryFilter,
                                  date: daybookDate,
                                  paymentMethod: 'cash',
                                }));
                                setIsInflowModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              + {lang === 'ar' ? 'تسجيل وارد' : 'Add Inflow'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setTrxForm((prev) => ({
                                  ...prev,
                                  treasuryId: daybookTreasuryFilter === 'all' ? (treasuries[0]?.id || '') : daybookTreasuryFilter,
                                  date: daybookDate,
                                  paymentMethod: 'cash',
                                }));
                                setIsOutflowModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              - {lang === 'ar' ? 'تسجيل منصرف' : 'Add Outflow'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    daybookTransactionsWithRunning.map((trx, idx) => {
                      const isInflow = trx.type === 'inflow';
                      return (
                        <tr key={trx.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {trx.transactionNumber}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isInflow
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                            }`}>
                              {isInflow ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                              <span>{isInflow ? (lang === 'ar' ? 'وارد (قبض)' : 'Inflow') : (lang === 'ar' ? 'منصرف (صرف)' : 'Outflow')}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                            {trx.treasuryName}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-bold text-[11px] text-slate-600 dark:text-slate-400">
                            {getCategoryLabel(trx.category)}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {trx.partyName}
                          </td>
                          <td className="py-3 px-3 max-w-xs text-slate-700 dark:text-slate-300">
                            <p className="line-clamp-2">{trx.description}</p>
                            {trx.referenceNumber && (
                              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                {lang === 'ar' ? 'مرجع:' : 'Ref:'} {trx.referenceNumber}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-end font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 whitespace-nowrap">
                            {isInflow ? `+${formatCurrency(trx.amount, currency, lang)}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-end font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50/20 whitespace-nowrap">
                            {!isInflow ? `-${formatCurrency(trx.amount, currency, lang)}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-end font-mono font-black text-slate-900 dark:text-slate-100 whitespace-nowrap bg-slate-50/40 dark:bg-slate-800/20">
                            {formatCurrency(trx.runningBalance, currency, lang)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => setEditingTransaction(trx)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition cursor-pointer"
                                title={lang === 'ar' ? 'تعديل السند المالي' : 'Edit Voucher'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmDeleteModal({
                                    type: 'transaction',
                                    id: trx.id,
                                    title: trx.transactionNumber,
                                    description: `هل أنت متأكد من حذف السند ${trx.transactionNumber} بمبلغ ${trx.amount}؟ سيتم إلغاء أثره على رصيد الخزينة.`,
                                  })
                                }
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                                title={lang === 'ar' ? 'حذف السند' : 'Delete Voucher'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Print Voucher */}
                              <button
                                type="button"
                                onClick={() => triggerBrowserPrint()}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition cursor-pointer"
                                title={lang === 'ar' ? 'طباعة السند' : 'Print Voucher'}
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {daybookTransactionsWithRunning.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-black border-t-2 border-slate-300 dark:border-slate-700">
                    <tr>
                      <td colSpan={7} className="py-3 px-4 text-end text-slate-700 dark:text-slate-300">
                        {lang === 'ar' ? 'إجمالي حركة اليوم ورصيد الإقفال:' : 'Total Movement & Closing Balance:'}
                      </td>
                      <td className="py-3 px-3 text-end font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100/40 dark:bg-emerald-950/40">
                        +{formatCurrency(daybookInflow, currency, lang)}
                      </td>
                      <td className="py-3 px-3 text-end font-mono text-rose-600 dark:text-rose-400 bg-rose-100/40 dark:bg-rose-950/40">
                        -{formatCurrency(daybookOutflow, currency, lang)}
                      </td>
                      <td className="py-3 px-3 text-end font-mono font-black text-slate-900 dark:text-slate-100 bg-slate-200/60 dark:bg-slate-700/60">
                        {formatCurrency(daybookClosingBalance, currency, lang)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: INFLOW & OUTFLOW TRANSACTIONS TABLE */}
      {/* ======================================================== */}
      {activeTab === 'inflow_outflow' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-500">
                  {lang === 'ar' ? 'تصفية النوع:' : 'Type Filter:'}
                </span>
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    typeFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {lang === 'ar' ? 'الكل' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('inflow')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    typeFilter === 'inflow'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'الوارد فقط (سندات قبض)' : 'Inflows only'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('outflow')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    typeFilter === 'outflow'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'المنصرف فقط (سندات صرف)' : 'Outflows only'}</span>
                </button>
              </div>

              <div className="text-xs font-bold text-slate-500">
                {lang === 'ar' ? 'عدد الحركات المعروضة:' : 'Records:'} {filteredTransactions.length}
              </div>
            </div>

            {/* Quick Payment Method Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black text-slate-500">{lang === 'ar' ? 'طريقة الدفع:' : 'Payment:'}</span>
              {[
                { id: 'all', label: lang === 'ar' ? 'كافة الطرق' : 'All' },
                { id: 'cash', label: lang === 'ar' ? '💵 نقدي' : 'Cash' },
                { id: 'bank_transfer', label: lang === 'ar' ? '🏦 تحويل بنكي' : 'Bank Transfer' },
                { id: 'electronic_gateway', label: lang === 'ar' ? '🌐 بوابة دفع إلكتروني' : 'Electronic Gateway' },
                { id: 'pos', label: lang === 'ar' ? '💳 مدى / POS' : 'POS' },
                { id: 'check', label: lang === 'ar' ? '📜 شيك بنكي' : 'Cheque' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethodFilter(m.id)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    paymentMethodFilter === m.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'رقم الإيصال والتاريخ' : 'Ref & Date'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'الخزينة' : 'Treasury'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'النوع والتصنيف' : 'Type & Category'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'المستفيد / العميل' : 'Party'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'طريقة السداد' : 'Payment Method'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'البيان والتفاصيل' : 'Description'}</th>
                  <th className="py-3 px-4 text-end">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      {lang === 'ar' ? 'لا توجد حركات وارد أو منصرف مطابقة للشروط' : 'No transactions matching filter'}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((trx) => {
                    const isInflow = trx.type === 'inflow';
                    return (
                      <tr
                        key={trx.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${
                          isInflow ? 'border-r-4 border-r-emerald-500/80' : 'border-r-4 border-r-rose-500/80'
                        }`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold block text-slate-900 dark:text-slate-100">
                            {trx.transactionNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">{trx.date}</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                          {trx.treasuryName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              isInflow
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {isInflow ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            <span>{isInflow ? (lang === 'ar' ? 'وارد (قبض)' : 'Inflow') : (lang === 'ar' ? 'منصرف (صرف)' : 'Outflow')}</span>
                          </span>
                          <span className="block text-[10px] text-slate-500 font-bold mt-0.5">
                            {getCategoryLabel(trx.category)}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {trx.partyName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getPaymentMethodBadge(trx.paymentMethod)}
                        </td>
                        <td className="py-3 px-4 max-w-xs text-slate-700 dark:text-slate-300">
                          <p className="line-clamp-2">{trx.description}</p>
                          {trx.referenceNumber && (
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              {lang === 'ar' ? 'مرجع:' : 'Ref:'} {trx.referenceNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-end whitespace-nowrap font-mono font-black text-sm">
                          <span className={isInflow ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {isInflow ? '+' : '-'}
                            {formatCurrency(trx.amount, currency, lang)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingTransaction(trx)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition cursor-pointer"
                              title={lang === 'ar' ? 'تعديل السند المالي' : 'Edit Transaction'}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerBrowserPrint()}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                              title={lang === 'ar' ? 'طباعة سند القبض / الصرف' : 'Print Voucher'}
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDeleteModal({
                                  type: 'transaction',
                                  id: trx.id,
                                  title: trx.transactionNumber,
                                  description: `هل أنت متأكد من حذف الحركة رقم ${trx.transactionNumber} بمبلغ ${formatCurrency(trx.amount, currency, lang)}؟ سيتم إلغاء أثرها المالي على رصيد الخزينة.`,
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title={lang === 'ar' ? 'حذف الحركة' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
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
      )}

      {/* ======================================================== */}
      {/* TAB 3: INTERNAL TRANSFERS TABLE */}
      {/* ======================================================== */}
      {activeTab === 'transfers' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-blue-500" />
              <span>{lang === 'ar' ? 'سجل التحويلات بين الخزائن والحسابات البنكية' : 'Internal Treasury Transfers'}</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تحويل جديد' : 'New Transfer'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'رقم التحويل' : 'Transfer #'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'من خزينة / حساب' : 'From Account'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'إلى خزينة / حساب' : 'To Account'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'البيان والسبب' : 'Description'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'القائم بالتحويل' : 'Transferred By'}</th>
                  <th className="py-3 px-4 text-end">{lang === 'ar' ? 'مبلغ التحويل' : 'Amount'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      {lang === 'ar' ? 'لا توجد تحويلات مسجلة للفترة المحددة' : 'No transfers recorded for period'}
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((trf) => (
                    <tr key={trf.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {trf.transferNumber}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono">{trf.date}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-rose-600 dark:text-rose-400">
                        {trf.fromTreasuryName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                        {trf.toTreasuryName}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-700 dark:text-slate-300">
                        {trf.description}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {trf.transferredBy}
                      </td>
                      <td className="py-3 px-4 text-end font-mono font-black text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrency(trf.amount, currency, lang)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'مكتمل ومرحل' : 'Completed'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingTransfer(trf)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition cursor-pointer"
                            title={lang === 'ar' ? 'تعديل التحويل المالي' : 'Edit Transfer'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDeleteModal({
                                type: 'transfer',
                                id: trf.id,
                                title: trf.transferNumber,
                                description: `هل أنت متأكد من إلغاء وحذف التحويل المالي رقم ${trf.transferNumber} بمبلغ ${formatCurrency(trf.amount, currency, lang)}؟ سيتم استرجاع الرصيد للخزينة المصدر (${trf.fromTreasuryName}).`,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                            title={lang === 'ar' ? 'حذف التحويل المالي' : 'Delete Transfer'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: OPERATING EXPENSES TABLE */}
      {/* ======================================================== */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-500">
                  {lang === 'ar' ? 'تصنيف المصروف:' : 'Category:'}
                </span>
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  <option value="all">{lang === 'ar' ? 'جميع التصنيفات' : 'All Categories'}</option>
                  <option value="rent">{lang === 'ar' ? 'إيجار مقار ومعارض' : 'Rent'}</option>
                  <option value="utilities">{lang === 'ar' ? 'كهرباء ومياه' : 'Utilities'}</option>
                  <option value="telecom_internet">{lang === 'ar' ? 'اتصالات وإنترنت' : 'Internet'}</option>
                  <option value="fuel_oil">{lang === 'ar' ? 'محروقات وبنزين' : 'Fuel'}</option>
                  <option value="cleaning_hospitality">{lang === 'ar' ? 'نظافة وضيافة' : 'Hospitality'}</option>
                  <option value="office_supplies">{lang === 'ar' ? 'مطبوعات ومكتبية' : 'Stationery'}</option>
                  <option value="marketing_ads">{lang === 'ar' ? 'دعاية وإعلان' : 'Marketing'}</option>
                  <option value="salaries_commissions">{lang === 'ar' ? 'رواتب وبدلات' : 'Salaries'}</option>
                  <option value="government_fees">{lang === 'ar' ? 'رسوم وتراخيص' : 'Government'}</option>
                  <option value="other_expense">{lang === 'ar' ? 'مصروفات أخرى' : 'Other'}</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تسجيل مصروف جديد' : 'New Expense'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 text-start">{lang === 'ar' ? 'رقم السند' : 'Expense #'}</th>
                    <th className="py-3 px-4 text-start">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th className="py-3 px-4 text-start">{lang === 'ar' ? 'بند المصروف' : 'Category & Title'}</th>
                    <th className="py-3 px-4 text-start">{lang === 'ar' ? 'الخزينة المنصرف منها' : 'Paid From'}</th>
                    <th className="py-3 px-4 text-start">{lang === 'ar' ? 'المستفيد / المورد' : 'Beneficiary'}</th>
                    <th className="py-3 px-4 text-start">{lang === 'ar' ? 'طريقة السداد' : 'Payment Method'}</th>
                    <th className="py-3 px-4 text-start">{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
                    <th className="py-3 px-4 text-end">{lang === 'ar' ? 'المبلغ الصافي' : 'Net'}</th>
                    <th className="py-3 px-4 text-end">{lang === 'ar' ? 'الضريبة VAT' : 'VAT'}</th>
                    <th className="py-3 px-4 text-end">{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                    <th className="py-3 px-4 text-center">{lang === 'ar' ? 'إجراء' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        {lang === 'ar' ? 'لا توجد مصروفات مسجلة مطابقة للبحث' : 'No expenses recorded'}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                          {exp.expenseNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono">{exp.date}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold block text-slate-900 dark:text-slate-100">{exp.title}</span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                            {getCategoryLabel(exp.category)}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                          {exp.treasuryName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                          {exp.beneficiary}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getPaymentMethodBadge(exp.paymentMethod)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500">
                          {exp.invoiceNumber || '-'}
                        </td>
                        <td className="py-3 px-4 text-end font-mono whitespace-nowrap">
                          {formatCurrency(exp.amount, currency, lang)}
                        </td>
                        <td className="py-3 px-4 text-end font-mono text-slate-500 whitespace-nowrap">
                          {exp.taxAmount ? formatCurrency(exp.taxAmount, currency, lang) : '0'}
                        </td>
                        <td className="py-3 px-4 text-end font-mono font-black text-sm text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {formatCurrency(exp.totalWithTax, currency, lang)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingExpense(exp)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition cursor-pointer"
                              title={lang === 'ar' ? 'تعديل المصروف' : 'Edit Expense'}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDeleteModal({
                                  type: 'expense',
                                  id: exp.id,
                                  title: exp.title,
                                  description: `هل أنت متأكد من حذف المصروف التشغيلي (${exp.title} - ${exp.expenseNumber}) بقيمة ${formatCurrency(exp.totalWithTax, currency, lang)}؟ سيتم استرداد المبلغ وإضافته مجدداً لرصيد الخزينة.`,
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title={lang === 'ar' ? 'حذف المصروف' : 'Delete Expense'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: COMPREHENSIVE TREASURY LEDGER WITH RUNNING BALANCE */}
      {/* ======================================================== */}
      {activeTab === 'ledger' && (
        <div id="printable-treasury-ledger" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>{lang === 'ar' ? 'كشف حركة الخزينة الشامل والرصيد التراكمي' : 'Comprehensive Treasury Movement Ledger'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'ar'
                  ? 'عرض زمني متسلسل لكافة المقبوضات والمدفوعات والمصروفات مع احتساب الأثر المالي'
                  : 'Complete audit trail of all receipts, disbursements, and expenses'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'طباعة تقرير مالي مفصل (PDF)' : 'Print Detailed Statement'}</span>
              </button>
              <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                {startDate} ⬅️ ➡️ {endDate}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'رقم السند' : 'Voucher #'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'الخزينة / الحساب' : 'Treasury'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'نوع الحركة' : 'Type'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</th>
                  <th className="py-3 px-4 text-start">{lang === 'ar' ? 'البيان والطرف الآخر' : 'Description & Party'}</th>
                  <th className="py-3 px-4 text-end text-emerald-600">{lang === 'ar' ? 'وارد (+)' : 'Inflow (+)'}</th>
                  <th className="py-3 px-4 text-end text-rose-600">{lang === 'ar' ? 'منصرف (-)' : 'Outflow (-)'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'ar' ? 'المسجل' : 'Logged By'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.map((trx) => {
                  const isInflow = trx.type === 'inflow';
                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{trx.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {trx.transactionNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {trx.treasuryName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                            isInflow
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {isInflow ? (lang === 'ar' ? 'وارد نقدية' : 'Inflow') : (lang === 'ar' ? 'منصرف نقدية' : 'Outflow')}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getPaymentMethodBadge(trx.paymentMethod)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold block text-slate-800 dark:text-slate-200">{trx.description}</span>
                        <span className="text-[10px] text-slate-500">{trx.partyName}</span>
                      </td>
                      <td className="py-3 px-4 text-end font-mono font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {isInflow ? formatCurrency(trx.amount, currency, lang) : '-'}
                      </td>
                      <td className="py-3 px-4 text-end font-mono font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {!isInflow ? formatCurrency(trx.amount, currency, lang) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-[10px] text-slate-500 whitespace-nowrap">
                        {trx.registeredBy}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD TREASURY / BANK ACCOUNT */}
      {/* ======================================================== */}
      {isTreasuryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-blue-600" />
                <span>{lang === 'ar' ? 'إضافة خزينة نقدية أو حساب بنكي جديد' : 'Add Treasury / Bank Account'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTreasuryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTreasury} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'اسم الخزينة / الحساب البنكي *' : 'Account Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ar' ? 'مثال: خزينة صالة الاستقبال - وردية المساء' : 'e.g. Front Desk Safe'}
                  value={treasuryForm.name}
                  onChange={(e) => setTreasuryForm({ ...treasuryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'نوع الخزينة / الحساب *' : 'Account Type *'}
                  </label>
                  <select
                    value={treasuryForm.type}
                    onChange={(e) => setTreasuryForm({ ...treasuryForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="cash_safe">{lang === 'ar' ? '💵 خزينة نقدية (كاش)' : 'Cash Safe'}</option>
                    <option value="bank_account">{lang === 'ar' ? '🏦 حساب بنكي' : 'Bank Account'}</option>
                    <option value="pos_terminal">{lang === 'ar' ? '💳 جهاز نقاط بيع (POS)' : 'POS Terminal'}</option>
                    <option value="petty_cash">{lang === 'ar' ? '📦 عهدة نقدية للمصروفات' : 'Petty Cash Custody'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'كود الخزينة (اختياري)' : 'Code'}
                  </label>
                  <input
                    type="text"
                    placeholder="TR-01"
                    value={treasuryForm.code}
                    onChange={(e) => setTreasuryForm({ ...treasuryForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {treasuryForm.type === 'bank_account' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {lang === 'ar' ? 'اسم البنك' : 'Bank Name'}
                    </label>
                    <input
                      type="text"
                      placeholder="مصرف الراجحي / البنك الأهلي"
                      value={treasuryForm.bankName}
                      onChange={(e) => setTreasuryForm({ ...treasuryForm, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {lang === 'ar' ? 'رقم الحساب / الآيبان (IBAN)' : 'IBAN / Account Number'}
                    </label>
                    <input
                      type="text"
                      placeholder="SA..."
                      value={treasuryForm.accountNumber}
                      onChange={(e) => setTreasuryForm({ ...treasuryForm, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'الرصيد الافتتاحي *' : 'Initial Balance *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={treasuryForm.initialBalance}
                    onChange={(e) => setTreasuryForm({ ...treasuryForm, initialBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'المسؤول / أمين الخزينة' : 'Custodian'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'أحمد الشاكر' : 'John Doe'}
                    value={treasuryForm.responsiblePerson}
                    onChange={(e) => setTreasuryForm({ ...treasuryForm, responsiblePerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'ملاحظات وتوجيهات' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={treasuryForm.notes}
                  onChange={(e) => setTreasuryForm({ ...treasuryForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTreasuryModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl"
                >
                  {lang === 'ar' ? 'حفظ الخزينة' : 'Save Treasury'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD INFLOW TRANSACTION (سند قبض) */}
      {/* ======================================================== */}
      {isInflowModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-base text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5" />
                <span>{lang === 'ar' ? 'تسجيل وارد نقدية (سند قبض)' : 'Record Cash Inflow (Receipt)'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsInflowModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInflow} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'إيداع إلى الخزينة / الحساب *' : 'Deposit To Treasury *'}
                </label>
                <select
                  required
                  value={trxForm.treasuryId}
                  onChange={(e) => setTrxForm({ ...trxForm, treasuryId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  {treasuries.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name} (الرصيد: {formatCurrency(tr.currentBalance, currency, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'المبلغ المستلم *' : 'Amount Received *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={trxForm.amount}
                    onChange={(e) => setTrxForm({ ...trxForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono font-black text-sm text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'تاريخ الحركة *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={trxForm.date}
                    onChange={(e) => setTrxForm({ ...trxForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'بند الإيراد / التصنيف *' : 'Category *'}
                  </label>
                  <select
                    value={trxForm.category}
                    onChange={(e) => setTrxForm({ ...trxForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="rental_revenue">{lang === 'ar' ? 'إيراد إيجار سيارات' : 'Rental Revenue'}</option>
                    <option value="deposit_received">{lang === 'ar' ? 'استلام تأمين نقدي' : 'Deposit Received'}</option>
                    <option value="sale_revenue">{lang === 'ar' ? 'إيراد بيع سيارة' : 'Vehicle Sale'}</option>
                    <option value="delivery_fee">{lang === 'ar' ? 'رسوم توصيل ونقل' : 'Delivery Fee'}</option>
                    <option value="penalty_collection">{lang === 'ar' ? 'تحصيل غرامات ومخالفات' : 'Fines Collection'}</option>
                    <option value="capital_deposit">{lang === 'ar' ? 'تغذية نقدية / رأس مال' : 'Capital Deposit'}</option>
                    <option value="other_income">{lang === 'ar' ? 'إيرادات أخرى متنوعة' : 'Other Income'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'طريقة الدفع *' : 'Payment Method *'}
                  </label>
                  <select
                    value={trxForm.paymentMethod}
                    onChange={(e) => setTrxForm({ ...trxForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="cash">{lang === 'ar' ? '💵 نقداً (كاش)' : 'Cash'}</option>
                    <option value="bank_transfer">{lang === 'ar' ? '🏦 تحويل بنكي' : 'Bank Transfer'}</option>
                    <option value="electronic_gateway">{lang === 'ar' ? '🌐 بوابة دفع إلكتروني' : 'Electronic Gateway'}</option>
                    <option value="pos">{lang === 'ar' ? '💳 بطاقة مدى / POS' : 'POS / Mada'}</option>
                    <option value="check">{lang === 'ar' ? '📜 شيك بنكي' : 'Check'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'المستلم منه (العميل / الشريك)' : 'Payer Name'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'أحمد السالم' : 'Customer Name'}
                    value={trxForm.partyName}
                    onChange={(e) => setTrxForm({ ...trxForm, partyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'رقم المرجع / الإيصال البنكي' : 'Reference #'}
                  </label>
                  <input
                    type="text"
                    placeholder="REC-1029"
                    value={trxForm.referenceNumber}
                    onChange={(e) => setTrxForm({ ...trxForm, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'البيان والتفاصيل *' : 'Description *'}
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder={lang === 'ar' ? 'تفاصيل سند القبض...' : 'Details of inflow...'}
                  value={trxForm.description}
                  onChange={(e) => setTrxForm({ ...trxForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInflowModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl"
                >
                  {lang === 'ar' ? 'تأكيد وإيداع السند' : 'Confirm Inflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADD OUTFLOW TRANSACTION (سند صرف) */}
      {/* ======================================================== */}
      {isOutflowModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-base text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5" />
                <span>{lang === 'ar' ? 'تسجيل منصرف نقدية (سند صرف)' : 'Record Cash Outflow (Disbursement)'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOutflowModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOutflow} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'الصرف من الخزينة / الحساب *' : 'Pay From Treasury *'}
                </label>
                <select
                  required
                  value={trxForm.treasuryId}
                  onChange={(e) => setTrxForm({ ...trxForm, treasuryId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  {treasuries.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name} (الرصيد: {formatCurrency(tr.currentBalance, currency, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'المبلغ المنصرف *' : 'Amount *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={trxForm.amount}
                    onChange={(e) => setTrxForm({ ...trxForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono font-black text-sm text-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'تاريخ الحركة *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={trxForm.date}
                    onChange={(e) => setTrxForm({ ...trxForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'بند المنصرف *' : 'Category *'}
                  </label>
                  <select
                    value={trxForm.category}
                    onChange={(e) => setTrxForm({ ...trxForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="deposit_refund">{lang === 'ar' ? 'استرداد تأمين للعميل' : 'Deposit Refund'}</option>
                    <option value="supplier_payout">{lang === 'ar' ? 'سداد مستحقات مورد' : 'Supplier Payout'}</option>
                    <option value="maintenance_payout">{lang === 'ar' ? 'سداد صيانة دورية' : 'Maintenance Cost'}</option>
                    <option value="owner_withdrawal">{lang === 'ar' ? 'مسحوبات وتوزيعات ملاك' : 'Owner Withdrawal'}</option>
                    <option value="other_outflow">{lang === 'ar' ? 'منصرفات أخرى' : 'Other Outflow'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'طريقة الصرف *' : 'Payment Method *'}
                  </label>
                  <select
                    value={trxForm.paymentMethod}
                    onChange={(e) => setTrxForm({ ...trxForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="cash">{lang === 'ar' ? '💵 نقداً (كاش)' : 'Cash'}</option>
                    <option value="bank_transfer">{lang === 'ar' ? '🏦 تحويل بنكي' : 'Bank Transfer'}</option>
                    <option value="electronic_gateway">{lang === 'ar' ? '🌐 بوابة دفع إلكتروني' : 'Electronic Gateway'}</option>
                    <option value="pos">{lang === 'ar' ? '💳 بطاقة مدى / POS' : 'POS / Mada'}</option>
                    <option value="check">{lang === 'ar' ? '📜 شيك بنكي' : 'Check'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'اسم المستفيد' : 'Beneficiary'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'اسم الشخص / المورد' : 'Beneficiary'}
                    value={trxForm.partyName}
                    onChange={(e) => setTrxForm({ ...trxForm, partyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'رقم السند / الفاتورة' : 'Reference #'}
                  </label>
                  <input
                    type="text"
                    placeholder="OUT-5521"
                    value={trxForm.referenceNumber}
                    onChange={(e) => setTrxForm({ ...trxForm, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'البيان والسبب *' : 'Description *'}
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder={lang === 'ar' ? 'سبب الصرف...' : 'Outflow reason...'}
                  value={trxForm.description}
                  onChange={(e) => setTrxForm({ ...trxForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOutflowModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl"
                >
                  {lang === 'ar' ? 'تأكيد صرف المبلغ' : 'Confirm Outflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: INTERNAL TRANSFER BETWEEN TREASURIES */}
      {/* ======================================================== */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-base text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" />
                <span>{lang === 'ar' ? 'تحويل نقدية بين الخزائن والحسابات' : 'Internal Treasury Transfer'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransfer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'من خزينة / حساب (خصم) *' : 'From Account *'}
                  </label>
                  <select
                    required
                    value={transferForm.fromTreasuryId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromTreasuryId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    {treasuries.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.name} ({formatCurrency(tr.currentBalance, currency, lang)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'إلى خزينة / حساب (إضافة) *' : 'To Account *'}
                  </label>
                  <select
                    required
                    value={transferForm.toTreasuryId}
                    onChange={(e) => setTransferForm({ ...transferForm, toTreasuryId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    {treasuries.map((tr) => (
                      <option key={tr.id} value={tr.id}>
                        {tr.name} ({formatCurrency(tr.currentBalance, currency, lang)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'مبلغ التحويل *' : 'Transfer Amount *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono font-black text-sm text-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'تاريخ التحويل *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={transferForm.date}
                    onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'بيان وسبب التحويل' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  placeholder={lang === 'ar' ? 'مثال: توريد إيرادات وردية الكاشير للخزينة الرئيسية' : 'Reason for transfer'}
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl"
                >
                  {lang === 'ar' ? 'تنفيذ التحويل الفوري' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: RECORD OPERATING EXPENSE */}
      {/* ======================================================== */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-base text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <span>{lang === 'ar' ? 'تسجيل مصروف تشغيلي جديد' : 'Record Operating Expense'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'الصرف من الخزينة / الحساب البنكي *' : 'Paid From Treasury *'}
                </label>
                <select
                  required
                  value={expenseForm.treasuryId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, treasuryId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  {treasuries.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name} ({formatCurrency(tr.currentBalance, currency, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'عنوان المصروف والبيان *' : 'Expense Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ar' ? 'مثال: فاتورة كهرباء وتكييف المعرض' : 'e.g. Office Electricity Bill'}
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'تصنيف المصروف *' : 'Category *'}
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="rent">{lang === 'ar' ? 'إيجار مقار ومعارض' : 'Rent'}</option>
                    <option value="utilities">{lang === 'ar' ? 'كهرباء ومياه وخدمات' : 'Utilities'}</option>
                    <option value="telecom_internet">{lang === 'ar' ? 'اتصالات وإنترنت' : 'Telecom'}</option>
                    <option value="fuel_oil">{lang === 'ar' ? 'بنزين ومحروقات سيارات' : 'Fuel'}</option>
                    <option value="cleaning_hospitality">{lang === 'ar' ? 'نظافة وضيافة' : 'Hospitality'}</option>
                    <option value="office_supplies">{lang === 'ar' ? 'مطبوعات وأدوات مكتبية' : 'Stationery'}</option>
                    <option value="marketing_ads">{lang === 'ar' ? 'دعاية وإعلان وتسويق' : 'Marketing'}</option>
                    <option value="salaries_commissions">{lang === 'ar' ? 'رواتب وبدلات وعمولات' : 'Salaries'}</option>
                    <option value="government_fees">{lang === 'ar' ? 'رسوم وتراخيص حكومية' : 'Government'}</option>
                    <option value="vehicle_insurance">{lang === 'ar' ? 'تأمين سيارات ورخص' : 'Insurance'}</option>
                    <option value="it_software">{lang === 'ar' ? 'اشتراكات برامج وسيرفرات' : 'Software'}</option>
                    <option value="other_expense">{lang === 'ar' ? 'مصروفات نثرية أخرى' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'المبلغ الصافي (قبل الضريبة) *' : 'Amount (Excl. Tax) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'نسبة الضريبة VAT' : 'VAT Rate'}
                  </label>
                  <select
                    value={expenseForm.taxRate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value={15}>{lang === 'ar' ? '15% ضريبة القيمة المضافة' : '15% VAT'}</option>
                    <option value={0}>{lang === 'ar' ? '0% معفى أو غير خاضع' : '0% Exempt'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'الإجمالي مع الضريبة' : 'Total with Tax'}
                  </label>
                  <div className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/80 font-mono font-black text-rose-600">
                    {formatCurrency(
                      expenseForm.amount + (expenseForm.amount * expenseForm.taxRate) / 100,
                      currency,
                      lang
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'المورد / المستفيد' : 'Vendor / Beneficiary'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'شركة الكهرباء / محطات الدريس' : 'Vendor'}
                    value={expenseForm.beneficiary}
                    onChange={(e) => setExpenseForm({ ...expenseForm, beneficiary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'طريقة السداد / الدفع *' : 'Payment Method *'}
                  </label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="cash">{lang === 'ar' ? '💵 نقداً (كاش)' : 'Cash'}</option>
                    <option value="bank_transfer">{lang === 'ar' ? '🏦 تحويل بنكي' : 'Bank Transfer'}</option>
                    <option value="electronic_gateway">{lang === 'ar' ? '🌐 بوابة دفع إلكتروني' : 'Electronic Gateway'}</option>
                    <option value="pos">{lang === 'ar' ? '💳 بطاقة مدى / POS' : 'POS / Mada'}</option>
                    <option value="check">{lang === 'ar' ? '📜 شيك بنكي' : 'Check'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'رقم الفاتورة الضريبية' : 'Invoice #'}
                </label>
                <input
                  type="text"
                  placeholder="INV-9921"
                  value={expenseForm.invoiceNumber}
                  onChange={(e) => setExpenseForm({ ...expenseForm, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl"
                >
                  {lang === 'ar' ? 'تسجيل وخصم المصروف' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT TREASURY ACCOUNT */}
      {/* ======================================================== */}
      {editingTreasury && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <span>{lang === 'ar' ? 'تعديل بيانات الخزينة / الحساب' : 'Edit Treasury Account'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTreasury(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTreasury} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'اسم الخزينة / الحساب *' : 'Account Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingTreasury.name}
                  onChange={(e) => setEditingTreasury({ ...editingTreasury, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'نوع الخزينة / الحساب *' : 'Account Type *'}
                  </label>
                  <select
                    value={editingTreasury.type}
                    onChange={(e) => setEditingTreasury({ ...editingTreasury, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="cash_safe">{lang === 'ar' ? '💵 خزينة نقدية (كاش)' : 'Cash Safe'}</option>
                    <option value="bank_account">{lang === 'ar' ? '🏦 حساب بنكي' : 'Bank Account'}</option>
                    <option value="pos_terminal">{lang === 'ar' ? '💳 جهاز نقاط بيع (POS)' : 'POS Terminal'}</option>
                    <option value="petty_cash">{lang === 'ar' ? '📦 عهدة نقدية للمصروفات' : 'Petty Cash Custody'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'كود الخزينة' : 'Code'}
                  </label>
                  <input
                    type="text"
                    value={editingTreasury.code || ''}
                    onChange={(e) => setEditingTreasury({ ...editingTreasury, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'الرصيد الافتتاحي' : 'Initial Balance'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingTreasury.initialBalance}
                    onChange={(e) =>
                      setEditingTreasury({
                        ...editingTreasury,
                        initialBalance: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'الرصيد الحالي المباشر' : 'Current Balance'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingTreasury.currentBalance}
                    onChange={(e) =>
                      setEditingTreasury({
                        ...editingTreasury,
                        currentBalance: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              {editingTreasury.type === 'bank_account' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {lang === 'ar' ? 'اسم البنك' : 'Bank Name'}
                    </label>
                    <input
                      type="text"
                      value={editingTreasury.bankName || ''}
                      onChange={(e) => setEditingTreasury({ ...editingTreasury, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {lang === 'ar' ? 'رقم الحساب' : 'Account #'}
                    </label>
                    <input
                      type="text"
                      value={editingTreasury.accountNumber || ''}
                      onChange={(e) => setEditingTreasury({ ...editingTreasury, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                      {lang === 'ar' ? 'رقم الآيبان (IBAN)' : 'IBAN'}
                    </label>
                    <input
                      type="text"
                      value={editingTreasury.iban || ''}
                      onChange={(e) => setEditingTreasury({ ...editingTreasury, iban: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'الوصف وملاحظات الاستخدام' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={editingTreasury.description || ''}
                  onChange={(e) => setEditingTreasury({ ...editingTreasury, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-treasury-active"
                  checked={editingTreasury.isActive}
                  onChange={(e) => setEditingTreasury({ ...editingTreasury, isActive: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="edit-treasury-active" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {lang === 'ar' ? 'الخزينة نشطة ومتاحة للعمليات والتحويلات' : 'Account is active'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTreasury(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT TRANSACTION */}
      {/* ======================================================== */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <span>{lang === 'ar' ? 'تعديل السند المالي / الحركة' : 'Edit Transaction / Voucher'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTransaction} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'نوع الحركة *' : 'Type *'}
                  </label>
                  <select
                    value={editingTransaction.type}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="inflow">{lang === 'ar' ? '📥 سند قبض (وارد +)' : 'Inflow (+)'}</option>
                    <option value="outflow">{lang === 'ar' ? '📤 سند صرف (منصرف -)' : 'Outflow (-)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'المبلغ *' : 'Amount *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingTransaction.amount}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'الخزينة / الحساب *' : 'Treasury / Safe *'}
                  </label>
                  <select
                    value={editingTransaction.treasuryId}
                    onChange={(e) => {
                      const found = treasuries.find((t) => t.id === e.target.value);
                      setEditingTransaction({
                        ...editingTransaction,
                        treasuryId: e.target.value,
                        treasuryName: found ? found.name : editingTransaction.treasuryName,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    {treasuries.map((tr) => (
                      <option key={tr.id} value={tr.id}>{tr.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'طريقة الدفع *' : 'Payment Method *'}
                  </label>
                  <select
                    value={editingTransaction.paymentMethod}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="cash">{lang === 'ar' ? '💵 نقداً (كاش)' : 'Cash'}</option>
                    <option value="bank_transfer">{lang === 'ar' ? '🏦 تحويل بنكي' : 'Bank Transfer'}</option>
                    <option value="pos">{lang === 'ar' ? '💳 بطاقة مدى / POS' : 'POS / Mada'}</option>
                    <option value="check">{lang === 'ar' ? '📜 شيك بنكي' : 'Check'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'التاريخ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={editingTransaction.date}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'الطرف / المستفيد *' : 'Party / Client *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTransaction.partyName}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, partyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'البيان والتفاصيل *' : 'Description *'}
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'الرقم المرجعي / الفاتورة' : 'Reference #'}
                </label>
                <input
                  type="text"
                  value={editingTransaction.referenceNumber || ''}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ تعديل السند' : 'Save Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT TRANSFER */}
      {/* ======================================================== */}
      {editingTransfer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <span>{lang === 'ar' ? 'تعديل التحويل المالي الداخلي' : 'Edit Internal Transfer'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTransfer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTransfer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'مبلغ التحويل *' : 'Amount *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingTransfer.amount}
                    onChange={(e) => setEditingTransfer({ ...editingTransfer, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'التاريخ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={editingTransfer.date}
                    onChange={(e) => setEditingTransfer({ ...editingTransfer, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'من خزينة / حساب (المصدر) *' : 'From Account *'}
                  </label>
                  <select
                    value={editingTransfer.fromTreasuryId}
                    onChange={(e) => {
                      const found = treasuries.find((t) => t.id === e.target.value);
                      setEditingTransfer({
                        ...editingTransfer,
                        fromTreasuryId: e.target.value,
                        fromTreasuryName: found ? found.name : editingTransfer.fromTreasuryName,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    {treasuries.map((tr) => (
                      <option key={tr.id} value={tr.id}>{tr.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'إلى خزينة / حساب (الوجهة) *' : 'To Account *'}
                  </label>
                  <select
                    value={editingTransfer.toTreasuryId}
                    onChange={(e) => {
                      const found = treasuries.find((t) => t.id === e.target.value);
                      setEditingTransfer({
                        ...editingTransfer,
                        toTreasuryId: e.target.value,
                        toTreasuryName: found ? found.name : editingTransfer.toTreasuryName,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    {treasuries.map((tr) => (
                      <option key={tr.id} value={tr.id}>{tr.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'سبب التحويل والبيان *' : 'Description *'}
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingTransfer.description}
                  onChange={(e) => setEditingTransfer({ ...editingTransfer, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTransfer(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ تعديل التحويل' : 'Save Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT EXPENSE */}
      {/* ======================================================== */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                <span>{lang === 'ar' ? 'تعديل المصروف التشغيلي' : 'Edit Operating Expense'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'عنوان / بيان المصروف *' : 'Expense Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingExpense.title}
                  onChange={(e) => setEditingExpense({ ...editingExpense, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'التصنيف *' : 'Category *'}
                  </label>
                  <select
                    value={editingExpense.category}
                    onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="utilities">{lang === 'ar' ? '💡 كهرباء وماء ومرافق' : 'Utilities'}</option>
                    <option value="rent">{lang === 'ar' ? '🏢 إيجار المقر والمعارض' : 'Rent'}</option>
                    <option value="salaries">{lang === 'ar' ? '👥 رواتب ومستحقات' : 'Salaries'}</option>
                    <option value="fuel">{lang === 'ar' ? '⛽ وقود ومحروقات' : 'Fuel'}</option>
                    <option value="maintenance">{lang === 'ar' ? '🔧 صيانة دورية وإصلاح' : 'Maintenance'}</option>
                    <option value="insurance">{lang === 'ar' ? '🛡️ تأمين شامل' : 'Insurance'}</option>
                    <option value="cleaning">{lang === 'ar' ? '✨ غسيل ونظافة وتجهيز' : 'Cleaning'}</option>
                    <option value="marketing">{lang === 'ar' ? '📢 تسويق وإعلانات' : 'Marketing'}</option>
                    <option value="hospitality">{lang === 'ar' ? '☕ ضيافة وبوفيه' : 'Hospitality'}</option>
                    <option value="government_fees">{lang === 'ar' ? '🏛️ رسوم حكومية وبلدية' : 'Government Fees'}</option>
                    <option value="stationery">{lang === 'ar' ? '📑 مطبوعات وأدوات مكتبية' : 'Stationery'}</option>
                    <option value="other">{lang === 'ar' ? '📦 مصروفات عامة وأخرى' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'الخزينة المخصوم منها *' : 'Treasury *'}
                  </label>
                  <select
                    value={editingExpense.treasuryId}
                    onChange={(e) => {
                      const found = treasuries.find((t) => t.id === e.target.value);
                      setEditingExpense({
                        ...editingExpense,
                        treasuryId: e.target.value,
                        treasuryName: found ? found.name : editingExpense.treasuryName,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    {treasuries.map((tr) => (
                      <option key={tr.id} value={tr.id}>{tr.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'المبلغ بدون ضريبة *' : 'Amount *'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'نسبة الضريبة %' : 'Tax %'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingExpense.taxRate || 0}
                    onChange={(e) => setEditingExpense({ ...editingExpense, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'المستفيد / المورد' : 'Beneficiary'}
                  </label>
                  <input
                    type="text"
                    value={editingExpense.beneficiary}
                    onChange={(e) => setEditingExpense({ ...editingExpense, beneficiary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {lang === 'ar' ? 'التاريخ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {lang === 'ar' ? 'رقم الفاتورة الضريبية' : 'Invoice #'}
                </label>
                <input
                  type="text"
                  value={editingExpense.invoiceNumber || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ تعديل المصروف' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRM DELETE MODAL */}
      {/* ======================================================== */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  {lang === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Delete'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{confirmDeleteModal.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-bold">
              {confirmDeleteModal.description}
            </p>

            {confirmDeleteModal.warning && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>{confirmDeleteModal.warning}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'نعم، احذف نهائياً' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CASH AUDIT & DENOMINATIONS CALCULATOR */}
      {/* ======================================================== */}
      {isDaybookAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-xl">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    {lang === 'ar' ? 'جرد النقدية وحاسبة فئات الدرج الفعلي' : 'Cash Denominations & Drawer Audit'}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">{daybookDate}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDaybookAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Header */}
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                  {lang === 'ar' ? 'الرصيد الدفتري المطلوب' : 'Book Target'}
                </span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-slate-100">
                  {formatCurrency(daybookClosingBalance, currency, lang)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                  {lang === 'ar' ? 'الجرد الفعلي المحسوب' : 'Counted Actual'}
                </span>
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(actualDaybookCount, currency, lang)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                  {lang === 'ar' ? 'الفارق (عجز / زيادة)' : 'Variance'}
                </span>
                <span
                  className={`text-sm font-black font-mono ${
                    daybookVariance === 0
                      ? 'text-emerald-600'
                      : daybookVariance > 0
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  {daybookVariance > 0 ? '+' : ''}
                  {formatCurrency(daybookVariance, currency, lang)}
                </span>
              </div>
            </div>

            {/* Status Alert */}
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                daybookVariance === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                  : daybookVariance > 0
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 text-amber-800 dark:text-amber-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-800 dark:text-rose-300'
              }`}
            >
              {daybookVariance === 0 ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>
                {daybookVariance === 0
                  ? lang === 'ar'
                    ? '✓ الرصيد الفعلي في الدرج مطابق تماماً للرصيد الدفتري بدون عجز أو زيادة'
                    : 'Count perfectly matches book balance'
                  : daybookVariance > 0
                  ? lang === 'ar'
                    ? `+ يوجد زيادة نقدية في الصندوق بمقدار ${formatCurrency(daybookVariance, currency, lang)}`
                    : `Cash surplus of ${formatCurrency(daybookVariance, currency, lang)}`
                  : lang === 'ar'
                  ? `! يوجد عجز نقدي في الصندوق بمقدار ${formatCurrency(Math.abs(daybookVariance), currency, lang)}`
                  : `Cash shortage of ${formatCurrency(Math.abs(daybookVariance), currency, lang)}`}
              </span>
            </div>

            {/* Denominations Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'ar' ? 'تعداد الأوراق النقدية حسب الفئة:' : 'Count by Denomination:'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDaybookDenominations({
                      d500: 0,
                      d200: 0,
                      d100: 0,
                      d50: 0,
                      d20: 0,
                      d10: 0,
                      d5: 0,
                      d1: 0,
                    });
                    setCustomActualCount(null);
                  }}
                  className="text-[11px] text-rose-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'تصفير العداد' : 'Reset'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { key: 'd500' as const, val: 500, label: '500 ريال' },
                  { key: 'd200' as const, val: 200, label: '200 ريال' },
                  { key: 'd100' as const, val: 100, label: '100 ريال' },
                  { key: 'd50' as const, val: 50, label: '50 ريال' },
                  { key: 'd20' as const, val: 20, label: '20 ريال' },
                  { key: 'd10' as const, val: 10, label: '10 ريال' },
                  { key: 'd5' as const, val: 5, label: '5 ريال' },
                  { key: 'd1' as const, val: 1, label: '1 ريال / كسر' },
                ].map((denom) => {
                  const count = daybookDenominations[denom.key];
                  const subtotal = count * denom.val;
                  return (
                    <div
                      key={denom.key}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <span>{denom.label}</span>
                        <span className="font-mono text-emerald-600">{formatCurrency(subtotal, currency, lang)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={count || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setDaybookDenominations((prev) => ({ ...prev, [denom.key]: Math.max(0, val) }));
                            setCustomActualCount(null);
                          }}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-center"
                        />
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">ورقة</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direct Cash Override (Optional) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ar'
                  ? 'أو إدخال إجمالي النقدية في الدرج مباشرة (تخطي تفصيل الفئات):'
                  : 'Or Enter Direct Total Cash Count:'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder={lang === 'ar' ? 'أدخل المبلغ الإجمالي...' : 'Total actual cash...'}
                  value={customActualCount !== null ? customActualCount : ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                    setCustomActualCount(val);
                  }}
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-xs font-bold"
                />
                {customActualCount !== null && (
                  <button
                    type="button"
                    onClick={() => setCustomActualCount(null)}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    {lang === 'ar' ? 'الاعتماد على الفئات' : 'Use Denominations'}
                  </button>
                )}
              </div>
            </div>

            {/* Daybook Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ar' ? 'ملاحظات وتوصيات الجرد المالي:' : 'Audit Notes:'}
              </label>
              <textarea
                rows={2}
                placeholder={
                  lang === 'ar'
                    ? 'مثال: تم إغلاق اليومية ومطابقة النقدية مع أمين الصندوق، ولا توجد فروقات.'
                    : 'Notes...'
                }
                value={daybookNotes}
                onChange={(e) => setDaybookNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDaybookAuditModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => setIsDaybookAuditModalOpen(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'ar' ? 'اعتماد وحفظ الجرد' : 'Confirm & Save Audit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PRINT DAILY CASH DAYBOOK (A4) */}
      {/* ======================================================== */}
      <PrintCashDaybookModal
        isOpen={isDaybookPrintModalOpen}
        onClose={() => setIsDaybookPrintModalOpen(false)}
        date={daybookDate}
        selectedTreasuryId={daybookTreasuryFilter}
        treasuries={treasuries}
        transactions={transactions}
        openingBalance={daybookOpeningBalance}
        closingBalance={daybookClosingBalance}
        actualCashCount={actualDaybookCount}
        denominations={daybookDenominations}
        notes={daybookNotes}
        settings={settings}
        currency={currency}
        lang={lang}
        currentUser={currentUser}
      />

      {/* Print & PDF Detailed Financial Report Modal */}
      <PrintTreasuryReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        startDate={startDate}
        endDate={endDate}
        treasuries={treasuries}
        transactions={transactions}
        transfers={transfers}
        expenses={expenses}
        settings={settings}
        currency={currency}
        lang={lang}
        currentUser={currentUser}
        initialTreasuryId={selectedTreasuryFilter}
        initialPaymentMethod={paymentMethodFilter}
      />
    </div>
  );
};
