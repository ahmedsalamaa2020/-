import { RentalContract, CarBooking, Invoice, Currency, Language } from '../types';

/**
 * Sanitizes phone number to international standard (E.164 without '+')
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9+]/g, '');

  // If starts with +, remove +
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // If starts with 0 (e.g. 05xxxxxxxx in Saudi or 01xxxxxxxxx in Egypt)
  // Check common regional formats
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    // Saudi number: 05XXXXXXXX -> 9665XXXXXXXX
    cleaned = '966' + cleaned.substring(1);
  } else if (cleaned.startsWith('01') && cleaned.length === 11) {
    // Egypt number: 01XXXXXXXXX -> 201XXXXXXXXX
    cleaned = '20' + cleaned.substring(1);
  } else if (cleaned.startsWith('07') && cleaned.length === 11) {
    // Iraq number: 07XXXXXXXXX -> 9647XXXXXXXXX
    cleaned = '964' + cleaned.substring(1);
  } else if (cleaned.startsWith('05') && cleaned.length === 9) {
    // UAE number: 05XXXXXXXX -> 9715XXXXXXXX
    cleaned = '971' + cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Generates WhatsApp URL
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(message.trim());
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Generates Contract Summary Message for WhatsApp
 */
export function createContractWhatsAppMessage(
  contract: RentalContract,
  companyName: string,
  currency: Currency,
  lang: Language
): string {
  if (lang === 'ar') {
    return `🚗 *مرحباً بك أستاذ ${contract.customerName}*
نشكرك لاختيارك *${companyName || 'مؤسسة تأجير السيارات'}*.

📄 *بيانات عقد الإيجار:*
• رقم العقد: *${contract.contractNumber}*
• السيارة: *${contract.carModel} (${contract.carPlate})*
• تاريخ الاستلام: *${contract.startDate}*
• تاريخ الإرجاع: *${contract.endDate}*
• إجمالي المدة: *${contract.totalDays} يوم*
• القيمة الإجمالية: *${contract.totalAmount} ${currency}*
• المبلغ المدفوع: *${contract.paidAmount} ${currency}*
• المبلغ المتبقي: *${contract.remainingAmount} ${currency}*
• التأمين المسترد: *${contract.deposit} ${currency}*

📍 *ملاحظات:*
يرجى الالتزام بموعد الإرجاع وحالة الوقود ونظافة السيارة.
نتمنى لك رحلة آمنة وسعيدة! 🌟`;
  }

  return `🚗 *Dear ${contract.customerName}*
Thank you for choosing *${companyName || 'Car Rental Services'}*.

📄 *Rental Contract Details:*
• Contract No: *${contract.contractNumber}*
• Vehicle: *${contract.carModel} (${contract.carPlate})*
• Pick-up Date: *${contract.startDate}*
• Return Date: *${contract.endDate}*
• Duration: *${contract.totalDays} Days*
• Total Amount: *${contract.totalAmount} ${currency}*
• Paid: *${contract.paidAmount} ${currency}*
• Balance Due: *${contract.remainingAmount} ${currency}*
• Security Deposit: *${contract.deposit} ${currency}*

Have a safe and wonderful trip! 🌟`;
}

/**
 * Generates Booking Confirmation Message for WhatsApp
 */
export function createBookingWhatsAppMessage(
  booking: CarBooking,
  companyName: string,
  currency: Currency,
  lang: Language
): string {
  if (lang === 'ar') {
    return `📅 *تأكيد حجز سيارة*
مرحباً *${booking.customerName}*، تم تأكيد حجزك لدى *${companyName || 'مؤسسة التأجير'}*.

• رقم الحجز: *${booking.bookingNumber}*
• السيارة: *${booking.carModel}*
• من تاريخ: *${booking.startDate} (${booking.startTime || '10:00'})*
• إلى تاريخ: *${booking.endDate} (${booking.endTime || '10:00'})*
• إجمالي الأيام: *${booking.totalDays} يوم*
• القيمة التقديرية: *${booking.totalAmount} ${currency}*
• مبلغ العربون: *${booking.deposit || 0} ${currency}*

نحن بانتظارك لاستلام السيارة في الموعد المحدد. أهلاً بك! ✨`;
  }

  return `📅 *Booking Confirmation*
Hello *${booking.customerName}*, your car booking with *${companyName || 'Car Rental'}* is confirmed.

• Booking No: *${booking.bookingNumber}*
• Vehicle: *${booking.carModel}*
• Start Date: *${booking.startDate}*
• End Date: *${booking.endDate}*
• Total Days: *${booking.totalDays}*
• Total Amount: *${booking.totalAmount} ${currency}*

Looking forward to seeing you! ✨`;
}

/**
 * Generates Payment Receipt / Voucher WhatsApp Message
 */
export function createReceiptWhatsAppMessage(
  receiptNumber: string,
  payerName: string,
  amount: number,
  currency: Currency,
  purpose: string,
  companyName: string,
  lang: Language
): string {
  const dateStr = new Date().toISOString().split('T')[0];
  if (lang === 'ar') {
    return `🧾 *إشعار سند قبض مالي*
من: *${companyName || 'مؤسسة التأجير'}*
التاريخ: *${dateStr}*

استلمنا من السيد/السادة: *${payerName}*
مبلغ وقدره: *${amount} ${currency}*
رقم السند: *${receiptNumber}*
وذلك عن: *${purpose || 'سداد دفعة إيجار'}*

شاكرين لكم حسن تعاملكم معنا. 🌟`;
  }

  return `🧾 *Official Payment Receipt*
From: *${companyName || 'Car Rental Services'}*
Date: *${dateStr}*

Received from: *${payerName}*
Amount: *${amount} ${currency}*
Receipt No: *${receiptNumber}*
For: *${purpose || 'Rental Payment'}*

Thank you for your business! 🌟`;
}

/**
 * Generates Return Reminder Message for WhatsApp
 */
export function createReturnReminderWhatsAppMessage(
  contract: RentalContract,
  companyName: string,
  lang: Language
): string {
  if (lang === 'ar') {
    return `⏰ *تذكير بموعد إرجاع السيارة*
عزيزنا العميل *${contract.customerName}*،
نود تذكيركم بأن موعد نهاية عقد إيجار السيارة *(${contract.carModel} - ${contract.carPlate})* هو اليوم *${contract.endDate}*.

يرجى تسليم السيارة في الموعد المحدد لتجنب احتساب رسوم تأخير.
للتمديد أو الاستفسار يرجى التواصل معنا مباشرة.
شكراً لتعاونكم! 🚗`;
  }

  return `⏰ *Vehicle Return Reminder*
Dear *${contract.customerName}*,
This is a friendly reminder that your rental contract for *${contract.carModel} (${contract.carPlate})* is scheduled for return on *${contract.endDate}*.

Please return the vehicle on time or contact us if you wish to extend.
Thank you! 🚗`;
}
