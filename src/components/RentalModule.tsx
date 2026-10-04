import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, FileText, Printer, CheckCircle2, Check, Car, User, Calendar, ShieldCheck, Camera, RotateCcw, Clock, AlertTriangle, DollarSign, ArrowUpRight, AlertCircle, Fingerprint, FileCheck, Edit2, Trash2, Ban, ShieldAlert, Crown } from 'lucide-react';
import { AppSettings, Car as CarType, Customer, Driver, RentalContract, Currency, Language, VehicleHandoverReceipt } from '../types';
import { translations, formatCurrency } from '../translations/i18n';
import { SignaturePad } from './SignaturePad';
import { PrintContractModal } from './PrintContractModal';
import { CameraCaptureModal } from './CameraCaptureModal';
import { FingerprintCaptureModal } from './FingerprintCaptureModal';
import { VehicleHandoverModal } from './VehicleHandoverModal';

export const getContractExpiryInfo = (contract: RentalContract) => {
  if (contract.status !== 'active') {
    return { isExpired: false, isExpiringToday: false, isExpiringSoon: false, daysDiff: 0 };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = contract.endDate.split('-').map(Number);
  const endDateObj = new Date(year, month - 1, day);
  endDateObj.setHours(0, 0, 0, 0);

  const diffTime = endDateObj.getTime() - today.getTime();
  const daysDiff = Math.round(diffTime / (1000 * 3600 * 24));

  return {
    isExpired: daysDiff < 0,
    isExpiringToday: daysDiff === 0,
    isExpiringSoon: daysDiff > 0 && daysDiff <= 2,
    daysDiff,
  };
};

interface RentalModuleProps {
  contracts: RentalContract[];
  customers: Customer[];
  cars: CarType[];
  drivers: Driver[];
  settings: AppSettings;
  onAddContract: (contract: RentalContract) => void;
  onUpdateContract: (contract: RentalContract) => void;
  onDeleteContract?: (contractId: string) => void;
  onUpdateCarStatus: (carId: string, status: CarType['status'], newMileage?: number) => void;
  handoverReceipts?: VehicleHandoverReceipt[];
  onSaveHandoverReceipt?: (receipt: VehicleHandoverReceipt) => void;
  currency: Currency;
  lang: Language;
  selectedContractId?: string;
  onClearTarget?: () => void;
}

export const RentalModule: React.FC<RentalModuleProps> = ({
  contracts,
  customers,
  cars,
  drivers,
  settings,
  onAddContract,
  onUpdateContract,
  onDeleteContract,
  onUpdateCarStatus,
  handoverReceipts = [],
  onSaveHandoverReceipt,
  currency,
  lang,
  selectedContractId,
  onClearTarget,
}) => {
  const t = translations[lang];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<RentalContract | null>(null);

  // Vehicle Handover Modal & Tab State
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isHandoverBlank, setIsHandoverBlank] = useState(false);
  const [selectedHandoverReceipt, setSelectedHandoverReceipt] = useState<VehicleHandoverReceipt | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'contracts' | 'handovers'>('contracts');

  // Print Modal state
  const [printContract, setPrintContract] = useState<RentalContract | null>(null);
  const [isBlankContractModalOpen, setIsBlankContractModalOpen] = useState(false);

  useEffect(() => {
    if (selectedContractId) {
      const found = contracts.find((c) => c.id === selectedContractId);
      if (found) {
        setSearchTerm(found.contractNumber);
        setStatusFilter('all');
        setActiveSubTab('contracts');
        setPrintContract(found);
      }
    }
  }, [selectedContractId, contracts]);

  // Return Car Modal State
  const [returnContract, setReturnContract] = useState<RentalContract | null>(null);
  const [returnMileage, setReturnMileage] = useState<number>(0);
  const [returnAdditionalPaid, setReturnAdditionalPaid] = useState<number>(0);

  // Create Contract Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000 * (settings.defaultRentalPeriodDays || 1)).toISOString().split('T')[0]
  );
  const [rentalDurationType, setRentalDurationType] = useState<'days' | 'hours'>('days');
  const [totalHours, setTotalHours] = useState<number>(4);
  const [hourlyRate, setHourlyRate] = useState<number>(() => Math.round((settings.defaultRentalPrice || 250) / 10));
  const [dailyRate, setDailyRate] = useState<number>(() => settings.defaultRentalPrice || 200);
  const [deposit, setDeposit] = useState<number>(0);
  const [dailyMileageLimit, setDailyMileageLimit] = useState<number>(() => settings.dailyMileageLimit ?? 300);
  const [excessMileageRate, setExcessMileageRate] = useState<number>(() => settings.excessMileageCharge ?? 1.50);
  const [startMileageInput, setStartMileageInput] = useState<number>(28000);
  const [paidAmountInput, setPaidAmountInput] = useState<number>(600);
  const [startTime, setStartTime] = useState('10:00 ص');
  const [endTime, setEndTime] = useState('10:00 ص');
  const [hourlyDelayFee, setHourlyDelayFee] = useState<number>(() => settings.hourlyDelayFee ?? 50);
  const [carValueSecurity, setCarValueSecurity] = useState<number>(150000);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'bank_transfer'>('credit_card');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'pending'>('paid');
  const [customerPhotoUrl, setCustomerPhotoUrl] = useState('');
  const [customerSignature, setCustomerSignature] = useState('');
  const [agentSignature, setAgentSignature] = useState('');
  const [customerFingerprint, setCustomerFingerprint] = useState('');
  const [notes, setNotes] = useState('');

  // Sync settings when settings prop updates and no active contract is being edited
  useEffect(() => {
    if (!editingContract && !isWizardOpen) {
      setDailyMileageLimit(settings.dailyMileageLimit ?? 300);
      setExcessMileageRate(settings.excessMileageCharge ?? 1.5);
      setHourlyDelayFee(settings.hourlyDelayFee ?? 50);
      if (settings.defaultRentalPrice) {
        setHourlyRate(Math.round(settings.defaultRentalPrice / 10));
      }
    }
  }, [settings, editingContract, isWizardOpen]);

  // Camera Modal & Fingerprint Modal in Contract Wizard
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isFingerprintOpen, setIsFingerprintOpen] = useState(false);

  // Search queries inside Contract Wizard for Customer & Car
  const [wizardCustomerSearch, setWizardCustomerSearch] = useState('');
  const [wizardCarSearch, setWizardCarSearch] = useState('');

  // Auto-fill car details when car selected
  const handleCarChange = (cId: string) => {
    setSelectedCarId(cId);
    const foundCar = cars.find((c) => c.id === cId);
    if (foundCar) {
      setDailyRate(foundCar.dailyRate || settings.defaultRentalPrice || 200);
      setHourlyRate(Math.round((foundCar.dailyRate || settings.defaultRentalPrice || 200) / 10));
      setStartMileageInput(foundCar.currentMileage);
      if (foundCar.salePrice) {
        setCarValueSecurity(foundCar.salePrice);
      }
    }
  };

  // Auto-fill customer details when customer selected
  const handleCustomerChange = (cId: string) => {
    setSelectedCustomerId(cId);
    const foundCust = customers.find((c) => c.id === cId);
    if (foundCust) {
      setCustomerPhotoUrl(foundCust.photoUrl || '');
    }
  };

  // Calculate days, hours & total
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const diffDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
  
  const totalAmount = rentalDurationType === 'hours'
    ? Math.max(0, Number(totalHours || 1) * Number(hourlyRate || 0))
    : Math.max(0, diffDays * Number(dailyRate || 0));

  const allowedTotalMileage = rentalDurationType === 'hours'
    ? Math.max(50, Math.ceil(((totalHours || 1) / 24) * (dailyMileageLimit || 300)))
    : diffDays * (dailyMileageLimit || 300);

  // Auto-sync paidAmountInput when wizard opens or totalAmount changes if paymentStatus is paid
  useEffect(() => {
    if (paymentStatus === 'paid') {
      setPaidAmountInput(totalAmount);
    } else if (paymentStatus === 'pending') {
      setPaidAmountInput(0);
    }
  }, [totalAmount, paymentStatus]);

  const handleOpenCreateModal = () => {
    setEditingContract(null);
    setWizardCustomerSearch('');
    setWizardCarSearch('');
    const firstCar = cars.find((c) => c.status === 'available') || cars[0];
    setSelectedCustomerId(customers[0]?.id || '');
    setSelectedCarId(firstCar?.id || '');
    const initialDailyRate = firstCar?.dailyRate || settings.defaultRentalPrice || 250;
    if (firstCar) {
      setDailyRate(initialDailyRate);
      setHourlyRate(Math.round(initialDailyRate / 10));
      setStartMileageInput(firstCar.currentMileage);
      if (firstCar.salePrice) setCarValueSecurity(firstCar.salePrice);
    } else {
      setDailyRate(settings.defaultRentalPrice || 250);
      setHourlyRate(Math.round((settings.defaultRentalPrice || 250) / 10));
    }
    setSelectedDriverId('');
    setStartDate(new Date().toISOString().split('T')[0]);
    const defaultDays = settings.defaultRentalPeriodDays || 1;
    setEndDate(new Date(Date.now() + 86400000 * defaultDays).toISOString().split('T')[0]);
    setRentalDurationType('days');
    setTotalHours(4);
    setDeposit(0);
    setDailyMileageLimit(settings.dailyMileageLimit ?? 300);
    setExcessMileageRate(settings.excessMileageCharge ?? 1.50);
    setStartTime('10:00 ص');
    setEndTime('10:00 ص');
    setHourlyDelayFee(settings.hourlyDelayFee ?? 50);
    setPaymentMethod('credit_card');
    setPaymentStatus('paid');
    setPaidAmountInput(defaultDays * initialDailyRate);
    setCustomerPhotoUrl('');
    setCustomerSignature('');
    setAgentSignature('');
    setCustomerFingerprint('');
    setNotes('');
    setIsWizardOpen(true);
  };

  const handleOpenEditModal = (cnt: RentalContract) => {
    setEditingContract(cnt);
    setSelectedCustomerId(cnt.customerId);
    setSelectedCarId(cnt.carId);
    setSelectedDriverId(cnt.driverId || '');
    setStartDate(cnt.startDate);
    setEndDate(cnt.endDate);
    setRentalDurationType(cnt.rentalDurationType || (cnt.totalHours ? 'hours' : 'days'));
    setTotalHours(cnt.totalHours || 4);
    setHourlyRate(cnt.hourlyRate || Math.round((cnt.dailyRate || settings.defaultRentalPrice || 250) / 10));
    setDailyRate(cnt.dailyRate || settings.defaultRentalPrice || 200);
    setDeposit(cnt.deposit ?? 0);
    setDailyMileageLimit(cnt.dailyMileageLimit ?? settings.dailyMileageLimit ?? 300);
    setExcessMileageRate(cnt.excessMileageRate ?? settings.excessMileageCharge ?? 1.5);
    setStartMileageInput(cnt.startMileage);
    setPaidAmountInput(cnt.paidAmount ?? (cnt.paymentStatus === 'paid' ? cnt.totalAmount : 0));
    setStartTime(cnt.startTime || '10:00 ص');
    setEndTime(cnt.endTime || cnt.startTime || '10:00 ص');
    setHourlyDelayFee(cnt.hourlyDelayFee ?? settings.hourlyDelayFee ?? 50);
    setCarValueSecurity(cnt.carValueSecurity || 150000);
    setPaymentMethod(cnt.paymentMethod || 'credit_card');
    setPaymentStatus(cnt.paymentStatus || 'paid');
    setCustomerPhotoUrl(cnt.customerPhotoUrl || '');
    setCustomerSignature(cnt.customerSignature || '');
    setAgentSignature(cnt.agentSignature || '');
    setCustomerFingerprint(cnt.customerFingerprint || '');
    setNotes(cnt.notes || '');
    setIsWizardOpen(true);
  };

  const handleDeleteContractClick = (cnt: RentalContract) => {
    const confirmMsg = lang === 'ar'
      ? `هل أنت متأكد من حذف عقد الإيجار (${cnt.contractNumber}) للعميل (${cnt.customerName})؟`
      : `Are you sure you want to delete contract (${cnt.contractNumber})?`;
    if (window.confirm(confirmMsg)) {
      if (onDeleteContract) {
        onDeleteContract(cnt.id);
      }
    }
  };

  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedCarId) return;

    const cust = customers.find((c) => c.id === selectedCustomerId);
    const car = cars.find((c) => c.id === selectedCarId);
    const drv = drivers.find((d) => d.id === selectedDriverId);

    if (!cust || !car) return;

    const calculatedPaid = paymentStatus === 'paid' ? totalAmount : paymentStatus === 'pending' ? 0 : Math.min(totalAmount, Math.max(0, paidAmountInput));
    const calculatedRemaining = Math.max(0, totalAmount - calculatedPaid);
    const finalPaymentStatus = calculatedRemaining === 0 ? 'paid' : calculatedPaid > 0 ? 'partial' : 'pending';

    if (editingContract) {
      const updatedContract: RentalContract = {
        ...editingContract,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        customerNationalId: cust.nationalId,
        customerLicenseNumber: cust.licenseNumber,
        customerLicenseExpiryDate: cust.licenseExpiryDate,
        customerNationality: cust.nationality,
        customerAddress: cust.address,
        customerEmail: cust.email,
        customerPhotoUrl: customerPhotoUrl || cust.photoUrl,
        customerDocPhotoUrl: cust.docPhotoUrl,
        customerNotes: cust.notes,
        customerServiceType: cust.serviceType,
        carId: car.id,
        carModel: `${car.brand} ${car.model} ${car.year}`,
        carPlate: car.plateNumber,
        carBrand: car.brand,
        carModelName: car.model,
        carYear: car.year,
        carColor: car.color,
        carChassisNumber: car.chassisNumber,
        carEngineNumber: car.motorNumber || '',
        carCategory: car.category,
        carOwnerName: car.ownerName || '',
        carOwnerCivilId: car.ownerCivilId || '',
        carOwnerPhone: car.ownerPhone || '',
        carSalePrice: car.salePrice || carValueSecurity,
        driverId: drv?.id,
        driverName: drv?.name,
        startDate,
        endDate,
        startTime,
        endTime,
        rentalDurationType,
        totalHours: rentalDurationType === 'hours' ? totalHours : undefined,
        hourlyRate: rentalDurationType === 'hours' ? hourlyRate : undefined,
        dailyRate,
        totalDays: diffDays,
        totalAmount,
        deposit,
        paidAmount: calculatedPaid,
        remainingAmount: calculatedRemaining,
        paymentMethod,
        paymentStatus: finalPaymentStatus,
        startMileage: startMileageInput || car.currentMileage,
        dailyMileageLimit,
        excessMileageRate,
        hourlyDelayFee,
        carValueSecurity,
        customerSignature: customerSignature || editingContract.customerSignature,
        agentSignature: agentSignature || editingContract.agentSignature,
        customerFingerprint: customerFingerprint || editingContract.customerFingerprint,
        notes,
      };

      onUpdateContract(updatedContract);
      if (editingContract.carId !== car.id) {
        onUpdateCarStatus(editingContract.carId, 'available');
        onUpdateCarStatus(car.id, 'rented');
      }
    } else {
      const newContractNumber = `CNT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const newContract: RentalContract = {
        id: `cnt_${Date.now()}`,
        contractNumber: newContractNumber,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        customerNationalId: cust.nationalId,
        customerLicenseNumber: cust.licenseNumber,
        customerLicenseExpiryDate: cust.licenseExpiryDate,
        customerNationality: cust.nationality,
        customerAddress: cust.address,
        customerEmail: cust.email,
        customerPhotoUrl: customerPhotoUrl || cust.photoUrl,
        customerDocPhotoUrl: cust.docPhotoUrl,
        customerNotes: cust.notes,
        customerServiceType: cust.serviceType,
        carId: car.id,
        carModel: `${car.brand} ${car.model} ${car.year}`,
        carPlate: car.plateNumber,
        carBrand: car.brand,
        carModelName: car.model,
        carYear: car.year,
        carColor: car.color,
        carChassisNumber: car.chassisNumber,
        carEngineNumber: car.motorNumber || '',
        carCategory: car.category,
        carOwnerName: car.ownerName || '',
        carOwnerCivilId: car.ownerCivilId || '',
        carOwnerPhone: car.ownerPhone || '',
        carSalePrice: car.salePrice || carValueSecurity,
        driverId: drv?.id,
        driverName: drv?.name,
        startDate,
        endDate,
        startTime,
        endTime,
        rentalDurationType,
        totalHours: rentalDurationType === 'hours' ? totalHours : undefined,
        hourlyRate: rentalDurationType === 'hours' ? hourlyRate : undefined,
        dailyRate,
        totalDays: diffDays,
        totalAmount,
        deposit,
        paidAmount: calculatedPaid,
        remainingAmount: calculatedRemaining,
        paymentMethod,
        paymentStatus: finalPaymentStatus,
        startMileage: startMileageInput || car.currentMileage,
        dailyMileageLimit,
        excessMileageRate,
        hourlyDelayFee,
        carValueSecurity,
        status: 'active',
        customerSignature,
        agentSignature,
        customerFingerprint,
        termsAccepted: true,
        notes,
        createdAt: new Date().toISOString(),
      };

      onAddContract(newContract);
      // Mark car as rented
      onUpdateCarStatus(car.id, 'rented');
    }

    setIsWizardOpen(false);
    setEditingContract(null);
  };

  const handleProcessReturn = () => {
    if (!returnContract) return;

    const startKm = returnContract.startMileage;
    const limitPerDay = returnContract.dailyMileageLimit || 250;
    const ratePerExtraKm = returnContract.excessMileageRate || 0.5;
    const totalAllowedKm = (returnContract.totalDays || 1) * limitPerDay;

    const actualDriven = Math.max(0, returnMileage - startKm);
    const excessKm = Math.max(0, actualDriven - totalAllowedKm);
    const excessFee = excessKm * ratePerExtraKm;
    const updatedTotalAmount = returnContract.totalAmount + excessFee;

    const prevPaid = returnContract.paidAmount ?? (returnContract.paymentStatus === 'paid' ? returnContract.totalAmount : returnContract.deposit || 0);
    const newTotalPaid = Math.min(updatedTotalAmount, prevPaid + Number(returnAdditionalPaid || 0));
    const newRemaining = Math.max(0, updatedTotalAmount - newTotalPaid);
    const newPaymentStatus = newRemaining === 0 ? 'paid' : newTotalPaid > 0 ? 'partial' : 'pending';

    const updated: RentalContract = {
      ...returnContract,
      endMileage: returnMileage,
      excessMileage: excessKm,
      excessMileageFee: excessFee,
      totalAmount: updatedTotalAmount,
      paidAmount: newTotalPaid,
      remainingAmount: newRemaining,
      paymentStatus: newPaymentStatus,
      status: 'completed',
    };

    onUpdateContract(updated);
    // Mark car back as available and update odometer
    onUpdateCarStatus(returnContract.carId, 'available', returnMileage);
    setReturnContract(null);
    setReturnAdditionalPaid(0);
  };

  const availableCars = cars.filter(
    (c) => c.status === 'available' || (editingContract && c.id === editingContract.carId)
  );

  // Filter overdue and expiring contracts
  const overdueContracts = contracts.filter((c) => c.status === 'active' && getContractExpiryInfo(c).isExpired);
  const expiringSoonContracts = contracts.filter((c) => c.status === 'active' && (getContractExpiryInfo(c).isExpiringToday || getContractExpiryInfo(c).isExpiringSoon));

  // Filtered Customers & Cars inside Wizard
  const filteredCustomersForWizard = useMemo(() => {
    if (!wizardCustomerSearch.trim()) return customers;
    const q = wizardCustomerSearch.trim().toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.nationalId && c.nationalId.includes(q)) ||
        (c.licenseNumber && c.licenseNumber.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, wizardCustomerSearch]);

  const filteredCarsForWizard = useMemo(() => {
    const baseCars = availableCars;
    if (!wizardCarSearch.trim()) return baseCars;
    const q = wizardCarSearch.trim().toLowerCase();
    return baseCars.filter(
      (c) =>
        c.plateNumber.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        (c.chassisNumber && c.chassisNumber.toLowerCase().includes(q)) ||
        (c.motorNumber && c.motorNumber.toLowerCase().includes(q)) ||
        (c.ownerName && c.ownerName.toLowerCase().includes(q)) ||
        (c.color && c.color.toLowerCase().includes(q))
    );
  }, [availableCars, wizardCarSearch]);

  const filteredContracts = contracts.filter((cnt) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      cnt.contractNumber.toLowerCase().includes(q) ||
      cnt.customerName.toLowerCase().includes(q) ||
      (cnt.customerPhone && cnt.customerPhone.includes(q)) ||
      (cnt.customerNationalId && cnt.customerNationalId.includes(q)) ||
      cnt.carModel.toLowerCase().includes(q) ||
      cnt.carPlate.toLowerCase().includes(q) ||
      (cnt.carChassisNumber && cnt.carChassisNumber.toLowerCase().includes(q)) ||
      (cnt.carEngineNumber && cnt.carEngineNumber.toLowerCase().includes(q)) ||
      (cnt.lessorName && cnt.lessorName.toLowerCase().includes(q)) ||
      (cnt.notes && cnt.notes.toLowerCase().includes(q));

    const exp = getContractExpiryInfo(cnt);

    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = cnt.status === 'active';
    } else if (statusFilter === 'expiring') {
      matchesStatus = cnt.status === 'active' && (exp.isExpired || exp.isExpiringToday || exp.isExpiringSoon);
    } else if (statusFilter === 'completed') {
      matchesStatus = cnt.status === 'completed';
    } else if (statusFilter === 'cancelled') {
      matchesStatus = cnt.status === 'cancelled';
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>{t.contracts}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'ar' ? 'إصدار عقود الإيجار الرقمية، وإقرارات استلام السيارات، وإيصالات الأمانة' : 'Issue digital rental agreements, vehicle handover receipts, and promissory notes'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print Blank Contract Button */}
          <button
            onClick={() => {
              setPrintContract(null);
              setIsBlankContractModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-slate-700 hover:border-amber-400/60 rounded-xl font-extrabold text-xs sm:text-sm shadow-xs transition"
            title={lang === 'ar' ? 'طباعة عقد إيجار فارغ معتمد ومفرغ للتعبئة اليدوية' : 'Print Blank Rental Contract'}
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>{lang === 'ar' ? '📄 طباعة عقد فارغ' : 'Print Blank Contract'}</span>
          </button>

          {/* Print Blank Handover Receipt Button */}
          <button
            onClick={() => {
              setSelectedHandoverReceipt(null);
              setIsHandoverBlank(true);
              setIsHandoverModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white border border-slate-700 hover:border-blue-400/60 rounded-xl font-extrabold text-xs sm:text-sm shadow-xs transition"
            title={lang === 'ar' ? 'طباعة إقرار استلام سيارة وإيصال أمانة فارغ للتعبئة اليدوية' : 'Print Blank Vehicle Handover Receipt'}
          >
            <FileCheck className="w-4 h-4 text-blue-400" />
            <span>{lang === 'ar' ? '📝 طباعة إقرار فارغ' : 'Print Blank Receipt'}</span>
          </button>

          {/* Issue Handover Receipt Modal */}
          <button
            onClick={() => {
              setSelectedHandoverReceipt(null);
              setIsHandoverBlank(false);
              setIsHandoverModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>📑 إقرار استلام وإيصال أمانة</span>
          </button>

          {/* Create Contract Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createContract}</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('contracts')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
            activeSubTab === 'contracts'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>عقود الإيجار الرقمية ({filteredContracts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('handovers')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
            activeSubTab === 'handovers'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>📑 إقرارات الاستلام وإيصالات الأمانة ({handoverReceipts.length})</span>
        </button>
      </div>

      {/* Expiry Notifications Alert Banner */}
      {(overdueContracts.length > 0 || expiringSoonContracts.length > 0) && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-2 border-rose-300 dark:border-rose-900/60 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black animate-pulse shadow-md">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{t.contractExpiryAlert}</span>
                  <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                    {overdueContracts.length + expiringSoonContracts.length} {lang === 'ar' ? 'تنبيهات' : 'Alerts'}
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {lang === 'ar'
                    ? 'توجد عقود مؤجرة تجاوزت فترة الاستئجار المحددة أو تقترب من الانتهاء، يرجى التواصل لإعادتها.'
                    : 'Active agreements have exceeded duration or are expiring within 48 hours.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setStatusFilter('expiring')}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 self-start sm:self-center"
            >
              <span>{lang === 'ar' ? 'تصفية العقود المستحقة' : 'Filter Expiring Contracts'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
            {overdueContracts.map((cnt) => {
              const exp = getContractExpiryInfo(cnt);
              return (
                <div key={cnt.id} className="p-2.5 bg-rose-100/90 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 font-black text-rose-950 dark:text-rose-100">
                      <span>{cnt.customerName}</span>
                      <span className="text-[10px] bg-rose-700 text-white px-1.5 py-0.5 rounded font-mono">
                        {cnt.contractNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-900 dark:text-rose-200 font-medium mt-0.5">
                      {cnt.carModel} ({cnt.carPlate}) • {t.endDate}: <strong className="underline">{cnt.endDate}</strong> ({Math.abs(exp.daysDiff)} {t.daysOverdue})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setReturnContract(cnt);
                      setReturnMileage(cnt.startMileage + 300);
                    }}
                    className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white font-black text-[11px] rounded-lg transition shadow-xs shrink-0"
                  >
                    {t.returnCar}
                  </button>
                </div>
              );
            })}

            {expiringSoonContracts.map((cnt) => {
              const exp = getContractExpiryInfo(cnt);
              return (
                <div key={cnt.id} className="p-2.5 bg-amber-100/90 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 font-black text-amber-950 dark:text-amber-100">
                      <span>{cnt.customerName}</span>
                      <span className="text-[10px] bg-amber-700 text-white px-1.5 py-0.5 rounded font-mono">
                        {cnt.contractNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900 dark:text-amber-200 font-medium mt-0.5">
                      {cnt.carModel} ({cnt.carPlate}) • {exp.isExpiringToday ? t.expiringToday : `${t.expiringSoon} (${exp.daysDiff}d)`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setReturnContract(cnt);
                      setReturnMileage(cnt.startMileage + 300);
                    }}
                    className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-black text-[11px] rounded-lg transition shadow-xs shrink-0"
                  >
                    {t.returnCar}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-tab view switching */}
      {activeSubTab === 'handovers' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>سجل إقرارات استلام السيارات وإيصالات الأمانة المعتمدة</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يمكنك إصدار أو طباعة الإقرار مع إيصال الأمانة معتمداً في ورقة واحدة A4 في أي وقت
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedHandoverReceipt(null);
                  setIsHandoverBlank(true);
                  setIsHandoverModalOpen(true);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 border border-slate-700 hover:border-amber-400/50"
                title="طباعة إقرار استلام وإيصال أمانة فارغ للتعبئة اليدوية"
              >
                <FileCheck className="w-4 h-4 text-amber-300" />
                <span>طباعة نموذج فارغ</span>
              </button>

              <button
                onClick={() => {
                  setSelectedHandoverReceipt(null);
                  setIsHandoverBlank(false);
                  setIsHandoverModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إصدار إقرار استلام جديد</span>
              </button>
            </div>
          </div>

          {handoverReceipts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <FileCheck className="w-12 h-12 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">لم يتم إصدار أي إقرارات استلام بعد</p>
              <p className="text-xs text-slate-500 mt-1">اضغط على زر "إصدار إقرار استلام جديد" للبدء</p>
              <button
                onClick={() => {
                  setSelectedHandoverReceipt(null);
                  setIsHandoverModalOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إصدار إقرار استلام جديد</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right rtl:text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-extrabold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">رقم الإقرار</th>
                    <th className="py-3.5 px-4">المستلم</th>
                    <th className="py-3.5 px-4">السيارة واللوحة</th>
                    <th className="py-3.5 px-4">فترة الاستلام</th>
                    <th className="py-3.5 px-4 text-center">الخيارات والطباعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-800 dark:text-slate-200">
                  {handoverReceipts.map((rcp) => (
                    <tr key={rcp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-black text-amber-600 dark:text-amber-400">
                        {rcp.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {rcp.customerPhotoUrl ? (
                            <img src={rcp.customerPhotoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-amber-400" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                              {rcp.recipientName.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold block">{rcp.recipientName}</span>
                            <span className="text-[10px] text-slate-400">هوية: {rcp.nationalId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold block">{rcp.carBrand} {rcp.carModel}</span>
                        <span className="text-[10px] text-slate-400">لوحة: {rcp.carPlate}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block font-semibold">{rcp.fromDate} ➔ {rcp.toDate}</span>
                        <span className="text-[10px] text-slate-400">{rcp.fromTime} - {rcp.toTime}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedHandoverReceipt(rcp);
                              setIsHandoverModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>معاينة وطباعة (A4)</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{lang === 'ar' ? 'جميع حالات العقود' : 'All Contract Statuses'}</option>
          <option value="active">{t.activeContract}</option>
          <option value="expiring">{lang === 'ar' ? '⚠️ العقود المستحقة والمنتهية' : '⚠️ Expiring & Overdue'}</option>
          <option value="completed">{t.completedContract}</option>
          <option value="cancelled">{t.cancelledContract}</option>
        </select>
      </div>

      {/* Contracts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-extrabold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{t.contractNumber}</th>
                <th className="py-3.5 px-4">{t.customerName}</th>
                <th className="py-3.5 px-4">{t.selectCar}</th>
                <th className="py-3.5 px-4">{t.startDate} - {t.endDate}</th>
                <th className="py-3.5 px-4">{t.startMileage} / {t.endMileage}</th>
                <th className="py-3.5 px-4">{t.totalAmount} / {t.paidAmount} / {t.remainingAmount}</th>
                <th className="py-3.5 px-4">{t.status}</th>
                <th className="py-3.5 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-800 dark:text-slate-200">
              {filteredContracts.map((cnt) => {
                const expiry = getContractExpiryInfo(cnt);
                const paidVal = cnt.paidAmount ?? (cnt.paymentStatus === 'paid' ? cnt.totalAmount : cnt.deposit || 0);
                const remainingVal = cnt.remainingAmount ?? Math.max(0, cnt.totalAmount - paidVal);

                return (
                  <tr key={cnt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-black text-blue-600 dark:text-blue-400">
                      {cnt.contractNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {cnt.customerPhotoUrl ? (
                          <img src={cnt.customerPhotoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-blue-400" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {cnt.customerName.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <span className="font-bold block">{cnt.customerName}</span>
                          <span className="text-[10px] text-slate-400">{cnt.customerPhone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold block">{cnt.carModel}</span>
                      <span className="text-[10px] text-slate-400">{cnt.carPlate}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="block font-semibold">{cnt.startDate} ➔ {cnt.endDate}</span>
                      <span className="text-[10px] text-slate-400">{cnt.totalDays} {lang === 'ar' ? 'أيام' : 'Days'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        <span className="text-[10px] text-slate-400 block">{t.startMileage}:</span>
                        <span>{cnt.startMileage.toLocaleString()} KM</span>
                      </div>
                      <div className="text-[11px] mt-0.5">
                        {cnt.endMileage ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
                            {t.endMileage}: {cnt.endMileage.toLocaleString()} KM
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold block">
                            {lang === 'ar' ? 'بانتظار الإرجاع' : 'Pending Return'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="font-black text-slate-900 dark:text-slate-100">
                        <span className="text-[10px] text-slate-400 block">{t.totalAmount}:</span>
                        <span>{formatCurrency(cnt.totalAmount, currency, lang)}</span>
                      </div>
                      <div className="text-[11px] mt-1 space-y-0.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
                          {t.paidAmount}: {formatCurrency(paidVal, currency, lang)}
                        </span>
                        {remainingVal > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-extrabold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded text-[10px] inline-block border border-rose-200 dark:border-rose-900">
                            {t.remainingAmount}: {formatCurrency(remainingVal, currency, lang)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold block">
                            ✓ {lang === 'ar' ? 'مسدد بالكامل' : 'Fully Paid'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {cnt.status === 'active' ? (
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-extrabold text-[10px] rounded-full block w-fit">
                            {t.activeContract}
                          </span>
                          {expiry.isExpired && (
                            <span className="px-2 py-0.5 bg-rose-600 text-white font-extrabold text-[10px] rounded-full animate-pulse block w-fit">
                              🚨 {t.overdueContract} ({Math.abs(expiry.daysDiff)} {t.daysOverdue})
                            </span>
                          )}
                          {expiry.isExpiringToday && (
                            <span className="px-2 py-0.5 bg-amber-500 text-white font-extrabold text-[10px] rounded-full animate-pulse block w-fit">
                              ⏰ {t.expiringToday}
                            </span>
                          )}
                          {expiry.isExpiringSoon && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-[10px] rounded-full block w-fit">
                              ⏳ {t.expiringSoon} ({expiry.daysDiff}d)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] rounded-full">
                          {t.completedContract}
                        </span>
                      )}
                    </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setPrintContract(cnt)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition"
                        title={t.printContract}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{t.print}</span>
                      </button>

                      {/* Vehicle Handover Receipt Action */}
                      <button
                        onClick={() => {
                          const matchedCust = customers.find(c => c.id === cnt.customerId || c.name === cnt.customerName);
                          const matchedC = cars.find(c => c.id === cnt.carId || c.plateNumber === cnt.carPlate);
                          setSelectedHandoverReceipt({
                            id: `handover_${cnt.id}`,
                            receiptNumber: `REC-${cnt.contractNumber.replace(/^CNT-/, '')}`,
                            customerId: cnt.customerId,
                            recipientName: cnt.customerName,
                            address: matchedCust?.address || '',
                            nationalId: matchedCust?.nationalId || '',
                            phone: matchedCust?.phone || '',
                            customerPhotoUrl: matchedCust?.photoUrl || '',
                            customerSignature: cnt.customerSignature || '',
                            customerFingerprint: cnt.customerFingerprint || '',
                            carId: cnt.carId,
                            carPlate: cnt.carPlate,
                            carBrand: matchedC?.brand || '',
                            carModel: cnt.carModel,
                            carChassis: matchedC?.chassisNumber || cnt.carChassisNumber || '',
                            carColor: matchedC?.color || cnt.carColor || '',
                            fromDate: cnt.startDate,
                            fromTime: cnt.startTime || '10:00 ص',
                            toDate: cnt.endDate,
                            toTime: cnt.endTime || '10:00 ص',
                            checklist: {
                              tank: 'ممتلئ (4/4)',
                              tires: 'ممتازة ومطابقة (4 + احتياطي)',
                              cassette: 'شغال وسليم',
                              upholstery: 'سليم ونظيف',
                              hubcapsCount: '4 طاسات أصلية',
                              fireExtinguisher: 'موجودة وصالحة',
                              seatsCount: 'كاملة وسليمة',
                            },
                            createdAt: cnt.createdAt,
                          });
                          setIsHandoverBlank(false);
                          setIsHandoverModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-bold text-xs rounded-lg transition border border-amber-300 dark:border-amber-800"
                        title={lang === 'ar' ? 'طباعة / إصدار إقرار استلام السيارة وإيصال الأمانة لهذا العقد' : 'Print / Issue Vehicle Handover Receipt'}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>{lang === 'ar' ? 'إقرار استلام' : 'Handover'}</span>
                      </button>

                      {cnt.status === 'active' && (
                        <button
                          onClick={() => {
                            setReturnContract(cnt);
                            setReturnMileage(cnt.startMileage + 300);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition"
                          title={t.returnCar}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t.returnCar}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEditModal(cnt)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-bold text-xs rounded-lg transition border border-amber-200 dark:border-amber-800"
                        title={lang === 'ar' ? 'تعديل العقد' : 'Edit Contract'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteContractClick(cnt)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold text-xs rounded-lg transition border border-rose-200 dark:border-rose-800"
                        title={lang === 'ar' ? 'حذف العقد' : 'Delete Contract'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      {/* Contract Creation & Edit Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full my-auto max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header - Fixed at top */}
            <div className="flex-none p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center z-10">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>
                  {editingContract
                    ? lang === 'ar'
                      ? `تعديل عقد الإيجار (${editingContract.contractNumber})`
                      : `Edit Rental Agreement (${editingContract.contractNumber})`
                    : t.createContract}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsWizardOpen(false);
                  setEditingContract(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveContract} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
              {/* Customer & Car Selection with Live Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Customer Selection with Search */}
                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      1. {t.selectCustomer} *
                    </label>
                    {wizardCustomerSearch && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {filteredCustomersForWizard.length} {lang === 'ar' ? 'نتيجة' : 'matches'}
                      </span>
                    )}
                  </div>

                  {/* Customer Quick Search Field with Clickable Suggestions */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute rtl:right-2.5 ltr:left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={wizardCustomerSearch}
                      onChange={(e) => setWizardCustomerSearch(e.target.value)}
                      placeholder={lang === 'ar' ? '🔍 ابحث عن العميل واضغط عليه للاختيار المباشر...' : '🔍 Search customer and click to select...'}
                      className="w-full rtl:pr-8 ltr:pl-8 rtl:pl-7 ltr:pr-7 py-1.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700/60 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500"
                    />
                    {wizardCustomerSearch && (
                      <button
                        type="button"
                        onClick={() => setWizardCustomerSearch('')}
                        className="absolute rtl:left-2 ltr:right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}

                    {/* CLICK-TO-SELECT AUTOCOMPLETE POPUP */}
                    {wizardCustomerSearch.trim().length > 0 && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredCustomersForWizard.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center">
                            {lang === 'ar' ? 'لا يوجد عميل مطابق لبحثك' : 'No matching customer'}
                          </div>
                        ) : (
                          filteredCustomersForWizard.map((c) => {
                            const isSelected = selectedCustomerId === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  handleCustomerChange(c.id);
                                  setWizardCustomerSearch('');
                                }}
                                className={`w-full p-2.5 text-right rtl:text-right ltr:text-left flex items-center justify-between transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-blue-950/70 font-bold text-blue-900 dark:text-blue-100'
                                    : 'hover:bg-blue-50/60 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {c.photoUrl ? (
                                    <img src={c.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                                      {c.name.slice(0, 2)}
                                    </div>
                                  )}
                                  <div className="truncate">
                                    <div className="text-xs font-bold flex items-center gap-1.5 flex-wrap">
                                      <span className="truncate">{c.name}</span>
                                      {c.isBlacklisted && (
                                        <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-bold">محظور</span>
                                      )}
                                      {c.vipLevel && c.vipLevel !== 'standard' && (
                                        <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded font-bold">VIP</span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                      {c.phone} {c.nationalId ? `• هوية: ${c.nationalId}` : ''}
                                    </div>
                                  </div>
                                </div>
                                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg transition ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}>
                                  {isSelected ? (lang === 'ar' ? '✓ تم الاختيار' : '✓ Selected') : (lang === 'ar' ? 'اضغط للاختيار ↵' : 'Select ↵')}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Customer Active Banner */}
                  {selectedCustomerId && (
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/80 rounded-xl text-xs text-emerald-800 dark:text-emerald-200">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-bold">
                          {lang === 'ar' ? 'العميل المختار:' : 'Selected:'} {customers.find((c) => c.id === selectedCustomerId)?.name || selectedCustomerId}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          ({customers.find((c) => c.id === selectedCustomerId)?.phone})
                        </span>
                      </div>
                    </div>
                  )}

                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  >
                    {filteredCustomersForWizard.length === 0 && (
                      <option value="">{lang === 'ar' ? 'لا يوجد عميل مطابق لبحثك' : 'No matching customer'}</option>
                    )}
                    {filteredCustomersForWizard.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) {c.nationalId ? `[${c.nationalId}]` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Customer Photo Preview or Capture */}
                  <div className="mt-2 flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      {customerPhotoUrl ? (
                        <img src={customerPhotoUrl} alt="Customer" className="w-10 h-10 rounded-full object-cover border border-blue-500" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        {(() => {
                          const cust = customers.find((c) => c.id === selectedCustomerId);
                          return (
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight">{cust?.name || '-'}</p>
                                {cust?.vipLevel && cust.vipLevel !== 'standard' && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded text-[9px] font-black border border-amber-300">
                                    <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                                    <span>{cust.vipLevel.toUpperCase()}</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono">{cust?.phone || '-'} {cust?.nationalId ? `• هوية: ${cust.nationalId}` : ''}</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="px-2.5 py-1 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg font-bold flex items-center gap-1 border border-blue-200 dark:border-blue-800"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{t.capturePhoto}</span>
                    </button>
                  </div>

                  {/* CRITICAL BLACKLIST WARNING BANNER */}
                  {(() => {
                    const cust = customers.find((c) => c.id === selectedCustomerId);
                    if (!cust?.isBlacklisted) return null;
                    return (
                      <div className="mt-2 p-3 bg-rose-600 text-white rounded-xl shadow-lg border-2 border-rose-700 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-start gap-2.5">
                          <Ban className="w-5 h-5 text-white shrink-0 mt-0.5 animate-bounce" />
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="font-black text-xs">
                                ⚠️ {lang === 'ar' ? 'تنبيه أمني: العميل مدرج في القائمة السوداء!' : 'SECURITY ALERT: CUSTOMER IS BLACKLISTED!'}
                              </h5>
                              <span className="text-[10px] bg-white text-rose-700 font-black px-2 py-0.5 rounded-full uppercase">
                                {lang === 'ar' ? 'محظور التأجير' : 'BLOCKED'}
                              </span>
                            </div>
                            <p className="text-[11px] text-rose-100 leading-snug">
                              {lang === 'ar'
                                ? 'هذا العميل لديه حظر معمم في النظام ولا يجوز تحرير عقد إيجار له دون مراجعة الإدارة العليا.'
                                : 'This customer has an active blacklist restriction and cannot rent vehicles.'}
                            </p>
                            {cust.blacklistReason && (
                              <p className="text-[11px] font-bold bg-rose-700/80 px-2 py-1 rounded-lg border border-rose-500">
                                📌 {lang === 'ar' ? 'سبب الحظر:' : 'Reason:'} {cust.blacklistReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Car Selection with Search */}
                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      2. {t.selectCar} *
                    </label>
                    {wizardCarSearch && (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {filteredCarsForWizard.length} {lang === 'ar' ? 'سيارة مطابقة' : 'matches'}
                      </span>
                    )}
                  </div>

                  {/* Car Quick Search Field with Clickable Suggestions */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute rtl:right-2.5 ltr:left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={wizardCarSearch}
                      onChange={(e) => setWizardCarSearch(e.target.value)}
                      placeholder={lang === 'ar' ? '🔍 ابحث عن السيارة واضغط عليها للاختيار المباشر...' : '🔍 Search car and click to select...'}
                      className="w-full rtl:pr-8 ltr:pl-8 rtl:pl-7 ltr:pr-7 py-1.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700/60 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500"
                    />
                    {wizardCarSearch && (
                      <button
                        type="button"
                        onClick={() => setWizardCarSearch('')}
                        className="absolute rtl:left-2 ltr:right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}

                    {/* CLICK-TO-SELECT AUTOCOMPLETE POPUP FOR CAR */}
                    {wizardCarSearch.trim().length > 0 && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border-2 border-blue-500 dark:border-blue-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredCarsForWizard.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center">
                            {lang === 'ar' ? 'لا توجد سيارات مطابقة للبحث' : 'No matching cars'}
                          </div>
                        ) : (
                          filteredCarsForWizard.map((car) => {
                            const isSelected = selectedCarId === car.id;
                            return (
                              <button
                                key={car.id}
                                type="button"
                                onClick={() => {
                                  handleCarChange(car.id);
                                  setWizardCarSearch('');
                                }}
                                className={`w-full p-2.5 text-right rtl:text-right ltr:text-left flex items-center justify-between transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-blue-950/70 font-bold text-blue-900 dark:text-blue-100'
                                    : 'hover:bg-blue-50/60 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-10 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                                    <img src={car.photoUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-bold flex items-center gap-1.5">
                                      <span className="truncate">{car.brand} {car.model}</span>
                                      <span className="font-mono text-blue-600 dark:text-blue-400">({car.plateNumber})</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {car.color ? `${car.color} • ` : ''}{car.dailyRate} {currency}/يوم
                                    </div>
                                  </div>
                                </div>
                                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg transition ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}>
                                  {isSelected ? (lang === 'ar' ? '✓ تم الاختيار' : '✓ Selected') : (lang === 'ar' ? 'اضغط للاختيار ↵' : 'Select ↵')}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Car Active Banner */}
                  {selectedCarId && (
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/80 rounded-xl text-xs text-emerald-800 dark:text-emerald-200">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-bold">
                          {lang === 'ar' ? 'السيارة المختارة:' : 'Selected:'} {cars.find((c) => c.id === selectedCarId)?.brand} {cars.find((c) => c.id === selectedCarId)?.model}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                          ({cars.find((c) => c.id === selectedCarId)?.plateNumber})
                        </span>
                      </div>
                    </div>
                  )}

                  <select
                    value={selectedCarId}
                    onChange={(e) => handleCarChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  >
                    {filteredCarsForWizard.length === 0 && (
                      <option value="">{lang === 'ar' ? 'لا توجد سيارات مطابقة للبحث' : 'No matching cars'}</option>
                    )}
                    {filteredCarsForWizard.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.brand} {car.model} ({car.plateNumber}) - {car.color || ''} - {car.dailyRate} {currency}/يوم
                      </option>
                    ))}
                  </select>

                  {/* Selected Car Details Preview (Color, Chassis, Owner) */}
                  {(() => {
                    const selCar = cars.find((c) => c.id === selectedCarId);
                    if (!selCar) return null;
                    return (
                      <div className="mt-2 p-2.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                            <span>{t.color}: <strong className="text-blue-700 dark:text-blue-400">{selCar.color || (lang === 'ar' ? 'أبيض لؤلؤي' : 'White')}</strong></span>
                          </span>
                          <span className="font-mono text-blue-800 dark:text-blue-300 font-extrabold">{selCar.plateNumber}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-blue-100 dark:border-blue-900/40">
                          <div>
                            <span>{t.chassisNumber}: </span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selCar.chassisNumber || '—'}</span>
                          </div>
                          <div>
                            <span>{t.motorNumber}: </span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selCar.motorNumber || '—'}</span>
                          </div>
                        </div>
                        {selCar.ownerName && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-blue-100 dark:border-blue-900/40 flex justify-between">
                            <span>{t.ownerName}: <strong className="text-slate-800 dark:text-slate-200">{selCar.ownerName}</strong></span>
                            {selCar.ownerCivilId && (
                              <span>هوية: <strong className="font-mono">{selCar.ownerCivilId}</strong></span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Driver & Rental Period Section */}
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.selectDriver}
                    </label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-medium"
                    >
                      <option value="">-- {lang === 'ar' ? 'بدون سائق (قيادة العميل بنفسه)' : 'Self Drive (No Driver)'} --</option>
                      {drivers.filter(d => d.status === 'available').map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} (★ {d.rating}) - {d.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rental Duration Mode Selector (Daily vs Hourly) */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl border border-blue-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>{lang === 'ar' ? 'نوع مدة التأجير والمواعيد:' : 'Rental Duration Type & Timing:'}</span>
                    </span>
                    <div className="flex bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-blue-200 dark:border-slate-700 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setRentalDurationType('days')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          rentalDurationType === 'days'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        📅 {lang === 'ar' ? 'تأجير يومي (بالأيام)' : 'Daily Rental'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRentalDurationType('hours')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                          rentalDurationType === 'hours'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        ⏱️ {lang === 'ar' ? 'تأجير بالساعات' : 'Hourly Rental'}
                      </button>
                    </div>
                  </div>

                  {rentalDurationType === 'days' ? (
                    /* Daily Rental Grid */
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {t.startDate} *
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            ⏰ {lang === 'ar' ? 'ساعة الاستلام (البداية)' : 'Pickup Time'} *
                          </label>
                          <input
                            type="text"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            placeholder="10:00 ص"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-blue-700 dark:text-blue-300"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {t.endDate} *
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            🏁 {lang === 'ar' ? 'ساعة الإرجاع (الانتهاء)' : 'Return Time'} *
                          </label>
                          <input
                            type="text"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            placeholder="10:00 ص"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {lang === 'ar' ? `سعر الإيجار اليومي (${currency}/يوم) *` : `Daily Rate (${currency}/day) *`}
                          </label>
                          <input
                            type="number"
                            value={dailyRate}
                            onChange={(e) => setDailyRate(Math.max(0, Number(e.target.value)))}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-black text-emerald-700 dark:text-emerald-400"
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-blue-100 dark:border-slate-700">
                          <div>
                            <span className="text-[10px] text-slate-500 block font-semibold">{lang === 'ar' ? 'إجمالي الأيام والتكلفة' : 'Total Days & Cost'}</span>
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                              {diffDays} {lang === 'ar' ? 'أيام' : 'Days'} × {formatCurrency(dailyRate, currency, lang)}
                            </span>
                          </div>
                          <span className="text-sm font-black text-blue-700 dark:text-blue-300 font-mono">
                            = {formatCurrency(totalAmount, currency, lang)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Hourly Rental Grid */
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {lang === 'ar' ? 'تاريخ الاستلام' : 'Pickup Date'} *
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                              setStartDate(e.target.value);
                              setEndDate(e.target.value);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            ⏰ {lang === 'ar' ? 'ساعة الاستلام (البداية)' : 'Pickup Time'} *
                          </label>
                          <input
                            type="text"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            placeholder="10:00 ص"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-blue-700 dark:text-blue-300"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            🏁 {lang === 'ar' ? 'ساعة الإرجاع (الانتهاء)' : 'Return Time'} *
                          </label>
                          <input
                            type="text"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            placeholder="02:00 م"
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            ⏱️ {lang === 'ar' ? 'عدد الساعات المطلوبة' : 'Total Hours'} *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="72"
                            value={totalHours}
                            onChange={(e) => setTotalHours(Math.max(1, Number(e.target.value)))}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-black text-indigo-700 dark:text-indigo-400"
                          />
                        </div>
                      </div>

                      {/* Quick Hour Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-semibold text-slate-500">{lang === 'ar' ? 'ساعات سريعة:' : 'Quick Hours:'}</span>
                        {[1, 2, 3, 4, 6, 8, 12, 24].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setTotalHours(h)}
                            className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-all ${
                              totalHours === h
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {h} {lang === 'ar' ? 'س' : 'h'}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {lang === 'ar' ? `سعر تأجير الساعة الواحدة (${currency}/ساعة) *` : `Hourly Rate (${currency}/hr) *`}
                          </label>
                          <input
                            type="number"
                            value={hourlyRate}
                            onChange={(e) => setHourlyRate(Math.max(0, Number(e.target.value)))}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-black text-emerald-700 dark:text-emerald-400"
                          />
                        </div>

                        <div className="flex items-center justify-between p-2.5 bg-white/90 dark:bg-slate-900/90 rounded-xl border border-indigo-100 dark:border-slate-700">
                          <div>
                            <span className="text-[10px] text-slate-500 block font-semibold">{lang === 'ar' ? 'إجمالي الساعات والتكلفة' : 'Hours & Total'}</span>
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                              {totalHours} {lang === 'ar' ? 'ساعات' : 'Hours'} × {formatCurrency(hourlyRate, currency, lang)}
                            </span>
                          </div>
                          <span className="text-sm font-black text-indigo-700 dark:text-indigo-300 font-mono">
                            = {formatCurrency(totalAmount, currency, lang)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Odometer Clause Configuration */}
              <div className="space-y-3 py-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{t.odometerClauseTitle}</span>
                  </h4>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    {t.allowedMileage}: {allowedTotalMileage} KM ({rentalDurationType === 'hours' ? `${totalHours} ${lang === 'ar' ? 'ساعات' : 'Hours'}` : `${diffDays} ${lang === 'ar' ? 'أيام' : 'Days'}`})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.startMileage} (KM) *
                    </label>
                    <input
                      type="number"
                      value={startMileageInput}
                      onChange={(e) => setStartMileageInput(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.dailyMileageLimit}
                    </label>
                    <input
                      type="number"
                      value={dailyMileageLimit}
                      onChange={(e) => setDailyMileageLimit(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.excessMileageRate} ({currency}/KM)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={excessMileageRate}
                      onChange={(e) => setExcessMileageRate(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Delay Fees & Total Car Value */}
              <div className="p-3 bg-blue-50/70 dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-slate-700 space-y-3">
                <h4 className="font-extrabold text-xs text-blue-900 dark:text-blue-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{lang === 'ar' ? 'غرامة ساعات التأخير وثمن السيارة التقديري (مأخوذة من إعدادات النظام):' : 'Hourly Delay Fee & Vehicle Valuation:'}</span>
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                    {lang === 'ar' ? 'تُطبع بالعقد الرسمي' : 'Printed on Contract'}
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? `قيمة ساعات التأخير (${currency}/ساعة) *` : `Hourly Delay Fee (${currency}/hr) *`}
                    </label>
                    <input
                      type="number"
                      value={hourlyDelayFee}
                      onChange={(e) => setHourlyDelayFee(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-black text-rose-700 dark:text-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? `ثمن السيارة كامل - تقديري كأمانة (${currency}) *` : `Total Car Value (${currency}) *`}
                    </label>
                    <input
                      type="number"
                      value={carValueSecurity}
                      onChange={(e) => setCarValueSecurity(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Breakdown & Payment Method */}
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                <h4 className="font-extrabold text-xs text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{lang === 'ar' ? 'البيانات المالية والدفع والتأمين:' : 'Financial Breakdown & Payment:'}</span>
                  </span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {lang === 'ar' ? 'الإجمالي:' : 'Total:'} {formatCurrency(totalAmount, currency, lang)}
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? `مبلغ التأمين المسترد (${currency})` : `Security Deposit (${currency})`}
                    </label>
                    <input
                      type="number"
                      value={deposit}
                      onChange={(e) => setDeposit(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="credit_card">💳 {lang === 'ar' ? 'بطاقة بنكية / مدى' : 'Card / POS'}</option>
                      <option value="cash">💵 {lang === 'ar' ? 'نقدي (كاش)' : 'Cash'}</option>
                      <option value="bank_transfer">🏦 {lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? 'حالة السداد' : 'Payment Status'}
                    </label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="paid">✅ {lang === 'ar' ? 'مسدد بالكامل' : 'Paid Full'}</option>
                      <option value="partial">⏳ {lang === 'ar' ? 'مسدد جزئياً' : 'Partially Paid'}</option>
                      <option value="pending">❌ {lang === 'ar' ? 'آجل / معلق' : 'Pending'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {lang === 'ar' ? `المبلغ المدفوع فعلياً (${currency})` : `Paid Amount (${currency})`}
                    </label>
                    <input
                      type="number"
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300"
                    />
                  </div>
                </div>
              </div>





              {/* Official Car Rental Clauses Accordion / Scroll Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{t.contractTerms}</span>
                </h4>

                <div className="max-h-48 overflow-y-auto pr-1 space-y-2 text-xs">
                  {(t.contractClausesList || []).map((clause: any, index: number) => (
                    <div key={clause.id || index} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 block mb-0.5 text-[11px]">
                        {index + 1}. {clause.title}
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{clause.text}</p>
                    </div>
                  ))}
                </div>

                {/* Handover Acknowledgment Box */}
                <div className="p-3 bg-blue-50/80 dark:bg-blue-950/50 rounded-lg border border-blue-300 dark:border-blue-800 text-xs">
                  <span className="font-black text-blue-900 dark:text-blue-200 block mb-1">
                    {t.handoverAcknowledgmentTitle}
                  </span>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                    "{t.handoverAcknowledgmentText}"
                  </p>
                </div>
              </div>

              {/* Fingerprint Capture Section */}
              <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-purple-900 dark:text-purple-200">
                        {lang === 'ar' ? 'بصمة المستأجر الرقمية (الإبهام)' : 'Lessee Digital Fingerprint'}
                      </h4>
                      <p className="text-[11px] text-purple-700 dark:text-purple-400">
                        {lang === 'ar' ? 'أخذ البصمة الرقمية عبر شاشة اللمس أو جهاز البصمة للتوثيق القضائي' : 'Capture biometric fingerprint for court verification'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFingerprintOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>{customerFingerprint ? (lang === 'ar' ? 'تحديث البصمة' : 'Re-capture Fingerprint') : (lang === 'ar' ? 'أخذ البصمة الآن' : 'Capture Fingerprint')}</span>
                  </button>
                </div>

                {customerFingerprint && (
                  <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800 w-fit">
                    <img src={customerFingerprint} alt="Fingerprint" className="h-10 object-contain" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'تمت إضافة البصمة الرسمية' : 'Fingerprint Captured'}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Digital Signature Pads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SignaturePad
                  onSave={setCustomerSignature}
                  lang={lang}
                  label={t.signatureCustomerLabel}
                />
                <SignaturePad
                  onSave={setAgentSignature}
                  lang={lang}
                  label={t.signatureAgentLabel}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs">
                  {(() => {
                    const selCust = customers.find((c) => c.id === selectedCustomerId);
                    if (selCust?.isBlacklisted) {
                      return (
                        <span className="text-rose-600 font-extrabold flex items-center gap-1">
                          <Ban className="w-4 h-4" />
                          <span>{lang === 'ar' ? 'ممنوع حفظ العقد: العميل محظور بالقائمة السوداء' : 'Save Blocked: Customer is Blacklisted'}</span>
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsWizardOpen(false);
                      setEditingContract(null);
                    }}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-semibold"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedCustomerId || !selectedCarId || Boolean(customers.find((c) => c.id === selectedCustomerId)?.isBlacklisted)}
                    className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
                    title={customers.find((c) => c.id === selectedCustomerId)?.isBlacklisted ? (lang === 'ar' ? 'العميل محظور في القائمة السوداء' : 'Customer is blacklisted') : ''}
                  >
                    {editingContract
                      ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')
                      : `${t.save} & ${t.print}`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Car Modal */}
      {returnContract && (() => {
        const startKm = returnContract.startMileage;
        const limitPerDay = returnContract.dailyMileageLimit || 250;
        const ratePerExtraKm = returnContract.excessMileageRate || 0.5;
        const totalAllowedKm = (returnContract.totalDays || 1) * limitPerDay;

        const actualDriven = Math.max(0, returnMileage - startKm);
        const excessKm = Math.max(0, actualDriven - totalAllowedKm);
        const excessFee = excessKm * ratePerExtraKm;
        const finalBillTotal = returnContract.totalAmount + excessFee;

        const prevPaid = returnContract.paidAmount ?? (returnContract.paymentStatus === 'paid' ? returnContract.totalAmount : returnContract.deposit || 0);
        const currentRemainingBeforeReturn = Math.max(0, finalBillTotal - prevPaid);
        const updatedPaid = Math.min(finalBillTotal, prevPaid + Number(returnAdditionalPaid || 0));
        const updatedRemaining = Math.max(0, finalBillTotal - updatedPaid);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full my-auto max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start flex-none bg-slate-50 dark:bg-slate-800/80">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                    {t.returnCar}: {returnContract.contractNumber}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {returnContract.carModel} ({returnContract.carPlate}) • {returnContract.totalDays} {lang === 'ar' ? 'أيام' : 'Days'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReturnContract(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.startMileage}
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${startKm} KM`}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t.endMileage} (KM) *
                    </label>
                    <input
                      type="number"
                      value={returnMileage}
                      onChange={(e) => setReturnMileage(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-black text-blue-600 dark:text-blue-400"
                    />
                  </div>
                </div>

                {/* Live Odometer Breakdown Box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>{t.drivenMileage}:</span>
                    <span className="font-extrabold">{actualDriven} KM</span>
                  </div>

                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>{t.allowedMileage} ({limitPerDay} KM/{lang === 'ar' ? 'يوم' : 'day'}):</span>
                    <span className="font-extrabold">{totalAllowedKm} KM</span>
                  </div>

                  <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold border-t border-slate-200 dark:border-slate-700 pt-2">
                    <span>{t.excessMileage}:</span>
                    <span>{excessKm} KM</span>
                  </div>

                  <div className="flex justify-between text-rose-700 dark:text-rose-400 font-bold">
                    <span>{t.excessMileageFee} (@ {ratePerExtraKm} {currency}/KM):</span>
                    <span>{formatCurrency(excessFee, currency, lang)}</span>
                  </div>

                  <div className="flex justify-between text-slate-900 dark:text-slate-100 font-black text-sm border-t border-slate-200 dark:border-slate-700 pt-2">
                    <span>{lang === 'ar' ? 'إجمالي العقد النهائي' : 'Final Total Bill'}:</span>
                    <span className="text-blue-600 dark:text-blue-400">{formatCurrency(finalBillTotal, currency, lang)}</span>
                  </div>
                </div>

                {/* Financial Settlement Box */}
                <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{t.paidAmount} ({lang === 'ar' ? 'المسدد سابقاً' : 'Previously Paid'}):</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(prevPaid, currency, lang)}</span>
                  </div>

                  {currentRemainingBeforeReturn > 0 && (
                    <div className="space-y-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-slate-800 dark:text-slate-200">
                          {lang === 'ar' ? 'المبلغ المحصل الآن عند الإرجاع' : 'Additional Payment Collected Now'}:
                        </label>
                        <button
                          type="button"
                          onClick={() => setReturnAdditionalPaid(currentRemainingBeforeReturn)}
                          className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-extrabold hover:bg-emerald-700 transition"
                        >
                          {lang === 'ar' ? 'تصفية المتبقي بالكامل' : 'Settle All'} ({formatCurrency(currentRemainingBeforeReturn, currency, lang)})
                        </button>
                      </div>

                      <input
                        type="number"
                        min="0"
                        max={currentRemainingBeforeReturn}
                        value={returnAdditionalPaid}
                        onChange={(e) => setReturnAdditionalPaid(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-sm font-black text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-emerald-200 dark:border-emerald-800/60 font-black text-xs">
                    <span className="text-slate-900 dark:text-slate-100">{t.remainingAmount}:</span>
                    <span className={updatedRemaining > 0 ? 'text-rose-600 dark:text-rose-400 text-sm font-extrabold' : 'text-emerald-600 dark:text-emerald-400 text-sm font-extrabold'}>
                      {updatedRemaining > 0 ? formatCurrency(updatedRemaining, currency, lang) : `✓ ${lang === 'ar' ? 'خالص ومسدد بالكامل' : 'Fully Settled'}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 flex-none">
                <button
                  type="button"
                  onClick={() => setReturnContract(null)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleProcessReturn}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition"
                >
                  {t.confirm}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Printable Modal */}
      <PrintContractModal
        isOpen={!!printContract || isBlankContractModalOpen}
        onClose={() => {
          setPrintContract(null);
          setIsBlankContractModalOpen(false);
        }}
        contract={printContract}
        customers={customers}
        cars={cars}
        settings={settings}
        lang={lang}
        isBlank={isBlankContractModalOpen}
      />

      {/* Camera Capture Modal inside Wizard */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={setCustomerPhotoUrl}
        lang={lang}
        title={t.photo}
      />

      {/* Fingerprint Sensor Capture Modal */}
      <FingerprintCaptureModal
        isOpen={isFingerprintOpen}
        onClose={() => setIsFingerprintOpen(false)}
        onSave={setCustomerFingerprint}
        lang={lang}
        title={lang === 'ar' ? 'أخذ بصمة المستأجر الرقمية' : 'Capture Lessee Fingerprint'}
      />

      {/* Vehicle Handover Receipt Modal */}
      <VehicleHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => {
          setIsHandoverModalOpen(false);
          setIsHandoverBlank(false);
        }}
        customers={customers}
        cars={cars}
        settings={settings}
        lang={lang}
        onSaveHandover={onSaveHandoverReceipt}
        initialData={selectedHandoverReceipt}
        isBlank={isHandoverBlank}
      />
    </div>
  );
};
