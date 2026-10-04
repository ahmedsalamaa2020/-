import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Car as CarIcon,
  User,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  FileText,
  Edit,
  Trash2,
} from 'lucide-react';
import { Car, Customer, CarBooking, BookingStatus, Currency, Language, RentalContract } from '../types';
import { translations } from '../translations/i18n';

interface BookingModuleProps {
  bookings: CarBooking[];
  cars: Car[];
  customers: Customer[];
  currency: Currency;
  lang: Language;
  selectedBookingId?: string;
  onClearTarget?: () => void;
  onAddBooking: (booking: CarBooking) => void;
  onUpdateBooking: (booking: CarBooking) => void;
  onDeleteBooking: (id: string) => void;
  onCreateContractFromBooking?: (contract: RentalContract) => void;
}

type CalendarViewMode = 'daily' | 'weekly' | 'monthly' | 'list';

export const BookingModule: React.FC<BookingModuleProps> = ({
  bookings,
  cars,
  customers,
  currency,
  lang,
  selectedBookingId,
  onClearTarget,
  onAddBooking,
  onUpdateBooking,
  onDeleteBooking,
  onCreateContractFromBooking,
}) => {
  const t = translations[lang];

  const [viewMode, setViewMode] = useState<CalendarViewMode>('weekly');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCarId, setFilterCarId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Modals State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<CarBooking | null>(null);

  useEffect(() => {
    if (selectedBookingId) {
      const found = bookings.find((b) => b.id === selectedBookingId);
      if (found) {
        setSelectedBookingDetails(found);
        setSearchTerm(found.bookingNumber);
      }
    }
  }, [selectedBookingId, bookings]);

  // Form State for Scheduling Booking
  const [carId, setCarId] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [status, setStatus] = useState<BookingStatus>('confirmed');
  const [deposit, setDeposit] = useState<number>(0);
  const [customerRating, setCustomerRating] = useState<number>(5);
  const [customerRatingNotes, setCustomerRatingNotes] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Open Schedule Modal for New Booking
  const openScheduleModal = (prefilledCarId?: string) => {
    setEditingBookingId(null);
    const carToSelect = prefilledCarId || (cars.length > 0 ? cars[0].id : '');
    setCarId(carToSelect);
    setCustomerId(customers.length > 0 ? customers[0].id : '');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setStartTime('10:00');
    setEndTime('10:00');
    setStatus('confirmed');
    setDeposit(0);
    setCustomerRating(5);
    setCustomerRatingNotes('');
    setNotes('');
    setIsScheduleModalOpen(true);
  };

  // Open Schedule Modal for Editing Existing Booking
  const openEditModal = (b: CarBooking) => {
    setEditingBookingId(b.id);
    setCarId(b.carId);
    setCustomerId(b.customerId);
    setStartDate(b.startDate);
    setEndDate(b.endDate);
    setStartTime(b.startTime || '10:00');
    setEndTime(b.endTime || '10:00');
    setStatus(b.status);
    setDeposit(b.deposit || 0);
    setCustomerRating(b.customerRating || 5);
    setCustomerRatingNotes(b.customerRatingNotes || '');
    setNotes(b.notes || '');
    setIsScheduleModalOpen(true);
  };

  // Delete Booking with confirmation
  const handleDelete = (id: string, bookingNumber: string) => {
    const confirmMsg =
      lang === 'ar'
        ? `هل أنت متأكد من مسح الحجز رقم (${bookingNumber}) نهائياً؟`
        : `Are you sure you want to delete booking (${bookingNumber})?`;

    if (window.confirm(confirmMsg)) {
      onDeleteBooking(id);
      if (selectedBookingDetails?.id === id) {
        setSelectedBookingDetails(null);
      }
    }
  };

  // Calculate days difference
  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const selectedCarObj = cars.find((c) => c.id === carId);
  const totalDays = calculateDays(startDate, endDate);
  const dailyRate = selectedCarObj ? selectedCarObj.dailyRate : 200;
  const totalAmount = totalDays * dailyRate;

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carId || !customerId) return;

    const car = cars.find((c) => c.id === carId);
    const cust = customers.find((c) => c.id === customerId);
    if (!car || !cust) return;

    if (editingBookingId) {
      const existing = bookings.find((b) => b.id === editingBookingId);
      const updatedBooking: CarBooking = {
        id: editingBookingId,
        bookingNumber: existing ? existing.bookingNumber : `BOK-2026-${Math.floor(100 + Math.random() * 900)}`,
        carId: car.id,
        carPlate: car.plateNumber,
        carModel: `${car.brand} ${car.model} (${car.year})`,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        startDate,
        endDate,
        startTime,
        endTime,
        status,
        dailyRate: car.dailyRate,
        totalDays,
        totalAmount,
        deposit,
        customerRating,
        customerRatingNotes,
        notes,
        createdAt: existing?.createdAt || new Date().toISOString().split('T')[0],
      };

      onUpdateBooking(updatedBooking);
      if (selectedBookingDetails?.id === editingBookingId) {
        setSelectedBookingDetails(updatedBooking);
      }
    } else {
      const newBooking: CarBooking = {
        id: `bok_${Date.now()}`,
        bookingNumber: `BOK-2026-${Math.floor(100 + Math.random() * 900)}`,
        carId: car.id,
        carPlate: car.plateNumber,
        carModel: `${car.brand} ${car.model} (${car.year})`,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        startDate,
        endDate,
        startTime,
        endTime,
        status,
        dailyRate: car.dailyRate,
        totalDays,
        totalAmount,
        deposit,
        customerRating,
        customerRatingNotes,
        notes,
        createdAt: new Date().toISOString().split('T')[0],
      };

      onAddBooking(newBooking);
    }

    setIsScheduleModalOpen(false);
  };

  // Convert reservation into active contract
  const handleConvertToContract = (b: CarBooking) => {
    if (!onCreateContractFromBooking) return;

    const newContract: RentalContract = {
      id: `cnt_${Date.now()}`,
      contractNumber: `CNT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      carId: b.carId,
      carPlate: b.carPlate,
      carModel: b.carModel,
      customerId: b.customerId,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      startDate: b.startDate,
      endDate: b.endDate,
      startTime: b.startTime,
      endTime: b.endTime,
      dailyRate: b.dailyRate,
      totalDays: b.totalDays,
      totalAmount: b.totalAmount,
      deposit: b.deposit || 0,
      paidAmount: b.deposit || 0,
      remainingAmount: b.totalAmount - (b.deposit || 0),
      paymentMethod: 'cash',
      paymentStatus: b.deposit && b.deposit >= b.totalAmount ? 'paid' : 'partial',
      startMileage: 50000,
      status: 'active',
      termsAccepted: true,
      notes: `تم تحويله تلقائياً من الحجز رقم ${b.bookingNumber}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onCreateContractFromBooking(newContract);
    onUpdateBooking({ ...b, status: 'completed' });
    setSelectedBookingDetails(null);
    alert(lang === 'ar' ? 'تم إنشاء عقد الإيجار بنجاح وتحديث حالة الحجز!' : 'Rental contract created successfully and booking status updated!');
  };

  // Helper dates generation for Calendar view
  const getDaysForWeek = (baseDate: Date) => {
    const dates: Date[] = [];
    const current = new Date(baseDate);
    // Align to Sunday/Monday
    const dayOfWeek = current.getDay();
    current.setDate(current.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const weekDays = getDaysForWeek(selectedDate);

  const isCarBookedOnDate = (carId: string, dateStr: string) => {
    return bookings.filter(
      (b) =>
        b.carId === carId &&
        b.status !== 'cancelled' &&
        dateStr >= b.startDate &&
        dateStr <= b.endDate
    );
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.carPlate.includes(searchTerm);
    const matchesCar = filterCarId === 'all' || b.carId === filterCarId;
    return matchesSearch && matchesCar;
  });

  const getStatusBadge = (st: BookingStatus) => {
    switch (st) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-extrabold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{t.confirmedBooking}</span>
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-full text-xs font-extrabold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{t.pendingBooking}</span>
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-extrabold border border-slate-300 dark:border-slate-700">
            {t.completedBooking}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-full text-xs font-extrabold border border-rose-200 dark:border-rose-800">
            {t.cancelledBooking}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <span>{t.carBookings}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.bookingCalendar}
          </p>
        </div>

        <button
          onClick={() => openScheduleModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t.scheduleBooking}</span>
        </button>
      </div>

      {/* Fleet Status & Statistics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">{t.carAvailabilityStatus}</span>
            <div className="text-xl font-black text-emerald-600 mt-1">
              {cars.filter((c) => c.status === 'available').length} / {cars.length}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
            <CarIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">{t.confirmedBooking}</span>
            <div className="text-xl font-black text-blue-600 mt-1">
              {bookings.filter((b) => b.status === 'confirmed').length}
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">{t.pendingBooking}</span>
            <div className="text-xl font-black text-amber-600 mt-1">
              {bookings.filter((b) => b.status === 'pending').length}
            </div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? 'تحت الصيانة' : 'Maintenance'}</span>
            <div className="text-xl font-black text-rose-600 mt-1">
              {cars.filter((c) => c.status === 'maintenance').length}
            </div>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Toolbar: View Modes & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* View mode buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setViewMode('weekly')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-extrabold rounded-lg transition ${
              viewMode === 'weekly'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.weeklyView}
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-extrabold rounded-lg transition ${
              viewMode === 'daily'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.dailyView}
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-extrabold rounded-lg transition ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {lang === 'ar' ? 'قائمة الحجوزات' : 'List View'}
          </button>
        </div>

        {/* Date Navigation for Calendar */}
        {viewMode !== 'list' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 7);
                setSelectedDate(prev);
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 min-w-[140px] text-center">
              {weekDays[0].toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
              {' - '}
              {weekDays[6].toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 7);
                setSelectedDate(next);
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        )}

        {/* Car filter dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterCarId}
            onChange={(e) => setFilterCarId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 w-full"
          >
            <option value="all">{lang === 'ar' ? 'جميع السيارات' : 'All Vehicles'}</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.brand} {c.model} - {c.plateNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Grid View */}
      {(viewMode === 'weekly' || viewMode === 'daily') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 font-extrabold text-slate-700 dark:text-slate-300 min-w-[180px] sticky rtl:right-0 ltr:left-0 bg-slate-50 dark:bg-slate-800 z-10">
                  {lang === 'ar' ? 'السيارة' : 'Vehicle'}
                </th>
                {weekDays.map((d, i) => {
                  const dateStr = d.toISOString().split('T')[0];
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  return (
                    <th
                      key={i}
                      className={`p-3 font-extrabold text-center min-w-[110px] border-l border-slate-200 dark:border-slate-800 ${
                        isToday ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>{d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' })}</div>
                      <div className="text-[11px] text-slate-500 font-normal">{d.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cars
                .filter((c) => filterCarId === 'all' || c.id === filterCarId)
                .map((car) => (
                  <tr key={car.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100 sticky rtl:right-0 ltr:left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        <div>
                          <div>{car.brand} {car.model}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{car.plateNumber}</div>
                        </div>
                      </div>
                    </td>

                    {weekDays.map((d, idx) => {
                      const dateStr = d.toISOString().split('T')[0];
                      const matchedBookings = isCarBookedOnDate(car.id, dateStr);

                      return (
                        <td key={idx} className="p-2 border-l border-slate-100 dark:border-slate-800/60 align-top h-20">
                          {matchedBookings.length > 0 ? (
                            matchedBookings.map((bk) => (
                              <button
                                key={bk.id}
                                onClick={() => setSelectedBookingDetails(bk)}
                                className={`w-full text-right rtl:text-right ltr:text-left p-1.5 rounded-lg text-[11px] font-bold shadow-xs transition mb-1 border ${
                                  bk.status === 'confirmed'
                                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                                    : bk.status === 'pending'
                                    ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <div className="truncate">{bk.customerName}</div>
                                <div className="text-[9px] opacity-80">{bk.bookingNumber}</div>
                              </button>
                            ))
                          ) : (
                            <button
                              onClick={() => openScheduleModal(car.id)}
                              className="w-full h-full rounded-lg border border-dashed border-slate-200 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 text-slate-300 hover:text-blue-500 transition flex items-center justify-center text-[10px]"
                            >
                              +
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bookings List View */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute top-3 rtl:right-3 ltr:left-3 text-slate-400" />
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rtl:pr-9 ltr:pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
            {filteredBookings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                {lang === 'ar' ? 'لا توجد حجوزات مسجلة' : 'No bookings found'}
              </div>
            ) : (
              filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-2xl">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          {b.bookingNumber}
                        </span>
                        {getStatusBadge(b.status)}
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                        {b.carModel} ({b.carPlate})
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{b.customerName} ({b.customerPhone})</span>
                        </span>
                        <span>•</span>
                        <span>{b.startDate} {b.startTime} ➔ {b.endDate} {b.endTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4">
                    <div className="text-right rtl:text-right ltr:text-left">
                      <div className="text-sm font-black text-blue-600 dark:text-blue-400">
                        {b.totalAmount.toLocaleString()} {currency}
                      </div>
                      <div className="text-[10px] text-slate-400">{b.totalDays} {lang === 'ar' ? 'أيام' : 'days'}</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedBookingDetails(b)}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                      >
                        {lang === 'ar' ? 'التفاصيل' : 'Details'}
                      </button>
                      <button
                        onClick={() => openEditModal(b)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition"
                        title={lang === 'ar' ? 'تعديل الحجز' : 'Edit Booking'}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id, b.bookingNumber)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition"
                        title={lang === 'ar' ? 'مسح الحجز' : 'Delete Booking'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => handleConvertToContract(b)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{t.convertToContract}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Schedule Booking Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <span>{editingBookingId ? (lang === 'ar' ? 'تعديل بيانات الحجز' : 'Edit Booking') : t.scheduleBooking}</span>
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'اختر السيارة' : 'Select Vehicle'} *
                  </label>
                  <select
                    required
                    value={carId}
                    onChange={(e) => setCarId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brand} {c.model} - {c.plateNumber} ({c.dailyRate} {currency}/{lang === 'ar' ? 'يوم' : 'day'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'اختر العميل' : 'Select Customer'} *
                  </label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'تاريخ بداية الحجز' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'تاريخ نهاية الحجز' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'وقت التسليم' : 'Pick Time'}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.bookingStatus}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BookingStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="confirmed">{t.confirmedBooking}</option>
                    <option value="pending">{t.pendingBooking}</option>
                  </select>
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {lang === 'ar' ? 'مدة الحجز الإجمالية:' : 'Total Duration:'}
                  </span>
                  <span className="font-extrabold text-blue-700 dark:text-blue-300 mx-1">
                    {totalDays} {lang === 'ar' ? 'أيام' : 'days'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {lang === 'ar' ? 'إجمالي تكلفة الحجز:' : 'Total Cost:'}
                  </span>
                  <span className="text-base font-black text-blue-600 dark:text-blue-400 mx-1">
                    {totalAmount.toLocaleString()} {currency}
                  </span>
                </div>
              </div>

              {/* Deposit and Customer Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'مبلغ العربون المتقاضى' : 'Deposit Received'}
                  </label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'ar' ? 'ملاحظات' : 'Notes'}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={lang === 'ar' ? 'ملاحظات سريعة على الحجز...' : 'Quick notes...'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
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

      {/* Booking Details Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full my-8 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  {selectedBookingDetails.bookingNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-500">{t.bookingStatus}:</span>
                {getStatusBadge(selectedBookingDetails.status)}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ar' ? 'السيارة:' : 'Vehicle:'}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedBookingDetails.carModel} ({selectedBookingDetails.carPlate})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.customerName}:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedBookingDetails.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.phone}:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedBookingDetails.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ar' ? 'فترة الحجز:' : 'Period:'}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedBookingDetails.startDate} ➔ {selectedBookingDetails.endDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ar' ? 'الإجمالي:' : 'Total:'}</span>
                  <span className="font-extrabold text-blue-600 text-sm">
                    {selectedBookingDetails.totalAmount.toLocaleString()} {currency}
                  </span>
                </div>
              </div>

              {selectedBookingDetails.notes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300">
                  <span className="font-bold block mb-1">{lang === 'ar' ? 'ملاحظات' : 'Notes'}:</span>
                  <p>{selectedBookingDetails.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const b = selectedBookingDetails;
                      setSelectedBookingDetails(null);
                      openEditModal(b);
                    }}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{t.edit}</span>
                  </button>

                  <button
                    onClick={() => {
                      handleDelete(selectedBookingDetails.id, selectedBookingDetails.bookingNumber);
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.delete}</span>
                  </button>
                </div>

                {selectedBookingDetails.status === 'confirmed' && (
                  <button
                    onClick={() => handleConvertToContract(selectedBookingDetails)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t.convertToContract}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
