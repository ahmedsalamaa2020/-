import React, { useState } from 'react';
import { Car, DollarSign, LogIn, LogOut, ShieldCheck, User, Printer, ZoomIn, ZoomOut, RotateCcw, Edit3, Sparkles, Lock, Search, Radar } from 'lucide-react';
import { AppSettings, Currency, Language, SystemUser } from '../types';
import { translations } from '../translations/i18n';
import { EditAppBrandingModal } from './EditAppBrandingModal';

interface NavbarProps {
  settings: AppSettings;
  currentUser: SystemUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onLock?: () => void;
  onUpdateSettings?: (newSettings: AppSettings) => void;
  onOpenGlobalSearch?: () => void;
  onOpenRadar?: () => void;
  radarAlertsCount?: number;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  appZoom: number;
  onZoomChange: (zoom: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  currentUser,
  onOpenAuth,
  onLogout,
  onLock,
  onUpdateSettings,
  onOpenGlobalSearch,
  onOpenRadar,
  radarAlertsCount = 0,
  lang,
  onLanguageChange,
  currency,
  onCurrencyChange,
  appZoom,
  onZoomChange,
}) => {
  const t = translations[lang];
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);

  const canEditBranding = !currentUser || currentUser.role === 'developer' || currentUser.role === 'admin' || currentUser.permissions?.canEdit !== false;

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-3 md:px-6 flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        {/* Brand & Organization Title */}
        <div
          onClick={() => {
            if (canEditBranding && onUpdateSettings) {
              setIsBrandingModalOpen(true);
            }
          }}
          className={`flex items-center gap-2.5 group select-none shrink-0 ${
            canEditBranding && onUpdateSettings ? 'cursor-pointer' : ''
          }`}
          title={
            canEditBranding && onUpdateSettings
              ? lang === 'ar'
                ? 'انقر لتعديل اسم وشعار البرنامج'
                : 'Click to edit app name and branding'
              : undefined
          }
        >
          <div className="w-9 h-9 bg-blue-600 rounded-lg text-white flex items-center justify-center font-black shadow-xs overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Car className="w-5 h-5" />
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100 uppercase group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {settings.appName || 'AUTO-CORE PRO'}
              </span>
              {canEditBranding && onUpdateSettings && (
                <span className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                  <Edit3 className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-tighter truncate max-w-[140px] sm:max-w-[220px]">
              {settings.organizationName || 'Fleet & Logistics System'}
            </span>
          </div>
        </div>

        {/* Global Search Bar Trigger in Navbar */}
        {onOpenGlobalSearch && (
          <div className="flex-1 max-w-md mx-2 hidden sm:block">
            <button
              type="button"
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 dark:text-slate-400 transition group shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {lang === 'ar' ? 'بحث شامل في البرنامج...' : 'Search system...'}
                </span>
              </span>
              <kbd className="font-mono text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-500 font-bold shadow-2xs">
                Ctrl + K
              </kbd>
            </button>
          </div>
        )}

        {/* Global Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Smart Fleet Radar Trigger Button */}
          {onOpenRadar && (
            <button
              type="button"
              onClick={onOpenRadar}
              className="relative p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/60 transition flex items-center gap-1.5 font-bold text-xs"
              title={lang === 'ar' ? 'الرادار وتنبيهات الأسطول الاستباقية' : 'Smart Fleet Radar'}
            >
              <Radar className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
              <span className="hidden md:inline">{lang === 'ar' ? 'الرادار' : 'Radar'}</span>
              {radarAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full font-mono text-[10px] font-black">
                  {radarAlertsCount}
                </span>
              )}
            </button>
          )}

          {/* Mobile Global Search Button */}
          {onOpenGlobalSearch && (
            <button
              type="button"
              onClick={onOpenGlobalSearch}
              className="sm:hidden p-2 bg-slate-100 dark:bg-slate-800 text-blue-600 rounded-xl border border-slate-200 dark:border-slate-700 transition"
              title={lang === 'ar' ? 'البحث في البرنامج' : 'Search System'}
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        {/* Global App Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono">
          <button
            onClick={() => onZoomChange(Math.max(appZoom - 10, 70))}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition"
            title={lang === 'ar' ? 'تصغير حجم التطبيق' : 'Zoom Out App'}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onZoomChange(100)}
            className="px-1.5 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 font-bold text-[11px] transition flex items-center gap-1"
            title={lang === 'ar' ? 'إعادة الضبط (100%)' : 'Reset Zoom (100%)'}
          >
            <span>{appZoom}%</span>
            {appZoom !== 100 && <RotateCcw className="w-2.5 h-2.5 opacity-60" />}
          </button>
          <button
            onClick={() => onZoomChange(Math.min(appZoom + 10, 150))}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition"
            title={lang === 'ar' ? 'تكبير حجم التطبيق' : 'Zoom In App'}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Currency & Exchange Rate Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300">
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as Currency)}
            className="bg-transparent font-bold focus:outline-none cursor-pointer"
          >
            <option value="EGP">EGP (ج.م) - العملة الأساسية</option>
            <option value="SAR">SAR (ر.س)</option>
            <option value="USD">USD ($)</option>
            <option value="AED">AED (د.إ)</option>
            <option value="IQD">IQD (د.ع)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

        {/* Language Switcher Pill */}
        <div className="flex border border-slate-200 dark:border-slate-700 rounded overflow-hidden text-[11px] font-bold">
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-2.5 sm:px-3 py-1 transition ${
              lang === 'en'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-extrabold border-r border-slate-200 dark:border-slate-700'
                : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => onLanguageChange('ar')}
            className={`px-2.5 sm:px-3 py-1 transition ${
              lang === 'ar'
                ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-extrabold'
                : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50'
            }`}
          >
            AR (عربي)
          </button>
        </div>

        {/* Print quick action icon */}
        <button
          onClick={() => {
            window.focus();
            window.print();
          }}
          className="hidden md:flex items-center justify-center p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          title={lang === 'ar' ? 'طباعة / حفظ كـ PDF' : 'Print / Save as PDF'}
        >
          <Printer className="w-4 h-4 opacity-70 hover:opacity-100" />
        </button>

        {/* Auth / User Avatar Badge */}
        {currentUser ? (
          <div className="flex items-center gap-2 ltr:pl-3 rtl:pr-3 ltr:border-l rtl:border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
                {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'JD'}
              </div>
              <div className="hidden lg:flex flex-col text-left rtl:text-right">
                <span className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-200">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">
                  {currentUser.role}
                </span>
              </div>
            </div>

            {onLock && (
              <button
                onClick={onLock}
                className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition"
                title={lang === 'ar' ? 'قفل الشاشة فوراً' : 'Lock Screen'}
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onLogout}
              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
              title={t.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs uppercase shadow-xs transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{t.loginTitle}</span>
          </button>
        )}
      </div>
      </header>

      {onUpdateSettings && (
        <EditAppBrandingModal
          isOpen={isBrandingModalOpen}
          onClose={() => setIsBrandingModalOpen(false)}
          settings={settings}
          onSave={(newSettings) => {
            onUpdateSettings(newSettings);
            setIsBrandingModalOpen(false);
          }}
          lang={lang}
        />
      )}
    </>
  );
};


