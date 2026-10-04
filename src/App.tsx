import React, { useState, useEffect } from 'react';
import {
  initialCustomers,
  initialCars,
  initialDrivers,
  initialContracts,
  initialInvoices,
  initialSales,
  initialDeliveries,
  initialMaintenanceRecords as initialMaintenance,
  initialSettings,
  initialUsers,
  initialShiftLogs,
  initialCorporateContracts,
  initialSystemConfig,
  initialBookings,
  initialDriverAttendances,
  initialTrafficFines,
  initialTreasuries,
  initialTreasuryTransactions,
  initialTreasuryTransfers,
  initialOperatingExpenses,
} from './data/initialData';
import {
  AppSettings,
  Car,
  CarSale,
  Currency,
  Customer,
  DeliveryService,
  Driver,
  Invoice,
  Language,
  MaintenanceRecord,
  RentalContract,
  SystemUser,
  DailyShiftLog,
  CorporateContract,
  SystemConfig,
  CarBooking,
  VehicleHandoverReceipt,
  DriverAttendance,
  VehicleInspectionReport,
  PaymentVoucher,
  TrafficFine,
  TreasuryAccount,
  TreasuryTransaction,
  TreasuryTransfer,
  OperatingExpense,
} from './types';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { CustomerModule } from './components/CustomerModule';
import { CarModule } from './components/CarModule';
import { EmployeeModule } from './components/EmployeeModule';
import { RentalModule } from './components/RentalModule';
import { InvoiceModule } from './components/InvoiceModule';
import { TrafficFinesModule } from './components/TrafficFinesModule';
import { TreasuryModule } from './components/TreasuryModule';
import { SalesModule } from './components/SalesModule';
import { DeliveryModule } from './components/DeliveryModule';
import { MaintenanceModule } from './components/MaintenanceModule';
import { FinanceModule } from './components/FinanceModule';
import { DeveloperModule } from './components/DeveloperModule';
import { CorporateModule } from './components/CorporateModule';
import { SystemConfigModule } from './components/SystemConfigModule';
import { BookingModule } from './components/BookingModule';
import { VehicleRoiModule } from './components/VehicleRoiModule';
import { AuditLogModule } from './components/AuditLogModule';
import { SmartRadarModal } from './components/SmartRadarModal';
import { AuthModal } from './components/AuthModal';
import { LoginScreen } from './components/LoginScreen';
import { InactivityWarningModal } from './components/InactivityWarningModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { SmartTypingAssistant } from './components/SmartTypingAssistant';
import { getSavedPrintSettings, applyPrintSettingsToDOM } from './utils/printSettings';
import { logAuditEvent } from './utils/auditLogger';
import { setupGlobalInputSanitizer } from './utils/inputAssistant';

function safeLoad<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed ?? fallback;
  } catch (err) {
    console.warn(`Failed to parse localStorage key "${key}", falling back:`, err);
    return fallback;
  }
}

function safeLoadSession<T>(key: string, fallback: T): T {
  try {
    const saved = sessionStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed ?? fallback;
  } catch (err) {
    return fallback;
  }
}

const saveDebounceTimers: Record<string, any> = {};

function safeSave(key: string, value: any, immediate = false): boolean {
  if (immediate) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[AutoFleet Storage] Failed to write key "${key}":`, err);
      return false;
    }
  }

  if (saveDebounceTimers[key]) {
    clearTimeout(saveDebounceTimers[key]);
  }

  saveDebounceTimers[key] = setTimeout(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[AutoFleet Storage] Failed to write key "${key}":`, err);
    }
  }, 100);

  return true;
}

export default function App() {
  // State Initialization from localStorage or initialData
  const [customers, setCustomers] = useState<Customer[]>(() => safeLoad('autofleet_customers', initialCustomers));
  const [cars, setCars] = useState<Car[]>(() => safeLoad('autofleet_cars', initialCars));
  const [drivers, setDrivers] = useState<Driver[]>(() => safeLoad('autofleet_drivers', initialDrivers));
  const [contracts, setContracts] = useState<RentalContract[]>(() => safeLoad('autofleet_contracts', initialContracts));
  const [invoices, setInvoices] = useState<Invoice[]>(() => safeLoad('autofleet_invoices', initialInvoices));
  const [sales, setSales] = useState<CarSale[]>(() => safeLoad('autofleet_sales', initialSales));
  const [deliveries, setDeliveries] = useState<DeliveryService[]>(() => safeLoad('autofleet_deliveries', initialDeliveries));
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() => safeLoad('autofleet_maintenance', initialMaintenance));
  const [settings, setSettings] = useState<AppSettings>(() => {
    const loaded = safeLoad<AppSettings>('autofleet_settings', initialSettings);
    if (!loaded.appName || loaded.appName.includes('AutoFleet Pro') || loaded.appName.includes('نظام إدارة السيارات والإيجار')) {
      loaded.appName = 'SHAKER MOTORS';
    }
    if (!loaded.organizationName || loaded.organizationName.includes('الأسطول المتقدم')) {
      loaded.organizationName = 'SHAKER MOTORS';
    }
    if (!loaded.currency) {
      loaded.currency = 'EGP';
    }
    return loaded;
  });
  const [users, setUsers] = useState<SystemUser[]>(() => safeLoad('autofleet_users', initialUsers));
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => safeLoadSession<SystemUser | null>('autofleet_session_user', null));
  const [logoutReason, setLogoutReason] = useState<'inactivity' | 'manual' | 'lock' | 'screen_closed' | null>(null);
  const [inactivityRemaining, setInactivityRemaining] = useState<number>(120);
  const [showInactivityWarning, setShowInactivityWarning] = useState<boolean>(false);
  const [shiftLogs, setShiftLogs] = useState<DailyShiftLog[]>(() => safeLoad('autofleet_shift_logs', initialShiftLogs));
  const [corporateContracts, setCorporateContracts] = useState<CorporateContract[]>(() => safeLoad('autofleet_corporate_contracts', initialCorporateContracts));
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => safeLoad('autofleet_system_config', initialSystemConfig));
  const [bookings, setBookings] = useState<CarBooking[]>(() => safeLoad('autofleet_bookings', initialBookings));
  const [handoverReceipts, setHandoverReceipts] = useState<VehicleHandoverReceipt[]>(() => safeLoad('autofleet_handover_receipts', []));
  const [driverAttendances, setDriverAttendances] = useState<DriverAttendance[]>(() => safeLoad('autofleet_driver_attendances', initialDriverAttendances));
  const [inspectionReports, setInspectionReports] = useState<VehicleInspectionReport[]>(() => safeLoad('autofleet_inspection_reports', []));
  const [paymentVouchers, setPaymentVouchers] = useState<PaymentVoucher[]>(() => safeLoad('autofleet_payment_vouchers', []));
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>(() => safeLoad('autofleet_traffic_fines', initialTrafficFines));
  const [treasuries, setTreasuries] = useState<TreasuryAccount[]>(() => safeLoad('autofleet_treasuries', initialTreasuries));
  const [treasuryTransactions, setTreasuryTransactions] = useState<TreasuryTransaction[]>(() => safeLoad('autofleet_treasury_transactions', initialTreasuryTransactions));
  const [treasuryTransfers, setTreasuryTransfers] = useState<TreasuryTransfer[]>(() => safeLoad('autofleet_treasury_transfers', initialTreasuryTransfers));
  const [operatingExpenses, setOperatingExpenses] = useState<OperatingExpense[]>(() => safeLoad('autofleet_operating_expenses', initialOperatingExpenses));

  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [globalTargetItem, setGlobalTargetItem] = useState<{ module: string; itemId: string } | null>(null);
  const [currency, setCurrency] = useState<Currency>(() => {
    const savedCurrency = safeLoad<Currency | null>('autofleet_currency', null);
    return savedCurrency || settings.currency || 'EGP';
  });
  const [lang, setLang] = useState<Language>(settings.defaultLang || 'ar');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);
  const [isRadarOpen, setIsRadarOpen] = useState<boolean>(false);
  const [appZoom, setAppZoom] = useState<number>(() => safeLoad('autofleet_app_zoom', 100));

  // Compute live radar alerts count
  const radarAlertsCount = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const expiringContracts = contracts.filter((c) => c.status === 'active' && c.endDate <= today).length;
    const overdueMaint = cars.filter((c) => c.status !== 'maintenance' && c.status !== 'sold' && c.currentMileage >= c.nextServiceMileage).length;
    const unpaidInvoices = invoices.filter((i) => i.paymentStatus !== 'paid' && i.remainingAmount > 0).length;
    return expiringContracts + overdueMaint + unpaidInvoices;
  }, [contracts, cars, invoices]);

  // Activity tracking ref to prevent rerendering/listeners teardown during typing
  const lastActivityRef = React.useRef<number>(Date.now());

  useEffect(() => {
    safeSave('autofleet_app_zoom', appZoom);
  }, [appZoom]);

  useEffect(() => {
    // Apply saved print settings (font size, margins, show/hide images) globally on load
    applyPrintSettingsToDOM(getSavedPrintSettings());

    // Setup Smart Input Sanitizer (Arabic numerals normalization, focus preservation, clipboard)
    const cleanupInputSanitizer = setupGlobalInputSanitizer();

    // Global keyboard shortcut Ctrl+K / Cmd+K for search (protect active inputs from shortcut interception)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        if (!isInputFocused) {
          e.preventDefault();
          setIsGlobalSearchOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      cleanupInputSanitizer();
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  useEffect(() => {
    if (settings.appName) {
      document.title = settings.appName;
    }
  }, [settings.appName]);

  // Sync to localStorage
  useEffect(() => {
    safeSave('autofleet_customers', customers);
  }, [customers]);

  useEffect(() => {
    safeSave('autofleet_cars', cars);
  }, [cars]);

  useEffect(() => {
    safeSave('autofleet_drivers', drivers);
  }, [drivers]);

  useEffect(() => {
    safeSave('autofleet_contracts', contracts);
  }, [contracts]);

  useEffect(() => {
    safeSave('autofleet_invoices', invoices);
  }, [invoices]);

  useEffect(() => {
    safeSave('autofleet_sales', sales);
  }, [sales]);

  useEffect(() => {
    safeSave('autofleet_deliveries', deliveries);
  }, [deliveries]);

  useEffect(() => {
    safeSave('autofleet_maintenance', maintenanceRecords);
  }, [maintenanceRecords]);

  useEffect(() => {
    safeSave('autofleet_settings', settings);
  }, [settings]);

  useEffect(() => {
    safeSave('autofleet_users', users);
  }, [users]);

  useEffect(() => {
    safeSave('autofleet_shift_logs', shiftLogs);
  }, [shiftLogs]);

  useEffect(() => {
    safeSave('autofleet_corporate_contracts', corporateContracts);
  }, [corporateContracts]);

  useEffect(() => {
    safeSave('autofleet_system_config', systemConfig);
  }, [systemConfig]);

  useEffect(() => {
    safeSave('autofleet_bookings', bookings);
  }, [bookings]);

  useEffect(() => {
    safeSave('autofleet_handover_receipts', handoverReceipts);
  }, [handoverReceipts]);

  useEffect(() => {
    safeSave('autofleet_driver_attendances', driverAttendances);
  }, [driverAttendances]);

  useEffect(() => {
    safeSave('autofleet_inspection_reports', inspectionReports);
  }, [inspectionReports]);

  useEffect(() => {
    safeSave('autofleet_traffic_fines', trafficFines);
  }, [trafficFines]);

  useEffect(() => {
    safeSave('autofleet_treasuries', treasuries);
  }, [treasuries]);

  useEffect(() => {
    safeSave('autofleet_treasury_transactions', treasuryTransactions);
  }, [treasuryTransactions]);

  useEffect(() => {
    safeSave('autofleet_treasury_transfers', treasuryTransfers);
  }, [treasuryTransfers]);

  useEffect(() => {
    safeSave('autofleet_operating_expenses', operatingExpenses);
  }, [operatingExpenses]);

  // Session Persistence & Inactivity / Screen Close Security Monitoring (30 Minutes)
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('autofleet_session_user', JSON.stringify(currentUser));
      localStorage.removeItem('autofleet_current_user'); // Ensure local storage does not bypass login
    } else {
      sessionStorage.removeItem('autofleet_session_user');
      localStorage.removeItem('autofleet_current_user');
    }
  }, [currentUser]);

  // 30-Minute Inactivity Auto-Logout System (Optimized with passive listeners & stable refs)
  useEffect(() => {
    if (!currentUser) {
      setShowInactivityWarning(false);
      return;
    }

    const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in ms
    const WARNING_THRESHOLD_MS = 2 * 60 * 1000;  // 2 minutes warning before auto-logout
    lastActivityRef.current = Date.now();

    const recordUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // User activity listeners (passive to never block keystrokes or scrolls)
    const activityEvents: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, recordUserActivity, { passive: true });
    });

    // Check inactivity every 2 seconds
    const intervalTimer = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remainingMs = INACTIVITY_TIMEOUT_MS - elapsed;

      if (remainingMs <= 0) {
        // 30 minutes expired with zero activity -> Force Logout & Lock
        setCurrentUser(null);
        sessionStorage.removeItem('autofleet_session_user');
        localStorage.removeItem('autofleet_current_user');
        setLogoutReason('inactivity');
        setShowInactivityWarning(false);
      } else if (remainingMs <= WARNING_THRESHOLD_MS) {
        setInactivityRemaining(Math.max(1, Math.ceil(remainingMs / 1000)));
        setShowInactivityWarning(true);
      } else {
        setShowInactivityWarning(false);
      }
    }, 2000);

    // Screen / Tab close cleanup
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('autofleet_session_user');
      localStorage.removeItem('autofleet_current_user');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(intervalTimer);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, recordUserActivity);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  const handleManualLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('autofleet_session_user');
    localStorage.removeItem('autofleet_current_user');
    setLogoutReason('manual');
    setShowInactivityWarning(false);
  };

  const handleLockScreen = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('autofleet_session_user');
    localStorage.removeItem('autofleet_current_user');
    setLogoutReason('lock');
    setShowInactivityWarning(false);
  };

  const handleLoginSuccess = (user: SystemUser) => {
    setCurrentUser(user);
    sessionStorage.setItem('autofleet_session_user', JSON.stringify(user));
    setLogoutReason(null);
    setShowInactivityWarning(false);
  };

  const handleStayLoggedIn = () => {
    setShowInactivityWarning(false);
  };

  // Handlers
  const handleAddCustomer = (c: Customer) => setCustomers([c, ...customers]);
  const handleUpdateCustomer = (c: Customer) =>
    setCustomers(customers.map((item) => (item.id === c.id ? c : item)));
  const handleDeleteCustomer = (id: string) =>
    setCustomers(customers.filter((item) => item.id !== id));

  const handleAddCar = (c: Car) => setCars((prev) => [c, ...prev]);
  const handleUpdateCar = (c: Car) =>
    setCars((prev) => prev.map((item) => (item.id === c.id ? c : item)));
  const handleDeleteCar = (id: string) =>
    setCars((prev) => prev.filter((item) => item.id !== id));
  const handleUpdateCarStatus = (carId: string, status: Car['status']) => {
    setCars((prev) => prev.map((item) => (item.id === carId ? { ...item, status } : item)));
  };

  const handleAddDriver = (d: Driver) => setDrivers([d, ...drivers]);
  const handleUpdateDriver = (d: Driver) =>
    setDrivers(drivers.map((item) => (item.id === d.id ? d : item)));
  const handleDeleteDriver = (id: string) =>
    setDrivers(drivers.filter((item) => item.id !== id));

  const handleCreateContract = (cnt: RentalContract) => setContracts([cnt, ...contracts]);
  const handleUpdateContract = (cnt: RentalContract) =>
    setContracts(contracts.map((item) => (item.id === cnt.id ? cnt : item)));
  const handleDeleteContract = (contractId: string) => {
    const targetContract = contracts.find((c) => c.id === contractId);
    if (targetContract && targetContract.status === 'active') {
      setCars((prev) =>
        prev.map((c) => (c.id === targetContract.carId ? { ...c, status: 'available' } : c))
      );
    }
    setContracts((prev) => prev.filter((c) => c.id !== contractId));
  };

  const handleAddInvoice = (inv: Invoice) => setInvoices([inv, ...invoices]);
  const handleUpdateInvoice = (inv: Invoice) =>
    setInvoices(invoices.map((item) => (item.id === inv.id ? inv : item)));
  const handleDeleteInvoice = (invId: string) =>
    setInvoices(invoices.filter((item) => item.id !== invId));

  const handleRecordSale = (s: CarSale) => setSales([s, ...sales]);
  const handleUpdateSale = (s: CarSale) =>
    setSales((prev) => prev.map((item) => (item.id === s.id ? s : item)));
  const handleDeleteSale = (saleId: string) => {
    const targetSale = sales.find((s) => s.id === saleId);
    if (targetSale) {
      setCars((prev) =>
        prev.map((c) => (c.id === targetSale.carId ? { ...c, status: 'available' } : c))
      );
    }
    setSales((prev) => prev.filter((s) => s.id !== saleId));
  };

  const handleAddDelivery = (d: DeliveryService) => setDeliveries([d, ...deliveries]);
  const handleUpdateDelivery = (d: DeliveryService) =>
    setDeliveries(deliveries.map((item) => (item.id === d.id ? d : item)));
  const handleDeleteDelivery = (deliveryId: string) =>
    setDeliveries((prev) => prev.filter((d) => d.id !== deliveryId));

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('autofleet_currency', JSON.stringify(newCurrency));
    setSettings((prev) => {
      const updated = { ...prev, currency: newCurrency };
      localStorage.setItem('autofleet_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('autofleet_settings', JSON.stringify(newSettings));
    if (newSettings.currency) {
      setCurrency(newSettings.currency);
      localStorage.setItem('autofleet_currency', JSON.stringify(newSettings.currency));
    }
  };

  const handleAddMaintenanceRecord = (m: MaintenanceRecord) =>
    setMaintenanceRecords((prev) => [m, ...prev]);
  const handleUpdateMaintenanceRecord = (m: MaintenanceRecord) =>
    setMaintenanceRecords((prev) => prev.map((item) => (item.id === m.id ? m : item)));
  const handleDeleteMaintenanceRecord = (id: string) =>
    setMaintenanceRecords((prev) => prev.filter((item) => item.id !== id));

  const handleAddUser = (u: SystemUser) => setUsers([...users, u]);
  const handleUpdateUser = (u: SystemUser) =>
    setUsers(users.map((item) => (item.id === u.id ? u : item)));
  const handleDeleteUser = (userId: string) =>
    setUsers(users.filter((item) => item.id !== userId));

  // Driver Attendance Handlers
  const handleAddDriverAttendance = (att: DriverAttendance) =>
    setDriverAttendances((prev) => [att, ...prev]);
  const handleUpdateDriverAttendance = (att: DriverAttendance) =>
    setDriverAttendances((prev) => prev.map((item) => (item.id === att.id ? item : item)));
  const handleDeleteDriverAttendance = (id: string) =>
    setDriverAttendances((prev) => prev.filter((item) => item.id !== id));
  const handleBatchAddDriverAttendance = (atts: DriverAttendance[]) => {
    setDriverAttendances((prev) => {
      const datesAndDrivers = new Set(atts.map((a) => `${a.date}_${a.driverId}`));
      const filteredPrev = prev.filter((a) => !datesAndDrivers.has(`${a.date}_${a.driverId}`));
      return [...atts, ...filteredPrev];
    });
  };

  // Shift Logs Handlers
  const handleAddShiftLog = (log: DailyShiftLog) => setShiftLogs([log, ...shiftLogs]);
  const handleUpdateShiftLog = (log: DailyShiftLog) =>
    setShiftLogs(shiftLogs.map((item) => (item.id === log.id ? log : item)));
  const handleDeleteShiftLog = (id: string) =>
    setShiftLogs(shiftLogs.filter((item) => item.id !== id));

  // Corporate Contracts Handlers
  const handleAddCorporateContract = (c: CorporateContract) =>
    setCorporateContracts([c, ...corporateContracts]);
  const handleUpdateCorporateContract = (c: CorporateContract) =>
    setCorporateContracts(corporateContracts.map((item) => (item.id === c.id ? c : item)));
  const handleDeleteCorporateContract = (id: string) =>
    setCorporateContracts(corporateContracts.filter((item) => item.id !== id));

  // Handover Receipts Handler
  const handleSaveHandoverReceipt = (receipt: VehicleHandoverReceipt) => {
    const existingIndex = handoverReceipts.findIndex((r) => r.id === receipt.id);
    if (existingIndex >= 0) {
      const updated = [...handoverReceipts];
      updated[existingIndex] = receipt;
      setHandoverReceipts(updated);
    } else {
      setHandoverReceipts([receipt, ...handoverReceipts]);
    }
  };

  // Inspection Reports Handlers
  const handleSaveInspectionReport = (report: VehicleInspectionReport) => {
    const existingIndex = inspectionReports.findIndex((r) => r.id === report.id);
    if (existingIndex >= 0) {
      const updated = [...inspectionReports];
      updated[existingIndex] = report;
      setInspectionReports(updated);
    } else {
      setInspectionReports([report, ...inspectionReports]);
    }
  };

  const handleDeleteInspectionReport = (id: string) => {
    setInspectionReports((prev) => prev.filter((r) => r.id !== id));
  };

  // Booking Handlers
  const handleAddBooking = (b: CarBooking) => setBookings([b, ...bookings]);
  const handleUpdateBooking = (b: CarBooking) =>
    setBookings(bookings.map((item) => (item.id === b.id ? b : item)));
  const handleDeleteBooking = (id: string) =>
    setBookings(bookings.filter((item) => item.id !== id));

  // Traffic Fines Handlers (Item 6)
  const handleAddFine = (fineData: Omit<TrafficFine, 'id' | 'createdAt'>) => {
    const newFine: TrafficFine = {
      ...fineData,
      id: `fine_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTrafficFines((prev) => [newFine, ...prev]);

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'CREATE',
      module: 'fines',
      entityId: newFine.id,
      entityName: `${newFine.fineNumber} (${newFine.carPlateNumber})`,
      description: `تم تسجيل مخالفة مرورية جديدة بقيمة ${newFine.totalAmount} على المركبة ${newFine.carPlateNumber}`,
    });
  };

  const handleUpdateFine = (id: string, updates: Partial<TrafficFine>) => {
    setTrafficFines((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'UPDATE',
      module: 'fines',
      entityId: id,
      entityName: `Fine ${id}`,
      description: `تم تحديث بيانات وحالة المخالفة المرورية`,
    });
  };

  const handleDeleteFine = (id: string) => {
    setTrafficFines((prev) => prev.filter((f) => f.id !== id));

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'DELETE',
      module: 'fines',
      entityId: id,
      entityName: `Fine ${id}`,
      description: `تم حذف سجل المخالفة المرورية`,
    });
  };

  // ==========================================
  // Treasury & Cash Flow Handlers
  // ==========================================
  const handleAddTreasury = (treasuryData: Omit<TreasuryAccount, 'id' | 'createdAt'>) => {
    const newTreasury: TreasuryAccount = {
      ...treasuryData,
      id: `tr_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTreasuries((prev) => [newTreasury, ...prev]);

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'CREATE',
      module: 'treasury',
      entityId: newTreasury.id,
      entityName: newTreasury.name,
      description: `تم إنشاء خزينة/حساب بنكي جديد برصيد افتتاحي ${newTreasury.initialBalance}`,
    });
  };

  const handleUpdateTreasury = (updated: TreasuryAccount) => {
    setTreasuries((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'UPDATE',
      module: 'treasury',
      entityId: updated.id,
      entityName: updated.name,
      description: `تم تعديل بيانات الخزينة`,
    });
  };

  const handleDeleteTreasury = (id: string) => {
    const target = treasuries.find((t) => t.id === id);
    setTreasuries((prev) => prev.filter((t) => t.id !== id));

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'DELETE',
      module: 'treasury',
      entityId: id,
      entityName: target?.name || id,
      description: `تم حذف الخزينة من النظام`,
    });
  };

  const handleAddTreasuryTransaction = (trxData: Omit<TreasuryTransaction, 'id' | 'createdAt'>) => {
    const newTrx: TreasuryTransaction = {
      ...trxData,
      id: `trx_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTreasuries((prev) =>
      prev.map((tr) => {
        if (tr.id === trxData.treasuryId) {
          const delta = trxData.type === 'inflow' ? Number(trxData.amount) : -Number(trxData.amount);
          return {
            ...tr,
            currentBalance: Number(tr.currentBalance) + delta,
          };
        }
        return tr;
      })
    );

    setTreasuryTransactions((prev) => [newTrx, ...prev]);

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'CREATE',
      module: 'treasury',
      entityId: newTrx.id,
      entityName: newTrx.transactionNumber,
      description: `تسجيل ${newTrx.type === 'inflow' ? 'سند قبض وارد' : 'سند صرف منصرف'} بمبلغ ${newTrx.amount}`,
    });
  };

  const handleDeleteTreasuryTransaction = (id: string) => {
    const target = treasuryTransactions.find((x) => x.id === id);
    if (!target) return;

    setTreasuries((prev) =>
      prev.map((tr) => {
        if (tr.id === target.treasuryId) {
          const reverseDelta = target.type === 'inflow' ? -Number(target.amount) : Number(target.amount);
          return {
            ...tr,
            currentBalance: Number(tr.currentBalance) + reverseDelta,
          };
        }
        return tr;
      })
    );

    setTreasuryTransactions((prev) => prev.filter((x) => x.id !== id));

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'DELETE',
      module: 'treasury',
      entityId: id,
      entityName: target.transactionNumber,
      description: `تم حذف السند المالي وإلغاء أثره على رصيد الخزينة`,
    });
  };

  const handleUpdateTreasuryTransaction = (updatedTrx: TreasuryTransaction) => {
    const old = treasuryTransactions.find((x) => x.id === updatedTrx.id);
    if (!old) return;

    setTreasuries((prev) =>
      prev.map((tr) => {
        let balance = Number(tr.currentBalance);
        if (tr.id === old.treasuryId) {
          const oldRevert = old.type === 'inflow' ? -Number(old.amount) : Number(old.amount);
          balance += oldRevert;
        }
        if (tr.id === updatedTrx.treasuryId) {
          const newDelta = updatedTrx.type === 'inflow' ? Number(updatedTrx.amount) : -Number(updatedTrx.amount);
          balance += newDelta;
        }
        return { ...tr, currentBalance: balance };
      })
    );

    setTreasuryTransactions((prev) =>
      prev.map((x) => (x.id === updatedTrx.id ? updatedTrx : x))
    );

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'UPDATE',
      module: 'treasury',
      entityId: updatedTrx.id,
      entityName: updatedTrx.transactionNumber,
      description: `تم تعديل بيانات السند المالي بمبلغ ${updatedTrx.amount}`,
    });
  };

  const handleAddTreasuryTransfer = (transferData: Omit<TreasuryTransfer, 'id' | 'createdAt'>) => {
    const newTransfer: TreasuryTransfer = {
      ...transferData,
      id: `trf_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const amt = Number(transferData.amount);
    setTreasuries((prev) =>
      prev.map((tr) => {
        if (tr.id === transferData.fromTreasuryId) {
          return { ...tr, currentBalance: Number(tr.currentBalance) - amt };
        }
        if (tr.id === transferData.toTreasuryId) {
          return { ...tr, currentBalance: Number(tr.currentBalance) + amt };
        }
        return tr;
      })
    );

    setTreasuryTransfers((prev) => [newTransfer, ...prev]);

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'CREATE',
      module: 'treasury',
      entityId: newTransfer.id,
      entityName: newTransfer.transferNumber,
      description: `تحويل داخلي بمبلغ ${amt} من ${transferData.fromTreasuryName} إلى ${transferData.toTreasuryName}`,
    });
  };

  const handleAddOperatingExpense = (expenseData: Omit<OperatingExpense, 'id' | 'createdAt'>) => {
    const newExpense: OperatingExpense = {
      ...expenseData,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTreasuries((prev) =>
      prev.map((tr) => {
        if (tr.id === expenseData.treasuryId) {
          return { ...tr, currentBalance: Number(tr.currentBalance) - Number(expenseData.totalWithTax) };
        }
        return tr;
      })
    );

    const matchingOutflow: TreasuryTransaction = {
      id: `trx_exp_${Date.now()}`,
      transactionNumber: `TRX-${newExpense.expenseNumber}`,
      treasuryId: expenseData.treasuryId,
      treasuryName: expenseData.treasuryName,
      type: 'outflow',
      category: 'operating_expense',
      amount: expenseData.totalWithTax,
      paymentMethod: expenseData.paymentMethod,
      date: expenseData.date,
      partyName: expenseData.beneficiary,
      referenceNumber: expenseData.invoiceNumber || newExpense.expenseNumber,
      description: `مصروف تشغيلي: ${expenseData.title}`,
      registeredBy: expenseData.registeredBy,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setOperatingExpenses((prev) => [newExpense, ...prev]);
    setTreasuryTransactions((prev) => [matchingOutflow, ...prev]);

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'CREATE',
      module: 'treasury',
      entityId: newExpense.id,
      entityName: newExpense.expenseNumber,
      description: `تسجيل مصروف تشغيلي بمبلغ ${newExpense.totalWithTax} (${newExpense.title})`,
    });
  };

  const handleDeleteOperatingExpense = (id: string) => {
    const target = operatingExpenses.find((x) => x.id === id);
    if (!target) return;

    setTreasuries((prev) =>
      prev.map((tr) => {
        if (tr.id === target.treasuryId) {
          return { ...tr, currentBalance: Number(tr.currentBalance) + Number(target.totalWithTax) };
        }
        return tr;
      })
    );

    setTreasuryTransactions((prev) =>
      prev.filter((x) => x.referenceNumber !== target.expenseNumber && x.referenceNumber !== target.invoiceNumber)
    );

    setOperatingExpenses((prev) => prev.filter((x) => x.id !== id));

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'DELETE',
      module: 'treasury',
      entityId: id,
      entityName: target.expenseNumber,
      description: `تم حذف المصروف التشغيلي واسترداد قيمته لرصيد الخزينة`,
    });
  };

  const handleUpdateTreasuryTransfer = (updatedTrf: TreasuryTransfer) => {
    const old = treasuryTransfers.find((x) => x.id === updatedTrf.id);
    if (!old) return;

    setTreasuries((prev) =>
      prev.map((tr) => {
        let balance = Number(tr.currentBalance);
        if (tr.id === old.fromTreasuryId) balance += Number(old.amount);
        if (tr.id === old.toTreasuryId) balance -= Number(old.amount);

        if (tr.id === updatedTrf.fromTreasuryId) balance -= Number(updatedTrf.amount);
        if (tr.id === updatedTrf.toTreasuryId) balance += Number(updatedTrf.amount);

        return { ...tr, currentBalance: balance };
      })
    );

    setTreasuryTransfers((prev) =>
      prev.map((x) => (x.id === updatedTrf.id ? updatedTrf : x))
    );

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'UPDATE',
      module: 'treasury',
      entityId: updatedTrf.id,
      entityName: updatedTrf.transferNumber,
      description: `تم تعديل التحويل المالي رقم ${updatedTrf.transferNumber}`,
    });
  };

  const handleDeleteTreasuryTransfer = (id: string) => {
    const target = treasuryTransfers.find((x) => x.id === id);
    if (!target) return;

    const amt = Number(target.amount);
    setTreasuries((prev) =>
      prev.map((tr) => {
        if (tr.id === target.fromTreasuryId) {
          return { ...tr, currentBalance: Number(tr.currentBalance) + amt };
        }
        if (tr.id === target.toTreasuryId) {
          return { ...tr, currentBalance: Number(tr.currentBalance) - amt };
        }
        return tr;
      })
    );

    setTreasuryTransfers((prev) => prev.filter((x) => x.id !== id));

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'DELETE',
      module: 'treasury',
      entityId: id,
      entityName: target.transferNumber,
      description: `تم إلغاء وحذف التحويل المالي واسترجاع الرصيد للخزينة المصدر`,
    });
  };

  const handleUpdateOperatingExpense = (updatedExp: OperatingExpense) => {
    const old = operatingExpenses.find((x) => x.id === updatedExp.id);
    if (!old) return;

    setTreasuries((prev) =>
      prev.map((tr) => {
        let balance = Number(tr.currentBalance);
        if (tr.id === old.treasuryId) {
          balance += Number(old.totalWithTax);
        }
        if (tr.id === updatedExp.treasuryId) {
          balance -= Number(updatedExp.totalWithTax);
        }
        return { ...tr, currentBalance: balance };
      })
    );

    setOperatingExpenses((prev) =>
      prev.map((x) => (x.id === updatedExp.id ? updatedExp : x))
    );

    setTreasuryTransactions((prev) =>
      prev.map((x) => {
        if (x.referenceNumber === old.expenseNumber || x.referenceNumber === old.invoiceNumber) {
          return {
            ...x,
            treasuryId: updatedExp.treasuryId,
            treasuryName: updatedExp.treasuryName,
            amount: updatedExp.totalWithTax,
            paymentMethod: updatedExp.paymentMethod,
            date: updatedExp.date,
            partyName: updatedExp.beneficiary,
            description: `مصروف تشغيلي: ${updatedExp.title}`,
          };
        }
        return x;
      })
    );

    logAuditEvent({
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System User',
      userRole: currentUser?.role || 'agent',
      action: 'UPDATE',
      module: 'treasury',
      entityId: updatedExp.id,
      entityName: updatedExp.expenseNumber,
      description: `تم تعديل المصروف التشغيلي وتحديث قيمته إلى ${updatedExp.totalWithTax}`,
    });
  };

  // Restore Database JSON Handler
  const handleRestoreDatabase = (jsonText: string): boolean => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed && parsed.localStorageDump) {
        Object.entries(parsed.localStorageDump).forEach(([k, v]) => {
          if (typeof v === 'string') {
            localStorage.setItem(k, v);
          }
        });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const handleResetData = () => {
    if (currentUser?.role !== 'developer') {
      alert('عفواً، إعادة ضبط البيانات متاح فقط لمطور النظام (Developer).');
      return;
    }
    if (window.confirm('هل أنت تأكد من إعادة ضبط كافة البيانات بالكامل؟')) {
      localStorage.clear();
      setCustomers(initialCustomers);
      setCars(initialCars);
      setDrivers(initialDrivers);
      setContracts(initialContracts);
      setInvoices(initialInvoices);
      setSales(initialSales);
      setDeliveries(initialDeliveries);
      setMaintenanceRecords(initialMaintenance);
      setSettings(initialSettings);
      setUsers(initialUsers);
      setTrafficFines(initialTrafficFines);
      setTreasuries(initialTreasuries);
      setTreasuryTransactions(initialTreasuryTransactions);
      setTreasuryTransfers(initialTreasuryTransfers);
      setOperatingExpenses(initialOperatingExpenses);
      setCurrentUser(initialUsers[0]);
    }
  };

  const handleWipeDemoData = () => {
    if (currentUser?.role !== 'developer') {
      alert('عفواً، مسح البيانات التجريبية متاح فقط لمطور النظام (Developer).');
      return;
    }
    if (
      window.confirm(
        'تنبيه هام للمطور:\nهل أنت تأكد من مسح وإزالة جميع البيانات السابقة والتجريبية نهائياً (العملاء، السيارات، عقود الإيجار، الفواتير، المبيعات، الحجوزات...) والبدء بنظام نظيف وفارغ بالكامل؟'
      )
    ) {
      // Reset state collections to empty arrays
      setCustomers([]);
      setCars([]);
      setDrivers([]);
      setContracts([]);
      setInvoices([]);
      setSales([]);
      setDeliveries([]);
      setMaintenanceRecords([]);
      setShiftLogs([]);
      setCorporateContracts([]);
      setBookings([]);
      setHandoverReceipts([]);
      setTrafficFines([]);
      setTreasuries([]);
      setTreasuryTransactions([]);
      setTreasuryTransfers([]);
      setOperatingExpenses([]);

      // Clear localStorage items
      localStorage.setItem('autofleet_customers', JSON.stringify([]));
      localStorage.setItem('autofleet_cars', JSON.stringify([]));
      localStorage.setItem('autofleet_drivers', JSON.stringify([]));
      localStorage.setItem('autofleet_contracts', JSON.stringify([]));
      localStorage.setItem('autofleet_invoices', JSON.stringify([]));
      localStorage.setItem('autofleet_sales', JSON.stringify([]));
      localStorage.setItem('autofleet_deliveries', JSON.stringify([]));
      localStorage.setItem('autofleet_maintenance', JSON.stringify([]));
      localStorage.setItem('autofleet_shift_logs', JSON.stringify([]));
      localStorage.setItem('autofleet_corporate_contracts', JSON.stringify([]));
      localStorage.setItem('autofleet_bookings', JSON.stringify([]));
      localStorage.setItem('autofleet_handover_receipts', JSON.stringify([]));
      localStorage.setItem('autofleet_traffic_fines', JSON.stringify([]));
      localStorage.setItem('autofleet_treasuries', JSON.stringify([]));
      localStorage.setItem('autofleet_treasury_transactions', JSON.stringify([]));
      localStorage.setItem('autofleet_treasury_transfers', JSON.stringify([]));
      localStorage.setItem('autofleet_operating_expenses', JSON.stringify([]));

      alert('تم مسح وإزالة جميع البيانات التجريبية بنجاح! النظام الآن نظيف وفارغ تماماً وجاهز لاستقبال البيانات الحقيقية.');
    }
  };

  const handlePurgeDemoUsers = () => {
    if (currentUser?.role !== 'developer') {
      alert(lang === 'ar' ? 'عفواً، مسح المستخدمين متاح فقط لمطور النظام.' : 'Only developer can purge demo users.');
      return;
    }
    const demoIds = ['usr_dev_101', 'usr_adm_102', 'usr_agnt_103'];
    const demoUsernames = ['admin', 'agent'];
    const filtered = users.filter(
      (u) => !demoIds.includes(u.id) && !demoUsernames.includes(u.username.toLowerCase())
    );

    if (filtered.length === 0) {
      const defaultDev: SystemUser = {
        id: `usr_dev_${Date.now()}`,
        username: 'dev',
        passwordHash: 'dev123',
        fullName: 'Master Developer',
        role: 'developer',
        active: true,
        createdAt: new Date().toISOString().split('T')[0],
        permissions: initialUsers[0].permissions,
      };
      setUsers([defaultDev]);
      safeSave('autofleet_users', [defaultDev]);
      alert(
        lang === 'ar'
          ? 'تم مسح المستخدمين التجريبيين والإبقاء على حساب المطور الرئيسي (اسم المستخدم: dev / كلمة المرور: dev123).'
          : 'Demo users purged. Master developer account preserved (dev / dev123).'
      );
    } else {
      setUsers(filtered);
      safeSave('autofleet_users', filtered);
      alert(
        lang === 'ar'
          ? 'تم مسح المستخدمين التجريبيين بنجاح والإبقاء على حساباتك الحقيقية.'
          : 'Demo users purged successfully.'
      );
    }
  };

  // Requirement: Do not allow opening the program until username & password are entered
  if (!currentUser) {
    return (
      <LoginScreen
        users={users}
        settings={settings}
        lang={lang}
        onLanguageChange={setLang}
        logoutReason={logoutReason}
        onLoginSuccess={handleLoginSuccess}
        onRestoreDevAccount={() => {
          const devAcc: SystemUser = {
            id: `usr_dev_${Date.now()}`,
            username: 'dev',
            passwordHash: 'dev123',
            fullName: 'Master Developer',
            role: 'developer',
            active: true,
            createdAt: new Date().toISOString().split('T')[0],
            permissions: initialUsers[0].permissions,
          };
          setUsers([devAcc]);
          safeSave('autofleet_users', [devAcc]);
        }}
      />
    );
  }

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={appZoom !== 100 ? { zoom: `${appZoom}%` } : undefined}
      className="min-h-screen bg-[#f0f2f5] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased flex flex-col selection:bg-blue-600 selection:text-white transition-all duration-150"
    >
      {/* Top Bar Navigation */}
      <Navbar
        settings={settings}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleManualLogout}
        onLock={handleLockScreen}
        onUpdateSettings={handleUpdateSettings}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        onOpenRadar={() => setIsRadarOpen(true)}
        radarAlertsCount={radarAlertsCount}
        lang={lang}
        onLanguageChange={setLang}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        appZoom={appZoom}
        onZoomChange={setAppZoom}
      />

      {/* Body Content with Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] w-full mx-auto">
        <Sidebar
          currentModule={currentModule}
          onNavigate={setCurrentModule}
          currentUser={currentUser}
          lang={lang}
          onLock={handleLockScreen}
          onLogout={handleManualLogout}
        />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {currentModule === 'dashboard' && (
            <DashboardOverview
              cars={cars}
              customers={customers}
              contracts={contracts}
              deliveries={deliveries}
              fines={trafficFines}
              settings={settings}
              currency={currency}
              lang={lang}
              onNavigate={setCurrentModule}
            />
          )}

          {currentModule === 'bookings' && (
            <BookingModule
              bookings={bookings}
              cars={cars}
              customers={customers}
              currency={currency}
              lang={lang}
              selectedBookingId={globalTargetItem?.module === 'bookings' ? globalTargetItem.itemId : undefined}
              onClearTarget={() => setGlobalTargetItem(null)}
              onAddBooking={handleAddBooking}
              onUpdateBooking={handleUpdateBooking}
              onDeleteBooking={handleDeleteBooking}
              onCreateContractFromBooking={handleCreateContract}
            />
          )}

          {currentModule === 'customers' && (
            <CustomerModule
              customers={customers}
              contracts={contracts}
              invoices={invoices}
              vouchers={paymentVouchers}
              settings={settings}
              currency={currency}
              selectedCustomerId={globalTargetItem?.module === 'customers' ? globalTargetItem.itemId : undefined}
              onClearTarget={() => setGlobalTargetItem(null)}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              lang={lang}
            />
          )}

          {currentModule === 'cars' && (
            <CarModule
              cars={cars}
              selectedCarId={globalTargetItem?.module === 'cars' ? globalTargetItem.itemId : undefined}
              onClearTarget={() => setGlobalTargetItem(null)}
              onAddCar={handleAddCar}
              onUpdateCar={handleUpdateCar}
              onDeleteCar={handleDeleteCar}
              settings={settings}
              inspectionReports={inspectionReports}
              onSaveInspectionReport={handleSaveInspectionReport}
              onDeleteInspectionReport={handleDeleteInspectionReport}
              currency={currency}
              lang={lang}
              onAddMaintenanceRecord={handleAddMaintenanceRecord}
            />
          )}

          {currentModule === 'drivers' && (
            <EmployeeModule
              drivers={drivers}
              selectedDriverId={globalTargetItem?.module === 'employees' || globalTargetItem?.module === 'drivers' ? globalTargetItem.itemId : undefined}
              onClearTarget={() => setGlobalTargetItem(null)}
              attendances={driverAttendances}
              settings={settings}
              onAddDriver={handleAddDriver}
              onUpdateDriver={handleUpdateDriver}
              onDeleteDriver={handleDeleteDriver}
              onAddAttendance={handleAddDriverAttendance}
              onUpdateAttendance={handleUpdateDriverAttendance}
              onDeleteAttendance={handleDeleteDriverAttendance}
              onBatchAddAttendance={handleBatchAddDriverAttendance}
              lang={lang}
            />
          )}

          {currentModule === 'corporate' && (
            <CorporateModule
              shiftLogs={shiftLogs}
              corporateContracts={corporateContracts}
              drivers={drivers}
              cars={cars}
              settings={settings}
              lang={lang}
              selectedItemId={globalTargetItem?.module === 'corporate' ? globalTargetItem.itemId : undefined}
              onClearTarget={() => setGlobalTargetItem(null)}
              onAddShiftLog={handleAddShiftLog}
              onUpdateShiftLog={handleUpdateShiftLog}
              onDeleteShiftLog={handleDeleteShiftLog}
              onAddCorporateContract={handleAddCorporateContract}
              onUpdateCorporateContract={handleUpdateCorporateContract}
              onDeleteCorporateContract={handleDeleteCorporateContract}
            />
          )}

          {currentModule === 'system_config' && (
            currentUser?.role === 'developer' ? (
              <SystemConfigModule
                settings={settings}
                config={systemConfig}
                lang={lang}
                onUpdateConfig={setSystemConfig}
                onUpdateSettings={handleUpdateSettings}
                onRestoreDatabase={handleRestoreDatabase}
              />
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center space-y-3">
                <h3 className="font-bold text-amber-900 dark:text-amber-200 text-lg">
                  {lang === 'ar' ? 'صلاحية محصورة بالمطور فقط' : 'Developer Access Only'}
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {lang === 'ar'
                    ? 'عفواً، استخدام تهيئة النظام والربط متاح لمطور النظام (Developer) فقط.'
                    : 'Access to System Configuration & Integrations is restricted to the Developer role.'}
                </p>
              </div>
            )
          )}

          {currentModule === 'contracts' && (
            <RentalModule
              contracts={contracts}
              cars={cars}
              customers={customers}
              drivers={drivers}
              settings={settings}
              selectedContractId={globalTargetItem?.module === 'contracts' ? globalTargetItem.itemId : undefined}
              onClearTarget={() => setGlobalTargetItem(null)}
              onAddContract={handleCreateContract}
              onUpdateContract={handleUpdateContract}
              onDeleteContract={handleDeleteContract}
              onUpdateCarStatus={handleUpdateCarStatus}
              handoverReceipts={handoverReceipts}
              onSaveHandoverReceipt={handleSaveHandoverReceipt}
              currency={currency}
              lang={lang}
            />
          )}

          {currentModule === 'invoices' && (
            <InvoiceModule
              invoices={invoices}
              settings={settings}
              selectedInvoiceId={globalTargetItem?.module === 'invoices' ? globalTargetItem.itemId : undefined}
              onClearTarget={() => setGlobalTargetItem(null)}
              onAddInvoice={handleAddInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              lang={lang}
            />
          )}

          {currentModule === 'treasury' && (
            <TreasuryModule
              treasuries={treasuries}
              transactions={treasuryTransactions}
              transfers={treasuryTransfers}
              expenses={operatingExpenses}
              onAddTreasury={handleAddTreasury}
              onUpdateTreasury={handleUpdateTreasury}
              onDeleteTreasury={handleDeleteTreasury}
              onAddTransaction={handleAddTreasuryTransaction}
              onUpdateTransaction={handleUpdateTreasuryTransaction}
              onDeleteTransaction={handleDeleteTreasuryTransaction}
              onAddTransfer={handleAddTreasuryTransfer}
              onUpdateTransfer={handleUpdateTreasuryTransfer}
              onDeleteTransfer={handleDeleteTreasuryTransfer}
              onAddExpense={handleAddOperatingExpense}
              onUpdateExpense={handleUpdateOperatingExpense}
              onDeleteExpense={handleDeleteOperatingExpense}
              contracts={contracts}
              invoices={invoices}
              cars={cars}
              settings={settings}
              currency={currency}
              lang={lang}
              currentUser={currentUser}
            />
          )}

          {currentModule === 'traffic_fines' && (
            <TrafficFinesModule
              fines={trafficFines}
              onAddFine={handleAddFine}
              onUpdateFine={handleUpdateFine}
              onDeleteFine={handleDeleteFine}
              cars={cars}
              customers={customers}
              contracts={contracts}
              currency={currency}
              lang={lang}
              settings={settings}
              currentUser={currentUser}
            />
          )}

          {currentModule === 'sales' && (
            <SalesModule
              sales={sales}
              cars={cars}
              settings={settings}
              onRecordSale={handleRecordSale}
              onUpdateSale={handleUpdateSale}
              onDeleteSale={handleDeleteSale}
              onUpdateCarStatus={handleUpdateCarStatus}
              currency={currency}
              lang={lang}
            />
          )}

          {currentModule === 'deliveries' && (
            <DeliveryModule
              deliveries={deliveries}
              cars={cars}
              drivers={drivers}
              settings={settings}
              selectedDeliveryId={globalTargetItem?.module === 'deliveries' ? globalTargetItem.itemId : undefined}
              onClearTarget={() => setGlobalTargetItem(null)}
              onAddDelivery={handleAddDelivery}
              onUpdateDelivery={handleUpdateDelivery}
              onDeleteDelivery={handleDeleteDelivery}
              currency={currency}
              lang={lang}
            />
          )}

          {currentModule === 'maintenance' && (
            <MaintenanceModule
              records={maintenanceRecords}
              cars={cars}
              onAddRecord={handleAddMaintenanceRecord}
              onUpdateRecord={handleUpdateMaintenanceRecord}
              onDeleteRecord={handleDeleteMaintenanceRecord}
              onUpdateCarStatus={handleUpdateCarStatus}
              onUpdateCar={handleUpdateCar}
              currency={currency}
              lang={lang}
            />
          )}

          {currentModule === 'finance' && (
            <FinanceModule
              contracts={contracts}
              sales={sales}
              deliveries={deliveries}
              cars={cars}
              drivers={drivers}
              settings={settings}
              currency={currency}
              lang={lang}
            />
          )}

          {currentModule === 'vehicle_roi' && (
            <VehicleRoiModule
              cars={cars}
              contracts={contracts}
              maintenanceRecords={maintenanceRecords}
              corporateContracts={corporateContracts}
              deliveries={deliveries}
              settings={settings}
              currency={currency}
              lang={lang}
            />
          )}

          {currentModule === 'audit_logs' && (
            <AuditLogModule
              settings={settings}
              lang={lang}
            />
          )}

          {currentModule === 'developer' && (
            currentUser?.role === 'developer' ? (
              <DeveloperModule
                settings={settings}
                users={users}
                currentUser={currentUser}
                onUpdateSettings={handleUpdateSettings}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                onPurgeDemoUsers={handlePurgeDemoUsers}
                onResetData={handleResetData}
                onWipeDemoData={handleWipeDemoData}
                lang={lang}
              />
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center space-y-3">
                <h3 className="font-bold text-amber-900 dark:text-amber-200 text-lg">
                  {lang === 'ar' ? 'صلاحية محصورة بالمطور فقط' : 'Developer Access Only'}
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {lang === 'ar'
                    ? 'عفواً، مركز المطور والترخيص والتحكم بالنظام متاح لمطور النظام (Developer) فقط.'
                    : 'Access to Developer Center is restricted to the Developer role.'}
                </p>
              </div>
            )
          )}
        </main>
      </div>

      {/* Global Search Modal across entire system */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        customers={customers}
        cars={cars}
        contracts={contracts}
        corporateContracts={corporateContracts}
        shiftLogs={shiftLogs}
        deliveries={deliveries}
        invoices={invoices}
        sales={sales}
        drivers={drivers}
        maintenanceRecords={maintenanceRecords}
        bookings={bookings}
        onNavigate={(mod, itemId) => {
          const mappedMod = mod === 'employees' ? 'drivers' : mod;
          setCurrentModule(mappedMod);
          if (itemId) {
            setGlobalTargetItem({ module: mod, itemId });
          } else {
            setGlobalTargetItem(null);
          }
          setIsGlobalSearchOpen(false);
        }}
        currency={currency}
        lang={lang}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        users={users}
        onLoginSuccess={(u) => handleLoginSuccess(u)}
        lang={lang}
      />

      {/* Inactivity Security Warning Modal (Auto-Logout after 30 mins) */}
      <InactivityWarningModal
        isOpen={showInactivityWarning}
        remainingSeconds={inactivityRemaining}
        onStayLoggedIn={handleStayLoggedIn}
        onLogoutNow={handleManualLogout}
        lang={lang}
      />

      {/* Smart Fleet & Operations Radar Modal */}
      {isRadarOpen && (
        <SmartRadarModal
          cars={cars}
          contracts={contracts}
          customers={customers}
          drivers={drivers}
          invoices={invoices}
          corporateContracts={corporateContracts}
          settings={settings}
          currency={currency}
          lang={lang}
          onClose={() => setIsRadarOpen(false)}
          onNavigate={(mod) => {
            setCurrentModule(mod);
            setIsRadarOpen(false);
          }}
        />
      )}

      {/* Universal Smart Typing Assistant & Keypad Tool */}
      <SmartTypingAssistant lang={lang} />
    </div>
  );
}
