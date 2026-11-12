// ─── Guardian Campus Navigation Registry ──────────────────────────────────────────
// Single source of truth for every route: the sidebar, mobile drawer, bottom
// tab bar, command palette, page headers and document titles all read from here.
// Add a feature once, and it shows up everywhere with the right role gating.

import { SquaresFourIcon as LayoutDashboard } from '@phosphor-icons/react/dist/csr/SquaresFour';
import { UserCircleIcon as UserRound } from '@phosphor-icons/react/dist/csr/UserCircle';
import { VideoCameraIcon as Video } from '@phosphor-icons/react/dist/csr/VideoCamera';
import { TrashIcon as Trash2 } from '@phosphor-icons/react/dist/csr/Trash';
import { DropIcon as Droplets } from '@phosphor-icons/react/dist/csr/Drop';
import { RecycleIcon as Recycle } from '@phosphor-icons/react/dist/csr/Recycle';
import { ForkKnifeIcon as UtensilsCrossed } from '@phosphor-icons/react/dist/csr/ForkKnife';
import { TreeIcon as TreePine } from '@phosphor-icons/react/dist/csr/Tree';
import { TrophyIcon as Trophy } from '@phosphor-icons/react/dist/csr/Trophy';
import { ShieldCheckIcon as ShieldCheck } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import { ScanIcon as ScanLine } from '@phosphor-icons/react/dist/csr/Scan';
import { CpuIcon as Cpu } from '@phosphor-icons/react/dist/csr/Cpu';
import { ActivityIcon as Activity } from '@phosphor-icons/react/dist/csr/Pulse';
import { PathIcon as Route } from '@phosphor-icons/react/dist/csr/Path';
import { LinkSimpleIcon as Link2 } from '@phosphor-icons/react/dist/csr/LinkSimple';
import { FileTextIcon as FileCheck2 } from '@phosphor-icons/react/dist/csr/FileText';
import { LightbulbIcon as Lightbulb } from '@phosphor-icons/react/dist/csr/Lightbulb';
import { PlantIcon as Sprout } from '@phosphor-icons/react/dist/csr/Plant';
import { EyeIcon as Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { ClipboardTextIcon as ClipboardCheck } from '@phosphor-icons/react/dist/csr/ClipboardText';

export const ROLES = { STUDENT: 'STUDENT', STAFF: 'STAFF', ADMIN: 'ADMIN' };
const { STUDENT, STAFF, ADMIN } = ROLES;
const ALL = [STUDENT, STAFF, ADMIN];

export const ROLE_LABEL = { STUDENT: 'Student', STAFF: 'Staff', ADMIN: 'Admin' };

// Feature → interface map. `roles` decides which interfaces can open the page;
// title/desc can be a per-role object when the same page plays a different part.
// accent = the module's identity colour, used for icons, glows and headers.
export const ROUTES = {
  // ── Shared by all three ────────────────────────────────────────────────
  '/': {
    title: { STUDENT: 'Guardian Home', STAFF: 'Ranger Base', ADMIN: 'Warden Command' },
    short: 'Home',
    desc: { STUDENT: 'Your impact, missions and campus pulse', STAFF: 'Today\'s field work and live alerts', ADMIN: 'Campus-wide telemetry and module launcher' },
    icon: LayoutDashboard, accent: '#34d399', roles: ALL,
  },
  '/bins': {
    title: 'Smart Bins Map', short: 'Bins',
    desc: { STUDENT: 'Find the nearest bin and report overflow', STAFF: 'Live fill levels — empty what is critical', ADMIN: 'Sensor network health and fill history' },
    icon: Trash2, accent: '#a3e635', roles: ALL,
  },
  '/trees': {
    title: 'Campus Flora Map', short: 'Flora', desc: 'Every geo-tagged tree and its CO₂ capture',
    icon: TreePine, accent: '#4ade80', roles: ALL,
  },

  // ── Student only ───────────────────────────────────────────────────────
  '/profile': {
    title: 'My Profile', short: 'Profile', desc: 'Badges, contributions and history',
    icon: UserRound, accent: '#6ee7b7', roles: [STUDENT],
  },
  '/adopt': {
    title: 'Adopt-a-Plant', short: 'My Plants', desc: 'Water your plant on time: +10 per watering, −15 per miss',
    icon: Sprout, accent: '#86efac', roles: [STUDENT], badge: 'NEW',
  },

  // ── Student + Staff ────────────────────────────────────────────────────
  '/bounties': {
    title: { STUDENT: 'Energy & Water Bounties', STAFF: 'Bounty Fix Queue' }, short: 'Bounties',
    desc: { STUDENT: 'Report phantom power and leaks for +35 pts', STAFF: 'Fix what students reported' },
    icon: Droplets, accent: '#38bdf8', roles: [STUDENT, STAFF],
  },
  '/mess': {
    title: 'Zero-Waste Cafeteria', short: 'Cafeteria',
    desc: { STUDENT: 'Grab surplus food and log clean plates', STAFF: 'Broadcast surplus portions to students' },
    icon: UtensilsCrossed, accent: '#fbbf24', roles: [STUDENT, STAFF],
  },

  // ── Student + Admin ────────────────────────────────────────────────────
  '/exchange': {
    title: { STUDENT: 'Pass-The-Torch', ADMIN: 'Pass-The-Torch Review' }, short: 'Exchange',
    desc: { STUDENT: 'Free senior gear, notes and lab kits', ADMIN: 'Verify and dispatch donated gear' },
    icon: Recycle, accent: '#a78bfa', roles: [STUDENT, ADMIN],
  },
  '/leaderboard': {
    title: 'Rewards & Leaderboard', short: 'Rewards', desc: 'Redeem EcoCredits and climb the ranks',
    icon: Trophy, accent: '#facc15', roles: [STUDENT, ADMIN],
  },
  '/overseer': {
    title: { STUDENT: 'Overseer Seat', ADMIN: 'Overseer Seat Control' }, short: 'Overseer',
    desc: { STUDENT: 'One anonymous student audits plant care', ADMIN: 'Seat status and term rotation — identity sealed' },
    icon: Eye, accent: '#e879f9', roles: [STUDENT, ADMIN],
  },

  // ── Staff + Admin ──────────────────────────────────────────────────────
  '/cctv-sentinel': {
    title: 'CCTV Energy Sentinel', short: 'Sentinel', desc: 'AI spots empty rooms; Green Guardians switch them off by hand',
    icon: Video, accent: '#2dd4bf', roles: [STAFF, ADMIN], badge: 'LIVE',
  },
  '/admin-verify': {
    title: 'Verification Desk', short: 'Verify', desc: 'Approve submissions and award credits',
    icon: ShieldCheck, accent: '#c084fc', roles: [STAFF, ADMIN],
  },
  '/ewaste': {
    title: 'E-Waste Depot', short: 'E-Waste', desc: 'Salvage components and value recovered metals',
    icon: Cpu, accent: '#60a5fa', roles: [STAFF, ADMIN],
  },

  // ── Staff only ─────────────────────────────────────────────────────────
  '/plant-reports': {
    title: 'Plant Care Audits', short: 'Plant Audits', desc: 'Review anonymous Overseer reports and apply penalties',
    icon: ClipboardCheck, accent: '#f472b6', roles: [STAFF],
  },
  '/cleaner-ops': {
    title: 'Ground Ops Routing', short: 'Ground Ops', desc: 'Surge forecasting and shortest collection route',
    icon: Route, accent: '#fb923c', roles: [STAFF],
  },
  '/scanner': {
    title: 'AI Material Scanner', short: 'Scanner', desc: 'YOLO vision intake station for Lab 104',
    icon: ScanLine, accent: '#34d399', roles: [STAFF], badge: 'AI',
  },

  // ── Admin only ─────────────────────────────────────────────────────────
  '/admin': {
    title: 'IoT Console', short: 'IoT', desc: 'Digital twin, sensors and surge simulation',
    icon: Activity, accent: '#22d3ee', roles: [ADMIN],
  },
  '/traceability': {
    title: 'Chain-of-Custody Ledger', short: 'Ledger', desc: 'Tamper-evident recycler manifests',
    icon: Link2, accent: '#2dd4bf', roles: [ADMIN],
  },
  '/audit': {
    title: 'NAAC Green Audit', short: 'NAAC', desc: 'Criterion 7.1 compliance report',
    icon: FileCheck2, accent: '#eab308', roles: [ADMIN],
  },
  '/rnsit-matrix': {
    title: '40-Idea Command Center', short: 'Ideas', desc: 'Closed-loop operational idea matrix',
    icon: Lightbulb, accent: '#f43f5e', roles: [ADMIN],
  },
};

// Sidebar groups — ordered by how often each role reaches for them.
export const NAV_GROUPS = {
  STUDENT: [
    { label: 'Overview', items: ['/', '/profile'] },
    { label: 'Guardian Duty', items: ['/adopt', '/bounties', '/bins'] },
    { label: 'Circular Living', items: ['/exchange', '/mess', '/trees'] },
    { label: 'Rewards & Roles', items: ['/leaderboard', '/overseer'] },
  ],
  STAFF: [
    { label: 'Overview', items: ['/'] },
    { label: 'Field Ops', items: ['/cleaner-ops', '/bins', '/cctv-sentinel', '/bounties'] },
    { label: 'Verification', items: ['/plant-reports', '/admin-verify', '/scanner'] },
    { label: 'Resources', items: ['/ewaste', '/mess', '/trees'] },
  ],
  ADMIN: [
    { label: 'Overview', items: ['/', '/admin'] },
    { label: 'Oversight', items: ['/admin-verify', '/cctv-sentinel', '/overseer', '/bins'] },
    { label: 'Circular Economy', items: ['/ewaste', '/exchange', '/traceability', '/trees'] },
    { label: 'Reports', items: ['/audit', '/rnsit-matrix', '/leaderboard'] },
  ],
};

// Mobile bottom tab bar — max 4 + "More"
export const MOBILE_TABS = {
  STUDENT: ['/', '/adopt', '/bounties', '/leaderboard'],
  STAFF: ['/', '/cleaner-ops', '/plant-reports', '/cctv-sentinel'],
  ADMIN: ['/', '/admin-verify', '/admin', '/overseer'],
};

const pick = (v, role) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[role] ?? v.ADMIN ?? v.STUDENT) : v);

export function getRoute(path, role = ROLES.STUDENT) {
  const r = ROUTES[path];
  if (!r) return null;
  return { ...r, path, title: pick(r.title, role), desc: pick(r.desc, role) };
}

export function canAccess(path, role) {
  const r = ROUTES[path];
  return !!r && r.roles.includes(role);
}

/** Which interfaces a page belongs to, e.g. ['Staff', 'Admin'] — used by the lock screen. */
export function interfacesFor(path) {
  return (ROUTES[path]?.roles || []).map(r => ROLE_LABEL[r]);
}

export function getNavGroups(role) {
  return (NAV_GROUPS[role] || []).map(g => ({
    label: g.label,
    items: g.items.map(p => getRoute(p, role)).filter(Boolean),
  }));
}

export function getGroupOf(path, role) {
  return (NAV_GROUPS[role] || []).find(g => g.items.includes(path))?.label;
}
