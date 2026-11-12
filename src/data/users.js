// ─── Guardian Campus — Mock User Database ──────────────────────────────────
// In a real system this would be PostgreSQL/Firebase Auth.
// USNs follow RNSIT format: 1RNyyBBnnn
// Roles: 'STUDENT' (Green Guardian) | 'STAFF' (Eco Ranger) | 'ADMIN' (Earth Warden)
// The Overseer is not a role here: it is a single, anonymous seat a student can opt into
// (see services/plantCareService.js).

export const MOCK_USERS = [
  // ── ADMIN ACCOUNTS ───────────────────────────────────────────────────────
  {
    id: 'admin-001',
    role: 'ADMIN',
    name: 'Dr. Kavitha S.',
    designation: 'NAAC Audit In-Charge & Guardian Campus Admin',
    email: 'kavitha.s@rnsit.ac.in',
    username: 'admin',
    password: 'eco@admin2026',
    avatar: '👩‍🏫',
    department: 'CSE',
  },
  {
    id: 'admin-002',
    role: 'ADMIN',
    name: 'Dr. Nayana C P',
    designation: 'ECE Lab Head & E-Waste Coordinator',
    email: 'nayana.cp@rnsit.ac.in',
    username: 'nayana',
    password: 'ewaste@2026',
    avatar: '👩‍🔬',
    department: 'ECE',
  },

  // ── STAFF ACCOUNTS (Eco Rangers: ground ops, lab technicians, mess staff) ──
  {
    id: 'staff-001',
    role: 'STAFF',
    name: 'Ramesh K.',
    designation: 'Ground Ops Specialist · Zone 2',
    email: 'ramesh.k@rnsit.ac.in',
    username: 'ramesh',
    password: 'ranger@2026',
    avatar: '👷',
    department: 'Estate & Maintenance',
  },
  {
    id: 'staff-002',
    role: 'STAFF',
    name: 'Lakshmi N.',
    designation: 'Lab 104 Technician & Flora Caretaker',
    email: 'lakshmi.n@rnsit.ac.in',
    username: 'lakshmi',
    password: 'flora@2026',
    avatar: '👩‍🔧',
    department: 'ECE Labs',
  },

  // ── STUDENT ACCOUNTS ─────────────────────────────────────────────────────
  {
    id: 'stu-abhiram',
    role: 'STUDENT',
    name: 'Abhiram',
    usn: '1RN23IS005',
    password: 'abhiram@2005',
    email: 'abhiram.is23@rnsit.ac.in',
    branch: 'ISE',
    year: 2,
    semester: 3,
    avatar: '👨‍🎓',
    financialAid: false,
    credits: 320,
    xp: 1450,
    level: 3,
    history: [
      { id: 'h1', action: 'AI Waste Scanner — Segregated PCB scrap', points: 30, date: '2026-10-15', status: 'APPROVED', type: 'SCAN' },
      { id: 'h2', action: 'Hand-Me-Downs — Donated Digital Logic Lab Manual', points: 45, date: '2026-10-14', status: 'APPROVED', type: 'HANDMEDOWN' },
      { id: 'h3', action: 'Adopt-A-Tree — Geo-tagged Gulmohar Tree 07', points: 40, date: '2026-10-12', status: 'APPROVED', type: 'TREE' },
    ],
    pendingContributions: [],
    rewards: [
      { id: 'r1', name: 'Campus Green Cafeteria Meal Pass', value: '₹100', redeemedAt: '2026-10-11', icon: '🍱' },
    ],
    handMeDowns: {
      donated: [
        { id: 'hmd-abhiram-1', title: 'Digital Logic & Computer Design Notes', category: 'NOTES', condition: 'GOOD', status: 'AVAILABLE' }
      ],
      received: [],
    },
  },
  {
    id: 'stu-001',
    role: 'STUDENT',
    name: 'Divyashree S.',
    usn: '1RN22CS045',
    password: 'divya@eco26',
    email: 'divyashree.s22@rnsit.ac.in',
    branch: 'CSE',
    year: 3,
    semester: 5,
    avatar: '👩‍💻',
    financialAid: false,
    credits: 380,
    xp: 1840,
    level: 4,
    history: [
      { id: 'h1', action: 'AI Waste Scan — Broken Arduino Board', points: 25, date: '2026-10-14', status: 'APPROVED', type: 'SCAN' },
      { id: 'h2', action: 'Tree Watering — TRE-012 Neem Sapling', points: 35, date: '2026-10-13', status: 'APPROVED', type: 'TREE' },
      { id: 'h3', action: 'Zero Plate Waste Logged', points: 20, date: '2026-10-12', status: 'APPROVED', type: 'FOOD' },
    ],
    pendingContributions: [],
    rewards: [
      { id: 'r1', name: 'Campus Café Voucher', value: '₹50', redeemedAt: '2026-10-10', icon: '☕' },
    ],
    handMeDowns: {
      donated: [],
      received: [],
    },
  },
  {
    id: 'stu-002',
    role: 'STUDENT',
    name: 'Sowmyashree S.',
    usn: '1RN22CS078',
    password: 'sowmya@eco26',
    email: 'sowmyashree.s22@rnsit.ac.in',
    branch: 'CSE',
    year: 3,
    semester: 5,
    avatar: '👩‍🎓',
    financialAid: false,
    credits: 520,
    xp: 2240,
    level: 5,
    history: [
      { id: 'h1', action: 'Bounty Resolved — Leaking Flush Valve CSE Block', points: 35, date: '2026-10-14', status: 'APPROVED', type: 'BOUNTY' },
      { id: 'h2', action: 'Hand-Me-Down: Engineering Drawing Kit donated', points: 50, date: '2026-10-13', status: 'APPROVED', type: 'HANDMEDOWN' },
    ],
    pendingContributions: [],
    rewards: [],
    handMeDowns: {
      donated: [],
      received: [],
    },
  },
  {
    id: 'stu-003',
    role: 'STUDENT',
    name: 'Harshitha P.',
    usn: '1RN22EC032',
    password: 'harshi@eco26',
    email: 'harshitha.p22@rnsit.ac.in',
    branch: 'ECE',
    year: 3,
    semester: 5,
    avatar: '👩‍🔧',
    financialAid: false,
    credits: 290,
    xp: 1120,
    level: 3,
    history: [
      { id: 'h1', action: 'E-Waste Deposit — Faulty Oscilloscope Probe', points: 40, date: '2026-10-13', status: 'PENDING', type: 'EWASTE' },
    ],
    pendingContributions: [
      { id: 'pc1', action: 'E-Waste Deposit — Faulty Oscilloscope Probe', points: 40, date: '2026-10-13', type: 'EWASTE', evidence: 'Photo submitted via app', status: 'PENDING' },
    ],
    rewards: [],
    handMeDowns: {
      donated: [],
      received: [],
    },
  },
  {
    id: 'stu-004',
    role: 'STUDENT',
    name: 'Ravi Kumar M.',
    usn: '1RN23ME019',
    password: 'ravi@eco26',
    email: 'ravi.m23@rnsit.ac.in',
    branch: 'ME',
    year: 2,
    semester: 3,
    avatar: '👨‍🔩',
    financialAid: true,   // ← Junior with financial difficulty — eligible for Hand-Me-Downs
    credits: 60,
    xp: 280,
    level: 1,
    history: [],
    pendingContributions: [],
    rewards: [],
    handMeDowns: {
      donated: [],
      received: [],
    },
  },
  {
    id: 'stu-005',
    role: 'STUDENT',
    name: 'Priya Nair',
    usn: '1RN24CS011',
    password: 'priya@eco26',
    email: 'priya.n24@rnsit.ac.in',
    branch: 'CSE',
    year: 1,
    semester: 1,
    avatar: '👩‍🎒',
    financialAid: true,   // ← First year, financial aid — eligible
    credits: 20,
    xp: 80,
    level: 1,
    history: [],
    pendingContributions: [],
    rewards: [],
    handMeDowns: {
      donated: [],
      received: [],
    },
  },
];

// ── Helper: look up user by USN or username+password ──────────────────────────
export function findUserByCredentials(identifier, password) {
  if (!identifier || !password) return null;
  const cleanId = identifier.trim().toUpperCase();
  const cleanPass = password.trim();

  // 1. Direct match in MOCK_USERS
  const found = MOCK_USERS.find(u => {
    const matchId = (u.usn && u.usn.toUpperCase() === cleanId) || 
                    (u.username && u.username.toLowerCase() === identifier.trim().toLowerCase());
    return matchId && u.password === cleanPass;
  });
  if (found) return found;

  // 2. Pre-assigned RNSIT USN format (1RNyyBBnnn) auto-onboarding
  // Allows any university student to authenticate with their official USN
  const usnPattern = /^1RN(\d{2})([A-Z]{2,3})(\d{3})$/i;
  const match = cleanId.match(usnPattern);
  if (match && cleanPass.length >= 4) {
    const yearDigits = parseInt(match[1], 10);
    const branchCode = match[2].toUpperCase();
    const currYear = 26;
    const studyYear = Math.max(1, Math.min(4, currYear - yearDigits));

    const newStudent = {
      id: `stu-${cleanId.toLowerCase()}`,
      role: 'STUDENT',
      name: `Student ${cleanId}`,
      usn: cleanId,
      password: cleanPass,
      email: `${cleanId.toLowerCase()}@rnsit.ac.in`,
      branch: branchCode,
      year: studyYear,
      semester: studyYear * 2 - 1,
      avatar: '👨‍🎓',
      financialAid: false,
      credits: 200,
      xp: 850,
      level: 2,
      history: [
        { id: 'h-welcome', action: 'Joined Guardian Campus — Welcome Grant', points: 200, date: new Date().toLocaleDateString('en-IN'), status: 'APPROVED', type: 'WELCOME' }
      ],
      pendingContributions: [],
      rewards: [],
      handMeDowns: {
        donated: [],
        received: [],
      },
    };
    MOCK_USERS.push(newStudent);
    return newStudent;
  }

  return null;
}
