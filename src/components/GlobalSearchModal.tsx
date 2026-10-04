import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  FileText,
  Car,
  User,
  Building2,
  Truck,
  DollarSign,
  Briefcase,
  Wrench,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  Car as CarType,
  Customer,
  RentalContract,
  CorporateContract,
  DailyShiftLog,
  DeliveryService,
  Invoice,
  CarSale,
  Driver,
  MaintenanceRecord,
  CarBooking,
  Currency,
  Language,
} from '../types';
import { formatCurrency } from '../translations/i18n';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  cars: CarType[];
  contracts: RentalContract[];
  corporateContracts: CorporateContract[];
  shiftLogs: DailyShiftLog[];
  deliveries: DeliveryService[];
  invoices: Invoice[];
  sales: CarSale[];
  drivers: Driver[];
  maintenanceRecords?: MaintenanceRecord[];
  bookings?: CarBooking[];
  onNavigate: (module: string, itemId?: string) => void;
  currency: Currency;
  lang: Language;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  customers,
  cars,
  contracts,
  corporateContracts,
  shiftLogs,
  deliveries,
  invoices,
  sales,
  drivers,
  maintenanceRecords = [],
  bookings = [],
  onNavigate,
  currency,
  lang,
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setCategoryFilter('all');
    }
  }, [isOpen]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return null;

    // Search Customers
    const matchedCustomers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.nationalId && c.nationalId.includes(q)) ||
        (c.licenseNumber && c.licenseNumber.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    ).slice(0, 8);

    // Search Cars
    const matchedCars = cars.filter(
      (c) =>
        c.plateNumber.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        (c.chassisNumber && c.chassisNumber.toLowerCase().includes(q)) ||
        (c.motorNumber && c.motorNumber.toLowerCase().includes(q)) ||
        (c.ownerName && c.ownerName.toLowerCase().includes(q)) ||
        (c.color && c.color.toLowerCase().includes(q))
    ).slice(0, 8);

    // Search Rental Contracts
    const matchedContracts = contracts.filter(
      (c) =>
        c.contractNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.carPlate.toLowerCase().includes(q) ||
        c.carModel.toLowerCase().includes(q) ||
        (c.customerPhone && c.customerPhone.includes(q)) ||
        (c.lessorName && c.lessorName.toLowerCase().includes(q))
    ).slice(0, 8);

    // Search Corporate Contracts
    const matchedCorporateContracts = corporateContracts.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.contractNumber.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.companyPhone.includes(q) ||
        (c.companyCR && c.companyCR.includes(q)) ||
        (c.companyTaxId && c.companyTaxId.includes(q))
    ).slice(0, 6);

    // Search Shift Logs
    const matchedShiftLogs = shiftLogs.filter(
      (s) =>
        s.companyName.toLowerCase().includes(q) ||
        s.driverName.toLowerCase().includes(q) ||
        s.carPlate.toLowerCase().includes(q) ||
        (s.shiftName && s.shiftName.toLowerCase().includes(q)) ||
        (s.fromLocation && s.fromLocation.toLowerCase().includes(q)) ||
        (s.toLocation && s.toLocation.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q))
    ).slice(0, 6);

    // Search Deliveries / Rides
    const matchedDeliveries = deliveries.filter(
      (d) =>
        d.customerName.toLowerCase().includes(q) ||
        d.customerPhone.includes(q) ||
        (d.pickupAddress && d.pickupAddress.toLowerCase().includes(q)) ||
        (d.dropoffAddress && d.dropoffAddress.toLowerCase().includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q))
    ).slice(0, 6);

    // Search Invoices
    const matchedInvoices = invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        (inv.clientPhone && inv.clientPhone.includes(q)) ||
        (inv.notes && inv.notes.toLowerCase().includes(q))
    ).slice(0, 6);

    // Search Drivers & Employees
    const matchedDrivers = drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        (d.nationalId && d.nationalId.includes(q)) ||
        (d.licenseNumber && d.licenseNumber.toLowerCase().includes(q))
    ).slice(0, 6);

    // Search Sales
    const matchedSales = sales.filter(
      (s) =>
        s.buyerName.toLowerCase().includes(q) ||
        s.buyerPhone.includes(q) ||
        s.carModel.toLowerCase().includes(q) ||
        s.carPlate.toLowerCase().includes(q) ||
        (s.chassisNumber && s.chassisNumber.toLowerCase().includes(q))
    ).slice(0, 6);

    // Search Maintenance
    const matchedMaintenance = maintenanceRecords.filter(
      (m) =>
        m.carPlate.toLowerCase().includes(q) ||
        m.vendor.toLowerCase().includes(q) ||
        (m.notes && m.notes.toLowerCase().includes(q))
    ).slice(0, 6);

    // Search Bookings
    const matchedBookings = bookings.filter(
      (b) =>
        b.bookingNumber.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.carModel.toLowerCase().includes(q)
    ).slice(0, 6);

    const totalCount =
      matchedCustomers.length +
      matchedCars.length +
      matchedContracts.length +
      matchedCorporateContracts.length +
      matchedShiftLogs.length +
      matchedDeliveries.length +
      matchedInvoices.length +
      matchedDrivers.length +
      matchedSales.length +
      matchedMaintenance.length +
      matchedBookings.length;

    return {
      totalCount,
      customers: matchedCustomers,
      cars: matchedCars,
      contracts: matchedContracts,
      corporateContracts: matchedCorporateContracts,
      shiftLogs: matchedShiftLogs,
      deliveries: matchedDeliveries,
      invoices: matchedInvoices,
      drivers: matchedDrivers,
      sales: matchedSales,
      maintenance: matchedMaintenance,
      bookings: matchedBookings,
    };
  }, [
    q,
    customers,
    cars,
    contracts,
    corporateContracts,
    shiftLogs,
    deliveries,
    invoices,
    drivers,
    sales,
    maintenanceRecords,
    bookings,
  ]);

  if (!isOpen) return null;

  const handleSelect = (moduleName: string, itemId?: string) => {
    onNavigate(moduleName, itemId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transition-all flex flex-col max-h-[85vh]"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Top Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3">
          <Search className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'ابحث في البرنامج بالكامل (عميل، سيارة، لوحة، رقم عقد، شركة، وردية، سائق، فاتورة)...'
                : 'Search anything across the system (Customer, Plate, Car, Contract, Company, Shift, Invoice)...'
            }
            className="w-full bg-transparent border-none text-base sm:text-lg font-bold text-slate-900 dark:text-white focus:outline-none placeholder-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 transition"
          >
            ESC
          </button>
        </div>

        {/* Quick Category Filters */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto text-xs font-bold shrink-0">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {lang === 'ar' ? 'الكل' : 'All'}
          </button>
          <button
            onClick={() => setCategoryFilter('contracts')}
            className={`px-3 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              categoryFilter === 'contracts'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'العقود' : 'Contracts'}</span>
          </button>
          <button
            onClick={() => setCategoryFilter('customers')}
            className={`px-3 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              categoryFilter === 'customers'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'العملاء' : 'Customers'}</span>
          </button>
          <button
            onClick={() => setCategoryFilter('cars')}
            className={`px-3 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              categoryFilter === 'cars'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'السيارات' : 'Cars'}</span>
          </button>
          <button
            onClick={() => setCategoryFilter('corporate')}
            className={`px-3 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              categoryFilter === 'corporate'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الشركات والورديات' : 'Corporate & Shifts'}</span>
          </button>
          <button
            onClick={() => setCategoryFilter('deliveries')}
            className={`px-3 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              categoryFilter === 'deliveries'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'التوصيل والنقل' : 'Deliveries'}</span>
          </button>
          <button
            onClick={() => setCategoryFilter('invoices')}
            className={`px-3 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              categoryFilter === 'invoices'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الفواتير' : 'Invoices'}</span>
          </button>
          <button
            onClick={() => setCategoryFilter('drivers')}
            className={`px-3 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
              categoryFilter === 'drivers'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'السائقين والموظفين' : 'Staff'}</span>
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 divide-y divide-slate-100 dark:divide-slate-800/80">
          {!q ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
                {lang === 'ar' ? 'البحث الفوري الشامل في النظام' : 'Instant System-Wide Search'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {lang === 'ar'
                  ? 'اكتب اسم العميل، رقم الهاتف، رقم الهوية، لوحة السيارة، الشاسيه، رقم العقد، اسم الشركة أو السائق للانتقال الفوري'
                  : 'Type a name, phone, national ID, car plate, chassis VIN, contract number, or company name.'}
              </p>
            </div>
          ) : results && results.totalCount === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-lg">
                🔍
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                {lang === 'ar' ? `لم يتم العثور على نتائج مطابقة لـ "${query}"` : `No results matching "${query}"`}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'ar' ? 'تأكد من كتابة الكلمات بصورة صحيحة أو جرب البحث بجزء من الاسم أو الرقم' : 'Check your spelling or search by partial keyword.'}
              </p>
            </div>
          ) : results ? (
            <div className="space-y-5">
              {/* 1. Rental Contracts Results */}
              {(categoryFilter === 'all' || categoryFilter === 'contracts') && results.contracts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-blue-600 dark:text-blue-400 uppercase">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'عقود الإيجار' : 'Rental Contracts'} ({results.contracts.length})</span>
                    </span>
                    <button
                      onClick={() => handleSelect('contracts')}
                      className="text-[11px] text-slate-400 hover:text-blue-500 font-bold"
                    >
                      {lang === 'ar' ? 'عرض كل العقود ➔' : 'View all ➔'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.contracts.map((cnt) => (
                      <div
                        key={cnt.id}
                        onClick={() => handleSelect('contracts', cnt.id)}
                        className="p-3 bg-slate-50 hover:bg-blue-50/60 dark:bg-slate-800/60 dark:hover:bg-blue-950/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400">{cnt.contractNumber}</span>
                            <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold ${
                              cnt.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {cnt.status === 'active' ? (lang === 'ar' ? 'ساري' : 'Active') : cnt.status}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white mt-1">{cnt.customerName}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            🚗 {cnt.carModel} • <strong className="text-slate-800 dark:text-slate-200">{cnt.carPlate}</strong>
                          </p>
                        </div>
                        <div className="text-right rtl:text-left font-mono">
                          <span className="font-black text-xs text-slate-900 dark:text-white block">
                            {formatCurrency(cnt.totalAmount, currency, lang)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{cnt.startDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Customers Results */}
              {(categoryFilter === 'all' || categoryFilter === 'customers') && results.customers.length > 0 && (
                <div className="space-y-2 pt-3">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'العملاء' : 'Customers'} ({results.customers.length})</span>
                    </span>
                    <button
                      onClick={() => handleSelect('customers')}
                      className="text-[11px] text-slate-400 hover:text-emerald-500 font-bold"
                    >
                      {lang === 'ar' ? 'عرض كل العملاء ➔' : 'View all ➔'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.customers.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => handleSelect('customers', cust.id)}
                        className="p-3 bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-800/60 dark:hover:bg-emerald-950/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          {cust.photoUrl ? (
                            <img src={cust.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-emerald-500" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                              {cust.name.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-xs text-slate-900 dark:text-white">{cust.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{cust.phone}</p>
                            {cust.nationalId && (
                              <p className="text-[10px] text-slate-400 font-mono">هوية: {cust.nationalId}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                          {cust.nationality || (lang === 'ar' ? 'مواطن' : 'National')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Cars Results */}
              {(categoryFilter === 'all' || categoryFilter === 'cars') && results.cars.length > 0 && (
                <div className="space-y-2 pt-3">
                  <div className="flex items-center justify-between text-xs font-black text-purple-600 dark:text-purple-400 uppercase">
                    <span className="flex items-center gap-1.5">
                      <Car className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'السيارات والأسطول' : 'Vehicles'} ({results.cars.length})</span>
                    </span>
                    <button
                      onClick={() => handleSelect('cars')}
                      className="text-[11px] text-slate-400 hover:text-purple-500 font-bold"
                    >
                      {lang === 'ar' ? 'عرض كل السيارات ➔' : 'View all ➔'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.cars.map((car) => (
                      <div
                        key={car.id}
                        onClick={() => handleSelect('cars', car.id)}
                        className="p-3 bg-slate-50 hover:bg-purple-50/60 dark:bg-slate-800/60 dark:hover:bg-purple-950/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {car.brand} {car.model}
                            </span>
                            <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold ${
                              car.status === 'available'
                                ? 'bg-emerald-100 text-emerald-800'
                                : car.status === 'rented'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {car.status}
                            </span>
                          </div>
                          <p className="text-xs font-mono font-black text-blue-600 dark:text-blue-400 mt-1">
                            لوحة: {car.plateNumber} {car.color ? `• ${car.color}` : ''}
                          </p>
                          {car.chassisNumber && (
                            <p className="text-[10px] text-slate-400 font-mono">شاسيه: {car.chassisNumber}</p>
                          )}
                        </div>
                        <div className="text-right rtl:text-left font-mono">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {formatCurrency(car.dailyRate, currency, lang)}/يوم
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Corporate Contracts & Shifts */}
              {(categoryFilter === 'all' || categoryFilter === 'corporate') &&
                (results.corporateContracts.length > 0 || results.shiftLogs.length > 0) && (
                  <div className="space-y-2 pt-3">
                    <div className="flex items-center justify-between text-xs font-black text-amber-600 dark:text-amber-400 uppercase">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        <span>
                          {lang === 'ar' ? 'عقود الشركات والورديات' : 'Corporate Contracts & Shifts'} (
                          {results.corporateContracts.length + results.shiftLogs.length})
                        </span>
                      </span>
                      <button
                        onClick={() => handleSelect('corporate')}
                        className="text-[11px] text-slate-400 hover:text-amber-500 font-bold"
                      >
                        {lang === 'ar' ? 'عرض الشركات والورديات ➔' : 'View all ➔'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {results.corporateContracts.map((corp) => (
                        <div
                          key={corp.id}
                          onClick={() => handleSelect('corporate', corp.id)}
                          className="p-3 bg-slate-50 hover:bg-amber-50/60 dark:bg-slate-800/60 dark:hover:bg-amber-950/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono text-[10px] font-extrabold text-blue-600">{corp.contractNumber}</span>
                            <p className="font-extrabold text-xs text-slate-900 dark:text-white mt-0.5">{corp.companyName}</p>
                            <p className="text-[11px] text-slate-500">مسؤول: {corp.contactPerson} • {corp.companyPhone}</p>
                          </div>
                          <span className="font-mono font-bold text-xs text-emerald-600">
                            {formatCurrency(corp.monthlyPrice, currency, lang)}/شهر
                          </span>
                        </div>
                      ))}

                      {results.shiftLogs.map((shift) => (
                        <div
                          key={shift.id}
                          onClick={() => handleSelect('corporate', shift.id)}
                          className="p-3 bg-slate-50 hover:bg-amber-50/60 dark:bg-slate-800/60 dark:hover:bg-amber-950/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-slate-400">{shift.shiftDate}</span>
                              <span className="text-[10.5px] font-black text-amber-700 dark:text-amber-300">{shift.shiftName || 'وردية'}</span>
                            </div>
                            <p className="font-extrabold text-xs text-slate-900 dark:text-white mt-0.5">{shift.companyName}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              🚗 {shift.driverName} • {shift.carPlate}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                              {shift.fromLocation} ➜ {shift.toLocation}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* 5. Deliveries / Rides Results */}
              {(categoryFilter === 'all' || categoryFilter === 'deliveries') && results.deliveries.length > 0 && (
                <div className="space-y-2 pt-3">
                  <div className="flex items-center justify-between text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'رحلات التوصيل والنقل' : 'Deliveries & Rides'} ({results.deliveries.length})</span>
                    </span>
                    <button
                      onClick={() => handleSelect('deliveries')}
                      className="text-[11px] text-slate-400 hover:text-indigo-500 font-bold"
                    >
                      {lang === 'ar' ? 'عرض كل الرحلات ➔' : 'View all ➔'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.deliveries.map((del) => (
                      <div
                        key={del.id}
                        onClick={() => handleSelect('deliveries', del.id)}
                        className="p-3 bg-slate-50 hover:bg-indigo-50/60 dark:bg-slate-800/60 dark:hover:bg-indigo-950/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <p className="font-extrabold text-xs text-slate-900 dark:text-white">{del.customerName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{del.scheduledDate} {del.scheduledTime}</p>
                          <p className="text-[10px] text-slate-400">
                            {del.pickupAddress} ➜ {del.dropoffAddress}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                          {formatCurrency(del.price, currency, lang)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Invoices Results */}
              {(categoryFilter === 'all' || categoryFilter === 'invoices') && results.invoices.length > 0 && (
                <div className="space-y-2 pt-3">
                  <div className="flex items-center justify-between text-xs font-black text-rose-600 dark:text-rose-400 uppercase">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'الفواتير وسندات القبض' : 'Invoices'} ({results.invoices.length})</span>
                    </span>
                    <button
                      onClick={() => handleSelect('invoices')}
                      className="text-[11px] text-slate-400 hover:text-rose-500 font-bold"
                    >
                      {lang === 'ar' ? 'عرض كل الفواتير ➔' : 'View all ➔'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.invoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => handleSelect('invoices', inv.id)}
                        className="p-3 bg-slate-50 hover:bg-rose-50/60 dark:bg-slate-800/60 dark:hover:bg-rose-950/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono font-black text-xs text-blue-600">{inv.invoiceNumber}</span>
                          <p className="font-extrabold text-xs text-slate-900 dark:text-white mt-0.5">{inv.clientName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{inv.issueDate}</p>
                        </div>
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                          {formatCurrency(inv.totalAmount, currency, lang)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Drivers & Employees Results */}
              {(categoryFilter === 'all' || categoryFilter === 'drivers') && results.drivers.length > 0 && (
                <div className="space-y-2 pt-3">
                  <div className="flex items-center justify-between text-xs font-black text-teal-600 dark:text-teal-400 uppercase">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'السائقين والموظفين' : 'Staff'} ({results.drivers.length})</span>
                    </span>
                    <button
                      onClick={() => handleSelect('employees')}
                      className="text-[11px] text-slate-400 hover:text-teal-500 font-bold"
                    >
                      {lang === 'ar' ? 'عرض كل الموظفين ➔' : 'View all ➔'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.drivers.map((drv) => (
                      <div
                        key={drv.id}
                        onClick={() => handleSelect('employees', drv.id)}
                        className="p-3 bg-slate-50 hover:bg-teal-50/60 dark:bg-slate-800/60 dark:hover:bg-teal-950/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <p className="font-extrabold text-xs text-slate-900 dark:text-white">{drv.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{drv.phone}</p>
                          <p className="text-[10px] text-slate-400">رخصة: {drv.licenseNumber}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                          {drv.role || 'سائق'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500">
          <span>{lang === 'ar' ? 'نظام البحث السريع الشامل لجميع الأقسام' : 'Unified Quick Search Engine'}</span>
          <span className="font-mono text-[11px]">
            {lang === 'ar' ? 'اضغط ESC للإغلاق' : 'Press ESC to close'}
          </span>
        </div>
      </div>
    </div>
  );
};
