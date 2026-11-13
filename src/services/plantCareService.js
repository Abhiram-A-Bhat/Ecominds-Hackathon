// ─── Adopt-a-Plant + Anonymous Overseer ──────────────────────────────────────
// Students adopt a campus plant and must water it every cycle:
//   +10 base for on-time watering; thirsty/high-care plants earn +10 extra
//   (+20 base streak bonus every 5 waterings, with another care-tier bonus)
//   −15 for every cycle that passes without water (settled automatically)
// One student at a time may hold the Overseer seat. The Overseer's identity is
// never exposed: other users only ever see a pseudonym code. The Overseer walks
// campus, and if a plant's care log says "watered" but the plant is clearly
// neglected, files a photo report. Staff verify reports; upheld reports dock the
// adopter's points.
//
// Persisted to localStorage and synced across tabs. A demo clock offset lets a
// presenter fast-forward days without waiting.

import { computeSchedule, WINDOWS, litres, days } from '../data/plantProfiles';
import { guardianTaskService } from './guardianTaskService';
import { fetchCampusWeather, fetchCampusForecast } from './weatherService';
import { profileFor } from '../data/plantProfiles';

const KEY = 'ecosphere_plantcare_v2'; // v2: 15 plants on real campus roads
const H = 3600e3;
const OVERSEER_TERM_MS = 14 * 24 * H;

export const PLANT_RULES = {
  wateringReward: 10,
  streakBonusEvery: 5,
  streakBonus: 20,
  missPenalty: 15,
  rescueReward: 15,
  adoptBonus: 25,
  overseerReward: 20,
  auditPenalties: [25, 50, 100],
};

// Extra points scale with the species' real care demand. Thirsty plants need
// frequent attention; moderate plants with a 48-hour schedule receive a smaller bonus.
export function plantCareBonus(plant) {
  const profile = profileFor(plant);
  if (profile.tolerance === 'thirsty') {
    return { tier: 'HIGH', watering: 10, adoption: 15, streak: 10, rescue: 5 };
  }
  if (profile.tolerance === 'moderate' && profile.baseIntervalHrs <= 48) {
    return { tier: 'MODERATE', watering: 5, adoption: 10, streak: 5, rescue: 3 };
  }
  return { tier: 'STANDARD', watering: 0, adoption: 0, streak: 0, rescue: 0 };
}

// Where each plant physically is on campus [lng, lat]. Placed beside real campus
// roads (checked against the Mapbox basemap), with a cluster on the open south
// lawn around Shiva Temple.
export const PLANT_COORDS = {
  'PLT-01': [77.517834, 12.902459], // North gate road, west kerb
  'PLT-02': [77.518825, 12.902404], // North gate road, east kerb
  'PLT-03': [77.517636, 12.901907], // West block road, library foyer
  'PLT-04': [77.517197, 12.901051], // Lower campus road, west
  'PLT-05': [77.518188, 12.900817], // Main block, south steps
  'PLT-06': [77.519497, 12.901562], // 23rd Cross Road gate, annex entrance
  'PLT-07': [77.519264, 12.901010], // 23rd Cross Road side gate
  'PLT-08': [77.517494, 12.900610], // South lawn path kiosk
  'PLT-09': [77.517692, 12.900341], // South lawn, row 1
  'PLT-10': [77.517905, 12.900182], // South lawn herb patch
  'PLT-11': [77.517657, 12.900058], // Temple road, west hedge
  'PLT-12': [77.518188, 12.899961], // Shiva Temple, front bed
  'PLT-13': [77.518542, 12.900044], // Temple east grove
  'PLT-14': [77.518740, 12.900320], // East service road
  'PLT-15': [77.516984, 12.900092], // South boundary road, west
};

const D = 24 * H;
const plant = (id, name, species, emoji, location, extra = {}) => ({
  id, name, species, emoji, location, intervalHrs: 24,
  adopterId: null, adopterName: null, adoptedAt: null, streak: 0, penalisedMisses: 0, log: [], ...extra,
});
const adopted = (now, by, name, days, wateredHrsAgo, streak) => ({
  adopterId: by, adopterName: name, adoptedAt: now - days * D, lastWateredAt: now - wateredHrsAgo * H, streak,
  log: [0, 1, 2].map(i => now - (wateredHrsAgo + i * 24) * H),
});

const seedPlants = (now) => [
  plant('PLT-01', 'Tulsi', 'Ocimum tenuiflorum', '🌿', 'North gate road, west kerb', adopted(now, 'stu-001', 'Divyashree S.', 20, 6, 9)),
  plant('PLT-02', 'Hibiscus', 'Hibiscus rosa-sinensis', '🌺', 'North gate road, east kerb', adopted(now, 'stu-004', 'Ravi Kumar M.', 12, 3, 6)),
  plant('PLT-03', 'Areca Palm', 'Dypsis lutescens', '🌴', 'West block road, library foyer', adopted(now, 'stu-002', 'Sowmyashree S.', 120, 20, 14)),
  plant('PLT-04', 'Neem sapling', 'Azadirachta indica', '🌱', 'Lower campus road, west', { lastWateredAt: now - 40 * H }),
  plant('PLT-05', 'Aloe vera', 'Aloe barbadensis', '🪴', 'Main block, south steps', { lastWateredAt: now - 50 * H }),
  plant('PLT-06', 'Money plant', 'Epipremnum aureum', '🍃', '23rd Cross Road gate, annex entrance', { lastWateredAt: now - 30 * H }),
  plant('PLT-07', 'Marigold bed', 'Tagetes erecta', '🌼', '23rd Cross Road side gate', adopted(now, 'stu-003', 'Harshitha P.', 15, 10, 7)),
  plant('PLT-08', 'Snake plant', 'Dracaena trifasciata', '🌵', 'South lawn path kiosk (covered)', { lastWateredAt: now - 60 * H }),
  plant('PLT-09', 'Young neem', 'Azadirachta indica', '🌱', 'South lawn, row 1', adopted(now, 'stu-005', 'Priya Nair', 9, 18, 4)),
  plant('PLT-10', 'Herb tulsi', 'Ocimum tenuiflorum', '🌿', 'South lawn herb patch', { lastWateredAt: now - 26 * H }),
  plant('PLT-11', 'Red hibiscus', 'Hibiscus rosa-sinensis', '🌺', 'Temple road, west hedge', adopted(now, 'stu-x-karthik', 'Karthik V.', 25, 8, 11)),
  plant('PLT-12', 'Temple marigolds', 'Tagetes erecta', '🌼', 'Shiva Temple, front bed', adopted(now, 'stu-x-meghana', 'Meghana H.', 18, 14, 5)),
  plant('PLT-13', 'Grove neem', 'Azadirachta indica', '🌱', 'Temple east grove', adopted(now, 'stu-x-ananya', 'Ananya R.', 40, 22, 16)),
  plant('PLT-14', 'Desert aloe', 'Aloe barbadensis', '🪴', 'East service road', { lastWateredAt: now - 70 * H }),
  plant('PLT-15', 'Pink hibiscus', 'Hibiscus rosa-sinensis', '🌺', 'South boundary road, west', { lastWateredAt: now - 20 * H }),
];

function fresh() {
  const now = Date.now();
  return { plants: seedPlants(now), reports: [], overseer: null, applications: [], pastOverseerCodes: [], offsetMs: 0 };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && Array.isArray(raw.plants)) return { ...fresh(), ...raw, applications: Array.isArray(raw.applications) ? raw.applications : [] };
  } catch { /* fall through */ }
  return fresh();
}

let state = load();
let listeners = [];

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota: photos are downscaled, but be safe */ }
}
function notify() { listeners.forEach(fn => fn(snapshot())); }
// Persist the seed on first run so timestamps don't drift between reloads
try { if (!localStorage.getItem(KEY)) save(); } catch { /* ignore */ }
function commit() { save(); notify(); }

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => { if (e.key === KEY) { state = load(); notify(); } });
}

const now = () => Date.now() + (state.offsetMs || 0);

function expireOverseerState() {
  if (!state.overseer) return false;
  const expiresAt = state.overseer.expiresAt || state.overseer.since + OVERSEER_TERM_MS;
  if (Date.now() < expiresAt) return false;
  state.pastOverseerCodes = [...(state.pastOverseerCodes || []), state.overseer.code];
  state.overseer = null;
  save();
  return true;
}

function code() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = 'OVR-';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

// ── Schedule engine: species profile × live weather ─────────────────────────
export const WEATHER_PRESETS = {
  heatwave: { temp: 36, humidity: 30, wind: 4, clouds: 5, rainMm: 0, popNext6h: 0, rainNext6hMm: 0, description: 'clear sky, heatwave', label: 'Heatwave' },
  rainy: { temp: 23, humidity: 92, wind: 5, clouds: 100, rainMm: 4.5, popNext6h: 0.9, rainNext6hMm: 8, description: 'moderate rain', label: 'Monsoon rain' },
  incoming: { temp: 26, humidity: 78, wind: 7, clouds: 90, rainMm: 0, popNext6h: 0.85, rainNext6hMm: 6, description: 'overcast, rain expected', label: 'Rain on the way' },
  cool: { temp: 18, humidity: 70, wind: 2, clouds: 80, rainMm: 0, popNext6h: 0.1, rainNext6hMm: 0, description: 'overcast clouds', label: 'Cool & cloudy' },
};

export const RAIN_CREDIT_MM = 2; // ≥2 mm in the last hour soaks an outdoor pot or bed

/** Measured rain waters outdoor adopted plants for their owners (no points, no penalty). */
function applyRainCredit() {
  const c = state.conditions;
  if (!c || c.source === 'fallback' || (c.rainMm ?? 0) < RAIN_CREDIT_MM) return 0;
  let n = 0;
  state.plants.forEach(p => {
    if (!p.adopterId || profileFor(p).indoor) return;
    if (p.lastRainCredit && now() - p.lastRainCredit.at < 6 * H) return; // one credit per rain spell
    p.lastWateredAt = now();
    p.penalisedMisses = 0;
    p.log = [now(), ...(p.log || [])].slice(0, 12);
    p.lastRainCredit = { at: now(), mm: c.rainMm };
    const rescue = guardianTaskService.activeFor(p.id);
    if (rescue?.status === 'OPEN') guardianTaskService.cancelTask(rescue.id);
    n += 1;
  });
  return n;
}

export function scheduleOf(p) {
  // Offline readings are placeholders, so plan on species defaults instead of guessing
  return computeSchedule(p, state.conditions?.source === 'fallback' ? null : state.conditions);
}

/** Next good time to water: the plant's preferred window once watering is allowed, before it is due. */
function nextReminder(p, canWaterAt, dueAt, windowKey) {
  const w = WINDOWS[windowKey] || WINDOWS.morning;
  const d = new Date(canWaterAt);
  d.setHours(w.startH, 0, 0, 0);
  if (d.getTime() < canWaterAt) d.setDate(d.getDate() + 1);
  return d.getTime() <= dueAt ? d.getTime() : canWaterAt;
}

/** Derived care status for a plant at time t */
export function careStatus(p, t = now()) {
  const sched = p.schedule || scheduleOf(p);
  const interval = sched.intervalHrs * H;
  const elapsed = t - (p.lastWateredAt || t);
  const dueAt = (p.lastWateredAt || t) + interval;
  const progress = Math.min(elapsed / interval, 2);
  const canWaterAt = (p.lastWateredAt || 0) + interval * 0.5;
  let level = 'healthy';
  if (p.flaggedAt && t - p.flaggedAt < 48 * H) level = 'flagged';
  else if (elapsed > interval) level = 'overdue';
  else if (elapsed > interval * 0.75) level = 'thirsty';
  return {
    level, dueAt, progress: Math.max(0, progress), canWaterAt,
    remindAt: nextReminder(p, canWaterAt, dueAt, sched.window),
    ml: sched.ml, intervalHrs: sched.intervalHrs, windowLabel: (WINDOWS[sched.window] || WINDOWS.morning).label,
    canWater: t >= canWaterAt,
    misses: Math.max(0, Math.floor(elapsed / interval)),
    msToDue: dueAt - t,
  };
}

function snapshot() {
  expireOverseerState();
  return {
    now: now(),
    offsetMs: state.offsetMs || 0,
    plants: state.plants.map(p => ({ ...p, lngLat: p.lngLat || PLANT_COORDS[p.id], schedule: scheduleOf(p) })),
    conditions: state.conditions,
    reports: state.reports.map(r => ({ ...r })),
    applications: [...(state.applications || [])],
    seat: state.overseer ? { occupied: true, code: state.overseer.code, since: state.overseer.since, expiresAt: state.overseer.expiresAt || state.overseer.since + OVERSEER_TERM_MS } : { occupied: false },
  };
}

export const plantCareService = {
  getState: snapshot,
  now,

  subscribe(fn) {
    listeners.push(fn);
    fn(snapshot());
    return () => { listeners = listeners.filter(l => l !== fn); };
  },

  adopt(plantId, user) {
    state = load();
    const p = state.plants.find(x => x.id === plantId);
    if (!p) return { ok: false, message: 'Plant not found.' };
    if (p.adopterId) return { ok: false, message: 'Someone adopted this plant moments ago.' };
    if (state.plants.some(x => x.adopterId === user.id)) return { ok: false, message: 'You already care for a plant. One plant per Guardian keeps it fair.' };
    Object.assign(p, { adopterId: user.id, adopterName: user.name, adoptedAt: now(), lastWateredAt: now() - scheduleOf(p).intervalHrs * H * 0.6, streak: 0, penalisedMisses: 0, log: [], flaggedAt: null });
    commit();
    const careBonus = plantCareBonus(p);
    return { ok: true, plant: { ...p }, points: PLANT_RULES.adoptBonus + careBonus.adoption, careBonus };
  },

  release(plantId, userId) {
    const p = state.plants.find(x => x.id === plantId && x.adopterId === userId);
    if (!p) return { ok: false };
    Object.assign(p, { adopterId: null, adopterName: null, adoptedAt: null, streak: 0, penalisedMisses: 0, log: [] });
    commit();
    return { ok: true };
  },

  /** Log a watering. Returns the points to award (0 if too early). */
  water(plantId, userId, photo = null) {
    const p = state.plants.find(x => x.id === plantId);
    if (!p || p.adopterId !== userId) return { ok: false, message: 'Only the adopter can log watering.' };
    const rescue = guardianTaskService.activeFor(p.id);
    if (rescue?.status === 'CLAIMED') return { ok: false, message: `${rescue.claimedBy?.name || 'Another Guardian'} took over this watering because the deadline passed.` };
    const st = careStatus(p);
    if (!st.canWater) return { ok: false, message: 'Too soon — over-watering rots the roots. Come back when the window opens.' };
    const late = st.level === 'overdue';
    p.lastWateredAt = now();
    p.penalisedMisses = 0;
    p.streak = late && !p.shieldSaved ? 1 : (p.streak || 0) + 1;
    p.shieldSaved = false;
    p.log = [now(), ...(p.log || [])].slice(0, 12);
    if (photo) p.lastPhoto = photo;
    const careBonus = plantCareBonus(p);
    const bonus = p.streak % PLANT_RULES.streakBonusEvery === 0 ? PLANT_RULES.streakBonus + careBonus.streak : 0;
    if (rescue?.status === 'OPEN') guardianTaskService.cancelTask(rescue.id); // owner made it after all
    commit();
    return { ok: true, plant: { ...p }, points: PLANT_RULES.wateringReward + careBonus.watering + bonus, bonus, careBonus, late };
  },

  /**
   * Apply −penalty for every missed cycle not yet penalised.
   * Returns [{ userId, plant, misses, delta }] for the caller to debit.
   */
  settle() {
    const out = [];
    state.plants.forEach(p => {
      if (!p.adopterId) return;
      const { misses } = careStatus(p);
      const owed = misses - (p.penalisedMisses || 0);
      if (owed > 0) {
        p.penalisedMisses = misses;
        let shielded = false;
        if ((p.shields || 0) > 0 && !p.shieldSaved) { p.shields -= 1; p.shieldSaved = true; shielded = true; }
        else if (!p.shieldSaved) p.streak = 0;
        out.push({ userId: p.adopterId, plant: { ...p }, misses: owed, shielded, delta: -owed * PLANT_RULES.missPenalty });
        // The adopter missed the deadline → only now does the plant go to another Guardian
        if (!guardianTaskService.activeFor(p.id)) {
          const sc = scheduleOf(p);
          guardianTaskService.createTask({
            title: `Water ${p.name} — its adopter missed the deadline`,
            category: 'FLORA_CARE',
            targetId: p.id,
            ownerId: p.adopterId,
            eligibility: 'NON_PLANT_OWNER',
            location: p.location,
            severity: 'HIGH',
            points: PLANT_RULES.rescueReward + plantCareBonus(p).rescue,
            co2Saved: `Keeps a ${p.name.toLowerCase()} alive`,
            detectedBy: `Care schedule: not watered for ${this.formatDuration(now() - p.lastWateredAt)}`,
            appliances: `${litres(sc.ml)} of water`,
          });
        }
      }
    });
    if (out.length) commit();
    return out;
  },

  /** Another Guardian completed a rescue watering. */
  rescueWater(plantId, rescuerName) {
    const p = state.plants.find(x => x.id === plantId);
    if (!p) return { ok: false };
    p.lastWateredAt = now();
    p.penalisedMisses = 0;
    if (!p.shieldSaved) p.streak = 0;
    p.log = [now(), ...(p.log || [])].slice(0, 12);
    p.rescuedBy = { name: rescuerName, at: now() };
    p.shieldSaved = false;
    commit();
    return { ok: true };
  },

  // ── Plant rewards ─────────────────────────────────────────────────────────
  /** Can this student redeem a plant reward right now? */
  rewardEligibility(kind, userId) {
    const p = state.plants.find(x => x.adopterId === userId);
    if (!p) return { ok: false, reason: 'Adopt a plant first.' };
    if (kind === 'STREAK_SHIELD') {
      if ((p.shields || 0) > 0) return { ok: false, reason: 'You already have an unused shield.' };
      if (p.shieldBoughtAt && now() - p.shieldBoughtAt < 30 * 24 * H) return { ok: false, reason: `One per month — next in ${this.formatDuration(p.shieldBoughtAt + 30 * 24 * H - now())}.` };
    }
    if (kind === 'NAMING_RIGHTS') {
      const held = now() - (p.adoptedAt || now());
      if (held < 90 * 24 * H) return { ok: false, reason: `Unlocks after 90 days of care (${Math.floor(held / (24 * H))} so far).` };
      if (p.nickname) return { ok: false, reason: `Already named “${p.nickname}”.` };
    }
    return { ok: true, plant: { ...p } };
  },

  addShield(userId) {
    const el = this.rewardEligibility('STREAK_SHIELD', userId);
    if (!el.ok) return el;
    const p = state.plants.find(x => x.adopterId === userId);
    p.shields = (p.shields || 0) + 1;
    p.shieldBoughtAt = now();
    commit();
    return { ok: true, plant: { ...p } };
  },

  setNickname(userId, nickname) {
    const clean = (nickname || '').trim().replace(/\s+/g, ' ').slice(0, 24);
    if (clean.length < 2) return { ok: false, reason: 'Pick a name with at least 2 letters.' };
    const el = this.rewardEligibility('NAMING_RIGHTS', userId);
    if (!el.ok) return el;
    const p = state.plants.find(x => x.adopterId === userId);
    p.nickname = clean;
    commit();
    return { ok: true, plant: { ...p } };
  },

  /** Pull live campus weather (unless a demo preset is pinned) and re-plan every plant. */
  async refreshConditions() {
    if (state.conditions?.source === 'simulated') return;
    const [w, f] = await Promise.all([fetchCampusWeather(), fetchCampusForecast()]);
    if (state.conditions?.source === 'simulated') return; // a preset was pinned while we were fetching
    state.conditions = {
      temp: w.temp, humidity: w.humidity, description: w.description,
      wind: +(w.windSpeed ?? 0).toFixed(1), clouds: w.clouds, rainMm: w.isReal ? +(w.rainMm || 0).toFixed(1) : 0,
      popNext6h: f.isReal ? f.popNext6h : 0, rainNext6hMm: f.isReal ? f.rainNext6hMm : 0,
      source: w.isReal ? 'live' : 'fallback', label: w.isReal ? 'Live campus weather' : 'Weather offline — species defaults', at: Date.now(),
    };
    applyRainCredit();
    commit();
  },

  /** Demo: pin a weather preset to show how schedules adapt; null returns to live. */
  simulateWeather(presetKey) {
    if (!presetKey) { state.conditions = null; commit(); this.refreshConditions(); return; }
    state.conditions = { ...WEATHER_PRESETS[presetKey], source: 'simulated', preset: presetKey, at: Date.now() };
    applyRainCredit();
    commit();
  },

  /** Demo only: return to real time. */
  resetClock() {
    state.offsetMs = 0;
    state.plants.forEach(p => { p.penalisedMisses = Math.min(p.penalisedMisses || 0, careStatus(p, Date.now()).misses); });
    commit();
  },

  /** Demo only: move the clock forward. */
  fastForward(hours) {
    state.offsetMs = (state.offsetMs || 0) + hours * H;
    commit();
  },

  // ── Overseer seat ─────────────────────────────────────────────────────────
  /** Is this user the Overseer? Only ever asked about yourself. */
  isOverseer(userId) {
    expireOverseerState();
    return !!state.overseer && state.overseer.userId === userId;
  },

  applyForOverseer(user) {
    state = load();
    if (!user || user.role !== 'STUDENT') return { ok: false, message: 'Only students can apply.' };
    if (this.isOverseer(user.id)) return { ok: false, message: 'You already hold the Overseer seat.' };
    if (state.applications.some(a => a.userId === user.id && a.status === 'APPLIED')) return { ok: false, message: 'Your application is already in the queue.' };
    state.applications.push({ userId: user.id, name: user.name, usn: user.usn, appliedAt: Date.now(), status: 'APPLIED' });
    commit();
    return { ok: true };
  },

  appointHighestApplicant(users) {
    state = load();
    expireOverseerState();
    if (state.overseer) return { ok: false, message: 'The current term must end before another student can be appointed.' };
    const userById = new Map((users || []).map(user => [user.id, user]));
    const applicants = state.applications
      .filter(application => application.status === 'APPLIED')
      .map(application => ({ application, user: userById.get(application.userId) }))
      .filter(candidate => candidate.user?.role === 'STUDENT')
      .sort((a, b) => (b.user.credits || 0) - (a.user.credits || 0) || a.application.appliedAt - b.application.appliedAt);
    if (!applicants.length) return { ok: false, message: 'There are no eligible applications to appoint.' };

    const winner = applicants[0];
    state.applications = state.applications.map(application => application.status !== 'APPLIED' ? application : {
      ...application,
      status: application.userId === winner.user.id ? 'SELECTED' : 'NOT_SELECTED',
    });
    const appointedAt = Date.now();
    state.overseer = {
      userId: winner.user.id,
      name: winner.user.name,
      usn: winner.user.usn,
      code: code(),
      since: appointedAt,
      expiresAt: appointedAt + OVERSEER_TERM_MS,
    };
    commit();
    return { ok: true, name: winner.user.name, points: winner.user.credits || 0, code: state.overseer.code };
  },

  leaveSeat(userId) {
    expireOverseerState();
    if (!state.overseer || state.overseer.userId !== userId) return { ok: false };
    state.pastOverseerCodes = [...(state.pastOverseerCodes || []), state.overseer.code];
    state.overseer = null;
    commit();
    return { ok: true };
  },

  /** Admin: end the current term without learning who held it. */
  vacateSeat() {
    if (!state.overseer) return { ok: false };
    state.pastOverseerCodes = [...(state.pastOverseerCodes || []), state.overseer.code];
    state.overseer = null;
    commit();
    return { ok: true };
  },

  expireOverseer() {
    if (!expireOverseerState()) return false;
    notify();
    return true;
  },

  /** Overseer files a report. The reporter's user id is never stored — only the seat code. */
  fileReport(userId, { plantId, photo, issue, note }) {
    if (!this.isOverseer(userId)) return { ok: false, message: 'Only the Overseer can file audits.' };
    const p = state.plants.find(x => x.id === plantId);
    if (!p?.adopterId) return { ok: false, message: 'That plant has no adopter to audit.' };
    if (p.adopterId === userId) return { ok: false, message: 'You cannot audit your own plant.' };
    if (state.reports.some(r => r.plantId === plantId && r.status === 'PENDING')) return { ok: false, message: 'This plant already has a report awaiting staff review.' };
    const report = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      plantId, plantName: p.name, plantEmoji: p.emoji, location: p.location,
      ownerId: p.adopterId, ownerName: p.adopterName,
      claimedLastWatered: p.lastWateredAt, claimedStreak: p.streak,
      photo, issue, note: note?.trim() || '',
      reporterCode: state.overseer.code,
      reporterName: state.overseer.name, reporterUsn: state.overseer.usn, // shown to staff reviewers only
      createdAt: now(), status: 'PENDING',
    };
    state.reports = [report, ...state.reports];
    commit();
    return { ok: true, report };
  },

  /** Staff verdict. Returns the debit/credit the caller must apply. */
  review(reportId, { upheld, penalty = 50, reviewer }) {
    const r = state.reports.find(x => x.id === reportId);
    if (!r || r.status !== 'PENDING') return { ok: false };
    r.status = upheld ? 'UPHELD' : 'DISMISSED';
    r.reviewedAt = now();
    r.reviewedBy = reviewer;
    r.penalty = upheld ? penalty : 0;
    const out = { ok: true, report: { ...r }, owner: null, overseer: null };
    if (upheld) {
      const p = state.plants.find(x => x.id === r.plantId);
      if (p) { p.flaggedAt = now(); p.streak = 0; }
      out.owner = { userId: r.ownerId, delta: -penalty };
      // Reward the seat holder — only if the same term is still running, and silently.
      if (state.overseer?.code === r.reporterCode) out.overseer = { userId: state.overseer.userId, delta: PLANT_RULES.overseerReward };
    }
    commit();
    return out;
  },

  /** Staff only: who holds the seat. Never call this from student or admin screens. */
  seatHolderForStaff() {
    return state.overseer ? { name: state.overseer.name, usn: state.overseer.usn, code: state.overseer.code, since: state.overseer.since } : null;
  },

  /** The current Overseer's own reports (matched by seat code, not identity). */
  myReports(userId) {
    if (!this.isOverseer(userId)) return [];
    return state.reports.filter(r => r.reporterCode === state.overseer.code);
  },

  /** Plain-language duration: "40 minutes", "6 hours", "1½ days". */
  formatDuration(ms) {
    const neg = ms < 0; const mins = Math.round(Math.abs(ms) / 60e3);
    let txt;
    if (mins < 1) txt = 'under a minute';
    else if (mins < 60) txt = `${mins} minute${mins === 1 ? '' : 's'}`;
    else if (mins < 24 * 60) { const h = Math.round(mins / 60); txt = `${h} hour${h === 1 ? '' : 's'}`; }
    else txt = days(mins / 60);
    return neg ? `-${txt}` : txt;
  },

  reset() {
    state = fresh();
    commit();
  },
};

// Enforce the 14-day term even while the user is on a different page.
if (typeof window !== 'undefined') window.setInterval(() => plantCareService.expireOverseer(), 30_000);
