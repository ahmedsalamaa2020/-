import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Building2,
  Car,
  Image as ImageIcon,
  Upload,
  Check,
  RotateCcw,
  Eye,
  Type,
  FileText,
} from 'lucide-react';
import { AppSettings, Language } from '../types';

interface EditAppBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  lang: Language;
}

export const EditAppBrandingModal: React.FC<EditAppBrandingModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  lang,
}) => {
  const [appName, setAppName] = useState(settings.appName || '');
  const [organizationName, setOrganizationName] = useState(settings.organizationName || '');
  const [appDescription, setAppDescription] = useState(settings.appDescription || '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [savedAlert, setSavedAlert] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        lang === 'ar'
          ? 'هل تريد استعادة الاسم والشعار الافتراضي للنظام؟'
          : 'Do you want to restore default system name and logo?'
      )
    ) {
      setAppName('AutoFleet Pro | نظام إدارة السيارات والإيجار');
      setOrganizationName('الأسطول المتقدم للسيارات والخدمات اللوجستية');
      setAppDescription('النظام الشامل لإدارة أسطول السيارات، العقود الرقمية، التوصيل، الصيانة، والمبيعات');
      setLogoUrl('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...settings,
      appName: appName.trim() || 'AutoFleet Pro',
      organizationName: organizationName.trim(),
      appDescription: appDescription.trim(),
      logoUrl: logoUrl.trim(),
    });
    setSavedAlert(true);
    setTimeout(() => {
      setSavedAlert(false);
      onClose();
    }, 600);
  };

  const namePresets = [
    {
      name: 'AutoFleet Pro | إدارة أسطول وتأجير السيارات',
      org: 'الأسطول المتقدم لتأجير السيارات',
    },
    {
      name: 'نظام الرواد لإدارة المركبات والورديات',
      org: 'مؤسسة الرواد لخدمات النقل والسيارات',
    },
    {
      name: 'Elite Car Rental & Fleet ERP',
      org: 'Elite Fleet & Mobility Solutions',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                {lang === 'ar' ? 'تعديل اسم وشعار البرنامج' : 'Change App Name & System Branding'}
              </h3>
              <p className="text-xs text-blue-100 opacity-90">
                {lang === 'ar'
                  ? 'تخصيص الاسم والهوية التي تظهر في الشريط العلوي، شاشة الدخول، والمطبوعات'
                  : 'Customize the name, logo and identity across navbar, login, and prints'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-xl text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Live Preview Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                {lang === 'ar' ? 'معاينة حية فورية (الشريط العلوي)' : 'Live Preview (Navbar)'}
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {lang === 'ar' ? 'مباشر' : 'LIVE'}
              </span>
            </div>

            {/* Simulated Top Navbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 bg-blue-600 rounded-lg text-white flex items-center justify-center font-black shadow-xs overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Car className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  {appName || (lang === 'ar' ? 'اسم البرنامج هنا' : 'App Name Here')}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {organizationName || (lang === 'ar' ? 'اسم المنظمة / الشركة' : 'Company / Organization Name')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'ar' ? 'نماذج ومقترحات سريعة للأسماء:' : 'Quick Name Suggestions:'}
            </label>
            <div className="flex flex-wrap gap-2">
              {namePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAppName(preset.name);
                    setOrganizationName(preset.org);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-blue-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition text-start"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* App Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-blue-600" />
                <span>{lang === 'ar' ? 'اسم البرنامج / التطبيق *' : 'Application / System Name *'}</span>
              </label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: AutoFleet Pro | نظام إدارة السيارات' : 'e.g. AutoFleet Pro Car Rental'}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition outline-none"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'ar'
                  ? 'يظهر هذا الاسم في أعلى الشريط، شاشة تسجيل الدخول، وعنوان تبويب المتصفح.'
                  : 'This name appears on the top navbar, login screen, and browser tab title.'}
              </p>
            </div>

            {/* Organization / Company Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>{lang === 'ar' ? 'اسم المؤسسة / الشركة *' : 'Organization / Company Name *'}</span>
              </label>
              <input
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: شركة الأسطول المتقدم لتأجير السيارات' : 'e.g. Advanced Fleet Car Rental LLC'}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition outline-none"
              />
            </div>

            {/* App Subtitle / Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{lang === 'ar' ? 'الوصف وشعار النظام المختصر' : 'System Subtitle / Slogan'}</span>
              </label>
              <input
                type="text"
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                placeholder={lang === 'ar' ? 'النظام الشامل لإدارة أسطول السيارات والعقود الرقمية' : 'Comprehensive fleet management & smart digital contracts'}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition outline-none"
              />
            </div>

            {/* Logo Image */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>{lang === 'ar' ? 'شعار البرنامج (Logo)' : 'System Logo'}</span>
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain rounded-lg" />
                  ) : (
                    <Car className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'رفع صورة الشعار من الجهاز' : 'Upload Logo from Device'}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 transition"
                      >
                        {lang === 'ar' ? 'إزالة' : 'Remove'}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder={lang === 'ar' ? 'أو أدخل رابط صورة الشعار (URL)...' : 'Or enter logo image URL...'}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'استعادة الافتراضي' : 'Reset to Default'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition"
              >
                <Check className="w-4 h-4" />
                <span>{savedAlert ? (lang === 'ar' ? 'تم الحفظ بنجاح ✓' : 'Saved! ✓') : (lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
