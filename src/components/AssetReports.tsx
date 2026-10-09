import React, { useState, useMemo } from 'react';
import { AssetItem, CATEGORY_OPTIONS, STATUS_OPTIONS } from '../types/asset';
import { WangSaiLogo } from './WangSaiLogo';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  CheckSquare,
  QrCode,
  FileCheck,
  Calendar,
  Building2,
} from 'lucide-react';

interface AssetReportsProps {
  assets: AssetItem[];
  customLogoUrl?: string;
}

export const AssetReports: React.FC<AssetReportsProps> = ({ assets, customLogoUrl }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [selectedStatus, setSelectedStatus] = useState<string>('ทั้งหมด');
  const [selectedYear, setSelectedYear] = useState<string>('ทั้งหมด');
  const [viewMode, setViewMode] = useState<'official_table' | 'asset_tags'>('official_table');

  // Filtered Assets for Report
  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      const matchCat =
        selectedCategory === 'ทั้งหมด' ||
        (selectedCategory === 'ครุภัณฑ์อื่น'
          ? item.category === 'ครุภัณฑ์อื่น' || (item.category && !CATEGORY_OPTIONS.includes(item.category))
          : item.category === selectedCategory);

      const matchStatus =
        selectedStatus === 'ทั้งหมด' ||
        (selectedStatus === 'อื่นๆ (ระบุ)'
          ? item.status === 'อื่นๆ (ระบุ)' || item.customStatus
          : item.status === selectedStatus);

      const matchYear =
        selectedYear === 'ทั้งหมด' || item.receivedYear === selectedYear;

      return matchCat && matchStatus && matchYear;
    });
  }, [assets, selectedCategory, selectedStatus, selectedYear]);

  // Total sums
  const totalCount = filteredAssets.length;
  const totalQuantity = filteredAssets.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalValue = filteredAssets.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  // Available fiscal years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(assets.map((a) => a.receivedYear).filter(Boolean)));
    return years.sort((a, b) => b.localeCompare(a));
  }, [assets]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const excelData = filteredAssets.map((item, idx) => ({
      'ลำดับที่': item.seq || idx + 1,
      'รหัสครุภัณฑ์': item.code || '',
      'รายการ': item.name || '',
      'รุ่น / ยี่ห้อ': item.model || '',
      'วันเดือนปี ที่ได้รับ': item.receivedDate
        ? new Date(item.receivedDate).toLocaleDateString('th-TH')
        : '',
      'ปีที่ได้รับ (พ.ศ.)': item.receivedYear || '',
      'สถานที่ติดตั้ง / กอง': item.location || '',
      'ประเภทครุภัณฑ์': item.customCategory
        ? `ประเภทอื่น ๆ (${item.customCategory})`
        : item.category || '',
      'จำนวน': item.quantity || 1,
      'หน่วยนับ': item.unit || 'เครื่อง',
      'ราคาต่อหน่วย (บาท)': item.price || 0,
      'ราคารวม (บาท)': (item.price || 0) * (item.quantity || 1),
      'สถานะการใช้งาน': item.customStatus ? `อื่นๆ (${item.customStatus})` : item.status || '',
      'หมายเหตุ': item.remarks || '',
      'ลิ้งก์รูปภาพประกอบ': item.imageUrl || '',
    }));

    // Add summary row at bottom
    excelData.push({
      'ลำดับที่': 'รวมทั้งสิ้น' as any,
      'รหัสครุภัณฑ์': '',
      'รายการ': `${totalCount} รายการ`,
      'รุ่น / ยี่ห้อ': '',
      'วันเดือนปี ที่ได้รับ': '',
      'ปีที่ได้รับ (พ.ศ.)': '',
      'สถานที่ติดตั้ง / กอง': '',
      'ประเภทครุภัณฑ์': '',
      'จำนวน': totalQuantity,
      'หน่วยนับ': 'หน่วย',
      'ราคาต่อหน่วย (บาท)': 0,
      'ราคารวม (บาท)': totalValue,
      'สถานะการใช้งาน': '',
      'หมายเหตุ': 'รายงานครุภัณฑ์ อบต.วังซ้าย',
      'ลิ้งก์รูปภาพประกอบ': '',
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Auto column widths
    worksheet['!cols'] = [
      { wch: 8 }, // ลำดับที่
      { wch: 20 }, // รหัส
      { wch: 35 }, // รายการ
      { wch: 25 }, // รุ่น/ยี่ห้อ
      { wch: 18 }, // วันที่ได้รับ
      { wch: 12 }, // ปีที่ได้รับ
      { wch: 25 }, // สถานที่
      { wch: 22 }, // ประเภท
      { wch: 10 }, // จำนวน
      { wch: 10 }, // หน่วย
      { wch: 16 }, // ราคาต่อหน่วย
      { wch: 18 }, // ราคารวม
      { wch: 16 }, // สถานะ
      { wch: 30 }, // หมายเหตุ
      { wch: 30 }, // ภาพประกอบ
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ทะเบียนครุภัณฑ์');

    const currentDate = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `ทะเบียนครุภัณฑ์_อบต_วังซ้าย_${currentDate}.xlsx`);
  };

  // Print PDF via browser print
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar (Hidden during printing) */}
      <div className="print:hidden bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-800" />
              <span>รายงานและออกเอกสารราชการครุภัณฑ์</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              พิมพ์แบบฟอร์มทะเบียนคุมทรัพย์สินมาตรฐานราชการ หรือส่งออกไฟล์ Excel (.xlsx) และ PDF
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              title="ดาวน์โหลดไฟล์ Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
              title="พิมพ์แบบฟอร์มรายงาน หรือบันทึกเป็น PDF"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์รายงาน / บันทึก PDF</span>
            </button>
          </div>
        </div>

        {/* Filter controls & View Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ประเภทครุภัณฑ์
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ทั้งหมด">ประเภทครุภัณฑ์ทั้งหมด</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

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

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              รูปแบบการแสดงผล
            </label>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('official_table')}
                className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-center transition-all ${
                  viewMode === 'official_table'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                ทะเบียนคุมทางการ
              </button>
              <button
                type="button"
                onClick={() => setViewMode('asset_tags')}
                className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-center transition-all ${
                  viewMode === 'asset_tags'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                ป้ายติดครุภัณฑ์
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Official Printable Document Section */}
      {viewMode === 'official_table' ? (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-10 print:shadow-none print:border-none print:p-0">
          {/* Document Header (Thai Government Standard) */}
          <div className="text-center pb-6 border-b-2 border-slate-800">
            <div className="flex justify-center mb-3">
              <WangSaiLogo customLogoUrl={customLogoUrl} size="lg" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              ทะเบียนคุมทรัพย์สิน (บัญชีครุภัณฑ์)
            </h1>
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mt-1">
              องค์การบริหารส่วนตำบลวังซ้าย อำเภอวังเหนือ จังหวัดลำปาง
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              งานพัสดุและทรัพย์สิน กองคลัง • ข้อมูล ณ วันที่{' '}
              {new Date().toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Report Summary Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 my-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
            <div>
              <span>ประเภท: <strong>{selectedCategory}</strong></span> •{' '}
              <span>สถานะ: <strong>{selectedStatus}</strong></span> •{' '}
              <span>ปีงบประมาณ: <strong>{selectedYear}</strong></span>
            </div>
            <div>
              รวมทั้งสิ้น <strong className="font-mono text-sm text-blue-900">{totalCount}</strong> รายการ |{' '}
              จำนวน <strong className="font-mono text-sm">{totalQuantity}</strong> หน่วย |{' '}
              มูลค่ารวม <strong className="font-mono text-sm text-emerald-800">฿{totalValue.toLocaleString('th-TH')}</strong> บาท
            </div>
          </div>

          {/* Official Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400 text-center">
                  <th className="border border-slate-400 py-2 px-1 w-10">ลำดับ</th>
                  <th className="border border-slate-400 py-2 px-2 w-28">รหัสครุภัณฑ์</th>
                  <th className="border border-slate-400 py-2 px-3 text-left">รายการ</th>
                  <th className="border border-slate-400 py-2 px-2 text-left">รุ่น / ยี่ห้อ</th>
                  <th className="border border-slate-400 py-2 px-2 w-24">วันเดือนปีที่ได้รับ</th>
                  <th className="border border-slate-400 py-2 px-2 text-left">สถานที่ติดตั้ง</th>
                  <th className="border border-slate-400 py-2 px-2">ประเภท</th>
                  <th className="border border-slate-400 py-2 px-1 w-12">จำนวน</th>
                  <th className="border border-slate-400 py-2 px-2 text-right">ราคาต่อหน่วย</th>
                  <th className="border border-slate-400 py-2 px-2 text-right">ราคารวม</th>
                  <th className="border border-slate-400 py-2 px-2">สถานะ</th>
                  <th className="border border-slate-400 py-2 px-2 text-left">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredAssets.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 py-1.5 px-1 text-center font-mono">
                      {item.seq || idx + 1}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 font-mono font-bold whitespace-nowrap">
                      {item.code}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-3 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-slate-700">
                      {item.model || '-'}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-center whitespace-nowrap">
                      {item.receivedDate
                        ? new Date(item.receivedDate).toLocaleDateString('th-TH')
                        : '-'}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-slate-700">
                      {item.location || '-'}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-center whitespace-nowrap">
                      {item.customCategory ? item.customCategory : item.category}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-1 text-center font-mono">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono whitespace-nowrap">
                      ฿{item.price.toLocaleString('th-TH')}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-right font-mono font-bold whitespace-nowrap">
                      ฿{((item.price || 0) * (item.quantity || 1)).toLocaleString('th-TH')}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-center whitespace-nowrap">
                      {item.customStatus ? item.customStatus : item.status}
                    </td>
                    <td className="border border-slate-300 py-1.5 px-2 text-slate-600">
                      {item.remarks || '-'}
                    </td>
                  </tr>
                ))}
                {/* Total Summary Row */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                  <td
                    colSpan={7}
                    className="border border-slate-400 py-2 px-3 text-center"
                  >
                    รวมทั้งสิ้น ({totalCount} รายการ)
                  </td>
                  <td className="border border-slate-400 py-2 px-1 text-center font-mono">
                    {totalQuantity} หน่วย
                  </td>
                  <td className="border border-slate-400 py-2 px-2 text-right">-</td>
                  <td className="border border-slate-400 py-2 px-2 text-right font-mono text-emerald-800">
                    ฿{totalValue.toLocaleString('th-TH')}
                  </td>
                  <td colSpan={2} className="border border-slate-400 py-2 px-2"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Official Signatures Block (Standard Thai Municipal layout) */}
          <div className="mt-12 pt-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-xs text-slate-800 break-inside-avoid">
            <div className="space-y-1">
              <p>ลงชื่อ......................................................</p>
              <p>(..........................................................)</p>
              <p className="font-semibold text-slate-700">เจ้าหน้าที่พัสดุ</p>
              <p className="text-[11px] text-slate-500">ผู้จัดทำรายงาน</p>
            </div>

            <div className="space-y-1">
              <p>ลงชื่อ......................................................</p>
              <p>(..........................................................)</p>
              <p className="font-semibold text-slate-700">หัวหน้าเจ้าหน้าที่พัสดุ</p>
              <p className="text-[11px] text-slate-500">ผู้ตรวจสอบ</p>
            </div>

            <div className="space-y-1">
              <p>ลงชื่อ......................................................</p>
              <p>(..........................................................)</p>
              <p className="font-semibold text-slate-700">ปลัด อบต.วังซ้าย</p>
              <p className="text-[11px] text-slate-500">ผู้เห็นชอบ</p>
            </div>

            <div className="space-y-1">
              <p>ลงชื่อ......................................................</p>
              <p>(..........................................................)</p>
              <p className="font-semibold text-slate-700">นายก อบต.วังซ้าย</p>
              <p className="text-[11px] text-slate-500">ผู้อนุมัติ</p>
            </div>
          </div>
        </div>
      ) : (
        /* Asset Tags / Stickers Sheet Mode */
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-10 print:shadow-none print:border-none print:p-0">
          <div className="text-center pb-4 mb-6 border-b border-slate-200 print:hidden">
            <h3 className="text-base font-bold text-slate-800">
              ป้ายทะเบียนติดครุภัณฑ์ (Asset Labels) พร้อมพิมพ์
            </h3>
            <p className="text-xs text-slate-500">
              สั่งพิมพ์กระดาษ A4 หรือสติกเกอร์สำหรับติดตัวครุภัณฑ์จริง
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((item) => (
              <div
                key={item.id}
                className="p-3 border-2 border-slate-800 rounded-lg bg-white flex items-center gap-3 relative overflow-hidden"
              >
                <div className="w-16 h-16 bg-slate-900 text-white rounded flex items-center justify-center shrink-0">
                  <QrCode className="w-12 h-12 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <WangSaiLogo size="sm" />
                    <span className="text-[10px] font-bold text-slate-700">อบต.วังซ้าย</span>
                  </div>
                  <p className="text-xs font-mono font-extrabold text-blue-950 truncate mt-0.5">
                    {item.code}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-800 truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>ปี {item.receivedYear}</span>
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
