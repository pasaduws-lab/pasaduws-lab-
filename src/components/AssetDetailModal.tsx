import React from 'react';
import { AssetItem, STATUS_COLORS } from '../types/asset';
import { WangSaiLogo } from './WangSaiLogo';
import {
  X,
  Printer,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Tag,
  QrCode,
  CheckCircle2,
  Hash,
  Lock,
} from 'lucide-react';

interface AssetDetailModalProps {
  asset: AssetItem | null;
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (asset: AssetItem) => void;
  onDelete: (asset: AssetItem) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  isOpen,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !asset) return null;

  const statusStyle = STATUS_COLORS[asset.status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Top Controls */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              บัตรประวัติครุภัณฑ์
            </span>
            <span className="text-xs font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
              {asset.code}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintCard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs"
              title="พิมพ์บัตรประวัติครุภัณฑ์"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์บัตร</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(asset);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 shadow-xs"
              title={isAdmin ? 'แก้ไขข้อมูลครุภัณฑ์' : 'แก้ไขข้อมูล (ต้องยืนยันรหัสผ่านแอดมิน)'}
            >
              {!isAdmin && <Lock className="w-3 h-3 text-amber-600" />}
              <Edit className="w-3.5 h-3.5" />
              <span>แก้ไข</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(asset);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-300 rounded-lg hover:bg-rose-100 shadow-xs"
              title={isAdmin ? 'ลบข้อมูลครุภัณฑ์' : 'ลบข้อมูล (ต้องยืนยันรหัสผ่านแอดมิน)'}
            >
              {!isAdmin && <Lock className="w-3 h-3 text-rose-600" />}
              <Trash2 className="w-3.5 h-3.5" />
              <span>ลบ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Official Header */}
          <div className="text-center pb-5 border-b-2 border-slate-200">
            <div className="flex justify-center mb-2">
              <WangSaiLogo size="lg" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              ทะเบียนคุมทรัพย์สิน (ครุภัณฑ์)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              องค์การบริหารส่วนตำบลวังซ้าย งานพัสดุและทรัพย์สิน กองคลัง
            </p>
          </div>

          {/* Main Grid: Photo & Primary Info */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
            {/* Photo & QR Asset Tag */}
            <div className="sm:col-span-5 space-y-4">
              <div className="w-full aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative">
                {asset.imageUrl ? (
                  <img
                    src={asset.imageUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <WangSaiLogo size="md" className="mx-auto mb-2 opacity-50" />
                    <span className="text-xs">ไม่มีภาพประกอบครุภัณฑ์</span>
                  </div>
                )}
              </div>

              {/* Physical Tag Mini Sticker Preview */}
              <div className="p-3 bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-xl text-center">
                <p className="text-[11px] font-bold text-amber-900 uppercase">
                  ป้ายทะเบียนติดครุภัณฑ์ (Asset Tag)
                </p>
                <div className="mt-2 p-2 bg-white rounded-lg border border-amber-200 flex items-center gap-3">
                  <div className="w-14 h-14 bg-slate-900 text-white flex items-center justify-center rounded-md shrink-0">
                    <QrCode className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-[10px] text-slate-500 font-medium truncate">อบต.วังซ้าย</p>
                    <p className="text-xs font-mono font-bold text-slate-900 truncate">{asset.code}</p>
                    <p className="text-[11px] text-slate-700 truncate">{asset.name}</p>
                    <p className="text-[10px] text-slate-500">ปี {asset.receivedYear}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comprehensive Attributes Table */}
            <div className="sm:col-span-7 space-y-3.5">
              <div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  {asset.customStatus ? `อื่นๆ (${asset.customStatus})` : asset.status}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2 leading-snug">
                  {asset.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ลำดับที่ {asset.seq} • รหัสทะเบียน: {asset.code}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Tag className="w-3.5 h-3.5 text-blue-700" /> ประเภทครุภัณฑ์:
                  </span>
                  <span className="font-bold text-slate-800 text-right">
                    {asset.customCategory ? `ประเภทอื่น ๆ (${asset.customCategory})` : asset.category}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Hash className="w-3.5 h-3.5 text-blue-700" /> รุ่น / ยี่ห้อ:
                  </span>
                  <span className="font-semibold text-slate-800 text-right">
                    {asset.model || '-'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-blue-700" /> วันที่และปีที่ได้รับ:
                  </span>
                  <span className="font-semibold text-slate-800 text-right">
                    {asset.receivedDate ? new Date(asset.receivedDate).toLocaleDateString('th-TH') : '-'} (ปี พ.ศ. {asset.receivedYear})
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-blue-700" /> สถานที่ติดตั้ง:
                  </span>
                  <span className="font-semibold text-slate-800 text-right">
                    {asset.location || '-'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">จำนวนและหน่วยนับ:</span>
                  <span className="font-semibold text-slate-800">
                    {asset.quantity} {asset.unit || 'เครื่อง'}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">ราคาต่อหน่วย:</span>
                  <span className="font-bold text-emerald-700 font-mono text-base">
                    ฿{asset.price.toLocaleString('th-TH')} บาท
                  </span>
                </div>
              </div>

              {/* Remarks */}
              {asset.remarks && (
                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900">
                  <strong className="block font-bold text-blue-950 mb-0.5">หมายเหตุ:</strong>
                  {asset.remarks}
                </div>
              )}
            </div>
          </div>

          {/* Footer Close Button */}
          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
