import React, { useRef, useState } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Printer,
  FileSpreadsheet,
  X,
  Car,
  User,
  DollarSign,
  Briefcase,
  Filter,
} from 'lucide-react';
import { AppSettings, DeliveryService, Language } from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { exportToExcel } from '../utils/excelExport';

interface PrintDeliveryMonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  month?: string; // YYYY-MM
  startDate?: string;
  endDate?: string;
  selectedClientName: string; // 'all' or specific customer/company name
  deliveries: DeliveryService[];
  settings: AppSettings;
  lang: Language;
}

export const PrintDeliveryMonthlyReportModal: React.FC<PrintDeliveryMonthlyReportModalProps> = ({
  isOpen,
  onClose,
  month: propMonth,
  startDate: propStartDate,
  endDate: propEndDate,
  selectedClientName,
  deliveries,
  settings,
  lang,
}) => {
  const t = translations[lang];
  const printRef = useRef<HTMLDivElement>(null);

  const [localStartDate, setLocalStartDate] = useState<string>(propStartDate || (propMonth ? `${propMonth}-01` : ''));
  const [localEndDate, setLocalEndDate] = useState<string>(propEndDate || '');

  React.useEffect(() => {
    if (propStartDate) setLocalStartDate(propStartDate);
    else if (propMonth) setLocalStartDate(`${propMonth}-01`);
    if (propEndDate) setLocalEndDate(propEndDate);
  }, [propStartDate, propEndDate, propMonth]);

  if (!isOpen) return null;

  // Filter deliveries for the selected period / month and customer/company
  const filteredTrips = deliveries.filter((d) => {
    const tripDate = (d.scheduledDate || d.createdAt || '').slice(0, 10);
    
    if (localStartDate && tripDate < localStartDate) return false;
    if (localEndDate && tripDate > localEndDate) return false;

    if (!localStartDate && !localEndDate && propMonth) {
      if (!tripDate.startsWith(propMonth)) return false;
    }

    const matchesClient =
      selectedClientName === 'all' ||
      d.customerName === selectedClientName ||
      d.cargoDescription?.includes(selectedClientName);
    return matchesClient;
  }).sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));

  // Calculations
  const totalTrips = filteredTrips.length;
  const completedTrips = filteredTrips.filter((t) => t.status === 'completed').length;
  const inProgressTrips = filteredTrips.filter((t) => t.status === 'in_progress').length;
  const pendingTrips = filteredTrips.filter((t) => t.status === 'pending').length;
  const totalRevenue = filteredTrips.reduce((sum, t) => sum + (t.price || 0), 0);
  const totalPassengers = filteredTrips.reduce((sum, t) => sum + (t.passengerCount || 1), 0);

  const periodDisplay = localStartDate && localEndDate
    ? `${lang === 'ar' ? 'من' : 'From'} ${localStartDate} ${lang === 'ar' ? 'إلى' : 'To'} ${localEndDate}`
    : localStartDate
    ? `${lang === 'ar' ? 'من تاريخ' : 'From'} ${localStartDate}`
    : propMonth || (lang === 'ar' ? 'كافة الفترات' : 'All Time');

  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    const columns = [
      { header: lang === 'ar' ? 'رقم الرحلة' : 'Order No', key: 'orderNumber', width: 16 },
      { header: lang === 'ar' ? 'اسم العميل / الشركة' : 'Customer / Company', key: 'customerName', width: 22 },
      { header: lang === 'ar' ? 'رقم الهاتف' : 'Phone', key: 'customerPhone', width: 16 },
      { header: lang === 'ar' ? 'نوع الخدمة' : 'Trip Type', key: 'tripTypeLabel', width: 20 },
      { header: lang === 'ar' ? 'نقطة الانطلاق (من)' : 'Pickup Location', key: 'pickupAddress', width: 22 },
      { header: lang === 'ar' ? 'وجهة الوصول (إلى)' : 'Dropoff Location', key: 'dropoffAddress', width: 22 },
      { header: lang === 'ar' ? 'التاريخ' : 'Date', key: 'scheduledDate', width: 14 },
      { header: lang === 'ar' ? 'الوقت' : 'Time', key: 'scheduledTime', width: 12 },
      { header: lang === 'ar' ? 'السائق' : 'Driver', key: 'driverName', width: 18 },
      { header: lang === 'ar' ? 'السيارة' : 'Vehicle Plate', key: 'carPlate', width: 16 },
      { header: lang === 'ar' ? 'عدد الركاب' : 'Passenger Count', key: 'passengerCount', width: 14 },
      { header: lang === 'ar' ? 'المبلغ' : 'Price', key: 'priceFormatted', width: 16 },
      { header: lang === 'ar' ? 'حالة السداد' : 'Payment Status', key: 'paymentStatusLabel', width: 14 },
      { header: lang === 'ar' ? 'حالة الرحلة' : 'Trip Status', key: 'statusLabel', width: 16 },
      { header: lang === 'ar' ? 'الملاحظات' : 'Notes', key: 'notes', width: 26 },
    ];

    const data = filteredTrips.map((d) => ({
      orderNumber: d.orderNumber,
      customerName: d.customerName,
      customerPhone: d.customerPhone || '-',
      tripTypeLabel: d.tripType === 'airport' ? (lang === 'ar' ? 'استقبال مطار VIP' : 'Airport') : (lang === 'ar' ? 'توصيل ركاب' : 'Passenger'),
      pickupAddress: d.pickupAddress,
      dropoffAddress: d.dropoffAddress,
      scheduledDate: d.scheduledDate,
      scheduledTime: d.scheduledTime,
      driverName: d.driverName || '-',
      carPlate: d.carPlate || '-',
      passengerCount: d.passengerCount || 1,
      priceFormatted: `${d.price} ${settings.currency}`,
      paymentStatusLabel: d.paymentStatus === 'paid' ? (lang === 'ar' ? 'مدفوع' : 'Paid') : (lang === 'ar' ? 'معلق' : 'Pending'),
      statusLabel: d.status === 'completed' ? (lang === 'ar' ? 'مكتملة' : 'Completed') : (lang === 'ar' ? 'سارية / معلقة' : 'Active'),
      notes: d.notes || '-',
    }));

    const summaryRows = [
      { label: lang === 'ar' ? 'إجمالي عدد الرحلات:' : 'Total Trips:', value: totalTrips },
      { label: lang === 'ar' ? 'الرحلات المكتملة:' : 'Completed Trips:', value: `${completedTrips} / ${totalTrips}` },
      { label: lang === 'ar' ? 'إجمالي المبالغ المستحقة:' : 'Total Billed Revenue:', value: formatCurrency(totalRevenue, settings.currency, lang) },
      { label: lang === 'ar' ? 'إجمالي حركة الركاب:' : 'Total Passengers:', value: totalPassengers },
    ];

    const clientTitle = selectedClientName === 'all' ? (lang === 'ar' ? 'كافة العملاء والشركات' : 'All Clients') : selectedClientName;

    exportToExcel({
      fileName: `تقرير_رحلات_توصيل_${clientTitle}_${localStartDate || 'فترة'}_إلى_${localEndDate || 'الآن'}`,
      sheetName: 'سجل رحلات التوصيل',
      title: `${settings.organizationName || settings.appName} - ${lang === 'ar' ? 'تقرير رحلات وتوصيل الركاب بالفترة' : 'Passenger & Delivery Trips Period Report'}`,
      subtitle: `${lang === 'ar' ? 'العميل / الشركة:' : 'Client:'} ${clientTitle} | ${lang === 'ar' ? 'الفترة:' : 'Period:'} ${periodDisplay}`,
      columns,
      data,
      summaryRows,
    });
  };

  const clientHeading =
    selectedClientName === 'all'
      ? (lang === 'ar' ? 'كافة العملاء والشركات' : 'All Clients & Companies')
      : selectedClientName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden my-auto print:max-h-none print:border-none print:shadow-none print:bg-white print:w-full print:rounded-none">
        {/* Toolbar (Hidden in Print) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-slate-800 bg-slate-900 print:hidden text-white gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm">
                {lang === 'ar' ? `تقرير رحلات: ${clientHeading}` : `Trips Report: ${clientHeading}`}
              </h3>
              <p className="text-xs text-slate-400">
                {periodDisplay} • {lang === 'ar' ? 'معاينة وطباعة وتصدير إكسيل' : 'Print & Excel Export'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl text-xs border border-slate-700">
              <span className="text-slate-400 text-[10px]">{lang === 'ar' ? 'من:' : 'From:'}</span>
              <input
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                className="bg-transparent text-white font-mono text-xs focus:outline-hidden"
              />
              <span className="text-slate-400 text-[10px]">{lang === 'ar' ? 'إلى:' : 'To:'}</span>
              <input
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                className="bg-transparent text-white font-mono text-xs focus:outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={handleExcelExport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إكسيل' : 'Excel'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة' : 'Print'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 print:bg-white print:p-0 print:overflow-visible text-slate-900">
          <div
            ref={printRef}
            id="printable-delivery-report"
            className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 max-w-4xl mx-auto space-y-5 print:space-y-4"
          >
            {/* Header */}
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
                  {lang === 'ar' ? 'كشف حساب ورحلات التوصيل بالفترة' : 'Passenger & Delivery Period Statement'}
                </span>
                <p className="text-xs font-black text-blue-900 mt-1 font-mono">{periodDisplay}</p>
                <p className="text-[10px] text-slate-500">
                  {lang === 'ar' ? 'تاريخ الاستخراج:' : 'Generated on:'} {new Date().toISOString().slice(0, 10)}
                </p>
              </div>
            </div>

            {/* Target Client Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">{lang === 'ar' ? 'العميل / الشركة:' : 'Client / Company:'}</span>
                <span className="font-black text-slate-900 text-sm">{clientHeading}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">{lang === 'ar' ? 'فترة التقرير:' : 'Period:'}</span>
                <span className="font-mono font-bold text-blue-900">{periodDisplay}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">{lang === 'ar' ? 'عدد الرحلات المسجلة:' : 'Total Trips Count:'}</span>
                <span className="font-bold text-slate-900 font-mono">{totalTrips} {lang === 'ar' ? 'رحلة' : 'Trips'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">{lang === 'ar' ? 'إجمالي القيمة المالية:' : 'Total Value:'}</span>
                <span className="font-black text-emerald-700 font-mono text-sm">{formatCurrency(totalRevenue, settings.currency, lang)}</span>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-800 block leading-tight">{lang === 'ar' ? 'إجمالي الرحلات' : 'Total Trips'}</span>
                <span className="text-base font-black text-blue-950 font-mono">{totalTrips}</span>
              </div>

              <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 block leading-tight">{lang === 'ar' ? 'الرحلات المكتملة' : 'Completed Trips'}</span>
                <span className="text-base font-black text-emerald-950 font-mono">{completedTrips} / {totalTrips}</span>
              </div>

              <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 block leading-tight">{lang === 'ar' ? 'قيد التنفيذ / مجدولة' : 'In Progress / Pending'}</span>
                <span className="text-base font-black text-amber-950 font-mono">{inProgressTrips + pendingTrips}</span>
              </div>

              <div className="p-2.5 bg-purple-50/80 rounded-xl border border-purple-200">
                <span className="text-[10px] font-bold text-purple-800 block leading-tight">{lang === 'ar' ? 'حركة الركاب' : 'Passengers'}</span>
                <span className="text-base font-black text-purple-950 font-mono">{totalPassengers} {lang === 'ar' ? 'راكب' : 'pass.'}</span>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                  <tr>
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5">{lang === 'ar' ? 'رقم وتاريخ الرحلة' : 'Trip / Date'}</th>
                    <th className="p-2.5">{lang === 'ar' ? 'العميل / الراكب' : 'Customer'}</th>
                    <th className="p-2.5">{lang === 'ar' ? 'المسار (من ➜ إلى)' : 'Route'}</th>
                    <th className="p-2.5 text-center">{lang === 'ar' ? 'السائق / السيارة' : 'Driver / Car'}</th>
                    <th className="p-2.5 text-center">{lang === 'ar' ? 'المبلغ' : 'Price'}</th>
                    <th className="p-2.5 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTrips.map((t, idx) => (
                    <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="p-2 text-center font-mono text-slate-500 font-bold">{idx + 1}</td>
                      <td className="p-2">
                        <span className="font-mono font-bold text-blue-900 block">{t.orderNumber}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{t.scheduledDate} {t.scheduledTime}</span>
                      </td>
                      <td className="p-2 font-bold text-slate-900">
                        {t.customerName}
                        {t.passengerCount && t.passengerCount > 1 && (
                          <span className="text-[10px] font-normal text-slate-500 block">
                            ({t.passengerCount} {lang === 'ar' ? 'ركاب' : 'passengers'})
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-[11px] text-slate-700">
                        <span>{t.pickupAddress}</span> ➜ <span>{t.dropoffAddress}</span>
                      </td>
                      <td className="p-2 text-center text-[11px]">
                        <span className="font-bold text-slate-800 block">{t.driverName || '-'}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{t.carPlate || '-'}</span>
                      </td>
                      <td className="p-2 text-center font-mono font-black text-slate-900">
                        {formatCurrency(t.price, settings.currency, lang)}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status === 'completed' ? 'مكتملة' : t.status === 'in_progress' ? 'جارية' : 'معلقة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
                    <td colSpan={5} className="p-2.5 text-left rtl:text-left">
                      {lang === 'ar' ? 'الإجمالي العام لكافة رحلات الفترة:' : 'Grand Total:'}
                    </td>
                    <td className="p-2.5 text-center font-mono text-emerald-800 font-black text-sm">
                      {formatCurrency(totalRevenue, settings.currency, lang)}
                    </td>
                    <td className="p-2.5 text-center text-xs">
                      {completedTrips} {lang === 'ar' ? 'مكتمل' : 'done'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Official Signature & Stamps */}
            <div className="pt-4 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <p className="font-bold text-slate-700 mb-8">{lang === 'ar' ? 'إعداد المشرف / العمليات:' : 'Operations Supervisor:'}</p>
                <p className="text-[10px] text-slate-400">التوقيع</p>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center text-[9px] font-bold text-slate-400 text-center">
                  ختم المؤسسة
                </div>
              </div>
              <div>
                <p className="font-bold text-slate-700 mb-8">{lang === 'ar' ? 'الاعتماد المالي:' : 'Financial Approval:'}</p>
                <p className="text-[10px] text-slate-400">{settings.organizationName || 'الإدارة العامة'}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
