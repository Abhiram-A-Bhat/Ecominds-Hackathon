export const INITIAL_BINS = [
  {
    id: "B-101",
    name: "Admin Quadrangle North",
    block: "Administrative Block",
    floor: "Ground Floor",
    fillLevel: 35,
    type: "Multi-Stream (Dry/Wet)",
    status: "NORMAL",
    lastCollected: "2 hours ago",
    batteryPct: 92,
    coordinates: { x: 32, y: 45 },
    lngLat: [77.5182, 12.9024],
    eWasteAllowed: false
  },
  {
    id: "B-102",
    name: "CSE Dept Corridor East",
    block: "Computer Science Block",
    floor: "2nd Floor",
    fillLevel: 91,
    type: "Dry & Paper Waste",
    status: "CRITICAL",
    lastCollected: "6 hours ago",
    batteryPct: 88,
    coordinates: { x: 68, y: 28 },
    lngLat: [77.5175, 12.9020],
    eWasteAllowed: false
  },
  {
    id: "B-103",
    name: "Student Cafeteria Plaza",
    block: "Food Court",
    floor: "Ground Floor",
    fillLevel: 86,
    type: "Organic & Food Waste",
    status: "CRITICAL",
    lastCollected: "4 hours ago",
    batteryPct: 95,
    coordinates: { x: 50, y: 70 },
    lngLat: [77.5188, 12.9015],
    eWasteAllowed: false
  },
  {
    id: "B-104",
    name: "ECE Robotics & IoT Lab",
    block: "Electronics Block",
    floor: "1st Floor",
    fillLevel: 42,
    type: "Dedicated E-Waste Bin",
    status: "NORMAL",
    lastCollected: "1 day ago",
    batteryPct: 90,
    coordinates: { x: 80, y: 55 },
    lngLat: [77.5192, 12.9019],
    eWasteAllowed: true
  },
  {
    id: "B-105",
    name: "Mechanical Workshop Yard",
    block: "Mechanical Annex",
    floor: "Ground Floor",
    fillLevel: 68,
    type: "Metal & Recyclables",
    status: "WARNING",
    lastCollected: "5 hours ago",
    batteryPct: 84,
    coordinates: { x: 18, y: 78 },
    lngLat: [77.5172, 12.9010],
    eWasteAllowed: false
  },
  {
    id: "B-106",
    name: "Main Library Foyer",
    block: "Library Building",
    floor: "1st Floor",
    fillLevel: 24,
    type: "Paper & Stationary",
    status: "NORMAL",
    lastCollected: "3 hours ago",
    batteryPct: 97,
    coordinates: { x: 42, y: 22 },
    lngLat: [77.5185, 12.9028],
    eWasteAllowed: false
  },
  {
    id: "B-107",
    name: "Hostel Mess Wet Compactor",
    block: "Cauvery Hostel",
    floor: "Basement",
    fillLevel: 79,
    type: "Biodegradable to Compost",
    status: "WARNING",
    lastCollected: "3 hours ago",
    batteryPct: 89,
    coordinates: { x: 85, y: 82 },
    lngLat: [77.5195, 12.9008],
    eWasteAllowed: false
  }
];


export const SALVAGED_EWASTE_ITEMS = [
  {
    id: "EW-301",
    name: "Arduino Uno R3 Microcontroller",
    category: "Development Boards",
    condition: "Tested & Working",
    sourceDept: "ECE Dept - Capstone Project 2025",
    salvagedBy: "Eco Minds Salvage Squad",
    status: "Available for Student Checkout",
    creditsCost: 0, // Free checkout for research
    specs: "ATmega328P, Type-B USB port intact",
    claimCount: 4
  },
  {
    id: "EW-302",
    name: "Dual 5V Relay Switch Module",
    category: "Actuators & Sensors",
    condition: "Good Condition",
    sourceDept: "IoT Lab Overstock",
    salvagedBy: "Draupadi",
    status: "Available for Student Checkout",
    creditsCost: 0,
    specs: "Optocoupler isolated, 10A 250VAC",
    claimCount: 2
  },
  {
    id: "EW-303",
    name: "Lithium-Ion 18650 Cells (Recovered)",
    category: "Batteries / Hazardous",
    condition: "Disposal Ready / Certified Recycler",
    sourceDept: "EV Club Workshop",
    salvagedBy: "Campus Safety Officer",
    status: "Locked for Authorized E-Recycler",
    creditsCost: 0,
    specs: "3.7V nominal, safe non-punctured casing",
    claimCount: 0
  },
  {
    id: "EW-304",
    name: "ESP32 Wi-Fi & BLE Dual Core MCU",
    category: "Development Boards",
    condition: "Refurbished Pins",
    sourceDept: "CSE Final Year Project",
    salvagedBy: "Lakshmi",
    status: "Available for Student Checkout",
    creditsCost: 0,
    specs: "NodeMCU form factor, onboard antenna",
    claimCount: 7
  },
  {
    id: "EW-305",
    name: "VGA to HDMI High-Speed Adapters (Set of 3)",
    category: "Peripherals & Cables",
    condition: "Functional",
    sourceDept: "Seminar Hall AV Upgrade",
    salvagedBy: "Vyasa",
    status: "Available for Student Checkout",
    creditsCost: 0,
    specs: "Includes 3.5mm audio bypass line",
    claimCount: 1
  }
];

export const PASS_THE_TORCH_ITEMS = [
  {
    id: "PT-101",
    title: "Mini Drafter & Engineering Drawing Board",
    branch: "1st Year / Mech / Civil",
    donor: "Krishna (4th Year ECE)",
    condition: "Like New with padded carrying bag",
    status: "Available",
    category: "Stationery / Tools"
  },
  {
    id: "PT-102",
    title: "Casio fx-991EX ClassWiz Calculator",
    branch: "All Engineering Branches",
    donor: "Radha (Alumni 2025)",
    condition: "Minor scratches, new battery installed",
    status: "Available",
    category: "Electronics"
  },
  {
    id: "PT-103",
    title: "Chemistry Lab Coat (Cotton, Size 40)",
    branch: "1st Year Engineering",
    donor: "Parvati",
    condition: "Washed & Sanitized",
    status: "Available",
    category: "Apparel"
  },
  {
    id: "PT-104",
    title: "Core Java & Spring Boot Reference Guide (VTU)",
    branch: "CSE / ISE",
    donor: "Gargi",
    condition: "Clean pages, indexed tabs",
    status: "Reserved",
    category: "Textbooks"
  }
];

export const CAMPUS_TREES = [
  {
    id: "TREE-01",
    species: "Silver Oak (Grevillea robusta)",
    location: "Main Quadrangle Lawn",
    adoptedBy: "CSE Batch 2026 - Sec A",
    lastWatered: "Today, 08:30 AM",
    health: "Excellent",
    co2AbsorbedPerYear: "22 kg/yr",
    co2Num: 22,
    waterDueInHours: 18,
    imgTag: "🌳",
    lngLat: [77.5181, 12.9022]
  },
  {
    id: "TREE-02",
    species: "Neem (Azadirachta indica)",
    location: "ECE Department Herbal Grove",
    adoptedBy: "Draupadi & Team Eco Minds",
    lastWatered: "Yesterday, 05:00 PM",
    health: "Flourishing",
    co2AbsorbedPerYear: "34 kg/yr",
    co2Num: 34,
    waterDueInHours: 6,
    imgTag: "🌿",
    lngLat: [77.5190, 12.9017]
  },
  {
    id: "TREE-03",
    species: "Gulmohar (Delonix regia)",
    location: "Cafeteria Outdoor Seating",
    adoptedBy: "Open for Adoption",
    lastWatered: "3 days ago",
    health: "Needs Attention",
    co2AbsorbedPerYear: "28 kg/yr",
    co2Num: 28,
    waterDueInHours: 0,
    imgTag: "🌺",
    lngLat: [77.5186, 12.9013]
  },
  {
    id: "TREE-04",
    species: "Indian Mahua (Madhuca longifolia)",
    location: "Library Serenity Walkway",
    adoptedBy: "Faculty Club RNSIT",
    lastWatered: "Today, 09:15 AM",
    health: "Excellent",
    co2AbsorbedPerYear: "41 kg/yr",
    co2Num: 41,
    waterDueInHours: 22,
    imgTag: "🌱",
    lngLat: [77.5184, 12.9026]
  },
  {
    id: "TREE-05", species: "Neem (Azadirachta indica)", location: "North Gate Road, west verge", adoptedBy: "Campus Grounds",
    lastWatered: "Today, 07:45 AM", health: "Flourishing", co2AbsorbedPerYear: "34 kg/yr", co2Num: 34, waterDueInHours: 20,
    imgTag: "🌿", lngLat: [77.5171, 12.9029]
  },
  {
    id: "TREE-06", species: "Indian Laburnum (Cassia fistula)", location: "North Gate Road, east verge", adoptedBy: "Campus Grounds",
    lastWatered: "Today, 07:50 AM", health: "Excellent", co2AbsorbedPerYear: "24 kg/yr", co2Num: 24, waterDueInHours: 18,
    imgTag: "🌼", lngLat: [77.5178, 12.9031]
  },
  {
    id: "TREE-07", species: "Champak (Magnolia champaca)", location: "Library Approach Road", adoptedBy: "Campus Grounds",
    lastWatered: "Yesterday, 05:10 PM", health: "Flourishing", co2AbsorbedPerYear: "30 kg/yr", co2Num: 30, waterDueInHours: 14,
    imgTag: "🌳", lngLat: [77.5188, 12.9028]
  },
  {
    id: "TREE-08", species: "Rain Tree (Samanea saman)", location: "East Academic Road", adoptedBy: "Campus Grounds",
    lastWatered: "Today, 08:05 AM", health: "Excellent", co2AbsorbedPerYear: "38 kg/yr", co2Num: 38, waterDueInHours: 21,
    imgTag: "🌳", lngLat: [77.5195, 12.9022]
  },
  {
    id: "TREE-09", species: "Copper Pod (Peltophorum pterocarpum)", location: "Engineering Block Road", adoptedBy: "Campus Grounds",
    lastWatered: "Yesterday, 06:00 PM", health: "Flourishing", co2AbsorbedPerYear: "29 kg/yr", co2Num: 29, waterDueInHours: 15,
    imgTag: "🌳", lngLat: [77.5194, 12.9015]
  },
  {
    id: "TREE-10", species: "Gulmohar (Delonix regia)", location: "Cafeteria Loop Road", adoptedBy: "Campus Grounds",
    lastWatered: "Today, 08:15 AM", health: "Excellent", co2AbsorbedPerYear: "28 kg/yr", co2Num: 28, waterDueInHours: 19,
    imgTag: "🌺", lngLat: [77.5187, 12.9010]
  },
  {
    id: "TREE-11", species: "Neem (Azadirachta indica)", location: "Hostel South Loop", adoptedBy: "Campus Grounds",
    lastWatered: "Today, 07:30 AM", health: "Flourishing", co2AbsorbedPerYear: "34 kg/yr", co2Num: 34, waterDueInHours: 22,
    imgTag: "🌿", lngLat: [77.5179, 12.9007]
  },
  {
    id: "TREE-12", species: "Indian Beech (Pongamia pinnata)", location: "West Perimeter Road", adoptedBy: "Campus Grounds",
    lastWatered: "Yesterday, 05:45 PM", health: "Excellent", co2AbsorbedPerYear: "31 kg/yr", co2Num: 31, waterDueInHours: 16,
    imgTag: "🌳", lngLat: [77.5170, 12.9017]
  },
  {
    id: "TREE-13", species: "Jamun (Syzygium cumini)", location: "South Walkway Roadside", adoptedBy: "Campus Grounds",
    lastWatered: "Today, 07:55 AM", health: "Flourishing", co2AbsorbedPerYear: "32 kg/yr", co2Num: 32, waterDueInHours: 20,
    imgTag: "🌳", lngLat: [77.5181, 12.9004]
  }
];

export const SURPLUS_FOOD_BROADCASTS = [
  {
    id: "SF-01",
    event: "National Conference on AI Luncheon Surplus",
    location: "Auditorium Dining Hall",
    items: "35 portions of Steamed Rice, Dal Makhani, Fresh Chapati & Mix Veg",
    portions: 35,
    reservedPortions: 22,
    pointsCost: 10,
    bestBefore: "Within 45 minutes (Safe warm storage)",
    postedAt: "15 mins ago",
    target: "Campus Support Staff, Security & Students in Project Labs",
    claimedPct: 65,
    status: "ACTIVE"
  },
  {
    id: "SF-02",
    event: "Hostel Cauvery Evening Mess",
    location: "Hostel Dining Block",
    items: "20 portions of Veg Pulao & Raita",
    portions: 20,
    reservedPortions: 20,
    pointsCost: 10,
    bestBefore: "By 10:00 PM",
    postedAt: "1 hour ago",
    target: "Late Study Groups / Local Night Shelter Volunteer Pick-up",
    claimedPct: 100,
    status: "COMPLETED"
  }
];

export const DEPARTMENT_LEADERBOARD = [
  { rank: 1, dept: "Computer Science & Engineering", ecoCredits: 14250, wasteDivertedKg: 380, eWasteKg: 95 },
  { rank: 2, dept: "Electronics & Communication", ecoCredits: 12890, wasteDivertedKg: 310, eWasteKg: 140 },
  { rank: 3, dept: "Information Science & Engg", ecoCredits: 11400, wasteDivertedKg: 275, eWasteKg: 60 },
  { rank: 4, dept: "Mechanical Engineering", ecoCredits: 9850, wasteDivertedKg: 420, eWasteKg: 45 },
  { rank: 5, dept: "Civil Engineering", ecoCredits: 8900, wasteDivertedKg: 290, eWasteKg: 20 },
  { rank: 6, dept: "Basic Sciences & Humanities", ecoCredits: 7600, wasteDivertedKg: 210, eWasteKg: 15 }
];

// Reward store. `kind` marks rewards that change something in the app instead of
// issuing a counter voucher; `where` tells the student where to claim it.
export const REWARD_CATEGORIES = ['Everyday perks', 'Academic perks', 'Recognition', 'Bigger rewards', 'Plant perks', 'Merchandise'];

export const REWARDS_CATALOG = [
  // ── Everyday campus perks
  { id: "R-8", title: "Free tea or coffee", cost: 120, category: "Everyday perks", icon: "☕", desc: "One hot drink at the central canteen.", where: "Canteen counter" },
  { id: "R-6", title: "20 free print pages", cost: 160, category: "Everyday perks", icon: "🖨️", desc: "Black & white printing in the library or any department lab.", where: "Library / lab print desk" },
  { id: "R-7", title: "50 photocopies of notes", cost: 180, category: "Everyday perks", icon: "🗒️", desc: "At the campus Xerox shop.", where: "Campus Xerox shop" },
  { id: "R-9", title: "Skip-the-queue canteen pass", cost: 250, category: "Everyday perks", icon: "⏩", desc: "Use the express counter for 7 days.", where: "Canteen express counter" },
  { id: "R-1", title: "Canteen meal ₹50 voucher", cost: 500, category: "Everyday perks", icon: "🍱", desc: "Any meal or snack up to ₹50.", where: "Canteen counter" },
  { id: "R-4", title: "High-speed Wi-Fi boost (30 days)", cost: 1000, category: "Everyday perks", icon: "⚡", desc: "Higher bandwidth on campus Wi-Fi for a month.", where: "Activated on your campus login" },

  // ── Academic perks
  { id: "R-12", title: "Library loan extension (+7 days)", cost: 250, category: "Academic perks", icon: "📖", desc: "Keep one borrowed book a week longer.", where: "Central library desk" },
  { id: "R-2", title: "Library overdue fine waiver (1 book)", cost: 350, category: "Academic perks", icon: "📚", desc: "Clears the fine on one late book.", where: "Central library desk" },
  { id: "R-21", title: "Pass-The-Torch early access (2 days)", cost: 300, category: "Academic perks", icon: "🎒", desc: "See newly donated senior gear 2 days before everyone else.", where: "Pass-The-Torch page" },
  { id: "R-11", title: "Priority lab or seminar-room booking", cost: 400, category: "Academic perks", icon: "🔬", desc: "First pick of lab slots or a seminar room for one week.", where: "Department office" },
  { id: "R-10", title: "Assignment deadline extension (2 days)", cost: 700, category: "Academic perks", icon: "📝", desc: "One assignment, subject to your faculty member's approval.", where: "Show code to your faculty" },

  // ── Recognition
  { id: "R-13", title: "Green Guardian digital badge", cost: 500, category: "Recognition", icon: "🏅", desc: "A badge shown next to your name on your profile.", where: "Added to your profile" },
  { id: "R-14", title: "Guardian of the Month nomination", cost: 750, category: "Recognition", icon: "📌", desc: "Your nomination goes to staff; the month's pick goes up on the notice board.", where: "Reviewed by staff" },
  { id: "R-3", title: "Eco-Ambassador certificate (signed by Principal)", cost: 1000, category: "Recognition", icon: "🎖️", desc: "Official certificate for your file.", where: "Principal's office" },
  { id: "R-15", title: "Green-volunteering letter for résumé", cost: 1200, category: "Recognition", icon: "📄", desc: "Signed letter of your hours and impact; may count toward VTU activity points.", where: "Department office" },

  // ── Bigger rewards
  { id: "R-18", title: "Partner shop discount card (10%, 1 month)", cost: 600, category: "Bigger rewards", icon: "🏷️", desc: "10% off at partner shops near campus.", where: "Partner shops" },
  { id: "R-17", title: "College fest entry at 50% off", cost: 750, category: "Bigger rewards", icon: "🎪", desc: "Half-price entry to one fest event.", where: "Fest registration desk" },
  { id: "R-16", title: "Free seat at a paid workshop or hackathon", cost: 1500, category: "Bigger rewards", icon: "🎟️", desc: "Covers the registration fee for one campus workshop or hackathon.", where: "Event coordinator" },

  // ── Plant perks (applied in the app)
  { id: "R-19", title: "Streak shield", cost: 250, category: "Plant perks", icon: "🛡️", kind: "STREAK_SHIELD", desc: "Your next missed watering won't reset your streak (the −15 still applies). One per month.", where: "Applied to your adopted plant" },
  { id: "R-20", title: "Name your campus plant", cost: 1000, category: "Plant perks", icon: "🪧", kind: "NAMING_RIGHTS", desc: "Give the plant you've cared for all semester (90+ days) a name everyone sees.", where: "Shown on the plant everywhere" },

  // ── Merchandise
  { id: "R-5", title: "RNSIT bamboo reusable coffee tumbler", cost: 800, category: "Merchandise", icon: "🌱", desc: "Reusable bamboo-fibre tumbler.", where: "Student welfare office" },
];

export const STUDENT_LIFETIME_LEADERBOARD = [
  {
    rank: 1,
    name: "Subhadra",
    usn: "1RN22CS078",
    branch: "CSE",
    year: "3rd Year",
    lifetimePoints: 4850,
    tasksCompleted: 42,
    badge: "Champion Green Guardian",
    level: 5,
    avatar: "👩‍🎓",
    carbonSavedKg: 184
  },
  {
    rank: 2,
    name: "Draupadi",
    usn: "1RN22CS045",
    branch: "CSE",
    year: "3rd Year",
    lifetimePoints: 4420,
    tasksCompleted: 38,
    badge: "Zero-Waste Master",
    level: 4,
    avatar: "👩‍💻",
    carbonSavedKg: 162
  },
  {
    rank: 3,
    name: "Lakshmi",
    usn: "1RN22EC032",
    branch: "ECE",
    year: "3rd Year",
    lifetimePoints: 3910,
    tasksCompleted: 31,
    badge: "Hardware Salvage Hero",
    level: 4,
    avatar: "👩‍🔧",
    carbonSavedKg: 139
  },
  {
    rank: 4,
    name: "Arjuna",
    usn: "1RN23IS005",
    branch: "ISE",
    year: "2nd Year",
    lifetimePoints: 3450,
    tasksCompleted: 27,
    badge: "Smart Sentinel",
    level: 3,
    avatar: "👨‍🎓",
    carbonSavedKg: 118
  },
  {
    rank: 5,
    name: "Rohan Kulkarni",
    usn: "1RN22ME044",
    branch: "ME",
    year: "3rd Year",
    lifetimePoints: 2980,
    tasksCompleted: 24,
    badge: "Compost & Flora Warden",
    level: 3,
    avatar: "👨‍🌾",
    carbonSavedKg: 95
  },
  {
    rank: 6,
    name: "Sneha Rao",
    usn: "1RN23AI018",
    branch: "AIML",
    year: "2nd Year",
    lifetimePoints: 2640,
    tasksCompleted: 19,
    badge: "Energy Scout",
    level: 3,
    avatar: "👩‍🔬",
    carbonSavedKg: 82
  },
  {
    rank: 7,
    name: "Skanda",
    usn: "1RN24CS056",
    branch: "CSE",
    year: "1st Year",
    lifetimePoints: 2150,
    tasksCompleted: 15,
    badge: "Peer Torch Bearer",
    level: 2,
    avatar: "👨‍💻",
    carbonSavedKg: 64
  },
  {
    rank: 8,
    name: "Sahadeva",
    usn: "1RN24CS011",
    branch: "CSE",
    year: "1st Year",
    lifetimePoints: 1820,
    tasksCompleted: 12,
    badge: "Green Seedling",
    level: 2,
    avatar: "👩‍🎒",
    carbonSavedKg: 49
  }
];

export const STAFF_LIFETIME_LEADERBOARD = [
  {
    rank: 1,
    name: "Vyasa",
    designation: "NAAC Audit In-Charge & Ecominds Admin",
    department: "CSE",
    lifetimePoints: 7600,
    auditsApproved: 84,
    energySavedKwh: 1240,
    badge: "Sustainability Dean",
    avatar: "👩‍🏫"
  },
  {
    rank: 2,
    name: "Gargi",
    designation: "ECE Lab Head & E-Waste Coordinator",
    department: "ECE",
    lifetimePoints: 6850,
    auditsApproved: 62,
    energySavedKwh: 980,
    badge: "Circular Tech Lead",
    avatar: "👩‍🔬"
  },
  {
    rank: 3,
    name: "Prof. Parvati",
    designation: "Faculty Sponsor & Environmental Council",
    department: "Basic Sciences",
    lifetimePoints: 5920,
    auditsApproved: 51,
    energySavedKwh: 760,
    badge: "Flora & Green Auditor",
    avatar: "🌱"
  },
  {
    rank: 4,
    name: "Hanuman",
    designation: "Ground Ops Specialist (Zone 2)",
    department: "Estate & Operations",
    lifetimePoints: 5410,
    auditsApproved: 118,
    energySavedKwh: 620,
    badge: "Master Custodian",
    avatar: "👷"
  },
  {
    rank: 5,
    name: "Suresh Gowda",
    designation: "Electrical Maintenance Head",
    department: "Campus Facilities",
    lifetimePoints: 4890,
    auditsApproved: 44,
    energySavedKwh: 1450,
    badge: "Phantom Cutoff Champion",
    avatar: "⚡"
  }
];
