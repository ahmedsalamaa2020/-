import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  Users,
  UserPlus,
  Trash2,
  Edit,
  Save,
  RefreshCw,
  Lock,
  CheckCircle2,
  Building2,
  Phone,
  MapPin,
  FileText,
  Eye,
  EyeOff,
  Laptop,
  Download,
  Upload,
  AlertCircle,
  Percent,
  Plus,
  Image as ImageIcon,
  DollarSign,
  Bell,
  Database,
  Wrench,
  Award,
  Settings,
  Send,
  Calendar,
  Clock,
  Car,
  Check,
  Infinity,
  Sparkles,
} from 'lucide-react';
import { AppSettings, Currency, Language, SystemUser, UserPermissions, UserRole, VatRate, getDefaultPermissions } from '../types';
import { translations } from '../translations/i18n';
import { downloadDesktopExePackage } from '../utils/desktopPackager';

interface DeveloperModuleProps {
  settings: AppSettings;
  users: SystemUser[];
  currentUser: SystemUser | null;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onAddUser: (user: SystemUser) => void;
  onUpdateUser: (user: SystemUser) => void;
  onDeleteUser: (userId: string) => void;
  onPurgeDemoUsers?: () => void;
  onResetData: () => void;
  onWipeDemoData: () => void;
  lang: Language;
}

export const DeveloperModule: React.FC<DeveloperModuleProps> = ({
  settings,
  users,
  currentUser,
  onUpdateSettings,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onPurgeDemoUsers,
  onResetData,
  onWipeDemoData,
  lang,
}) => {
  const t = translations[lang];

  const isDeveloper = currentUser?.role === 'developer';

  // Active Settings Tab State
  const [activeTab, setActiveTab] = useState<
    'office' | 'rental' | 'financial' | 'maintenance' | 'drivers' | 'preferences' | 'notifications'
  >('office');

  // Office Info State
  const [appName, setAppName] = useState(settings.appName || '');
  const [appDescription, setAppDescription] = useState(settings.appDescription || '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [organizationName, setOrganizationName] = useState(settings.organizationName || '');
  const [contactPhone, setContactPhone] = useState(settings.contactPhone || '');
  const [address, setAddress] = useState(settings.address || '');
  const [commercialRegistration, setCommercialRegistration] = useState(settings.commercialRegistration || '');
  const [taxId, setTaxId] = useState(settings.taxId || '');
  const [currency, setCurrency] = useState<Currency>(settings.currency || 'SAR');
  const [defaultLang, setDefaultLang] = useState<Language>(settings.defaultLang || 'ar');

  // Rental Settings State
  const [defaultRentalPeriodDays, setDefaultRentalPeriodDays] = useState(settings.defaultRentalPeriodDays ?? 1);
  const [recordOdometer, setRecordOdometer] = useState(settings.recordOdometer ?? true);
  const [excessMileageCharge, setExcessMileageCharge] = useState(settings.excessMileageCharge ?? 1.5);
  const [dailyMileageLimit, setDailyMileageLimit] = useState(settings.dailyMileageLimit ?? 300);
  const [hourlyDelayFee, setHourlyDelayFee] = useState(settings.hourlyDelayFee ?? 50);
  const [rentalExpiryReminderDays, setRentalExpiryReminderDays] = useState(settings.rentalExpiryReminderDays ?? 2);
  const [showLoginDemoUsers, setShowLoginDemoUsers] = useState(settings.showLoginDemoUsers ?? true);

  // Financial Settings State
  const [defaultRentalPrice, setDefaultRentalPrice] = useState(settings.defaultRentalPrice ?? 250);
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState(
    settings.enabledPaymentMethods || { cash: true, creditCard: true, bankTransfer: true, check: true }
  );
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix || 'INV-2026-');

  // VAT Control State
  const [vatEnabled, setVatEnabled] = useState(settings.vatEnabled ?? true);
  const [defaultVatRate, setDefaultVatRate] = useState(settings.defaultVatRate ?? 15);
  const [vatRates, setVatRates] = useState<VatRate[]>(
    settings.vatRates || [
      { id: "vat_std_15", name: "ضريبة القيمة المضافة القياسية (15%)", rate: 15, isDefault: true },
      { id: "vat_eg_14", name: "ضريبة القيمة المضافة - مصر (14%)", rate: 14 },
      { id: "vat_uae_5", name: "ضريبة القيمة المضافة - الإمارات (5%)", rate: 5 },
      { id: "vat_zero_0", name: "ضريبة نسبة صفر (0%)", rate: 0 },
    ]
  );
  const [newVatName, setNewVatName] = useState('');
  const [newVatRate, setNewVatRate] = useState(15);
  const [isAddVatOpen, setIsAddVatOpen] = useState(false);

  // Maintenance Settings State
  const [maintenanceIntervalKm, setMaintenanceIntervalKm] = useState(settings.maintenanceIntervalKm ?? 10000);
  const [autoMaintenanceAlerts, setAutoMaintenanceAlerts] = useState(settings.autoMaintenanceAlerts ?? true);
  const [serviceTypes, setServiceTypes] = useState<string[]>(
    settings.serviceTypes || ['oil_change', 'tires', 'engine', 'brakes', 'inspection', 'bodywork']
  );
  const [newServiceType, setNewServiceType] = useState('');

  // Driver Settings State
  const [licenseExpiryReminderDays, setLicenseExpiryReminderDays] = useState(settings.licenseExpiryReminderDays ?? 30);
  const [enableDriverRating, setEnableDriverRating] = useState(settings.enableDriverRating ?? true);

  // Notification Settings State
  const [notificationChannels, setNotificationChannels] = useState(
    settings.notificationChannels || { email: true, sms: true, whatsapp: true }
  );
  const [notificationEmail, setNotificationEmail] = useState(settings.notificationEmail || '');
  const [notificationPhone, setNotificationPhone] = useState(settings.notificationPhone || '');

  // License State
  const [licenseKey, setLicenseKey] = useState(settings.licenseKey || '');
  const [licenseStatus, setLicenseStatus] = useState(settings.licenseStatus || 'active');
  const [licenseExpiry, setLicenseExpiry] = useState(settings.licenseExpiry || '2099-12-31');
  const [isLifetimeLicense, setIsLifetimeLicense] = useState(settings.isLifetimeLicense ?? true);
  const [licenseType, setLicenseType] = useState<'lifetime' | 'annual' | 'monthly' | 'trial'>(settings.licenseType || 'lifetime');

  useEffect(() => {
    setAppName(settings.appName || '');
    setAppDescription(settings.appDescription || '');
    setLogoUrl(settings.logoUrl || '');
    setOrganizationName(settings.organizationName || '');
    setContactPhone(settings.contactPhone || '');
    setAddress(settings.address || '');
    setCommercialRegistration(settings.commercialRegistration || '');
    setTaxId(settings.taxId || '');
    setCurrency(settings.currency || 'SAR');
    setDefaultLang(settings.defaultLang || 'ar');
    setVatEnabled(settings.vatEnabled ?? true);
    setDefaultVatRate(settings.defaultVatRate ?? 15);
    if (settings.vatRates) setVatRates(settings.vatRates);
    setDefaultRentalPeriodDays(settings.defaultRentalPeriodDays ?? 1);
    setRecordOdometer(settings.recordOdometer ?? true);
    setExcessMileageCharge(settings.excessMileageCharge ?? 1.5);
    setDailyMileageLimit(settings.dailyMileageLimit ?? 300);
    setHourlyDelayFee(settings.hourlyDelayFee ?? 50);
    setRentalExpiryReminderDays(settings.rentalExpiryReminderDays ?? 2);
    setShowLoginDemoUsers(settings.showLoginDemoUsers ?? true);
    setDefaultRentalPrice(settings.defaultRentalPrice ?? 250);
    if (settings.enabledPaymentMethods) setEnabledPaymentMethods(settings.enabledPaymentMethods);
    setInvoicePrefix(settings.invoicePrefix || 'INV-2026-');
    setMaintenanceIntervalKm(settings.maintenanceIntervalKm ?? 10000);
    setAutoMaintenanceAlerts(settings.autoMaintenanceAlerts ?? true);
    if (settings.serviceTypes) setServiceTypes(settings.serviceTypes);
    setLicenseExpiryReminderDays(settings.licenseExpiryReminderDays ?? 30);
    setEnableDriverRating(settings.enableDriverRating ?? true);
    if (settings.notificationChannels) setNotificationChannels(settings.notificationChannels);
    setNotificationEmail(settings.notificationEmail || '');
    setNotificationPhone(settings.notificationPhone || '');
    setLicenseKey(settings.licenseKey || '');
    setLicenseStatus(settings.licenseStatus || 'active');
    setLicenseExpiry(settings.licenseExpiry || '2099-12-31');
    setIsLifetimeLicense(settings.isLifetimeLicense ?? true);
    setLicenseType(settings.licenseType || 'lifetime');
  }, [settings]);

  // User Add/Edit Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [roleInput, setRoleInput] = useState<UserRole>('agent');
  const [activeInput, setActiveInput] = useState(true);
  const [permissionsInput, setPermissionsInput] = useState<UserPermissions>(getDefaultPermissions('agent'));

  // Password visibility map per user id
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

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

  const handleAddVatRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVatName) return;
    const item: VatRate = {
      id: `vat_${Date.now()}`,
      name: newVatName,
      rate: Number(newVatRate),
    };
    setVatRates((prev) => [...prev, item]);
    setNewVatName('');
    setNewVatRate(15);
    setIsAddVatOpen(false);
  };

  const handleRemoveVatRate = (vatId: string) => {
    setVatRates((prev) => prev.filter((v) => v.id !== vatId));
  };

  const handleAddServiceType = () => {
    if (!newServiceType.trim()) return;
    setServiceTypes((prev) => [...prev, newServiceType.trim()]);
    setNewServiceType('');
  };

  const handleRemoveServiceType = (idx: number) => {
    setServiceTypes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleExportBackup = () => {
    const backupObj = {
      settings: {
        ...settings,
        appName,
        appDescription,
        logoUrl,
        organizationName,
        contactPhone,
        address,
        commercialRegistration,
        taxId,
        currency,
        defaultLang,
        vatEnabled,
        defaultVatRate: Number(defaultVatRate),
        vatRates,
        defaultRentalPeriodDays: Number(defaultRentalPeriodDays),
        recordOdometer,
        excessMileageCharge: Number(excessMileageCharge),
        rentalExpiryReminderDays: Number(rentalExpiryReminderDays),
        defaultRentalPrice: Number(defaultRentalPrice),
        enabledPaymentMethods,
        invoicePrefix,
        maintenanceIntervalKm: Number(maintenanceIntervalKm),
        autoMaintenanceAlerts,
        serviceTypes,
        licenseExpiryReminderDays: Number(licenseExpiryReminderDays),
        enableDriverRating,
        notificationChannels,
        notificationEmail,
        notificationPhone,
      },
      exportDate: new Date().toISOString(),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `autofleet_settings_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.settings) {
            onUpdateSettings(parsed.settings);
            alert(lang === 'ar' ? 'تم استعادة النسخة الاحتياطية بنجاح!' : 'Backup restored successfully!');
          } else {
            alert(lang === 'ar' ? 'ملف غير صالح' : 'Invalid settings JSON');
          }
        } catch (err) {
          alert(lang === 'ar' ? 'خطأ أثناء قراءة الملف' : 'Error parsing backup JSON');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveAllSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      appName,
      appDescription,
      logoUrl,
      organizationName,
      contactPhone,
      address,
      commercialRegistration,
      taxId,
      currency,
      defaultLang,
      vatEnabled,
      defaultVatRate: Number(defaultVatRate),
      vatRates,
      defaultRentalPeriodDays: Number(defaultRentalPeriodDays),
      recordOdometer,
      excessMileageCharge: Number(excessMileageCharge),
      dailyMileageLimit: Number(dailyMileageLimit),
      hourlyDelayFee: Number(hourlyDelayFee),
      rentalExpiryReminderDays: Number(rentalExpiryReminderDays),
      showLoginDemoUsers,
      defaultRentalPrice: Number(defaultRentalPrice),
      enabledPaymentMethods,
      invoicePrefix,
      maintenanceIntervalKm: Number(maintenanceIntervalKm),
      autoMaintenanceAlerts,
      serviceTypes,
      licenseExpiryReminderDays: Number(licenseExpiryReminderDays),
      enableDriverRating,
      notificationChannels,
      notificationEmail,
      notificationPhone,
      licenseKey,
      licenseStatus,
      licenseExpiry,
      isLifetimeLicense,
      licenseType,
    });
    alert(lang === 'ar' ? 'تم حفظ كافة إعدادات وترخيص النظام بنجاح!' : 'All system and license settings saved successfully!');
  };

  const handleGrantLifetimeLicense = () => {
    const generatedKey = `DEV-AUTOFLEET-PERMANENT-LIFETIME-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setLicenseKey(generatedKey);
    setLicenseStatus('active');
    setLicenseExpiry('2099-12-31');
    setIsLifetimeLicense(true);
    setLicenseType('lifetime');

    onUpdateSettings({
      ...settings,
      licenseKey: generatedKey,
      licenseStatus: 'active',
      licenseExpiry: '2099-12-31',
      isLifetimeLicense: true,
      licenseType: 'lifetime',
    });

    alert(
      lang === 'ar'
        ? 'تم منح وتفعيل ترخيص مفتوح ودائم مدى الحياة للبرنامج بنجاح! ♾️\nالآن البرنامج يعمل بـ صلاحية غير محدودة وبدون تاريخ انتهـاء.'
        : 'Permanent Lifetime License successfully granted! ♾️\nThe system is now running with unlimited lifetime permission.'
    );
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUsernameInput('');
    setPasswordInput('');
    setFullNameInput('');
    setPhoneInput('');
    setRoleInput('agent');
    setActiveInput(true);
    setPermissionsInput(getDefaultPermissions('agent'));
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setUsernameInput(user.username);
    setPasswordInput(user.passwordHash);
    setFullNameInput(user.fullName);
    setPhoneInput(user.phone || '');
    setRoleInput(user.role);
    setActiveInput(user.active);
    setPermissionsInput(user.permissions || getDefaultPermissions(user.role));
    setIsUserModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRoleInput(newRole);
    setPermissionsInput(getDefaultPermissions(newRole));
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput || !fullNameInput) return;

    if (editingUser) {
      // Update existing user
      const updated: SystemUser = {
        ...editingUser,
        username: usernameInput,
        passwordHash: passwordInput,
        fullName: fullNameInput,
        phone: phoneInput,
        role: roleInput,
        active: activeInput,
        permissions: permissionsInput,
      };
      onUpdateUser(updated);
    } else {
      // Create new user
      const newUser: SystemUser = {
        id: `usr_${Date.now()}`,
        username: usernameInput,
        passwordHash: passwordInput,
        fullName: fullNameInput,
        phone: phoneInput,
        role: roleInput,
        active: activeInput,
        createdAt: new Date().toISOString().split('T')[0],
        permissions: permissionsInput,
      };
      onAddUser(newUser);
    }

    setIsUserModalOpen(false);
  };

  const handleDeleteUserClick = (userId: string, userName: string) => {
    if (window.confirm(lang === 'ar' ? `هل أنت تأكد من حذف المستخدم (${userName})؟` : `Are you sure you want to delete user (${userName})?`)) {
      onDeleteUser(userId);
    }
  };

  if (!isDeveloper) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-2xl p-8 text-center max-w-xl mx-auto my-12 shadow-md">
        <Lock className="w-12 h-12 mx-auto mb-3 text-rose-600" />
        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg mb-2">
          {lang === 'ar' ? 'منطقة محظورة - صـلاحية المطور فقط' : 'Restricted Zone - Developer Mode Required'}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          {lang === 'ar'
            ? 'فقط المطور (Developer) يمتلك الصلاحية لمنح الترخيص، تعديل بيانات المكتب، التحكم بالمستخدمين وكلمات المرور، وإنشاء حزم .EXE.'
            : 'Only Developer mode accounts have authority to grant system license, edit office info, control users/passwords, and build .EXE desktop apps.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black">{t.developerCenter}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'ar' ? 'التحكم الكامل بمستخدمي النظام، بيانات المكتب والسجل التجاري، والتحزيم لـ .EXE' : 'Complete user management, office & CR info, and desktop .EXE build tools'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-extrabold text-xs rounded-full border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.developerMode}</span>
          </span>
        </div>
      </div>

      {/* SECTION 1: SYSTEM SETTINGS CATEGORIES */}
      <form onSubmit={handleSaveAllSettings} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>{t.settings}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'ar' ? 'تخصيص كافة إعدادات المكتب، التأجير، المالية، الصيانة، والسائقين' : 'Configure office, rental, financial, maintenance, driver, and notification settings.'}
            </p>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>{t.save}</span>
          </button>
        </div>

        {/* Category Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('office')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition ${
              activeTab === 'office'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t.officeInfoTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rental')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition ${
              activeTab === 'rental'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>{t.rentalSettingsTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition ${
              activeTab === 'financial'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{t.financialSettingsTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition ${
              activeTab === 'maintenance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>{t.maintenanceSettingsTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drivers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition ${
              activeTab === 'drivers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.driverSettingsTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition ${
              activeTab === 'preferences'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{t.systemPreferencesTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{t.notificationsTab}</span>
          </button>
        </div>

        {/* TAB 1: OFFICE INFORMATION */}
        {activeTab === 'office' && (
          <div className="space-y-6">
            {/* System Branding & App Name Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-800/80 dark:to-slate-800/40 p-5 rounded-2xl border border-blue-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {lang === 'ar' ? 'هوية واسم البرنامج والنظام' : 'App Name & System Branding'}
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2.5 py-1 rounded-full">
                  {lang === 'ar' ? 'يظهر في أعلى البرنامج وكافة الشاشات' : 'Global Application Title'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {lang === 'ar' ? 'اسم البرنامج / التطبيق *' : 'Application / App Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: AutoFleet Pro | نظام إدارة السيارات والإيجار' : 'e.g. AutoFleet Pro Fleet Management'}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    {lang === 'ar' ? 'يتم تحديثه في عنوان المتصفح والشريط العلوي وشاشة الدخول تلقائياً' : 'Updates browser title, top navbar, and login screen automatically'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {lang === 'ar' ? 'وصف / شعار النظام المختصر' : 'App Subtitle / Slogan'}
                  </label>
                  <input
                    type="text"
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    placeholder={lang === 'ar' ? 'النظام الشامل لإدارة أسطول السيارات والعقود الرقمية' : 'Fleet & logistics comprehensive ERP'}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>{t.officeInfoTab}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.officeName} *
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: شركة الأسطول المتقدم لتأجير السيارات' : 'e.g. Advanced Fleet Car Rental Co.'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.officeAddress} *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={lang === 'ar' ? 'الرياض - حي الملز - طريق الملك عبد العزيز' : 'Riyadh - Al Malaz - King Abdulaziz Road'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.officePhone} *
                </label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+966 9200 12345"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.commercialRegNumber} *
                </label>
                <input
                  type="text"
                  required
                  value={commercialRegistration}
                  onChange={(e) => setCommercialRegistration(e.target.value)}
                  placeholder="1010889922"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.taxIdNumber} *
                </label>
                <input
                  type="text"
                  required
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="310492837400003"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>{t.uploadLogo}</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {logoUrl ? (
                  <div className="w-16 h-16 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 flex items-center justify-center shrink-0 shadow-xs">
                    <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain rounded-lg" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t.chooseLogoFile}</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="px-3 py-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 transition"
                      >
                        {t.delete}
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://... or data:image/..."
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RENTAL SETTINGS */}
        {activeTab === 'rental' && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <span>{t.rentalSettingsTab}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.defaultRentalPeriodDays}
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={defaultRentalPeriodDays}
                  onChange={(e) => setDefaultRentalPeriodDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'حد المسافة اليومي الافتراضي (كم / يوم)' : 'Daily Mileage Limit (km/day)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={dailyMileageLimit}
                  onChange={(e) => setDailyMileageLimit(Number(e.target.value))}
                  placeholder="300"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? `قيمة ساعة التأخير (${currency} / ساعة)` : `Hourly Delay Fee (${currency}/hr)`}
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={hourlyDelayFee}
                  onChange={(e) => setHourlyDelayFee(Number(e.target.value))}
                  placeholder="50"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.excessMileageCharge} ({currency} / كم زائد)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={excessMileageCharge}
                  onChange={(e) => setExcessMileageCharge(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.rentalExpiryReminderDays}
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={rentalExpiryReminderDays}
                  onChange={(e) => setRentalExpiryReminderDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 self-end">
                <input
                  type="checkbox"
                  id="odoToggle"
                  checked={recordOdometer}
                  onChange={(e) => setRecordOdometer(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="odoToggle" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  {t.recordOdometer}
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FINANCIAL SETTINGS */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>{t.financialSettingsTab}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.defaultRentalPrice} ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={defaultRentalPrice}
                  onChange={(e) => setDefaultRentalPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.invoicePrefixLabel}
                </label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="INV-2026-"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Payment Methods Options */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                {t.paymentMethodsHeading}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledPaymentMethods.cash}
                    onChange={(e) =>
                      setEnabledPaymentMethods({ ...enabledPaymentMethods, cash: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>{t.cashPayment}</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledPaymentMethods.creditCard}
                    onChange={(e) =>
                      setEnabledPaymentMethods({ ...enabledPaymentMethods, creditCard: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>{t.cardPayment}</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledPaymentMethods.bankTransfer}
                    onChange={(e) =>
                      setEnabledPaymentMethods({ ...enabledPaymentMethods, bankTransfer: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>{t.bankTransferPayment}</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={enabledPaymentMethods.check}
                    onChange={(e) =>
                      setEnabledPaymentMethods({ ...enabledPaymentMethods, check: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>{t.checkPayment}</span>
                </label>
              </div>
            </div>

            {/* VAT Control */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-600" />
                  <span>{t.vatControlTitle}</span>
                </h4>

                <button
                  type="button"
                  onClick={() => setIsAddVatOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 self-start sm:self-auto shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addVatRate}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    id="vatToggle"
                    checked={vatEnabled}
                    onChange={(e) => setVatEnabled(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="vatToggle" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    {t.enableVat}
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.defaultVatRateLabel}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={defaultVatRate}
                    onChange={(e) => setDefaultVatRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {vatRates.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{v.name}</span>
                      <span className="font-mono text-emerald-600 font-extrabold">{v.rate}%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVatRate(v.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MAINTENANCE SETTINGS */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>{t.maintenanceSettingsTab}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.maintenanceIntervalKm}
                </label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  value={maintenanceIntervalKm}
                  onChange={(e) => setMaintenanceIntervalKm(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 self-end">
                <input
                  type="checkbox"
                  id="autoMaintToggle"
                  checked={autoMaintenanceAlerts}
                  onChange={(e) => setAutoMaintenanceAlerts(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="autoMaintToggle" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  {t.autoMaintenanceAlerts}
                </label>
              </div>
            </div>

            {/* Service Types Manager */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                {t.serviceTypesList}
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newServiceType}
                  onChange={(e) => setNewServiceType(e.target.value)}
                  placeholder={lang === 'ar' ? 'أضف نوع خدمة جديد (مثال: غسيل وتلميع)' : 'Add new service type'}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddServiceType}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {serviceTypes.map((st, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 font-bold text-xs rounded-lg border border-amber-300 dark:border-amber-800"
                  >
                    <span>{st}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveServiceType(idx)}
                      className="text-amber-700 dark:text-amber-400 hover:text-rose-600"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DRIVER MANAGEMENT SETTINGS */}
        {activeTab === 'drivers' && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>{t.driverSettingsTab}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.licenseExpiryReminderDays}
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={licenseExpiryReminderDays}
                  onChange={(e) => setLicenseExpiryReminderDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 self-end">
                <input
                  type="checkbox"
                  id="ratingToggle"
                  checked={enableDriverRating}
                  onChange={(e) => setEnableDriverRating(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="ratingToggle" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  {t.enableDriverRating}
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PREFERENCES & BACKUP */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>{t.systemPreferencesTab}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.currencyInput}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="EGP">EGP (ج.م - الجنيه المصري) - العملة الأساسية</option>
                  <option value="SAR">SAR (ر.س - الريال السعودي)</option>
                  <option value="USD">USD ($ - الدولار الأمريكي)</option>
                  <option value="AED">AED (د.إ - الدرهم الإماراتي)</option>
                  <option value="IQD">IQD (د.ع - الدينار العراقي)</option>
                  <option value="EUR">EUR (€ - اليورو)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.defaultLangInput}
                </label>
                <select
                  value={defaultLang}
                  onChange={(e) => setDefaultLang(e.target.value as Language)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="ar">العربية (RTL)</option>
                  <option value="en">English (LTR)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.appNameInput}
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Login Screen Demo Accounts Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-0.5">
                <label htmlFor="demoUsersToggle" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer block">
                  {lang === 'ar' ? 'إظهار حسابات الدخول السريعة في شاشة تسجيل الدخول' : 'Show Quick/Demo Accounts on Login Screen'}
                </label>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ar'
                    ? 'عند إلغاء التفعيل، سيتم إخفاء قائمة المستخدمين والأزرار السريعة من شاشة الدخول للمزيد من الخصوصية والأمان'
                    : 'When disabled, quick user login buttons are hidden from the login screen for enhanced security'}
                </p>
              </div>
              <input
                type="checkbox"
                id="demoUsersToggle"
                checked={showLoginDemoUsers}
                onChange={(e) => setShowLoginDemoUsers(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* Backup & Restore Data Section */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div>
                <h5 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                  {lang === 'ar' ? 'النسخ الاحتياطي واستعادة كافة بيانات النظام' : 'Backup & Restore System Data'}
                </h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {lang === 'ar'
                    ? 'يمكنك حفظ نسخة احتياطية كاملة بصيغة JSON واستعادتها في أي وقت بسهولة'
                    : 'Export a full JSON backup file or restore previously saved data.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.exportBackup}</span>
                </button>

                <label className="cursor-pointer px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 rounded-xl font-extrabold text-xs flex items-center gap-2 transition">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'استعادة نسخة احتياطية' : 'Import Backup JSON'}</span>
                  <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={onResetData}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-extrabold text-xs flex items-center gap-2 transition border border-rose-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.resetData}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: NOTIFICATION SETTINGS */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>{t.notificationsTab}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationChannels.email}
                  onChange={(e) =>
                    setNotificationChannels({ ...notificationChannels, email: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{t.emailNotifications}</span>
              </label>

              <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationChannels.sms}
                  onChange={(e) =>
                    setNotificationChannels({ ...notificationChannels, sms: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{t.smsNotifications}</span>
              </label>

              <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationChannels.whatsapp}
                  onChange={(e) =>
                    setNotificationChannels({ ...notificationChannels, whatsapp: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{t.whatsappNotifications}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.notificationEmailLabel}
                </label>
                <input
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="alerts@autofleet.sa"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.notificationPhoneLabel}
                </label>
                <input
                  type="text"
                  value={notificationPhone}
                  onChange={(e) => setNotificationPhone(e.target.value)}
                  placeholder="+966 50 000 9988"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        )}
      </form>

      {/* SECTION 2: DEVELOPER USER CONTROL (REQUIREMENT 2) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>{t.userManagement}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'ar'
                ? 'تحكم المطور بالمستخدمين: إضافة، تعديل، تغيير اسم المستخدم وكلمة المرور، حذف الحسابات، وتحديد الصلاحيات'
                : 'Developer control: add, edit, change username/password, delete users, and assign roles'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {onPurgeDemoUsers && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      lang === 'ar'
                        ? 'هل أنت متأكد من مسح جميع المستخدمين التجريبيين (admin, agent) والإبقاء فقط على حساباتك الحقيقية؟'
                        : 'Are you sure you want to purge all demo users (admin, agent) and keep only real accounts?'
                    )
                  ) {
                    onPurgeDemoUsers();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl font-bold text-xs transition shadow-xs"
                title={lang === 'ar' ? 'مسح الحسابات التجريبية' : 'Purge Demo Users'}
              >
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>{lang === 'ar' ? 'مسح المستخدمين التجريبيين' : 'Purge Demo Users'}</span>
              </button>
            )}

            <button
              onClick={handleOpenAddUser}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.addUser}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-extrabold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">{t.username}</th>
                <th className="py-3 px-4">{t.password}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}</th>
                <th className="py-3 px-4">{t.phone}</th>
                <th className="py-3 px-4">{t.role}</th>
                <th className="py-3 px-4">{t.status}</th>
                <th className="py-3 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
              {users.map((u) => {
                const isPasswordVisible = visiblePasswords[u.id];
                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-black text-blue-600 dark:text-blue-400">
                      {u.username}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span>{isPasswordVisible ? u.passwordHash : '••••••••'}</span>
                        <button
                          onClick={() => togglePasswordVisibility(u.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                          title={isPasswordVisible ? t.hidePassword : t.showPassword}
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold">{u.fullName}</td>
                    <td className="py-3 px-4 text-slate-500">{u.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          u.role === 'developer'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                            : u.role === 'admin'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onUpdateUser({ ...u, active: !u.active })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {u.active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Disabled')}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition"
                          title={t.editUser}
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {u.role !== 'developer' && (
                          <button
                            onClick={() => handleDeleteUserClick(u.id, u.username)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition"
                            title={t.deleteUser}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: DESKTOP APP (.EXE) PACKAGING CENTER (REQUIREMENT 3) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-xl">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                {t.desktopExeTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar'
                  ? 'تحويل وترخيص هذا التطبيق ليعمل كـ برنامج سطح مكتب مستقل (.EXE) ينصب مباشرة على ويندوز'
                  : 'Convert and package this application into a native Windows (.EXE) standalone desktop program'}
              </p>
            </div>
          </div>

          <button
            onClick={() => downloadDesktopExePackage(settings.appName)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>{t.downloadExePack}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'ar' ? 'خطوات إنشاء ملف (.EXE) لسطح المكتب:' : 'Steps to generate your Windows (.EXE) Installer:'}</span>
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            <li>
              {lang === 'ar'
                ? 'اضغط على زر "تحميل سكريبت تحزيم (.EXE)" بالأعلى لتنزيل ملفات التحزيم جاهزة (build-exe-desktop.bat, main.js, package-electron.json).'
                : 'Click "Download (.EXE) Packaging Script" button above to get pre-configured builder files.'}
            </li>
            <li>
              {lang === 'ar'
                ? 'ضع الملفات في المجلد الرئيسي لمشروعك وقُم بتشغيل ملف build-exe-desktop.bat بنقرتين على نظام الويندوز.'
                : 'Place files in project folder and double click build-exe-desktop.bat on Windows.'}
            </li>
            <li>
              {lang === 'ar'
                ? 'سيتم تجميع التطبيق تلقائياً وإنشاء ملف تثبيت مستقل (AutoFleet-Setup-1.0.0.exe) داخل مجلد dist/ جاهز للتثبيت والاستخدام!'
                : 'It automatically compiles into a standalone setup file (AutoFleet-Setup-1.0.0.exe) inside dist/ folder!'}
            </li>
          </ol>
        </div>
      </div>

      {/* SECTION 4: WIPE DEMO DATA (DEVELOPER PERMISSION ONLY) */}
      <div className="bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-800/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-600 text-white rounded-xl shadow-md">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-rose-950 dark:text-rose-100 text-base">
                {lang === 'ar' ? 'مسح البيانات التجريبية والسجلات السابقة (Wipe All Demo Data)' : 'Wipe All Demo Data'}
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 font-medium">
                {lang === 'ar'
                  ? 'صلاحية خاصة بالمطور فقط: تصفير كافة السجلات التجريبية المخزنة (العملاء، السيارات، عقود الإيجار، الفواتير، المبيعات، الحجوزات...) والبدء بنظام فارغ ونظيف.'
                  : 'Developer only permission: wipe out all stored demo dataset records to start with a clean system.'}
              </p>
            </div>
          </div>

          <button
            onClick={onWipeDemoData}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>{lang === 'ar' ? 'مسح البيانات التجريبية الآن' : 'Clear Demo Data Now'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 5: SYSTEM LICENSE AUTHORITY & PERMANENT LIFETIME PERMISSION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                {lang === 'ar' ? 'سلطة الترخيص وصلاحية استخدام النظام' : 'System License & Lifetime Permission Authority'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ar'
                  ? 'التحكم بنوع ترخيص البرنامج وإعطاء صلاحية تشغيل دائمة ومفتوحة مدى الحياة بدون قيود زمنية.'
                  : 'Manage system validity, authorization key, and grant permanent lifetime access.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleGrantLifetimeLicense}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition shrink-0"
          >
            <Infinity className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إعطاء صلاحية ترخيص مفتوح ودائم فوراً' : 'Grant Permanent Lifetime Access Now'}</span>
          </button>
        </div>

        {/* Current Active License Banner */}
        {isLifetimeLicense && licenseStatus === 'active' ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-lg">
                <Infinity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-xs block">
                  {lang === 'ar' ? 'حالة النظام الحالية: ترخيص مفتوح ودائم مدى الحياة (♾️ Lifetime License Active)' : 'System Status: Permanent Lifetime License Active'}
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  {lang === 'ar'
                    ? 'يمتلك البرنامج الآن كافة الصلاحيات المفتوحة للعمل بشكل دائم وغير محدود وبدون أي تاريخ صلاحية أو انتهـاء.'
                    : 'The software holds full permanent authorization without any expiration constraints.'}
                </span>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-600 text-white font-mono text-[10px] font-black rounded-full uppercase tracking-wider">
              UNLIMITED / LIFETIME
            </span>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-600 text-white rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-xs block">
                  {lang === 'ar' ? 'حالة الترخيص: محدد بوقت / انتهـاء' : 'License Status: Time-Bound / Expirable'}
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  {lang === 'ar'
                    ? `ينتهي الترخيص بتاريخ: ${licenseExpiry || 'غير محدد'}`
                    : `License expires on: ${licenseExpiry || 'Not set'}`}
                </span>
              </div>
            </div>
            <button
              onClick={handleGrantLifetimeLicense}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition"
            >
              {lang === 'ar' ? 'تحويل لترخيص مفتوح' : 'Make Lifetime'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* License Type Option */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'ar' ? 'نوع صلاحية الترخيص' : 'License Permission Type'}
            </label>
            <select
              value={licenseType}
              onChange={(e) => {
                const val = e.target.value as 'lifetime' | 'annual' | 'monthly' | 'trial';
                setLicenseType(val);
                if (val === 'lifetime') {
                  setIsLifetimeLicense(true);
                  setLicenseExpiry('2099-12-31');
                  setLicenseStatus('active');
                } else {
                  setIsLifetimeLicense(false);
                  const now = new Date();
                  if (val === 'annual') now.setFullYear(now.getFullYear() + 1);
                  if (val === 'monthly') now.setMonth(now.getMonth() + 1);
                  if (val === 'trial') now.setDate(now.getDate() + 14);
                  setLicenseExpiry(now.toISOString().split('T')[0]);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              <option value="lifetime">{lang === 'ar' ? '♾️ ترخيص مفتوح ودائم مدى الحياة (Permanent)' : '♾️ Permanent Lifetime Access'}</option>
              <option value="annual">{lang === 'ar' ? '📅 ترخيص سنوي (1 سنة)' : '📅 Annual License (1 Year)'}</option>
              <option value="monthly">{lang === 'ar' ? '📆 ترخيص شهري (30 يوم)' : '📆 Monthly License (30 Days)'}</option>
              <option value="trial">{lang === 'ar' ? '⏳ ترخيص تجريبي (14 يوم)' : '⏳ Trial License (14 Days)'}</option>
            </select>
          </div>

          {/* License Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.status}
            </label>
            <select
              value={licenseStatus}
              onChange={(e) => setLicenseStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              <option value="active">{t.activeLicense}</option>
              <option value="expired">{t.licenseExpired}</option>
              <option value="suspended">{t.licenseSuspended}</option>
            </select>
          </div>

          {/* License Key */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.licenseKey}
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setLicenseKey(`KEY-${Math.random().toString(36).substring(2, 10).toUpperCase()}-2026`)}
                className="px-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-200 shrink-0"
                title={lang === 'ar' ? 'توليد مفتاح جديد' : 'Generate Key'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* License Expiry Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.licenseExpiryDate}
            </label>
            {isLifetimeLicense ? (
              <div className="w-full px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Infinity className="w-4 h-4" />
                <span>{lang === 'ar' ? 'دائم / مفتوح (غير محدد)' : 'Permanent Lifetime Access'}</span>
              </div>
            ) : (
              <input
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
              />
            )}
          </div>
        </div>

        {/* Lifetime Switch Toggle */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isLifetimeLicense}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsLifetimeLicense(checked);
                if (checked) {
                  setLicenseType('lifetime');
                  setLicenseExpiry('2099-12-31');
                  setLicenseStatus('active');
                } else {
                  setLicenseType('annual');
                  const oneYr = new Date();
                  oneYr.setFullYear(oneYr.getFullYear() + 1);
                  setLicenseExpiry(oneYr.toISOString().split('T')[0]);
                }
              }}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {lang === 'ar' ? 'تمكين الصلاحية المفتوحة والدائمة مدى الحياة للبرنامج' : 'Enable Permanent Lifetime Access for the System'}
            </span>
          </label>

          <span className="text-[11px] font-mono text-slate-400">
            SYSTEM-AUTH-VER: 2026.4-LIFETIME
          </span>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto my-auto">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg mb-4">
              {editingUser ? t.editUser : t.addUser}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.username} *
                </label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder={lang === 'ar' ? 'اسم المستخدم' : 'Username'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.password} *
                </label>
                <input
                  type="text"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={lang === 'ar' ? 'كلمة المرور الحالية أو الجديدة' : 'Password'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.phone}
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+20 100 000 0000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.role}
                  </label>
                  <select
                    value={roleInput}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="admin">Fleet Admin (مدير)</option>
                    <option value="agent">Rental Agent (موظف)</option>
                    <option value="developer">Developer (مطور)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.status}
                  </label>
                  <select
                    value={activeInput ? 'true' : 'false'}
                    onChange={(e) => setActiveInput(e.target.value === 'true')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="true">{lang === 'ar' ? 'نشط' : 'Active'}</option>
                    <option value="false">{lang === 'ar' ? 'معطل' : 'Disabled'}</option>
                  </select>
                </div>
              </div>

              {/* Permissions Management Section for Developer */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center justify-between">
                  <span>{lang === 'ar' ? 'صلاحيات هذا المستخدم (تحكم المطور)' : 'User Permissions Matrix'}</span>
                  <span className="text-[10px] font-normal text-slate-500">{lang === 'ar' ? 'إعادة ضبط بالدور' : 'Role defaults'}</span>
                </div>

                {/* Actions Permissions */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={permissionsInput.canEdit}
                      onChange={(e) => setPermissionsInput((prev) => ({ ...prev, canEdit: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>{lang === 'ar' ? 'التعديل' : 'Can Edit'}</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={permissionsInput.canDelete}
                      onChange={(e) => setPermissionsInput((prev) => ({ ...prev, canDelete: e.target.checked }))}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <span>{lang === 'ar' ? 'المسح' : 'Can Delete'}</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={permissionsInput.canAdd}
                      onChange={(e) => setPermissionsInput((prev) => ({ ...prev, canAdd: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>{lang === 'ar' ? 'الإضافة' : 'Can Add'}</span>
                  </label>
                </div>

                {/* Module Permissions Matrix */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'ar' ? 'الأقسام المسموح بالوصول إليها:' : 'Allowed App Modules:'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl text-xs max-h-48 overflow-y-auto">
                    {[
                      { id: 'dashboard', label: lang === 'ar' ? 'لوحة التحكم' : 'Dashboard' },
                      { id: 'customers', label: lang === 'ar' ? 'إدارة العملاء' : 'Customers' },
                      { id: 'cars', label: lang === 'ar' ? 'إدارة السيارات' : 'Cars' },
                      { id: 'bookings', label: lang === 'ar' ? 'حجز السيارات' : 'Bookings' },
                      { id: 'rentals', label: lang === 'ar' ? 'عقود الإيجار' : 'Rental Contracts' },
                      { id: 'corporate', label: lang === 'ar' ? 'نقل الموظفين والورديات' : 'Corporate Fleet' },
                      { id: 'sales', label: lang === 'ar' ? 'إدارة المبيعات' : 'Vehicle Sales' },
                      { id: 'deliveries', label: lang === 'ar' ? 'خدمات التوصيل' : 'Deliveries' },
                      { id: 'maintenance', label: lang === 'ar' ? 'الصيانة والخدمات' : 'Maintenance' },
                      { id: 'invoices', label: lang === 'ar' ? 'الفواتير' : 'Invoices' },
                      { id: 'finance', label: lang === 'ar' ? 'المالية والتقارير' : 'Finance & Reports' },
                      { id: 'treasury', label: lang === 'ar' ? 'إدارة الخزينة والعهد' : 'Treasury & Cash' },
                      { id: 'traffic_fines', label: lang === 'ar' ? 'المخالفات وساهر' : 'Traffic Fines & Tolls' },
                      { id: 'vehicle_roi', label: lang === 'ar' ? 'أرباح وعائد الأسطول (ROI)' : 'Vehicle ROI & P&L' },
                      { id: 'audit_logs', label: lang === 'ar' ? 'سجل الرقابة والتدقيق' : 'Audit Trail' },
                      { id: 'employees', label: lang === 'ar' ? 'الموظفين والسائقين' : 'Drivers & Staff' },
                    ].map((mod) => {
                      const isAllowed = permissionsInput.allowedModules[mod.id as keyof typeof permissionsInput.allowedModules] ?? true;
                      return (
                        <label key={mod.id} className="flex items-center gap-2 p-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setPermissionsInput((prev) => ({
                                ...prev,
                                allowedModules: {
                                  ...prev.allowedModules,
                                  [mod.id]: checked,
                                  ...(mod.id === 'rentals' ? { contracts: checked } : {}),
                                  ...(mod.id === 'employees' ? { drivers: checked } : {}),
                                },
                              }));
                            }}
                            className="w-3.5 h-3.5 text-blue-600 rounded"
                          />
                          <span>{mod.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add VAT Rate Modal */}
      {isAddVatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-600" />
              <span>{t.addVatRate}</span>
            </h3>

            <form onSubmit={handleAddVatRate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.vatRateName} *
                </label>
                <input
                  type="text"
                  required
                  value={newVatName}
                  onChange={(e) => setNewVatName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: ضريبة المبيعات الخاصة (10%)' : 'e.g. Special Sales VAT (10%)'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.vatRatePercent} *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.1"
                  value={newVatRate}
                  onChange={(e) => setNewVatRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddVatOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
