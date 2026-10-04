import React, { useState } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  Key,
  Smartphone,
  MessageSquare,
  Navigation,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Server,
  Save,
  Check,
  Printer,
  Type,
  Layout,
  Image,
  Sparkles,
  RotateCcw,
  FileText,
  Clock,
  DollarSign,
} from 'lucide-react';
import { AppSettings, Language, SystemConfig } from '../types';
import { translations } from '../translations/i18n';
import {
  PrintSettings,
  FontSizeOption,
  MarginOption,
  getSavedPrintSettings,
  savePrintSettings,
  DEFAULT_PRINT_SETTINGS,
} from '../utils/printSettings';

interface SystemConfigModuleProps {
  settings: AppSettings;
  config: SystemConfig;
  lang: Language;
  onUpdateConfig: (newConfig: SystemConfig) => void;
  onUpdateSettings?: (newSettings: AppSettings) => void;
  onRestoreDatabase: (jsonText: string) => boolean;
}

export const SystemConfigModule: React.FC<SystemConfigModuleProps> = ({
  settings,
  config,
  lang,
  onUpdateConfig,
  onUpdateSettings,
  onRestoreDatabase,
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'db' | 'backup' | 'api' | 'print' | 'branding' | 'rental'>('rental');

  // Rental Settings State
  const [dailyMileageLimit, setDailyMileageLimit] = useState(settings.dailyMileageLimit ?? 300);
  const [excessMileageCharge, setExcessMileageCharge] = useState(settings.excessMileageCharge ?? 1.50);
  const [hourlyDelayFee, setHourlyDelayFee] = useState(settings.hourlyDelayFee ?? 50);
  const [defaultRentalPrice, setDefaultRentalPrice] = useState(settings.defaultRentalPrice ?? 250);
  const [defaultRentalPeriodDays, setDefaultRentalPeriodDays] = useState(settings.defaultRentalPeriodDays ?? 1);
  const [vatRate, setVatRate] = useState(settings.defaultVatRate ?? 15);
  const [rentalSaved, setRentalSaved] = useState(false);

  // Branding State
  const [appName, setAppName] = useState(settings.appName || '');
  const [organizationName, setOrganizationName] = useState(settings.organizationName || '');
  const [appDescription, setAppDescription] = useState(settings.appDescription || '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [brandingSaved, setBrandingSaved] = useState(false);

  // Print settings local state
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => getSavedPrintSettings());

  // Form local state
  const [dbHost, setDbHost] = useState(config.dbHost || 'localhost');
  const [dbPort, setDbPort] = useState(config.dbPort || 5432);
  const [dbName, setDbName] = useState(config.dbName || 'autofleet_db');
  const [dbUser, setDbUser] = useState(config.dbUser || 'autofleet_user');
  const [testingDb, setTestingDb] = useState(false);
  const [dbTestSuccess, setDbTestSuccess] = useState<boolean | null>(true);

  // API Keys state
  const [whatsappApiKey, setWhatsappApiKey] = useState(config.apiKeys.whatsappApiKey || 'wa_key_88990011');
  const [whatsappInstanceId, setWhatsappInstanceId] = useState(config.apiKeys.whatsappInstanceId || 'inst_998877');
  const [whatsappEnabled, setWhatsappEnabled] = useState(config.apiKeys.whatsappEnabled ?? true);

  const [smsApiKey, setSmsApiKey] = useState(config.apiKeys.smsApiKey || 'sms_unifonic_live_7722');
  const [smsProvider, setSmsProvider] = useState(config.apiKeys.smsProvider || 'Unifonic');
  const [smsEnabled, setSmsEnabled] = useState(config.apiKeys.smsEnabled ?? true);

  const [gpsApiKey, setGpsApiKey] = useState(config.apiKeys.gpsApiKey || 'gps_traccar_tok_3344');
  const [gpsServerUrl, setGpsServerUrl] = useState(config.apiKeys.gpsServerUrl || 'https://gps.autofleet.sa');
  const [gpsEnabled, setGpsEnabled] = useState(config.apiKeys.gpsEnabled ?? true);

  const [paymentApiKey, setPaymentApiKey] = useState(config.apiKeys.paymentGatewayApiKey || 'sk_live_51M000FAWFLEET');
  const [paymentProvider, setPaymentProvider] = useState(config.apiKeys.paymentProvider || 'Paymob / Fawry');
  const [paymentMode, setPaymentMode] = useState<'sandbox' | 'live'>(config.apiKeys.paymentMode || 'live');
  const [paymentEnabled, setPaymentEnabled] = useState(config.apiKeys.paymentEnabled ?? true);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  const handleTestDatabaseConnection = () => {
    setTestingDb(true);
    setDbTestSuccess(null);
    setTimeout(() => {
      setTestingDb(false);
      setDbTestSuccess(true);
    }, 1000);
  };

  const handleSaveConfig = () => {
    const updated: SystemConfig = {
      dbHost,
      dbPort,
      dbName,
      dbUser,
      dbStatus: dbTestSuccess ? 'connected' : 'disconnected',
      backupLastDate: new Date().toISOString().slice(0, 10),
      apiKeys: {
        whatsappApiKey,
        whatsappInstanceId,
        whatsappEnabled,
        smsApiKey,
        smsProvider,
        smsEnabled,
        gpsApiKey,
        gpsServerUrl,
        gpsEnabled,
        paymentGatewayApiKey: paymentApiKey,
        paymentProvider,
        paymentMode,
        paymentEnabled,
      },
    };

    onUpdateConfig(updated);
    savePrintSettings(printSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Database Backup Export (JSON Download)
  const handleExportBackup = () => {
    const fullBackupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      localStorageDump: { ...localStorage },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `AutoFleet-Full-DB-Backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Database Restore Import (JSON File)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = onRestoreDatabase(text);
        if (success) {
          setRestoreStatus(lang === 'ar' ? 'تم استعادة قاعدة البيانات بنجاح! جاري التحديث...' : 'Database restored successfully!');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setRestoreStatus(lang === 'ar' ? 'ملف النسخة الاحتياطية غير صالح' : 'Invalid backup file format');
        }
      } catch (err) {
        setRestoreStatus(lang === 'ar' ? 'حدث خطأ أثناء فك التشفير' : 'Error parsing backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <Server className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {lang === 'ar' ? 'تهيئة النظام وقواعد البيانات والربط البرمجي (API)' : 'System Configuration & API Integrations'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar'
              ? 'إدارة الاتصال بقاعدة البيانات، النسخ الاحتياطي والاستعادة، ومفاتيح الربط للواتساب والرسائل والخرائط والدفع'
              : 'Database settings, backup & restore engine, and API integration keys for WhatsApp, SMS, GPS & Payments'}
          </p>
        </div>

        <button
          onClick={handleSaveConfig}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs shadow-md transition"
        >
          {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saveSuccess ? (lang === 'ar' ? 'تم الحفظ بنجاح!' : 'Saved!') : (lang === 'ar' ? 'حفظ إعدادات التهيئة' : 'Save Config')}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('rental')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition whitespace-nowrap ${
            activeTab === 'rental'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{lang === 'ar' ? 'إعدادات التأجير والعقود' : 'Rental & Contract Settings'}</span>
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition whitespace-nowrap ${
            activeTab === 'branding'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{lang === 'ar' ? 'هوية واسم البرنامج' : 'App Identity & Name'}</span>
        </button>

        <button
          onClick={() => setActiveTab('db')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition whitespace-nowrap ${
            activeTab === 'db'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{lang === 'ar' ? 'إعدادات قاعدة البيانات' : 'Database Settings'}</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition whitespace-nowrap ${
            activeTab === 'backup'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>{lang === 'ar' ? 'النسخ الاحتياطي والاستعادة' : 'Backup & Restore'}</span>
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition whitespace-nowrap ${
            activeTab === 'api'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>{lang === 'ar' ? 'مفاتيح الربط والخدمات (APIs)' : 'API Keys & Gateways'}</span>
        </button>

        <button
          onClick={() => setActiveTab('print')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition whitespace-nowrap ${
            activeTab === 'print'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>{lang === 'ar' ? 'إعدادات الطباعة والخطوط' : 'Print & Font Settings'}</span>
        </button>
      </div>

      {/* TAB: Rental & Contract Configuration */}
      {activeTab === 'rental' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs max-w-4xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>{lang === 'ar' ? 'إعدادات التأجير والعقود والعداد' : 'Rental & Contract Defaults'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar'
                  ? 'ضبط القيم الافتراضية لعقود الإيجار (سعر التأخير بالساعة، الكيلومترات اليومية، سعر الكيلو الزائد، وسعر اليوم الافتراضي) - تنعكس مباشرة على كافة العقود الجديدة'
                  : 'Configure default rental rates, delay penalties, daily mileage limits, and excess KM charges across all contracts'}
              </p>
            </div>
            {onUpdateSettings && (
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({
                    ...settings,
                    dailyMileageLimit: Number(dailyMileageLimit),
                    excessMileageCharge: Number(excessMileageCharge),
                    hourlyDelayFee: Number(hourlyDelayFee),
                    defaultRentalPrice: Number(defaultRentalPrice),
                    defaultRentalPeriodDays: Number(defaultRentalPeriodDays),
                    defaultVatRate: Number(vatRate),
                  });
                  setRentalSaved(true);
                  setTimeout(() => setRentalSaved(false), 2000);
                }}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                {rentalSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{rentalSaved ? (lang === 'ar' ? 'تم الحفظ وتطبيق الإعدادات ✓' : 'Settings Saved & Applied!') : (lang === 'ar' ? 'حفظ إعدادات التأجير' : 'Save Rental Settings')}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{lang === 'ar' ? 'غرامات التأخير والمواعيد' : 'Delay Penalty & Timing'}</span>
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? `قيمة ساعة التأخير الافتراضية (${settings.currency}/ساعة) *` : `Default Hourly Delay Fee (${settings.currency}/hr) *`}
                </label>
                <input
                  type="number"
                  value={hourlyDelayFee}
                  onChange={(e) => setHourlyDelayFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-rose-700 dark:text-rose-400"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {lang === 'ar' ? 'تُطبق على كل ساعة تأخير في إرجاع السيارة عن الموعد المحدد' : 'Applied per delay hour upon vehicle return'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'مدة الإيجار الافتراضية (بالأيام) *' : 'Default Rental Duration (Days) *'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={defaultRentalPeriodDays}
                  onChange={(e) => setDefaultRentalPeriodDays(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>{lang === 'ar' ? 'حدود العداد والكيلومترات الزائدة' : 'Mileage Limits & Excess KM'}</span>
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'الحد اليومي للكيلومترات (KM/يوم) *' : 'Daily Mileage Limit (KM/day) *'}
                </label>
                <input
                  type="number"
                  value={dailyMileageLimit}
                  onChange={(e) => setDailyMileageLimit(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? `سعر الكيلومتر الزائد (${settings.currency}/KM) *` : `Excess Mileage Rate (${settings.currency}/KM) *`}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={excessMileageCharge}
                  onChange={(e) => setExcessMileageCharge(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 md:col-span-2">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ar' ? 'الأسعار الافتراضية والضرائب' : 'Default Pricing & Tax'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? `سعر الإيجار اليومي الافتراضي (${settings.currency}/يوم) *` : `Default Daily Rental Rate (${settings.currency}/day) *`}
                  </label>
                  <input
                    type="number"
                    value={defaultRentalPrice}
                    onChange={(e) => setDefaultRentalPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-black text-emerald-700 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'نسبة ضريبة القيمة المضافة (%) *' : 'VAT Rate (%) *'}
                  </label>
                  <input
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 0: Branding & App Name */}
      {activeTab === 'branding' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs max-w-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {lang === 'ar' ? 'هوية واسم البرنامج والمنظومة' : 'App Identity & Branding'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar'
                  ? 'تعديل اسم البرنامج، اسم الشركة، والوصف الذي يظهر في الشريط العلوي وشاشة الدخول'
                  : 'Update application name, organization name, and description across top bar and login'}
              </p>
            </div>
            {onUpdateSettings && (
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({
                    ...settings,
                    appName: appName.trim() || 'AutoFleet Pro',
                    organizationName: organizationName.trim(),
                    appDescription: appDescription.trim(),
                    logoUrl: logoUrl.trim(),
                  });
                  setBrandingSaved(true);
                  setTimeout(() => setBrandingSaved(false), 2000);
                }}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                {brandingSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{brandingSaved ? (lang === 'ar' ? 'تم الحفظ بنجاح ✓' : 'Saved!') : (lang === 'ar' ? 'حفظ اسم وشعار البرنامج' : 'Save Branding')}</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {lang === 'ar' ? 'اسم البرنامج / التطبيق *' : 'App / Application Name *'}
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: AutoFleet Pro | نظام إدارة أسطول السيارات' : 'e.g. AutoFleet Pro Car Rental'}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {lang === 'ar' ? 'اسم المنظمة / الشركة *' : 'Organization / Company Name *'}
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: شركة الأسطول المتقدم لتأجير ونقل المركبات' : 'e.g. Advanced Fleet Car Rental LLC'}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {lang === 'ar' ? 'الوصف وشعار النظام المختصر' : 'App Slogan / Subtitle'}
              </label>
              <input
                type="text"
                value={appDescription}
                onChange={(e) => setAppDescription(e.target.value)}
                placeholder={lang === 'ar' ? 'النظام الشامل لإدارة أسطول السيارات، العقود الرقمية، والمبيعات' : 'Fleet & rental comprehensive management'}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                {lang === 'ar' ? 'رابط الشعار (Logo URL)' : 'Logo Image URL'}
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Database Settings */}
      {activeTab === 'db' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs max-w-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{lang === 'ar' ? 'بيانات اتصال الخادم وقاعدة البيانات' : 'Server & Database Connection'}</h3>
              <p className="text-xs text-slate-500">{lang === 'ar' ? 'تخصيص الخادم المضيف والمنفذ واسم قاعدة البيانات المستهدفة' : 'Configure host, port, and database instance credentials'}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                dbTestSuccess ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{dbTestSuccess ? (lang === 'ar' ? 'متصل بنجاح (Active)' : 'Connected') : (lang === 'ar' ? 'غير متصل' : 'Disconnected')}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'عنوان خادم قاعدة البيانات (Host)' : 'Database Host'}</label>
              <input
                type="text"
                value={dbHost}
                onChange={(e) => setDbHost(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'المنفذ (Port)' : 'Port'}</label>
              <input
                type="number"
                value={dbPort}
                onChange={(e) => setDbPort(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'اسم قاعدة البيانات (Database Name)' : 'Database Name'}</label>
              <input
                type="text"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{lang === 'ar' ? 'المستخدم (User)' : 'Username'}</label>
              <input
                type="text"
                value={dbUser}
                onChange={(e) => setDbUser(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestDatabaseConnection}
              disabled={testingDb}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${testingDb ? 'animate-spin' : ''}`} />
              <span>{testingDb ? (lang === 'ar' ? 'جاري اختبار الاتصال...' : 'Testing...') : (lang === 'ar' ? 'اختبار اتصال الخادم' : 'Test Connection')}</span>
            </button>

            <span className="text-[11px] text-slate-500 font-mono">PostgreSQL / Cloud SQL Driver Active</span>
          </div>
        </div>
      )}

      {/* TAB 2: Backup & Restore Options */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl w-fit">
              <Download className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{lang === 'ar' ? 'تصدير نسخة احتياطية (JSON Backup)' : 'Export Full Backup'}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'ar'
                  ? 'قم بتنزيل كافة بيانات العقود، السيارات، السائقين، الورديات، والمبيعات في ملف JSON آمن للسلامة'
                  : 'Download complete snapshot of contracts, vehicles, shift logs, and sales in a JSON backup file.'}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تحميل النسخة الاحتياطية الآن' : 'Download Backup File'}</span>
              </button>
            </div>
          </div>

          {/* Import / Restore Box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{lang === 'ar' ? 'استعادة قاعدة البيانات (Restore DB)' : 'Restore Database'}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'ar'
                  ? 'رفع واستعادة سجلات النظام السابقة من ملف JSON تم تصديره سابقاً'
                  : 'Upload a JSON backup file to overwrite/restore system records instantly.'}
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{lang === 'ar' ? 'اختر ملف النسخة واستعد السجلات' : 'Select Backup File & Restore'}</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>

              {restoreStatus && (
                <p className="text-xs font-bold text-center text-emerald-600 dark:text-emerald-400">{restoreStatus}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: API Keys & Gateways */}
      {activeTab === 'api' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WhatsApp Gateway */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{lang === 'ar' ? 'بوابة الواتساب (WhatsApp Gateway)' : 'WhatsApp Business API'}</h4>
                  <p className="text-[11px] text-slate-500">{lang === 'ar' ? 'إرسال العقود والتنبيهات تلقائياً للعملاء' : 'Auto contract & reminder dispatches'}</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{lang === 'ar' ? 'مفتاح الـ API (Key)' : 'API Key'}</label>
                <input
                  type="password"
                  value={whatsappApiKey}
                  onChange={(e) => setWhatsappApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{lang === 'ar' ? 'معرف الجلسة (Instance ID)' : 'Instance ID'}</label>
                <input
                  type="text"
                  value={whatsappInstanceId}
                  onChange={(e) => setWhatsappInstanceId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* SMS Gateway */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{lang === 'ar' ? 'بوابة الرسائل النصية (SMS Gateway)' : 'SMS Gateway API'}</h4>
                  <p className="text-[11px] text-slate-500">{lang === 'ar' ? 'مزودي الخدمة Unifonic / Twilio' : 'Unifonic, Twilio, SMS Global'}</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{lang === 'ar' ? 'مزود الخدمة' : 'SMS Provider'}</label>
                <input
                  type="text"
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{lang === 'ar' ? 'مفتاح الـ API' : 'SMS API Key'}</label>
                <input
                  type="password"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* GPS Tracking API */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{lang === 'ar' ? 'تتبع المركبات عبر GPS' : 'GPS Live Tracking API'}</h4>
                  <p className="text-[11px] text-slate-500">{lang === 'ar' ? 'تزامن الموقع والسرعة الفعالة' : 'Traccar / Fleet Server Sync'}</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={gpsEnabled}
                onChange={(e) => setGpsEnabled(e.target.checked)}
                className="w-4 h-4 accent-purple-600"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{lang === 'ar' ? 'رابط خادم التتبع (Server URL)' : 'Server URL'}</label>
                <input
                  type="text"
                  value={gpsServerUrl}
                  onChange={(e) => setGpsServerUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{lang === 'ar' ? 'رمز المصادقة (Token / API Key)' : 'API Token'}</label>
                <input
                  type="password"
                  value={gpsApiKey}
                  onChange={(e) => setGpsApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Payment Gateways */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{lang === 'ar' ? 'بوابات الدفع الإلكتروني' : 'Payment Gateway Integration'}</h4>
                  <p className="text-[11px] text-slate-500">{lang === 'ar' ? 'Paymob, Fawry, Stripe, Tap' : 'Paymob, Fawry, Stripe, Tap'}</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={paymentEnabled}
                onChange={(e) => setPaymentEnabled(e.target.checked)}
                className="w-4 h-4 accent-amber-600"
              />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{lang === 'ar' ? 'اسم البوابة' : 'Provider'}</label>
                  <input
                    type="text"
                    value={paymentProvider}
                    onChange={(e) => setPaymentProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{lang === 'ar' ? 'الوضع (Mode)' : 'Mode'}</label>
                  <select
                    value={paymentMode}
                    onChange={(e: any) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="sandbox">{lang === 'ar' ? 'تجريبي (Sandbox)' : 'Sandbox'}</option>
                    <option value="live">{lang === 'ar' ? 'مباشر (Live)' : 'Live'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">{lang === 'ar' ? 'مفتاح السر (Secret Key)' : 'Secret Key'}</label>
                <input
                  type="password"
                  value={paymentApiKey}
                  onChange={(e) => setPaymentApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Print & Font Settings */}
      {activeTab === 'print' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs max-w-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {lang === 'ar' ? 'تخصيص وإعدادات طباعة العقود والإيصالات' : 'Contract & Receipt Print Customization'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'ضبط حجم الخطوط وهوامش الصفحة وإظهار أو إخفاء الصور والبصمات لضمان الطباعة في صفحة واحدة A4'
                  : 'Adjust default typography, print margins, and toggle media visibility to ensure single A4 page fit'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPrintSettings(DEFAULT_PRINT_SETTINGS);
                savePrintSettings(DEFAULT_PRINT_SETTINGS);
              }}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
            </button>
          </div>

          <div className="space-y-6">
            {/* Font Size */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Type className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>{lang === 'ar' ? 'حجم الخط الافتراضي عند الطباعة' : 'Default Print Font Size'}</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'small', labelAr: 'مضغوط (صغير 85%)', labelEn: 'Compact (85%)', descAr: 'مثالي للعقود الطويلة لضمان احتواء صفحة واحدة', descEn: 'Best for 1-page fit' },
                  { key: 'medium', labelAr: 'قياسي (100%)', labelEn: 'Normal (100%)', descAr: 'المقاس المتوازن الموصى به لمعظم المستندات', descEn: 'Standard balanced size' },
                  { key: 'large', labelAr: 'كبير ومريح (115%)', labelEn: 'Large (115%)', descAr: 'وضوح فائق للقراءة السريعة', descEn: 'High readability' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      const updated = { ...printSettings, fontSize: opt.key as FontSizeOption };
                      setPrintSettings(updated);
                      savePrintSettings(updated);
                    }}
                    className={`p-3 rounded-xl border text-right rtl:text-right ltr:text-left transition ${
                      printSettings.fontSize === opt.key
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:border-purple-500 ring-2 ring-purple-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <p className="font-bold text-xs text-slate-900 dark:text-white mb-1">
                      {lang === 'ar' ? opt.labelAr : opt.labelEn}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {lang === 'ar' ? opt.descAr : opt.descEn}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Page Margins */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Layout className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>{lang === 'ar' ? 'هوامش الصفحة (Margins)' : 'Page Margins'}</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'narrow', labelAr: 'هوامش ضيقة (4mm)', labelEn: 'Narrow (4mm)', descAr: 'توفير أقصى مساحة للكتابة', descEn: 'Maximum print area' },
                  { key: 'normal', labelAr: 'هوامش قياسية (8mm)', labelEn: 'Standard (8mm)', descAr: 'الشكل الرسمي المعتمد', descEn: 'Standard balanced margins' },
                  { key: 'wide', labelAr: 'هوامش واسعة (14mm)', labelEn: 'Wide (14mm)', descAr: 'مساحات جانبية إضافية', descEn: 'Generous outer margins' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      const updated = { ...printSettings, marginWidth: opt.key as MarginOption };
                      setPrintSettings(updated);
                      savePrintSettings(updated);
                    }}
                    className={`p-3 rounded-xl border text-right rtl:text-right ltr:text-left transition ${
                      printSettings.marginWidth === opt.key
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:border-purple-500 ring-2 ring-purple-600/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <p className="font-bold text-xs text-slate-900 dark:text-white mb-1">
                      {lang === 'ar' ? opt.labelAr : opt.labelEn}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {lang === 'ar' ? opt.descAr : opt.descEn}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Media toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Image className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>{lang === 'ar' ? 'خيارات إظهار الصور والوسائط في الطباعة' : 'Media Visibility in Print'}</span>
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {lang === 'ar' ? 'إظهار الصور والشعارات في مستندات الطباعة' : 'Show Images and Logos in Print'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ar' ? 'إتاحة ظهور شعار المؤسسة وصور العملاء والسيارات' : 'Enable printing company logo, customer photos and vehicle images'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={printSettings.showImages}
                  onChange={(e) => {
                    const updated = { ...printSettings, showImages: e.target.checked };
                    setPrintSettings(updated);
                    savePrintSettings(updated);
                  }}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
