import React, { useState, useEffect, useCallback } from 'react';
import { AssetItem } from './types/asset';
import { INITIAL_ASSETS } from './data/initialAssets';
import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AssetFormModal } from './components/AssetFormModal';
import { AssetDetailModal } from './components/AssetDetailModal';
import { AssetReports } from './components/AssetReports';
import { Settings } from './components/Settings';
import { AdminAuthModal } from './components/AdminAuthModal';
import { ConfirmModal } from './components/ConfirmModal';
import { DriveImportModal } from './components/DriveImportModal';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebaseAuth';
import {
  DEFAULT_SPREADSHEET_ID,
  readAssetsFromSheet,
  writeAssetsToSheet,
} from './services/googleSheets';
import {
  testConnection,
  subscribeToAssets,
  saveAssetToFirestore,
  deleteAssetFromFirestore,
  seedAssetsToFirestore,
  initializeFirestoreIfEmpty,
} from './services/firestoreService';
import { User } from 'firebase/auth';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const STORAGE_KEY_ASSETS = 'wangsai_assets_data_v1';
const STORAGE_KEY_CONFIG = 'wangsai_config_v1';
const SESSION_KEY_ADMIN = 'wangsai_is_admin_session';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Main Assets State
  const [assets, setAssets] = useState<AssetItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ASSETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => {
            let cat = item.category;
            if (cat === 'ครุภัณฑ์การศึกษา') cat = 'ครุภัณฑ์โฆษณาและเผยแพร่';
            else if (cat === 'ครุภัณฑ์วิทยาศาสตร์การแพทย์' || cat === 'ประเภทอื่น ๆ (ระบุ)') cat = 'ครุภัณฑ์อื่น';
            return { ...item, category: cat };
          });
        }
      }
    } catch (e) {
      console.warn('Could not read cached assets:', e);
    }
    return INITIAL_ASSETS;
  });

  // Settings & Configuration
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.spreadsheetId || DEFAULT_SPREADSHEET_ID;
      }
    } catch {}
    return DEFAULT_SPREADSHEET_ID;
  });

  const [customLogoUrl, setCustomLogoUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.customLogoUrl || '';
      }
    } catch {}
    return '';
  });

  // Admin Authentication State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_KEY_ADMIN) === 'true';
  });
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminCallback, setAdminCallback] = useState<(() => void) | null>(null);

  // Google Workspace Authentication & Sheets sync State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<AssetItem | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);

  // Google Drive Import Modal State
  const [driveModalOpen, setDriveModalOpen] = useState(false);

  // Confirmation Modal
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toast notification
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Save assets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(assets));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [assets]);

  // Save config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_CONFIG,
        JSON.stringify({ spreadsheetId, customLogoUrl })
      );
    } catch {}
  }, [spreadsheetId, customLogoUrl]);

  // Firebase Firestore connection state
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);

  // Initialize Firebase Firestore connection & Real-time Live Subscription
  useEffect(() => {
    testConnection().then((ok) => {
      setIsFirebaseConnected(ok);
    });

    // Seed default assets if Firestore collection is empty
    initializeFirestoreIfEmpty(INITIAL_ASSETS);

    // Subscribe to live Firestore updates
    const unsubscribe = subscribeToAssets(
      (firestoreAssets) => {
        if (firestoreAssets.length > 0) {
          setAssets(firestoreAssets);
        }
      },
      (error) => {
        console.warn('Firestore subscription fallback to local cache:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, _token) => {
        setGoogleUser(user);
        setIsGoogleConnected(true);
      },
      () => {
        setGoogleUser(null);
        setIsGoogleConnected(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Require admin guard
  const executeWithAdmin = (action: () => void) => {
    if (isAdmin) {
      action();
    } else {
      setAdminCallback(() => action);
      setAdminModalOpen(true);
    }
  };

  const handleAdminSuccess = () => {
    setIsAdmin(true);
    sessionStorage.setItem(SESSION_KEY_ADMIN, 'true');
    setAdminModalOpen(false);
    showToast('success', 'เข้าสู่ระบบผู้ดูแลระบบเรียบร้อยแล้ว');
    if (adminCallback) {
      adminCallback();
      setAdminCallback(null);
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem(SESSION_KEY_ADMIN);
    showToast('info', 'ออกจากระบบผู้ดูแลระบบเรียบร้อยแล้ว');
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setIsGoogleConnected(true);
        showToast('success', `เชื่อมต่อ Google สำเร็จ: ${res.user.email}`);
      }
    } catch (err: any) {
      showToast('error', err.message || 'เกิดข้อผิดพลาดในการลงชื่อเข้าใช้ Google');
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setGoogleUser(null);
    setIsGoogleConnected(false);
    showToast('info', 'ออกจากระบบ Google เรียบร้อยแล้ว');
  };

  // Google Sheets Push / Sync
  const handleSyncToSheets = async () => {
    const token = await getAccessToken();
    if (!token) {
      showToast('info', 'กรุณาลงชื่อเข้าใช้ Google เพื่อรับสิทธิ์การซิงค์ข้อมูล');
      handleGoogleSignIn();
      return;
    }

    setIsSyncing(true);
    try {
      await writeAssetsToSheet(token, spreadsheetId, assets);
      showToast(
        'success',
        `ซิงค์บันทึกข้อมูล ${assets.length} รายการ ไปยัง Google Sheets เรียบร้อยแล้ว`
      );
    } catch (err: any) {
      showToast('error', `การซิงค์ล้มเหลว: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Sheets Pull
  const handlePullFromSheets = async () => {
    const token = await getAccessToken();
    if (!token) {
      showToast('info', 'กรุณาลงชื่อเข้าใช้ Google ก่อนดึงข้อมูล');
      handleGoogleSignIn();
      return;
    }

    setConfirmModalState({
      isOpen: true,
      title: 'ดึงข้อมูลจาก Google Sheets',
      message:
        'การดึงข้อมูลจาก Google Sheets จะนำรายการครุภัณฑ์จากชีตมาอัปเดตระบบในเครื่อง ต้องการดำเนินการต่อหรือไม่?',
      confirmLabel: 'ยืนยันดึงข้อมูล',
      isDestructive: false,
      onConfirm: async () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        setIsSyncing(true);
        try {
          const sheetItems = await readAssetsFromSheet(token, spreadsheetId);
          if (sheetItems.length > 0) {
            setAssets(sheetItems);
            showToast('success', `โหลดข้อมูลจาก Google Sheets สำเร็จ (${sheetItems.length} รายการ)`);
          } else {
            showToast('info', 'เอกสาร Google Sheets ยังไม่มีข้อมูลครุภัณฑ์');
          }
        } catch (err: any) {
          showToast('error', err.message);
        } finally {
          setIsSyncing(false);
        }
      },
    });
  };

  // Google Drive Import Handler
  const handleImportFromDrive = async (
    importedAssets: AssetItem[],
    mode: 'replace' | 'append'
  ) => {
    let finalAssets: AssetItem[];
    if (mode === 'replace') {
      finalAssets = importedAssets;
    } else {
      // Append mode - avoid duplicate codes
      const existingCodes = new Set(assets.map((a) => a.code.trim().toLowerCase()));
      const filtered = importedAssets.filter(
        (a) => !existingCodes.has(a.code.trim().toLowerCase())
      );
      finalAssets = [...assets, ...(filtered.length > 0 ? filtered : importedAssets)];
    }

    // Sequence re-indexing
    finalAssets.forEach((item, index) => {
      item.seq = index + 1;
    });

    setAssets(finalAssets);
    showToast(
      'success',
      `นำเข้าข้อมูล ${importedAssets.length} รายการ จาก Google Drive และบันทึกลง Firebase (Property Control Ledger) เรียบร้อยแล้ว`
    );

    // Save to Firebase Firestore immediately
    try {
      await seedAssetsToFirestore(finalAssets);
    } catch (e: any) {
      console.warn('Firestore sync after Drive import warning:', e);
    }
  };

  // Add Asset Trigger
  const handleAddClick = () => {
    executeWithAdmin(() => {
      setAssetToEdit(null);
      setFormModalOpen(true);
    });
  };

  // Edit Asset Trigger
  const handleEditClick = (item: AssetItem) => {
    executeWithAdmin(() => {
      setAssetToEdit(item);
      setFormModalOpen(true);
    });
  };

  // Delete Asset Trigger with required confirmation
  const handleDeleteClick = (item: AssetItem) => {
    executeWithAdmin(() => {
      setConfirmModalState({
        isOpen: true,
        title: 'ยืนยันการลบรายการครุภัณฑ์',
        message: `ท่านต้องการลบรายการ "${item.name}" (รหัส: ${item.code}) ออกจากระบบทะเบียนครุภัณฑ์ใช่หรือไม่?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`,
        confirmLabel: 'ยืนยันลบรายการ',
        isDestructive: true,
        onConfirm: () => {
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
          const updated = assets.filter((a) => a.id !== item.id);
          setAssets(updated);
          showToast('success', `ลบรายการ "${item.name}" เรียบร้อยแล้ว`);

          // Delete from Firebase Firestore
          deleteAssetFromFirestore(item.id).catch((e) =>
            console.warn('Firestore delete error:', e)
          );

          // Background sync to sheets if connected
          getAccessToken().then((token) => {
            if (token) {
              writeAssetsToSheet(token, spreadsheetId, updated).catch((e) =>
                console.warn('Auto sync delete failed:', e)
              );
            }
          });
        },
      });
    });
  };

  // Save Asset from Form (Add or Edit)
  const handleSaveAsset = (savedItem: AssetItem) => {
    let updated: AssetItem[];
    if (assetToEdit) {
      updated = assets.map((a) => (a.id === savedItem.id ? savedItem : a));
      showToast('success', `แก้ไขรายการ "${savedItem.name}" เรียบร้อยแล้ว`);
    } else {
      updated = [savedItem, ...assets];
      showToast('success', `บันทึกรายการ "${savedItem.name}" เรียบร้อยแล้ว`);
    }

    setAssets(updated);
    setFormModalOpen(false);
    setAssetToEdit(null);

    // Save to Firebase Firestore immediately
    saveAssetToFirestore(savedItem).catch((e) =>
      console.warn('Firestore save error:', e)
    );

    // If Google connected, sync to Google Sheets
    getAccessToken().then((token) => {
      if (token) {
        writeAssetsToSheet(token, spreadsheetId, updated).catch((e) =>
          console.warn('Auto sync save failed:', e)
        );
      }
    });
  };

  // View details
  const handleViewClick = (item: AssetItem) => {
    setSelectedAsset(item);
    setDetailModalOpen(true);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(assets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `สำรองข้อมูลครุภัณฑ์_อบต_วังซ้าย_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('success', 'ดาวน์โหลดไฟล์สำรองข้อมูลเรียบร้อยแล้ว');
  };

  // Import JSON Backup
  const handleImportBackup = (jsonContent: string) => {
    executeWithAdmin(() => {
      try {
        const parsed = JSON.parse(jsonContent);
        if (Array.isArray(parsed)) {
          setConfirmModalState({
            isOpen: true,
            title: 'ยืนยันนำเข้าข้อมูลสำรอง',
            message: `พบข้อมูลจำนวน ${parsed.length} รายการ ต้องการนำเข้าแทนที่ข้อมูลปัจจุบันหรือไม่?`,
            confirmLabel: 'ยืนยันนำเข้าข้อมูล',
            isDestructive: false,
            onConfirm: () => {
              setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
              setAssets(parsed);
              seedAssetsToFirestore(parsed).catch((e) =>
                console.warn('Firestore sync backup error:', e)
              );
              showToast('success', `นำเข้าข้อมูล ${parsed.length} รายการสำเร็จ`);
            },
          });
        } else {
          showToast('error', 'รูปแบบไฟล์สำรองไม่ถูกต้อง');
        }
      } catch (e) {
        showToast('error', 'ไม่สามารถอ่านไฟล์ JSON ได้');
      }
    });
  };

  // Reset to default sample assets
  const handleResetToDefault = () => {
    executeWithAdmin(() => {
      setConfirmModalState({
        isOpen: true,
        title: 'ยืนยันคืนค่าข้อมูลเริ่มต้น',
        message: 'ท่านต้องการคืนค่าข้อมูลเป็นชุดข้อมูลตัวอย่างเริ่มต้นของ อบต.วังซ้าย ใช่หรือไม่?',
        confirmLabel: 'ยืนยันคืนค่า',
        isDestructive: true,
        onConfirm: () => {
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
          setAssets(INITIAL_ASSETS);
          seedAssetsToFirestore(INITIAL_ASSETS).catch((e) => console.warn(e));
          showToast('success', 'คืนค่าข้อมูลตัวอย่างเริ่มต้นเรียบร้อยแล้ว');
        },
      });
    });
  };

  // Sync all assets to Firebase Firestore manually
  const handleSyncToFirestore = async () => {
    try {
      await seedAssetsToFirestore(assets);
      showToast('success', `บันทึกข้อมูล ${assets.length} รายการ ไปยัง Firebase (Property Control Ledger) สำเร็จ`);
    } catch (err: any) {
      showToast('error', `เกิดข้อผิดพลาดในการบันทึก Firestore: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Sarabun',sans-serif]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs sm:text-sm font-semibold animate-in slide-in-from-bottom duration-300 border bg-white max-w-md">
          {toast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          {toast.type === 'info' && (
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
          )}
          <span className="text-slate-800 flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'add') {
            handleAddClick();
          } else {
            setCurrentTab(tab);
          }
        }}
        isAdmin={isAdmin}
        onRequestAdmin={() => setAdminModalOpen(true)}
        onAdminLogout={handleAdminLogout}
        googleUser={googleUser}
        isGoogleConnected={isGoogleConnected}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        onSyncSheets={handleSyncToSheets}
        onOpenDriveImport={() => setDriveModalOpen(true)}
        isSyncing={isSyncing}
        customLogoUrl={customLogoUrl}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' || currentTab === 'table' ? (
          <Dashboard
            assets={assets}
            isAdmin={isAdmin}
            onRequestAdmin={() => setAdminModalOpen(true)}
            onAddClick={handleAddClick}
            onViewClick={handleViewClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            onOpenDriveImport={() => setDriveModalOpen(true)}
          />
        ) : currentTab === 'reports' ? (
          <AssetReports assets={assets} customLogoUrl={customLogoUrl} />
        ) : currentTab === 'settings' ? (
          <Settings
            isAdmin={isAdmin}
            onAdminLogin={() => {
              setIsAdmin(true);
              sessionStorage.setItem(SESSION_KEY_ADMIN, 'true');
            }}
            onAdminLogout={handleAdminLogout}
            googleUser={googleUser}
            isGoogleConnected={isGoogleConnected}
            onGoogleSignIn={handleGoogleSignIn}
            onGoogleSignOut={handleGoogleSignOut}
            onSyncSheets={handleSyncToSheets}
            onPullFromSheets={handlePullFromSheets}
            onOpenDriveImport={() => setDriveModalOpen(true)}
            isSyncing={isSyncing}
            spreadsheetId={spreadsheetId}
            onUpdateSpreadsheetId={setSpreadsheetId}
            customLogoUrl={customLogoUrl}
            onUpdateLogoUrl={setCustomLogoUrl}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onResetToDefault={handleResetToDefault}
            isFirebaseConnected={isFirebaseConnected}
            onSyncToFirestore={handleSyncToFirestore}
            totalAssetsCount={assets.length}
          />
        ) : null}
      </main>

      {/* Footer (Hidden in print) */}
      <footer className="print:hidden bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-semibold text-slate-300">
              ระบบทะเบียนครุภัณฑ์ องค์การบริหารส่วนตำบลวังซ้าย
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              อำเภอวังเหนือ จังหวัดลำปาง
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>งานพัสดุและทรัพย์สิน กองคลัง อบต.วังซ้าย</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AssetFormModal
        isOpen={formModalOpen}
        assetToEdit={assetToEdit}
        nextSeq={assets.length + 1}
        onSave={handleSaveAsset}
        onClose={() => {
          setFormModalOpen(false);
          setAssetToEdit(null);
        }}
      />

      <AssetDetailModal
        asset={selectedAsset}
        isOpen={detailModalOpen}
        isAdmin={isAdmin}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedAsset(null);
        }}
        onEdit={(item) => handleEditClick(item)}
        onDelete={(item) => handleDeleteClick(item)}
      />

      <AdminAuthModal
        isOpen={adminModalOpen}
        onSuccess={handleAdminSuccess}
        onClose={() => {
          setAdminModalOpen(false);
          setAdminCallback(null);
        }}
      />

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmLabel={confirmModalState.confirmLabel}
        isDestructive={confirmModalState.isDestructive}
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      <DriveImportModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        googleUser={googleUser}
        isGoogleConnected={isGoogleConnected}
        onGoogleSignIn={handleGoogleSignIn}
        getAccessToken={getAccessToken}
        onImportComplete={handleImportFromDrive}
        currentAssetsCount={assets.length}
      />
    </div>
  );
}
