// Autonomous Action & Resolution Mesh (AARM) Service
// Closed-loop automated issue detection, autonomous personnel/actuator assignment,
// and inter-dependent cross-module execution for Guardian Campus OS (RNSIT 2026)

export const INITIAL_ACTION_TICKETS = [
  {
    id: "ACT-101",
    title: "CSE Dept Bin B-102 Ultrasonic Critical Surge (91%)",
    category: "IOT_SURGE",
    severity: "CRITICAL",
    location: "CSE Block, 2nd Floor (12.9020° N, 77.5175° E)",
    detectedBy: "Ultrasonic HC-SR04 IoT Node #102",
    detectedAt: "12 mins ago",
    status: "DISPATCHED",
    assignedTo: {
      name: "Ramesh K.",
      role: "Ground Ops Specialist (Zone 2)",
      id: "RNS-GS-04",
      type: "STAFF"
    },
    automatedResolution: "Ant Colony Optimization (ACO) recomputed collection path to Priority #1. Diverting student dry-waste to Admin Bin B-101.",
    impactMetric: "Avoids 18.5 kg overflow & corridor littering",
    interDependentLinks: [
      { label: "Ground Route Map", path: "/cleaner-ops", badge: "ACO Route #1" },
      { label: "IoT Telemetry", path: "/admin", badge: "Bin B-102" },
      { label: "Student Verification Bounty", path: "/bounties", badge: "+40 PTS" }
    ],
    targetEntityId: "B-102"
  },
  {
    id: "ACT-102",
    title: "Gulmohar Tree Hydration Depleted (Soil Moisture Critical)",
    category: "FLORA_HEALTH",
    severity: "HIGH",
    location: "Cafeteria Outdoor Lawn (12.9013° N, 77.5186° E)",
    detectedBy: "Capacitive Soil Moisture Probe #T-03",
    detectedAt: "35 mins ago",
    status: "DISPATCHED",
    assignedTo: {
      name: "Student Eco-Volunteer Squad",
      role: "Arbor Guardian Cell",
      id: "ECO-SQ-09",
      type: "STUDENT"
    },
    automatedResolution: "Auto-spawned urgent campus micro-bounty. Scheduled 15 Liters recycled greywater dispatch.",
    impactMetric: "Preserves 28 kg CO2/yr annual carbon absorption",
    interDependentLinks: [
      { label: "Campus Flora Map", path: "/trees", badge: "Gulmohar T-03" },
      { label: "Claim Hydration Bounty", path: "/bounties", badge: "+35 PTS" },
      { label: "Department Green Cup", path: "/leaderboard", badge: "CO2 Offset" }
    ],
    targetEntityId: "TREE-03"
  },
  {
    id: "ACT-103",
    title: "Canteen Lunch Surplus: 45 Meals Flagged for Auto-Diversion",
    category: "CANTEEN_SURPLUS",
    severity: "MEDIUM",
    location: "Student Food Court (12.9015° N, 77.5188° E)",
    detectedBy: "Kitchen Weigh-Scale Telemetry & Prep Forecaster",
    detectedAt: "45 mins ago",
    status: "IN_PROGRESS",
    assignedTo: {
      name: "Cauvery Hostel Mess + Biogas Compactor B-107",
      role: "Automated Food Diverter & Anaerobic Digester",
      id: "ACTUATOR-B107",
      type: "AUTOMATED"
    },
    automatedResolution: "Broadcasted flash 15-min notification to hostelers. Unclaimed portions routed to Biogas Digester (B-107) for organic tree compost.",
    impactMetric: "Prevents 32.4 kg methane emissions",
    interDependentLinks: [
      { label: "Flash Meal Claims", path: "/mess", badge: "45 Portions" },
      { label: "Biogas Compactor", path: "/bins", badge: "Bin B-107" },
      { label: "Accreditation Audit", path: "/audit", badge: "NAAC 7.1.3" }
    ],
    targetEntityId: "B-107"
  }
];

class ActionMeshStore {
  constructor() {
    this.tickets = [...INITIAL_ACTION_TICKETS];
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l(this.tickets));
  }

  getTickets() {
    return this.tickets;
  }

  createTicket(ticketData) {
    const newTicket = {
      id: `ACT-${Math.floor(104 + Math.random() * 890)}`,
      status: "DISPATCHED",
      detectedAt: "Just now",
      severity: "HIGH",
      interDependentLinks: [],
      ...ticketData
    };
    this.tickets = [newTicket, ...this.tickets];
    this.notify();
    return newTicket;
  }

  resolveTicket(ticketId, resolutionNote = "Autonomous execution completed successfully.") {
    this.tickets = this.tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: "RESOLVED",
          resolvedAt: "Just now",
          resolutionNote
        };
      }
      return t;
    });
    this.notify();
  }

  reassignTicket(ticketId, newAssignee) {
    this.tickets = this.tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          assignedTo: newAssignee,
          status: "IN_PROGRESS"
        };
      }
      return t;
    });
    this.notify();
  }
}

export const actionMesh = new ActionMeshStore();
