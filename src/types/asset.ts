export type AssetCategory =
  | 'ครุภัณฑ์สำนักงาน'
  | 'ครุภัณฑ์ยานพาหนะและขนส่ง'
  | 'ครุภัณฑ์ไฟฟ้าและวิทยุ'
  | 'ครุภัณฑ์โฆษณาและเผยแพร่'
  | 'ครุภัณฑ์การเกษตร'
  | 'ครุภัณฑ์ก่อสร้าง'
  | 'ครุภัณฑ์สำรวจ'
  | 'ครุภัณฑ์คอมพิวเตอร์'
  | 'ครุภัณฑ์งานบ้านงานครัว'
  | 'ครุภัณฑ์กีฬา'
  | 'ครุภัณฑ์อื่น';

export type AssetStatus =
  | 'ใช้งานได้'
  | 'ชำรุด'
  | 'รอซ่อม'
  | 'ส่งซ่อม'
  | 'เสื่อมสภาพ'
  | 'รอจำหน่าย'
  | 'จำหน่าย'
  | 'สูญหาย'
  | 'ไม่พบตัว'
  | 'อื่นๆ (ระบุ)';

export interface AssetItem {
  id: string;
  seq: number; // ลำดับที่
  code: string; // รหัสครุภัณฑ์
  name: string; // รายการ
  model: string; // รุ่น/ยี่ห้อ
  receivedDate: string; // วันเดือนปี ที่ได้รับ (YYYY-MM-DD)
  receivedYear: string; // ปีที่ได้รับ (พ.ศ. หรือข้อความพิมพ์ได้ เช่น 2567)
  location: string; // สถานที่ติดตั้ง
  category: AssetCategory;
  customCategory?: string; // ประเภทอื่น ๆ ระบุ (ถ้ามี)
  quantity: number; // จำนวน
  unit: string; // หน่วยนับ (เครื่อง, คัน, ตัว, ชุด ฯลฯ)
  price: number; // ราคาต่อหน่วย (บาท)
  status: AssetStatus;
  customStatus?: string; // อื่นๆ ระบุ
  remarks: string; // หมายเหตุ
  imageUrl?: string; // ลิ้งก์รูปภาพ หรือ base64 data url
  updatedAt?: string; // วันที่อัปเดตล่าสุด
}

export const CATEGORY_OPTIONS: AssetCategory[] = [
  'ครุภัณฑ์สำนักงาน',
  'ครุภัณฑ์ยานพาหนะและขนส่ง',
  'ครุภัณฑ์ไฟฟ้าและวิทยุ',
  'ครุภัณฑ์โฆษณาและเผยแพร่',
  'ครุภัณฑ์การเกษตร',
  'ครุภัณฑ์ก่อสร้าง',
  'ครุภัณฑ์สำรวจ',
  'ครุภัณฑ์คอมพิวเตอร์',
  'ครุภัณฑ์งานบ้านงานครัว',
  'ครุภัณฑ์กีฬา',
  'ครุภัณฑ์อื่น',
];

export const STATUS_OPTIONS: AssetStatus[] = [
  'ใช้งานได้',
  'ชำรุด',
  'รอซ่อม',
  'ส่งซ่อม',
  'เสื่อมสภาพ',
  'รอจำหน่าย',
  'จำหน่าย',
  'สูญหาย',
  'ไม่พบตัว',
  'อื่นๆ (ระบุ)',
];

export const STATUS_COLORS: Record<AssetStatus, { bg: string; text: string; border: string }> = {
  'ใช้งานได้': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
  'ชำรุด': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  'รอซ่อม': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  'ส่งซ่อม': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300' },
  'เสื่อมสภาพ': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  'รอจำหน่าย': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  'จำหน่าย': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300' },
  'สูญหาย': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-400' },
  'ไม่พบตัว': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-300' },
  'อื่นๆ (ระบุ)': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-300' },
};
