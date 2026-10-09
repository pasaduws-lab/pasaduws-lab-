import React, { useState } from 'react';
import { WangSaiLogo } from './WangSaiLogo';
import { ADMIN_PASSWORD_HASH } from './AdminAuthModal';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Image as ImageIcon,
  Database,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DEFAULT_DRIVE_FOLDER_ID, DEFAULT_DRIVE_FOLDER_URL } from '../services/googleDrive';

interface SettingsProps {
  isAdmin: boolean;
  onAdminLogin: () => void;
  onAdminLogout: () => void;
  googleUser?: User | null;
  isGoogleConnected?: boolean;
  onGoogleSignIn?: () => void;
  onGoogleSignOut?: () => void;
  onSyncSheets?: () => void;
  onPullFromSheets?: () => void;
  onOpenDriveImport?: () => void;
  isSyncing?: boolean;
  spreadsheetId?: string;
  onUpdateSpreadsheetId?: (id: string) => void;
  customLogoUrl: string;
  onUpdateLogoUrl: (url: string) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonContent: string) => void;
  onResetToDefault: () => void;
  isFirebaseConnected?: boolean;
  onSyncToFirestore?: () => void;
  totalAssetsCount?: number;
}

export const Settings: React.FC<SettingsProps> = ({
  isAdmin,
  onAdminLogin,
  onAdminLogout,
  onOpenDriveImport,
  customLogoUrl,
  onUpdateLogoUrl,
  onExportBackup,
  onImportBackup,
  onResetToDefault,
  onSyncToFirestore,
  totalAssetsCount = 0,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [tempLogoUrl, setTempLogoUrl] = useState(customLogoUrl);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD_HASH) {
      setAuthError('');
      setAuthSuccess('ยืนยันสิทธิ์ผู้ดูแลระบบสำเร็จ ยินดีต้อนรับเจ้าหน้าที่พัสดุ');
      setPasswordInput('');
      onAdminLogin();
      setTimeout(() => setAuthSuccess(''), 3000);
    } else {
      setAuthSuccess('');
      setAuthError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLogoUrl(tempLogoUrl.trim());
    setSaveSuccessMsg('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportBackup(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Admin Mode & Security Settings */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                สิทธิ์ผู้ดูแลระบบ (งานพัสดุและทรัพย์สิน)
              </h2>
              <p className="text-xs text-blue-200">
                ควบคุมสิทธิ์การเพิ่ม ลบ และแก้ไขข้อมูลทะเบียนครุภัณฑ์
              </p>
            </div>
          </div>

          <div>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                <Unlock className="w-3.5 h-3.5" />
                <span>ปลดล็อกสิทธิ์แล้ว</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                <Lock className="w-3.5 h-3.5" />
                <span>โหมดอ่านข้อมูลทั่วไป</span>
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {isAdmin ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">
                    เข้าสู่ระบบผู้ดูแลระบบเรียบร้อยแล้ว
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    ท่านสามารถเพิ่ม แก้ไข ลบรายการครุภัณฑ์ และบันทึกข้อมูลไปยัง Google Sheets ได้อย่างสมบูรณ์
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onAdminLogout}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-white border border-rose-300 rounded-lg hover:bg-rose-50 shadow-xs transition-colors self-start sm:self-auto"
              >
                ออกจากระบบผู้ดูแล
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                กรุณากรอกรหัสผ่านผู้ดูแลระบบเพื่อเปิดสิทธิ์การแก้ไขและบันทึกข้อมูลครุภัณฑ์
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รหัสผ่านผู้ดูแลระบบ
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="กรอกรหัสผ่านผู้ดูแลระบบ"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />

                {authError && (
                  <p className="mt-2 text-xs text-rose-600 font-semibold">{authError}</p>
                )}
                {authSuccess && (
                  <p className="mt-2 text-xs text-emerald-700 font-semibold">{authSuccess}</p>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
              >
                <Unlock className="w-4 h-4" />
                <span>ยืนยันปลดล็อกสิทธิ์</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 2. Firebase Firestore Database (Property Control Ledger) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                ฐานข้อมูลหลัก Firebase: Property Control Ledger
              </h2>
              <p className="text-xs text-blue-200">
                ข้อมูลครุภัณฑ์จะถูกบันทึกและซิงค์แบบเรียลไทม์บน Firebase Firestore (Property Control Ledger)
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>เชื่อมต่อแล้ว (พร้อมใช้งาน)</span>
          </span>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">โปรเจกต์ Firebase</span>
              <span className="text-sm font-bold text-blue-900">Property Control Ledger</span>
              <span className="text-[10px] text-slate-400 block font-mono">gen-lang-client-0379679813</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">คอลเลกชันฐานข้อมูล</span>
              <span className="text-sm font-mono font-bold text-indigo-700">property_control_ledger</span>
              <span className="text-[10px] text-slate-400 block font-sans">และ assets</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block">จำนวนรายการในระบบ</span>
              <span className="text-sm font-mono font-bold text-emerald-700">{totalAssetsCount} รายการ</span>
              <span className="text-[10px] text-emerald-600 block">ซิงค์สดตลอดเวลา</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            ทุกการเพิ่ม แก้ไข ลบ หรือนำเข้าข้อมูลจาก Google Drive จะถูกบันทึกจัดเก็บลงใน <strong>Firebase (Property Control Ledger)</strong> ทันทีโดยอัตโนมัติ และอัปเดตหน้าจอแบบสดทุกเครื่องที่เปิดใช้งาน
          </p>

          {isAdmin && onSyncToFirestore && (
            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={onSyncToFirestore}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>บันทึกและซิงค์ข้อมูลทั้งหมดไปยัง Firebase (Property Control Ledger)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2.5. Google Drive Folder Database Integration */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                การเชื่อมต่อโฟลเดอร์ Google Drive (แหล่งจัดเก็บไฟล์ฐานข้อมูล)
              </h2>
              <p className="text-xs text-slate-500">
                นำเข้าและอ่านไฟล์ฐานข้อมูลทะเบียนครุภัณฑ์จาก Google Drive ของหน่วยงาน
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-900 block">
                  โฟลเดอร์ฐานข้อมูล Google Drive ที่เชื่อมต่อ
                </span>
                <span className="text-xs font-mono font-bold text-slate-800 break-all select-all">
                  {DEFAULT_DRIVE_FOLDER_ID}
                </span>
                <p className="text-[11px] text-amber-800 mt-1">
                  รองรับไฟล์ Excel (.xlsx, .xls), CSV, JSON และ Google Sheets
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={DEFAULT_DRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs"
                >
                  <span>เปิดดูใน Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {onOpenDriveImport && (
                  <button
                    type="button"
                    onClick={onOpenDriveImport}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>ดึงข้อมูลจากโฟลเดอร์นี้</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            ระบบจะสแกนหาไฟล์ในโฟลเดอร์ ตรวจจับหัวคอลัมน์อัตโนมัติ (รหัสครุภัณฑ์, รายการ, รุ่น/ยี่ห้อ, วันที่ได้รับ, สถานที่, ประเภทครุภัณฑ์ 11 หมวดหมู่, ราคา, สถานะ) และนำเข้าสู่ระบบพร้อมบันทึกลงใน <strong>Firebase (Property Control Ledger)</strong> ทันที
          </p>
        </div>
      </div>

      {/* 3. Agency Logo and Identity Settings */}
      <form onSubmit={handleSaveConfig} className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                ตราสัญลักษณ์หน่วยงาน องค์การบริหารส่วนตำบลวังซ้าย
              </h2>
              <p className="text-xs text-slate-500">
                แสดงผลในหัวกระดาษเอกสารราชการ รายงาน บัตรประวัติ และแถบนำทาง
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-5">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <WangSaiLogo customLogoUrl={tempLogoUrl} size="lg" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ลิ้งก์ URL รูปภาพโลโก้หน่วยงาน (ปรับเปลี่ยนได้)
              </label>
              <input
                type="url"
                value={tempLogoUrl}
                onChange={(e) => setTempLogoUrl(e.target.value)}
                placeholder="เว้นว่างไว้เพื่อใช้ตราสัญลักษณ์ทางการจำลองมาตรฐาน"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                ระบบได้ตั้งค่าตราสัญลักษณ์มาตรฐานประจำ อบต.วังซ้าย ไว้เป็นค่าเริ่มต้น หรือสามารถระบุ URL ภาพตราสัญลักษณ์ของหน่วยงานได้
              </p>
            </div>
          </div>

          {saveSuccessMsg && (
            <p className="text-xs font-semibold text-emerald-700 animate-in fade-in">
              {saveSuccessMsg}
            </p>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </form>

      {/* 4. Backup & Maintenance */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                สำรองและจัดการฐานข้อมูล
              </h2>
              <p className="text-xs text-slate-500">
                ดาวน์โหลดไฟล์สำรองข้อมูล (JSON) หรือคืนค่าข้อมูลตัวอย่างของ อบต.วังซ้าย
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExportBackup}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-700" />
            <span>ดาวน์โหลดไฟล์สำรอง (JSON)</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>นำเข้าไฟล์สำรอง (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {isAdmin && (
            <button
              type="button"
              onClick={onResetToDefault}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-300 rounded-lg hover:bg-rose-100 shadow-xs ml-auto"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>คืนค่าข้อมูลตัวอย่างเริ่มต้น</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
