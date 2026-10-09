import * as XLSX from 'xlsx';
import { AssetItem, AssetCategory, AssetStatus, CATEGORY_OPTIONS, STATUS_OPTIONS } from '../types/asset';

export const DEFAULT_DRIVE_FOLDER_ID = '1Y3Qap7Z5BzHuHylGJpmPgh9pGMS3IacK';
export const DEFAULT_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1Y3Qap7Z5BzHuHylGJpmPgh9pGMS3IacK?usp=drive_link';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface DriveFolderInspectionResult {
  folderId: string;
  folderName?: string;
  files: DriveFileItem[];
  supportedFiles: DriveFileItem[];
}

export interface DriveImportResult {
  sourceFileName: string;
  fileId: string;
  assets: AssetItem[];
  totalCount: number;
}

/**
 * Extracts folder ID from a full Google Drive URL or returns the ID if already clean
 */
export function extractDriveFolderId(input: string): string {
  if (!input) return DEFAULT_DRIVE_FOLDER_ID;
  const trimmed = input.trim();

  // Pattern: /folders/([a-zA-Z0-9_-]+)
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  // Pattern: /d/([a-zA-Z0-9_-]+)
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) {
    return dMatch[1];
  }

  // Pattern: id=([a-zA-Z0-9_-]+)
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  // If it's a raw alphanumeric ID
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
    return trimmed;
  }

  return DEFAULT_DRIVE_FOLDER_ID;
}

/**
 * Lists all files inside a Google Drive folder using Drive API v3
 */
export async function listDriveFolderFiles(
  accessToken: string,
  folderId: string = DEFAULT_DRIVE_FOLDER_ID
): Promise<DriveFolderInspectionResult> {
  const cleanId = extractDriveFolderId(folderId);

  // 1. Fetch folder metadata if possible
  let folderName = 'โฟลเดอร์ Google Drive';
  try {
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${cleanId}?fields=id,name,mimeType`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (metaRes.ok) {
      const meta = await metaRes.json();
      if (meta.name) folderName = meta.name;
    }
  } catch (e) {
    console.warn('Folder metadata check warning:', e);
  }

  // 2. Fetch files in folder
  // q: 'cleanId' in parents and trashed = false
  const query = encodeURIComponent(`'${cleanId}' in parents and trashed = false`);
  const fields = encodeURIComponent('files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100&orderBy=name`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || response.statusText;
    throw new Error(`ไม่สามารถเข้าถึงโฟลเดอร์ Google Drive ได้ (${response.status}): ${message}`);
  }

  const data = await response.json();
  const files: DriveFileItem[] = data.files || [];

  // Filter files that are spreadsheets, excel, csv, or json
  const supportedFiles = files.filter((f) => {
    const mime = (f.mimeType || '').toLowerCase();
    const name = (f.name || '').toLowerCase();
    return (
      mime === 'application/vnd.google-apps.spreadsheet' ||
      mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mime === 'application/vnd.ms-excel' ||
      mime === 'text/csv' ||
      name.endsWith('.xlsx') ||
      name.endsWith('.xls') ||
      name.endsWith('.csv') ||
      name.endsWith('.json')
    );
  });

  return {
    folderId: cleanId,
    folderName,
    files,
    supportedFiles,
  };
}

/**
 * Normalize Thai category string into standard 11 categories
 */
function normalizeCategory(raw: string): { category: AssetCategory; customCategory?: string } {
  if (!raw) return { category: 'ครุภัณฑ์สำนักงาน' };
  const str = raw.trim();

  for (const cat of CATEGORY_OPTIONS) {
    if (str === cat || str.includes(cat)) {
      return { category: cat };
    }
  }

  // Fuzzy match keywords
  if (str.includes('สำนักงาน') || str.includes('โต๊ะ') || str.includes('เก้าอี้') || str.includes('ตู้')) {
    return { category: 'ครุภัณฑ์สำนักงาน' };
  }
  if (str.includes('ยานพาหนะ') || str.includes('ขนส่ง') || str.includes('รถ') || str.includes('จักรยานยนต์')) {
    return { category: 'ครุภัณฑ์ยานพาหนะและขนส่ง' };
  }
  if (str.includes('ไฟฟ้า') || str.includes('วิทยุ') || str.includes('เครื่องเสียง') || str.includes('พัดลม') || str.includes('แอร์')) {
    return { category: 'ครุภัณฑ์ไฟฟ้าและวิทยุ' };
  }
  if (str.includes('โฆษณา') || str.includes('เผยแพร่') || str.includes('โทรทัศน์') || str.includes('โปรเจคเตอร์') || str.includes('กล้อง')) {
    return { category: 'ครุภัณฑ์โฆษณาและเผยแพร่' };
  }
  if (str.includes('เกษตร') || str.includes('สวน') || str.includes('ตัดหญ้า') || str.includes('ปั๊มน้ำ')) {
    return { category: 'ครุภัณฑ์การเกษตร' };
  }
  if (str.includes('ก่อสร้าง') || str.includes('สว่าน') || str.includes('เครื่องมือช่าง')) {
    return { category: 'ครุภัณฑ์ก่อสร้าง' };
  }
  if (str.includes('สำรวจ') || str.includes('กล้องวัด') || str.includes('เข็มทิศ')) {
    return { category: 'ครุภัณฑ์สำรวจ' };
  }
  if (str.includes('คอมพิวเตอร์') || str.includes('โน้ตบุ๊ก') || str.includes('ปริ้นเตอร์') || str.includes('จอ') || str.includes('คอม')) {
    return { category: 'ครุภัณฑ์คอมพิวเตอร์' };
  }
  if (str.includes('บ้าน') || str.includes('ครัว') || str.includes('ตู้เย็น') || str.includes('ไมโครเวฟ')) {
    return { category: 'ครุภัณฑ์งานบ้านงานครัว' };
  }
  if (str.includes('กีฬา') || str.includes('ออกกำลังกาย')) {
    return { category: 'ครุภัณฑ์กีฬา' };
  }

  return { category: 'ครุภัณฑ์อื่น', customCategory: str };
}

/**
 * Normalize Thai status string into standard status options
 */
function normalizeStatus(raw: string): { status: AssetStatus; customStatus?: string } {
  if (!raw) return { status: 'ใช้งานได้' };
  const str = raw.trim();

  for (const st of STATUS_OPTIONS) {
    if (str === st) return { status: st };
  }

  if (str.includes('ปกติ') || str.includes('ดี') || str.includes('ใช้งานได้')) {
    return { status: 'ใช้งานได้' };
  }
  if (str.includes('พัง') || str.includes('ชำรุด')) {
    return { status: 'ชำรุด' };
  }
  if (str.includes('รอซ่อม')) {
    return { status: 'รอซ่อม' };
  }
  if (str.includes('ส่งซ่อม')) {
    return { status: 'ส่งซ่อม' };
  }
  if (str.includes('เสื่อม')) {
    return { status: 'เสื่อมสภาพ' };
  }
  if (str.includes('รอจำหน่าย')) {
    return { status: 'รอจำหน่าย' };
  }
  if (str.includes('จำหน่าย')) {
    return { status: 'จำหน่าย' };
  }
  if (str.includes('สูญหาย') || str.includes('หาย')) {
    return { status: 'สูญหาย' };
  }
  if (str.includes('ไม่พบ')) {
    return { status: 'ไม่พบตัว' };
  }

  return { status: 'อื่นๆ (ระบุ)', customStatus: str };
}

/**
 * Intelligent Thai Government 2D Table row parser
 */
export function parseRowsToAssets(rows: any[][], sourceFileName: string = 'drive_file'): AssetItem[] {
  if (!rows || rows.length < 2) return [];

  // 1. Locate Header Row
  let headerRowIndex = 0;
  let bestHeaderScore = -1;

  for (let r = 0; r < Math.min(10, rows.length); r++) {
    const row = rows[r];
    if (!row || !Array.isArray(row)) continue;
    let score = 0;
    const rowStr = row.map((c) => String(c || '').toLowerCase()).join(' ');

    if (rowStr.includes('รหัส') || rowStr.includes('เลขที่') || rowStr.includes('หมายเลข')) score += 3;
    if (rowStr.includes('รายการ') || rowStr.includes('ชื่อ') || rowStr.includes('ครุภัณฑ์')) score += 3;
    if (rowStr.includes('ลำดับ')) score += 2;
    if (rowStr.includes('ยี่ห้อ') || rowStr.includes('รุ่น')) score += 2;
    if (rowStr.includes('ราคา') || rowStr.includes('มูลค่า')) score += 2;
    if (rowStr.includes('สถานที่') || rowStr.includes('ที่ตั้ง')) score += 2;
    if (rowStr.includes('ประเภท')) score += 2;
    if (rowStr.includes('สถานะ') || rowStr.includes('สภาพ')) score += 2;

    if (score > bestHeaderScore) {
      bestHeaderScore = score;
      headerRowIndex = r;
    }
  }

  const headerRow = (rows[headerRowIndex] || []).map((c) => String(c || '').trim().toLowerCase());

  // Helper to find column index
  const findCol = (...keywords: string[]): number => {
    for (let c = 0; c < headerRow.length; c++) {
      const colText = headerRow[c];
      for (const kw of keywords) {
        if (colText.includes(kw.toLowerCase())) {
          return c;
        }
      }
    }
    return -1;
  };

  const colSeq = findCol('ลำดับ', 'ที่', 'seq', 'no');
  const colCode = findCol('รหัสครุภัณฑ์', 'รหัส', 'เลขที่', 'หมายเลข', 'code', 'id');
  const colName = findCol('รายการ', 'ชื่อครุภัณฑ์', 'ชื่อ', 'รายละเอียดรายการ', 'name', 'item');
  const colModel = findCol('รุ่น', 'ยี่ห้อ', 'แบบ', 'model', 'brand');
  const colDate = findCol('วันเดือนปี', 'วันที่ได้มา', 'วันที่ได้รับ', 'วันที่', 'date');
  const colYear = findCol('ปีที่ได้รับ', 'ปีงบประมาณ', 'ปี พ.ศ.', 'ปี', 'year');
  const colLocation = findCol('สถานที่ติดตั้ง', 'สถานที่', 'ห้อง', 'หน่วยงาน', 'location');
  const colCategory = findCol('ประเภทครุภัณฑ์', 'ประเภท', 'หมวด', 'category');
  const colQuantity = findCol('จำนวน', 'ปริมาณ', 'qty', 'quantity');
  const colUnit = findCol('หน่วยนับ', 'หน่วย', 'unit');
  const colPrice = findCol('ราคาต่อหน่วย', 'ราคา', 'มูลค่า', 'ราคาทุน', 'price', 'cost');
  const colStatus = findCol('สถานะ', 'สภาพ', 'status');
  const colRemarks = findCol('หมายเหตุ', 'remarks', 'note');
  const colImage = findCol('ภาพประกอบ', 'รูปภาพ', 'รูป', 'image', 'photo', 'url');

  const assets: AssetItem[] = [];
  const startRow = headerRowIndex + 1;

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Extract raw cell values
    const getVal = (colIdx: number): string => {
      if (colIdx >= 0 && colIdx < row.length && row[colIdx] !== undefined && row[colIdx] !== null) {
        return String(row[colIdx]).trim();
      }
      return '';
    };

    const code = getVal(colCode);
    const name = getVal(colName);

    // If both code and name are empty, skip row
    if (!code && !name) continue;

    const rawSeq = getVal(colSeq);
    const seq = parseInt(rawSeq, 10) || assets.length + 1;

    const model = getVal(colModel);
    let receivedDate = getVal(colDate);
    // If Excel date serial number (e.g. 44561)
    if (/^\d{5}$/.test(receivedDate)) {
      try {
        const parsedDate = new Date((parseInt(receivedDate, 10) - 25569) * 86400 * 1000);
        if (!isNaN(parsedDate.getTime())) {
          receivedDate = parsedDate.toISOString().split('T')[0];
        }
      } catch {}
    }

    let receivedYear = getVal(colYear);
    if (!receivedYear && receivedDate) {
      const yearMatch = receivedDate.match(/(25\d{2}|20\d{2}|\d{4})/);
      if (yearMatch) receivedYear = yearMatch[1];
    }
    if (!receivedYear) receivedYear = '2567';

    const location = getVal(colLocation) || 'อบต.วังซ้าย';
    const rawCategory = getVal(colCategory);
    const { category, customCategory } = normalizeCategory(rawCategory);

    const rawQty = getVal(colQuantity).replace(/,/g, '');
    const quantity = parseInt(rawQty, 10) || 1;

    const unit = getVal(colUnit) || 'เครื่อง';

    const rawPrice = getVal(colPrice).replace(/,/g, '').replace(/บาท/g, '').trim();
    const price = parseFloat(rawPrice) || 0;

    const rawStatus = getVal(colStatus);
    const { status, customStatus } = normalizeStatus(rawStatus);

    const remarks = getVal(colRemarks);
    const imageUrl = getVal(colImage);

    // Format safe unique ID
    const cleanId = `gdrive-${r}-${(code || `item-${r}`).replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    assets.push({
      id: cleanId,
      seq,
      code: code || `WS-${String(seq).padStart(4, '0')}`,
      name: name || 'ครุภัณฑ์ไม่มีชื่อ',
      model,
      receivedDate,
      receivedYear,
      location,
      category,
      customCategory,
      quantity,
      unit,
      price,
      status,
      customStatus,
      remarks,
      imageUrl,
      updatedAt: new Date().toISOString(),
    });
  }

  return assets;
}

/**
 * Downloads and parses a single file from Google Drive
 */
export async function fetchAndParseDriveFile(
  accessToken: string,
  file: DriveFileItem
): Promise<DriveImportResult> {
  const mime = (file.mimeType || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  // CASE 1: Google Spreadsheet
  if (mime === 'application/vnd.google-apps.spreadsheet') {
    // 1. Get first sheet name
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${file.id}?fields=sheets.properties.title`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    let sheetName = 'Sheet1';
    if (metaRes.ok) {
      const meta = await metaRes.json();
      sheetName = meta.sheets?.[0]?.properties?.title || 'Sheet1';
    }

    // 2. Fetch values
    const range = encodeURIComponent(`${sheetName}!A1:Z5000`);
    const valRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${file.id}/values/${range}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!valRes.ok) {
      const err = await valRes.json().catch(() => ({}));
      throw new Error(`ไม่สามารถอ่านข้อมูล Google Sheets (${file.name}): ${err?.error?.message || valRes.statusText}`);
    }

    const valData = await valRes.json();
    const rows: any[][] = valData.values || [];
    const assets = parseRowsToAssets(rows, file.name);

    return {
      sourceFileName: file.name,
      fileId: file.id,
      assets,
      totalCount: assets.length,
    };
  }

  // CASE 2: Excel (.xlsx / .xls)
  if (
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime === 'application/vnd.ms-excel' ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls')
  ) {
    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!fileRes.ok) {
      throw new Error(`ไม่สามารถดาวน์โหลดไฟล์ Excel (${file.name}) ได้`);
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error(`ไฟล์ Excel (${file.name}) ไม่มีแผ่นงาน (Sheet)`);
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    const assets = parseRowsToAssets(rows, file.name);

    return {
      sourceFileName: file.name,
      fileId: file.id,
      assets,
      totalCount: assets.length,
    };
  }

  // CASE 3: CSV
  if (mime === 'text/csv' || name.endsWith('.csv')) {
    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!fileRes.ok) {
      throw new Error(`ไม่สามารถดาวน์โหลดไฟล์ CSV (${file.name}) ได้`);
    }

    const csvText = await fileRes.text();
    const workbook = XLSX.read(csvText, { type: 'string' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    const assets = parseRowsToAssets(rows, file.name);

    return {
      sourceFileName: file.name,
      fileId: file.id,
      assets,
      totalCount: assets.length,
    };
  }

  // CASE 4: JSON
  if (name.endsWith('.json') || mime === 'application/json') {
    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!fileRes.ok) {
      throw new Error(`ไม่สามารถดาวน์โหลดไฟล์ JSON (${file.name}) ได้`);
    }
    const jsonText = await fileRes.text();
    const parsed = JSON.parse(jsonText);
    const rawList = Array.isArray(parsed) ? parsed : parsed.assets || parsed.data || [];
    const assets: AssetItem[] = rawList.map((item: any, idx: number) => {
      const { category, customCategory } = normalizeCategory(item.category || item.categoryName);
      const { status, customStatus } = normalizeStatus(item.status || item.condition);
      return {
        id: item.id || `json-${idx}-${Date.now().toString(36)}`,
        seq: Number(item.seq) || idx + 1,
        code: String(item.code || item.assetCode || `WS-${String(idx + 1).padStart(4, '0')}`),
        name: String(item.name || item.assetName || 'ครุภัณฑ์'),
        model: String(item.model || item.brand || ''),
        receivedDate: String(item.receivedDate || ''),
        receivedYear: String(item.receivedYear || '2567'),
        location: String(item.location || 'อบต.วังซ้าย'),
        category,
        customCategory: customCategory || item.customCategory,
        quantity: Number(item.quantity) || 1,
        unit: String(item.unit || 'เครื่อง'),
        price: Number(item.price) || 0,
        status,
        customStatus: customStatus || item.customStatus,
        remarks: String(item.remarks || ''),
        imageUrl: String(item.imageUrl || ''),
        updatedAt: item.updatedAt || new Date().toISOString(),
      };
    });

    return {
      sourceFileName: file.name,
      fileId: file.id,
      assets,
      totalCount: assets.length,
    };
  }

  throw new Error(`ประเภทไฟล์ "${file.name}" ไม่รองรับการนำเข้า (รองรับ Google Sheets, Excel .xlsx/.xls, CSV, JSON)`);
}

/**
 * Scan all files in Google Drive folder and pull all assets from them
 */
export async function pullAllAssetsFromDriveFolder(
  accessToken: string,
  folderId: string = DEFAULT_DRIVE_FOLDER_ID
): Promise<{
  folderName: string;
  filesProcessed: string[];
  allAssets: AssetItem[];
  totalCount: number;
}> {
  const inspection = await listDriveFolderFiles(accessToken, folderId);
  const supported = inspection.supportedFiles;

  if (supported.length === 0) {
    if (inspection.files.length === 0) {
      throw new Error(
        `ไม่พบไฟล์ใดๆ ในโฟลเดอร์ Google Drive (${inspection.folderName || folderId}) กรุณาตรวจสอบว่ามีไฟล์ครุภัณฑ์และสิทธิ์การเข้าถึง`
      );
    } else {
      const names = inspection.files.map((f) => f.name).join(', ');
      throw new Error(
        `พบไฟล์ ${inspection.files.length} รายการในโฟลเดอร์ แต่ไม่มีไฟล์ตารางข้อมูลที่รองรับ (.xlsx, .xls, .csv, Google Sheets): [${names}]`
      );
    }
  }

  const allAssets: AssetItem[] = [];
  const filesProcessed: string[] = [];

  for (const file of supported) {
    try {
      const res = await fetchAndParseDriveFile(accessToken, file);
      if (res.assets.length > 0) {
        filesProcessed.push(`${file.name} (${res.assets.length} รายการ)`);
        allAssets.push(...res.assets);
      }
    } catch (e: any) {
      console.warn(`Error reading file ${file.name}:`, e);
      // Continue with other files if one fails
    }
  }

  if (allAssets.length === 0) {
    throw new Error(
      `อ่านไฟล์ในโฟลเดอร์สำเร็จแต่ไม่พบรายการข้อมูลครุภัณฑ์ กรุณาตรวจสอบหัวตารางในไฟล์ (${supported.map((f) => f.name).join(', ')})`
    );
  }

  // Deduplicate or resequence if needed
  // Ensure unique sequential sequence numbers
  allAssets.forEach((item, index) => {
    item.seq = index + 1;
  });

  return {
    folderName: inspection.folderName || 'โฟลเดอร์ Google Drive',
    filesProcessed,
    allAssets,
    totalCount: allAssets.length,
  };
}
