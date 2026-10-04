import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Trash2,
  Edit,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Building2,
  Percent,
  Download,
} from 'lucide-react';
import { AppSettings, Invoice, InvoiceItem, Language } from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { exportElementToPdf, triggerBrowserPrint } from '../utils/pdfExport';

interface InvoiceModuleProps {
  invoices: Invoice[];
  settings: AppSettings;
  onAddInvoice: (invoice: Invoice) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  lang: Language;
  selectedInvoiceId?: string;
  onClearTarget?: () => void;
}

export const InvoiceModule: React.FC<InvoiceModuleProps> = ({
  invoices,
  settings,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  lang,
  selectedInvoiceId,
  onClearTarget,
}) => {
  const t = translations[lang];

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const setInvoiceDatePreset = (preset: 'today' | 'this_week' | 'this_month' | 'last_month' | 'last_30_days' | 'all') => {
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const today = formatDate(now);
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'this_week') {
      const day = now.getDay();
      const diffToSat = (day + 1) % 7;
      const start = new Date(now);
      start.setDate(now.getDate() - diffToSat);
      setStartDate(formatDate(start));
      setEndDate(formatDate(now));
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(formatDate(start));
      setEndDate(formatDate(end));
    } else if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(formatDate(start));
      setEndDate(formatDate(end));
    } else if (preset === 'last_30_days') {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      setStartDate(formatDate(start));
      setEndDate(formatDate(now));
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Form Fields State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientTaxId, setClientTaxId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [serviceType, setServiceType] = useState<Invoice['serviceType']>('general');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 'itm_1', description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [vatRate, setVatRate] = useState<number>(settings.defaultVatRate || 15);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<Invoice['paymentMethod']>('cash');
  const [notes, setNotes] = useState('');

  // Print Modal State
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [printZoom, setPrintZoom] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  useEffect(() => {
    if (selectedInvoiceId) {
      const found = invoices.find((inv) => inv.id === selectedInvoiceId);
      if (found) {
        setSearchTerm(found.invoiceNumber);
        setStatusFilter('all');
        setServiceFilter('all');
        setPrintingInvoice(found);
      }
    }
  }, [selectedInvoiceId, invoices]);

  const handleExportTaxInvoicePdf = async () => {
    if (!printingInvoice) return;
    setIsExportingPdf(true);
    await exportElementToPdf('printable-tax-invoice', `Tax-Invoice-${printingInvoice.invoiceNumber}.pdf`);
    setIsExportingPdf(false);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const vatAmount = settings.vatEnabled ? (subtotal * vatRate) / 100 : 0;
  const totalAmount = subtotal + vatAmount;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  const getPaymentStatus = (paid: number, total: number): Invoice['paymentStatus'] => {
    if (paid >= total && total > 0) return 'paid';
    if (paid > 0) return 'partial';
    return 'unpaid';
  };

  const handleOpenAdd = () => {
    setEditingInvoice(null);
    const nextNum = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;
    setInvoiceNumber(nextNum);
    setClientName('');
    setClientPhone('');
    setClientTaxId('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setServiceType('general');
    setItems([{ id: `itm_${Date.now()}`, description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setVatRate(settings.vatEnabled ? (settings.defaultVatRate || 15) : 0);
    setPaidAmount(0);
    setPaymentMethod('cash');
    setNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setInvoiceNumber(inv.invoiceNumber);
    setClientName(inv.clientName);
    setClientPhone(inv.clientPhone || '');
    setClientTaxId(inv.clientTaxId || '');
    setIssueDate(inv.issueDate);
    setDueDate(inv.dueDate || '');
    setServiceType(inv.serviceType);
    setItems(inv.items.length > 0 ? inv.items : [{ id: `itm_${Date.now()}`, description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setVatRate(inv.vatRate);
    setPaidAmount(inv.paidAmount);
    setPaymentMethod(inv.paymentMethod);
    setNotes(inv.notes || '');
    setIsFormOpen(true);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : current.quantity;
      const u = field === 'unitPrice' ? Number(value) : current.unitPrice;
      current.total = q * u;
    }
    updated[index] = current;
    setItems(updated);
  };

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { id: `itm_${Date.now()}`, description: '', quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || items.length === 0) return;

    const computedStatus = getPaymentStatus(paidAmount, totalAmount);

    if (editingInvoice) {
      const updated: Invoice = {
        ...editingInvoice,
        invoiceNumber,
        clientName,
        clientPhone,
        clientTaxId,
        issueDate,
        dueDate,
        serviceType,
        items,
        subtotal,
        vatRate,
        vatAmount,
        totalAmount,
        paidAmount,
        remainingAmount,
        paymentStatus: computedStatus,
        paymentMethod,
        notes,
      };
      onUpdateInvoice(updated);
    } else {
      const newInv: Invoice = {
        id: `inv_${Date.now()}`,
        invoiceNumber,
        clientName,
        clientPhone,
        clientTaxId,
        issueDate,
        dueDate,
        serviceType,
        items,
        subtotal,
        vatRate,
        vatAmount,
        totalAmount,
        paidAmount,
        remainingAmount,
        paymentStatus: computedStatus,
        paymentMethod,
        notes,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddInvoice(newInv);
    }

    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t.confirmDeleteInvoice || 'Are you sure you want to delete this invoice?')) {
      onDeleteInvoice(id);
    }
  };

  // Filtered List
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter;
    const matchesService = serviceFilter === 'all' || inv.serviceType === serviceFilter;
    const invDate = (inv.issueDate || '').slice(0, 10);
    const matchesDate =
      (!startDate || invDate >= startDate) &&
      (!endDate || invDate <= endDate);
    return matchesSearch && matchesStatus && matchesService && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
              {t.invoices}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'ar'
                ? 'إدارة وإنشاء وتعديل الفواتير الضريبية والمطالبات المالية بالكامل بالفترات المحددة'
                : 'Create, manage, and edit tax invoices & period billing claims'}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addInvoice}</span>
        </button>
      </div>

      {/* Filter & Search Bar with Period Selection */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        {/* Quick Period Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-bold ml-1 rtl:ml-2 ltr:mr-2">
            {lang === 'ar' ? 'فترة الفواتير:' : 'Period Presets:'}
          </span>
          <button
            type="button"
            onClick={() => setInvoiceDatePreset('today')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition text-[11px]"
          >
            {lang === 'ar' ? 'اليوم' : 'Today'}
          </button>
          <button
            type="button"
            onClick={() => setInvoiceDatePreset('this_week')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition text-[11px]"
          >
            {lang === 'ar' ? 'هذا الأسبوع' : 'This Week'}
          </button>
          <button
            type="button"
            onClick={() => setInvoiceDatePreset('this_month')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition text-[11px]"
          >
            {lang === 'ar' ? 'هذا الشهر' : 'This Month'}
          </button>
          <button
            type="button"
            onClick={() => setInvoiceDatePreset('last_month')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition text-[11px]"
          >
            {lang === 'ar' ? 'الشهر السابق' : 'Last Month'}
          </button>
          <button
            type="button"
            onClick={() => setInvoiceDatePreset('last_30_days')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition text-[11px]"
          >
            {lang === 'ar' ? 'آخر 30 يوماً' : 'Last 30 Days'}
          </button>
          <button
            type="button"
            onClick={() => setInvoiceDatePreset('all')}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-slate-700 dark:text-slate-300 font-bold transition text-[11px]"
          >
            {lang === 'ar' ? 'كافة التواريخ' : 'All Dates'}
          </button>
        </div>

        {/* Input Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-3 ltr:left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث باسم العميل أو رقم الفاتورة...' : 'Search client name or invoice #...'}
              className="w-full pr-9 ltr:pr-3 ltr:pl-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
              <span>{lang === 'ar' ? 'من تاريخ:' : 'From Date:'}</span>
              {startDate && (
                <button
                  type="button"
                  onClick={() => setStartDate('')}
                  className="text-[10px] text-slate-400 hover:text-rose-500 font-normal"
                >
                  {lang === 'ar' ? 'مسح' : 'Clear'}
                </button>
              )}
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
              <span>{lang === 'ar' ? 'إلى تاريخ:' : 'To Date:'}</span>
              {endDate && (
                <button
                  type="button"
                  onClick={() => setEndDate('')}
                  className="text-[10px] text-slate-400 hover:text-rose-500 font-normal"
                >
                  {lang === 'ar' ? 'مسح' : 'Clear'}
                </button>
              )}
            </div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <div className="mb-0.5 text-[11px] font-bold text-slate-600 dark:text-slate-400">
              <span>{lang === 'ar' ? 'حالة السداد:' : 'Payment Status:'}</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              <option value="all">{lang === 'ar' ? 'جميع حالات السداد' : 'All Payment Statuses'}</option>
              <option value="paid">{t.paid}</option>
              <option value="partial">{t.partial}</option>
              <option value="unpaid">{t.unpaid}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-extrabold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">{t.invoiceNumber}</th>
                <th className="py-3 px-4">{t.clientName}</th>
                <th className="py-3 px-4">{t.issueDate}</th>
                <th className="py-3 px-4">{t.totalAmount}</th>
                <th className="py-3 px-4">{t.paidAmount}</th>
                <th className="py-3 px-4">{t.remainingAmount}</th>
                <th className="py-3 px-4">{t.paymentStatus}</th>
                <th className="py-3 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {lang === 'ar' ? 'لا توجد فواتير مسجلة طابق خيارات البحث' : 'No invoices found matching criteria'}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-black text-blue-600 dark:text-blue-400 font-mono">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <div>{inv.clientName}</div>
                      {inv.clientPhone && <div className="text-[10px] text-slate-400 font-normal">{inv.clientPhone}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{inv.issueDate}</td>
                    <td className="py-3 px-4 font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(inv.totalAmount, settings.currency, lang)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(inv.paidAmount, settings.currency, lang)}
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(inv.remainingAmount, settings.currency, lang)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          inv.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : inv.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                        }`}
                      >
                        {inv.paymentStatus === 'paid'
                          ? t.paid
                          : inv.paymentStatus === 'partial'
                          ? t.partial
                          : t.unpaid}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setPrintingInvoice(inv)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition"
                          title={t.print}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition"
                          title={t.edit}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition"
                          title={t.delete}
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

      {/* CREATE / EDIT INVOICE MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full my-8 p-6 border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>{editingInvoice ? t.editInvoice : t.addInvoice}</span>
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-6">
              {/* Header Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.invoiceNumber} *
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.clientName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={lang === 'ar' ? 'اسم العميل أو اسم المؤسسة' : 'Client or Company Name'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.clientPhone}
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+966 50 000 0000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.clientTaxId}
                  </label>
                  <input
                    type="text"
                    value={clientTaxId}
                    onChange={(e) => setClientTaxId(e.target.value)}
                    placeholder="300000000000003"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.issueDate}
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.dueDate}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                    {t.lineItems}
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.addItem}</span>
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="col-span-5">
                      <input
                        type="text"
                        required
                        placeholder={t.description}
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder={t.quantity}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-center font-bold"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={t.unitPrice}
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-center font-bold"
                      />
                    </div>
                    <div className="col-span-2 text-right rtl:text-left font-black text-slate-900 dark:text-slate-100 text-xs">
                      {formatCurrency(item.total, settings.currency, lang)}
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        disabled={items.length === 1}
                        className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded transition disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Calculation Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.vatRateName} (%)
                    </label>
                    <select
                      value={vatRate}
                      onChange={(e) => setVatRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      {settings.vatRates?.map((v) => (
                        <option key={v.id} value={v.rate}>
                          {v.name} ({v.rate}%)
                        </option>
                      )) || <option value={15}>15% VAT</option>}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.paidAmount} *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t.subtotal}:</span>
                    <span className="font-bold font-mono">{formatCurrency(subtotal, settings.currency, lang)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t.vatAmount} ({vatRate}%):</span>
                    <span className="font-bold font-mono text-emerald-600">{formatCurrency(vatAmount, settings.currency, lang)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-300 dark:border-slate-700">
                    <span>{t.totalAmountWithVat}:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono">{formatCurrency(totalAmount, settings.currency, lang)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-rose-600 pt-1">
                    <span>{t.remainingAmount}:</span>
                    <span className="font-mono">{formatCurrency(remainingAmount, settings.currency, lang)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.paymentMethod}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="cash">{t.cash}</option>
                    <option value="credit_card">{t.creditCard}</option>
                    <option value="bank_transfer">{t.bankTransfer}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'ملاحظات الفاتورة' : 'Invoice Notes'}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT OFFICIAL TAX INVOICE MODAL */}
      {printingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="print:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">
                  {t.printableReceipt} - {printingInvoice.invoiceNumber}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Print Scale Buttons */}
                <div className="hidden sm:flex items-center gap-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-xl text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-300 font-bold px-1.5">
                    {lang === 'ar' ? 'حجم الطباعة:' : 'Print Scale:'}
                  </span>
                  <button
                    onClick={() => setPrintZoom(75)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                      printZoom === 75 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    75%
                  </button>
                  <button
                    onClick={() => setPrintZoom(85)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                      printZoom === 85 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    85%
                  </button>
                  <button
                    onClick={() => setPrintZoom(100)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                      printZoom === 100 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    100%
                  </button>
                  <button
                    onClick={() => setPrintZoom(115)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition ${
                      printZoom === 115 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    115%
                  </button>
                </div>

                <button
                  onClick={handleExportTaxInvoicePdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-md transition disabled:opacity-50"
                  title={lang === 'ar' ? 'تنزيل كملف PDF مباشر' : 'Download direct PDF file'}
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingPdf ? (lang === 'ar' ? 'جاري التحميل...' : 'Exporting...') : (lang === 'ar' ? 'تنزيل PDF' : 'Download PDF')}</span>
                </button>

                <button
                  onClick={() => {
                    triggerBrowserPrint('printable-tax-invoice');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t.print}</span>
                </button>
                <button
                  onClick={() => setPrintingInvoice(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable View */}
            <div
              id="printable-tax-invoice"
              style={{ zoom: printZoom / 100 }}
              className="p-8 bg-white text-slate-900 text-sm font-sans space-y-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  {settings.logoUrl && (
                    <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded" />
                  )}
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{settings.organizationName || settings.appName}</h2>
                    <p className="text-xs text-slate-500">{settings.address}</p>
                    <p className="text-xs text-slate-500">{t.phone}: {settings.contactPhone}</p>
                    <p className="text-xs text-slate-500">
                      {lang === 'ar' ? 'السجل التجاري (C.R.): ' : 'C.R.: '}{settings.commercialRegistration || '-'} | {lang === 'ar' ? 'الرقم الضريبي (VAT ID): ' : 'VAT ID: '}{settings.taxId}
                    </p>
                  </div>
                </div>

                <div className="text-left rtl:text-right">
                  <span className="inline-block px-3 py-1 bg-blue-600 text-white font-extrabold text-xs rounded uppercase mb-1">
                    {lang === 'ar' ? 'فاتورة ضريبية رسمية' : 'Tax Invoice'}
                  </span>
                  <p className="font-black text-slate-900 text-base font-mono">{printingInvoice.invoiceNumber}</p>
                  <p className="text-xs text-slate-500">{lang === 'ar' ? 'تاريخ الإصدار:' : 'Issue Date:'} {printingInvoice.issueDate}</p>
                  {printingInvoice.dueDate && (
                    <p className="text-xs text-slate-500">{lang === 'ar' ? 'تاريخ الاستحقاق:' : 'Due Date:'} {printingInvoice.dueDate}</p>
                  )}
                </div>
              </div>

              {/* Client Info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500 font-bold uppercase">{t.clientName}</p>
                  <p className="font-extrabold text-slate-900 text-sm">{printingInvoice.clientName}</p>
                  <p className="text-slate-600">{printingInvoice.clientPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold uppercase">{t.clientTaxId}</p>
                  <p className="font-mono font-bold text-slate-800">{printingInvoice.clientTaxId || '-'}</p>
                  <p className="text-emerald-700 font-extrabold mt-1">
                    {t.status}: {printingInvoice.paymentStatus.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left rtl:text-right border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-slate-700 text-xs font-bold uppercase">
                    <th className="py-2 px-1">{t.description}</th>
                    <th className="py-2 px-1 text-center">{t.quantity}</th>
                    <th className="py-2 px-1 text-center">{t.unitPrice}</th>
                    <th className="py-2 px-1 text-right rtl:text-left">{t.totalAmount}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {printingInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-1 font-bold text-slate-900">{item.description}</td>
                      <td className="py-2.5 px-1 text-center font-mono">{item.quantity}</td>
                      <td className="py-2.5 px-1 text-center font-mono">{formatCurrency(item.unitPrice, settings.currency, lang)}</td>
                      <td className="py-2.5 px-1 text-right rtl:text-left font-black font-mono">{formatCurrency(item.total, settings.currency, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Breakdown */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <div className="w-72 space-y-1.5 text-xs text-right rtl:text-left">
                  <div className="flex justify-between text-slate-600">
                    <span>{t.subtotal}:</span>
                    <span className="font-mono font-semibold">{formatCurrency(printingInvoice.subtotal, settings.currency, lang)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{t.vatAmount} ({printingInvoice.vatRate}%):</span>
                    <span className="font-mono font-semibold text-emerald-600">{formatCurrency(printingInvoice.vatAmount, settings.currency, lang)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-900">
                    <span>{t.totalAmountWithVat}:</span>
                    <span className="font-mono text-blue-700">{formatCurrency(printingInvoice.totalAmount, settings.currency, lang)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-700 font-bold">
                    <span>{t.paidAmount}:</span>
                    <span className="font-mono">{formatCurrency(printingInvoice.paidAmount, settings.currency, lang)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-rose-600 font-bold">
                    <span>{t.remainingAmount}:</span>
                    <span className="font-mono">{formatCurrency(printingInvoice.remainingAmount, settings.currency, lang)}</span>
                  </div>
                </div>
              </div>

              {/* Signature Areas */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs font-bold text-slate-700">
                <div className="border-t border-dashed border-slate-400 pt-3">
                  <p>{t.signatureCustomerLabel}</p>
                </div>
                <div className="border-t border-dashed border-slate-400 pt-3">
                  <p>{t.signatureAgentLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
