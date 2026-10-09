import React, { useState, useMemo } from 'react';
import {
  AssetItem,
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  STATUS_COLORS,
  AssetCategory,
  AssetStatus,
} from '../types/asset';
import { CategoryBarChart } from './CategoryBarChart';
import {
  Search,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Package,
  Coins,
  CheckCircle,
  AlertTriangle,
  Archive,
  Calendar,
  MapPin,
  RotateCcw,
  Lock,
  ShieldCheck,
  X,
  Tag,
  Hash,
  Sparkles,
  FolderOpen,
} from 'lucide-react';

interface DashboardProps {
  assets: AssetItem[];
  isAdmin: boolean;
  onRequestAdmin?: () => void;
  onAddClick: () => void;
  onViewClick: (asset: AssetItem) => void;
  onEditClick: (asset: AssetItem) => void;
  onDeleteClick: (asset: AssetItem) => void;
  onOpenDriveImport?: () => void;
}

type SortField = 'thai_alphabet' | 'date_desc' | 'date_asc' | 'price_desc' | 'seq_asc';
type SearchScope = 'all' | 'name' | 'code';

// Helper to highlight matching text in search results
function highlightText(text: string, query: string) {
  if (!query.trim() || !text) return text;
  const escaped = query.trim().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  if (parts.length <= 1) return text;
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i} className="bg-amber-200 text-amber-950 font-bold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export const Dashboard: React.FC<DashboardProps> = ({
  assets,
  isAdmin,
  onRequestAdmin,
  onAddClick,
  onViewClick,
  onEditClick,
  onDeleteClick,
  onOpenDriveImport,
}) => {
  // Filters & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [selectedStatus, setSelectedStatus] = useState<string>('ทั้งหมด');
  const [selectedYear, setSelectedYear] = useState<string>('ทั้งหมด');
  const [selectedLocation, setSelectedLocation] = useState<string>('ทั้งหมด');
  const [sortField, setSortField] = useState<SortField>('thai_alphabet');

  // Unique years & locations for filter dropdowns
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(assets.map((a) => a.receivedYear).filter(Boolean)));
    return years.sort((a, b) => b.localeCompare(a));
  }, [assets]);

  const availableLocations = useMemo(() => {
    const locs = Array.from(new Set(assets.map((a) => a.location).filter(Boolean)));
    return locs.sort();
  }, [assets]);

  // Overall KPI Statistics
  const totalAssetsCount = assets.length;
  const totalUnits = assets.reduce((sum, a) => sum + (a.quantity || 1), 0);
  const totalMonetaryValue = assets.reduce(
    (sum, a) => sum + (a.price || 0) * (a.quantity || 1),
    0
  );
  const goodConditionCount = assets.filter((a) => a.status === 'ใช้งานได้').length;
  const repairOrBrokenCount = assets.filter((a) =>
    ['ชำรุด', 'รอซ่อม', 'ส่งซ่อม'].includes(a.status)
  ).length;
  const pendingDisposalCount = assets.filter((a) =>
    ['เสื่อมสภาพ', 'รอจำหน่าย', 'จำหน่าย', 'สูญหาย', 'ไม่พบตัว'].includes(a.status)
  ).length;

  // Filtered & Sorted Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      // Search term matching with scope
      let matchesSearch = true;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        if (searchScope === 'name') {
          matchesSearch = item.name.toLowerCase().includes(query);
        } else if (searchScope === 'code') {
          matchesSearch = item.code.toLowerCase().includes(query);
        } else {
          matchesSearch =
            item.name.toLowerCase().includes(query) ||
            item.code.toLowerCase().includes(query) ||
            item.model.toLowerCase().includes(query) ||
            item.location.toLowerCase().includes(query) ||
            item.remarks.toLowerCase().includes(query);
        }
      }

      // Category filter
      const matchesCategory =
        selectedCategory === 'ทั้งหมด' ||
        (selectedCategory === 'ครุภัณฑ์อื่น'
          ? item.category === 'ครุภัณฑ์อื่น' || (item.category && !CATEGORY_OPTIONS.includes(item.category))
          : item.category === selectedCategory);

      // Status filter
      const matchesStatus =
        selectedStatus === 'ทั้งหมด' ||
        (selectedStatus === 'อื่นๆ (ระบุ)'
          ? item.status === 'อื่นๆ (ระบุ)' || item.customStatus
          : item.status === selectedStatus);

      // Year filter
      const matchesYear =
        selectedYear === 'ทั้งหมด' || item.receivedYear === selectedYear;

      // Location filter
      const matchesLocation =
        selectedLocation === 'ทั้งหมด' || item.location === selectedLocation;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesYear &&
        matchesLocation
      );
    });
  }, [assets, searchTerm, selectedCategory, selectedStatus, selectedYear, selectedLocation]);

  // Sorting
  const sortedAssets = useMemo(() => {
    const list = [...filteredAssets];
    switch (sortField) {
      case 'thai_alphabet':
        // Sort by Thai alphabetical order using localeCompare('th')
        return list.sort((a, b) => a.name.localeCompare(b.name, 'th'));
      case 'date_desc':
        // Sort received date newest to oldest
        return list.sort((a, b) => {
          const dateA = a.receivedDate || '';
          const dateB = b.receivedDate || '';
          return dateB.localeCompare(dateA);
        });
      case 'date_asc':
        return list.sort((a, b) => {
          const dateA = a.receivedDate || '';
          const dateB = b.receivedDate || '';
          return dateA.localeCompare(dateB);
        });
      case 'price_desc':
        return list.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'seq_asc':
      default:
        return list.sort((a, b) => a.seq - b.seq);
    }
  }, [filteredAssets, sortField]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSearchScope('all');
    setSelectedCategory('ทั้งหมด');
    setSelectedStatus('ทั้งหมด');
    setSelectedYear('ทั้งหมด');
    setSelectedLocation('ทั้งหมด');
    setSortField('thai_alphabet');
  };

  return (
    <div className="space-y-6">
      {/* Admin Status Notice Banner */}
      {!isAdmin ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-200/60 text-amber-900 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-950">
                ขณะนี้อยู่ในโหมดผู้ใช้งานทั่วไป (อ่านข้อมูลและพิมพ์รายงาน)
              </p>
              <p className="text-[11px] sm:text-xs text-amber-800">
                การเพิ่มรายการใหม่ แก้ไข หรือลบข้อมูลครุภัณฑ์ สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin)
              </p>
            </div>
          </div>
          {onRequestAdmin && (
            <button
              type="button"
              onClick={onRequestAdmin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบผู้ดูแล</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">
              เข้าสู่ระบบในสิทธิ์ผู้ดูแลระบบ (Admin) — ท่านสามารถเพิ่ม แก้ไข และลบข้อมูลได้
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold hidden sm:inline">
            งานพัสดุและทรัพย์สิน อบต.วังซ้าย
          </span>
        </div>
      )}

      {/* 1. Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Assets */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1 bg-gradient-to-br from-blue-900 to-blue-950 text-white rounded-xl p-4 shadow-sm border border-blue-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-200">
              จำนวนครุภัณฑ์ทั้งหมด
            </span>
            <div className="p-1.5 rounded-lg bg-white/10 text-amber-300">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
              {totalAssetsCount.toLocaleString('th-TH')}
            </span>
            <span className="ml-1.5 text-xs text-blue-200 font-sans">
              รายการ ({totalUnits.toLocaleString('th-TH')} หน่วย)
            </span>
          </div>
        </div>

        {/* Total Value */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-1 bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              มูลค่ารวมตามทะเบียน
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-700">
              ฿{totalMonetaryValue.toLocaleString('th-TH')}
            </span>
            <span className="block text-[11px] text-slate-400">บาทถ้วน</span>
          </div>
        </div>

        {/* Good Condition */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              ใช้งานได้ปกติ
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {goodConditionCount.toLocaleString('th-TH')}
            </span>
            <span className="ml-1.5 text-xs text-slate-500">รายการ</span>
          </div>
        </div>

        {/* Repair / Broken */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              ชำรุด / ส่งซ่อม
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-amber-600">
              {repairOrBrokenCount.toLocaleString('th-TH')}
            </span>
            <span className="ml-1.5 text-xs text-slate-500">รายการ</span>
          </div>
        </div>

        {/* Pending Disposal / Disposed */}
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              รอจำหน่าย / ปลดระวาง
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-purple-600">
              {pendingDisposalCount.toLocaleString('th-TH')}
            </span>
            <span className="ml-1.5 text-xs text-slate-500">รายการ</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Bar Chart */}
      <CategoryBarChart assets={assets} />

      {/* 3. Dedicated Fast Search & Filter Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 space-y-4">
        {/* Top Header of Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-800">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                ค้นหาข้อมูลครุภัณฑ์ด่วน
              </h3>
              <p className="text-[11px] text-slate-500">
                ค้นหาและกรองตามชื่อรายการ หรือรหัสครุภัณฑ์ได้อย่างรวดเร็ว
              </p>
            </div>
          </div>

          {/* Quick Scope Selector */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-xs text-slate-500 font-medium mr-1 hidden sm:inline">
              ค้นหาจาก:
            </span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSearchScope('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  searchScope === 'all'
                    ? 'bg-white text-blue-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => setSearchScope('name')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  searchScope === 'name'
                    ? 'bg-white text-blue-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เฉพาะชื่อรายการ
              </button>
              <button
                type="button"
                onClick={() => setSearchScope('code')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  searchScope === 'code'
                    ? 'bg-white text-blue-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                เฉพาะรหัสครุภัณฑ์
              </button>
            </div>
          </div>
        </div>

        {/* Search Input Box & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-blue-600" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                searchScope === 'name'
                  ? 'พิมพ์ชื่อรายการครุภัณฑ์ (เช่น เครื่องคอมพิวเตอร์, รถบรรทุกน้ำ, โดรน)...'
                  : searchScope === 'code'
                  ? 'พิมพ์รหัสครุภัณฑ์ (เช่น อบต.วซ-01-67-001)...'
                  : 'พิมพ์ชื่อรายการ หรือ รหัสครุภัณฑ์ เพื่อค้นหาทันที...'
              }
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                title="ล้างข้อความค้นหา"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="ล้างตัวกรองและคำค้นหาทั้งหมด"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>

            <button
              type="button"
              onClick={onAddClick}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition-colors shrink-0"
              title={isAdmin ? 'บันทึกข้อมูลครุภัณฑ์ใหม่' : 'บันทึกรายการใหม่ (ต้องยืนยันรหัสผ่านแอดมิน)'}
            >
              {!isAdmin ? <Lock className="w-3.5 h-3.5 text-amber-300" /> : <PlusCircle className="w-4 h-4" />}
              <span>บันทึกรายการใหม่</span>
            </button>
          </div>
        </div>

        {/* Quick Search Chips Suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            คำค้นหายอดนิยม:
          </span>
          {['อบต.วซ', 'คอมพิวเตอร์', 'รถบรรทุก', 'เครื่องปรับอากาศ', 'เครื่องพิมพ์', 'โต๊ะ', 'โดรน', 'ตัดหญ้า'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setSearchTerm(tag);
                if (tag === 'อบต.วซ') setSearchScope('code');
              }}
              className={`px-2.5 py-0.5 rounded-full border transition-all text-xs ${
                searchTerm === tag
                  ? 'bg-blue-600 text-white border-blue-600 font-bold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Active Search Result Alert Banner */}
        {searchTerm.trim() && (
          <div className="flex items-center justify-between p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="font-bold">ผลการค้นหา:</span>
              <span>
                พบ <strong className="font-mono text-sm font-bold text-blue-950">{sortedAssets.length}</strong> รายการ
                ที่ตรงกับคำว่า <mark className="bg-amber-200 text-amber-950 font-bold px-1 rounded">"{searchTerm}"</mark>
                {searchScope === 'name' && ' (เฉพาะในชื่อรายการ)'}
                {searchScope === 'code' && ' (เฉพาะในรหัสครุภัณฑ์)'}
                {' '}(จากทั้งหมด {totalAssetsCount} รายการ)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-xs text-blue-700 hover:underline font-bold ml-2 shrink-0"
            >
              ยกเลิกการค้นหา
            </button>
          </div>
        )}

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Category Filter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ประเภทครุภัณฑ์
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ทั้งหมด">ประเภทครุภัณฑ์ทั้งหมด ({totalAssetsCount})</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              สถานะครุภัณฑ์
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ทั้งหมด">สถานะทั้งหมด</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ปีที่ได้รับ (พ.ศ.)
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ทั้งหมด">ปีที่ได้รับทั้งหมด</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  พ.ศ. {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              สถานที่ติดตั้ง / แผนก
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ทั้งหมด">สถานที่ติดตั้งทั้งหมด</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Option */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-700" />
              <span>การเรียงลำดับ</span>
            </label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="w-full p-2 bg-blue-50/50 border border-blue-200 text-blue-950 font-medium rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="thai_alphabet">รายการ (ตามพยัญชนะไทย ก-ฮ)</option>
              <option value="date_desc">วันเดือนปีที่ได้รับ (ใหม่ไปเก่า)</option>
              <option value="date_asc">วันเดือนปีที่ได้รับ (เก่าไปใหม่)</option>
              <option value="price_desc">ราคา (มากไปน้อย)</option>
              <option value="seq_asc">ลำดับที่ (1, 2, 3...)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table: รายละเอียดครุภัณฑ์ */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Table Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              ตารางรายละเอียดครุภัณฑ์
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงข้อมูลทั้งหมด{' '}
              <strong className="text-blue-900 font-mono">
                {sortedAssets.length}
              </strong>{' '}
              จาก {totalAssetsCount} รายการ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenDriveImport && (
              <button
                type="button"
                onClick={onOpenDriveImport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg shadow-2xs transition-colors"
                title="ดึงฐานข้อมูลจากโฟลเดอร์ Google Drive"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>ดึงฐานข้อมูลจาก Google Drive</span>
              </button>
            )}
            <button
              type="button"
              onClick={onAddClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-2xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>เพิ่มครุภัณฑ์ใหม่</span>
            </button>
            <span className="text-xs text-slate-400 mx-1 hidden lg:inline">|</span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              เรียงตาม:{' '}
              <span className="font-bold text-slate-700">
                {sortField === 'thai_alphabet'
                  ? 'พยัญชนะไทย ก-ฮ'
                  : sortField === 'date_desc'
                  ? 'วันที่ได้รับ (ใหม่ไปเก่า)'
                  : sortField === 'price_desc'
                  ? 'ราคา'
                  : 'ลำดับที่'}
              </span>
            </span>
          </div>
        </div>

        {/* Table Contents */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3 text-center w-12">ลำดับ</th>
                <th className="py-3 px-3 text-center w-16">รูปภาพ</th>
                <th className="py-3 px-3">รหัสครุภัณฑ์</th>
                <th className="py-3 px-4 min-w-[200px]">
                  รายการ (เรียงตามพยัญชนะไทย)
                </th>
                <th className="py-3 px-3">รุ่น / ยี่ห้อ</th>
                <th className="py-3 px-3">วันเดือนปี / ปีที่ได้รับ</th>
                <th className="py-3 px-3">สถานที่ติดตั้ง</th>
                <th className="py-3 px-3">ประเภทครุภัณฑ์</th>
                <th className="py-3 px-3 text-center">จำนวน</th>
                <th className="py-3 px-3 text-right">ราคา (บาท)</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
                <th className="py-3 px-3 text-center w-28">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedAssets.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">ไม่พบข้อมูลครุภัณฑ์ตามเงื่อนไขที่เลือก</p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-2 text-xs text-blue-700 hover:underline font-bold"
                    >
                      ล้างตัวกรองทั้งหมด
                    </button>
                  </td>
                </tr>
              ) : (
                sortedAssets.map((item, index) => {
                  const statusStyle =
                    STATUS_COLORS[item.status] || {
                      bg: 'bg-slate-100',
                      text: 'text-slate-700',
                      border: 'border-slate-300',
                    };

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* ลำดับที่ */}
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-500">
                        {item.seq || index + 1}
                      </td>

                      {/* รูปภาพ */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onViewClick(item)}
                          className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 inline-flex items-center justify-center hover:ring-2 hover:ring-blue-500 transition-all"
                          title="คลิกเพื่อดูรูปภาพและบัตรประวัติ"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileSpreadsheet className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* รหัสครุภัณฑ์ */}
                      <td className="py-3 px-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                        {highlightText(item.code, searchTerm)}
                      </td>

                      {/* รายการ */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <button
                          type="button"
                          onClick={() => onViewClick(item)}
                          className="text-left hover:text-blue-700 transition-colors"
                        >
                          {highlightText(item.name, searchTerm)}
                        </button>
                        {item.remarks && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 font-normal mt-0.5">
                            {item.remarks}
                          </p>
                        )}
                      </td>

                      {/* รุ่น / ยี่ห้อ */}
                      <td className="py-3 px-3 text-slate-600">
                        {item.model || '-'}
                      </td>

                      {/* วันที่ / ปีที่ได้รับ */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">
                            {item.receivedDate
                              ? new Date(item.receivedDate).toLocaleDateString('th-TH')
                              : '-'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ปี พ.ศ. {item.receivedYear}
                          </span>
                        </div>
                      </td>

                      {/* สถานที่ติดตั้ง */}
                      <td className="py-3 px-3 text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.location || '-'}</span>
                        </div>
                      </td>

                      {/* ประเภทครุภัณฑ์ */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                          {item.customCategory
                            ? `อื่น ๆ (${item.customCategory})`
                            : item.category}
                        </span>
                      </td>

                      {/* จำนวน */}
                      <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {item.quantity} {item.unit || 'เครื่อง'}
                      </td>

                      {/* ราคา (บาท) */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ฿{item.price.toLocaleString('th-TH')}
                      </td>

                      {/* สถานะ */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {item.customStatus
                            ? `อื่นๆ (${item.customStatus})`
                            : item.status}
                        </span>
                      </td>

                      {/* ปุ่มจัดการ */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewClick(item)}
                            className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
                            title="ดูบัตรประวัติและพิมพ์ป้าย"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditClick(item)}
                            className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-md transition-colors relative"
                            title={isAdmin ? 'แก้ไขข้อมูล' : 'แก้ไขข้อมูล (ต้องยืนยันรหัสผ่านแอดมิน)'}
                          >
                            {!isAdmin ? (
                              <div className="relative">
                                <Edit className="w-4 h-4 opacity-70" />
                                <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-amber-800" />
                              </div>
                            ) : (
                              <Edit className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteClick(item)}
                            className="p-1.5 text-rose-700 hover:bg-rose-100 rounded-md transition-colors relative"
                            title={isAdmin ? 'ลบรายการ' : 'ลบรายการ (ต้องยืนยันรหัสผ่านแอดมิน)'}
                          >
                            {!isAdmin ? (
                              <div className="relative">
                                <Trash2 className="w-4 h-4 opacity-70" />
                                <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-rose-800" />
                              </div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
