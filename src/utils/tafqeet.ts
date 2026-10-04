/**
 * Tafqeet: Converts numbers into Arabic and English words for official vouchers & contracts
 */

const onesAr = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const tensAr = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const teensAr = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const hundredsAr = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

function convertUnderThousandAr(n: number): string {
  if (n === 0) return '';
  let res = '';
  const h = Math.floor(n / 100);
  const rem = n % 100;

  if (h > 0) {
    res += hundredsAr[h];
  }

  if (rem > 0) {
    if (res !== '') res += ' و';
    if (rem < 10) {
      res += onesAr[rem];
    } else if (rem >= 10 && rem < 20) {
      res += teensAr[rem - 10];
    } else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      if (o > 0) {
        res += onesAr[o] + ' و' + tensAr[t];
      } else {
        res += tensAr[t];
      }
    }
  }

  return res;
}

export function tafqeetArabic(num: number, currencyName: string = 'ريال سعودي', halalaName: string = 'هللة'): string {
  if (isNaN(num) || num === 0) return 'صفر ' + currencyName + ' لا غير';
  
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const integerPart = Math.floor(absNum);
  const fractionPart = Math.round((absNum - integerPart) * 100);

  let result = '';

  const billions = Math.floor(integerPart / 1000000000);
  const millions = Math.floor((integerPart % 1000000000) / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const units = integerPart % 1000;

  if (billions > 0) {
    result += (billions === 1 ? 'مليار' : billions === 2 ? 'ملياران' : convertUnderThousandAr(billions) + ' مليار');
  }

  if (millions > 0) {
    if (result !== '') result += ' و';
    result += (millions === 1 ? 'مليون' : millions === 2 ? 'مليونان' : convertUnderThousandAr(millions) + ' مليون');
  }

  if (thousands > 0) {
    if (result !== '') result += ' و';
    result += (thousands === 1 ? 'ألف' : thousands === 2 ? 'ألفان' : convertUnderThousandAr(thousands) + ' آلاف');
  }

  if (units > 0) {
    if (result !== '') result += ' و';
    result += convertUnderThousandAr(units);
  }

  if (result === '') {
    result = 'صفر';
  }

  result = 'فقط وقدره ' + result + ' ' + currencyName;

  if (fractionPart > 0) {
    result += ' و' + convertUnderThousandAr(fractionPart) + ' ' + halalaName;
  }

  result += ' لا غير';

  return isNegative ? 'سالب ' + result : result;
}

export function numberToWordsEnglish(num: number, currencyName: string = 'USD'): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(n: number): string {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      str += teens[n - 10] + ' ';
      return str;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str;
  }

  if (num === 0) return 'Zero ' + currencyName + ' Only';

  const intPart = Math.floor(Math.abs(num));
  const cents = Math.round((Math.abs(num) - intPart) * 100);

  let words = '';
  const millions = Math.floor(intPart / 1000000);
  const thousands = Math.floor((intPart % 1000000) / 1000);
  const units = intPart % 1000;

  if (millions > 0) words += convertGroup(millions) + 'Million ';
  if (thousands > 0) words += convertGroup(thousands) + 'Thousand ';
  if (units > 0) words += convertGroup(units);

  words = words.trim() + ' ' + currencyName;

  if (cents > 0) {
    words += ' and ' + convertGroup(cents).trim() + ' Cents';
  }

  return 'Only ' + words + ' Exactly';
}
