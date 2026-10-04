import React from 'react';
import { LayoutDashboard, Users, Car, UserCheck, FileText, Tag, Truck, Wrench, BarChart3, ShieldCheck, Building2, Settings, Calendar, TrendingUp, ShieldAlert, AlertOctagon, Landmark } from 'lucide-react';
import { Language, SystemUser } from '../types';
import { translations } from '../translations/i18n';

interface SidebarProps {
  currentModule: string;
  onNavigate: (module: string) => void;
  currentUser: SystemUser | null;
  lang: Language;
  onLock?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onNavigate,
  currentUser,
  lang,
  onLock,
  onLogout,
}) => {
  const t = translations[lang];

  const isDeveloper = currentUser?.role === 'developer';

  const sections = [
    {
      title: lang === 'ar' ? 'التشغيل والورديات' : 'Operational & Fleet',
      items: [
        { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
        { id: 'bookings', label: t.bookings, icon: Calendar },
        { id: 'customers', label: t.customers, icon: Users },
        { id: 'cars', label: t.cars, icon: Car },
        { id: 'drivers', label: t.drivers, icon: UserCheck },
        { id: 'corporate', label: lang === 'ar' ? 'نقل الموظفين والورديات' : 'Corporate Shifts', icon: Building2 },
      ],
    },
    {
      title: lang === 'ar' ? 'الأعمال والتحصيل' : 'Business & Finance',
      items: [
        { id: 'contracts', label: t.contracts, icon: FileText },
        { id: 'invoices', label: t.invoices, icon: FileText },
        { id: 'treasury', label: t.treasury || (lang === 'ar' ? 'إدارة الخزينة والعهد' : 'Treasury & Cash Flow'), icon: Landmark },
        { id: 'traffic_fines', label: t.trafficFines || (lang === 'ar' ? 'المخالفات وساهر' : 'Traffic Fines & Tolls'), icon: AlertOctagon },
        { id: 'sales', label: t.sales, icon: Tag },
        { id: 'deliveries', label: t.deliveries, icon: Truck },
        { id: 'vehicle_roi', label: t.vehicleRoi || (lang === 'ar' ? 'أرباح وعائد الأسطول (ROI)' : 'Vehicle ROI & P&L'), icon: TrendingUp },
      ],
    },
    {
      title: lang === 'ar' ? 'الدعم والإعدادات' : 'Support & Config',
      items: [
        { id: 'maintenance', label: t.maintenance, icon: Wrench },
        { id: 'finance', label: t.finance, icon: BarChart3 },
        { id: 'audit_logs', label: t.auditLogs || (lang === 'ar' ? 'سجل الرقابة والتدقيق' : 'Audit Trail'), icon: ShieldAlert },
        { id: 'system_config', label: lang === 'ar' ? 'تهيئة النظام والربط' : 'System Config', icon: Settings, isDevOnly: true },
        { id: 'developer', label: t.developerCenter, icon: ShieldCheck, isDevOnly: true },
      ],
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-[#1e293b] text-slate-200 border-b md:border-b-0 rtl:md:border-l ltr:md:border-r border-slate-700/80 shrink-0 flex flex-col justify-between">
      <div className="p-3 md:p-4 overflow-x-auto md:overflow-x-visible">
        {/* Navigation Categories */}
        <nav className="flex md:flex-col gap-1 md:gap-4 text-xs font-medium">
          {sections.map((section, idx) => {
            const visibleItems = section.items.filter((item) => {
              if (item.isDevOnly) return isDeveloper;
              if (isDeveloper) return true;
              if (currentUser?.permissions?.allowedModules) {
                const modules = currentUser.permissions.allowedModules as Record<string, boolean | undefined>;
                const primaryKey = item.id;
                const aliasKey = item.id === 'contracts' ? 'rentals' : item.id === 'drivers' ? 'employees' : item.id === 'system_config' ? 'systemConfig' : item.id;
                if (modules[primaryKey] === false || modules[aliasKey] === false) return false;
                if (modules[primaryKey] === true || modules[aliasKey] === true) return true;
              }
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1 min-w-max md:min-w-0">
                <div className="hidden md:block px-3 py-1 text-slate-400 uppercase tracking-widest text-[9px] font-bold border-b border-slate-700/40">
                  {section.title}
                </div>
                <div className="flex md:flex-col gap-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentModule === item.id;
                    const isDev = item.isDevOnly;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`flex items-center gap-3 px-3.5 py-2 md:py-2.5 rounded-lg text-xs font-bold transition shrink-0 md:shrink border-r-0 ${
                          isActive
                            ? 'bg-blue-600/25 text-blue-400 ltr:border-l-4 rtl:border-r-4 border-blue-500 shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : isDev ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className="whitespace-nowrap tracking-tight">{item.label}</span>
                        {isDev && (
                          <span className="rtl:mr-auto ltr:ml-auto px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black rounded uppercase">
                            DEV
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer with Security & Dev Info */}
      <div className="hidden md:block p-3.5 bg-slate-900/80 border-t border-slate-700/80 text-[11px] space-y-2">
        {currentUser && (
          <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="truncate font-semibold text-slate-300">
              {currentUser.fullName || currentUser.username}
            </span>
            <div className="flex items-center gap-1">
              {onLock && (
                <button
                  type="button"
                  onClick={onLock}
                  title={lang === 'ar' ? 'قفل الشاشة' : 'Lock Screen'}
                  className="p-1 text-amber-400 hover:bg-slate-800 rounded transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {isDeveloper && (
          <div className="pt-1 border-t border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>DEV ROLE ACTIVE</span>
            </div>
            <button
              onClick={() => onNavigate('developer')}
              className="w-full mt-1.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] text-slate-300 uppercase font-bold tracking-wider transition"
            >
              {t.developerCenter}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

