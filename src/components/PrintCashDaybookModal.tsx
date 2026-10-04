import React, { useState } from 'react';
import {
  Printer,
  FileSpreadsheet,
  Download,
  X,
  Calendar,
  Building2,
  Wallet,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import {
  AppSettings,
  Currency,
  Language,
  SystemUser,
  TreasuryAccount,
  TreasuryTransaction,
} from '../types';
import { formatCurrency, translations } from '../translations/i18n';
import { exportToExcel } from '../utils/excelExport';
import { exportElementToPdf, triggerBrowserPrint } from '../utils/pdfExport';

interface PrintCashDaybookModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  selectedTreasuryId: string;
  treasuries: TreasuryAccount[];
  transactions: TreasuryTransaction[];
  openingBalance: number;
  closingBalance: number;
  actualCashCount?: number;
  denominations?: {
    d500: number;
    d200: number;
    d100: number;
    d50: number;
    d20: number;
    d10: number;
    d5: number;
    d1: number;
  };
  notes?: string;
  settings: AppSettings;
  currency: Currency;
  lang: Language;
  currentUser: SystemUser | null;
}

export const PrintCashDaybookModal: React.FC<PrintCashDaybookModalProps> = ({
  isOpen,
  onClose,
  date,
  selectedTreasuryId,
  treasuries,
  transactions,
  openingBalance,
  closingBalance,
  actualCashCount,
  denominations,
  notes,
  settings,
  currency,
  lang,
  currentUser,
}) => {
  const t = translations[lang];
  const [zoom, setZoom] = useState<number>(100);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  // Selected Treasury name
  const currentTreasury = treasuries.find((t) => t.id === selectedTreasuryId);
  const treasuryTitle = currentTreasury
    ? currentTreasury.name
    : lang === 'ar'
    ? 'جميع الخزائن وحسابات النقدية'
    : 'All Cash Safes & Accounts';

  // Day of week in Arabic/English
  const dateObj = new Date(date + 'T00:00:00');
  const dayName = dateObj.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'long',
  });

  // Daily transactions
  const dailyTransactions = transactions.filter((trx) => {
    const matchDate = trx.date === date;
    const matchTreasury = selectedTreasuryId === 'all' || trx.treasuryId === selectedTreasuryId;
    return matchDate && matchTreasury;
  });

  const totalInflow = dailyTransactions
    .filter((x) => x.type === 'inflow')
    .reduce((s, x) => s + Number(x.amount), 0);

  const totalOutflow = dailyTransactions
    .filter((x) => x.type === 'outflow')
    .reduce((s, x) => s + Number(x.amount), 0);

  const netDayFlow = totalInflow - totalOutflow;

  const actualCountNum = actualCashCount !== undefined ? Number(actualCashCount) : closingBalance;
  const variance = actualCountNum - closingBalance;

  // Running balance calculation
  let running = openingBalance;
  const listWithRunning = dailyTransactions.map((trx) => {
    if (trx.type === 'inflow') {
      running += Number(trx.amount);
    } else {
      running -= Number(trx.amount);
    }
    return {
      ...trx,
      calculatedRunning: running,
    };
  });

  const handlePrint = () => {
    triggerBrowserPrint('printable-cash-daybook');
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    await exportElementToPdf('printable-cash-daybook', `Cash-Daybook-${date}.pdf`);
    setIsExportingPdf(false);
  };

  const handleExportExcel = () => {
    exportToExcel({
      fileName: `Cash-Daybook-${date}.xls`,
      sheetName: 'Cash Daybook',
      title: lang === 'ar' ? 'دفتر يومية النقدية وحركة الصندوق' : 'Daily Cash Daybook',
      subtitle: `${dayName} - ${date} (${treasuryTitle})`,
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
      data: listWithRunning.map((trx) => ({
        ref: trx.transactionNumber,
        treasury: trx.treasuryName,
        type: trx.type === 'inflow' ? (lang === 'ar' ? 'وارد (قبض)' : 'Inflow') : (lang === 'ar' ? 'منصرف (صرف)' : 'Outflow'),
        category: trx.category,
        party: trx.partyName,
        desc: trx.description,
        method: trx.paymentMethod,
        inflow: trx.type === 'inflow' ? trx.amount : 0,
        outflow: trx.type === 'outflow' ? trx.amount : 0,
        balance: trx.calculatedRunning,
      })),
      summaryRows: [
        { label: lang === 'ar' ? 'رصيد بداية اليوم' : 'Opening Balance', value: formatCurrency(openingBalance, currency, lang) },
        { label: lang === 'ar' ? 'إجمالي الوارد اليومي' : 'Total Inflow', value: formatCurrency(totalInflow, currency, lang) },
        { label: lang === 'ar' ? 'إجمالي المنصرف اليومي' : 'Total Outflow', value: formatCurrency(totalOutflow, currency, lang) },
        { label: lang === 'ar' ? 'صافي حركة اليوم' : 'Net Flow', value: formatCurrency(netDayFlow, currency, lang) },
        { label: lang === 'ar' ? 'الرصيد الدفتري الختامي' : 'Book Closing Balance', value: formatCurrency(closingBalance, currency, lang) },
        { label: lang === 'ar' ? 'الجرد الفعلي للنقدية' : 'Physical Cash Count', value: formatCurrency(actualCountNum, currency, lang) },
        { label: lang === 'ar' ? 'فارق الجرد' : 'Variance', value: formatCurrency(variance, currency, lang) },
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[95vh] print:max-h-none print:max-w-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Controls Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{lang === 'ar' ? 'معاينة وطباعة دفتر يومية النقدية' : 'Daily Cash Daybook Print'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-mono">
                  {date} ({dayName})
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ar'
                  ? `بيان حركة الصندوق والوارد والمنصرف المعتمد - ${treasuryTitle}`
                  : `Certified Cash Daybook Statement - ${treasuryTitle}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Control */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400 text-[11px] font-bold">الحجم:</span>
              <input
                type="number"
                min={50}
                max={150}
                step={5}
                value={zoom}
                onChange={(e) => setZoom(Math.max(50, Math.min(150, Number(e.target.value) || 100)))}
                className="w-12 bg-slate-950 text-white font-mono text-xs text-center px-1 py-0.5 rounded border border-slate-700"
              />
              <span className="text-slate-400 font-mono">%</span>
            </div>

            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl font-bold text-xs transition border border-slate-700"
              title="تصدير إكسيل"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>إكسيل</span>
            </button>

            {/* Export PDF */}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-xl font-bold text-xs transition border border-slate-700 disabled:opacity-50"
              title="تصدير PDF"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>{isExportingPdf ? 'جاري...' : 'PDF'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المستند A4</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/40 print:p-0 print:bg-white print:overflow-visible">
          <div
            id="printable-cash-daybook"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-[210mm] mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 text-slate-900 print:shadow-none print:border-none print:p-0 print:max-w-none print:transform-none text-xs leading-relaxed space-y-4 font-sans"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header with Organization Details */}
            <div className="flex items-start justify-between pb-3 border-b-2 border-slate-900">
              <div className="flex items-center gap-3">
                {settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-12 h-12 object-contain rounded-lg border border-slate-200"
                  />
                )}
                <div>
                  <h1 className="text-base font-black text-slate-950 tracking-tight leading-tight">
                    {settings.organizationName || settings.appName}
                  </h1>
                  <p className="text-[10px] text-slate-600 mt-0.5">{settings.address}</p>
                  <p className="text-[9.5px] text-slate-600">
                    {t.phone}: <span dir="ltr" className="font-semibold">{settings.contactPhone}</span> | {lang === 'ar' ? 'س.ت:' : 'C.R:'} <span className="font-mono font-bold">{settings.commercialRegistration || '-'}</span> | {lang === 'ar' ? 'الرقم الضريبي:' : 'Tax ID:'} <span className="font-mono font-bold">{settings.taxId || '-'}</span>
                  </p>
                </div>
              </div>

              <div className="text-end shrink-0">
                <span className="inline-block px-2.5 py-1 bg-slate-950 text-white font-extrabold text-[11px] rounded-lg uppercase tracking-wider mb-1">
                  {lang === 'ar' ? 'دفتر يومية النقدية (الصندوق)' : 'Daily Cash Daybook'}
                </span>
                <p className="text-[11px] font-black text-slate-900 font-mono mt-0.5">
                  DAY-{date.replace(/-/g, '')}
                </p>
                <p className="text-[10px] text-slate-600 font-bold">
                  {dayName} - {date}
                </p>
              </div>
            </div>

            {/* Document Info Sub-banner */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div>
                <span className="text-slate-500 font-bold block">{lang === 'ar' ? 'الخزينة المحددة:' : 'Target Safe:'}</span>
                <span className="font-extrabold text-slate-900 text-[11px]">{treasuryTitle}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">{lang === 'ar' ? 'تاريخ اليومية:' : 'Daybook Date:'}</span>
                <span className="font-bold text-slate-900">{dayName} - {date}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">{lang === 'ar' ? 'المسؤول / أمين الصندوق:' : 'Cashier / Custodian:'}</span>
                <span className="font-bold text-slate-900">{currentTreasury?.responsiblePerson || currentUser?.fullName || 'أمين الصندوق'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">{lang === 'ar' ? 'وقت الطباعة والتوليد:' : 'Generated At:'}</span>
                <span className="font-mono text-slate-700">{new Date().toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
              </div>
            </div>

            {/* 6 Summary Cards for Daily Balances */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <div className="p-2 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[9px] text-slate-500 font-bold block uppercase">{lang === 'ar' ? 'رصيد الافتتاح' : 'Opening'}</span>
                <span className="text-xs font-black font-mono text-slate-900 block mt-0.5">
                  {formatCurrency(openingBalance, currency, lang)}
                </span>
              </div>

              <div className="p-2 rounded-xl border border-emerald-300 bg-emerald-50/70">
                <span className="text-[9px] text-emerald-800 font-bold block uppercase">{lang === 'ar' ? 'إجمالي الوارد' : 'Inflow (+)'}</span>
                <span className="text-xs font-black font-mono text-emerald-700 block mt-0.5">
                  +{formatCurrency(totalInflow, currency, lang)}
                </span>
              </div>

              <div className="p-2 rounded-xl border border-rose-300 bg-rose-50/70">
                <span className="text-[9px] text-rose-800 font-bold block uppercase">{lang === 'ar' ? 'إجمالي المنصرف' : 'Outflow (-)'}</span>
                <span className="text-xs font-black font-mono text-rose-700 block mt-0.5">
                  -{formatCurrency(totalOutflow, currency, lang)}
                </span>
              </div>

              <div className="p-2 rounded-xl border border-blue-300 bg-blue-50/70">
                <span className="text-[9px] text-blue-800 font-bold block uppercase">{lang === 'ar' ? 'صافي اليوم' : 'Net Flow'}</span>
                <span className={`text-xs font-black font-mono block mt-0.5 ${netDayFlow >= 0 ? 'text-blue-900' : 'text-rose-900'}`}>
                  {netDayFlow >= 0 ? '+' : ''}{formatCurrency(netDayFlow, currency, lang)}
                </span>
              </div>

              <div className="p-2 rounded-xl border border-slate-900 bg-slate-900 text-white">
                <span className="text-[9px] text-slate-300 font-bold block uppercase">{lang === 'ar' ? 'الرصيد الدفتري' : 'Book Balance'}</span>
                <span className="text-xs font-black font-mono text-amber-300 block mt-0.5">
                  {formatCurrency(closingBalance, currency, lang)}
                </span>
              </div>

              <div className={`p-2 rounded-xl border ${variance === 0 ? 'border-emerald-400 bg-emerald-50' : variance > 0 ? 'border-amber-400 bg-amber-50' : 'border-rose-400 bg-rose-50'}`}>
                <span className="text-[9px] font-bold block uppercase text-slate-700">{lang === 'ar' ? 'الجرد الفعلي' : 'Physical'}</span>
                <span className="text-xs font-black font-mono text-slate-950 block mt-0.5">
                  {formatCurrency(actualCountNum, currency, lang)}
                </span>
                <span className={`text-[8.5px] font-bold block mt-0.5 ${variance === 0 ? 'text-emerald-700' : variance > 0 ? 'text-amber-800' : 'text-rose-700'}`}>
                  {variance === 0 ? '✓ مطابق تماماً' : variance > 0 ? `+ زيادة ${formatCurrency(variance, currency, lang)}` : `! عجز ${formatCurrency(variance, currency, lang)}`}
                </span>
              </div>
            </div>

            {/* Denomination Breakdown (If Provided) */}
            {denominations && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="font-extrabold text-[10px] text-slate-800 flex items-center gap-1">
                    <span>💵</span>
                    <span>{lang === 'ar' ? 'كشف تفقيط وتعداد فئات النقدية بالجرد الفعلي:' : 'Physical Cash Denomination Count:'}</span>
                  </span>
                  <span className="font-mono font-bold text-[10px] text-slate-700">
                    {lang === 'ar' ? 'المجموع:' : 'Sum:'} {formatCurrency(actualCountNum, currency, lang)}
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center text-[9.5px]">
                  <div className="p-1 bg-white rounded border border-slate-200">
                    <span className="text-slate-500 font-bold block">500 ريال</span>
                    <span className="font-mono font-bold text-slate-900">{denominations.d500} × {denominations.d500 * 500}</span>
                  </div>
                  <div className="p-1 bg-white rounded border border-slate-200">
                    <span className="text-slate-500 font-bold block">200 ريال</span>
                    <span className="font-mono font-bold text-slate-900">{denominations.d200} × {denominations.d200 * 200}</span>
                  </div>
                  <div className="p-1 bg-white rounded border border-slate-200">
                    <span className="text-slate-500 font-bold block">100 ريال</span>
                    <span className="font-mono font-bold text-slate-900">{denominations.d100} × {denominations.d100 * 100}</span>
                  </div>
                  <div className="p-1 bg-white rounded border border-slate-200">
                    <span className="text-slate-500 font-bold block">50 ريال</span>
                    <span className="font-mono font-bold text-slate-900">{denominations.d50} × {denominations.d50 * 50}</span>
                  </div>
                  <div className="p-1 bg-white rounded border border-slate-200">
                    <span className="text-slate-500 font-bold block">20 ريال</span>
                    <span className="font-mono font-bold text-slate-900">{denominations.d20} × {denominations.d20 * 20}</span>
                  </div>
                  <div className="p-1 bg-white rounded border border-slate-200">
                    <span className="text-slate-500 font-bold block">10 ريال</span>
                    <span className="font-mono font-bold text-slate-900">{denominations.d10} × {denominations.d10 * 10}</span>
                  </div>
                  <div className="p-1 bg-white rounded border border-slate-200">
                    <span className="text-slate-500 font-bold block">5 ريال</span>
                    <span className="font-mono font-bold text-slate-900">{denominations.d5} × {denominations.d5 * 5}</span>
                  </div>
                  <div className="p-1 bg-white rounded border border-slate-200">
                    <span className="text-slate-500 font-bold block">1 ريال</span>
                    <span className="font-mono font-bold text-slate-900">{denominations.d1} × {denominations.d1 * 1}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Table of Chronological Inflows and Outflows */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-[11px] text-slate-950 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{lang === 'ar' ? 'سجل حركات النقدية التفصيلي لليوم (الوارد والمنصرف):' : 'Daily Cash Journal Movement Ledger:'}</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-bold">
                  {dailyTransactions.length} {lang === 'ar' ? 'حركة مسجلة' : 'records'}
                </span>
              </div>

              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-start">
                    <th className="p-1.5 border border-slate-300 w-8 text-center">#</th>
                    <th className="p-1.5 border border-slate-300 text-start w-24">{lang === 'ar' ? 'رقم السند' : 'Voucher #'}</th>
                    <th className="p-1.5 border border-slate-300 text-start w-16">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                    <th className="p-1.5 border border-slate-300 text-start">{lang === 'ar' ? 'الطرف / المستفيد' : 'Party'}</th>
                    <th className="p-1.5 border border-slate-300 text-start">{lang === 'ar' ? 'البيان والتفاصيل' : 'Description'}</th>
                    <th className="p-1.5 border border-slate-300 text-start w-20">{lang === 'ar' ? 'طريقة الدفع' : 'Method'}</th>
                    <th className="p-1.5 border border-slate-300 text-end w-20 text-emerald-800 bg-emerald-50/50">{lang === 'ar' ? 'وارد (+)' : 'Inflow'}</th>
                    <th className="p-1.5 border border-slate-300 text-end w-20 text-rose-800 bg-rose-50/50">{lang === 'ar' ? 'منصرف (-)' : 'Outflow'}</th>
                    <th className="p-1.5 border border-slate-300 text-end w-24 bg-slate-50 font-bold">{lang === 'ar' ? 'الرصيد اللحظي' : 'Running'}</th>
                  </tr>
                </thead>
                <tbody>
                  {listWithRunning.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-slate-500 font-bold">
                        {lang === 'ar' ? 'لا توجد حركات نقدية مسجلة في هذا اليوم' : 'No transactions recorded on this date'}
                      </td>
                    </tr>
                  ) : (
                    listWithRunning.map((trx, idx) => {
                      const isInflow = trx.type === 'inflow';
                      return (
                        <tr key={trx.id || idx} className="hover:bg-slate-50 border-b border-slate-200">
                          <td className="p-1.5 border border-slate-200 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-200 font-mono font-bold text-slate-900">{trx.transactionNumber}</td>
                          <td className="p-1.5 border border-slate-200 font-bold">
                            {isInflow ? (
                              <span className="text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 text-[9px]">
                                {lang === 'ar' ? 'قبض وارد' : 'Inflow'}
                              </span>
                            ) : (
                              <span className="text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200 text-[9px]">
                                {lang === 'ar' ? 'صرف منصرف' : 'Outflow'}
                              </span>
                            )}
                          </td>
                          <td className="p-1.5 border border-slate-200 font-bold text-slate-900">{trx.partyName}</td>
                          <td className="p-1.5 border border-slate-200 text-slate-700 max-w-xs">{trx.description}</td>
                          <td className="p-1.5 border border-slate-200 text-slate-600 font-semibold">{trx.paymentMethod === 'cash' ? 'نقدي' : trx.paymentMethod}</td>
                          <td className="p-1.5 border border-slate-200 text-end font-mono font-bold text-emerald-700 bg-emerald-50/20">
                            {isInflow ? formatCurrency(trx.amount, currency, lang) : '-'}
                          </td>
                          <td className="p-1.5 border border-slate-200 text-end font-mono font-bold text-rose-700 bg-rose-50/20">
                            {!isInflow ? formatCurrency(trx.amount, currency, lang) : '-'}
                          </td>
                          <td className="p-1.5 border border-slate-200 text-end font-mono font-black text-slate-950 bg-slate-50/60">
                            {formatCurrency(trx.calculatedRunning, currency, lang)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-400">
                    <td colSpan={6} className="p-2 border border-slate-300 text-end">
                      {lang === 'ar' ? 'الإجماليات وصافي حركة اليوم:' : 'Total Movement Summary:'}
                    </td>
                    <td className="p-2 border border-slate-300 text-end font-mono text-emerald-800 bg-emerald-100/70">
                      +{formatCurrency(totalInflow, currency, lang)}
                    </td>
                    <td className="p-2 border border-slate-300 text-end font-mono text-rose-800 bg-rose-100/70">
                      -{formatCurrency(totalOutflow, currency, lang)}
                    </td>
                    <td className="p-2 border border-slate-300 text-end font-mono text-slate-950 bg-slate-200">
                      {formatCurrency(closingBalance, currency, lang)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes if any */}
            {notes && (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[10px]">
                <strong className="text-amber-900 block">{lang === 'ar' ? 'ملاحظات الإقفال والجرد:' : 'Closing & Audit Notes:'}</strong>
                <p className="text-slate-800 mt-0.5">{notes}</p>
              </div>
            )}

            {/* Official Signatures Section */}
            <div className="pt-4 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-center text-[10px] print:break-inside-avoid">
              <div className="space-y-6">
                <div>
                  <span className="font-extrabold text-slate-900 block">{lang === 'ar' ? 'أمين الصندوق / الكاشير' : 'Cashier / Custodian'}</span>
                  <span className="text-[9px] text-slate-500">{currentTreasury?.responsiblePerson || currentUser?.fullName || 'المستلم'}</span>
                </div>
                <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                <span className="text-[8.5px] text-slate-400">{lang === 'ar' ? 'التوقيع: ..........................' : 'Signature: ..................'}</span>
              </div>

              <div className="space-y-6">
                <div>
                  <span className="font-extrabold text-slate-900 block">{lang === 'ar' ? 'المحاسب المالي والمراجع' : 'Accountant & Auditor'}</span>
                  <span className="text-[9px] text-slate-500">{lang === 'ar' ? 'مراجعة قيود اليومية' : 'Audit Verification'}</span>
                </div>
                <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                <span className="text-[8.5px] text-slate-400">{lang === 'ar' ? 'التوقيع: ..........................' : 'Signature: ..................'}</span>
              </div>

              <div className="space-y-6">
                <div>
                  <span className="font-extrabold text-slate-900 block">{lang === 'ar' ? 'اعتماد المدير المالي / العام' : 'Chief Financial Officer'}</span>
                  <span className="text-[9px] text-slate-500">{lang === 'ar' ? 'اعتماد الإقفال والترحيل' : 'Authorized Approval'}</span>
                </div>
                <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                <span className="text-[8.5px] text-slate-400">{lang === 'ar' ? 'الختم والتوقيع: ..........................' : 'Stamp & Signature: ............'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
