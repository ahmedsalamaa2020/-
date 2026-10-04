export type Language = 'ar' | 'en';

export type Currency = 'EGP' | 'SAR' | 'USD' | 'IQD' | 'AED' | 'EUR';

export type UserRole = 'developer' | 'admin' | 'agent';

export interface UserPermissions {
  canEdit: boolean; // صلاحية التعديل
  canDelete: boolean; // صلاحية المسح / الحذف
  canAdd: boolean; // صلاحية إضافة جديد
  allowedModules: {
    dashboard: boolean;
    customers: boolean;
    cars: boolean;
    bookings: boolean;
    rentals: boolean;
    contracts?: boolean;
    corporate: boolean;
    sales: boolean;
    deliveries: boolean;
    maintenance: boolean;
    invoices: boolean;
    finance: boolean;
    treasury?: boolean;
    traffic_fines?: boolean;
    vehicle_roi?: boolean;
    audit_logs?: boolean;
    drivers?: boolean;
    employees: boolean;
    systemConfig: boolean;
    system_config?: boolean;
    developer: boolean;
  };
}

export function getDefaultPermissions(role: UserRole): UserPermissions {
  if (role === 'developer') {
    return {
      canEdit: true,
      canDelete: true,
      canAdd: true,
      allowedModules: {
        dashboard: true,
        customers: true,
        cars: true,
        bookings: true,
        rentals: true,
        contracts: true,
        corporate: true,
        sales: true,
        deliveries: true,
        maintenance: true,
        invoices: true,
        finance: true,
        treasury: true,
        traffic_fines: true,
        vehicle_roi: true,
        audit_logs: true,
        drivers: true,
        employees: true,
        systemConfig: true,
        system_config: true,
        developer: true,
      },
    };
  }
  if (role === 'admin') {
    return {
      canEdit: true,
      canDelete: true,
      canAdd: true,
      allowedModules: {
        dashboard: true,
        customers: true,
        cars: true,
        bookings: true,
        rentals: true,
        contracts: true,
        corporate: true,
        sales: true,
        deliveries: true,
        maintenance: true,
        invoices: true,
        finance: true,
        treasury: true,
        traffic_fines: true,
        vehicle_roi: true,
        audit_logs: true,
        drivers: true,
        employees: true,
        systemConfig: false, // خاص بالمطور فقط
        system_config: false,
        developer: false, // خاص بالمطور فقط
      },
    };
  }
  // Agent / Employee
  return {
    canEdit: true,
    canDelete: false, // الافتراضي للموظف العادي عدم الحذف
    canAdd: true,
    allowedModules: {
      dashboard: true,
      customers: true,
      cars: true,
      bookings: true,
      rentals: true,
      contracts: true,
      corporate: true,
      sales: true,
      deliveries: true,
      maintenance: true,
      invoices: true,
      finance: false,
      treasury: false,
      traffic_fines: false,
      vehicle_roi: false,
      audit_logs: false,
      drivers: false,
      employees: false,
      systemConfig: false, // خاص بالمطور فقط
      system_config: false,
      developer: false, // خاص بالمطور فقط
    },
  };
}

export interface SystemUser {
  id: string;
  username: string;
  passwordHash: string; // Plaintext representation for local admin display or auth comparison
  fullName: string;
  role: UserRole;
  phone?: string;
  active: boolean;
  createdAt: string;
  permissions?: UserPermissions;
}

export interface VatRate {
  id: string;
  name: string;
  rate: number; // e.g. 15 for 15%
  isDefault?: boolean;
}

export interface AppSettings {
  appName: string;
  appDescription: string;
  logoUrl: string;
  primaryColor: string;
  currency: Currency;
  defaultLang: Language;
  organizationName: string;
  contactPhone: string;
  address: string;
  commercialRegistration: string;
  taxId: string;
  // VAT Control
  vatEnabled: boolean;
  defaultVatRate: number;
  vatRates: VatRate[];
  // Rental Settings
  defaultRentalPeriodDays: number;
  recordOdometer: boolean;
  excessMileageCharge: number;
  dailyMileageLimit?: number; // حد المسافة اليومي الافتراضي (كم/يوم)
  hourlyDelayFee?: number; // قيمة ساعة التأخير الافتراضية
  weeklyDiscountPercent?: number; // نسبة خصم الحجز الأسبوعي (7 أيام فأكثر)
  monthlyDiscountPercent?: number; // نسبة خصم الحجز الشهري (30 يوم فأكثر)
  rentalExpiryReminderDays: number;
  showLoginDemoUsers?: boolean; // إظهار أو إخفاء الحسابات السريعة في شاشة الدخول
  // Financial Settings
  defaultRentalPrice: number;
  enabledPaymentMethods: {
    cash: boolean;
    creditCard: boolean;
    bankTransfer: boolean;
    check: boolean;
  };
  invoicePrefix: string;
  // Maintenance Settings
  maintenanceIntervalKm: number;
  autoMaintenanceAlerts: boolean;
  serviceTypes: string[];
  // Driver Management Settings
  licenseExpiryReminderDays: number;
  enableDriverRating: boolean;
  // Notification Settings
  notificationChannels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  notificationEmail?: string;
  notificationPhone?: string;
  // License & Authority
  licenseKey: string;
  licenseStatus: 'active' | 'suspended' | 'expired';
  licenseExpiry: string;
  isLifetimeLicense?: boolean;
  licenseType?: 'lifetime' | 'annual' | 'monthly' | 'trial';
  licenseAuthorityName: string;
  allowUserRegistration: boolean;
}

export type CustomerServiceType = 'rental' | 'delivery' | 'sales' | 'corporate' | 'individual';

export interface CustomerRating {
  id: string;
  customerId: string;
  contractId?: string;
  bookingId?: string;
  rating: number; // 1 to 5 stars
  comment?: string;
  ratedBy?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationalId: string;
  jobTitle?: string; // الوظيفة / المهنة / جهة العمل
  licenseNumber?: string; // رقم رخصة القيادة
  licenseExpiryDate?: string; // تاريخ انتهاء الرخصة
  nationality?: string; // الجنسية
  address: string;
  serviceType: CustomerServiceType;
  photoUrl?: string; // Captured via camera or uploaded
  docPhotoUrl?: string; // ID / Driving license photo
  notes?: string;
  ratings?: CustomerRating[];
  averageRating?: number;
  isBlacklisted?: boolean; // مدرج بالقائمة السوداء
  blacklistReason?: string; // سبب الإدراج في القائمة السوداء
  creditLimit?: number; // الحد الائتماني المسموح به
  vipLevel?: 'standard' | 'silver' | 'gold' | 'vip'; // تصنيف العميل
  createdAt: string;
}

export type CarStatus = 'available' | 'rented' | 'maintenance' | 'sold';

export type CarCategory = 'economy' | 'sedan' | 'suv' | 'luxury' | 'delivery_van';

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  chassisNumber: string;
  motorNumber?: string; // Engine / Motor Number
  ownerName?: string; // Car Owner Data
  ownerPhone?: string;
  ownerCivilId?: string;
  category: CarCategory;
  color: string;
  status: CarStatus;
  dailyRate: number;
  salePrice: number;
  currentMileage: number; // in KM
  maintenanceThreshold: number; // e.g., every 10,000 km
  lastServiceMileage: number;
  nextServiceMileage: number;
  photoUrl?: string;
  notes?: string;
}

export type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

export interface CarBooking {
  id: string;
  bookingNumber: string;
  carId: string;
  carPlate: string;
  carModel: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  status: BookingStatus;
  dailyRate: number;
  totalDays: number;
  totalAmount: number;
  deposit?: number;
  customerRating?: number; // 1-5 stars
  customerRatingNotes?: string;
  notes?: string;
  createdAt: string;
}

export type DriverStatus = 'available' | 'on_trip' | 'off_duty' | 'active' | 'inactive' | 'on_leave';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave' | 'on_duty_trip';

export interface DriverAttendance {
  id: string;
  driverId: string;
  driverName: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // e.g. "08:00"
  checkOut?: string; // e.g. "17:00"
  status: AttendanceStatus;
  workHours?: number; // e.g. 8.5
  overtimeHours?: number; // e.g. 1.5
  notes?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface DriverRatingItem {
  id: string;
  driverId: string;
  rating: number; // 1 to 5
  comment?: string;
  ratedBy?: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  address?: string;
  status: DriverStatus;
  rating: number; // 1 to 5
  notes?: string;
  ratings?: DriverRatingItem[];
  averageRating?: number;
  totalTrips?: number;
  totalTripsCompleted?: number;
  nationalId?: string;
  role?: 'driver' | 'receptionist' | 'mechanic' | 'shift_manager' | 'admin';
  baseSalary?: number;
  photoUrl?: string;
  assignedCarId?: string;
}

export type ContractStatus = 'active' | 'completed' | 'cancelled' | 'overdue';

export interface RentalContract {
  id: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerNationalId?: string;
  customerJobTitle?: string;
  customerLicenseNumber?: string;
  customerLicenseExpiryDate?: string;
  customerNationality?: string;
  customerAddress?: string;
  customerEmail?: string;
  customerPhotoUrl?: string;
  customerDocPhotoUrl?: string;
  customerNotes?: string;
  customerServiceType?: string;
  carId: string;
  carModel: string;
  carPlate: string;
  driverId?: string;
  driverName?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  rentalDurationType?: 'days' | 'hours'; // نوع مدة التأجير: بالأيام أو بالساعات
  totalHours?: number; // إجمالي عدد ساعات التأجير في حال التأجير بالساعات
  hourlyRate?: number; // سعر الإيجار بالساعة
  dailyRate: number;
  totalDays: number;
  totalAmount: number;
  deposit: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: 'cash' | 'credit_card' | 'bank_transfer';
  paymentStatus: 'paid' | 'partial' | 'pending';
  startMileage: number;
  endMileage?: number;
  dailyMileageLimit?: number; // e.g., 250 KM per day
  excessMileageRate?: number; // fee per extra KM
  excessMileage?: number; // calculated extra KM
  excessMileageFee?: number; // calculated extra fee
  hourlyDelayFee?: number; // e.g., 100 EGP per hour delay
  carSalePrice?: number; // سعر السيارة الكامل / القيمة السوقية
  carValueSecurity?: number; // قيمة السيارة كأمانة وقت العقد
  lessorName?: string;
  lessorPhone?: string;
  contractCategory?: 'individual' | 'company'; // نوع العقد: أفراد أم شركات
  lessorTradeName?: string; // الاسم التجاري للشركة المالكة (المؤجر)
  lessorCR?: string; // السجل التجاري للمؤجر
  lessorAddress?: string; // عنوان المؤجر
  lessorRepresentative?: string; // يمثلها السيد (المؤجر)
  lessorRepTitle?: string; // بصفته (المؤجر)
  tenantTradeName?: string; // الاسم التجاري للشركة المستأجرة
  tenantCR?: string; // السجل التجاري للمستأجر
  tenantAddress?: string; // عنوان المستأجر
  tenantRepresentative?: string; // يمثلها السيد (المستأجر)
  tenantRepTitle?: string; // بصفته (المستأجر)
  monthlyRentRate?: number; // قيمة الإيجار الشهري
  jurisdictionCourt?: string; // محاكم الاختصاص
  carBrand?: string; // ماركة السيارة
  carModelName?: string; // موديل السيارة
  carYear?: number; // سنة الصنع
  carColor?: string; // اللون
  carChassisNumber?: string; // رقم الشاسيه
  carEngineNumber?: string; // رقم الموتور / المحرك
  carCategory?: string; // فئة السيارة
  carOwnerName?: string; // اسم مالك السيارة
  carOwnerCivilId?: string; // رقم الهوية / السجل لمالك السيارة
  carOwnerPhone?: string; // هاتف مالك السيارة
  guarantorName?: string;
  guarantorNationalId?: string;
  guarantorPhone?: string;
  guarantorAddress?: string;
  status: ContractStatus;
  customerSignature?: string; // Data URL string
  agentSignature?: string; // Data URL string
  guarantorSignature?: string; // Data URL string
  customerFingerprint?: string; // Fingerprint SVG/Data URL string
  guarantorFingerprint?: string;
  damagePoints?: DamagePoint[];
  termsAccepted: boolean;
  createdAt: string;
  notes?: string;
}

export interface DailyShiftLog {
  id: string;
  shiftDate: string; // YYYY-MM-DD
  tripType: 'go' | 'return' | 'go_and_return'; // ذهاب أو عودة أو ذهاب وعودة
  shiftName?: string; // اسم الوردية (مثلاً: وردية صباحية 07:30، وردية مسائية 16:30)
  fromLocation?: string; // نقطة الانطلاق
  toLocation?: string; // وجهة الوصول
  departureTime: string; // e.g. "07:30"
  arrivalTime: string; // e.g. "08:30"
  companyName: string;
  driverId: string;
  driverName: string;
  carId: string;
  carPlate: string;
  carModel: string;
  employeeCount: number; // عدد الموظفين المنقولين
  isCompleted?: boolean; // هل تمت الوردية بنجاح
  isDepartureDone?: boolean; // هل تم الانطلاق / الذهاب
  isReturnDone?: boolean; // هل تمت العودة
  completionStatus?: 'completed' | 'in_progress' | 'cancelled';
  notes?: string; // ملاحظات (تأخير – غياب موظف – عطل في السيارة)
  createdAt: string;
}

export interface CorporateVehicleItem {
  carType: string;
  model: string;
  plateNumber: string;
  chassisNumber?: string;
  engineNumber?: string;
  monthlyRate: number;
}

export interface CorporateContract {
  id: string;
  contractNumber: string;
  companyName: string; // الطرف الثاني (اسم الشركة)
  companyTaxId?: string;
  companyCR?: string; // السجل التجاري للمستأجر
  companyAddress?: string; // عنوان المستأجر
  companyRepName?: string; // يمثلها السيد (المستأجر)
  companyRepTitle?: string; // بصفته (المستأجر)
  companyRepNationalId?: string; // الرقم القومي لمسئول الشركة
  companyRepPhone?: string; // هاتف مسئول الشركة
  companyPhone: string;
  contactPerson: string;

  // الطرف الأول (المؤجر)
  lessorCompanyName?: string; // اسم الشركة المؤجرة
  lessorCR?: string; // السجل التجاري للمؤجر
  lessorAddress?: string; // عنوان المؤجر
  lessorRepName?: string; // يمثلها السيد (المؤجر)
  lessorRepTitle?: string; // بصفته (المؤجر)

  vehicles?: CorporateVehicleItem[]; // قائمة السيارات بالعقد
  fleetSize: number; // عدد السيارات
  employeeCount: number; // عدد الموظفين
  shiftDetails: string; // تفاصيل مواعيد الورديات
  monthlyPrice: number; // القيمة الشهرية الإجمالية
  startDate: string;
  endDate: string;
  durationMonths: number; // مدة العقد بالشهر
  replacementDays?: number; // أيام توفير سيارة بديلة (البند الخامس)
  jurisdictionCourt?: string; // محاكم الاختصاص (البند الثامن)

  witness1Name?: string;
  witness1NationalId?: string;
  witness2Name?: string;
  witness2NationalId?: string;

  autoRenew: boolean;
  status: 'active' | 'expired' | 'renewed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface SystemConfig {
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbStatus: 'connected' | 'testing' | 'disconnected';
  backupLastDate?: string;
  apiKeys: {
    whatsappApiKey: string;
    whatsappInstanceId: string;
    whatsappEnabled: boolean;
    smsApiKey: string;
    smsProvider: string;
    smsEnabled: boolean;
    gpsApiKey: string;
    gpsServerUrl: string;
    gpsEnabled: boolean;
    paymentGatewayApiKey: string;
    paymentProvider: string;
    paymentMode: 'sandbox' | 'live';
    paymentEnabled: boolean;
  };
}

export interface CarSale {
  id: string;
  invoiceNumber: string;
  carId: string;
  carModel: string;
  carPlate: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  chassisNumber?: string;
  engineNumber?: string;
  buyerName: string;
  buyerPhone: string;
  buyerNationalId: string;
  buyerAddress?: string;
  sellerName?: string;
  sellerNationalId?: string;
  sellerAddress?: string;
  saleDate: string;
  salePrice: number;
  paidDeposit?: number; // المبلغ المدفوع عند التوقيع
  remainingBalance?: number; // المبلغ المتبقي
  remainingDueDate?: string; // موعد سداد المبلغ المتبقي
  paymentMethod: 'cash' | 'bank_transfer' | 'installments' | 'cheque';
  paymentStatus: 'paid' | 'pending';
  salesAgentName: string;
  penaltyAmount?: number;
  jurisdictionCourt?: string;
  transferDeadline?: string; // مدة نقل الملكية بالمرور (مثال: 15 يوماً)
  contractType?: 'preliminary' | 'final'; // عقد بيع ابتدائي / نهائي
  witness1Name?: string; // اسم الشاهد الأول
  witness1NationalId?: string; // الرقم القومي للشاهد الأول
  witness1Phone?: string;
  witness1Signature?: string;
  witness2Name?: string; // اسم الشاهد الثاني
  witness2NationalId?: string; // الرقم القومي للشاهد الثاني
  witness2Phone?: string;
  witness2Signature?: string;
  notes?: string;
  buyerSignature?: string;
  sellerSignature?: string;
}

export type DeliveryStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface DeliveryService {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  cargoDescription: string; // Used as Passenger & Trip Details description
  passengerCount?: number;
  passengerNames?: string;
  tripType?: 'airport' | 'vip_chauffeur' | 'city_transfer' | 'corporate_commute';
  scheduledDate: string;
  scheduledTime: string;
  carId?: string;
  carPlate?: string;
  driverId?: string;
  driverName?: string;
  price: number;
  status: DeliveryStatus;
  paymentStatus: 'paid' | 'pending';
  notes?: string;
  createdAt: string;
  // Monthly Contract Subscription Features
  isMonthlyContract?: boolean;
  contractDurationMonths?: number; // e.g. 1, 3, 6, 12 months
  subscriptionFee?: number; // Monthly fee
  renewalType?: 'automatic' | 'manual';
  autoRenew?: boolean;
  contractStartDate?: string;
  contractEndDate?: string;
  contractStatus?: 'active' | 'expired' | 'renewed' | 'cancelled';
}

export type ServiceType = 'oil_change' | 'tires' | 'engine' | 'brakes' | 'inspection' | 'bodywork';

export interface MaintenanceRecord {
  id: string;
  carId: string;
  carModel: string;
  carPlate: string;
  serviceDate: string;
  mileageAtService: number;
  serviceType: ServiceType;
  cost: number;
  vendor: string;
  notes?: string;
  nextDueMileage: number;
  status?: 'pending' | 'in_progress' | 'completed';
  completedDate?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientPhone?: string;
  clientTaxId?: string;
  issueDate: string;
  dueDate?: string;
  serviceType: 'rental' | 'sales' | 'maintenance' | 'delivery' | 'general';
  items: InvoiceItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paymentMethod: 'cash' | 'credit_card' | 'bank_transfer' | 'check';
  notes?: string;
  createdAt: string;
}

export interface VehicleHandoverReceipt {
  id: string;
  receiptNumber: string;
  // Customer details
  customerId?: string;
  recipientName: string;
  address: string;
  nationalId: string;
  phone?: string;
  customerPhotoUrl?: string;
  customerSignature?: string;
  customerFingerprint?: string;

  // Vehicle details
  carId?: string;
  carPlate: string;
  carBrand: string;
  carModel: string;
  carChassis: string;
  carColor: string;

  // Date & Time
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;

  // Vehicle inventory checklist (كشف محتويات السيارة)
  checklist: {
    tank: string;
    tires: string;
    cassette: string;
    upholstery: string;
    hubcapsCount: string;
    fireExtinguisher: string;
    seatsCount: string;
  };

  // Financial & Fuel (Optional)
  monthlyRentalPrice?: string;
  fuelLiters?: string;

  createdAt: string;
  notes?: string;
}

export interface VehicleInspectionReport {
  id: string;
  reportNumber: string;
  carId?: string;
  carModel: string;
  year: number;
  chassisNumber: string;
  motorNumber: string;
  plateNumber: string;
  mileage: number;
  inspectorName: string;
  inspectionDate: string;
  inspectionTime: string;

  // 2. Body Notes & Damage
  bodyNotes?: {
    front: string;
    frontStatus?: string;
    side: string;
    sideStatus?: string;
    rear: string;
    rearStatus?: string;
    top: string;
    topStatus?: string;
  };
  damageTags?: string[];

  // 3. Exterior Inspection
  exteriorBody: 'good' | 'medium' | 'needs_repair';
  exteriorPaint: 'good' | 'scratched' | 'rust';
  exteriorGlassMirrors: 'intact' | 'scratched' | 'broken';
  exteriorTires: 'good' | 'worn' | 'needs_replacement';

  // 4. Interior Inspection
  interiorSeats: 'good' | 'dirty' | 'torn';
  interiorDashboard: 'working' | 'faults';
  interiorACHeating: 'working' | 'not_working';
  interiorAudioElectronics: 'working' | 'not_working';

  // 5. Mechanical Inspection
  mechanicalEngine: 'good' | 'abnormal_sound' | 'oil_leak';
  mechanicalTransmission: 'good' | 'shifting_issues' | 'needs_repair';
  mechanicalBrakes: 'good' | 'noise' | 'needs_replacement';
  mechanicalSuspension: 'good' | 'noise' | 'needs_repair';

  // 6. Electronic Inspection
  electronicO2Sensor: 'intact' | 'needs_replacement';
  electronicABSSensor: 'intact' | 'needs_replacement';
  electronicCheckEngine: 'off' | 'on';
  electronicOBD2Reading: string;

  // 7. General Notes
  generalNotes: string;

  // 8. Recommendation
  recommendation: 'good_condition' | 'minor_repairs' | 'major_repairs';

  inspectorSignature?: string;
  recipientName?: string;
  recipientSignature?: string;
  recipientCivilId?: string;
  damagePoints?: DamagePoint[];
  createdAt: string;
}

export type DamagePart = 'front' | 'rear' | 'left' | 'right' | 'top' | 'interior' | 'undercarriage';
export type DamageType = 'scratch' | 'dent' | 'crack' | 'paint' | 'burn' | 'missing' | 'other';
export type DamageSeverity = 'minor' | 'medium' | 'severe';

export interface DamagePoint {
  id: string;
  part: DamagePart;
  x: number; // percentage 0-100 on diagram
  y: number; // percentage 0-100 on diagram
  type: DamageType;
  severity: DamageSeverity;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface PaymentVoucher {
  id: string;
  voucherNumber: string;
  type: 'receipt' | 'payment'; // receipt = سند قبض (inflow), payment = سند صرف / استرداد تأمين (outflow)
  contractId?: string;
  contractNumber?: string;
  customerId?: string;
  customerName: string;
  amount: number;
  paymentMethod: 'cash' | 'credit_card' | 'bank_transfer' | 'check';
  referenceNumber?: string;
  bankName?: string;
  category: 'rental_payment' | 'deposit' | 'deposit_refund' | 'damage_penalty' | 'maintenance_cost' | 'fuel' | 'other';
  description: string;
  receivedBy: string; // Cashier / Employee
  approvedBy?: string; // Manager
  date: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PRINT' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'PAYMENT' | 'STATUS_CHANGE';
  module: 'contracts' | 'cars' | 'customers' | 'bookings' | 'finance' | 'maintenance' | 'deliveries' | 'employees' | 'settings' | 'sales' | 'fines' | 'treasury';
  entityId?: string;
  entityName?: string;
  description: string;
  ip?: string;
}

export type FineStatus = 'pending' | 'charged_to_customer' | 'settled' | 'disputed' | 'cancelled';
export type FineType = 'speeding' | 'red_light' | 'parking' | 'toll' | 'seatbelt' | 'mobile_phone' | 'lane_violation' | 'other';

export interface TrafficFine {
  id: string;
  fineNumber: string; // رقم المخالفة (ساهر / نيابة المرور)
  carId: string;
  carPlateNumber: string;
  carBrandModel: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  contractId?: string;
  contractNumber?: string;
  violationDate: string; // YYYY-MM-DD
  violationTime?: string; // HH:mm
  violationLocation: string; // موقع المخالفة (الشارع / المدينة)
  type: FineType;
  description: string;
  amount: number; // قيمة المخالفة
  serviceFee?: number; // أتعاب إدارية لتحصيل المخالفة
  totalAmount: number; // amount + serviceFee
  status: FineStatus;
  evidenceUrl?: string; // صورة المخالفة أو رابط الاستعلام
  billedInvoiceId?: string; // الفاتورة المحملة عليها
  paymentMethod?: 'cash' | 'credit_card' | 'bank_transfer' | 'deducted_from_deposit';
  paidDate?: string;
  notes?: string;
  registeredBy: string;
  createdAt: string;
}

// ========================
// TREASURY & CASH MANAGEMENT TYPES
// ========================
export type TreasuryType = 'cash_safe' | 'bank_account' | 'pos_terminal' | 'petty_cash';

export interface TreasuryAccount {
  id: string;
  name: string;
  nameEn?: string;
  code: string;
  type: TreasuryType;
  accountNumber?: string; // Bank IBAN or Safe ID
  bankName?: string;
  iban?: string;
  description?: string;
  initialBalance: number;
  currentBalance: number;
  currency: Currency;
  responsiblePerson: string;
  branchName?: string;
  isDefault?: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TreasuryTransactionType = 'inflow' | 'outflow';

export type InflowCategory =
  | 'rental_revenue'
  | 'deposit_received'
  | 'sale_revenue'
  | 'delivery_fee'
  | 'penalty_collection'
  | 'capital_deposit'
  | 'transfer_in'
  | 'other_income';

export type OutflowCategory =
  | 'deposit_refund'
  | 'operating_expense'
  | 'maintenance_payout'
  | 'supplier_payout'
  | 'owner_withdrawal'
  | 'salary_advance'
  | 'transfer_out'
  | 'other_outflow';

export type TreasuryPaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'electronic_gateway'
  | 'credit_card'
  | 'pos'
  | 'check';

export interface TreasuryTransaction {
  id: string;
  transactionNumber: string;
  treasuryId: string;
  treasuryName: string;
  type: TreasuryTransactionType;
  category: InflowCategory | OutflowCategory | string;
  amount: number;
  paymentMethod: TreasuryPaymentMethod | string;
  date: string; // YYYY-MM-DD
  partyName: string; // Customer / Vendor / Staff / Partner
  relatedEntityId?: string;
  relatedEntityType?: 'contract' | 'invoice' | 'maintenance' | 'expense' | 'transfer' | 'general';
  referenceNumber?: string;
  description: string;
  runningBalanceAfter?: number;
  registeredBy: string;
  receiptVoucherId?: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface TreasuryTransfer {
  id: string;
  transferNumber: string;
  fromTreasuryId: string;
  fromTreasuryName: string;
  toTreasuryId: string;
  toTreasuryName: string;
  amount: number;
  transferFee?: number;
  date: string;
  referenceNumber?: string;
  description: string;
  transferredBy: string;
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: string;
}

export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'telecom_internet'
  | 'fuel_oil'
  | 'cleaning_hospitality'
  | 'office_supplies'
  | 'marketing_ads'
  | 'salaries_commissions'
  | 'government_fees'
  | 'vehicle_insurance'
  | 'it_software'
  | 'legal_accounting'
  | 'other_expense';

export interface OperatingExpense {
  id: string;
  expenseNumber: string;
  treasuryId: string;
  treasuryName: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  totalWithTax: number;
  paymentMethod: TreasuryPaymentMethod | string;
  beneficiary: string;
  invoiceNumber?: string;
  date: string;
  carId?: string;
  carPlate?: string;
  approvedBy?: string;
  registeredBy: string;
  notes?: string;
  attachmentUrl?: string;
  createdAt: string;
}



