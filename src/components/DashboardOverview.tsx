import React from 'react';
import { Car, FileText, Truck, DollarSign, Wrench, AlertTriangle, Plus, ArrowUpRight, ShieldCheck, Tag, Clock, AlertCircle, TrendingUp, Activity, Gauge, AlertOctagon, Sparkles, CheckCircle2 } from 'lucide-react';
import { AppSettings, Car as CarType, Customer, DeliveryService, RentalContract, Currency, Language, TrafficFine } from '../types';
import { translations, formatCurrency } from '../translations/i18n';

interface DashboardOverviewProps {
  cars: CarType[];
  customers: Customer[];
  contracts: RentalContract[];
  deliveries: DeliveryService[];
  fines?: TrafficFine[];
  settings: AppSettings;
  currency: Currency;
  lang: Language;
  onNavigate: (module: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  cars,
  customers,
  contracts,
  deliveries,
  fines = [],
  settings,
  currency,
  lang,
  onNavigate,
}) => {
  const t = translations[lang];

  // Counts
  const availableCarsCount = cars.filter((c) => c.status === 'available').length;
  const rentedCarsCount = cars.filter((c) => c.status === 'rented').length;
  const maintenanceCarsCount = cars.filter((c) => c.status === 'maintenance').length;
  const soldCarsCount = cars.filter((c) => c.status === 'sold').length;

  const activeContractsCount = contracts.filter((c) => c.status === 'active').length;
  const pendingDeliveriesCount = deliveries.filter((d) => d.status === 'pending').length;

  const totalRevenue = contracts.reduce((acc, c) => acc + c.totalAmount, 0) +
                       deliveries.reduce((acc, d) => acc + d.price, 0);

  // Executive BI Calculations (Item 7)
  const activeFleetCount = cars.filter((c) => c.status !== 'sold').length;
  const fleetUtilizationRate = activeFleetCount > 0 ? Math.round((rentedCarsCount / activeFleetCount) * 100) : 0;
  
  // RevPAC (Revenue Per Available Car in Fleet)
  const revPac = activeFleetCount > 0 ? Math.round(totalRevenue / activeFleetCount) : 0;

  // Fleet Health Score (% of active cars not overdue for maintenance)
  const overdueMaintenanceCars = cars.filter(
    (c) => c.status !== 'maintenance' && c.status !== 'sold' && c.currentMileage >= c.nextServiceMileage
  );
  const healthyCarsCount = Math.max(0, activeFleetCount - overdueMaintenanceCars.length - maintenanceCarsCount);
  const fleetHealthScore = activeFleetCount > 0 ? Math.round((healthyCarsCount / activeFleetCount) * 100) : 100;

  // Average Contract Duration (in days)
  const avgRentalDays = contracts.length > 0
    ? Math.round(
        contracts.reduce((acc, c) => {
          const s = new Date(c.startDate).getTime();
          const e = new Date(c.endDate).getTime();
          const d = Math.max(1, Math.round((e - s) / (1000 * 3600 * 24)));
          return acc + d;
        }, 0) / contracts.length
      )
    : 0;

  // Total Estimated Fleet Market Value
  const estimatedFleetCapital = cars.reduce((acc, c) => acc + (c.salePrice || (c.dailyRate * 120)), 0);

  // Traffic Fines Exposure (Unsettled)
  const unsettledFinesAmount = fines
    .filter((f) => f.status === 'pending' || f.status === 'charged_to_customer')
    .reduce((acc, f) => acc + f.totalAmount, 0);

  // Rental Contract Expiry Notifications
  const expiringContracts = contracts.filter((c) => {
    if (c.status !== 'active') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = c.endDate.split('-').map(Number);
    const end = new Date(y, m - 1, d);
    const diffDays = Math.round((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 2;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Operational Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-tight text-slate-800 dark:text-slate-100">
              {lang === 'ar' ? 'لوحة تحكم النظام' : 'SYSTEM DASHBOARD'}
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.5 rounded font-bold uppercase">
              {settings.appName || 'AUTO-CORE PRO'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 uppercase tracking-tighter">
            {settings.organizationName || 'Fleet & Logistics System'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('contracts')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.createContract}</span>
          </button>
          <button
            onClick={() => onNavigate('customers')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded text-xs border border-slate-200 dark:border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.addCustomer}</span>
          </button>
          <button
            onClick={() => onNavigate('deliveries')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded text-xs transition"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.scheduleDelivery}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row - High Density Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.activeContracts}</p>
          <p className="text-3xl font-light py-1 text-slate-800 dark:text-slate-100 font-mono">
            {activeContractsCount} <span className="text-xs font-medium text-emerald-500 ml-1">+4%</span>
          </p>
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2">
            <div className="h-1 bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (activeContractsCount / (contracts.length || 1)) * 100)}%` }}></div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.available} / {t.totalCars}</p>
          <p className="text-3xl font-light py-1 text-slate-800 dark:text-slate-100 font-mono">
            {availableCarsCount} <span className="text-xs font-medium text-slate-400">/ {cars.length}</span>
          </p>
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2">
            <div className="h-1 bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (availableCarsCount / (cars.length || 1)) * 100)}%` }}></div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.pendingDeliveries}</p>
          <p className="text-3xl font-light py-1 text-slate-800 dark:text-slate-100 font-mono">
            {pendingDeliveriesCount}
          </p>
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2">
            <div className="h-1 bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (pendingDeliveriesCount / (deliveries.length || 1)) * 100)}%` }}></div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.totalRevenue}</p>
          <p className="text-3xl font-light py-1 text-slate-800 dark:text-slate-100 font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalRevenue, currency, lang)}
          </p>
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2">
            <div className="h-1 bg-slate-800 dark:bg-slate-200 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>

      {/* Executive BI Intelligence Dashboard Row (Item 7) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 rounded-2xl text-white border border-slate-700/60 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                <span>{t.executiveBI || (lang === 'ar' ? 'لوحة ذكاء الأعمال والقيادة التنفيذية (BI KPIs)' : 'Executive BI & Fleet Intelligence')}</span>
                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full font-bold">
                  PRO METRICS
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                {lang === 'ar'
                  ? 'مؤشرات الأداء التشغيلي والمالي المتقدمة للأسطول وحساب معدل التشغيل والعائد لكل سيارة'
                  : 'Fleet utilization, RevPAC, operational health scores, and financial exposure'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('vehicle_roi')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 border border-white/10"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t.vehicleRoi || (lang === 'ar' ? 'تقرير ROI الشامل' : 'Fleet ROI Report')}</span>
            </button>
            <button
              onClick={() => onNavigate('traffic_fines')}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-rose-500/30"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.trafficFines || (lang === 'ar' ? 'المخالفات' : 'Fines')}</span>
            </button>
          </div>
        </div>

        {/* 4 BI Executive Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Fleet Utilization Rate */}
          <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-4">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1 font-bold">
              <span>{t.fleetUtilization || (lang === 'ar' ? 'نسبة تشغيل الأسطول' : 'Fleet Utilization')}</span>
              <Gauge className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-emerald-400">{fleetUtilizationRate}%</span>
              <span className="text-[11px] text-slate-400">
                ({rentedCarsCount} / {activeFleetCount} {lang === 'ar' ? 'سيارة' : 'cars'})
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, fleetUtilizationRate)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              {fleetUtilizationRate >= 70
                ? (lang === 'ar' ? '🔥 معدل تشغيل مرتفع وممتاز' : 'High optimal fleet efficiency')
                : (lang === 'ar' ? '⚡ فرصة لزيادة التأجير والتسويق' : 'Capacity available for leasing')}
            </p>
          </div>

          {/* RevPAC */}
          <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-4">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1 font-bold">
              <span>{t.revPac || (lang === 'ar' ? 'العائد لكل سيارة (RevPAC)' : 'RevPAC Yield')}</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-blue-400">
                {formatCurrency(revPac, currency, lang)}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: '80%' }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              {lang === 'ar' ? 'متوسط الإيراد لكل مركبة في الأسطول' : 'Revenue per available car'}
            </p>
          </div>

          {/* Fleet Health & Readiness Score */}
          <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-4">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1 font-bold">
              <span>{t.fleetHealthScore || (lang === 'ar' ? 'مؤشر جاهزية وصحة الأسطول' : 'Operational Readiness')}</span>
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black font-mono text-teal-300">{fleetHealthScore}%</span>
              <span className="text-[11px] text-slate-400 font-semibold">
                {healthyCarsCount} {lang === 'ar' ? 'مركبة جاهزة' : 'ready'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, fleetHealthScore)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              {overdueMaintenanceCars.length > 0
                ? `${overdueMaintenanceCars.length} ${lang === 'ar' ? 'سيارات بحاجة لصيانة فورية' : 'vehicles overdue for service'}`
                : (lang === 'ar' ? 'جميع السيارات تحت الجدولة السليمة' : 'All vehicles in compliance')}
            </p>
          </div>

          {/* Fines Exposure & Avg Duration */}
          <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-4">
            <div className="flex justify-between items-center text-xs text-slate-300 mb-1 font-bold">
              <span>{t.finesExposure || (lang === 'ar' ? 'معلقات ساهر والمخالفات' : 'Fines Exposure')}</span>
              <AlertOctagon className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-rose-400">
                {formatCurrency(unsettledFinesAmount, currency, lang)}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full"
                style={{ width: `${Math.min(100, (unsettledFinesAmount > 0 ? 60 : 0))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              {t.averageRentalDuration || (lang === 'ar' ? 'متوسط مدة الإيجار:' : 'Avg duration:')}{' '}
              <span className="font-bold text-slate-200">{avgRentalDays} {lang === 'ar' ? 'يوم' : 'days'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Live Deliveries & Contracts Tables */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Deliveries Table Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>{t.deliveries} ({lang === 'ar' ? 'النشطة' : 'Active Deliveries'})</span>
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 px-2 rounded-full font-bold">
                Live
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-[11px]">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 font-semibold">ID</th>
                    <th className="p-3 font-semibold">{t.drivers}</th>
                    <th className="p-3 font-semibold">{t.cars}</th>
                    <th className="p-3 font-semibold">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {deliveries.slice(0, 4).map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">#{d.id.slice(0, 6)}</td>
                      <td className="p-3 font-medium text-slate-900 dark:text-slate-100">{d.driverName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{d.cargoDescription || 'Passenger / Delivery'}</td>
                      <td className="p-3">
                        <span className={`font-bold ${
                          d.status === 'in_progress' ? 'text-amber-600' :
                          d.status === 'completed' ? 'text-emerald-600' : 'text-blue-600'
                        }`}>
                          {d.status === 'in_progress' ? (lang === 'ar' ? 'في الطريق' : 'En Route') :
                           d.status === 'completed' ? (lang === 'ar' ? 'مكتمل' : 'Completed') : (lang === 'ar' ? 'قيد الانتظار' : 'Pending')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {deliveries.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">
                        {lang === 'ar' ? 'لا توجد خدمات توصيل حالية' : 'No active deliveries'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Contracts List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{t.contracts} ({lang === 'ar' ? 'أحدث العقود' : 'Recent Contracts'})</span>
              </h3>
              <button
                onClick={() => onNavigate('contracts')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>{lang === 'ar' ? 'عرض الكل' : 'View All'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {contracts.slice(0, 3).map((cnt) => (
                <div
                  key={cnt.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between text-xs border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px]">
                      {cnt.customerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{cnt.customerName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{cnt.carModel} • {cnt.carPlate}</span>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left">
                    <span className="font-bold text-emerald-600 block font-mono">{formatCurrency(cnt.totalAmount, currency, lang)}</span>
                    <span className="text-[10px] text-slate-400">{cnt.startDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Rental Expiry Alert, Maintenance Alert Widget & Quick Contract Generator Dark Box */}
        <div className="lg:col-span-4 space-y-6">
          {/* Rental Contract Expiry Notifications Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-rose-200 dark:border-rose-900/50 overflow-hidden">
            <div className="bg-rose-50 dark:bg-rose-950/60 px-4 py-3 border-b border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-tight flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>{t.contractExpiryAlert}</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${expiringContracts.length > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'}`}>
                {expiringContracts.length} {lang === 'ar' ? 'عقود' : 'contracts'}
              </span>
            </div>

            <div className="p-4 space-y-3">
              {expiringContracts.length > 0 ? (
                expiringContracts.map((cnt) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const [y, m, d] = cnt.endDate.split('-').map(Number);
                  const end = new Date(y, m - 1, d);
                  const diffDays = Math.round((end.getTime() - today.getTime()) / (1000 * 3600 * 24));
                  const isOverdue = diffDays < 0;
                  const isToday = diffDays === 0;

                  return (
                    <div key={cnt.id} className={`p-3 rounded-lg border text-xs ${isOverdue ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-950 dark:text-rose-100' : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-100'}`}>
                      <div className="flex justify-between font-bold items-center mb-1">
                        <span>{cnt.customerName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${isOverdue ? 'bg-rose-600 text-white' : isToday ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'}`}>
                          {isOverdue ? `${t.overdueContract} (${Math.abs(diffDays)} ${t.daysOverdue})` : isToday ? t.expiringToday : `${t.expiringSoon} (${diffDays}d)`}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-80 mb-2">
                        {cnt.carModel} ({cnt.carPlate}) • {t.endDate}: {cnt.endDate}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-current/10">
                        <span className="text-[10px] font-bold">
                          {t.remainingAmount}: {formatCurrency(cnt.remainingAmount ?? (cnt.totalAmount - (cnt.paidAmount ?? 0)), currency, lang)}
                        </span>
                        <button
                          onClick={() => onNavigate('contracts')}
                          className="text-[10px] font-bold underline hover:opacity-80 flex items-center gap-1"
                        >
                          <span>{t.returnCar}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'جميع عقود الإيجار سارية وضمن المدة المحددة' : 'All rental contracts are within valid duration'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Predictive Maintenance Alert Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-amber-200 dark:border-amber-900/50 overflow-hidden">
            <div className="bg-amber-50 dark:bg-amber-950/60 px-4 py-3 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-tight flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.maintenanceAlert}</span>
              </span>
              <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse italic">
                Predictive
              </span>
            </div>

            <div className="p-4 space-y-3">
              {overdueMaintenanceCars.length > 0 ? (
                overdueMaintenanceCars.map((car) => (
                  <div key={car.id} className="flex items-start gap-3 p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg border border-amber-100 dark:border-amber-900/30">
                    <div className="text-xl">⚠️</div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>Plate: {car.plateNumber}</span>
                        <span className="text-amber-700 dark:text-amber-400 font-mono">{car.currentMileage.toLocaleString()} KM</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-1">
                        {car.brand} {car.model} • Threshold ({car.nextServiceMileage.toLocaleString()} km) exceeded. Service recommended.
                      </p>
                      <button
                        onClick={() => onNavigate('maintenance')}
                        className="mt-2 text-[10px] font-bold text-amber-700 dark:text-amber-400 underline underline-offset-2 hover:text-amber-800"
                      >
                        {t.scheduleDelivery || 'Schedule Now'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'جميع السيارات بحالة صيانة جيدة' : 'All vehicles in good maintenance status'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Contract Generator Dark Box (from High Density design spec) */}
          <div className="bg-[#1e293b] rounded-xl p-5 text-white flex flex-col gap-4 shadow-md border border-white/10">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider">{t.createContract} Widget</h3>
              <button
                onClick={() => onNavigate('contracts')}
                className="text-[10px] bg-white hover:bg-slate-100 text-slate-900 font-bold px-2.5 py-1 rounded transition"
              >
                NEW +
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-slate-400">{t.customerName}</span>
                <span className="text-slate-300 italic">ID Scanned & Active</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-slate-400">{t.plateNumber || 'Plate Number'}</span>
                <span className="font-mono text-slate-200">KSA-99120-X</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-slate-400">{t.dailyRate}</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {formatCurrency(85, currency, lang)}
                </span>
              </div>
            </div>
            <div className="mt-1 bg-white/5 border border-dashed border-white/20 h-14 rounded flex items-center justify-center text-slate-400 text-[10px]">
              <span>Digital Signature Verification Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer System Status Banner */}
      <footer className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl h-10 px-6 flex items-center justify-between text-[9px] text-slate-400 font-medium uppercase tracking-widest">
        <span>© 2026 {settings.appName || 'AUTO-CORE PRO'} V2.5</span>
        <span className="hidden sm:inline">Database Status: Connected (Local Storage)</span>
        <span>User: SYSTEM-ADMIN</span>
      </footer>
    </div>
  );
};

