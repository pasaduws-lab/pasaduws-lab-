import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  getDocFromServer,
  writeBatch,
} from 'firebase/firestore';
import { auth } from './firebaseAuth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AssetItem } from '../types/asset';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/* CRITICAL: The app will break without this line per Firebase Skill */
const dbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate connection to Firestore on initial boot per skill requirements
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using cache.');
    }
    return false;
  }
}

export const FIREBASE_PROJECT_NAME = 'Property Control Ledger';
export const ASSETS_COLLECTION = 'property_control_ledger';
export const LEGACY_COLLECTION = 'assets';

/**
 * Real-time subscription to assets collection in Firestore (Property Control Ledger)
 */
export function subscribeToAssets(
  onData: (assets: AssetItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const primaryColRef = collection(db, ASSETS_COLLECTION);

  const unsubscribePrimary = onSnapshot(
    primaryColRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const items: AssetItem[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          items.push({
            id: d.id,
            seq: Number(data.seq) || 1,
            code: String(data.code || ''),
            name: String(data.name || ''),
            model: String(data.model || ''),
            receivedDate: String(data.receivedDate || ''),
            receivedYear: String(data.receivedYear || ''),
            location: String(data.location || ''),
            category: data.category || 'ครุภัณฑ์สำนักงาน',
            customCategory: data.customCategory || undefined,
            quantity: Number(data.quantity) || 1,
            unit: String(data.unit || 'เครื่อง'),
            price: Number(data.price) || 0,
            status: data.status || 'ใช้งานได้',
            customStatus: data.customStatus || undefined,
            remarks: String(data.remarks || ''),
            imageUrl: String(data.imageUrl || ''),
            updatedAt: String(data.updatedAt || new Date().toISOString()),
          });
        });
        items.sort((a, b) => a.seq - b.seq);
        onData(items);
      } else {
        // If primary collection is currently empty, check fallback collection
        const legacyColRef = collection(db, LEGACY_COLLECTION);
        getDocs(legacyColRef)
          .then((legacySnap) => {
            if (!legacySnap.empty) {
              const items: AssetItem[] = [];
              legacySnap.forEach((d) => {
                const data = d.data();
                items.push({
                  id: d.id,
                  seq: Number(data.seq) || 1,
                  code: String(data.code || ''),
                  name: String(data.name || ''),
                  model: String(data.model || ''),
                  receivedDate: String(data.receivedDate || ''),
                  receivedYear: String(data.receivedYear || ''),
                  location: String(data.location || ''),
                  category: data.category || 'ครุภัณฑ์สำนักงาน',
                  customCategory: data.customCategory || undefined,
                  quantity: Number(data.quantity) || 1,
                  unit: String(data.unit || 'เครื่อง'),
                  price: Number(data.price) || 0,
                  status: data.status || 'ใช้งานได้',
                  customStatus: data.customStatus || undefined,
                  remarks: String(data.remarks || ''),
                  imageUrl: String(data.imageUrl || ''),
                  updatedAt: String(data.updatedAt || new Date().toISOString()),
                });
              });
              items.sort((a, b) => a.seq - b.seq);
              onData(items);
              // Migrate / replicate to primary Property Control Ledger collection
              seedAssetsToFirestore(items).catch((err) =>
                console.warn('Replicating legacy items to Property Control Ledger:', err)
              );
            }
          })
          .catch((err) => console.warn('Legacy collection fetch:', err));
      }
    },
    (error) => {
      console.error('Firestore snapshot listener error:', error);
      try {
        handleFirestoreError(error, OperationType.GET, ASSETS_COLLECTION);
      } catch (err: any) {
        if (onError) onError(err);
      }
    }
  );

  return () => {
    unsubscribePrimary();
  };
}

/**
 * Add or update an asset in Firestore (Property Control Ledger & legacy mirror)
 */
export async function saveAssetToFirestore(asset: AssetItem): Promise<void> {
  const docPath = `${ASSETS_COLLECTION}/${asset.id}`;
  const payload = {
    id: asset.id,
    seq: asset.seq,
    code: asset.code,
    name: asset.name,
    model: asset.model,
    receivedDate: asset.receivedDate,
    receivedYear: asset.receivedYear,
    location: asset.location,
    category: asset.category,
    customCategory: asset.customCategory || null,
    quantity: asset.quantity,
    unit: asset.unit,
    price: asset.price,
    status: asset.status,
    customStatus: asset.customStatus || null,
    remarks: asset.remarks,
    imageUrl: asset.imageUrl || '',
    updatedAt: asset.updatedAt || new Date().toISOString(),
  };

  try {
    const docRef = doc(db, ASSETS_COLLECTION, asset.id);
    await setDoc(docRef, payload);

    // Also mirror to legacy collection for compatibility
    try {
      const legacyRef = doc(db, LEGACY_COLLECTION, asset.id);
      await setDoc(legacyRef, payload);
    } catch {
      // ignore mirror failure
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Delete an asset from Firestore
 */
export async function deleteAssetFromFirestore(assetId: string): Promise<void> {
  const docPath = `${ASSETS_COLLECTION}/${assetId}`;
  try {
    const docRef = doc(db, ASSETS_COLLECTION, assetId);
    await deleteDoc(docRef);

    // Mirror delete
    try {
      const legacyRef = doc(db, LEGACY_COLLECTION, assetId);
      await deleteDoc(legacyRef);
    } catch {
      // ignore
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Batch write multiple assets to Firestore (for Property Control Ledger seeding & sync)
 */
export async function seedAssetsToFirestore(assets: AssetItem[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const item of assets) {
      const payload = {
        id: item.id,
        seq: item.seq,
        code: item.code,
        name: item.name,
        model: item.model,
        receivedDate: item.receivedDate,
        receivedYear: item.receivedYear,
        location: item.location,
        category: item.category,
        customCategory: item.customCategory || null,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        status: item.status,
        customStatus: item.customStatus || null,
        remarks: item.remarks,
        imageUrl: item.imageUrl || '',
        updatedAt: item.updatedAt || new Date().toISOString(),
      };
      // Primary Property Control Ledger collection
      const docRef = doc(db, ASSETS_COLLECTION, item.id);
      batch.set(docRef, payload);

      // Legacy mirror collection
      const legacyRef = doc(db, LEGACY_COLLECTION, item.id);
      batch.set(legacyRef, payload);
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ASSETS_COLLECTION);
  }
}

/**
 * Check if collection has data; if empty, initialize with default assets
 */
export async function initializeFirestoreIfEmpty(defaultAssets: AssetItem[]): Promise<void> {
  try {
    const snap = await getDocs(collection(db, ASSETS_COLLECTION));
    if (snap.empty && defaultAssets.length > 0) {
      console.log('Firestore assets collection is empty. Seeding initial assets...');
      await seedAssetsToFirestore(defaultAssets);
    }
  } catch (error) {
    console.warn('Firestore initialization check:', error);
  }
}
