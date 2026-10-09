import { AssetItem, AssetCategory, AssetStatus } from '../types/asset';

export const DEFAULT_SPREADSHEET_ID = '1L8gKAqcj-0JhGnHekLiKR3bVCAC243lta7M2riK26d4';
export const DEFAULT_SHEET_NAME = 'ทะเบียนครุภัณฑ์';

export const SHEET_HEADERS = [
  'ลำดับที่',
  'รหัสครุภัณฑ์',
  'รายการ',
  'รุ่น/ยี่ห้อ',
  'วันเดือนปีที่ได้รับ',
  'ปีที่ได้รับ',
  'สถานที่ติดตั้ง',
  'ประเภทครุภัณฑ์',
  'จำนวน',
  'หน่วยนับ',
  'ราคาต่อหน่วย (บาท)',
  'สถานะ',
  'หมายเหตุ',
  'ภาพประกอบ',
  'วันที่อัปเดตล่าสุด',
];

export interface GoogleSheetMetadata {
  title: string;
  sheetNames: string[];
}

/**
 * Fetch spreadsheet metadata to check access and sheet tabs
 */
export async function getSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID
): Promise<GoogleSheetMetadata> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || response.statusText;
    throw new Error(`ไม่สามารถเข้าถึง Google Sheets ได้ (${response.status}): ${message}`);
  }

  const data = await response.json();
  const title = data.properties?.title || 'สมุดทะเบียนครุภัณฑ์';
  const sheetNames = (data.sheets || []).map((s: any) => s.properties?.title || '');
  return { title, sheetNames };
}

/**
 * Ensure sheet tab exists; create it if not
 */
export async function ensureSheetExists(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string = DEFAULT_SHEET_NAME
): Promise<void> {
  const metadata = await getSpreadsheetMetadata(accessToken, spreadsheetId);
  if (metadata.sheetNames.includes(sheetName)) {
    return;
  }

  // Create sheet tab
  const addSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const response = await fetch(addSheetUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    // If couldn't create, we can fallback to the first sheet name
    console.warn('Could not create sheet tab:', await response.text());
  }
}

/**
 * Read assets from Google Sheets
 */
export async function readAssetsFromSheet(
  accessToken: string,
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID,
  sheetName: string = DEFAULT_SHEET_NAME
): Promise<AssetItem[]> {
  const range = encodeURIComponent(`${sheetName}!A1:O5000`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('ไม่พบเอกสาร Google Sheets ตามรหัสที่ระบุ กรุณาตรวจสอบสิทธิ์และรหัสเอกสาร');
    }
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้');
  }

  const result = await response.json();
  const rows: any[][] = result.values || [];

  if (rows.length <= 1) {
    return []; // Empty or only headers
  }

  // Convert rows to AssetItems
  const assets: AssetItem[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[1] && !row[2]) continue;

    const seq = parseInt(row[0] || `${i}`, 10) || i;
    const code = String(row[1] || '').trim();
    const name = String(row[2] || '').trim();
    const model = String(row[3] || '').trim();
    const receivedDate = String(row[4] || '').trim();
    const receivedYear = String(row[5] || '').trim();
    const location = String(row[6] || '').trim();
    const categoryRaw = String(row[7] || '').trim() as AssetCategory;
    const quantity = parseInt(row[8] || '1', 10) || 1;
    const unit = String(row[9] || 'ชิ้น').trim();
    const price = parseFloat(String(row[10] || '0').replace(/,/g, '')) || 0;
    const statusRaw = String(row[11] || 'ใช้งานได้').trim() as AssetStatus;
    const remarks = String(row[12] || '').trim();
    const imageUrl = String(row[13] || '').trim();
    const updatedAt = String(row[14] || new Date().toISOString()).trim();

    assets.push({
      id: `gs-${i}-${Date.now().toString(36)}`,
      seq,
      code,
      name,
      model,
      receivedDate,
      receivedYear,
      location,
      category: categoryRaw || 'ครุภัณฑ์สำนักงาน',
      quantity,
      unit,
      price,
      status: statusRaw || 'ใช้งานได้',
      remarks,
      imageUrl,
      updatedAt,
    });
  }

  return assets;
}

/**
 * Write/Overwrite all assets to Google Sheets
 */
export async function writeAssetsToSheet(
  accessToken: string,
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID,
  assets: AssetItem[],
  sheetName: string = DEFAULT_SHEET_NAME
): Promise<void> {
  // Ensure the sheet tab exists
  try {
    await ensureSheetExists(accessToken, spreadsheetId, sheetName);
  } catch (e) {
    console.warn('Sheet existence check handled:', e);
  }

  // Prepare 2D values array
  const values: any[][] = [
    SHEET_HEADERS,
    ...assets.map((item, index) => [
      item.seq || index + 1,
      item.code || '',
      item.name || '',
      item.model || '',
      item.receivedDate || '',
      item.receivedYear || '',
      item.location || '',
      item.customCategory ? `ประเภทอื่น ๆ (${item.customCategory})` : item.category || '',
      item.quantity || 1,
      item.unit || 'ชิ้น',
      item.price || 0,
      item.customStatus ? `อื่นๆ (${item.customStatus})` : item.status || '',
      item.remarks || '',
      item.imageUrl || '',
      item.updatedAt || new Date().toISOString(),
    ]),
  ];

  // Clear existing content in sheet first
  const clearRange = encodeURIComponent(`${sheetName}!A1:O5000`);
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }).catch(() => {});

  // Update with fresh values
  const updateRange = encodeURIComponent(`${sheetName}!A1:O${values.length}`);
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`;

  const response = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'ไม่สามารถบันทึกข้อมูลลงใน Google Sheets ได้');
  }
}
