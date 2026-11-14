import React, { useState } from 'react';
import { RNSIT_CATEGORIES, RNSIT_40_IDEAS, CAMPUS_QR_COLLECTION_POINTS } from '../data/rnsitIdeasData';
import { Link, useRouter } from '../router/Router';
import { IconCpu, IconZap, IconMapPin, IconCheckCircle, IconAlertTriangle, IconDownload } from '../components/Icons';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { actionMesh } from '../services/actionMeshService';

export const RnsitIdeasPage = ({ userCredits, setUserCredits, onOpenActionMesh }) => {
  const { navigate } = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog', 'mvp_loop', 'qr_points', 'room_checklist', 'energy_water'

  // Golden MVP Flow State
  const [mvpStep, setMvpStep] = useState(1);
  const [mvpItem, setMvpItem] = useState({
    title: 'Faulty Arduino Mega 2560 & Ultrasonic Kit',
    category: 'Development Boards',
    location: 'ECE Lab Drop-Off Station #1',
    studentId: '1RN22EC045 (Draupadi)',
    condition: 'Non-responsive USB chip, clean PCB',
  });
  const [triageAnswers, setTriageAnswers] = useState({
    visualInspection: true,
    powerTest: false,
    repairCost: '120',
    finalDisposition: 'REUSE' // 'REUSE', 'SALVAGE', 'RECYCLE'
  });
  const [pickupTicket, setPickupTicket] = useState(null);
  const [handoverRecord, setHandoverRecord] = useState(null);

  // Room Condition Checklist State
  const [roomChecks, setRoomChecks] = useState({
    roomNumber: 'LH-302 (CSE Block 3rd Floor)',
    lightsOff: true,
    acTurnedOff: false, // Flagged!
    tapsNoLeaks: true,
    binsSegregated: true,
    cleanlinessRating: 'GOOD',
    reporterName: 'Subhadra (Lab Coordinator)'
  });
  const [roomReportSubmitted, setRoomReportSubmitted] = useState(false);

  // Commute Estimator State
  const [commuteMode, setCommuteMode] = useState('BUS');
  const [commuteDistance, setCommuteDistance] = useState(12);

  // Filter 40 Ideas
  const filteredIdeas = RNSIT_40_IDEAS.filter(idea => {
    const matchesCat = selectedCategory === 'all' || idea.category === selectedCategory;
    const matchesDiff = difficultyFilter === 'ALL' || idea.difficulty.toUpperCase() === difficultyFilter;
    const matchesSearch = searchQuery === '' || 
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.whatItDoes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.techStack.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesDiff && matchesSearch;
  });

  // Step 1 -> 2: Create Request
  const handleCreatePickupRequest = () => {
    const reqId = `REQ-RNSIT-2026-${Math.floor(100 + Math.random() * 900)}`;
    const ticket = {
      reqId,
      item: mvpItem.title,
      student: mvpItem.studentId,
      location: mvpItem.location,
      status: 'ASSIGNED_TO_COORDINATOR',
      coordinator: 'Gargi (ECE Lab Head)',
      technician: 'Hanuman (Hardware Specialist)',
      timestamp: new Date().toLocaleTimeString(),
    };
    setPickupTicket(ticket);
    setMvpStep(3);

    // Synchronize to Action Mesh
    actionMesh.createTicket({
      title: `E-Waste Pickup: ${mvpItem.title}`,
      category: 'EWASTE_SALVAGE',
      severity: 'HIGH',
      location: `${mvpItem.location} (RNSIT RR Nagar)`,
      detectedBy: 'Student QR Collection Point Portal',
      assignedTo: {
        name: 'Gargi & Hanuman',
        role: 'Hardware Salvage Coordinator',
        id: 'RNS-COORD-01',
        type: 'STAFF'
      },
      automatedResolution: `Pickup ticket ${reqId} generated. Scheduled for inspection triage at ECE Lab bench 4.`,
      impactMetric: 'Prevents toxic circuit board disposal and recovers active components',
      targetEntityId: reqId,
      interDependentLinks: [
        { label: 'E-Waste Hub', path: '/ewaste', badge: 'Locker' },
        { label: 'Pass-The-Torch', path: '/exchange', badge: 'Reuse' },
        { label: 'Audit Manifest', path: '/audit', badge: 'NAAC' }
      ]
    });
  };

  // Step 4 -> 5: Submit Triage & Record Handover
  const handleSubmitTriageAndHandover = () => {
    const manifestId = `KSPCB-MNF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const record = {
      manifestId,
      reqId: pickupTicket.reqId,
      item: mvpItem.title,
      disposition: triageAnswers.finalDisposition,
      repairCost: triageAnswers.repairCost,
      destination: triageAnswers.finalDisposition === 'RECYCLE' 
        ? 'E-Waste Recycler India Pvt. Ltd. (KSPCB Reg: 2022-KA-EWASTE-8472)'
        : triageAnswers.finalDisposition === 'REUSE'
        ? 'Pass-The-Torch Campus Marketplace (Free for Junior Students)'
        : 'Robotics & Embedded Systems Research Lab Inventory',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      timestamp: new Date().toLocaleString(),
      verifiedBy: 'Vyasa (Audit In-Charge)'
    };
    setHandoverRecord(record);
    setMvpStep(5);
    setUserCredits(prev => prev + 40);
    triggerEcoCelebration({
      title: '🔬 E-Waste Handover Verified!',
      message: `KSPCB Manifest ${manifestId} generated. ${triageAnswers.finalDisposition} pathway locked — zero toxic landfill!`,
      points: 40,
      badge: '+40 EcoCredits',
      variant: 'SUPER_STAR'
    });
  };

  // Submit Room Checklist
  const handleSubmitRoomChecklist = (e) => {
    e.preventDefault();
    setRoomReportSubmitted(true);
    triggerEcoCelebration({
      title: '🏫 Room Audit Filed!',
      message: `Room ${roomChecks.roomNumber} energy audit complete. ${!roomChecks.acTurnedOff ? 'AC alert dispatched to facilities!' : 'All clear — zero waste detected!'}`,
      points: 20,
      badge: '+20 EcoCredits'
    });

    // If AC or lights left on, auto-create ticket
    if (!roomChecks.acTurnedOff) {
      actionMesh.createTicket({
        title: `Energy Waste Alert: AC Left Running in ${roomChecks.roomNumber}`,
        category: 'FACILITIES_OVERDUE',
        severity: 'MEDIUM',
        location: `${roomChecks.roomNumber} (RNSIT RR Nagar)`,
        detectedBy: `Room Checklist by ${roomChecks.reporterName}`,
        assignedTo: {
          name: 'Bhima',
          role: 'Building Facilities Supervisor',
          id: 'RNS-FAC-03',
          type: 'STAFF'
        },
        automatedResolution: 'Smart circuit breaker notification sent. Facilities crew dispatched to shut down AC.',
        impactMetric: 'Avoids 4.8 kWh of unnecessary after-hours electricity consumption (~3.9 kg CO2)',
        targetEntityId: 'ROOM-LH-302',
        interDependentLinks: [
          { label: 'Ground Ops', path: '/cleaner-ops', badge: 'Dispatch' },
          { label: 'Energy Dashboard', path: '/admin', badge: 'Meter #4' }
        ]
      });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">RNSIT Smart Green Campus Blueprint</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <span>🏆</span> RNSIT Smart Green Campus Matrix
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Software-First Ideas & Simple-Hardware Shortlist — <strong>40 Practical Ideas</strong> grouped across <strong>10 Categories</strong>, linked to the closest working demo or prototype flow.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            40 Ideas · Demo Paths
          </span>
          <span className="text-xs font-mono bg-blue-500/10 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-xl font-bold">
            Team ECO MINDS
          </span>
        </div>
      </div>

      {/* RNSIT Core Pattern Alert Banner */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-emerald-500/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
            <IconCheckCircle className="w-4 h-4 text-emerald-400" />
            Official RNSIT Hackathon Project Pattern
          </span>
          <span className="text-[11px] bg-emerald-400/10 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/20 font-semibold">
            Selection Rule Compliant: Software-First + Zero Heavy Hardware Dependency
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center pt-2">
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-emerald-400 font-bold block">Step 1: Detect / Report</span>
            <span className="text-[10px] text-slate-400">YOLO26, QR scan, or student form</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-blue-400 font-bold block">Step 2: Create Task</span>
            <span className="text-[10px] text-slate-400">Tracked pickup ticket with token</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-amber-400 font-bold block">Step 3: Assign Owner</span>
            <span className="text-[10px] text-slate-400">Staff, student squad, or actuator</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-purple-400 font-bold block">Step 4: Record Fix</span>
            <span className="text-[10px] text-slate-400">Triage checklist & KSPCB manifest</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-pink-400 font-bold block">Step 5: Update Impact</span>
            <span className="text-[10px] text-slate-400">Real-time NAAC & audit dashboard</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('mvp_loop')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'mvp_loop'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>🎯</span>
          <span>Recommended Core MVP (Page 10 Loop)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/40 text-emerald-200">Interactive</span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'catalog'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>📋</span>
          <span>40 Ideas Catalog</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/40 text-slate-300">40 Live</span>
        </button>

        <button
          onClick={() => setActiveTab('qr_points')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'qr_points'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>📱</span>
          <span>QR Collection Points (Idea 2)</span>
        </button>

        <button
          onClick={() => setActiveTab('room_checklist')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'room_checklist'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>🧹</span>
          <span>Room Checklist (Idea 35)</span>
        </button>

        <button
          onClick={() => setActiveTab('energy_water')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'energy_water'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>⚡</span>
          <span>Energy & Water Sentinel</span>
        </button>
      </div>

      {/* TAB 1: RECOMMENDED CORE MVP 5-STEP GOLDEN LOOP (PAGE 10) */}
      {activeTab === 'mvp_loop' && (
        <div className="bg-slate-900/90 rounded-2xl border border-emerald-500/30 p-6 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                Official Hackathon Evaluation Target
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">
                RNSIT Core MVP: The Complete E-Waste Closed Loop
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                "For the strongest software-first demonstration, show a complete loop: a student identifies or reports an e-waste item, the system creates a pickup request, a coordinator assigns it, the team records inspection and final disposition, and the dashboard updates from that verified record." (Guide Page 10)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl font-bold border border-emerald-500/20">
                Step {mvpStep} of 5
              </span>
            </div>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { num: 1, label: '1. Identify / QR' },
              { num: 2, label: '2. Pickup Request' },
              { num: 3, label: '3. Assign Staff' },
              { num: 4, label: '4. Triage Checklist' },
              { num: 5, label: '5. Handover Manifest' }
            ].map(s => (
              <div 
                key={s.num} 
                onClick={() => setMvpStep(s.num)}
                className={`cursor-pointer p-2.5 rounded-xl border text-center transition ${
                  mvpStep === s.num 
                    ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold' 
                    : mvpStep > s.num 
                    ? 'bg-slate-950 border-emerald-500/40 text-emerald-400' 
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[10px]">{s.num <= mvpStep && s.num < 5 ? '✓' : `0${s.num}`}</div>
                <div className="text-xs font-semibold truncate mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Step 1: Student Identification */}
          {mvpStep === 1 && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>1️⃣</span> Student Identifies E-Waste Item (Idea 1 & 2)
              </h3>
              <p className="text-xs text-slate-400">
                A student identifies obsolete electronics from their engineering project or department lab and scans the QR code at an approved campus collection point.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Item Title & Model</label>
                  <input
                    type="text"
                    value={mvpItem.title}
                    onChange={(e) => setMvpItem({ ...mvpItem, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Campus Drop-Off Location</label>
                  <select
                    value={mvpItem.location}
                    onChange={(e) => setMvpItem({ ...mvpItem, location: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option>ECE Lab Drop-Off Station #1</option>
                    <option>CSE Quadrangle Drop-Off Station #2</option>
                    <option>Mech Workshop Scrap Yard #3</option>
                    <option>Library Quiet Study Locker #4</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Student Contributor</label>
                  <input
                    type="text"
                    value={mvpItem.studentId}
                    onChange={(e) => setMvpItem({ ...mvpItem, studentId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Physical Condition Notes</label>
                  <input
                    type="text"
                    value={mvpItem.condition}
                    onChange={(e) => setMvpItem({ ...mvpItem, condition: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setMvpStep(2)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
                >
                  <span>Proceed to Request Creation</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Pickup Request Created */}
          {mvpStep === 2 && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>2️⃣</span> System Generates Tracked Pickup Request (Idea 3)
              </h3>
              <p className="text-xs text-slate-400">
                The software creates a unique tracking ID, registers timestamps, attaches student/department roles, and puts the request into the campus operations queue.
              </p>

              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Request Token:</span>
                  <span className="text-emerald-400 font-bold">REQ-RNSIT-2026-904</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hardware Item:</span>
                  <span className="text-white">{mvpItem.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contributor:</span>
                  <span className="text-white">{mvpItem.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-cyan-400">{mvpItem.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Initial Status:</span>
                  <span className="text-amber-400 font-bold">PENDING_COORDINATOR_REVIEW</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setMvpStep(1)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ← Back to Step 1
                </button>
                <button
                  onClick={handleCreatePickupRequest}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  <span>Auto-Assign Coordinator & Proceed</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Coordinator Assignment */}
          {mvpStep === 3 && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>3️⃣</span> Coordinator Assignment & Dispatch (Pattern Rule)
              </h3>
              <p className="text-xs text-slate-400">
                The system assigns the request to an authorized faculty coordinator and technical staff member to conduct the physical collection and inspection.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">Assigned Faculty Coordinator</span>
                  <div className="text-sm font-extrabold text-white mt-1">Gargi</div>
                  <div className="text-xs text-slate-400">Associate Professor, Department of ECE</div>
                  <div className="text-[10px] text-slate-500 mt-2">Role: Inspection Approval Authority</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-blue-500/30">
                  <span className="text-[10px] text-blue-400 font-bold uppercase block">Field Hardware Technician</span>
                  <div className="text-sm font-extrabold text-white mt-1">Hanuman</div>
                  <div className="text-xs text-slate-400">Senior Technical Staff (Electronics Yard)</div>
                  <div className="text-[10px] text-slate-500 mt-2">Role: Benchtop Diagnostics & Triage</div>
                </div>
              </div>

              {/* Hermes Autonomous Agent Banner */}
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🤖</span>
                  <div>
                    <div className="text-xs font-bold text-purple-200">Hermes Autonomous Dispatch Mesh</div>
                    <div className="text-[10px] text-slate-400">Hermes Agent v0.22.1 (Groq Qwen-27B) autonomously routed this ticket into the live campus response queue.</div>
                  </div>
                </div>
                {onOpenActionMesh && (
                  <button
                    onClick={onOpenActionMesh}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg transition whitespace-nowrap shadow-md shadow-purple-600/30"
                  >
                    View in Mesh ⚡
                  </button>
                )}
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setMvpStep(2)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setMvpStep(4)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  <span>Begin "Repair-Before-Recycle" Triage Checklist</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Repair-Before-Recycle Triage (Idea 10) */}
          {mvpStep === 4 && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>4️⃣</span> Repair-Before-Recycle Triage Checklist (Idea 10)
                </h3>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded">
                  Human Decision Guided by AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                "Route equipment to inspection before deciding repair, reuse, parts recovery or recycling. Use a human checklist for function, condition, repair estimate and final disposition; let AI assist but not decide." (Guide Page 4, Idea 10)
              </p>

              <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span>1. Visual PCB & Trace Inspection (Burn marks, corrosion):</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={triageAnswers.visualInspection}
                      onChange={(e) => setTriageAnswers({ ...triageAnswers, visualInspection: e.target.checked })}
                      className="rounded accent-emerald-500"
                    />
                    <span className="font-bold text-emerald-400">PASSED (Clean PCB)</span>
                  </label>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span>2. Benchtop Power & USB Rail Test:</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={triageAnswers.powerTest}
                      onChange={(e) => setTriageAnswers({ ...triageAnswers, powerTest: e.target.checked })}
                      className="rounded accent-emerald-500"
                    />
                    <span className={triageAnswers.powerTest ? "font-bold text-emerald-400" : "font-bold text-amber-400"}>
                      {triageAnswers.powerTest ? "Operational" : "CH340 USB Chip Fault (Replaceable)"}
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span>3. Estimated Repair / Rework Cost:</span>
                  <div className="flex items-center gap-1 font-mono">
                    <span>₹</span>
                    <input
                      type="number"
                      value={triageAnswers.repairCost}
                      onChange={(e) => setTriageAnswers({ ...triageAnswers, repairCost: e.target.value })}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                    />
                    <span className="text-[10px] text-slate-400">(vs ₹1,800 new)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="font-bold text-white block mb-2">4. Final Disposition Decision:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTriageAnswers({ ...triageAnswers, finalDisposition: 'REUSE' })}
                      className={`p-3 rounded-xl border text-left transition ${
                        triageAnswers.finalDisposition === 'REUSE'
                          ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-emerald-400 font-extrabold text-xs">① Repair & Re-use</div>
                      <div className="text-[10px] text-slate-400 mt-1">Refurbish for junior student kit on /exchange</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTriageAnswers({ ...triageAnswers, finalDisposition: 'SALVAGE' })}
                      className={`p-3 rounded-xl border text-left transition ${
                        triageAnswers.finalDisposition === 'SALVAGE'
                          ? 'bg-blue-500/20 border-blue-400 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-blue-400 font-extrabold text-xs">② Parts Recovery</div>
                      <div className="text-[10px] text-slate-400 mt-1">Harvest crystal, headers & capacitors for lab</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTriageAnswers({ ...triageAnswers, finalDisposition: 'RECYCLE' })}
                      className={`p-3 rounded-xl border text-left transition ${
                        triageAnswers.finalDisposition === 'RECYCLE'
                          ? 'bg-purple-500/20 border-purple-400 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-purple-400 font-extrabold text-xs">③ Authorized Recycler</div>
                      <div className="text-[10px] text-slate-400 mt-1">KSPCB certified metal extraction manifest</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={() => setMvpStep(3)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmitTriageAndHandover}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  <span>Submit Triage & Generate Digital Handover Record</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Digital Handover Record & Impact Update (Idea 4 & 40) */}
          {mvpStep === 5 && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-500/40 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                    Closed-Loop Completion Verified
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-0.5 flex items-center gap-2">
                    <span>🎉</span> Digital Handover Record & Real-time Impact Update (Idea 4 & 40)
                  </h3>
                </div>
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl font-bold">
                  SHA-256 Verified
                </span>
              </div>

              <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Digital Handover Manifest:</span>
                  <span className="text-emerald-400 font-bold">{handoverRecord?.manifestId || 'KSPCB-MNF-2026-8472'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Assigned Outcome:</span>
                  <span className="text-white font-bold">{handoverRecord?.disposition === 'REUSE' ? 'Refurbished for Junior Student Re-Use' : 'Sent to Authorized Recycler'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Destination:</span>
                  <span className="text-cyan-300">{handoverRecord?.destination}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Cryptographic Hash:</span>
                  <span className="text-slate-300 text-[10px] truncate max-w-xs">{handoverRecord?.sha256Hash}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">NAAC Audit Sign-Off:</span>
                  <span className="text-emerald-300 font-bold">{handoverRecord?.verifiedBy}</span>
                </div>
              </div>

              {/* Impact Dashboard Immediate Increments */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-500/30 text-center">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block">E-Waste Diverted</span>
                  <span className="text-xl font-black text-white font-mono mt-0.5">+0.45 kg</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Appended to /audit report</span>
                </div>
                <div className="bg-amber-950/40 p-3.5 rounded-xl border border-amber-500/30 text-center">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">Student Re-Use Savings</span>
                  <span className="text-xl font-black text-amber-300 font-mono mt-0.5">₹1,680</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Listed on /exchange</span>
                </div>
                <div className="bg-blue-950/40 p-3.5 rounded-xl border border-blue-500/30 text-center">
                  <span className="text-[10px] text-blue-400 font-bold uppercase block">EcoCredits Earned</span>
                  <span className="text-xl font-black text-cyan-300 font-mono mt-0.5">+75 PTS</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Awarded to student</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 justify-between items-center">
                <button
                  onClick={() => setMvpStep(1)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ↻ Test Another Loop
                </button>
                <div className="flex items-center gap-2">
                  <Link
                    to="/audit"
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl border border-slate-700 transition"
                  >
                    View in NAAC Audit (/audit)
                  </Link>
                  <Link
                    to="/traceability"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg transition"
                  >
                    View Cryptographic Block (/traceability)
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 40 IDEAS COMPLETE DIRECTORY */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {RNSIT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <div className="w-full sm:w-80">
              <input
                type="text"
                placeholder="Search by keyword, tech stack, or idea #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-[11px] text-slate-400 font-bold">Difficulty:</span>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              >
                <option value="ALL">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
              </select>
            </div>
          </div>

          {/* 40 Ideas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIdeas.map(idea => (
              <div 
                key={idea.id}
                className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition p-5 flex flex-col justify-between space-y-3 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
                        #{idea.id}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {idea.categoryName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        idea.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {idea.difficulty}
                      </span>
                      <span className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                        {idea.hardware}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-extrabold text-white mt-2">
                    {idea.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {idea.whatItDoes}
                  </p>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 mt-3 space-y-1 text-[11px]">
                    <div>
                      <span className="text-slate-500 font-mono">Tech Stack: </span>
                      <span className="text-emerald-300 font-mono">{idea.techStack}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono">Demo Target: </span>
                      <span className="text-slate-300">{idea.demoTarget}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Connected demo path
                  </span>

                  <button
                    onClick={() => {
                      if (idea.ecosphereRoute === '/rnsit-matrix') {
                        setActiveTab('mvp_loop');
                      } else {
                        navigate(idea.ecosphereRoute);
                      }
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow transition flex items-center gap-1"
                  >
                    <span>{idea.actionLabel}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: QR COLLECTION POINTS (IDEA 2) */}
      {activeTab === 'qr_points' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl border border-blue-500/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                  RNSIT Idea #2 • E-Waste Management
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  QR-Coded Collection Points Across Campus
                </h2>
                <p className="text-xs text-slate-400">
                  "Give each location an ID and QR code; show accepted items, instructions, opening details and a reporting form." (Guide Page 3)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CAMPUS_QR_COLLECTION_POINTS.map(cp => (
                <div key={cp.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {cp.id}
                      </span>
                      <span className="text-[10px] text-slate-400">{cp.openingHours}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-2">{cp.name}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <IconMapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{cp.building}</span>
                    </div>

                    <div className="mt-3 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">✓ Accepted Materials:</span>
                        <div className="flex flex-wrap gap-1">
                          {cp.acceptedItems.map((item, idx) => (
                            <span key={idx} className="bg-slate-900 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-800">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-[10px] font-bold text-rose-400 uppercase block mb-1">✕ Prohibited / Hazardous:</span>
                        <div className="flex flex-wrap gap-1">
                          {cp.rejectedItems.map((item, idx) => (
                            <span key={idx} className="bg-rose-950/30 text-rose-300 text-[10px] px-2 py-0.5 rounded border border-rose-900/40">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Station Coordinator</span>
                      <span className="text-white font-bold">{cp.coordinator}</span>
                    </div>
                    <button
                      onClick={() => {
                        setMvpItem({
                          ...mvpItem,
                          location: cp.name
                        });
                        setActiveTab('mvp_loop');
                        setMvpStep(1);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl transition"
                    >
                      Simulate QR Scan →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ROOM CONDITION CHECKLIST (IDEA 35) */}
      {activeTab === 'room_checklist' && (
        <div className="bg-slate-900/90 rounded-2xl border border-purple-500/30 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">
                RNSIT Idea #35 • Campus Facilities & Issue Resolution
              </span>
              <h2 className="text-lg font-black text-white mt-0.5">
                Room-Condition Checklist & Automated Ticket Generation
              </h2>
              <p className="text-xs text-slate-400">
                "Collect simple checks for lights, taps, bins, AC and classroom cleanliness. Give room staff a repeatable checklist; flag failed checks as tickets rather than storing only survey answers." (Guide Page 8, Idea 35)
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitRoomChecklist} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Classroom / Lab Code</label>
                <input
                  type="text"
                  value={roomChecks.roomNumber}
                  onChange={(e) => setRoomChecks({ ...roomChecks, roomNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Inspected By</label>
                <input
                  type="text"
                  value={roomChecks.reporterName}
                  onChange={(e) => setRoomChecks({ ...roomChecks, reporterName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-900">
                <span>1. All Classroom Lights Switched Off After Lecture:</span>
                <input
                  type="checkbox"
                  checked={roomChecks.lightsOff}
                  onChange={(e) => setRoomChecks({ ...roomChecks, lightsOff: e.target.checked })}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-900 border-t border-slate-800">
                <div>
                  <span className="block">2. AC & Projector Turned Off at Closing:</span>
                  <span className="text-[10px] text-amber-400">If unchecked, auto-generates energy waste ticket</span>
                </div>
                <input
                  type="checkbox"
                  checked={roomChecks.acTurnedOff}
                  onChange={(e) => setRoomChecks({ ...roomChecks, acTurnedOff: e.target.checked })}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-900 border-t border-slate-800">
                <span>3. Restroom Taps Checked (No Leaks / Continuous Running):</span>
                <input
                  type="checkbox"
                  checked={roomChecks.tapsNoLeaks}
                  onChange={(e) => setRoomChecks({ ...roomChecks, tapsNoLeaks: e.target.checked })}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-900 border-t border-slate-800">
                <span>4. Classroom Bins Correctly Segregated (Dry vs Wet):</span>
                <input
                  type="checkbox"
                  checked={roomChecks.binsSegregated}
                  onChange={(e) => setRoomChecks({ ...roomChecks, binsSegregated: e.target.checked })}
                  className="rounded accent-emerald-500 w-4 h-4"
                />
              </label>
            </div>

            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
            >
              Submit Room Checklist & Dispatch Tickets
            </button>
          </form>

          {roomReportSubmitted && (
            <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/30 text-xs space-y-1.5 animate-fadeIn">
              <span className="text-emerald-400 font-bold block">✓ Checklist Recorded & Processed!</span>
              <p className="text-slate-300">
                {!roomChecks.acTurnedOff 
                  ? "Failed check detected: AC left on. Automated facility dispatch ticket spawned and assigned to Bhima (Facilities Lead)."
                  : "All criteria passed. Room condition logged to institutional compliance ledger."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ENERGY & WATER SENTINEL (IDEAS 13, 14, 16, 17, 19, 29) */}
      {activeTab === 'energy_water' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Energy & Solar */}
            <div className="bg-slate-900/90 rounded-2xl border border-amber-500/30 p-5 space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  Ideas #13, #14 & #16 • Energy & Solar
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  Campus Building Energy & Solar Generation
                </h3>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Today's Campus Solar Generation:</span>
                  <span className="text-amber-400 font-mono font-bold">142.4 kWh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Electricity Consumed:</span>
                  <span className="text-white font-mono font-bold">198.8 kWh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Net Renewable Offset:</span>
                  <span className="text-emerald-400 font-mono font-bold">71.6% Clean Solar</span>
                </div>

                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '71.6%' }}></div>
                </div>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-300">💡 After-Hours Energy Alert (Idea 14):</span>
                <p className="text-slate-400 text-[11px]">
                  Mechanical Lab 3 circuit shows 1.8 kW active load after 8:00 PM closure. Alert dispatched to staff for review rather than hard automatic shutdown.
                </p>
              </div>
            </div>

            {/* Water & Tank Telemetry */}
            <div className="bg-slate-900/90 rounded-2xl border border-cyan-500/30 p-5 space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                  Ideas #17, #18 & #19 • Water Conservation
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  Overhead Tank Level & Leak Sentinel
                </h3>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Overhead Tank B (Cauvery Hostel):</span>
                  <span className="text-cyan-400 font-mono font-bold">78% Full (Healthy)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Rainwater Harvesting Sump:</span>
                  <span className="text-emerald-400 font-mono font-bold">84% Capacity</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Reported Unfixed Leaks:</span>
                  <span className="text-emerald-400 font-mono font-bold">0 Pending (All Resolved)</span>
                </div>

                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>

              <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl text-xs space-y-1">
                <span className="font-bold text-cyan-300">🚰 Leak Reporting Workflow (Idea 17):</span>
                <p className="text-slate-400 text-[11px]">
                  Staff and students can report dripping taps or pipe overflows with a single photo click. Work tickets are auto-assigned with time-to-closure SLA tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Commute Emissions Estimator (Idea 29) */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                Idea #29 • Mobility & Air Quality
              </span>
              <h3 className="text-sm font-extrabold text-white mt-0.5">
                Voluntary Commute Emissions Estimator
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Commute Mode</label>
                <select
                  value={commuteMode}
                  onChange={(e) => setCommuteMode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="BUS">BMTC Electric Bus / College Bus</option>
                  <option value="METRO">Namma Metro (Kengeri Station)</option>
                  <option value="BIKE">Two-Wheeler (Petrol)</option>
                  <option value="CAR">Personal Car (Petrol/Diesel)</option>
                  <option value="WALK">Walking / Bicycle (Zero Emission)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">One-Way Distance (km)</label>
                <input
                  type="number"
                  value={commuteDistance}
                  onChange={(e) => setCommuteDistance(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Daily Round-Trip Footprint</span>
                <span className="text-base font-black text-emerald-400 font-mono mt-0.5">
                  {commuteMode === 'WALK' ? '0.0 kg CO2' :
                   commuteMode === 'METRO' ? (commuteDistance * 2 * 0.025).toFixed(2) + ' kg CO2' :
                   commuteMode === 'BUS' ? (commuteDistance * 2 * 0.045).toFixed(2) + ' kg CO2' :
                   commuteMode === 'BIKE' ? (commuteDistance * 2 * 0.095).toFixed(2) + ' kg CO2' :
                   (commuteDistance * 2 * 0.192).toFixed(2) + ' kg CO2'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
