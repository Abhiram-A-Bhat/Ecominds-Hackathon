import React, { useState, useEffect } from 'react';
import { IconCpu, IconCheckCircle, IconZap } from '../components/Icons';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { Link } from '../router/Router';
import { actionMesh } from '../services/actionMeshService';
import { useAuth } from '../contexts/AuthContext';

const POINT_BASE = { phone: 40, laptop: 80, pcb: 25, battery: 30, accessory: 10 };
const DEPOSIT_KEY = 'ecominds-ewaste-deposits-v1';

const DEFAULT_VALUATION = {
  success: true,
  total_valuation_inr: 46666.0,
  currency: "INR (₹)",
  rates: {
    copper_per_kg: 765.0,
    gold_traces_per_gram: 6850.0,
    cobalt_per_kg: 2420.0,
    lithium_carbonate_per_kg: 1820.0,
    aluminium_per_kg: 215.0
  },
  campus_inventory: {
    copper_kg: 18.4,
    gold_traces_g: 2.2,
    cobalt_kg: 1.5,
    lithium_kg: 3.8,
    aluminium_kg: 32.0
  },
  kspcb_recyclers: [
    { name: "E-Terra Global Solutions", license: "KSPCB/EW/2022/94", location: "Peenya Industrial Area 2nd Stage, Bangalore", distance_km: 14.2, status: "CONTRACTED PARTNER" },
    { name: "Bangalore Green Metallics Ltd.", license: "CPCB/REG/KA/812", location: "Electronic City Phase 1, Bangalore", distance_km: 21.0, status: "AUTHORIZED RECYCLER" },
    { name: "Eco-Informatics CleanTech", license: "KSPCB/EW/2023/118", location: "Bidadi Industrial Park, Bangalore", distance_km: 18.5, status: "AUTHORIZED RECYCLER" }
  ]
};

export const EwastePage = ({ salvagedItems, setSalvagedItems }) => {
  const { getLiveUsers, adjustPoints } = useAuth();
  const [filter, setFilter] = useState('ALL');
  const [newEwaste, setNewEwaste] = useState({ name: '', category: 'Development Boards', specs: '', weight: '', condition: 'Used - inspect before reuse', studentId: '' });
  const [depositSubmitted, setDepositSubmitted] = useState(false);
  const [depositAnalysis, setDepositAnalysis] = useState(null);
  const [pendingDeposits, setPendingDeposits] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DEPOSIT_KEY) || '[]'); } catch { return []; }
  });
  const [pointOverrides, setPointOverrides] = useState({});
  const students = (getLiveUsers?.() || []).filter(user => user.role === 'STUDENT');
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthlyApproved = pendingDeposits.filter(row => row.status === 'APPROVED' && row.approvedAt?.startsWith(monthKey));
  const monthlyRecoveredValue = monthlyApproved.reduce((total, row) => {
    const m = row.analysis?.recoverable_metals || {}; const r = valuationData?.rates || {};
    return total + (m.copper_kg || 0) * r.copper_per_kg + (m.gold_g || 0) * r.gold_traces_per_gram + (m.cobalt_kg || 0) * r.cobalt_per_kg + (m.lithium_kg || 0) * r.lithium_carbonate_per_kg + (m.aluminium_kg || 0) * r.aluminium_per_kg;
  }, 0);

  // Valuation state
  const [valuationData, setValuationData] = useState(DEFAULT_VALUATION);
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [isAnalyzingComponent, setIsAnalyzingComponent] = useState(false);

  const categories = ['ALL', 'Development Boards', 'Actuators & Sensors', 'Batteries / Hazardous', 'Peripherals & Cables'];

  const filteredItems = filter === 'ALL' 
    ? salvagedItems 
    : salvagedItems.filter(item => item.category === filter);

  // Attempt fetch of updated metal valuation if backend is active
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/metal-valuation", { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        if (d.success) setValuationData(d);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const runDepositAnalysis = async () => {
    if (!newEwaste.name.trim()) return;
    setIsAnalyzingComponent(true);
    try {
      const res = await fetch('/api/salvage-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: newEwaste.name, specs: `${newEwaste.specs}; condition: ${newEwaste.condition}; weight: ${newEwaste.weight} kg` }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`Analysis service returned ${res.status}`);
      const data = await res.json();
      setDepositAnalysis({ ...data.analysis, model: data.model });
    } catch {
      setDepositAnalysis({ salvageability_score: 5, components: [], recoverable_metals: {}, hazards: ['Backend unavailable; inspect item and use conservative estimate'], recommended_lab: 'Electronics Repair Bench', summary: 'Rules-based offline estimate.' });
    } finally { setIsAnalyzingComponent(false); }
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    if (!newEwaste.name.trim() || !depositAnalysis || !newEwaste.studentId) return;
    const item = {
      id: `EW-${Date.now()}`, name: newEwaste.name.trim(), category: newEwaste.category,
      specs: newEwaste.specs, weightKg: Number(newEwaste.weight), condition: newEwaste.condition,
      studentId: newEwaste.studentId, analysis: depositAnalysis, createdAt: new Date().toISOString(), status: 'PENDING',
    };
    const updated = [item, ...pendingDeposits];
    localStorage.setItem(DEPOSIT_KEY, JSON.stringify(updated));
    setPendingDeposits(updated);
    setDepositSubmitted(true);
    triggerEcoCelebration({ title: `E-Waste Submitted: ${item.name}`, message: 'Deposit submitted for staff verification. Points will be awarded after approval.', points: 0 });
  };

  const suggestedPoints = (deposit) => {
    const text = `${deposit.name} ${deposit.category}`.toLowerCase();
    const base = text.includes('battery') ? POINT_BASE.battery : text.includes('laptop') ? POINT_BASE.laptop : text.includes('phone') ? POINT_BASE.phone : text.includes('pcb') || text.includes('board') ? POINT_BASE.pcb : POINT_BASE.accessory;
    const metals = deposit.analysis?.recoverable_metals || {};
    const rates = valuationData?.rates || {};
    const value = (metals.copper_kg || 0) * rates.copper_per_kg + (metals.gold_g || 0) * rates.gold_traces_per_gram + (metals.cobalt_kg || 0) * rates.cobalt_per_kg + (metals.lithium_kg || 0) * rates.lithium_carbonate_per_kg + (metals.aluminium_kg || 0) * rates.aluminium_per_kg;
    const hazardous = `${deposit.name} ${deposit.analysis?.hazards?.join(' ')}`.toLowerCase().match(/battery|lithium|crt|mercury/);
    return Math.min(75, Math.round(base + (deposit.analysis?.salvageability_score || 0) * 3 + value / 100 + (hazardous ? 10 : 0)));
  };

  const approveDeposit = (deposit, requestedPoints) => {
    let latestDeposits = pendingDeposits;
    try { latestDeposits = JSON.parse(localStorage.getItem(DEPOSIT_KEY) || '[]'); } catch { /* use current view state */ }
    if (latestDeposits.find(row => row.id === deposit.id)?.status !== 'PENDING') return;
    const points = Math.min(75, Math.max(0, Math.round(Number(requestedPoints ?? suggestedPoints(deposit)))));
    adjustPoints?.(deposit.studentId, points, `E-waste: ${deposit.name}`, 'EWASTE');
    const updated = latestDeposits.map(row => row.id === deposit.id ? { ...row, status: 'APPROVED', approvedPoints: points, approvedAt: new Date().toISOString() } : row);
    localStorage.setItem(DEPOSIT_KEY, JSON.stringify(updated));
    setPendingDeposits(updated);
    const student = (getLiveUsers?.() || []).find(user => user.id === deposit.studentId);
    const newItem = { id: deposit.id, name: deposit.name, category: deposit.category, condition: deposit.condition, sourceDept: 'Student Contribution', salvagedBy: student?.name || 'Student', status: 'Available for Student Checkout', creditsCost: 0, specs: deposit.specs || 'Inspected', claimCount: 0 };
    setSalvagedItems(prev => [newItem, ...prev.filter(row => row.id !== newItem.id)]);
    triggerEcoCelebration({ title: 'E-Waste Deposit Approved', message: `${points} EcoCredits awarded to ${student?.name || 'the student'}.`, points });
  };

  const handleClaim = (id) => {
    let claimedItemName = "Hardware Component";
    setSalvagedItems(prev => prev.map(item => {
      if (item.id === id) {
        claimedItemName = item.name;
        return { ...item, status: "Checked Out for Student Capstone", claimCount: item.claimCount + 1 };
      }
      return item;
    }));

    // Auto-resolve any ticket for this e-waste unit
    const matchingTicket = actionMesh.getTickets().find(t => t.targetEntityId === id && t.status !== 'RESOLVED');
    if (matchingTicket) {
      actionMesh.resolveTicket(matchingTicket.id, "Checked out by student for academic engineering capstone.");
    }

    triggerEcoCelebration({
      title: `Component Rescued: ${claimedItemName}`,
      message: "Circular reuse achieved: Component checked out for student capstone lab project.",
      points: 35
    });
  };

  // Run Groq 120B Deep Hardware Salvage Analysis
  const runGroqSalvageAnalysis = async (item) => {
    setIsAnalyzingComponent(true);
    setActiveAnalysis(null);

    try {
      const res = await fetch("/api/salvage-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_name: item.name, specs: item.specs }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      setActiveAnalysis({ item: item.name, analysis: data.analysis, model: data.model });
    } catch (err) {
      setActiveAnalysis({
        item: item.name,
        analysis: { salvageability_score: 5, components: [], recoverable_metals: {}, hazards: ['Backend unavailable; perform manual safety inspection'], recommended_lab: 'Electronics Repair Bench', summary: 'Offline fallback. Do not award a final value until verified.' },
        model: "Offline fallback"
      });
    } finally {
      setIsAnalyzingComponent(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">E-Waste & Component Upcycling Hub</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Electronic Waste Circular Lifecycle Hub
          </h1>
          <p className="text-xs text-slate-400">
            Recover useful components for student labs and send remaining material to a certified recycler.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 px-3 py-1.5 rounded-xl font-bold">
            CPCB Reg: 2022-KA-EWASTE-8472
          </span>
        </div>
      </div>

      {/* Top Banner: Circular Salvage Philosophy */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-blue-500/30 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <IconCpu className="w-5 h-5" />
            The College Hardware Re-Use Loop
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Don't throw away past engineering projects. Upcycle them for juniors.
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Engineering students spend thousands buying microcontrollers and sensors for one-time semester projects. 
            Submit your components below — an admin will verify them and list them for junior students to check out for <strong>₹0 free</strong>.
          </p>
        </div>

        <div className="text-center bg-emerald-950/40 border border-emerald-500/20 rounded-xl px-5 py-3">
          <div className="text-2xl font-black text-emerald-400">₹{monthlyRecoveredValue.toFixed(0)}</div>
          <div className="text-[10px] text-emerald-300 font-bold uppercase">Approved recovery value this month</div>
        </div>
      </div>

      {/* KSPCB RECYCLER & METAL VALUATION REFERENCE */}
      {valuationData && (
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-amber-500/30 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                Financial Circular Economics
              </span>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                KSPCB Authorized Recycler Valuation & Commodity Spot Rates
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Campus Inventory Recoverable Value</span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                ₹{valuationData.total_valuation_inr.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Recovered Metal Yields */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 font-bold">Copper Yield</div>
              <div className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5">{valuationData.campus_inventory.copper_kg} kg</div>
              <div className="text-[9px] text-slate-400 mt-0.5">₹{valuationData.rates.copper_per_kg}/kg</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 font-bold">Gold Traces</div>
              <div className="text-sm font-extrabold text-amber-400 font-mono mt-0.5">{valuationData.campus_inventory.gold_traces_g} g</div>
              <div className="text-[9px] text-slate-400 mt-0.5">₹{valuationData.rates.gold_traces_per_gram}/g</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 font-bold">Cobalt Yield</div>
              <div className="text-sm font-extrabold text-blue-400 font-mono mt-0.5">{valuationData.campus_inventory.cobalt_kg} kg</div>
              <div className="text-[9px] text-slate-400 mt-0.5">₹{valuationData.rates.cobalt_per_kg}/kg</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 font-bold">Lithium Salts</div>
              <div className="text-sm font-extrabold text-teal-400 font-mono mt-0.5">{valuationData.campus_inventory.lithium_kg} kg</div>
              <div className="text-[9px] text-slate-400 mt-0.5">₹{valuationData.rates.lithium_carbonate_per_kg}/kg</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-500 font-bold">Aluminium Yield</div>
              <div className="text-sm font-extrabold text-slate-300 font-mono mt-0.5">{valuationData.campus_inventory.aluminium_kg} kg</div>
              <div className="text-[9px] text-slate-400 mt-0.5">₹{valuationData.rates.aluminium_per_kg}/kg</div>
            </div>
          </div>

          {/* KSPCB Recyclers Match */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-bold text-slate-400">
              Contracted KSPCB-Licensed E-Waste Recyclers (Bangalore Region):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {valuationData.kspcb_recyclers.map((rec, i) => (
                <div key={i} className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-white truncate">{rec.name}</div>
                    <div className="text-[10px] text-slate-400">{rec.location}</div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/80 text-[10px]">
                    <span className="text-slate-500 font-mono">{rec.license}</span>
                    <span className="text-emerald-400 font-bold">{rec.distance_km} km</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Groq 120B Deep Salvage Analysis Modal / Drawer */}
      {activeAnalysis && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-sm font-bold text-white">
                Groq 120B Deep Hardware Salvage Report: <strong className="text-emerald-400">{activeAnalysis.item}</strong>
              </h3>
            </div>
            <button
              onClick={() => setActiveAnalysis(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Close
            </button>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <p><strong>Salvageability:</strong> {activeAnalysis.analysis?.salvageability_score}/10</p>
            <p><strong>Summary:</strong> {activeAnalysis.analysis?.summary}</p>
            <p><strong>Recommended lab:</strong> {activeAnalysis.analysis?.recommended_lab}</p>
            <div><strong>Components:</strong> {(activeAnalysis.analysis?.components || []).map(part => `${part.name} (${part.reusable ? 'reuse' : 'recycle'}; ${part.lab_use})`).join(' · ') || 'No specific components identified'}</div>
            <div className="text-amber-300"><strong>Hazards:</strong> {(activeAnalysis.analysis?.hazards || []).join(' · ') || 'None reported; inspect before handling'}</div>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              filter === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Available Salvaged Components Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Salvaged Component Inventory ({filteredItems.length} items)
          </h3>
          <span className="text-xs text-slate-400">Inspected by ECE & Robotics Club</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-blue-500/40 transition flex flex-col justify-between shadow-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-slate-950 text-blue-400 border border-slate-800 px-2 py-0.5 rounded">
                    {item.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status.includes('Available') 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-white text-base">{item.name}</h4>
                  <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 mt-1.5">
                    {item.specs}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div><strong>Donor Source:</strong> <span className="text-slate-300">{item.sourceDept}</span></div>
                  <div><strong>Condition:</strong> <span className="text-slate-300">{item.condition}</span></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Student Cost</div>
                    <div className="text-sm font-black text-emerald-400 font-mono">₹0 FREE</div>
                  </div>

                  {item.status.includes('Available') ? (
                    <button
                      onClick={() => handleClaim(item.id)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-md shadow-blue-600/30"
                    >
                      Check Out Board
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 font-semibold italic">Reserved</span>
                  )}
                </div>

                {/* Groq AI Salvage Analysis Button */}
                <button
                  onClick={() => runGroqSalvageAnalysis(item)}
                  disabled={isAnalyzingComponent}
                  className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <IconZap className="w-3.5 h-3.5 text-emerald-400" />
                  Run Groq 120B Salvage Feasibility Inspector
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* E-Waste Deposit Section */}
      <div id="depositForm" className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white">
              🔌 Submit E-Waste for Admin Verification
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Bring the item to the <strong className="text-emerald-400">ECE E-Waste Collection Point (Lab 104)</strong>. 
              Staff inspect the item and approve a points award calculated from its category, salvage score and estimated metals value.
            </p>
          </div>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl font-bold font-mono">
            STAFF VERIFIED
          </span>
        </div>

        {depositSubmitted ? (
          <div className="bg-emerald-950/60 border border-emerald-500/40 p-6 rounded-xl text-center space-y-3">
            <IconCheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-lg font-black text-white">Deposit Logged! Pending Admin Verification</h4>
            <p className="text-xs text-emerald-300 max-w-md mx-auto">
              The item is queued for inspection. No EcoCredits are awarded until a staff member approves it.
            </p>
            <button
              onClick={() => {
                setDepositSubmitted(false);
                setNewEwaste({ name: '', category: 'Development Boards', specs: '', weight: '', condition: 'Used - inspect before reuse', studentId: '' });
                setDepositAnalysis(null);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
            >
              Submit Another Item
            </button>
          </div>
        ) : (
          <form onSubmit={handleDepositSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Item name (e.g. ESP32 board, laptop battery)"
              value={newEwaste.name}
              onChange={e => setNewEwaste({ ...newEwaste, name: e.target.value })}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white col-span-1 md:col-span-1"
              required
            />
            <input aria-label="Item weight in kilograms" type="number" min="0.01" step="0.01" placeholder="Weight (kg)" value={newEwaste.weight} onChange={e => setNewEwaste({ ...newEwaste, weight: e.target.value })} className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white" required />
            <select aria-label="Depositing student" value={newEwaste.studentId} onChange={e => setNewEwaste({ ...newEwaste, studentId: e.target.value })} className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200" required>
              <option value="">Select student by name / USN</option>
              {students.map(student => <option key={student.id} value={student.id}>{student.name} {student.usn ? `· ${student.usn}` : ''}</option>)}
            </select>
            <select
              value={newEwaste.category}
              onChange={e => setNewEwaste({ ...newEwaste, category: e.target.value })}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200"
            >
              <option value="Development Boards">Development Boards</option>
              <option value="Actuators & Sensors">Actuators & Sensors</option>
              <option value="Batteries / Hazardous">Batteries / Hazardous</option>
              <option value="Peripherals & Cables">Peripherals & Cables</option>
            </select>
            <select aria-label="Item condition" value={newEwaste.condition} onChange={e => setNewEwaste({ ...newEwaste, condition: e.target.value })} className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200">
              <option>Working</option><option>Partially working</option><option>Non-working</option><option>Used - inspect before reuse</option>
            </select>
            <input type="text" placeholder="Specs / description" value={newEwaste.specs} onChange={e => setNewEwaste({ ...newEwaste, specs: e.target.value })} className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white" />
            <button
              type="button" onClick={runDepositAnalysis} disabled={!newEwaste.name.trim() || isAnalyzingComponent} aria-busy={isAnalyzingComponent}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5"
            >
              <IconZap className="w-4 h-4 text-amber-300" />
              {isAnalyzingComponent ? 'Analyzing…' : 'Analyze item'}
            </button>
            {depositAnalysis && <div className="md:col-span-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-slate-200">
              <strong className="text-emerald-300">Analysis ready · {depositAnalysis.salvageability_score}/10 · {depositAnalysis.model || 'Groq / rules fallback'}</strong>
              <p className="mt-1">{depositAnalysis.summary} Recommended: {depositAnalysis.recommended_lab}.</p>
              {(depositAnalysis.hazards || []).length > 0 && <p className="mt-1 text-amber-300">Safety: {depositAnalysis.hazards.join(' · ')}</p>}
              <button type="submit" className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white">Submit for staff approval · suggested {suggestedPoints({ ...newEwaste, analysis: depositAnalysis })} pts</button>
            </div>}
          </form>
        )}
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-bold text-white">E-waste deposit approvals</h3><span className="text-xs text-slate-400">{pendingDeposits.filter(row => row.status === 'PENDING').length} awaiting review</span></div>
        {pendingDeposits.length === 0 ? <p className="text-xs text-slate-500">No student deposits have been submitted yet.</p> : pendingDeposits.map(deposit => {
          const student = students.find(row => row.id === deposit.studentId);
          const points = pointOverrides[deposit.id] ?? suggestedPoints(deposit);
          const metals = deposit.analysis?.recoverable_metals || {};
          const rates = valuationData?.rates || {};
          const value = (metals.copper_kg || 0) * rates.copper_per_kg + (metals.gold_g || 0) * rates.gold_traces_per_gram + (metals.cobalt_kg || 0) * rates.cobalt_per_kg + (metals.lithium_kg || 0) * rates.lithium_carbonate_per_kg + (metals.aluminium_kg || 0) * rates.aluminium_per_kg;
          return <div key={deposit.id} className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-300"><strong className="text-white">{deposit.name}</strong> · {student?.name || 'Student'} · {deposit.weightKg} kg · {deposit.condition}<div className="mt-1 text-slate-400">Score {deposit.analysis?.salvageability_score}/10 · Estimated recovered value ₹{value.toFixed(2)} · {deposit.status}</div></div>
            {deposit.status === 'PENDING' && <div className="flex items-center gap-2"><label className="text-[10px] text-slate-400">Points<input aria-label={`Approved points for ${deposit.name}`} type="number" min="0" max="75" value={points} onChange={e => setPointOverrides(prev => ({ ...prev, [deposit.id]: e.target.value }))} className="ml-2 w-20 rounded-md border border-slate-700 bg-slate-900 p-2 text-white" /></label><button onClick={() => approveDeposit(deposit, points)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Approve &amp; credit</button></div>}
            {deposit.status === 'APPROVED' && <span className="text-xs font-bold text-emerald-300">+{deposit.approvedPoints} credits approved</span>}
          </div>;
        })}
      </section>
    </div>
  );
};
