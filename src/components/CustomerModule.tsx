import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Camera,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  Edit,
  Star,
  MessageSquare,
  CreditCard,
  Briefcase,
  Upload,
  Image as ImageIcon,
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Crown,
  Ban,
} from 'lucide-react';
import { Customer, CustomerRating, CustomerServiceType, RentalContract, Invoice, PaymentVoucher, AppSettings, Currency, Language } from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { CameraCaptureModal } from './CameraCaptureModal';
import { PrintCustomerStatementModal } from './PrintCustomerStatementModal';

interface CustomerModuleProps {
  customers: Customer[];
  contracts?: RentalContract[];
  invoices?: Invoice[];
  vouchers?: PaymentVoucher[];
  settings?: AppSettings;
  currency?: Currency;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  lang: Language;
  selectedCustomerId?: string;
  onClearTarget?: () => void;
}

export const CustomerModule: React.FC<CustomerModuleProps> = ({
  customers,
  contracts = [],
  invoices = [],
  vouchers = [],
  settings = {} as AppSettings,
  currency = 'SAR',
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  lang,
  selectedCustomerId,
  onClearTarget,
}) => {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Customer Rating Modal State
  const [ratingCustomer, setRatingCustomer] = useState<Customer | null>(null);
  const [newRatingScore, setNewRatingScore] = useState<number>(5);
  const [newRatingComment, setNewRatingComment] = useState<string>('');
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (selectedCustomerId) {
      const found = customers.find((c) => c.id === selectedCustomerId);
      if (found) {
        setSearchTerm(found.name);
        setFilterType('all');
        setStatementCustomer(found);
      }
    }
  }, [selectedCustomerId, customers]);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [nationality, setNationality] = useState('');
  const [address, setAddress] = useState('');
  const [serviceType, setServiceType] = useState<CustomerServiceType>('rental');
  const [photoUrl, setPhotoUrl] = useState('');
  const [docPhotoUrl, setDocPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [vipLevel, setVipLevel] = useState<'standard' | 'silver' | 'gold' | 'vip'>('standard');

  // Blacklist Quick Modal State
  const [blacklistCustomerTarget, setBlacklistCustomerTarget] = useState<Customer | null>(null);
  const [quickBlacklistReason, setQuickBlacklistReason] = useState('');

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'photo' | 'doc'>('photo');

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setNationalId('');
    setJobTitle('');
    setLicenseNumber('');
    setLicenseExpiryDate('');
    setNationality(lang === 'ar' ? 'سعودي' : 'Saudi');
    setAddress('');
    setServiceType('rental');
    setPhotoUrl('');
    setDocPhotoUrl('');
    setNotes('');
    setIsBlacklisted(false);
    setBlacklistReason('');
    setCreditLimit(0);
    setVipLevel('standard');
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setEmail(customer.email);
    setNationalId(customer.nationalId);
    setJobTitle(customer.jobTitle || '');
    setLicenseNumber(customer.licenseNumber || '');
    setLicenseExpiryDate(customer.licenseExpiryDate || '');
    setNationality(customer.nationality || '');
    setAddress(customer.address);
    setServiceType(customer.serviceType);
    setPhotoUrl(customer.photoUrl || '');
    setDocPhotoUrl(customer.docPhotoUrl || '');
    setNotes(customer.notes || '');
    setIsBlacklisted(!!customer.isBlacklisted);
    setBlacklistReason(customer.blacklistReason || '');
    setCreditLimit(customer.creditLimit || 0);
    setVipLevel(customer.vipLevel || 'standard');
    setIsModalOpen(true);
  };

  const openRatingModal = (customer: Customer) => {
    setRatingCustomer(customer);
    setNewRatingScore(5);
    setNewRatingComment('');
  };

  const handleAddRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingCustomer) return;

    const newRatingObj: CustomerRating = {
      id: `rate_${Date.now()}`,
      customerId: ratingCustomer.id,
      rating: newRatingScore,
      comment: newRatingComment,
      ratedBy: 'موظف النظام',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const existingRatings = ratingCustomer.ratings || [];
    const updatedRatings = [newRatingObj, ...existingRatings];
    const totalScore = updatedRatings.reduce((sum, r) => sum + r.rating, 0);
    const avgScore = Number((totalScore / updatedRatings.length).toFixed(1));

    onUpdateCustomer({
      ...ratingCustomer,
      ratings: updatedRatings,
      averageRating: avgScore,
    });

    setRatingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        name,
        phone,
        email,
        nationalId,
        jobTitle,
        licenseNumber,
        licenseExpiryDate,
        nationality,
        address,
        serviceType,
        photoUrl,
        docPhotoUrl,
        notes,
        isBlacklisted,
        blacklistReason: isBlacklisted ? blacklistReason : '',
        creditLimit: Number(creditLimit) || 0,
        vipLevel,
      });
    } else {
      const newCust: Customer = {
        id: `cust_${Date.now()}`,
        name,
        phone,
        email,
        nationalId,
        jobTitle,
        licenseNumber,
        licenseExpiryDate,
        nationality,
        address,
        serviceType,
        photoUrl,
        docPhotoUrl,
        notes,
        isBlacklisted,
        blacklistReason: isBlacklisted ? blacklistReason : '',
        creditLimit: Number(creditLimit) || 0,
        vipLevel,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddCustomer(newCust);
    }
    setIsModalOpen(false);
  };

  const handleToggleBlacklist = (customer: Customer) => {
    if (customer.isBlacklisted) {
      // Unblock
      if (window.confirm(lang === 'ar' ? `هل أنت متأكد من إلغاء حظر العميل (${customer.name})؟` : `Remove (${customer.name}) from blacklist?`)) {
        onUpdateCustomer({
          ...customer,
          isBlacklisted: false,
          blacklistReason: '',
        });
      }
    } else {
      // Open blacklist reason prompt modal
      setBlacklistCustomerTarget(customer);
      setQuickBlacklistReason(lang === 'ar' ? 'تأخر متكرر في السداد وعدم الالتزام بموعد الإرجاع' : 'Late payment and overdue returns');
    }
  };

  const handleConfirmQuickBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blacklistCustomerTarget) return;

    onUpdateCustomer({
      ...blacklistCustomerTarget,
      isBlacklisted: true,
      blacklistReason: quickBlacklistReason.trim() || (lang === 'ar' ? 'مدرج بقرار إداري' : 'Administrative block'),
    });
    setBlacklistCustomerTarget(null);
  };

  const handleCapture = (imageDataUrl: string) => {
    if (cameraTarget === 'photo') {
      setPhotoUrl(imageDataUrl);
    } else {
      setDocPhotoUrl(imageDataUrl);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.nationalId.toLowerCase().includes(term) ||
      (c.jobTitle && c.jobTitle.toLowerCase().includes(term)) ||
      (c.licenseNumber && c.licenseNumber.toLowerCase().includes(term));
    const matchesType =
      filterType === 'all'
        ? true
        : filterType === 'blacklisted'
        ? c.isBlacklisted
        : filterType === 'vip'
        ? c.vipLevel && c.vipLevel !== 'standard'
        : c.serviceType === filterType;
    return matchesSearch && matchesType;
  });

  // Count stats
  const totalCount = customers.length;
  const blacklistedCount = customers.filter(c => c.isBlacklisted).length;
  const vipCount = customers.filter(c => c.vipLevel && c.vipLevel !== 'standard').length;

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            <span>{t.customerList}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar' ? 'إدارة بيانات العملاء، الصور الملتقطة والوثائق المرفقة' : 'Manage customer profiles, captured photos, and documents'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addCustomer}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-3.5 rtl:right-3.5 ltr:left-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rtl:pr-10 ltr:pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{lang === 'ar' ? `جميع العملاء (${totalCount})` : `All Customers (${totalCount})`}</option>
          <option value="rental">{t.contracts}</option>
          <option value="corporate">{lang === 'ar' ? 'شركات' : 'Corporate'}</option>
          <option value="vip">{lang === 'ar' ? `عملاء VIP (${vipCount})` : `VIP Tiers (${vipCount})`}</option>
          <option value="blacklisted">{lang === 'ar' ? `⚠️ القائمة السوداء (${blacklistedCount})` : `⚠️ Blacklisted (${blacklistedCount})`}</option>
          <option value="delivery">{t.deliveries}</option>
          <option value="sales">{t.sales}</option>
        </select>
      </div>

      {/* Customer Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-400">
          <User className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <p className="font-semibold text-sm">{t.noCustomers}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className={`rounded-2xl border p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between ${
                cust.isBlacklisted
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-400/40'
                  : cust.vipLevel === 'vip' || cust.vipLevel === 'gold'
                  ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-300 dark:border-amber-900/40'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Blacklist Banner on Card */}
                {cust.isBlacklisted && (
                  <div className="mb-3 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-black flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <Ban className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'عميل مدرج بالقائمة السوداء (محظور)' : 'BLACKLISTED CUSTOMER'}</span>
                    </div>
                    <span className="text-[10px] bg-rose-700 px-2 py-0.5 rounded-full font-bold">
                      {lang === 'ar' ? 'ممنوع التأجير' : 'Block Rental'}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {cust.photoUrl ? (
                      <img
                        src={cust.photoUrl}
                        alt={cust.name}
                        className={`w-14 h-14 rounded-full object-cover border-2 shadow-xs ${
                          cust.isBlacklisted ? 'border-rose-500' : 'border-blue-500'
                        }`}
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${
                        cust.isBlacklisted
                          ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                          : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                      }`}>
                        {cust.name.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                          {cust.name}
                        </h3>
                        {cust.vipLevel && cust.vipLevel !== 'standard' && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-full text-[10px] font-black border border-amber-300 dark:border-amber-700">
                            <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                            <span>{cust.vipLevel.toUpperCase()}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-full text-[11px] font-bold border border-blue-200 dark:border-blue-800">
                          {cust.serviceType.toUpperCase()}
                        </span>
                        {cust.averageRating !== undefined && (
                          <span className="flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>{cust.averageRating}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Quick Blacklist Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleBlacklist(cust)}
                      className={`p-1.5 rounded-lg transition ${
                        cust.isBlacklisted
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                      title={cust.isBlacklisted ? (t.removeFromBlacklist || 'إلغاء الحظر') : (t.addToBlacklist || 'إدراج بالقائمة السوداء')}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatementCustomer(cust)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                      title={lang === 'ar' ? 'طباعة كشف حساب العميل' : 'Customer Statement of Account'}
                    >
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={() => openRatingModal(cust)}
                      className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                      title={t.rateCustomer}
                    >
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    </button>
                    <button
                      onClick={() => openEditModal(cust)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title={t.edit}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteCustomer(cust.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Reason alert if blacklisted */}
                {cust.isBlacklisted && cust.blacklistReason && (
                  <div className="mb-3 p-2.5 bg-rose-100/70 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{lang === 'ar' ? 'سبب الإدراج:' : 'Reason:'}</span>
                      <span className="text-[11px]">{cust.blacklistReason}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{cust.phone}</span>
                  </div>
                  {cust.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cust.email}</span>
                    </div>
                  )}
                  {cust.nationalId && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{t.nationalId}: <strong className="font-mono text-slate-800 dark:text-slate-200">{cust.nationalId}</strong></span>
                    </div>
                  )}
                  {cust.creditLimit !== undefined && cust.creditLimit > 0 && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      <span>{lang === 'ar' ? 'الحد الائتماني:' : 'Credit Limit:'} <strong>{formatCurrency(cust.creditLimit, currency, lang)}</strong></span>
                    </div>
                  )}
                  {cust.jobTitle && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{t.jobTitle || (lang === 'ar' ? 'الوظيفة:' : 'Occupation:')} <strong className="text-slate-800 dark:text-slate-200">{cust.jobTitle}</strong></span>
                    </div>
                  )}
                  {cust.licenseNumber && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>{t.licenseNumber}: <strong className="font-mono text-blue-700 dark:text-blue-400">{cust.licenseNumber}</strong></span>
                      {cust.licenseExpiryDate && (
                        <span className="text-[10px] text-slate-400">({cust.licenseExpiryDate})</span>
                      )}
                    </div>
                  )}
                  {cust.nationality && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{t.nationality}:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{cust.nationality}</span>
                    </div>
                  )}
                  {cust.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{cust.address}</span>
                    </div>
                  )}

                  {/* Rating & Behavior Notes Summary */}
                  {cust.ratings && cust.ratings.length > 0 && (
                    <div className="mt-3 p-2.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{t.ratingNotes}</span>
                        </span>
                        <span>{cust.ratings.length} {lang === 'ar' ? 'تقييمات' : 'ratings'}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 italic line-clamp-2">
                        "{cust.ratings[0].comment}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Doc Photo Badge if attached */}
              {cust.docPhotoUrl && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{lang === 'ar' ? 'صورة الهوية / الرخصة مرفقة' : 'ID / License Attached'}</span>
                  </span>
                  <a
                    href={cust.docPhotoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    {lang === 'ar' ? 'معاينة' : 'View'}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg">
                {editingCustomer ? t.edit : t.addCustomer}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.customerName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.phone} *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.nationalId}
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    placeholder={lang === 'ar' ? 'رقم الهوية الوطنية / الإقامة' : 'Civil ID / Resident ID'}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{t.jobTitle || (lang === 'ar' ? 'الوظيفة / جهة العمل' : 'Occupation / Employer')}</span>
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    placeholder={lang === 'ar' ? 'الوظيفة أو جهة العمل (مثال: مهندس / شركة أرامكو)' : 'e.g. Engineer / Company Name'}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t.customerLicenseNumber || t.licenseNumber}</span>
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    placeholder={lang === 'ar' ? 'رقم رخصة القيادة' : "Driver's License No."}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-mono text-blue-900 dark:text-blue-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.customerLicenseExpiryDate || t.licenseExpiryDate}
                  </label>
                  <input
                    type="date"
                    value={licenseExpiryDate}
                    onChange={(e) => setLicenseExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.nationality}
                  </label>
                  <input
                    type="text"
                    value={nationality}
                    placeholder={lang === 'ar' ? 'الجنسية (مثال: سعودي / مصري)' : 'e.g. Saudi, Egyptian'}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.serviceType}
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as CustomerServiceType)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="rental">{t.contracts}</option>
                    <option value="delivery">{t.deliveries}</option>
                    <option value="sales">{t.sales}</option>
                    <option value="corporate">{lang === 'ar' ? 'شركات' : 'Corporate'}</option>
                    <option value="individual">{lang === 'ar' ? 'أفراد' : 'Individual'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    placeholder="name@domain.com"
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.vipLevel || 'تصنيف العميل'}</span>
                  </label>
                  <select
                    value={vipLevel}
                    onChange={(e) => setVipLevel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="standard">{lang === 'ar' ? 'عادي (Standard)' : 'Standard'}</option>
                    <option value="silver">{lang === 'ar' ? 'فضي (Silver)' : 'Silver'}</option>
                    <option value="gold">{lang === 'ar' ? 'ذهبي (Gold)' : 'Gold'}</option>
                    <option value="vip">{lang === 'ar' ? 'VIP نخبة (Elite VIP)' : 'Elite VIP'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.creditLimit || 'الحد الائتماني (ريال/جنيه)'}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={creditLimit || ''}
                    placeholder="0"
                    onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.address}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={lang === 'ar' ? 'المدينة، الحي، اسم الشارع' : 'City, District, Street'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Blacklist Control Block */}
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                        {lang === 'ar' ? 'القائمة السوداء ومنع التأجير (Blacklist)' : 'Blacklist & Credit Warning'}
                      </h4>
                      <p className="text-[11px] text-rose-700/80 dark:text-rose-400">
                        {lang === 'ar' ? 'عند التفعيل، سيظهر تحذير أحمر حاسم ويمنع إنشاء عقود جديدة للعميل.' : 'When enabled, staff will be strongly warned and prevented from creating new contracts.'}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBlacklisted}
                      onChange={(e) => setIsBlacklisted(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                {isBlacklisted && (
                  <div className="pt-2 border-t border-rose-200/80 dark:border-rose-900/40">
                    <label className="block text-xs font-bold text-rose-800 dark:text-rose-300 mb-1">
                      {t.blacklistReason || 'سبب الإدراج في القائمة السوداء (مطلوب)'}
                    </label>
                    <input
                      type="text"
                      required={isBlacklisted}
                      value={blacklistReason}
                      onChange={(e) => setBlacklistReason(e.target.value)}
                      placeholder={lang === 'ar' ? 'اذكر سبب الحظر (مثال: عدم سداد المستحقات، حوادث متكررة، تأخير استرجاع)' : 'Reason for blacklisting (e.g. unpaid dues, accidents, delay)...'}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-xl text-xs text-rose-900 dark:text-rose-100 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Customer Photo and Document Photo Section (Upload from Computer + Camera) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Personal Photo */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.photo} {lang === 'ar' ? '(الصورة الشخصية للعميل)' : '(Personal Photo)'}
                  </span>
                  
                  {photoUrl ? (
                    <div className="relative w-20 h-20 mx-auto">
                      <img src={photoUrl} alt="Customer" className="w-20 h-20 object-cover rounded-full mx-auto border-2 border-blue-500 shadow-xs" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition shadow"
                        title={lang === 'ar' ? 'إزالة الصورة' : 'Remove Photo'}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition">
                      <Upload className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'رفع من الكمبيوتر' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setPhotoUrl(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setCameraTarget('photo');
                        setIsCameraOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg transition"
                    >
                      <Camera className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'كاميرا' : 'Camera'}</span>
                    </button>
                  </div>
                </div>

                {/* ID / License Document Photo */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.docPhoto} {lang === 'ar' ? '(صورة الهوية / الرخصة)' : '(ID / License Doc)'}
                  </span>

                  {docPhotoUrl ? (
                    <div className="relative w-24 h-16 mx-auto">
                      <img src={docPhotoUrl} alt="Document" className="w-24 h-16 object-cover rounded-lg mx-auto border-2 border-emerald-500 shadow-xs" />
                      <button
                        type="button"
                        onClick={() => setDocPhotoUrl('')}
                        className="absolute -top-1 -right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition shadow"
                        title={lang === 'ar' ? 'إزالة المستند' : 'Remove Document'}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-16 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition">
                      <Upload className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'رفع من الكمبيوتر' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setDocPhotoUrl(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setCameraTarget('doc');
                        setIsCameraOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg transition"
                    >
                      <Camera className="w-3 h-3" />
                      <span>{lang === 'ar' ? 'كاميرا' : 'Camera'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Rating & Notes Modal */}
      {ratingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-amber-500/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  {t.customerRatingTitle} - {ratingCustomer.name}
                </h3>
              </div>
              <button
                onClick={() => setRatingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRating} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {t.rateCustomer} (1 - 5 {lang === 'ar' ? 'نجوم' : 'stars'})
                </label>
                <div className="flex items-center gap-2 justify-center p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRatingScore(star)}
                      className="p-1 transition transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= newRatingScore
                            ? 'text-amber-500 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.ratingNotes}
                </label>
                <textarea
                  rows={3}
                  value={newRatingComment}
                  onChange={(e) => setNewRatingComment(e.target.value)}
                  placeholder={lang === 'ar' ? 'أضف ملاحظات عن التزام العميل بالسداد، نظافة السيارة، أو المواعيد...' : 'Add notes regarding customer payments, car cleanliness, punctuality...'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* History of previous ratings */}
              {ratingCustomer.ratings && ratingCustomer.ratings.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    {t.ratingHistory}
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {ratingCustomer.ratings.map((r) => (
                      <div key={r.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1 text-amber-500">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{r.rating} / 5</span>
                          </span>
                          <span className="text-slate-400 text-[10px]">{r.createdAt}</span>
                        </div>
                        {r.comment && <p className="text-slate-600 dark:text-slate-300">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRatingCustomer(null)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-md transition"
                >
                  {t.addRating}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCapture}
        lang={lang}
        title={cameraTarget === 'photo' ? t.photo : t.docPhoto}
      />

      {/* Quick Blacklist Confirmation / Reason Modal */}
      {blacklistCustomerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-rose-300 dark:border-rose-900/60 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-rose-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-white" />
                <h3 className="font-extrabold text-sm">
                  {lang === 'ar' ? 'إدراج عميل في القائمة السوداء' : 'Add Customer to Blacklist'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBlacklistCustomerTarget(null)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmQuickBlacklist} className="p-5 space-y-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                <p className="font-black text-sm">{blacklistCustomerTarget.name}</p>
                <p>{lang === 'ar' ? 'سيتم حظر العميل وإظهار تنبيه صارم عند محاولة إنشاء أي عقد إيجار له.' : 'This customer will be blocked from new rentals with an instant red warning.'}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ar' ? 'سبب الإدراج في القائمة السوداء:' : 'Reason for Blacklisting:'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={quickBlacklistReason}
                  onChange={(e) => setQuickBlacklistReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBlacklistCustomerTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تأكيد الحظر والإدراج' : 'Confirm Blacklist'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Statement of Account Modal */}
      {statementCustomer && (
        <PrintCustomerStatementModal
          customer={statementCustomer}
          contracts={contracts}
          invoices={invoices}
          vouchers={vouchers}
          settings={settings}
          currency={currency}
          lang={lang}
          onClose={() => setStatementCustomer(null)}
        />
      )}
    </div>
  );
};
