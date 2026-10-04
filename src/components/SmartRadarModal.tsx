import React, { useState, useMemo } from 'react';
import {
  Radar,
  AlertTriangle,
  Clock,
  Wrench,
  UserCheck,
  CreditCard,
  Building2,
  X,
  Phone,
  Send,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  Car,
  RentalContract,
  Customer,
  Driver,
  Invoice,
  CorporateContract,
  AppSettings,
  Currency,
  Language,
} from '../types';
import { formatCurrency } from '../translations/i18n';
import { generateWhatsAppUrl, createReturnReminderWhatsAppMessage } from '../utils/whatsappHelper';

interface SmartRadarModalProps {
  cars: Car[];
  contracts: RentalContract[];
  customers: Customer[];
  drivers: Driver[];
  invoices: Invoice[];
  corporateContracts: CorporateContract[];
  settings: AppSettings;
  currency: Currency;
  lang: Language;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const SmartRadarModal: React.FC<SmartRadarModalProps> = ({
  cars,
  contracts,
  customers,
  drivers,
  invoices,
  corporateContracts,
  settings,
  currency,
  lang,
  onClose,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'returns' | 'maintenance' | 'licenses' | 'invoices' | 'corporate'>('all');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. Expiring / Overdue Rental Contracts
  const expiringContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (c.status !== 'active') return false;
      return c.endDate <= todayStr;
    });
  }, [contracts, todayStr]);

  // 2. Overdue Maintenance Cars
  const overdueMaintenanceCars = useMemo(() => {
    return cars.filter((c) => {
      if (c.status === 'sold' || c.status === 'maintenance') return false;
      return c.currentMileage >= c.nextServiceMileage;
    });
  }, [cars]);

  // 3. Expiring Customer / Driver Licenses
  const expiringLicenses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items: {
      type: 'customer' | 'driver';
      name: string;
      phone: string;
      licenseNo: string;
      expiryDate: string;
      daysRemaining: number;
    }[] = [];

    // Customers
    customers.forEach((c) => {
      if (c.licenseExpiryDate) {
        const [y, m, d] = c.licenseExpiryDate.split('-').map(Number);
        const exp = new Date(y, m - 1, d);
        const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 30) {
          items.push({
            type: 'customer',
            name: c.name,
            phone: c.phone,
            licenseNo: c.licenseNumber || '---',
            expiryDate: c.licenseExpiryDate,
            daysRemaining: diffDays,
          });
        }
      }
    });

    // Drivers
    drivers.forEach((d) => {
      if (d.licenseExpiry) {
        const [y, m, dNum] = d.licenseExpiry.split('-').map(Number);
        const exp = new Date(y, m - 1, dNum);
        const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 30) {
          items.push({
            type: 'driver',
            name: d.name,
            phone: d.phone,
            licenseNo: d.licenseNumber || '---',
            expiryDate: d.licenseExpiry,
            daysRemaining: diffDays,
          });
        }
      }
    });

    return items;
  }, [customers, drivers]);

  // 4. Overdue & Unpaid Invoices
  const pendingInvoices = useMemo(() => {
    return invoices.filter((i) => i.paymentStatus !== 'paid' && i.remainingAmount > 0);
  }, [invoices]);

  // 5. Expiring Corporate Contracts
  const expiringCorporate = useMemo(() => {
    return corporateContracts.filter((c) => {
      if (c.status !== 'active') return false;
      return c.endDate <= todayStr;
    });
  }, [corporateContracts, todayStr]);

  const totalAlertsCount =
    expiringContracts.length +
    overdueMaintenanceCars.length +
    expiringLicenses.length +
    pendingInvoices.length +
    expiringCorporate.length;

  const handleSendReturnWhatsApp = (contract: RentalContract) => {
    const msg = createReturnReminderWhatsAppMessage(
      contract,
      settings.organizationName || settings.appName,
      lang
    );
    const url = generateWhatsAppUrl(contract.customerPhone, msg);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
              <Radar className="w-6 h-6 animate-pulse text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {lang === 'ar' ? 'الرادار الذكي وتنبيهات الأسطول الاستباقية' : 'Smart Fleet & Operations Radar'}
                </h2>
                <span className="text-xs px-2.5 py-0.5 bg-rose-600 text-white font-extrabold rounded-full">
                  {totalAlertsCount} {lang === 'ar' ? 'تنبيه عاجل' : 'Alerts'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'ar'
                  ? 'متابعة حية لمواعيد الإرجاع، الصيانات المستحقة، الرخص المنتهية، والمستحقات المالية'
                  : 'Real-time monitoring for contract returns, overdue services, licenses, and balances'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="bg-slate-100 dark:bg-slate-800/80 p-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الكل' : 'All'} ({totalAlertsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('returns')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'returns' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'إرجاع عقود اليوم' : 'Returns'} ({expiringContracts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'maintenance' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'صيانة مستحقة' : 'Services'} ({overdueMaintenanceCars.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('licenses')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'licenses' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'رخص تنتهي قريباً' : 'Licenses'} ({expiringLicenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'invoices' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'فواتير معلقة' : 'Unpaid Invoices'} ({pendingInvoices.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Section 1: Contracts due for return */}
          {(activeTab === 'all' || activeTab === 'returns') && expiringContracts.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{lang === 'ar' ? 'عقود إيجار مستحقة الإرجاع اليوم أو متأخرة' : 'Contracts Due for Return / Overdue'}</span>
              </h3>

              <div className="grid grid-cols-1 gap-2">
                {expiringContracts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-rose-900 dark:text-rose-200">
                          {c.contractNumber}
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">
                          {c.customerName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">({c.customerPhone})</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        السيارة: <b>{c.carModel}</b> ({c.carPlate}) • تاريخ الإرجاع المحدد: <b className="text-rose-700">{c.endDate}</b>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendReturnWhatsApp(c)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs transition"
                      >
                        <Send className="w-3 h-3" />
                        <span>{lang === 'ar' ? 'تذكير واتساب' : 'WhatsApp'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigate('contracts');
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs transition"
                      >
                        <span>{lang === 'ar' ? 'فتح العقد' : 'Open'}</span>
                        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Overdue Maintenance */}
          {(activeTab === 'all' || activeTab === 'maintenance') && overdueMaintenanceCars.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <Wrench className="w-4 h-4" />
                <span>{lang === 'ar' ? 'سيارات تجاوزت عداد الصيانة الدورية وتغيير الزيت' : 'Vehicles Overdue for Service & Oil Change'}</span>
              </h3>

              <div className="grid grid-cols-1 gap-2">
                {overdueMaintenanceCars.map((car) => {
                  const kmDiff = car.currentMileage - car.nextServiceMileage;
                  return (
                    <div
                      key={car.id}
                      className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                          {car.brand} {car.model} ({car.year}) - {car.plateNumber}
                        </span>
                        <p className="text-[11px] text-amber-900 dark:text-amber-200 font-mono mt-0.5">
                          العداد الحالي: <b>{car.currentMileage.toLocaleString()} كم</b> | استحقاق الصيانة: <b>{car.nextServiceMileage.toLocaleString()} كم</b> ({kmDiff > 0 ? `متأخر بـ ${kmDiff.toLocaleString()} كم` : 'مستحق حالاً'})
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onNavigate('maintenance');
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs transition"
                      >
                        <span>{lang === 'ar' ? 'تسجيل صيانة فورية' : 'Record Service'}</span>
                        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Expiring Licenses */}
          {(activeTab === 'all' || activeTab === 'licenses') && expiringLicenses.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>{lang === 'ar' ? 'رخص قيادة تنتهي خلال 30 يوماً (عملاء وسائقين)' : 'Driving Licenses Expiring Soon'}</span>
              </h3>

              <div className="grid grid-cols-1 gap-2">
                {expiringLicenses.map((lic, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">{lic.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-200 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200">
                          {lic.type === 'driver' ? (lang === 'ar' ? 'سائق' : 'Driver') : (lang === 'ar' ? 'عميل' : 'Customer')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        رقم الرخصة: {lic.licenseNo} • تاريخ الانتهاء: <b className="text-purple-700">{lic.expiryDate}</b> ({lic.daysRemaining <= 0 ? 'منتهية' : `متبقي ${lic.daysRemaining} يوم`})
                      </p>
                    </div>

                    <a
                      href={`tel:${lic.phone}`}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs transition"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'اتصال' : 'Call'}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Pending Invoices */}
          {(activeTab === 'all' || activeTab === 'invoices') && pendingInvoices.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>{lang === 'ar' ? 'فواتير ومستحقات مالية معلقة' : 'Pending Invoices & Due Balances'}</span>
              </h3>

              <div className="grid grid-cols-1 gap-2">
                {pendingInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{inv.invoiceNumber}</span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">{inv.clientName}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        المتبقي: <b className="text-emerald-700 font-black">{formatCurrency(inv.remainingAmount, currency, lang)}</b> من أصل {formatCurrency(inv.totalAmount, currency, lang)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigate('invoices');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs transition"
                    >
                      <span>{lang === 'ar' ? 'تحصيل الفاتورة' : 'Collect'}</span>
                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalAlertsCount === 0 && (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                {lang === 'ar' ? 'الأسطول والعمليات في حالة ممتازة ومستقرة!' : 'All operations and fleet are fully optimal!'}
              </h4>
              <p className="text-xs">
                {lang === 'ar' ? 'لا توجد تنبيهات عاجلة أو صيانات متأخرة في الوقت الحالي.' : 'No overdue returns or pending maintenance alerts.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
