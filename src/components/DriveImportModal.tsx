import React, { useState } from 'react';
import {
  DEFAULT_DRIVE_FOLDER_ID,
  DEFAULT_DRIVE_FOLDER_URL,
  listDriveFolderFiles,
  fetchAndParseDriveFile,
  pullAllAssetsFromDriveFolder,
  DriveFileItem,
  DriveFolderInspectionResult,
} from '../services/googleDrive';
import { AssetItem, CATEGORY_OPTIONS, STATUS_COLORS } from '../types/asset';
import { User } from 'firebase/auth';
import {
  FolderOpen,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Database,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DriveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleUser: User | null;
  isGoogleConnected: boolean;
  onGoogleSignIn: () => void;
  getAccessToken: () => Promise<string | null>;
  onImportComplete: (importedAssets: AssetItem[], mode: 'replace' | 'append') => Promise<void>;
  currentAssetsCount: number;
}

export const DriveImportModal: React.FC<DriveImportModalProps> = ({
  isOpen,
  onClose,
  googleUser,
  isGoogleConnected,
  onGoogleSignIn,
  getAccessToken,
  onImportComplete,
  currentAssetsCount,
}) => {
  const [folderInput, setFolderInput] = useState(DEFAULT_DRIVE_FOLDER_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Inspection results
  const [folderResult, setFolderResult] = useState<DriveFolderInspectionResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<DriveFileItem | null>(null);
  const [parsedAssets, setParsedAssets] = useState<AssetItem[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  if (!isOpen) return null;

  // Scan folder
  const handleScanFolder = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setParsedAssets([]);
    setSelectedFile(null);

    const token = await getAccessToken();
    if (!token) {
      setErrorMsg('กรุณาลงชื่อเข้าใช้ Google บัญชีก่อนเข้าถึง Google Drive');
      onGoogleSignIn();
      return;
    }

    setIsLoading(true);
    try {
      const res = await listDriveFolderFiles(token, folderInput);
      setFolderResult(res);

      if (res.supportedFiles.length === 0) {
        if (res.files.length === 0) {
          setErrorMsg('ไม่พบไฟล์ใดๆ ในโฟลเดอร์ Google Drive นี้ กรุณาตรวจสอบสิทธิ์การแชร์หรืออัปโหลดไฟล์ครุภัณฑ์เข้าโฟลเดอร์');
        } else {
          setErrorMsg(
            `พบไฟล์ ${res.files.length} รายการ แต่ไม่มีไฟล์ที่รองรับ (.xlsx, .xls, .csv หรือ Google Sheets)`
          );
        }
      } else {
        // Automatically attempt to parse the first supported file
        const firstFile = res.supportedFiles[0];
        setSelectedFile(firstFile);
        const parsed = await fetchAndParseDriveFile(token, firstFile);
        setParsedAssets(parsed.assets);
        setSuccessMsg(
          `เชื่อมต่อสำเร็จ! พบไฟล์ตารางข้อมูล ${res.supportedFiles.length} รายการ และอ่านข้อมูลจาก "${firstFile.name}" ได้ ${parsed.assets.length} รายการ`
        );
      }
    } catch (err: any) {
      console.error('Scan folder error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเข้าถึง Google Drive');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch selected file to preview
  const handleSelectFile = async (file: DriveFileItem) => {
    setSelectedFile(file);
    setErrorMsg('');
    const token = await getAccessToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const parsed = await fetchAndParseDriveFile(token, file);
      setParsedAssets(parsed.assets);
      setSuccessMsg(`อ่านข้อมูลจากไฟล์ "${file.name}" สำเร็จ (${parsed.assets.length} รายการ)`);
    } catch (err: any) {
      setErrorMsg(err.message || `ไม่สามารถอ่านข้อมูลจากไฟล์ ${file.name}`);
      setParsedAssets([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Pull all files combined
  const handlePullAllFiles = async () => {
    setErrorMsg('');
    const token = await getAccessToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const result = await pullAllAssetsFromDriveFolder(token, folderInput);
      setSelectedFile(null);
      setParsedAssets(result.allAssets);
      setSuccessMsg(
        `ประมวลผลไฟล์ทั้งหมดสำเร็จ: รวม ${result.totalCount} รายการ จาก [${result.filesProcessed.join(', ')}]`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจากโฟลเดอร์');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm and save to system & Firestore
  const handleConfirmImport = async () => {
    if (parsedAssets.length === 0) return;
    setIsImporting(true);
    try {
      await onImportComplete(parsedAssets, importMode);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลเข้าสู่ระบบ');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                ดึงฐานข้อมูลครุภัณฑ์จาก Google Drive
              </h2>
              <p className="text-xs text-blue-200">
                เชื่อมต่อและอ่านไฟล์ทะเบียนครุภัณฑ์ (.xlsx, .csv, Google Sheets) จากโฟลเดอร์ที่กำหนด
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Google Sign-in Notice if not signed in */}
          {!isGoogleConnected ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    กรุณาลงชื่อเข้าใช้ Google เพื่ออนุญาตสิทธิ์เข้าถึง Google Drive
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    ระบบจะใช้สิทธิ์การเข้าถึงแบบอ่าน (Google Drive & Google Sheets) เพื่อค้นหาและนำเข้าข้อมูลครุภัณฑ์
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs self-start sm:self-auto shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>ลงชื่อเข้าใช้ Google</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  เชื่อมต่อ Google สำเร็จ: <strong>{googleUser?.email}</strong> (มีสิทธิ์เข้าถึง Google Drive & Sheets)
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                พร้อมใช้งาน
              </span>
            </div>
          )}

          {/* Drive Folder Link Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              ลิงก์หรือรหัสโฟลเดอร์ Google Drive
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={folderInput}
                  onChange={(e) => setFolderInput(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full pl-3.5 pr-8 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <a
                href={folderInput}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
                title="เปิดโฟลเดอร์ในแท็บใหม่"
              >
                <span>เปิดดูใน Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={handleScanFolder}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'กำลังสำรวจข้อมูล...' : 'ค้นหาไฟล์ในโฟลเดอร์'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              โฟลเดอร์เป้าหมายของระบบ:{' '}
              <span className="font-mono text-slate-700 select-all">1Y3Qap7Z5BzHuHylGJpmPgh9pGMS3IacK</span>
            </p>
          </div>

          {/* Error & Success Messages */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Folder Files List */}
          {folderResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-500" />
                  <span>
                    ไฟล์ในโฟลเดอร์: {folderResult.folderName} ({folderResult.files.length} รายการ)
                  </span>
                </h3>
                {folderResult.supportedFiles.length > 1 && (
                  <button
                    type="button"
                    onClick={handlePullAllFiles}
                    disabled={isLoading}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 underline"
                  >
                    รวมข้อมูลจากทุกไฟล์ ({folderResult.supportedFiles.length} ไฟล์)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {folderResult.files.map((file) => {
                  const isSupported = folderResult.supportedFiles.some((f) => f.id === file.id);
                  const isSelected = selectedFile?.id === file.id;

                  return (
                    <div
                      key={file.id}
                      onClick={() => isSupported && handleSelectFile(file)}
                      className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400'
                          : isSupported
                          ? 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50 cursor-pointer'
                          : 'bg-slate-50/60 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {file.mimeType.includes('spreadsheet') ? (
                          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {file.mimeType.split('.').pop() || 'ไฟล์'}
                          </p>
                        </div>
                      </div>

                      {isSupported ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                          {isSelected ? 'เลือกแล้ว' : 'อ่านได้'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 shrink-0">ไม่รองรับ</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Parsed Assets Preview */}
          {parsedAssets.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>ตัวอย่างข้อมูลที่พร้อมนำเข้า ({parsedAssets.length} รายการ)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    ตรวจสอบความถูกต้องของประเภทครุภัณฑ์ และรายละเอียดก่อนบันทึกลงระบบ
                  </p>
                </div>

                {/* Import Mode Selector */}
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      importMode === 'replace'
                        ? 'bg-white text-blue-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    แทนที่ข้อมูลเดิม ({currentAssetsCount} รายการ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                      importMode === 'append'
                        ? 'bg-white text-blue-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    เพิ่มต่อท้ายข้อมูลเดิม
                  </button>
                </div>
              </div>

              {/* Quick Summary Pill Badges */}
              <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {CATEGORY_OPTIONS.map((cat) => {
                  const count = parsedAssets.filter((a) => a.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs"
                    >
                      <span>{cat}:</span>
                      <strong className="text-blue-700">{count}</strong>
                    </span>
                  );
                })}
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">ลำดับ</th>
                      <th className="py-2 px-3">รหัสครุภัณฑ์</th>
                      <th className="py-2 px-3">รายการ</th>
                      <th className="py-2 px-3">ประเภทครุภัณฑ์</th>
                      <th className="py-2 px-3">สถานที่</th>
                      <th className="py-2 px-3 text-right">ราคาต่อหน่วย</th>
                      <th className="py-2 px-3 text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedAssets.slice(0, 15).map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-center text-slate-500">{item.seq || idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-medium text-blue-900">{item.code}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                        <td className="py-2 px-3 text-slate-600">{item.category}</td>
                        <td className="py-2 px-3 text-slate-500">{item.location}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">
                          {item.price ? Number(item.price).toLocaleString() : '0'} ฿
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              STATUS_COLORS[item.status]?.bg || 'bg-slate-100'
                            } ${STATUS_COLORS[item.status]?.text || 'text-slate-700'}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedAssets.length > 15 && (
                <p className="text-[11px] text-slate-400 text-center">
                  (แสดงตัวอย่าง 15 รายการแรก จากทั้งหมด {parsedAssets.length} รายการ)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {parsedAssets.length > 0 ? (
              <span className="flex items-center gap-1.5 text-blue-900 font-medium">
                <Database className="w-4 h-4 text-amber-500" />
                <span>
                  พร้อมนำเข้า {parsedAssets.length} รายการ สู่ Firebase (Property Control Ledger)
                </span>
              </span>
            ) : (
              <span>กดปุ่ม &quot;ค้นหาไฟล์ในโฟลเดอร์&quot; เพื่อเริ่มต้นอ่านข้อมูล</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={parsedAssets.length === 0 || isImporting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className={`w-4 h-4 ${isImporting ? 'animate-bounce' : ''}`} />
              <span>
                {isImporting
                  ? 'กำลังนำเข้าและบันทึก...'
                  : `ยืนยันนำเข้าข้อมูล (${parsedAssets.length} รายการ)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
