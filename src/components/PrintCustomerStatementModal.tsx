import React, { useState, useMemo, useRef } from 'react';
import {
  Printer,
  FileSpreadsheet,
  X,
  User,
  Phone,
  Mail,
  FileText,
  DollarSign,
  Calendar,
  Send,
  Building2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Layers,
} from 'lucide-react';
import {
  Customer,
  RentalContract,
  Invoice,
  PaymentVoucher,
  AppSettings,
  Currency,
  Language,
} from '../types';
import { formatCurrency } from '../translations/i18n';
import { exportToExcel } from '../utils/excelExport';
import { generateWhatsAppUrl } from '../utils/whatsappHelper';

interface PrintCustomerStatementModalProps {
  customer: Customer;
  contracts: RentalContract[];
  invoices?: Invoice[];
  vouchers?: PaymentVoucher[];
  settings: AppSettings;
  currency: Currency;
  lang: Language;
  onClose: () => void;
}

export const PrintCustomerStatementModal: React.FC<PrintCustomerStatementModalProps> = ({
  customer,
  contracts,
  invoices = [],
  vouchers = [],
  settings,
  currency,
  lang,
  onClose,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  // Customer transactions ledger
  const customerContracts = useMemo(() => {
    return contracts.filter((c) => c.customerId === customer.id || c.customerName === customer.name);
  }, [contracts, customer]);

  const customerInvoices = useMemo(() => {
    return invoices.filter((i) => i.clientName === customer.name || i.clientPhone === customer.phone);
  }, [invoices, customer]);

  const customerVouchers = useMemo(() => {
    return vouchers.filter((v) => v.customerId === customer.id || v.customerName === customer.name);
  }, [vouchers, customer]);

  // Build unified chronological ledger
  const ledgerEntries = useMemo(() => {
    const entries: {
      id: string;
      date: string;
      type: string;
      reference: string;
      description: string;
      debit: number; // مدين (Charges / Rentals)
      credit: number; // دائن (Payments / Receipts)
    }[] = [];

    // Add contracts
    customerContracts.forEach((c) => {
      // Rental charge
      entries.push({
        id: `cnt_${c.id}`,
        date: c.startDate,
        type: lang === 'ar' ? 'عقد إيجار سيارة' : 'Rental Contract',
        reference: c.contractNumber,
        description: `${c.carModel} (${c.carPlate}) - ${c.totalDays} ${lang === 'ar' ? 'أيام' : 'days'}`,
        debit: c.totalAmount,
        credit: 0,
      });

      // Paid at contract signing
      if (c.paidAmount > 0) {
        entries.push({
          id: `pay_${c.id}`,
          date: c.startDate,
          type: lang === 'ar' ? 'سداد دفعة إيجار' : 'Rental Payment',
          reference: c.contractNumber,
          description: `${lang === 'ar' ? 'سداد نقدي/بنكي لعقد' : 'Payment for'} ${c.contractNumber}`,
          debit: 0,
          credit: c.paidAmount,
        });
      }

      // Excess mileage fee if any
      if (c.excessMileageFee && c.excessMileageFee > 0) {
        entries.push({
          id: `ex_${c.id}`,
          date: c.endDate,
          type: lang === 'ar' ? 'غرامة كيلومترات زائدة' : 'Excess Mileage Fee',
          reference: c.contractNumber,
          description: `${c.excessMileage} كم زائد (${c.excessMileageRate} / كم)`,
          debit: c.excessMileageFee,
          credit: 0,
        });
      }
    });

    // Add vouchers
    customerVouchers.forEach((v) => {
      if (v.type === 'receipt') {
        entries.push({
          id: `vouch_${v.id}`,
          date: v.date,
          type: lang === 'ar' ? 'سند قبض مالي' : 'Payment Receipt',
          reference: v.voucherNumber,
          description: v.description,
          debit: 0,
          credit: v.amount,
        });
      } else {
        // Payment / deposit refund
        entries.push({
          id: `vouch_${v.id}`,
          date: v.date,
          type: lang === 'ar' ? 'سند صرف / استرداد تأمين' : 'Refund Voucher',
          reference: v.voucherNumber,
          description: v.description,
          debit: v.amount,
          credit: 0,
        });
      }
    });

    // Filter by date if provided
    return entries
      .filter((e) => {
        if (startDate && e.date < startDate) return false;
        if (endDate && e.date > endDate) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [customerContracts, customerVouchers, startDate, endDate, lang]);

  // Compute running totals
  let runningBalance = 0;
  const ledgerWithBalances = ledgerEntries.map((e) => {
    runningBalance += e.debit - e.credit;
    return {
      ...e,
      balance: runningBalance,
    };
  });

  const totalDebit = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);
  const netOutstandingBalance = totalDebit - totalCredit;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const data = ledgerWithBalances.map((item) => ({
      date: item.date,
      type: item.type,
      reference: item.reference,
      description: item.description,
      debit: `${item.debit} ${currency}`,
      credit: `${item.credit} ${currency}`,
      balance: `${item.balance} ${currency}`,
    }));

    exportToExcel({
      fileName: `Customer_Statement_${customer.name.replace(/\s+/g, '_')}`,
      sheetName: 'Statement of Account',
      title: lang === 'ar' ? `كشف حساب عميل مفصل: ${customer.name}` : `Statement of Account: ${customer.name}`,
      subtitle: `${settings.organizationName || settings.appName} | ${new Date().toLocaleDateString()}`,
      columns: [
        { header: lang === 'ar' ? 'التاريخ' : 'Date', key: 'date' },
        { header: lang === 'ar' ? 'نوع الحركة' : 'Transaction Type', key: 'type' },
        { header: lang === 'ar' ? 'رقم المرجع / السند' : 'Reference No', key: 'reference' },
        { header: lang === 'ar' ? 'البيان / الوصف' : 'Description', key: 'description' },
        { header: lang === 'ar' ? 'مدين (مستحق)' : 'Debit', key: 'debit' },
        { header: lang === 'ar' ? 'دائن (مسدد)' : 'Credit', key: 'credit' },
        { header: lang === 'ar' ? 'الرصيد التراكمي' : 'Running Balance', key: 'balance' },
      ],
      data,
      summaryRows: [
        { label: lang === 'ar' ? 'إجمالي المبالغ المستحقة' : 'Total Invoiced / Debit', value: `${totalDebit.toLocaleString()} ${currency}` },
        { label: lang === 'ar' ? 'إجمالي المدفوعات المسددة' : 'Total Paid / Credit', value: `${totalCredit.toLocaleString()} ${currency}` },
        { label: lang === 'ar' ? 'صافي الرصيد المتبقي' : 'Net Balance Due', value: `${netOutstandingBalance.toLocaleString()} ${currency}` },
      ],
    });
  };

  const handleWhatsAppSend = () => {
    const msg =
      lang === 'ar'
        ? `📄 *كشف حساب مالي*
عزيزنا العميل *${customer.name}*،
إليك ملخص كشف حسابك لدى *${settings.organizationName || settings.appName}*:

• إجمالي الرسوم والمستحقات: *${totalDebit.toLocaleString()} ${currency}*
• إجمالي المسدد: *${totalCredit.toLocaleString()} ${currency}*
• صافي الرصيد المتبقي: *${netOutstandingBalance.toLocaleString()} ${currency}*

شاكرين لكم حسن تعاونكم معنا! 🌟`
        : `📄 *Statement of Account*
Dear *${customer.name}*,
Here is your account summary with *${settings.organizationName || settings.appName}*:

• Total Invoiced: *${totalDebit.toLocaleString()} ${currency}*
• Total Paid: *${totalCredit.toLocaleString()} ${currency}*
• Net Balance Due: *${netOutstandingBalance.toLocaleString()} ${currency}*

Thank you for your business! 🌟`;

    const url = generateWhatsAppUrl(customer.phone, msg);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Top Header & Actions (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition"
              title={lang === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-sm">
                {lang === 'ar' ? `كشف حساب العميل: ${customer.name}` : `Statement of Account: ${customer.name}`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleWhatsAppSend}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إرسال بالواتساب' : 'WhatsApp'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تصدير إكسل' : 'Excel'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة كشف الحساب' : 'Print Statement'}</span>
            </button>
          </div>
        </div>

        {/* Date Filter Bar (Hidden on Print) */}
        <div className="bg-slate-100 dark:bg-slate-800/80 p-3 px-5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3 print:hidden text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {lang === 'ar' ? 'تصفية حسب الفترة:' : 'Filter by Period:'}
          </span>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">{lang === 'ar' ? 'من:' : 'From:'}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">{lang === 'ar' ? 'إلى:' : 'To:'}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-rose-600 font-bold hover:underline"
            >
              {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
            </button>
          )}
        </div>

        {/* Printable Document Sheet */}
        <div ref={printRef} className="p-6 sm:p-8 bg-white text-slate-900 font-sans space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-xl font-black text-slate-900">{settings.organizationName || settings.appName}</h1>
              <p className="text-xs text-slate-600">{settings.appDescription}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                سجل تجاري: {settings.commercialRegistration || '---'} | الرقم الضريبي: {settings.taxId || '---'}
              </p>
            </div>
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="" className="h-14 w-auto object-contain max-w-[140px]" />
            )}
          </div>

          {/* Title & Customer Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                {lang === 'ar' ? 'كشف حساب مالي تفصيلي' : 'STATEMENT OF ACCOUNT'}
              </span>
              <h2 className="text-lg font-black text-slate-900">{customer.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                <span>الهاتف: <b className="font-mono text-slate-900">{customer.phone}</b></span>
                <span>الهوية: <b className="font-mono text-slate-900">{customer.nationalId}</b></span>
                {customer.jobTitle && (
                  <span>{lang === 'ar' ? 'الوظيفة:' : 'Occupation:'} <b className="text-slate-900 font-semibold">{customer.jobTitle}</b></span>
                )}
                {customer.licenseNumber && (
                  <span>رخصة القيادة: <b className="font-mono text-slate-900">{customer.licenseNumber}</b></span>
                )}
              </div>
            </div>

            <div className="text-right rtl:text-left shrink-0">
              <span className="text-[11px] text-slate-500 block">تاريخ الإصدار: {new Date().toLocaleDateString()}</span>
              <div className="mt-1 inline-block px-3 py-1 bg-blue-900 text-white font-black text-sm rounded-lg font-mono">
                {formatCurrency(netOutstandingBalance, currency, lang)}
              </div>
              <span className="block text-[10px] text-slate-500 font-bold mt-0.5">
                {netOutstandingBalance > 0 ? 'مبلغ مستحق السداد' : netOutstandingBalance < 0 ? 'رصيد دائن للعميل' : 'حساب خالص ومسدد'}
              </span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 block">إجمالي المستحقات (مدين)</span>
              <span className="text-base font-black text-slate-900 font-mono">{formatCurrency(totalDebit, currency, lang)}</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[11px] font-bold text-emerald-700 block">إجمالي المسدد (دائن)</span>
              <span className="text-base font-black text-emerald-700 font-mono">{formatCurrency(totalCredit, currency, lang)}</span>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-[11px] font-bold text-blue-700 block">صافي الرصيد المتبقي</span>
              <span className="text-base font-black text-blue-900 font-mono">{formatCurrency(netOutstandingBalance, currency, lang)}</span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-2.5">التاريخ</th>
                  <th className="p-2.5">نوع الحركة</th>
                  <th className="p-2.5">رقم المرجع</th>
                  <th className="p-2.5">البيان / الوصف</th>
                  <th className="p-2.5 text-center">مدين (+)</th>
                  <th className="p-2.5 text-center">دائن (-)</th>
                  <th className="p-2.5 text-center">الرصيد المتبقي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ledgerWithBalances.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="p-2.5 font-mono text-slate-700">{item.date}</td>
                    <td className="p-2.5 font-bold text-slate-800">{item.type}</td>
                    <td className="p-2.5 font-mono font-semibold text-blue-700">{item.reference}</td>
                    <td className="p-2.5 text-slate-600">{item.description}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-900">
                      {item.debit > 0 ? item.debit.toLocaleString() : '-'}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-emerald-600">
                      {item.credit > 0 ? item.credit.toLocaleString() : '-'}
                    </td>
                    <td className="p-2.5 text-center font-mono font-black text-slate-900">
                      {item.balance.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {ledgerWithBalances.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      لا توجد حركات مالية مسجلة لهذا العميل في الفترة المحددة
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
                  <td colSpan={4} className="p-2.5 text-right font-bold text-slate-800">
                    الإجماليات الكلية:
                  </td>
                  <td className="p-2.5 text-center font-mono text-slate-900">{totalDebit.toLocaleString()} {currency}</td>
                  <td className="p-2.5 text-center font-mono text-emerald-700">{totalCredit.toLocaleString()} {currency}</td>
                  <td className="p-2.5 text-center font-mono text-blue-900">{netOutstandingBalance.toLocaleString()} {currency}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer & Stamps */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-xs">
            <div className="space-y-8">
              <span className="font-bold text-slate-700 block">توقيع العميل / المستلم</span>
              <div className="border-b border-dashed border-slate-400 mx-8"></div>
            </div>
            <div className="space-y-8">
              <span className="font-bold text-slate-700 block">اعتماد الحسابات والختم الرسمي</span>
              <div className="border-b border-dashed border-slate-400 mx-8"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
