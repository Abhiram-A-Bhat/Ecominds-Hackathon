// ─── Green Guardian Campus Task Dispatch & Fast-Claim Network ─────────────────
// Sensors and staff raise tasks (empty rooms left powered on, bin surges, leaks,
// thirsty plants, surplus food). Every Green Guardian gets a ride-hailing style
// alarm; the first student to slide "accept" owns the task, does it by hand on
// site, and earns the points on completion.
//
// Persisted to localStorage and synced across tabs, so two students in two
// windows genuinely race for the same task.

const KEY = 'ecosphere_guardian_tasks_v2';

const SEED = [
  {
    id: 'GRD-201',
    title: 'Switch off projector, AC & lights in empty Seminar Hall 2',
    category: 'ENERGY_CUTOFF',
    targetId: 'CAM-01',
    location: 'Admin Block, 3rd Floor (Room 302)',
    severity: 'CRITICAL',
    points: 40,
    co2Saved: '3.2 kg CO2e / hr',
    detectedBy: 'AI CCTV Sentinel (0 occupants for 28 mins)',
    status: 'OPEN', // 'OPEN' | 'CLAIMED' | 'COMPLETED'
    claimedBy: null,
    appliances: '1 Projector, 4 Ceiling Fans, 8 LED Tubes, 1 AC',
    createdAt: Date.now() - 12 * 60e3,
  },
  {
    id: 'GRD-202',
    title: 'Bin B-102 is 98% full — swap the liner',
    category: 'BIN_OVERFLOW',
    targetId: 'B-102',
    location: 'Computer Science Block, 2nd Floor Corridor East',
    severity: 'CRITICAL',
    points: 35,
    co2Saved: 'Prevents corridor littering & cross-stream contamination',
    detectedBy: 'Ultrasonic HC-SR04 IoT Telemetry Array',
    status: 'OPEN',
    claimedBy: null,
    appliances: 'Dry & Paper Waste Compactor',
    createdAt: Date.now() - 8 * 60e3,
  },
  {
    id: 'GRD-203',
    title: 'Close a continuously dripping restroom tap',
    category: 'WATER_LEAK',
    location: 'Mechanical Block, 1st Floor Restroom',
    severity: 'HIGH',
    points: 30,
    co2Saved: '~15 litres / hour saved',
    detectedBy: 'Student Scout Report (photo verified)',
    status: 'OPEN',
    claimedBy: null,
    appliances: 'Restroom Valve #M-04',
    createdAt: Date.now() - 22 * 60e3,
  },
  {
    id: 'GRD-205',
    title: 'Distribute 25 portions of surplus pulao',
    category: 'FOOD_SURPLUS',
    location: 'Cauvery Hostel Dining Counter',
    severity: 'HIGH',
    points: 35,
    co2Saved: '~8.5 kg food diverted from landfill',
    detectedBy: 'Hostel Mess Head Broadcast',
    status: 'COMPLETED',
    claimedBy: { name: 'Sowmyashree S.', usn: '1RN22CS078', time: '10:05' },
    completedAt: '10:40',
    appliances: 'Hot Holding Insulated Carriers',
    createdAt: Date.now() - 60 * 60e3,
  },
];

// Scenarios used by "Simulate AI detection" so demos always have something to race for
const DETECTIONS = [
  { title: 'Switch off fans & lights in empty CSE Lab 3', category: 'ENERGY_CUTOFF', targetId: 'CAM-02', location: 'Computer Science Block, 2nd Floor', severity: 'CRITICAL', points: 40, co2Saved: '3.9 kg CO2e / hr', detectedBy: 'AI CCTV Sentinel (0 occupants for 16 mins)', appliances: '16 Workstations, 1 AC, 6 Tube Lights' },
  { title: 'Turn off halogen bay lights in empty CAD Annex', category: 'ENERGY_CUTOFF', targetId: 'CAM-04', location: 'Mechanical Workshop Yard, Ground Floor', severity: 'HIGH', points: 40, co2Saved: '2.4 kg CO2e / hr', detectedBy: 'AI CCTV Sentinel (0 occupants for 19 mins)', appliances: '2 Exhaust Fans, Halogen Array, Air Blower' },
  { title: 'Bin B-207 surged to 94% — swap the liner', category: 'BIN_OVERFLOW', targetId: 'B-207', location: 'Library Block, Ground Floor Lobby', severity: 'CRITICAL', points: 35, co2Saved: 'Prevents overflow litter', detectedBy: 'Ultrasonic HC-SR04 IoT Array', appliances: 'Wet Waste Bin' },
  { title: 'Hydrate the sun-stressed Gulmohar #03', category: 'FLORA_CARE', location: 'Cafeteria Outdoor Garden Lawn', severity: 'MEDIUM', points: 25, co2Saved: 'Protects 28 kg CO2/yr capture', detectedBy: 'Soil moisture probe (12% VWC)', appliances: 'Garden Hydration Station #03' },
  { title: 'Shut a hissing urinal flush valve', category: 'WATER_LEAK', location: 'Civil Block, 2nd Floor Restroom', severity: 'HIGH', points: 30, co2Saved: '~20 litres / hour saved', detectedBy: 'Smart water meter anomaly', appliances: 'Flush Valve #C-11' },
];

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(raw)) return raw;
  } catch { /* fall through */ }
  return SEED.map(t => ({ ...t }));
}

let tasks = load();
let listeners = [];

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch { /* ignore */ }
}

function notify() {
  listeners.forEach(fn => fn([...tasks]));
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { tasks = load(); notify(); }
  });
}

const timeNow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function timeAgo(ts) {
  if (typeof ts !== 'number') return ts || '';
  const m = Math.round((Date.now() - ts) / 60e3);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} hr ago`;
}

/** Plant rescues go only to Guardians who don't already look after a plant (and never the owner). */
export function canClaimTask(task, guardian) {
  if (!guardian) return false;
  if (task.ownerId && task.ownerId === guardian.id) return false;
  if (task.eligibility === 'NON_PLANT_OWNER' && guardian.ownsPlant) return false;
  return true;
}

export const guardianTaskService = {
  getTasks() {
    return [...tasks];
  },

  getOpenCount() {
    return tasks.filter(t => t.status === 'OPEN').length;
  },

  subscribe(listener) {
    listeners.push(listener);
    listener([...tasks]);
    return () => { listeners = listeners.filter(l => l !== listener); };
  },

  claimTask(taskId, guardian) {
    tasks = load(); // re-read so a claim from another tab wins if it landed first
    const task = tasks.find(t => t.id === taskId);
    if (!task) return { success: false, message: 'Task not found.' };
    if (!canClaimTask(task, guardian)) {
      return { success: false, task, message: task.ownerId === guardian?.id ? 'This is your own plant — water it from Adopt-a-Plant.' : 'Only Guardians without an adopted plant can take this rescue.' };
    }
    if (task.status !== 'OPEN') {
      notify();
      return {
        success: false,
        task,
        message: task.status === 'COMPLETED' ? 'Task is already completed.' : `${task.claimedBy?.name || 'Another Guardian'} slid first.`,
      };
    }
    task.status = 'CLAIMED';
    task.claimedBy = {
      id: guardian?.id,
      name: guardian?.name || 'Green Guardian',
      usn: guardian?.usn || '',
      avatar: guardian?.avatar || '🌿',
      time: timeNow(),
      at: Date.now(),
    };
    save(); notify();
    return { success: true, task };
  },

  completeTask(taskId, notes = 'Physically verified and resolved on-site.', proofPhoto = null) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return { success: false, message: 'Task not found.' };
    task.status = 'COMPLETED';
    task.completedAt = timeNow();
    task.completionNotes = notes;
    if (proofPhoto) task.proofPhoto = proofPhoto;
    save(); notify();
    return { success: true, task, points: task.points };
  },

  /** Withdraw an open task that is no longer needed (e.g. the owner watered after all). */
  cancelTask(taskId) {
    tasks = load();
    const before = tasks.length;
    tasks = tasks.filter(t => !(t.id === taskId && t.status === 'OPEN'));
    if (tasks.length !== before) { save(); notify(); }
  },

  /** Task still in play for a target (open or claimed). */
  activeFor(targetId) {
    return load().find(t => t.targetId === targetId && t.status !== 'COMPLETED');
  },

  /** A rival Guardian (simulated) grabs the task — used when the alarm times out. */
  rivalClaim(taskId) {
    const rivals = [
      { name: 'Ananya R.', usn: '1RN23CS102', avatar: '👩‍🎓' },
      { name: 'Karthik V.', usn: '1RN22ME044', avatar: '🧑‍🔧' },
      { name: 'Meghana H.', usn: '1RN24EC017', avatar: '👩‍🔬' },
    ];
    return this.claimTask(taskId, rivals[Math.floor(Math.random() * rivals.length)]);
  },

  createTask(newTaskData) {
    const task = {
      id: `GRD-${Math.floor(300 + Math.random() * 700)}`,
      status: 'OPEN',
      claimedBy: null,
      createdAt: Date.now(),
      ...newTaskData,
    };
    tasks = [task, ...load()];
    save(); notify();
    return task;
  },

  /** Raise a random sensor detection (demo trigger). */
  simulateDetection() {
    const open = new Set(tasks.filter(t => t.status !== 'COMPLETED').map(t => t.targetId).filter(Boolean));
    const pool = DETECTIONS.filter(d => !d.targetId || !open.has(d.targetId));
    const pick = (pool.length ? pool : DETECTIONS)[Math.floor(Math.random() * (pool.length || DETECTIONS.length))];
    return this.createTask({ ...pick });
  },

  reset() {
    tasks = SEED.map(t => ({ ...t, createdAt: Date.now() - (Date.now() - t.createdAt) }));
    save(); notify();
  },
};
