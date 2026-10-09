import React, { useState, useEffect } from 'react';
import {
  AssetItem,
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  AssetCategory,
  AssetStatus,
} from '../types/asset';
import {
  X,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface AssetFormModalProps {
  isOpen: boolean;
  assetToEdit?: AssetItem | null;
  nextSeq: number;
  onSave: (asset: AssetItem) => void;
  onClose: () => void;
}

export const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  assetToEdit,
  nextSeq,
  onSave,
  onClose,
}) => {
  const [seq, setSeq] = useState<number>(nextSeq);
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [receivedDate, setReceivedDate] = useState<string>('');
  const [receivedYear, setReceivedYear] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [category, setCategory] = useState<AssetCategory>('ครุภัณฑ์สำนักงาน');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('เครื่อง');
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState<AssetStatus>('ใช้งานได้');
  const [customStatus, setCustomStatus] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (assetToEdit) {
      setSeq(assetToEdit.seq);
      setCode(assetToEdit.code);
      setName(assetToEdit.name);
      setModel(assetToEdit.model);
      setReceivedDate(assetToEdit.receivedDate);
      setReceivedYear(assetToEdit.receivedYear);
      setLocation(assetToEdit.location);
      setCategory(assetToEdit.category);
      setCustomCategory(assetToEdit.customCategory || '');
      setQuantity(assetToEdit.quantity || 1);
      setUnit(assetToEdit.unit || 'เครื่อง');
      setPrice(assetToEdit.price || 0);
      setStatus(assetToEdit.status);
      setCustomStatus(assetToEdit.customStatus || '');
      setRemarks(assetToEdit.remarks || '');
      setImageUrl(assetToEdit.imageUrl || '');
      setImageTab(assetToEdit.imageUrl?.startsWith('data:') ? 'upload' : 'url');
    } else {
      // Default new asset values
      const currentYearBE = new Date().getFullYear() + 543;
      setSeq(nextSeq);
      setCode(`อบต.วซ-01-${String(currentYearBE).slice(-2)}-${String(nextSeq).padStart(3, '0')}`);
      setName('');
      setModel('');
      setReceivedDate(new Date().toISOString().split('T')[0]);
      setReceivedYear(String(currentYearBE));
      setLocation('สำนักงาน อบต.วังซ้าย');
      setCategory('ครุภัณฑ์สำนักงาน');
      setCustomCategory('');
      setQuantity(1);
      setUnit('เครื่อง');
      setPrice(0);
      setStatus('ใช้งานได้');
      setCustomStatus('');
      setRemarks('');
      setImageUrl('');
      setImageTab('upload');
    }
    setErrorMsg('');
  }, [assetToEdit, nextSeq, isOpen]);

  if (!isOpen) return null;

  // Handle image file upload (base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPEG, PNG, WebP)');
      return;
    }

    // Limit size to 2MB to keep data URL manageable
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('ขนาดไฟล์รูปภาพไม่ควรเกิน 2 MB เพื่อความรวดเร็วในการบันทึก');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
        setErrorMsg('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('กรุณาระบุชื่อรายการครุภัณฑ์');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('กรุณาระบุรหัสครุภัณฑ์');
      return;
    }

    const savedItem: AssetItem = {
      id: assetToEdit ? assetToEdit.id : `ws-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      seq: Number(seq) || 1,
      code: code.trim(),
      name: name.trim(),
      model: model.trim(),
      receivedDate: receivedDate || new Date().toISOString().split('T')[0],
      receivedYear: receivedYear.trim() || String(new Date().getFullYear() + 543),
      location: location.trim(),
      category,
      customCategory: category === 'ครุภัณฑ์อื่น' ? customCategory.trim() : undefined,
      quantity: Number(quantity) || 1,
      unit: unit.trim() || 'ชิ้น',
      price: Number(price) || 0,
      status,
      customStatus: status === 'อื่นๆ (ระบุ)' ? customStatus.trim() : undefined,
      remarks: remarks.trim(),
      imageUrl: imageUrl.trim(),
      updatedAt: new Date().toISOString(),
    };

    onSave(savedItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {assetToEdit ? 'แก้ไขข้อมูลรายการครุภัณฑ์' : 'บันทึกข้อมูลรายการครุภัณฑ์ใหม่'}
              </h2>
              <p className="text-xs text-blue-200">
                องค์การบริหารส่วนตำบลวังซ้าย ทะเบียนคุมทรัพย์สิน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs sm:text-sm font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: ลำดับที่ & รหัสครุภัณฑ์ & รายการ */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ลำดับที่ <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={seq}
                onChange={(e) => setSeq(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รหัสครุภัณฑ์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="เช่น อบต.วซ-01-67-001"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รายการ (ชื่อครุภัณฑ์) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น เครื่องคอมพิวเตอร์ประมวลผล All-in-One"
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 2: รุ่น/ยี่ห้อ & สถานที่ติดตั้ง */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รุ่น / ยี่ห้อ
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="เช่น Dell OptiPlex 5400 / สีดำ"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                สถานที่ติดตั้ง / แผนกที่ครอบครอง
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="เช่น กองคลัง, ห้องประชุมสภา, สำนักปลัด"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 3: วันเดือนปี ที่ได้รับ & ปีที่ได้รับ (พิมพ์ได้) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วันเดือนปี ที่ได้รับ
              </label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => {
                  setReceivedDate(e.target.value);
                  if (e.target.value) {
                    const yr = new Date(e.target.value).getFullYear() + 543;
                    setReceivedYear(String(yr));
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ปีที่ได้รับ (สามารถพิมพ์ได้ เช่น พ.ศ. 2567)
              </label>
              <input
                type="text"
                value={receivedYear}
                onChange={(e) => setReceivedYear(e.target.value)}
                placeholder="เช่น 2567 หรือ 2566"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 4: ประเภทครุภัณฑ์ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ประเภทครุภัณฑ์ <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {category === 'ครุภัณฑ์อื่น' && (
              <div className="animate-in fade-in duration-150">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ระบุประเภทอื่น ๆ เพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="เช่น ครุภัณฑ์ดนตรีและนาฏศิลป์, ครุภัณฑ์การแพทย์ ฯลฯ"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Row 5: จำนวน & หน่วยนับ & ราคา */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จำนวน
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หน่วยนับ
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="เช่น เครื่อง, คัน, หลัง, ตัว, ชุด"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ราคาต่อหน่วย (บาท)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Row 6: สถานะ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                สถานะการใช้งาน <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssetStatus)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {status === 'อื่นๆ (ระบุ)' && (
              <div className="animate-in fade-in duration-150">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ระบุสถานะอื่น ๆ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  placeholder="กรอกสถานะที่ต้องการระบุ"
                  required={status === 'อื่นๆ (ระบุ)'}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Row 7: หมายเหตุ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              หมายเหตุ
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม การโอนย้าย หรือข้อมูลสัญญาจัดซื้อ"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Row 8: ภาพประกอบ (อัปโหลด หรือ วางลิ้งก์) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-700" />
                <span>ภาพประกอบครุภัณฑ์</span>
              </label>
              <div className="inline-flex p-0.5 bg-slate-200 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    imageTab === 'upload' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  อัปโหลดรูปภาพ
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    imageTab === 'url' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  วางลิ้งก์รูปภาพ
                </button>
              </div>
            </div>

            {imageTab === 'upload' ? (
              <div>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all">
                  <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                  <span className="text-xs font-medium text-slate-700">
                    คลิกเพื่อเลือกไฟล์รูปภาพจากเครื่อง
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    รองรับ JPG, PNG, WebP (ขนาดไม่เกิน 2MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/asset-photo.jpg"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Image Preview */}
            {imageUrl && (
              <div className="mt-3 flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                <img
                  src={imageUrl}
                  alt="ภาพครุภัณฑ์"
                  className="w-20 h-20 object-cover rounded-md border border-slate-200"
                  onError={() => setErrorMsg('ไม่สามารถแสดงผลรูปภาพจากลิ้งก์ที่ระบุได้')}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    รูปภาพพร้อมบันทึก
                  </p>
                  <p className="text-[11px] text-slate-500">
                    จะถูกแนบไปกับทะเบียนคุมและบัตรประวัติครุภัณฑ์
                  </p>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ลบรูปภาพ
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{assetToEdit ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
