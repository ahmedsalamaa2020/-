import { RentalContract, Customer, Car, AppSettings, Language, CorporateContract, CarSale, Currency, VehicleHandoverReceipt } from '../types';
import { formatCurrency } from '../translations/i18n';
import { getSavedPrintSettings } from './printSettings';

/**
 * Downloads a formatted Word (.doc) file from an HTML string with Microsoft Word XML metadata
 */
export function downloadWordDocument(contentHtml: string, filename: string) {
  const printSettings = getSavedPrintSettings();
  const showWatermark = printSettings.showWatermark ?? true;
  const watermarkText = printSettings.watermarkText || 'SHAKER MOTORS';

  const watermarkHtml = showWatermark
    ? `<div style="text-align:center; font-size:24pt; font-weight:900; color:#cbd5e1; letter-spacing:6px; margin:4px 0 10px 0; text-transform:uppercase; font-family:Arial, sans-serif;">--- ${watermarkText} ---</div>`
    : '';

  const header = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${filename}</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
@page Section1 {
  size: 21.0cm 29.7cm; /* A4 */
  margin: 1.5cm 1.5cm 1.5cm 1.5cm;
  mso-header-margin: 36.0pt;
  mso-footer-margin: 36.0pt;
}
div.Section1 {
  page: Section1;
}
body {
  font-family: 'Segoe UI', 'Traditional Arabic', 'Simplified Arabic', Tahoma, Arial, sans-serif;
  direction: rtl;
  text-align: right;
  font-size: 10pt;
  color: #0f172a;
  line-height: 1.35;
}
h1, h2, h3, h4 {
  margin: 0 0 6px 0;
}
table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 10px;
}
table.bordered th, table.bordered td {
  border: 1px solid #cbd5e1;
  padding: 5px 7px;
  font-size: 9.5pt;
}
table.bordered th {
  background-color: #f1f5f9;
  font-weight: bold;
  color: #1e293b;
}
.header-table {
  border: none;
  width: 100%;
  margin-bottom: 12px;
}
.header-table td {
  border: none;
  padding: 2px 4px;
}
.contract-title {
  background-color: #0f172a;
  color: #ffffff;
  text-align: center;
  font-size: 13pt;
  font-weight: bold;
  padding: 6px;
  margin: 8px 0;
  border-radius: 4px;
}
.section-title {
  background-color: #e2e8f0;
  color: #0f172a;
  font-weight: bold;
  font-size: 10pt;
  padding: 4px 8px;
  margin: 8px 0 4px 0;
  border-right: 4px solid #2563eb;
}
.highlight-badge {
  background-color: #eff6ff;
  color: #1e40af;
  font-weight: bold;
  padding: 2px 5px;
  border: 1px solid #bfdbfe;
}
.penalty-badge {
  background-color: #fff1f2;
  color: #9f1239;
  font-weight: bold;
  padding: 2px 5px;
  border: 1px solid #fecdd3;
}
.clause-box {
  margin-bottom: 5px;
  font-size: 9pt;
  line-height: 1.4;
  color: #334155;
}
.clause-num {
  font-weight: bold;
  color: #0f172a;
}
.signature-box {
  height: 65px;
  border: 1px dashed #94a3b8;
  background-color: #f8fafc;
  text-align: center;
  padding-top: 15px;
  color: #64748b;
  font-size: 9pt;
}
</style>
</head>
<body lang="AR-SA" dir="rtl">
<div class="Section1">
${watermarkHtml}
${contentHtml}
</div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', header], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a standard Individual Rental Contract to a highly-structured Microsoft Word (.doc) document
 */
export function exportRentalContractToWord(options: {
  contract: RentalContract;
  customer?: Customer;
  car?: Car;
  settings: AppSettings;
  lang: Language;
  isBlank?: boolean;
}) {
  const { contract, customer, car, settings, lang, isBlank = false } = options;

  const lesseeName = isBlank ? '..................................................................' : (contract.customerName || customer?.name || '-');
  const lesseePhone = isBlank ? '....................................' : (contract.customerPhone || customer?.phone || '-');
  const lesseeNationalId = isBlank ? '....................................' : (contract.customerNationalId || customer?.nationalId || contract.customerId || '-');
  const lesseeLicense = isBlank ? '....................................' : (contract.customerLicenseNumber || customer?.licenseNumber || '-');
  const lesseeLicenseExp = isBlank ? '.... / .... / ........' : (contract.customerLicenseExpiryDate || customer?.licenseExpiryDate || '-');
  const lesseeNationality = isBlank ? '....................' : (contract.customerNationality || customer?.nationality || (lang === 'ar' ? 'سعودي' : 'Saudi'));
  const lesseeAddress = isBlank ? '..................................................................' : (contract.customerAddress || customer?.address || '-');
  const lesseeJobTitle = isBlank ? '....................................' : (contract.customerJobTitle || customer?.jobTitle);
  const fullCarPrice = contract.carSalePrice || contract.carValueSecurity || car?.salePrice || (settings.defaultRentalPrice ? settings.defaultRentalPrice * 300 : 95000);
  const delayPenaltyFee = contract.hourlyDelayFee || settings.hourlyDelayFee || 50;
  const dailyLimit = contract.dailyMileageLimit || settings.dailyMileageLimit || 300;
  const extraKmRate = contract.excessMileageRate || settings.excessMileageCharge || 1.5;

  const isHourly = contract.rentalDurationType === 'hours' || (contract.totalHours && contract.totalHours > 0);
  const durationText = isBlank
    ? '........ (يوم / شهر / ساعات)'
    : isHourly
    ? `${contract.totalHours || 1} ${lang === 'ar' ? 'ساعات' : 'Hours'}`
    : `${contract.totalDays} ${lang === 'ar' ? 'يوم' : 'Days'}`;

  // Complete List of 11 Official Legal Clauses
  const allClauses = [
    {
      title: lang === 'ar' ? 'الطرفان وأهلية الاستئجار والضامن' : 'Parties, Legal Capacity & Guarantor',
      text: lang === 'ar'
        ? `تم تحرير هذا العقد بين الطرف الأول (المؤجر) والطرف الثاني (المستأجر: ${lesseeName} - هوية: ${lesseeNationalId}) الحامل لرخصة قيادة سارية ومطابقة (${lesseeLicense})، والضامن إن وجد بالتزام وتضامن تام بكل ما ورد في هذا العقد دون أدنى تحفظ.`
        : `This agreement is concluded between the Lessor and Lessee (${lesseeName} - ID: ${lesseeNationalId}) holding a valid license (${lesseeLicense}), with full joint liability.`,
    },
    {
      title: lang === 'ar' ? 'موضوع العقد والسيارة وحالتها الفنية' : 'Subject of Agreement & Vehicle Condition',
      text: lang === 'ar'
        ? `تأجير المركبة الموضحة بياناتها ولوحتها (${isBlank ? '........................' : contract.carPlate}) بالكامل، والسيارة بحالة ممتازة ومطابقة للمواصفات وخالية من أي عيوب أو تلفيات، ولا تحتوي على أي مواد مخالفة للقوانين والأنظمة، والمسؤولية الجنائية والمدنية كاملة على عاتق المستأجر.`
        : `Rental of the described vehicle (Plate: ${isBlank ? '........................' : contract.carPlate}) in excellent compliant condition free of defects. Full legal responsibility rests on the Lessee.`,
    },
    {
      title: lang === 'ar' ? 'حساب مدة العقد وساعات التأخير والغرامات' : 'Rental Duration & Delay Penalty Calculation',
      text: lang === 'ar'
        ? `تبدأ وتكتمل مدة العقد بالساعة واليوم من (${isBlank ? '.... / .... / ........' : contract.startDate} - ${isBlank ? '..........' : contract.startTime || '10:00 ص'}) وحتى (${isBlank ? '.... / .... / ........' : contract.endDate} - ${isBlank ? '..........' : contract.endTime || contract.startTime || '10:00 ص'}) بإجمالي مدة (${durationText}). كل ساعة تأخير تُحتسب بـ (${delayPenaltyFee} ${settings.currency} / ساعة) بحد أقصى خمس ساعات، بعدها يحق للمؤجر إبلاغ الجهات الأمنية والقضائية فوراً والمطالبة بالأجرة كاملة والتعويض اللازم.`
        : `Contract period is strictly calculated for (${durationText}). Any delay is charged at (${delayPenaltyFee} ${settings.currency}/hr) up to 5 hours max, after which legal authorities will be notified.`,
    },
    {
      title: lang === 'ar' ? 'قيمة السيارة كأمانة والمسؤولية عن الهلاك الكلي' : 'Vehicle Custody Valuation & Total Loss Liability',
      text: lang === 'ar'
        ? `يقر المستأجر بأن القيمة السوقية التقديرية للمركبة كأمانة وقت التعاقد تبلغ (${isBlank ? '........................' : `${fullCarPrice.toLocaleString()} ${settings.currency}`}). وتُدفع هذه القيمة كاملة فوراً ودون إمهال في حالة عدم تسليم السيارة أو سرقتها أو الهلاك والتلف الكلي الناتج عن سوء الاستخدام.`
        : `The Lessee acknowledges the total market valuation of the vehicle in custody is (${isBlank ? '........................' : `${fullCarPrice.toLocaleString()} ${settings.currency}`}), payable immediately in case of total loss or theft.`,
    },
    {
      title: lang === 'ar' ? 'التزامات المستأجر والتعويضات النظامية عن المخالفات' : 'Lessee Obligations & Contractual Penalties',
      text: lang === 'ar'
        ? `يلتزم المستأجر بعدم إلغاء أو تعديل الشروط، ودفع التعويضات التالية عند ارتكاب أي مخالفة: (1000 ${settings.currency}) عند تغيير خط السير أو استخدام السيارة في مواكب ومناسبات، (3000 ${settings.currency}) عند العبث بالعداد أو قيادة شخص آخر غير مصرح له، (5000 ${settings.currency}) عند إجراء إصلاحات خارج المراكز والوكالات المعتمدة، ودفع قيمة السيارة كاملة عند الامتناع عن التسليم.`
        : 'The Lessee agrees not to violate contract terms and to pay specific contractual indemnity upon unauthorized driver use, odometer tampering, or off-route operations.',
    },
    {
      title: lang === 'ar' ? 'عداد الكيلومترات وسياسة الاستهلاك الزائد' : 'Odometer Reading & Excess Mileage Policy',
      text: lang === 'ar'
        ? `استلم المستأجر المركبة على قراءة العداد المسجلة (${isBlank ? '............' : contract.startMileage.toLocaleString()} كم)، والحد اليومي المسموح (${dailyLimit} كم/يوم). يُحتسب مبلغ (${extraKmRate} ${settings.currency}/كم) عن كل كيلومتر إضافي مقطوع، إضافة إلى تكلفة استهلاك الوقود ونظافة المركبة.`
        : `Start odometer is (${isBlank ? '............' : contract.startMileage} KM) with daily allowance (${dailyLimit} KM/day). Excess distance is charged at (${extraKmRate} ${settings.currency}/KM).`,
    },
    {
      title: lang === 'ar' ? 'التزامات القيادة والسلامة والمحافظة على المركبة' : 'Driving Safety & Vehicle Care Commitments',
      text: lang === 'ar'
        ? `المحافظة التامة على المركبة ومستويات الزيوت وسوائل التبريد، وعدم قيادتها بطريقة متهورة أو في الطرق الوعرة غير الممهدة، وعدم تحميل أي مواد ممنوعة أو مخالفة للقانون، وعدم تجاوز السرعات القانونية المحددة بأي شكل.`
        : 'The Lessee undertakes to maintain the vehicle with utmost care, comply with traffic speed limits, and never transport illegal materials or drive on unpaved terrain.',
    },
    {
      title: lang === 'ar' ? 'المخالفات المرورية ورسوم الطرق (ساهر)' : 'Traffic Violations & Road Toll Liabilities',
      text: lang === 'ar'
        ? `يتحمل المستأجر منفرداً ومباشرة كافة المخالفات المرورية (ساهر، مواقف، بوابات العبور) المسجلة خلال فترة استئجاره للمركبة، ويحق للمؤجر استقطاعها أو تقديمها لدوائر التنفيذ مباشرة.`
        : 'The Lessee bears sole and absolute responsibility for all traffic fines and road tolls incurred throughout the rental duration.',
    },
    {
      title: lang === 'ar' ? 'حق المؤجر في إنهاء العقد واسترداد المركبة' : 'Lessor Right of Cancellation & Repossession',
      text: lang === 'ar'
        ? `يحق للمؤجر فسخ العقد واسترداد السيارة فوراً في أي وقت دون إبداء أسباب ودون الحاجة إلى إخطار أو إنذار، وعلى المستأجر تسليم المركبة فوراً بالحالة التي كانت عليها.`
        : 'The Lessor reserves the right to terminate the contract and repossess the vehicle immediately in case of breach or at management discretion.',
    },
    {
      title: lang === 'ar' ? 'السند التنفيذي والاختصاص القضائي' : 'Executive Legal Bond & Legal Jurisdiction',
      text: lang === 'ar'
        ? `يُعتبر هذا العقد سنداً تنفيذياً ملزماً ونهائياً لكافة أطرافه. وتختص المحاكم النظامية المختصة بالنظر في أي خلاف أو تفسير أو نزاع ينشأ عن تطبيق بنود هذا العقد.`
        : 'This contract constitutes an enforceable executive legal instrument. Competent judicial courts have jurisdiction over any disputes.',
    },
    {
      title: lang === 'ar' ? 'إقرار استلام المركبة والمعاينة والتوقيع' : 'Vehicle Handover Acknowledgment & Signatures',
      text: lang === 'ar'
        ? `أقر أنا المستأجر أنني قمت بمعاينة وفحص السيارة المؤجرة فحصاً نافياً للجهالة واستلمتها بحالة ممتازة وخالية تماماً من العيوب، وأتعهد بالمحافظة عليها وإعادتها بنفس الحالة. وقد تحرر هذا العقد من نسختين أصليتين، وقّع وطبع الطرفان بصماتهم وتواقيعهم المعتمدة للعمل بموجبها.`
        : 'The Lessee acknowledges receiving the vehicle in excellent condition after full inspection, agreeing to return it in the same state. Executed in two original copies with binding signatures.',
    },
  ];

  const html = `
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="width: 60%; vertical-align: middle;">
          <h2 style="color: #1e3a8a; margin-bottom: 2px;">${settings.organizationName || settings.appName}</h2>
          <p style="margin: 0; font-size: 9pt; color: #475569;">${settings.address}</p>
          <p style="margin: 0; font-size: 8.5pt; color: #475569;">
            هاتف: ${settings.contactPhone} | س.ت: ${settings.commercialRegistration || '-'} | الرقم الضريبي: ${settings.taxId || '-'}
          </p>
        </td>
        <td style="width: 40%; text-align: left; vertical-align: middle;">
          <div style="border: 2px solid #0f172a; padding: 6px; background-color: #f8fafc; text-align: center; border-radius: 4px;">
            <span style="font-size: 11pt; font-weight: bold; color: #0f172a; display: block;">
              ${isBlank ? 'عقد إيجار سيارة رسمي (نموذج معتمد)' : 'عقد إيجار سيارة موحد'}
            </span>
            <span style="font-size: 9pt; font-family: monospace; font-weight: bold; color: #2563eb;">
              ${isBlank ? 'CNT-________' : contract.contractNumber}
            </span>
            <span style="font-size: 8pt; color: #64748b; display: block;">تاريخ التحرير: ${new Date().toISOString().slice(0, 10)}</span>
          </div>
        </td>
      </tr>
    </table>

    <div class="contract-title">
      ${isBlank ? 'عقد إيجار مركبة رسمي معتمد (نموذج فارغ للتعبئة اليدوية)' : 'عقد إيجار مركبة رسمي معتمد - RENTAL AGREEMENT CONTRACT'}
    </div>

    <!-- Parties Table -->
    <table class="bordered">
      <tr>
        <th style="width: 50%; background-color: #1e293b; color: #ffffff;">الطرف الأول (المؤجر)</th>
        <th style="width: 50%; background-color: #1e3a8a; color: #ffffff;">الطرف الثاني (المستأجر)</th>
      </tr>
      <tr>
        <td style="vertical-align: top;">
          <p style="margin: 3px 0;"><strong>المنشأة:</strong> ${settings.organizationName || settings.appName}</p>
          <p style="margin: 3px 0;"><strong>السجل التجاري:</strong> ${settings.commercialRegistration || '-'}</p>
          <p style="margin: 3px 0;"><strong>الرقم الضريبي:</strong> ${settings.taxId || '-'}</p>
          <p style="margin: 3px 0;"><strong>الهاتف:</strong> ${settings.contactPhone}</p>
          <p style="margin: 3px 0;"><strong>العنوان:</strong> ${settings.address}</p>
        </td>
        <td style="vertical-align: top;">
          <p style="margin: 3px 0;"><strong>الاسم الكامل:</strong> ${lesseeName}</p>
          <p style="margin: 3px 0;"><strong>رقم الهوية / الإقامة:</strong> <span style="font-family: monospace; font-weight: bold;">${lesseeNationalId}</span></p>
          <p style="margin: 3px 0;"><strong>الوظيفة / جهة العمل:</strong> ${lesseeJobTitle}</p>
          <p style="margin: 3px 0;"><strong>رقم الجوال:</strong> ${lesseePhone}</p>
          <p style="margin: 3px 0;"><strong>الجنسية:</strong> ${lesseeNationality}</p>
          <p style="margin: 3px 0;"><strong>رقم الرخصة:</strong> ${lesseeLicense} (انتهاء: ${lesseeLicenseExp})</p>
          <p style="margin: 3px 0;"><strong>العنوان:</strong> ${lesseeAddress}</p>
        </td>
      </tr>
    </table>

    <!-- Vehicle Specs Table -->
    <div class="section-title">بيانات ومواصفات المركبة المؤجرة والقيمة التقديرية (أمانة)</div>
    <table class="bordered">
      <tr style="background-color: #f8fafc;">
        <th>النوع والموديل</th>
        <th>سنة الصنع</th>
        <th>رقم اللوحة</th>
        <th>اللون</th>
        <th>الفئة</th>
        <th>القيمة التقديرية للسيارة (أمانة)</th>
      </tr>
      <tr style="text-align: center;">
        <td><strong>${isBlank ? '....................................' : contract.carModel}</strong></td>
        <td>${isBlank ? '............' : (car?.year || 2024)}</td>
        <td><strong style="font-family: monospace; font-size: 11pt; color: #1e3a8a;">${isBlank ? '........................' : contract.carPlate}</strong></td>
        <td>${isBlank ? '............' : (car?.color || 'أبيض')}</td>
        <td>${isBlank ? '............' : (car?.category || 'سيدان')}</td>
        <td><strong style="color: #047857; font-size: 10.5pt;">${isBlank ? '........................' : formatCurrency(fullCarPrice, settings.currency, lang)}</strong></td>
      </tr>
    </table>

    <!-- Duration & Delay Terms Table -->
    <div class="section-title">فترة الإيجار، التوقيت، وغرامات التأخير بالساعة</div>
    <table class="bordered">
      <tr style="background-color: #f8fafc; text-align: center;">
        <th>تاريخ ووقت الاستلام</th>
        <th>تاريخ ووقت الإرجاع المحدد</th>
        <th>مدة الإيجار</th>
        <th>قيمة ساعة التأخير</th>
      </tr>
      <tr style="text-align: center;">
        <td><strong>${isBlank ? '.... / .... / ........' : contract.startDate}</strong> (${isBlank ? '..........' : contract.startTime || '10:00 ص'})</td>
        <td><strong>${isBlank ? '.... / .... / ........' : contract.endDate}</strong> (${isBlank ? '..........' : contract.endTime || contract.startTime || '10:00 ص'})</td>
        <td><strong>${durationText}</strong></td>
        <td><span class="penalty-badge">${formatCurrency(delayPenaltyFee, settings.currency, lang)} / ساعة</span></td>
      </tr>
    </table>

    <!-- Odometer & Mileage Policy Table -->
    <div class="section-title">سياسة العداد والكيلومترات المسموحة</div>
    <table class="bordered">
      <tr style="background-color: #fefce8; text-align: center;">
        <th>قراءة العداد عند الاستلام</th>
        <th>الكيلومتر المسموح</th>
        <th>سعر الكيلومتر الزائد</th>
        <th>حالة الوقود والسيارة</th>
      </tr>
      <tr style="text-align: center;">
        <td><strong>${isBlank ? '............ كم' : `${contract.startMileage.toLocaleString()} كم`}</strong></td>
        <td><strong>${dailyLimit} كم/يوم</strong></td>
        <td><strong>${extraKmRate} ${settings.currency}/كم</strong></td>
        <td><strong style="color: #047857;">سليمة ومطابقة للمواصفات</strong></td>
      </tr>
    </table>

    <!-- Financial Breakdown Table -->
    <div class="section-title">المبالغ المالية وتفاصيل السداد</div>
    <table class="bordered">
      <tr style="background-color: #f8fafc; text-align: center;">
        <th>الأجرة المتفق عليها</th>
        <th>مبلغ التأمين النقدي</th>
        <th>إجمالي العقد</th>
        <th>المدفوع مقدماً</th>
        <th>المتبقي المستحق</th>
        <th>طريقة السداد</th>
      </tr>
      <tr style="text-align: center;">
        <td><strong>${isBlank ? '............' : formatCurrency(contract.dailyRate, settings.currency, lang)}</strong></td>
        <td><strong>${isBlank ? '............' : formatCurrency(contract.deposit || 0, settings.currency, lang)}</strong></td>
        <td style="color: #1e3a8a; font-weight: bold;">${isBlank ? '............' : formatCurrency(contract.totalAmount, settings.currency, lang)}</td>
        <td style="color: #047857; font-weight: bold;">${isBlank ? '............' : formatCurrency(contract.paidAmount, settings.currency, lang)}</td>
        <td style="color: #b91c1c; font-weight: bold;">${isBlank ? '............' : formatCurrency(contract.remainingAmount, settings.currency, lang)}</td>
        <td>${isBlank ? '[ ] نقدي   [ ] مدى/شبكة   [ ] تحويل' : (contract.paymentMethod === 'cash' ? 'نقدي' : contract.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'بطاقة مدى / ائتمان')}</td>
      </tr>
    </table>

    <!-- Legal Terms & Clauses (All 11 Clauses) -->
    <div class="section-title">بنود وشروط عقد الإيجار الرسمية المعتمدة (كاملة)</div>
    <div style="border: 1px solid #cbd5e1; padding: 10px; background-color: #fafafa; border-radius: 4px;">
      ${allClauses
        .map(
          (c, idx) => `
        <div class="clause-box" style="margin-bottom: 6px; padding: 5px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 3px;">
          <span class="clause-num" style="font-weight: bold; color: #1e3a8a;">${idx + 1}. ${c.title}:</span>
          <span style="font-size: 8.5pt; color: #334155; line-height: 1.4;">${c.text}</span>
        </div>
      `
        )
        .join('')}
    </div>

    <!-- Handover & Valuation Acknowledgment -->
    <div style="border: 2px solid #2563eb; background-color: #eff6ff; padding: 8px; margin-top: 10px; border-radius: 4px; text-align: justify;">
      <p style="margin: 0; font-size: 8.5pt; font-weight: bold; color: #1e3a8a;">
        📌 إقرار الاستلام والمعاينة والقيمة كأمانة:
      </p>
      <p style="margin: 3px 0 0 0; font-size: 8pt; color: #1e293b; line-height: 1.4;">
        يقر الطرف الثاني (المستأجر) بأنه استلم السيارة بحالة فنية ممتازة وخالية من العيوب، وتُعتبر قيمتها الإجمالية البالغة (${isBlank ? '........................' : formatCurrency(fullCarPrice, settings.currency, lang)}) أمانة في ذمته والتزاماً واجب الأداء فوراً دون تأخير في حال التلف الكلي أو عدم الإرجاع.
      </p>
    </div>

    <!-- Signatures & Acceptance Block -->
    <table style="width: 100%; border: none; margin-top: 15px;">
      <tr>
        <td style="width: 33%; padding: 4px; border: none; text-align: center;">
          <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 9pt; color: #1e293b;">توقيع وختم المؤجر (الطرف الأول)</p>
          <div class="signature-box" style="height: 60px;">
            <span>ختم وتوقيع المنشأة المعتمد</span>
          </div>
          <p style="margin: 2px 0 0 0; font-size: 8pt; font-weight: bold; color: #475569;">${contract.lessorName || settings.organizationName || 'المؤجر المعتمد'}</p>
        </td>
        <td style="width: 33%; padding: 4px; border: none; text-align: center;">
          <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 9pt; color: #1e293b;">توقيع المستأجر (الطرف الثاني)</p>
          <div class="signature-box" style="height: 60px;">
            <span>${isBlank ? 'توقيع المستأجر المعتمد' : `توقيع المستأجر: ${lesseeName}`}</span>
          </div>
          <p style="margin: 2px 0 0 0; font-size: 8pt; font-weight: bold; color: #475569;">${lesseeName}</p>
        </td>
        <td style="width: 33%; padding: 4px; border: none; text-align: center;">
          <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 9pt; color: #581c87;">بصمة إبهام المستأجر</p>
          <div class="signature-box" style="height: 60px; border-color: #c084fc; background-color: #faf5ff;">
            <span style="color: #7e22ce;">📌 بصمة الإبهام المعتمدة</span>
          </div>
          <p style="margin: 2px 0 0 0; font-size: 8pt; font-weight: bold; color: #7e22ce;">البصمة الحية</p>
        </td>
      </tr>
    </table>
  `;

  const fileName = isBlank
    ? 'عقد_إيجار_سيارة_فارغ_معتمد'
    : `عقد_إيجار_${contract.contractNumber}_${(contract.customerName || 'عميل').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}`;
  downloadWordDocument(html, fileName);
}

/**
 * Export Vehicle Handover Receipt & Promissory Note to Microsoft Word (.doc)
 */
export function exportVehicleHandoverToWord(options: {
  receipt?: Partial<VehicleHandoverReceipt> | null;
  settings: AppSettings;
  lang: Language;
  isBlank?: boolean;
}) {
  const { receipt, settings, lang, isBlank = false } = options;

  const receiptNum = isBlank ? 'HND-________' : (receipt?.receiptNumber || `HND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const dateStr = receipt?.createdAt || new Date().toISOString().slice(0, 10);

  const recipientName = isBlank ? '..................................................................' : (receipt?.recipientName || '..................................................................');
  const address = isBlank ? '..................................................................' : (receipt?.address || '..................................................................');
  const nationalId = isBlank ? '....................................' : (receipt?.nationalId || '....................................');
  const phone = isBlank ? '....................................' : (receipt?.phone || '....................................');

  const carPlate = isBlank ? '............................' : (receipt?.carPlate || '............................');
  const carModel = isBlank ? '............................' : (`${receipt?.carBrand || ''} ${receipt?.carModel || ''}`.trim() || '............................');
  const carChassis = isBlank ? '............................................' : (receipt?.carChassis || '............................................');
  const carColor = isBlank ? '....................' : (receipt?.carColor || '....................');

  const fromDate = isBlank ? '.... / .... / ........' : (receipt?.fromDate || dateStr);
  const fromTime = isBlank ? '..........' : (receipt?.fromTime || '10:00 ص');
  const toDate = isBlank ? '.... / .... / ........' : (receipt?.toDate || dateStr);
  const toTime = isBlank ? '..........' : (receipt?.toTime || '10:00 ص');

  const checklist = receipt?.checklist || {
    tank: 'ممتلئ (4/4)',
    tires: 'ممتازة',
    cassette: 'شغال',
    upholstery: 'سليم ونظيف',
    hubcapsCount: '4 طاسات',
    fireExtinguisher: 'موجودة ومجانية',
    seatsCount: '5 كراسي',
  };

  const html = `
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="width: 60%; vertical-align: middle;">
          <h2 style="color: #1e3a8a; margin-bottom: 2px;">${settings.organizationName || 'SHAKER MOTORS'}</h2>
          <p style="margin: 0; font-size: 9pt; color: #475569;">${settings.address || 'المملكة العربية السعودية'}</p>
          <p style="margin: 0; font-size: 8.5pt; color: #475569;">
            هاتف: ${settings.contactPhone || '-'} | س.ت: ${settings.commercialRegistration || '-'} | الرقم الضريبي: ${settings.taxId || '-'}
          </p>
        </td>
        <td style="width: 40%; text-align: left; vertical-align: middle;">
          <div style="border: 2px solid #0f172a; padding: 6px; background-color: #f8fafc; text-align: center; border-radius: 4px;">
            <span style="font-size: 11pt; font-weight: bold; color: #0f172a; display: block;">
              ${isBlank ? 'إقرار استلام سيارة (نموذج فارغ)' : 'إقرار استلام مركبة رسمي'}
            </span>
            <span style="font-size: 9pt; font-family: monospace; font-weight: bold; color: #2563eb;">${receiptNum}</span>
            <span style="font-size: 8pt; color: #64748b; display: block;">التاريخ: ${dateStr}</span>
          </div>
        </td>
      </tr>
    </table>

    <div class="contract-title" style="background-color: #1e3a8a;">
      ${isBlank ? 'إقرار استلام سيارة رسمي (مسؤولية مدنية وجنائية كاملة - نموذج فارغ)' : 'إقرار استلام سيارة رسمي (مسؤولية مدنية وجنائية كاملة)'}
    </div>

    <!-- Recipient & Vehicle Block -->
    <div class="section-title">بيانات المستلم والسيارة المستلمة وفترة الاستلام</div>
    <div style="border: 1px solid #cbd5e1; padding: 10px; background-color: #ffffff; border-radius: 4px; line-height: 1.8; font-size: 9.5pt;">
      <p style="margin: 4px 0;">
        <strong>أقر أنا الموقع أدناه:</strong> ${recipientName} &nbsp;&nbsp;&nbsp;&nbsp;
        <strong>وعنواني:</strong> ${address}
      </p>
      <p style="margin: 4px 0;">
        <strong>رقم البطاقة / الهوية:</strong> <span style="font-family: monospace; font-weight: bold;">${nationalId}</span> &nbsp;&nbsp;&nbsp;&nbsp;
        <strong>الهاتف:</strong> ${phone}
      </p>
      <p style="margin: 4px 0;">
        <strong>بأنني قد استلمت السيارة رقم لوحة:</strong> <strong style="color: #1e3a8a; font-family: monospace;">${carPlate}</strong> &nbsp;&nbsp;&nbsp;&nbsp;
        <strong>الماركة والموديل:</strong> ${carModel} &nbsp;&nbsp;&nbsp;&nbsp;
        <strong>اللون:</strong> ${carColor}
      </p>
      <p style="margin: 4px 0;">
        <strong>رقم الشاسيه (الهيكل):</strong> <span style="font-family: monospace;">${carChassis}</span>
      </p>
      <p style="margin: 4px 0;">
        <strong>فترة الاستلام تبدأ من تاريخ:</strong> ${fromDate} &nbsp;&nbsp; (الساعة: ${fromTime}) &nbsp;&nbsp;&nbsp;&nbsp;
        <strong>وحتى تاريخ:</strong> ${toDate} &nbsp;&nbsp; (الساعة: ${toTime})
      </p>
    </div>

    <!-- Inventory Checklist Table -->
    <div class="section-title">كشف حالة ومحتويات السيارة عند الاستلام</div>
    <table class="bordered">
      <tr style="background-color: #f8fafc; text-align: center;">
        <th>التانك (الوقود)</th>
        <th>حالة الكاوتش</th>
        <th>الكاسيت والصوتيات</th>
        <th>الفرش والداخلية</th>
        <th>عدد الطاسات</th>
        <th>طفاية الحريق</th>
        <th>عدد المقاعد</th>
      </tr>
      <tr style="text-align: center; font-weight: bold;">
        <td style="color: #1e3a8a;">${isBlank ? '[           ]' : checklist.tank}</td>
        <td>${isBlank ? '[           ]' : checklist.tires}</td>
        <td>${isBlank ? '[           ]' : checklist.cassette}</td>
        <td>${isBlank ? '[           ]' : checklist.upholstery}</td>
        <td>${isBlank ? '[           ]' : checklist.hubcapsCount}</td>
        <td>${isBlank ? '[           ]' : checklist.fireExtinguisher}</td>
        <td>${isBlank ? '[           ]' : checklist.seatsCount}</td>
      </tr>
    </table>

    <!-- Legal Conditions & Responsibilities -->
    <div class="section-title">الشروط والتعهدات القانونية الملزمة</div>
    <div style="border: 1px solid #cbd5e1; padding: 10px; background-color: #fafafa; border-radius: 4px; font-size: 8.5pt; line-height: 1.5;">
      <p style="margin: 3px 0;"><strong>١. الحالة الفنية والسلامة:</strong> أقر بأنني استلمت السيارة الموضحة أعلاه بحالة فنية وميكانيكية ممتازة وخالية من العيوب وصالحة تماماً للاستخدام، وأصبحت مسؤولاً عنها مسؤولية مدنية وجنائية كاملة من لحظة الاستلام وحتى موعد إعادتها الرسمية للشركة.</p>
      <p style="margin: 3px 0;"><strong>٢. المخالفات والحوادث:</strong> أتحمل منفرداً كافة المسؤوليات والتبعات عن أي مخالفات مرورية أو حوادث أو غرامات أو أضرار تقع بالسيارة أو الغير خلال فترة الاستلام، وألتزم بسدادها بالكامل فوراً دون تأخير.</p>
      <p style="margin: 3px 0;"><strong>٣. حظر التصرف والتأجير:</strong> يمتنع عليّ منعاً باتاً بيع السيارة أو رهنها أو التنازل عنها أو تأجيرها للغير أو قيادتها خارج النطاق الجغرافي المصرح به دون إذن كتابي رسمي مسبق من الشركة.</p>
      <p style="margin: 3px 0;"><strong>٤. الإبلاغ الفوري والصيانة:</strong> في حال حدوث أي عطل أو حادث أو سرقة ألتزم بإبلاغ الشركة فوراً والجهات الرسمية (المرور / نجم) وتقديم التقارير اللازمة، والالتزام بإجراء الصيانة الدورية في مواعيدها.</p>
      <p style="margin: 4px 0 0 0; font-weight: bold; color: #b91c1c;">* يُعد هذا الإقرار سنداً رسمياً وقانونياً ملزماً للمستلم أمام كافة الجهات القضائية والحكومية والرسمية المختصة.</p>
    </div>

    <!-- Signatures Table -->
    <table style="width: 100%; border: none; margin-top: 20px;">
      <tr>
        <td style="width: 33%; padding: 4px; border: none; text-align: center;">
          <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 9pt; color: #1e293b;">توقيع المستلم (المتعهد بالاستلام)</p>
          <div class="signature-box" style="height: 60px;">
            <span>${isBlank ? 'توقيع المستلم المعتمد' : (receipt?.recipientName ? `توقيع: ${receipt.recipientName}` : 'توقيع المستلم')}</span>
          </div>
          <p style="margin: 2px 0 0 0; font-size: 8pt; font-weight: bold; color: #475569;">${recipientName}</p>
        </td>
        <td style="width: 33%; padding: 4px; border: none; text-align: center;">
          <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 9pt; color: #1e293b;">ختم وتوقيع الشركة (المُسلّم)</p>
          <div class="signature-box" style="height: 60px;">
            <span>${settings.organizationName || 'SHAKER MOTORS'}</span>
          </div>
          <p style="margin: 2px 0 0 0; font-size: 8pt; font-weight: bold; color: #475569;">مأمون التسليم المعتمد</p>
        </td>
        <td style="width: 33%; padding: 4px; border: none; text-align: center;">
          <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 9pt; color: #581c87;">📌 بصمة الإبهام المعتمدة</p>
          <div class="signature-box" style="height: 60px; border-color: #c084fc; background-color: #faf5ff;">
            <span style="color: #7e22ce;">مربع البصمة الرسمية الحية</span>
          </div>
          <p style="margin: 2px 0 0 0; font-size: 8pt; font-weight: bold; color: #7e22ce;">تعتمد رسمياً لدى كافة الدوائر</p>
        </td>
      </tr>
    </table>
  `;

  const fileName = isBlank
    ? 'إقرار_استلام_سيارة_فارغ_معتمد'
    : `إقرار_استلام_سيارة_${receiptNum}_${(receipt?.recipientName || 'مستلم').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}`;
  downloadWordDocument(html, fileName);
}

/**
 * Export Corporate B2B Fleet Contract to a formatted Word (.doc) document
 */
export function exportCorporateContractToWord(options: {
  contract: CorporateContract;
  settings: AppSettings;
  lang: Language;
}) {
  const { contract, settings, lang } = options;

  const html = `
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="width: 60%; vertical-align: middle;">
          <h2 style="color: #1e3a8a; margin-bottom: 2px;">${settings.organizationName || settings.appName}</h2>
          <p style="margin: 0; font-size: 9pt; color: #475569;">${settings.address}</p>
          <p style="margin: 0; font-size: 8.5pt; color: #475569;">
            هاتف: ${settings.contactPhone} | س.ت: ${settings.commercialRegistration || '-'} | الرقم الضريبي: ${settings.taxId || '-'}
          </p>
        </td>
        <td style="width: 40%; text-align: left; vertical-align: middle;">
          <div style="border: 2px solid #0f172a; padding: 6px; background-color: #f8fafc; text-align: center; border-radius: 4px;">
            <span style="font-size: 11pt; font-weight: bold; color: #0f172a; display: block;">عقد تقديم خدمات نقل وتشغيل أسطول</span>
            <span style="font-size: 9pt; font-family: monospace; font-weight: bold; color: #2563eb;">${contract.contractNumber}</span>
            <span style="font-size: 8pt; color: #64748b; display: block;">تاريخ التحرير: ${new Date().toISOString().slice(0, 10)}</span>
          </div>
        </td>
      </tr>
    </table>

    <div class="contract-title">
      عقد تقديم خدمات نقل موظفين وتشغيل أسطول شركات (B2B)
    </div>

    <!-- Parties Table -->
    <table class="bordered">
      <tr>
        <th style="width: 50%; background-color: #1e293b; color: #ffffff;">الطرف الأول (المؤجر / مزود الخدمة)</th>
        <th style="width: 50%; background-color: #1e3a8a; color: #ffffff;">الطرف الثاني (الشركة المستفيدة)</th>
      </tr>
      <tr>
        <td style="vertical-align: top;">
          <p style="margin: 3px 0;"><strong>الشركة:</strong> ${settings.organizationName || settings.appName}</p>
          <p style="margin: 3px 0;"><strong>السجل التجاري:</strong> ${settings.commercialRegistration || '-'}</p>
          <p style="margin: 3px 0;"><strong>الرقم الضريبي:</strong> ${settings.taxId || '-'}</p>
          <p style="margin: 3px 0;"><strong>العنوان:</strong> ${settings.address}</p>
        </td>
        <td style="vertical-align: top;">
          <p style="margin: 3px 0;"><strong>الشركة المستفيدة:</strong> ${contract.companyName}</p>
          <p style="margin: 3px 0;"><strong>السجل التجاري / الرقم الضريبي:</strong> ${contract.companyCR || contract.companyTaxId || '-'}</p>
          <p style="margin: 3px 0;"><strong>الممثل المفوض:</strong> ${contract.companyRepName || contract.contactPerson || '-'}</p>
          <p style="margin: 3px 0;"><strong>الهاتف:</strong> ${contract.companyRepPhone || contract.companyPhone || '-'}</p>
          <p style="margin: 3px 0;"><strong>العنوان:</strong> ${contract.companyAddress || '-'}</p>
        </td>
      </tr>
    </table>

    <!-- Contract Scope Table -->
    <div class="section-title">نطاق الخدمة ومواصفات الأسطول والتشغيل</div>
    <table class="bordered">
      <tr style="background-color: #f8fafc; text-align: center;">
        <th>حجم الأسطول المخصص</th>
        <th>عدد الموظفين المستهدفين</th>
        <th>مدة العقد</th>
        <th>تاريخ السريان</th>
        <th>القيمة الشهرية</th>
        <th>الإجمالي السنوي</th>
      </tr>
      <tr style="text-align: center; font-weight: bold;">
        <td>${contract.fleetSize} مركبات</td>
        <td>${contract.employeeCount || 0} موظف</td>
        <td>${contract.durationMonths} شهر</td>
        <td>${contract.startDate}</td>
        <td style="color: #047857;">${formatCurrency(contract.monthlyPrice, settings.currency, lang)}</td>
        <td style="color: #1e3a8a;">${formatCurrency(contract.monthlyPrice * contract.durationMonths, settings.currency, lang)}</td>
      </tr>
    </table>

    <div class="section-title">تفاصيل الورديات وخطوط السير</div>
    <div style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f8fafc; margin-bottom: 10px;">
      <p style="margin: 0; font-size: 9.5pt;">${contract.shiftDetails || 'الورديات الصباحية والمسائية وفق الجداول المتفق عليها رسمياً بين الطرفين.'}</p>
    </div>

    <!-- Signatures -->
    <table style="width: 100%; border: none; margin-top: 25px;">
      <tr>
        <td style="width: 50%; padding: 4px; border: none; text-align: center;">
          <p style="margin: 0 0 5px 0; font-weight: bold; color: #1e293b;">الطرف الأول (مزود الخدمة)</p>
          <div class="signature-box">
            <span>الختم والتوقيع المعتمد</span>
          </div>
        </td>
        <td style="width: 50%; padding: 4px; border: none; text-align: center;">
          <p style="margin: 0 0 5px 0; font-weight: bold; color: #1e293b;">الطرف الثاني (الشركة المستفيدة)</p>
          <div class="signature-box">
            <span>توقيع وختم: ${contract.companyName}</span>
          </div>
        </td>
      </tr>
    </table>
  `;

  const fileName = `عقد_شركات_${contract.companyName}_${contract.contractNumber}`;
  downloadWordDocument(html, fileName);
}

/**
 * Export Car Sale & Ownership Transfer Contract to Word (.doc)
 */
export function exportSaleContractToWord(options: {
  sale: CarSale;
  settings: AppSettings;
  currency: Currency;
  lang: Language;
}) {
  const { sale, settings, currency, lang } = options;

  const html = `
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="width: 60%; vertical-align: middle;">
          <h2 style="color: #1e3a8a; margin-bottom: 2px;">${settings.organizationName || settings.appName}</h2>
          <p style="margin: 0; font-size: 9pt; color: #475569;">${settings.address}</p>
          <p style="margin: 0; font-size: 8.5pt; color: #475569;">
            هاتف: ${settings.contactPhone} | س.ت: ${settings.commercialRegistration || '-'} | الرقم الضريبي: ${settings.taxId || '-'}
          </p>
        </td>
        <td style="width: 40%; text-align: left; vertical-align: middle;">
          <div style="border: 2px solid #0f172a; padding: 6px; background-color: #f8fafc; text-align: center; border-radius: 4px;">
            <span style="font-size: 11pt; font-weight: bold; color: #0f172a; display: block;">عقد مبايعة ونقل ملكية مركبة</span>
            <span style="font-size: 9pt; font-family: monospace; font-weight: bold; color: #2563eb;">${sale.invoiceNumber}</span>
            <span style="font-size: 8pt; color: #64748b; display: block;">تاريخ البيع: ${sale.saleDate}</span>
          </div>
        </td>
      </tr>
    </table>

    <div class="contract-title">
      عقد بيع وتنازل عن سيارة نهائي - CAR SALE AGREEMENT
    </div>

    <!-- Parties -->
    <table class="bordered">
      <tr>
        <th style="width: 50%; background-color: #1e293b; color: #ffffff;">الطرف الأول (البائع)</th>
        <th style="width: 50%; background-color: #1e3a8a; color: #ffffff;">الطرف الثاني (المشتري)</th>
      </tr>
      <tr>
        <td style="vertical-align: top;">
          <p style="margin: 3px 0;"><strong>الاسم / المنشأة:</strong> ${sale.sellerName || settings.organizationName || settings.appName}</p>
          <p style="margin: 3px 0;"><strong>رقم الهوية / السجل:</strong> ${sale.sellerNationalId || settings.commercialRegistration || '-'}</p>
          <p style="margin: 3px 0;"><strong>الهاتف:</strong> ${settings.contactPhone}</p>
        </td>
        <td style="vertical-align: top;">
          <p style="margin: 3px 0;"><strong>الاسم الكامل:</strong> ${sale.buyerName}</p>
          <p style="margin: 3px 0;"><strong>رقم الهوية / الإقامة:</strong> ${sale.buyerNationalId}</p>
          <p style="margin: 3px 0;"><strong>الهاتف:</strong> ${sale.buyerPhone}</p>
          <p style="margin: 3px 0;"><strong>الجنسية / العنوان:</strong> ${sale.buyerAddress || '-'}</p>
        </td>
      </tr>
    </table>

    <!-- Vehicle Specs -->
    <div class="section-title">بيانات ومواصفات السيارة المبيعة</div>
    <table class="bordered">
      <tr style="background-color: #f8fafc; text-align: center;">
        <th>النوع والموديل</th>
        <th>سنة الصنع</th>
        <th>رقم اللوحة</th>
        <th>رقم الهيكل (VIN)</th>
      </tr>
      <tr style="text-align: center;">
        <td><strong>${sale.carModel}</strong></td>
        <td>${sale.year || 2023}</td>
        <td><strong style="font-family: monospace; font-size: 11pt; color: #1e3a8a;">${sale.carPlate}</strong></td>
        <td style="font-family: monospace;">${sale.chassisNumber || '-'}</td>
      </tr>
    </table>

    <!-- Price and Financials -->
    <div class="section-title">قيمة المبايعة وطريقة السداد</div>
    <table class="bordered">
      <tr style="background-color: #f8fafc; text-align: center;">
        <th>سعر البيع الإجمالي</th>
        <th>الدفعة المقدمة (العربون)</th>
        <th>المتبقي المستحق</th>
        <th>طريقة الدفع</th>
      </tr>
      <tr style="text-align: center; font-weight: bold;">
        <td style="color: #047857; font-size: 12pt;">${formatCurrency(sale.salePrice, currency, lang)}</td>
        <td>${formatCurrency(sale.paidDeposit || 0, currency, lang)}</td>
        <td style="color: #b91c1c;">${formatCurrency(sale.remainingBalance || 0, currency, lang)}</td>
        <td>${sale.paymentMethod === 'cash' ? 'نقدي (Cash)' : sale.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'شيك مصرفي'}</td>
      </tr>
    </table>

    <!-- Clauses -->
    <div class="section-title">إقرارات وبنود المبايعة</div>
    <div style="border: 1px solid #cbd5e1; padding: 8px; background-color: #fafafa; border-radius: 4px;">
      <p style="margin: 4px 0; font-size: 9pt;"><strong>1. المعاينة والفحص:</strong> يقر المشتري بأنه قد عاين وفحص المركبة المعاينة التامة النافية للجهالة وقبل بشرائها بحالتها الراهنة.</p>
      <p style="margin: 4px 0; font-size: 9pt;"><strong>2. نقل الملكية والرسوم:</strong> يلتزم الطرفان بإنهاء إجراءات نقل الملكية الرسمية، وتتحمل الأطراف الرسوم بحسب الاتفاق.</p>
      <p style="margin: 4px 0; font-size: 9pt;"><strong>3. إخلاء الطرف:</strong> بمجرد استلام المركبة، تسقط مسؤولية البائع عن أي مخالفات أو حوادث تقع بعد تاريخ ووقت الاستلام.</p>
    </div>

    <!-- Signatures -->
    <table style="width: 100%; border: none; margin-top: 25px;">
      <tr>
        <td style="width: 50%; padding: 4px; border: none; text-align: center;">
          <p style="margin: 0 0 5px 0; font-weight: bold; color: #1e293b;">توقيع الطرف الأول (البائع)</p>
          <div class="signature-box">
            <span>الختم والتوقيع</span>
          </div>
        </td>
        <td style="width: 50%; padding: 4px; border: none; text-align: center;">
          <p style="margin: 0 0 5px 0; font-weight: bold; color: #1e293b;">توقيع الطرف الثاني (المشتري)</p>
          <div class="signature-box">
            <span>توقيع المشتري: ${sale.buyerName}</span>
          </div>
        </td>
      </tr>
    </table>
  `;

  const fileName = `عقد_مبايعة_${sale.invoiceNumber}_${sale.buyerName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}`;
  downloadWordDocument(html, fileName);
}
