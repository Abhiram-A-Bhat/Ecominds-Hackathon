// ─── Guardian Campus Auth Context ───────────────────────────────────────────────────
// Three interfaces share one app:
//   STUDENT → "Green Guardian"   ·  STAFF → "Eco Ranger"   ·  ADMIN → "Earth Warden"
// The live user store is persisted to localStorage and synced across tabs, so a
// demo can run the student, staff and admin interfaces side by side in separate
// windows and see each other's point changes. Each tab keeps its own signed-in
// user (sessionStorage), falling back to the last sign-in for a fresh tab.

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { MOCK_USERS, findUserByCredentials } from '../data/users';
import { REWARDS_CATALOG } from '../data/mockData';

export const ROLE_META = {
  STUDENT: { title: 'Green Guardian', short: 'Guardian', accent: '#34d399', tint: 'rgba(52,211,153,.14)', border: 'rgba(52,211,153,.3)' },
  STAFF:   { title: 'Eco Ranger',     short: 'Ranger',   accent: '#fb923c', tint: 'rgba(251,146,60,.14)', border: 'rgba(251,146,60,.32)' },
  ADMIN:   { title: 'Earth Warden',   short: 'Warden',   accent: '#c084fc', tint: 'rgba(192,132,252,.16)', border: 'rgba(192,132,252,.3)' },
};

const AuthContext = createContext(null);

// ── Live user store (persisted + cross-tab) ─────────────────────────────────
const LIVE_KEY = 'ecosphere_live_users_v2';

const cloneUser = (u) => ({
  ...u,
  history: [...(u.history || [])],
  pendingContributions: [...(u.pendingContributions || [])],
  rewards: [...(u.rewards || [])],
  handMeDowns: { donated: [...(u.handMeDowns?.donated || [])], received: [...(u.handMeDowns?.received || [])] },
});

function hydrate() {
  const seeds = MOCK_USERS.map(cloneUser);
  try {
    const stored = JSON.parse(localStorage.getItem(LIVE_KEY));
    if (Array.isArray(stored)) {
      const byId = new Map(stored.map(u => [u.id, u]));
      const merged = seeds.map(s => byId.has(s.id) ? { ...s, ...byId.get(s.id) } : s);
      stored.forEach(u => { if (!merged.some(m => m.id === u.id)) merged.push(u); });
      return merged;
    }
  } catch { /* corrupt or unavailable storage → seeds */ }
  return seeds;
}

let liveUsers = hydrate();
const localListeners = new Set();

function commit(next) {
  liveUsers = next;
  try { localStorage.setItem(LIVE_KEY, JSON.stringify(liveUsers)); } catch { /* quota/unavailable */ }
  localListeners.forEach(fn => fn());
}

export function resetLiveUsers() {
  try { localStorage.removeItem(LIVE_KEY); } catch { /* ignore */ }
  liveUsers = MOCK_USERS.map(cloneUser);
  localListeners.forEach(fn => fn());
}

const today = () => new Date().toLocaleDateString('en-IN');

// ── Session (per tab) ───────────────────────────────────────────────────────
const COOKIE_NAME = 'ecosphere_auth_user';

function setSession(user) {
  try {
    const data = JSON.stringify({ id: user.id, usn: user.usn, username: user.username, role: user.role, name: user.name });
    sessionStorage.setItem(COOKIE_NAME, data);
    localStorage.setItem(COOKIE_NAME, data);
    const expires = new Date(Date.now() + 14 * 864e5).toUTCString();
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(data)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (err) {
    console.warn('Failed to persist session:', err);
  }
}

function getSession() {
  try {
    const tab = sessionStorage.getItem(COOKIE_NAME);
    if (tab) return JSON.parse(tab);
  } catch { /* ignore */ }
  try {
    const match = document.cookie.match(new RegExp('(^|; )' + COOKIE_NAME + '=([^;]*)'));
    if (match?.[2]) return JSON.parse(decodeURIComponent(match[2]));
  } catch { /* ignore */ }
  try {
    const local = localStorage.getItem(COOKIE_NAME);
    if (local) return JSON.parse(local);
  } catch { /* ignore */ }
  return null;
}

function clearSession() {
  try {
    sessionStorage.removeItem(COOKIE_NAME);
    localStorage.removeItem(COOKIE_NAME);
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  } catch { /* ignore */ }
}

function resolveSaved(saved) {
  if (!saved) return null;
  const u = liveUsers.find(x => x.id === saved.id) ||
    liveUsers.find(x => x.usn && saved.usn && x.usn.toUpperCase() === saved.usn.toUpperCase()) ||
    liveUsers.find(x => x.username && saved.username && x.username === saved.username);
  return u?.id || null;
}

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(() => resolveSaved(getSession()));
  const [rev, setRev] = useState(0);
  const [authError, setAuthError] = useState('');

  // Re-render whenever the store changes here or in another tab
  useEffect(() => {
    const bump = () => setRev(r => r + 1);
    localListeners.add(bump);
    const onStorage = (e) => {
      if (e.key === LIVE_KEY) { liveUsers = hydrate(); bump(); }
    };
    window.addEventListener('storage', onStorage);
    return () => { localListeners.delete(bump); window.removeEventListener('storage', onStorage); };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentUser = useMemo(() => (userId ? liveUsers.find(u => u.id === userId) || null : null), [userId, rev]);

  const updateUser = (id, fn) => commit(liveUsers.map(u => (u.id === id ? fn(u) : u)));

  // ── Login / logout ───────────────────────────────────────────────────────
  const login = useCallback((identifier, password) => {
    const found = findUserByCredentials(identifier, password);
    if (!found) {
      setAuthError('Invalid USN / username or password. Please try again.');
      return false;
    }
    if (!liveUsers.some(u => u.id === found.id)) commit([...liveUsers, cloneUser(found)]);
    const live = liveUsers.find(u => u.id === found.id);
    setSession(live);
    setUserId(live.id);
    setAuthError('');
    return true;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUserId(null);
  }, []);

  // ── Points ───────────────────────────────────────────────────────────────
  const updateCredits = useCallback((delta) => {
    if (!userId) return;
    updateUser(userId, u => ({ ...u, credits: Math.max(0, (u.credits || 0) + delta) }));
  }, [userId]);

  /** Credit or debit any user, with a history line. Used by plant care, audits, guardian tasks. */
  const adjustPoints = useCallback((targetId, delta, action, type = 'OTHER') => {
    updateUser(targetId, u => ({
      ...u,
      credits: Math.max(0, (u.credits || 0) + delta),
      xp: delta > 0 ? (u.xp || 0) + delta * 4 : u.xp,
      history: [{ id: `adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, action, points: delta, date: today(), status: 'APPROVED', type }, ...(u.history || [])],
    }));
  }, []);

  const addContribution = useCallback((entry) => {
    const contribution = { id: `c-${Date.now()}`, date: today(), status: 'PENDING', ...entry };
    if (!userId) return contribution;
    updateUser(userId, u => ({
      ...u,
      history: [{ ...contribution }, ...u.history],
      pendingContributions: contribution.status === 'PENDING' ? [{ ...contribution }, ...u.pendingContributions] : u.pendingContributions,
    }));
    return contribution;
  }, [userId]);

  const getAllUsers = useCallback(() => [...liveUsers], []);

  const approveContribution = useCallback((studentId, contributionId, points) => {
    let approved = false;
    updateUser(studentId, u => {
      const contribution = u.history.find(h => h.id === contributionId && h.status === 'PENDING');
      if (!contribution) return u;
      const award = Math.min(100, Math.max(0, Math.round(Number(points) || 0)));
      approved = true;
      return ({
      ...u,
      history: u.history.map(h => (h.id === contributionId ? { ...h, status: 'APPROVED', points: award } : h)),
      pendingContributions: u.pendingContributions.filter(h => h.id !== contributionId),
      credits: (u.credits || 0) + award,
      });
    });
    return approved;
  }, []);

  const rejectContribution = useCallback((studentId, contributionId, reason) => {
    updateUser(studentId, u => ({
      ...u,
      history: u.history.map(h => (h.id === contributionId ? { ...h, status: 'REJECTED', adminNote: reason } : h)),
      pendingContributions: u.pendingContributions.filter(h => h.id !== contributionId),
    }));
  }, []);

  // ── Hand-Me-Downs ────────────────────────────────────────────────────────
  const addDonation = useCallback((item) => {
    if (!userId) return;
    updateUser(userId, u => {
      const donation = { ...item, donorId: u.id, donorName: u.name, donorUSN: u.usn, status: item.status || 'AVAILABLE' };
      return { ...u, handMeDowns: { ...u.handMeDowns, donated: [donation, ...(u.handMeDowns?.donated || [])] } };
    });
  }, [userId]);

  const addClaimedItem = useCallback((item) => {
    if (!userId) return;
    updateUser(userId, u => ({
      ...u,
      handMeDowns: {
        ...u.handMeDowns,
        received: [{
          id: item.id || `claim-${Date.now()}`, title: item.title, category: item.category,
          claimedAt: today(), donorName: item.donorName, status: 'CLAIMED',
        }, ...(u.handMeDowns?.received || [])],
      },
    }));
  }, [userId]);

  const redeemReward = useCallback((reward, code) => {
    if (!userId) return false;
    const catalogReward = REWARDS_CATALOG.find(item => item.id === reward?.id);
    if (!catalogReward || catalogReward.cost !== reward.cost) return false;
    let redeemed = false;
    updateUser(userId, u => ({
      ...((u.credits || 0) < catalogReward.cost ? {} : (redeemed = true, {
        credits: (u.credits || 0) - catalogReward.cost,
        rewards: [{ id: `rwd-${Date.now()}`, name: catalogReward.title, icon: catalogReward.icon || '🎁', value: `${catalogReward.cost} PTS`, code, redeemedAt: today() }, ...(u.rewards || [])],
        history: [{ id: `hist-rwd-${Date.now()}`, action: `Redeemed Reward: ${catalogReward.title}`, points: -catalogReward.cost, date: today(), status: 'APPROVED', type: 'OTHER' }, ...(u.history || [])],
      })),
    }));
    return redeemed;
  }, [userId]);

  const approveDonation = useCallback((donationId, pointsToAward) => {
    let approved = false;
    commit(liveUsers.map(u => {
      const donation = u.handMeDowns.donated.find(d => d.id === donationId && d.status === 'PENDING_ADMIN');
      const owns = Boolean(donation);
      if (owns) approved = true;
      return {
        ...u,
        handMeDowns: { ...u.handMeDowns, donated: u.handMeDowns.donated.map(d => (d.id === donationId && d.status === 'PENDING_ADMIN' ? { ...d, status: 'AVAILABLE', pointsAwarded: Math.min(30, Math.max(0, Math.round(Number(pointsToAward) || 0))) } : d)) },
        credits: owns ? (u.credits || 0) + Math.min(30, Math.max(0, Math.round(Number(pointsToAward) || 0))) : u.credits,
        history: owns ? [{ id: `don-${donationId}`, action: `Passed Down: ${donation.title}`, points: Math.min(30, Math.max(0, Math.round(Number(pointsToAward) || 0))), date: today(), status: 'APPROVED', type: 'HANDMEDOWN' }, ...(u.history || [])] : u.history,
      };
    }));
    return approved;
  }, []);

  const allotVerifiedPoints = useCallback((studentUsn, points, actionTitle) => {
    const clean = (studentUsn || '').trim().toUpperCase();
    const target = liveUsers.find(u => u.usn && u.usn.toUpperCase() === clean);
    if (!target) return false;
    const award = Math.min(50, Math.max(0, Math.round(Number(points) || 0)));
    adjustPoints(target.id, award, actionTitle || 'AI Waste Verification — ECE Lab 104', 'SCAN');
    return true;
  }, [adjustPoints]);

  const role = currentUser?.role || null;

  return (
    <AuthContext.Provider value={{
      currentUser,
      authError,
      role,
      roleMeta: role ? ROLE_META[role] : null,
      isAdmin: role === 'ADMIN',
      isStaff: role === 'STAFF',
      isStudent: role === 'STUDENT',
      isOperator: role === 'STAFF' || role === 'ADMIN',
      login,
      logout,
      updateCredits,
      adjustPoints,
      addContribution,
      getAllUsers,
      approveContribution,
      rejectContribution,
      addDonation,
      addClaimedItem,
      redeemReward,
      approveDonation,
      allotVerifiedPoints,
      getLiveUsers: () => [...liveUsers],
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
