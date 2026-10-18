import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LedgerEntry, User } from '../../types';
import { INITIAL_LEDGER_ENTRIES } from '../../data/mockData';
import {
  getUserProfile,
  getUserLedgerEntries,
  saveUserLedgerEntry,
  saveUserProfile,
} from '../../services/firebase';

const WALLET_STORAGE_KEY = 'carbonlens_available_points_v2';
const LEDGER_STORAGE_KEY = 'carbonlens_ledger_entries_v2';
const INITIAL_BALANCE = 1420;
const INITIAL_PROVISIONAL = 100;

export interface RewardsContextType {
  availablePoints: number;
  provisionalPoints: number;
  ledgerEntries: LedgerEntry[];
  addRewardPoints: (
    delta: number,
    title: string,
    orderId?: string,
    metadata?: { co2AvoidedKg?: number; itemName?: string }
  ) => Promise<void>;
  redeemRewardPoints: (delta: number, rewardTitle: string) => Promise<boolean>;
  refreshRewards: () => Promise<void>;
  recentPurchaseReward: { points: number; title: string; date: string } | null;
  clearRecentRewardBanner: () => void;
}

const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

export const RewardsProvider: React.FC<{
  children: React.ReactNode;
  currentUser: User | null;
}> = ({ children, currentUser }) => {
  const [availablePoints, setAvailablePoints] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(WALLET_STORAGE_KEY);
      if (stored !== null) {
        const val = parseInt(stored, 10);
        if (!isNaN(val)) return val;
      }
    } catch {
      // fallback
    }
    return INITIAL_BALANCE;
  });

  const [provisionalPoints] = useState<number>(INITIAL_PROVISIONAL);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(() => {
    try {
      const stored = localStorage.getItem(LEDGER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_LEDGER_ENTRIES;
  });

  const [recentPurchaseReward, setRecentPurchaseReward] = useState<{
    points: number;
    title: string;
    date: string;
  } | null>(null);

  // Sync availablePoints to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, availablePoints.toString());
    } catch (err) {
      console.warn('Failed to save wallet to localStorage:', err);
    }
  }, [availablePoints]);

  // Sync ledgerEntries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(ledgerEntries));
    } catch (err) {
      console.warn('Failed to save ledger to localStorage:', err);
    }
  }, [ledgerEntries]);

  // Load user data from Firestore on sign-in
  const refreshRewards = useCallback(async () => {
    if (!currentUser?.uid || currentUser.isDemo) return;

    try {
      const profile = await getUserProfile(currentUser.uid);
      if (profile?.wallet?.available_points !== undefined) {
        setAvailablePoints(profile.wallet.available_points);
      }

      const remoteLedger = await getUserLedgerEntries(currentUser.uid);
      if (remoteLedger && remoteLedger.length > 0) {
        // Merge with initial, sorted newest first
        const map = new Map<string, LedgerEntry>();
        INITIAL_LEDGER_ENTRIES.forEach((e) => map.set(e.event_id, e));
        remoteLedger.forEach((e) => map.set(e.event_id, e));
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setLedgerEntries(merged);
      }
    } catch (err) {
      console.warn('Could not load user rewards from Firestore:', err);
    }
  }, [currentUser?.uid, currentUser?.isDemo]);

  useEffect(() => {
    if (currentUser?.uid && !currentUser.isDemo) {
      refreshRewards();
    }
  }, [currentUser?.uid, currentUser?.isDemo, refreshRewards]);

  const addRewardPoints = async (
    delta: number,
    title: string,
    orderId?: string,
    metadata?: { co2AvoidedKg?: number; itemName?: string }
  ) => {
    if (delta <= 0) return;

    const newBalance = availablePoints + delta;
    setAvailablePoints(newBalance);

    const eventId = orderId ? `order-${orderId}` : `purchase-${Date.now().toString(36)}`;
    const newEntry: LedgerEntry = {
      event_id: eventId,
      points_delta: delta,
      entry_type: 'VESTED',
      policy_version: `verified-green-buy: ${title.slice(0, 45)}`,
      created_at: new Date().toISOString(),
    };

    setLedgerEntries((prev) => [newEntry, ...prev.filter((e) => e.event_id !== eventId)]);

    setRecentPurchaseReward({
      points: delta,
      title: metadata?.itemName || title,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    // Save to Firestore if real user
    if (currentUser?.uid && !currentUser.isDemo) {
      try {
        await saveUserLedgerEntry(currentUser.uid, newEntry);
        const profile = await getUserProfile(currentUser.uid);
        await saveUserProfile({
          uid: currentUser.uid,
          displayName: profile?.displayName || currentUser.displayName || 'Eco User',
          email: profile?.email || currentUser.email,
          phoneNumber: profile?.phoneNumber || currentUser.phoneNumber,
          consent: profile?.consent,
          createdAt: profile?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wallet: {
            available_points: newBalance,
            provisional_points: provisionalPoints,
          },
        });
      } catch (err) {
        console.warn('Could not sync reward to Firestore:', err);
      }
    }
  };

  const redeemRewardPoints = async (delta: number, rewardTitle: string): Promise<boolean> => {
    if (availablePoints < delta) return false;

    const newBalance = availablePoints - delta;
    setAvailablePoints(newBalance);

    const eventId = `redeem-${Date.now().toString(36)}`;
    const newEntry: LedgerEntry = {
      event_id: eventId,
      points_delta: -delta,
      entry_type: 'VESTED',
      policy_version: `voucher-redemption: ${rewardTitle}`,
      created_at: new Date().toISOString(),
    };

    setLedgerEntries((prev) => [newEntry, ...prev]);

    if (currentUser?.uid && !currentUser.isDemo) {
      try {
        await saveUserLedgerEntry(currentUser.uid, newEntry);
        const profile = await getUserProfile(currentUser.uid);
        await saveUserProfile({
          uid: currentUser.uid,
          displayName: profile?.displayName || currentUser.displayName || 'Eco User',
          email: profile?.email || currentUser.email,
          phoneNumber: profile?.phoneNumber || currentUser.phoneNumber,
          consent: profile?.consent,
          createdAt: profile?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          wallet: {
            available_points: newBalance,
            provisional_points: provisionalPoints,
          },
        });
      } catch (err) {
        console.warn('Could not sync redemption to Firestore:', err);
      }
    }

    return true;
  };

  const clearRecentRewardBanner = () => {
    setRecentPurchaseReward(null);
  };

  return (
    <RewardsContext.Provider
      value={{
        availablePoints,
        provisionalPoints,
        ledgerEntries,
        addRewardPoints,
        redeemRewardPoints,
        refreshRewards,
        recentPurchaseReward,
        clearRecentRewardBanner,
      }}
    >
      {children}
    </RewardsContext.Provider>
  );
};

export const useRewards = () => {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
};
