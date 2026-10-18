import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  getDocFromServer,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, ConsentPreferences, PlantingProject, LedgerEntry, OrderRecord } from '../types';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with custom database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test connection on boot per Firebase skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is warming up.');
    }
  }
}
testConnection();

// Standardized Firestore error handler conforming to FirestoreErrorInfo
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
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Profile helpers in Firestore
export interface StoredUserProfile {
  uid: string;
  displayName: string;
  email?: string | null;
  phoneNumber?: string | null;
  wallet?: {
    available_points: number;
    provisional_points: number;
  };
  consent?: ConsentPreferences;
  createdAt: string;
  updatedAt: string;
}

export async function getUserProfile(uid: string): Promise<StoredUserProfile | null> {
  const userDocRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as StoredUserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function saveUserProfile(profile: StoredUserProfile): Promise<void> {
  const userDocRef = doc(db, 'users', profile.uid);
  try {
    const cleaned: any = {};
    for (const [key, val] of Object.entries(profile)) {
      if (val !== undefined) {
        if (key === 'wallet' && val && typeof val === 'object') {
          const cleanWallet: any = {};
          for (const [wk, wv] of Object.entries(val as any)) {
            if (wv !== undefined) cleanWallet[wk] = wv;
          }
          cleaned.wallet = cleanWallet;
        } else if (key === 'consent' && val && typeof val === 'object') {
          const cleanConsent: any = {};
          for (const [ck, cv] of Object.entries(val as any)) {
            if (cv !== undefined) cleanConsent[ck] = cv;
          }
          cleaned.consent = cleanConsent;
        } else {
          cleaned[key] = val;
        }
      }
    }
    await setDoc(userDocRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
  }
}

// Google Sign In with Firebase Auth
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// Phone Auth reCAPTCHA verifier setup
export function setupRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
  });
}

// Persistence: Planting Plots
export async function saveUserPlot(uid: string, plot: PlantingProject): Promise<void> {
  const plotRef = doc(db, 'users', uid, 'plots', plot.project_id);
  try {
    await setDoc(plotRef, plot);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/plots/${plot.project_id}`);
  }
}

export async function getUserPlots(uid: string): Promise<PlantingProject[]> {
  const plotsRef = collection(db, 'users', uid, 'plots');
  try {
    const snap = await getDocs(plotsRef);
    return snap.docs.map((d) => d.data() as PlantingProject);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/plots`);
  }
}

// Persistence: Recycling Claims
export interface StoredRecycleClaim {
  claim_id: string;
  item_category: string;
  weight_kg: number;
  recycler_id: string;
  photo_ref?: string;
  doc_ref?: string;
  status: 'PENDING' | 'VERIFIED';
  created_at: string;
}

export async function saveUserRecycleClaim(uid: string, claim: StoredRecycleClaim): Promise<void> {
  const claimRef = doc(db, 'users', uid, 'claims', claim.claim_id);
  try {
    await setDoc(claimRef, claim);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/claims/${claim.claim_id}`);
  }
}

export async function getUserRecycleClaims(uid: string): Promise<StoredRecycleClaim[]> {
  const claimsRef = collection(db, 'users', uid, 'claims');
  try {
    const snap = await getDocs(claimsRef);
    return snap.docs.map((d) => d.data() as StoredRecycleClaim);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/claims`);
  }
}

// Persistence: Green Points Ledger
export async function saveUserLedgerEntry(uid: string, entry: LedgerEntry): Promise<void> {
  const ledgerRef = doc(db, 'users', uid, 'ledger', entry.event_id);
  try {
    await setDoc(ledgerRef, entry);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/ledger/${entry.event_id}`);
  }
}

export async function getUserLedgerEntries(uid: string): Promise<LedgerEntry[]> {
  const ledgerRef = collection(db, 'users', uid, 'ledger');
  try {
    const snap = await getDocs(ledgerRef);
    return snap.docs.map((d) => d.data() as LedgerEntry);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/ledger`);
  }
}

// Persistence: Verified Green Orders & Automated Credits
export async function saveUserOrder(uid: string, order: OrderRecord): Promise<void> {
  const orderRef = doc(db, 'users', uid, 'orders', order.order_id);
  try {
    await setDoc(orderRef, order);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/orders/${order.order_id}`);
  }
}

export async function getUserOrders(uid: string): Promise<OrderRecord[]> {
  const ordersRef = collection(db, 'users', uid, 'orders');
  try {
    const snap = await getDocs(ordersRef);
    return snap.docs.map((d) => d.data() as OrderRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users/${uid}/orders`);
  }
}

// Award user points to wallet
export async function awardUserCredits(
  uid: string,
  creditsDelta: number,
  orderId: string,
  itemSummary: string
): Promise<{ newAvailablePoints: number }> {
  // 1. Fetch current profile
  const profile = await getUserProfile(uid);
  const currentAvailable = profile?.wallet?.available_points ?? 1420;
  const newAvailablePoints = currentAvailable + creditsDelta;

  // 2. Update profile wallet
  await saveUserProfile({
    uid,
    displayName: profile?.displayName || 'Eco User',
    email: profile?.email,
    phoneNumber: profile?.phoneNumber,
    consent: profile?.consent,
    createdAt: profile?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    wallet: {
      available_points: newAvailablePoints,
      provisional_points: profile?.wallet?.provisional_points ?? 100,
    },
  });

  // 3. Write immutable ledger entry
  const ledgerEntry: LedgerEntry = {
    event_id: `order-credit-${orderId.slice(-8)}`,
    points_delta: creditsDelta,
    entry_type: 'VESTED',
    policy_version: `verified-purchase:${itemSummary.slice(0, 30)}`,
    created_at: new Date().toISOString(),
  };
  await saveUserLedgerEntry(uid, ledgerEntry);

  return { newAvailablePoints };
}

// Test credentials
export const TEST_CREDENTIALS = {
  email: 'tester@carbonlens.dev',
  password: 'GreenEarth2026!',
  mobile: '+1 650-555-3434',
  testOtp: '123456',
};
