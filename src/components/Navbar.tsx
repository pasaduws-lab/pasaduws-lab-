import React from 'react';
import { WangSaiLogo } from './WangSaiLogo';
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  FileText,
  Settings as SettingsIcon,
  ShieldCheck,
  Lock,
  RefreshCw,
  LogOut,
  UserCheck,
  FolderOpen,
} from 'lucide-react';
import { User } from 'firebase/auth';

export type NavTab = 'dashboard' | 'table' | 'add' | 'reports' | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isAdmin: boolean;
  onRequestAdmin: () => void;
  onAdminLogout: () => void;
  googleUser?: User | null;
  isGoogleConnected?: boolean;
  onGoogleSignIn?: () => void;
  onGoogleSignOut?: () => void;
  onSyncSheets?: () => void;
  onOpenDriveImport?: () => void;
  isSyncing?: boolean;
  customLogoUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isAdmin,
  onRequestAdmin,
  onAdminLogout,
  googleUser,
  isGoogleConnected,
  onGoogleSignIn,
  onGoogleSignOut,
  onSyncSheets,
  onOpenDriveImport,
  isSyncing,
  customLogoUrl,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white shadow-lg border-b-2 border-amber-500/80">
      {/* Top Bar with Agency Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 border-b border-blue-800/60">
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5">
            <WangSaiLogo customLogoUrl={customLogoUrl} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-xs">
                  ระบบทะเบียนครุภัณฑ์
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-blue-200 font-medium">
                องค์การบริหารส่วนตำบลวังซ้าย อำเภอวังเหนือ จังหวัดลำปาง (งานพัสดุและทรัพย์สิน)
              </p>
            </div>
          </div>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-2.5">
            {/* Google Drive Import Button */}
            {onOpenDriveImport && (
              <button
                type="button"
                onClick={onOpenDriveImport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-800/80 hover:bg-blue-700 text-white shadow-xs transition-colors border border-blue-600/60"
                title="ดึงฐานข้อมูลจากโฟลเดอร์ Google Drive (1Y3Qap7Z5BzHuHylGJpmPgh9pGMS3IacK)"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">ดึงข้อมูล Google Drive</span>
                <span className="inline md:hidden">Drive</span>
              </button>
            )}

            {/* Firebase Property Control Ledger Live Status */}
            <div
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-900/60 hover:bg-blue-900/90 text-blue-100 border border-blue-600/50 transition-colors shadow-xs"
              title="ฐานข้อมูลคลาวด์ Firebase Firestore: Property Control Ledger"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-[11px] font-bold text-white tracking-wide">
                Firebase: Property Control Ledger
              </span>
            </div>

            {/* Admin Status Pill */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 bg-amber-400/20 text-amber-200 border border-amber-400/50 px-2.5 py-1 rounded-lg text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">ผู้ดูแลระบบ</span>
                <button
                  type="button"
                  onClick={onAdminLogout}
                  className="ml-1 text-amber-300 hover:text-white underline text-[11px]"
                  title="ออกจากโหมดผู้ดูแลระบบ"
                >
                  ออก
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onRequestAdmin}
                className="inline-flex items-center gap-1.5 bg-blue-800/80 hover:bg-blue-700 text-blue-200 hover:text-white border border-blue-700/60 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                title="เข้าสู่ระบบผู้ดูแลระบบ"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>แอดมินพัสดุ</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>แดชบอร์ดสรุปภาพรวม</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('table')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'table'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ทะเบียนรายการครุภัณฑ์</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('add')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'add'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>บันทึกข้อมูลรายการ</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('reports')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'reports'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>รายงานและพิมพ์เอกสาร</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              currentTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-blue-100 hover:bg-blue-800/60 hover:text-white'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>ตั้งค่าและเชื่อมต่อชีต</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
