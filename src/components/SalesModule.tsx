import React, { useState } from 'react';
import { Plus, Search, Tag, DollarSign, FileText, Printer, CheckCircle2, ShieldCheck, Scale, Edit2, Trash2 } from 'lucide-react';
import { AppSettings, Car, CarSale, Currency, Language } from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { PrintInvoiceModal } from './PrintInvoiceModal';
import { PrintSaleContractModal } from './PrintSaleContractModal';

interface SalesModuleProps {
  sales: CarSale[];
  cars: Car[];
  settings: AppSettings;
  onRecordSale: (sale: CarSale) => void;
  onUpdateSale?: (sale: CarSale) => void;
  onDeleteSale?: (saleId: string) => void;
  onUpdateCarStatus: (carId: string, status: Car['status']) => void;
  currency: Currency;
  lang: Language;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  sales,
  cars,
  settings,
  onRecordSale,
  onUpdateSale,
  onDeleteSale,
  onUpdateCarStatus,
  currency,
  lang,
}) => {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<CarSale | null>(null);
  const [printInvoiceData, setPrintInvoiceData] = useState<any | null>(null);
  const [printSaleContract, setPrintSaleContract] = useState<CarSale | null>(null);

  // Form state
  const [selectedCarId, setSelectedCarId] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerNationalId, setBuyerNationalId] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  
  const [sellerName, setSellerName] = useState(settings.organizationName || 'شركة أسطول السيارات الذكية');
  const [sellerNationalId, setSellerNationalId] = useState(settings.commercialRegistration || '1010889201');
  const [sellerAddress, setSellerAddress] = useState(settings.address || 'الرياض - المملكة العربية السعودية');

  const [chassisNumber, setChassisNumber] = useState('');
  const [engineNumber, setEngineNumber] = useState('');
  const [carColor, setCarColor] = useState('');

  const [salePrice, setSalePrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'installments' | 'cheque'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [salesAgentName, setSalesAgentName] = useState('سارة العتيبي');
  const [penaltyAmount, setPenaltyAmount] = useState<number>(5000);
  const [jurisdictionCourt, setJurisdictionCourt] = useState(lang === 'ar' ? 'محاكم الرياض' : 'Riyadh Courts');
  const [transferDeadline, setTransferDeadline] = useState('15 يوماً');
  const [contractType, setContractType] = useState<'preliminary' | 'final'>('preliminary');
  const [witness1Name, setWitness1Name] = useState('أحمد بن عبد الرحمن السليم');
  const [witness1NationalId, setWitness1NationalId] = useState('1029384756');
  const [witness2Name, setWitness2Name] = useState('محمود بن خالد الشمري');
  const [witness2NationalId, setWitness2NationalId] = useState('1092837465');
  const [notes, setNotes] = useState('');

  const availableCars = cars.filter((c) => c.status === 'available' || (editingSale && c.id === editingSale.carId));

  const handleOpenCreateModal = () => {
    setEditingSale(null);
    const firstCar = cars.find((c) => c.status === 'available');
    if (firstCar) {
      setSelectedCarId(firstCar.id);
      setSalePrice(firstCar.salePrice || 0);
      setChassisNumber(firstCar.chassisNumber || '');
      setCarColor(firstCar.color || '');
      setEngineNumber(`ENG-${Math.floor(1000000 + Math.random() * 9000000)}`);
      setPenaltyAmount(Math.round((firstCar.salePrice || 50000) * 0.1));
    } else {
      setSelectedCarId('');
      setSalePrice(0);
      setChassisNumber('');
      setCarColor('');
      setEngineNumber('');
      setPenaltyAmount(5000);
    }
    setBuyerName('');
    setBuyerPhone('');
    setBuyerNationalId('');
    setBuyerAddress('');
    setPaymentMethod('cash');
    setPaymentStatus('paid');
    setContractType('preliminary');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sale: CarSale) => {
    setEditingSale(sale);
    setSelectedCarId(sale.carId);
    setBuyerName(sale.buyerName || '');
    setBuyerPhone(sale.buyerPhone || '');
    setBuyerNationalId(sale.buyerNationalId || '');
    setBuyerAddress(sale.buyerAddress || '');
    setSellerName(sale.sellerName || settings.organizationName || 'شركة أسطول السيارات الذكية');
    setSellerNationalId(sale.sellerNationalId || settings.commercialRegistration || '1010889201');
    setSellerAddress(sale.sellerAddress || settings.address || 'الرياض');
    setCarColor(sale.color || '');
    setChassisNumber(sale.chassisNumber || '');
    setEngineNumber(sale.engineNumber || '');
    setSalePrice(sale.salePrice || 0);
    setPaymentMethod(sale.paymentMethod || 'cash');
    setPaymentStatus(sale.paymentStatus || 'paid');
    setSalesAgentName(sale.salesAgentName || 'سارة العتيبي');
    setPenaltyAmount(sale.penaltyAmount ?? 5000);
    setJurisdictionCourt(sale.jurisdictionCourt || 'محاكم الرياض');
    setTransferDeadline(sale.transferDeadline || '15 يوماً');
    setContractType(sale.contractType || 'preliminary');
    setWitness1Name(sale.witness1Name || '');
    setWitness1NationalId(sale.witness1NationalId || '');
    setWitness2Name(sale.witness2Name || '');
    setWitness2NationalId(sale.witness2NationalId || '');
    setNotes(sale.notes || '');
    setIsModalOpen(true);
  };

  const handleDeleteSaleClick = (sale: CarSale) => {
    const confirmMessage = lang === 'ar'
      ? `هل أنت متأكد من رغبتك في حذف عقد بيع السيارة (${sale.carModel}) باسم المشتري (${sale.buyerName})؟`
      : `Are you sure you want to delete sale contract for (${sale.carModel}) to (${sale.buyerName})?`;
    
    if (window.confirm(confirmMessage)) {
      if (onDeleteSale) {
        onDeleteSale(sale.id);
      }
    }
  };

  const handleCarSelect = (carId: string) => {
    setSelectedCarId(carId);
    const foundCar = cars.find((c) => c.id === carId);
    if (foundCar) {
      setSalePrice(foundCar.salePrice);
      setChassisNumber(foundCar.chassisNumber || '');
      setCarColor(foundCar.color || '');
      setEngineNumber(`ENG-${Math.floor(1000000 + Math.random() * 9000000)}`);
      setPenaltyAmount(Math.round(foundCar.salePrice * 0.1) || 5000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarId || !buyerName) return;

    const car = cars.find((c) => c.id === selectedCarId);
    if (!car) return;

    if (editingSale) {
      // Update existing sale
      const updatedSale: CarSale = {
        ...editingSale,
        carId: car.id,
        carModel: `${car.brand} ${car.model} ${car.year}`,
        carPlate: car.plateNumber,
        brand: car.brand,
        model: car.model,
        year: car.year,
        color: carColor || car.color,
        chassisNumber: chassisNumber || car.chassisNumber,
        engineNumber: engineNumber || 'ENG-1029384',
        buyerName,
        buyerPhone,
        buyerNationalId,
        buyerAddress,
        sellerName,
        sellerNationalId,
        sellerAddress,
        salePrice,
        paymentMethod,
        paymentStatus,
        salesAgentName,
        penaltyAmount,
        jurisdictionCourt,
        transferDeadline,
        contractType,
        witness1Name,
        witness1NationalId,
        witness2Name,
        witness2NationalId,
        notes,
      };

      if (onUpdateSale) {
        onUpdateSale(updatedSale);
      }
      setIsModalOpen(false);
      setEditingSale(null);
      return;
    }

    const newInvoiceNumber = `INV-SALE-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newSale: CarSale = {
      id: `sale_${Date.now()}`,
      invoiceNumber: newInvoiceNumber,
      carId: car.id,
      carModel: `${car.brand} ${car.model} ${car.year}`,
      carPlate: car.plateNumber,
      brand: car.brand,
      model: car.model,
      year: car.year,
      color: carColor || car.color,
      chassisNumber: chassisNumber || car.chassisNumber,
      engineNumber: engineNumber || 'ENG-1029384',
      buyerName,
      buyerPhone,
      buyerNationalId,
      buyerAddress,
      sellerName,
      sellerNationalId,
      sellerAddress,
      saleDate: new Date().toISOString().split('T')[0],
      salePrice,
      paymentMethod,
      paymentStatus,
      salesAgentName,
      penaltyAmount,
      jurisdictionCourt,
      transferDeadline,
      contractType,
      witness1Name,
      witness1NationalId,
      witness2Name,
      witness2NationalId,
      notes,
    };

    onRecordSale(newSale);
    // Automatically update car status to 'sold'
    onUpdateCarStatus(car.id, 'sold');

    setIsModalOpen(false);
    setEditingSale(null);
  };

  const filteredSales = sales.filter(
    (s) =>
      s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.carModel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Tag className="w-6 h-6 text-blue-600" />
            <span>{t.salesList}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar' ? 'إدارة بيع السيارات وطباعة الفواتير الضريبية وعقود البيع الرسمية البنود 11' : 'Manage vehicle sales, tax invoices, and 11-clause official sale contracts'}
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t.recordSale}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute top-3.5 rtl:right-3.5 ltr:left-3.5 text-slate-400" />
        <input
          type="text"
          placeholder={t.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rtl:pr-10 ltr:pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Sales Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-extrabold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
                <th className="py-3.5 px-4">{t.buyerName}</th>
                <th className="py-3.5 px-4">{t.selectCar}</th>
                <th className="py-3.5 px-4">{t.saleDate}</th>
                <th className="py-3.5 px-4">{t.salePrice}</th>
                <th className="py-3.5 px-4">{t.paymentMethod}</th>
                <th className="py-3.5 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-800 dark:text-slate-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-black text-blue-600 dark:text-blue-400">
                    {sale.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold block">{sale.buyerName}</span>
                    <span className="text-[10px] text-slate-400">{sale.buyerPhone}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold block">{sale.carModel}</span>
                    <span className="text-[10px] text-slate-400">{sale.carPlate}</span>
                  </td>
                  <td className="py-3.5 px-4">{sale.saleDate}</td>
                  <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(sale.salePrice, currency, lang)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px]">
                      {sale.paymentMethod.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEditModal(sale)}
                        title={lang === 'ar' ? 'تعديل عقد البيع' : 'Edit Sale Contract'}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold text-[11px] rounded-lg transition border border-amber-200 dark:border-amber-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{t.edit}</span>
                      </button>

                      {/* Print Contract Button */}
                      <button
                        onClick={() => setPrintSaleContract(sale)}
                        title={lang === 'ar' ? 'طباعة عقد البيع (11 بنداً)' : 'Print Sale Contract'}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-extrabold text-[11px] rounded-lg transition border border-blue-200 dark:border-blue-800"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'عقد البيع' : 'Contract'}</span>
                      </button>

                      {/* Print Invoice Button */}
                      <button
                        onClick={() =>
                          setPrintInvoiceData({
                            invoiceNumber: sale.invoiceNumber,
                            date: sale.saleDate,
                            type: 'sale',
                            customerName: sale.buyerName,
                            customerPhone: sale.buyerPhone,
                            itemName: `مبيعات سيارة: ${sale.carModel}`,
                            itemDetails: `رقم اللوحة: ${sale.carPlate}`,
                            amount: sale.salePrice,
                            totalAmount: sale.salePrice,
                            paymentMethod: sale.paymentMethod,
                            paymentStatus: sale.paymentStatus,
                            notes: sale.notes,
                          })
                        }
                        title={lang === 'ar' ? 'طباعة الفاتورة' : 'Print Invoice'}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-lg transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'الفاتورة' : 'Invoice'}</span>
                      </button>

                      {/* Delete Button */}
                      {onDeleteSale && (
                        <button
                          onClick={() => handleDeleteSaleClick(sale)}
                          title={lang === 'ar' ? 'حذف عقد البيع' : 'Delete Sale Contract'}
                          className="inline-flex items-center p-1.5 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 text-rose-600 dark:text-rose-300 rounded-lg transition border border-rose-200 dark:border-rose-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record / Edit Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full my-auto max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center flex-none z-10">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                <span>
                  {editingSale
                    ? (lang === 'ar' ? 'تعديل عقد بيع السيارة وفاتورتها' : 'Edit Car Sale Agreement & Invoice')
                    : `${t.recordSale} (مع بنود عقد البيع)`}
                </span>
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingSale(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.selectCar} *
                </label>
                <select
                  value={selectedCarId}
                  onChange={(e) => handleCarSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                  {availableCars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {c.model} ({c.plateNumber}) - {c.salePrice} {currency}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seller Information (Clause 1) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>1. {lang === 'ar' ? 'بيانات البائع (الطرف الأول)' : 'Seller Details (First Party)'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'ar' ? 'اسم البائع' : 'Seller Name'}
                    </label>
                    <input
                      type="text"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'ar' ? 'السجل / الهوية' : 'CR / National ID'}
                    </label>
                    <input
                      type="text"
                      value={sellerNationalId}
                      onChange={(e) => setSellerNationalId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'ar' ? 'عنوان البائع' : 'Seller Address'}
                    </label>
                    <input
                      type="text"
                      value={sellerAddress}
                      onChange={(e) => setSellerAddress(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Buyer Information (Clause 2) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>2. {lang === 'ar' ? 'بيانات المشتري (الطرف الثاني)' : 'Buyer Details (Second Party)'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.buyerName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.buyerPhone} *
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.buyerNationalId}
                    </label>
                    <input
                      type="text"
                      value={buyerNationalId}
                      onChange={(e) => setBuyerNationalId(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'عنوان المشتري' : 'Buyer Address'}
                    </label>
                    <input
                      type="text"
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: الرياض - حي الملز' : 'Address'}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Identifiers (Clause 3) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'رقم الشاسيه' : 'Chassis No'}
                  </label>
                  <input
                    type="text"
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'رقم الموتور / المحرك' : 'Engine No'}
                  </label>
                  <input
                    type="text"
                    value={engineNumber}
                    onChange={(e) => setEngineNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'اللون' : 'Color'}
                  </label>
                  <input
                    type="text"
                    value={carColor}
                    onChange={(e) => setCarColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Sale Price & Payment Method (Clause 5 & 6) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.salePrice} ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.paymentMethod}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="cash">{t.cash}</option>
                    <option value="bank_transfer">{t.bankTransfer}</option>
                    <option value="cheque">{lang === 'ar' ? 'شيك' : 'Cheque'}</option>
                    <option value="installments">{t.installments}</option>
                  </select>
                </div>
              </div>

              {/* Penalty Clause & Jurisdiction & Transfer Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'نوع العقد' : 'Contract Type'}
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="preliminary">{lang === 'ar' ? 'عقد ابتدائي مع الشهود' : 'Preliminary with Witnesses'}</option>
                    <option value="final">{lang === 'ar' ? 'عقد بيع نهائي (11 بنداً)' : 'Final Contract (11 Clauses)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'مدة نقل الملكية بالمرور' : 'Transfer Deadline'}
                  </label>
                  <input
                    type="text"
                    value={transferDeadline}
                    onChange={(e) => setTransferDeadline(e.target.value)}
                    placeholder="15 يوماً"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'الشرط الجزائي' : 'Penalty Amount'}
                  </label>
                  <input
                    type="number"
                    value={penaltyAmount}
                    onChange={(e) => setPenaltyAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Witnesses Section (الشهود) */}
              <div className="p-3 bg-blue-50/60 dark:bg-slate-800/60 rounded-xl border border-blue-200 dark:border-slate-700 space-y-3">
                <h4 className="font-extrabold text-xs text-blue-900 dark:text-blue-300 flex items-center justify-between">
                  <span>{lang === 'ar' ? 'بيانات الشهود (توثيق قانوني):' : 'Witnesses Information:'}</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">{lang === 'ar' ? 'مطلوبة للعقد الابتدائي' : 'For Preliminary Contract'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Witness 1 */}
                  <div className="space-y-1.5 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block">{lang === 'ar' ? 'الشاهد الأول:' : 'First Witness:'}</span>
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'اسم الشاهد الأول' : 'Witness 1 Name'}
                      value={witness1Name}
                      onChange={(e) => setWitness1Name(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'الرقم القومي للشاهد الأول' : 'Witness 1 National ID'}
                      value={witness1NationalId}
                      onChange={(e) => setWitness1NationalId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>

                  {/* Witness 2 */}
                  <div className="space-y-1.5 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block">{lang === 'ar' ? 'الشاهد الثاني:' : 'Second Witness:'}</span>
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'اسم الشاهد الثاني' : 'Witness 2 Name'}
                      value={witness2Name}
                      onChange={(e) => setWitness2Name(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'الرقم القومي للشاهد الثاني' : 'Witness 2 National ID'}
                      value={witness2NationalId}
                      onChange={(e) => setWitness2NationalId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'المحاكم المختصة' : 'Jurisdiction Court'}
                  </label>
                  <input
                    type="text"
                    value={jurisdictionCourt}
                    onChange={(e) => setJurisdictionCourt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.salesAgent}
                  </label>
                  <input
                    type="text"
                    value={salesAgentName}
                    onChange={(e) => setSalesAgentName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 flex-none">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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

      {/* Print Invoice Modal */}
      <PrintInvoiceModal
        isOpen={!!printInvoiceData}
        onClose={() => setPrintInvoiceData(null)}
        invoiceData={printInvoiceData}
        settings={settings}
        lang={lang}
      />

      {/* Print Sale Contract Modal */}
      <PrintSaleContractModal
        isOpen={!!printSaleContract}
        onClose={() => setPrintSaleContract(null)}
        sale={printSaleContract}
        settings={settings}
        currency={currency}
        lang={lang}
      />
    </div>
  );
};

