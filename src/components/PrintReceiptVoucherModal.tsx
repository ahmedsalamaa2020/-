import React, { useRef, useMemo } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  DollarSign,
  Share2,
  CheckCircle2,
  Building2,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { AppSettings, PaymentVoucher, Currency, Language } from '../types';
import { tafqeetArabic, numberToWordsEnglish } from '../utils/tafqeet';
import { generateQrDataUrl, generateZatcaTlvBase64 } from '../utils/zatcaQr';
import { generateWhatsAppUrl, createReceiptWhatsAppMessage } from '../utils/whatsappHelper';

interface PrintReceiptVoucherModalProps {
  voucher: PaymentVoucher;
  settings: AppSettings;
  currency: Currency;
  lang: Language;
  onClose: () => void;
}

export const PrintReceiptVoucherModal: React.FC<PrintReceiptVoucherModalProps> = ({
  voucher,
  settings,
  currency,
  lang,
  onClose,
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);

  const isReceipt = voucher.type === 'receipt';

  // Format currency text
  const currencyNameAr =
    currency === 'SAR' ? 'ريال سعودي' :
    currency === 'EGP' ? 'جنيه مصري' :
    currency === 'AED' ? 'درهم إماراتي' :
    currency === 'IQD' ? 'دينار عراقي' :
    currency === 'EUR' ? 'يورو' : 'دولار أمريكي';

  const amountInWordsAr = useMemo(() => {
    return tafqeetArabic(voucher.amount, currencyNameAr, 'هللة / قرش');
  }, [voucher.amount, currencyNameAr]);

  const amountInWordsEn = useMemo(() => {
    return numberToWordsEnglish(voucher.amount, currency);
  }, [voucher.amount, currency]);

  // QR Code Generation
  const qrDataUrl = useMemo(() => {
    if (settings.vatEnabled && settings.taxId) {
      const zatcaTlv = generateZatcaTlvBase64({
        sellerName: settings.organizationName || settings.appName,
        vatRegistrationNumber: settings.taxId,
        invoiceTimestamp: new Date().toISOString(),
        totalWithVat: voucher.amount,
        vatAmount: 0,
      });
      return generateQrDataUrl(zatcaTlv, 140);
    }
    const fallbackText = `VOUCHER:${voucher.voucherNumber}|AMOUNT:${voucher.amount}|DATE:${voucher.date}|NAME:${voucher.customerName}`;
    return generateQrDataUrl(fallbackText, 140);
  }, [voucher, settings]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppSend = () => {
    const msg = createReceiptWhatsAppMessage(
      voucher.voucherNumber,
      voucher.customerName,
      voucher.amount,
      currency,
      voucher.description,
      settings.organizationName || settings.appName,
      lang
    );
    const url = generateWhatsAppUrl('', msg);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const paymentMethodLabels: Record<string, { ar: string; en: string }> = {
    cash: { ar: 'نقداً (كاش)', en: 'Cash' },
    bank_transfer: { ar: 'تحويل بنكي مباشر', en: 'Bank Transfer' },
    electronic_gateway: { ar: 'بوابة دفع إلكتروني', en: 'Electronic Payment Gateway' },
    pos: { ar: 'بطاقة مدى / POS', en: 'POS / Mada Card' },
    credit_card: { ar: 'بطاقة مدى / ائتمان (POS/Card)', en: 'Credit/Debit Card' },
    check: { ar: 'شيك مصرفي', en: 'Bank Check' },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Top Control Bar - Hidden when printing */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition"
              title={lang === 'ar' ? 'إغلاق النافذة' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-sm">
                {isReceipt
                  ? (lang === 'ar' ? 'معاينة وطباعة سند قبض مالي رسمي' : 'Payment Receipt Voucher')
                  : (lang === 'ar' ? 'معاينة وطباعة سند صرف / استرداد تأمين' : 'Payment / Deposit Refund Voucher')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppSend}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إرسال عبر واتساب' : 'Send via WhatsApp'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة السند' : 'Print Voucher'}</span>
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div ref={printContentRef} className="p-6 sm:p-10 bg-white text-slate-900 font-sans space-y-6">
          {/* Header Section */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {settings.organizationName || settings.appName}
              </h1>
              <p className="text-xs text-slate-600 font-semibold">{settings.appDescription}</p>
              <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                {settings.commercialRegistration && (
                  <p>
                    <span className="font-bold text-slate-700">سجل تجاري: </span>
                    <span className="font-mono">{settings.commercialRegistration}</span>
                  </p>
                )}
                {settings.taxId && (
                  <p>
                    <span className="font-bold text-slate-700">الرقم الضريبي: </span>
                    <span className="font-mono">{settings.taxId}</span>
                  </p>
                )}
                {settings.contactPhone && (
                  <p>
                    <span className="font-bold text-slate-700">الهاتف: </span>
                    <span className="font-mono">{settings.contactPhone}</span>
                  </p>
                )}
                {settings.address && (
                  <p>
                    <span className="font-bold text-slate-700">العنوان: </span>
                    <span>{settings.address}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end text-left rtl:text-right shrink-0">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  className="h-16 w-auto object-contain mb-2 max-w-[160px]"
                />
              ) : (
                <div className="w-14 h-14 bg-blue-900 text-white font-black rounded-xl flex items-center justify-center text-xl mb-2">
                  {settings.appName.slice(0, 2).toUpperCase()}
                </div>
              )}

              {qrDataUrl && (
                <img src={qrDataUrl} alt="ZATCA QR Code" className="w-20 h-20 border border-slate-200 p-0.5 rounded shadow-2xs" />
              )}
            </div>
          </div>

          {/* Title Box */}
          <div className="text-center py-2 relative">
            <div className="inline-block px-8 py-2 bg-slate-900 text-white rounded-xl shadow-xs">
              <h2 className="text-lg font-extrabold tracking-wide">
                {isReceipt ? 'سند قبض مالي (RECEIPT VOUCHER)' : 'سند صرف مالي / استرداد (PAYMENT VOUCHER)'}
              </h2>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between text-xs font-bold text-slate-700 px-2 border-y border-dashed border-slate-300 py-2">
              <div>
                <span>رقم السند: </span>
                <span className="font-mono text-blue-700 font-extrabold text-sm">{voucher.voucherNumber}</span>
              </div>
              {voucher.contractNumber && (
                <div>
                  <span>رقم العقد المرتبط: </span>
                  <span className="font-mono text-slate-900">{voucher.contractNumber}</span>
                </div>
              )}
              <div>
                <span>التاريخ: </span>
                <span className="font-mono text-slate-900">{voucher.date}</span>
              </div>
            </div>
          </div>

          {/* Main Voucher Body Fields */}
          <div className="border border-slate-300 rounded-xl p-5 space-y-4 text-xs sm:text-sm bg-slate-50/50">
            {/* Row: Received From / Paid To */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <span className="font-bold text-slate-700 shrink-0 w-36">
                {isReceipt ? 'استلمنا من السيد / السادة:' : 'يصرف إلى السيد / السادة:'}
              </span>
              <span className="font-extrabold text-slate-900 text-base flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5">
                {voucher.customerName || 'عميل نقدي'}
              </span>
            </div>

            {/* Row: Amount Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center border-b border-slate-200 pb-3">
              <div className="font-bold text-slate-700">المبلغ بالأرقام:</div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <div className="bg-blue-900 text-white font-mono font-black text-lg px-4 py-1.5 rounded-lg shadow-xs">
                  {voucher.amount.toLocaleString()} {currency}
                </div>
              </div>
            </div>

            {/* Row: Amount in Words (Tafqeet) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <span className="font-bold text-slate-700 shrink-0 w-36">المبلغ بالحروف:</span>
              <span className="font-extrabold text-blue-950 text-xs sm:text-sm flex-1 bg-blue-50/70 border border-blue-200 rounded-lg px-3 py-1.5">
                {amountInWordsAr}
              </span>
            </div>

            {/* Row: Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">طريقة الدفع:</span>
                <span className="font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
                  {paymentMethodLabels[voucher.paymentMethod]?.ar || voucher.paymentMethod}
                </span>
              </div>
              {voucher.referenceNumber && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">رقم المرجع / الشيك:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1">
                    {voucher.referenceNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Row: Purpose / Description */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
              <span className="font-bold text-slate-700 shrink-0 w-36">وذلك مقابل / عن:</span>
              <span className="text-slate-900 font-semibold flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 min-h-[50px]">
                {voucher.description || 'سداد دفعة من إيجار سيارة'}
              </span>
            </div>
          </div>

          {/* Official Signatures & Stamp Box */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-slate-900 text-center">
            {/* Signature 1 */}
            <div className="space-y-12 border border-slate-300 rounded-xl p-3 bg-slate-50/40">
              <span className="block text-xs font-extrabold text-slate-800">
                {isReceipt ? 'توقيع المستلم / أمين الصندوق' : 'توقيع المستلم للدفعة'}
              </span>
              <div className="border-b border-dotted border-slate-400 mx-4"></div>
              <span className="block text-[11px] text-slate-600 font-bold">{voucher.receivedBy || 'المسؤول المالي'}</span>
            </div>

            {/* Stamp Box */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-400 rounded-xl p-3 text-slate-400">
              <ShieldCheck className="w-8 h-8 text-slate-300 mb-1" />
              <span className="text-[11px] font-bold uppercase tracking-wider">ختم المنشأة الرسمي</span>
            </div>

            {/* Signature 2 */}
            <div className="space-y-12 border border-slate-300 rounded-xl p-3 bg-slate-50/40">
              <span className="block text-xs font-extrabold text-slate-800">اعتماد المدير المالي / الإدارة</span>
              <div className="border-b border-dotted border-slate-400 mx-4"></div>
              <span className="block text-[11px] text-slate-600 font-bold">{voucher.approvedBy || 'الإدارة العامة'}</span>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-200">
            <p>تم إصدار هذا السند إلكترونياً عبر منظومة {settings.appName} ولا يعتبر معتمداً إلا بعد التوقيع والختم الرسمي.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
