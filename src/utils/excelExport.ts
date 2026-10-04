export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export function exportToExcel(options: {
  fileName: string;
  sheetName: string;
  title?: string;
  subtitle?: string;
  columns: ExcelColumn[];
  data: Record<string, any>[];
  summaryRows?: { label: string; value: string | number }[];
}) {
  const { fileName, sheetName, title, subtitle, columns, data, summaryRows } = options;

  // Build an HTML-based Excel Spreadsheet with full UTF-8 BOM, RTL Arabic support, and professional table styles
  let html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" 
        xmlns:x="urn:schemas-microsoft-com:office:excel" 
        xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>${escapeXml(sheetName.slice(0, 31))}</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
              <x:DoNotDisplayZeros/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      body {
        font-family: Arial, Tahoma, sans-serif;
        direction: rtl;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        direction: rtl;
      }
      th {
        background-color: #1e3a8a;
        color: #ffffff;
        font-weight: bold;
        font-size: 11pt;
        border: 1px solid #0f172a;
        padding: 8px 12px;
        text-align: center;
      }
      td {
        border: 1px solid #cbd5e1;
        padding: 6px 10px;
        font-size: 10pt;
        color: #1e293b;
        text-align: center;
        mso-number-format: "\\@";
      }
      .title {
        font-size: 15pt;
        font-weight: bold;
        color: #1e3a8a;
        text-align: center;
        padding: 10px;
      }
      .subtitle {
        font-size: 11pt;
        color: #475569;
        text-align: center;
        padding: 4px;
      }
      .summary-label {
        font-weight: bold;
        background-color: #f1f5f9;
        text-align: right;
      }
      .summary-value {
        font-weight: bold;
        background-color: #e2e8f0;
        color: #0f172a;
      }
    </style>
  </head>
  <body>
    <table>
  `;

  const colSpan = Math.max(columns.length, 2);

  // Optional Title
  if (title) {
    html += `<tr><td colspan="${colSpan}" class="title">${escapeXml(title)}</td></tr>`;
  }
  if (subtitle) {
    html += `<tr><td colspan="${colSpan}" class="subtitle">${escapeXml(subtitle)}</td></tr>`;
  }
  if (title || subtitle) {
    html += `<tr><td colspan="${colSpan}" style="border:none; height:10px;"></td></tr>`;
  }

  // Header Row
  html += `<tr>`;
  columns.forEach((col) => {
    html += `<th>${escapeXml(col.header)}</th>`;
  });
  html += `</tr>`;

  // Data Rows
  data.forEach((item, idx) => {
    const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    html += `<tr style="background-color: ${bgColor};">`;
    columns.forEach((col) => {
      const val = item[col.key] ?? '';
      html += `<td>${escapeXml(String(val))}</td>`;
    });
    html += `</tr>`;
  });

  // Summary Rows
  if (summaryRows && summaryRows.length > 0) {
    html += `<tr><td colspan="${colSpan}" style="border:none; height:12px;"></td></tr>`;
    summaryRows.forEach((sr) => {
      html += `<tr>`;
      html += `<td colspan="${Math.max(1, colSpan - 1)}" class="summary-label">${escapeXml(sr.label)}</td>`;
      html += `<td class="summary-value">${escapeXml(String(sr.value))}</td>`;
      html += `</tr>`;
    });
  }

  html += `
    </table>
  </body>
  </html>
  `;

  // Generate Blob with UTF-8 BOM (\uFEFF)
  const fullFileName = fileName.endsWith('.xls') || fileName.endsWith('.xlsx')
    ? fileName
    : `${fileName}.xls`;

  const blob = new Blob(['\uFEFF' + html], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fullFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
