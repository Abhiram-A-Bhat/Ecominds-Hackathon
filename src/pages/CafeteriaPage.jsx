import React, { useState } from 'react';
import { IconUtensils, IconCheckCircle } from '../components/Icons';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { Link } from '../router/Router';
import { actionMesh } from '../services/actionMeshService';
import { useAuth } from '../contexts/AuthContext';

export const CafeteriaPage = ({ surplusAlerts, setSurplusAlerts, userCredits, setUserCredits }) => {
  const { addContribution, adjustPoints, currentUser, role } = useAuth();
  const [claimDate] = useState(() => new Date().toISOString().slice(0, 10));
  const claimKey = `ecominds_cafeteria_claims_${currentUser?.id || 'guest'}_${claimDate}`;
  const [claimedItems, setClaimedItems] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(claimKey) || '[]')); }
    catch { return new Set(); }
  });
  const [claimToast, setClaimToast] = useState('');
  const [broadcast, setBroadcast] = useState({ event: '', items: '', location: '', portions: '', pointsCost: '10', bestBefore: 'Within 45 minutes' });

  const handleClaimSurplus = (alertId) => {
    const targetAlert = surplusAlerts.find(a => a.id === alertId);
    const pointsCost = Number(targetAlert?.pointsCost ?? 10);
    let storedClaims = [];
    try { storedClaims = JSON.parse(localStorage.getItem(claimKey) || '[]'); } catch { /* use in-memory state */ }
    const available = Math.max(0, Number(targetAlert?.portions || 0) - Number(targetAlert?.reservedPortions || 0));
    if (!targetAlert || targetAlert.status !== 'ACTIVE' || available < 1 || claimedItems.has(alertId) || storedClaims.includes(alertId)) return;
    if (userCredits < pointsCost) {
      setClaimToast(`You need ${pointsCost} EcoCredits to reserve a meal.`);
      window.setTimeout(() => setClaimToast(''), 4000);
      return;
    }
    const portions = Math.max(1, Number(targetAlert.portions) || 1);
    setSurplusAlerts(prev => prev.map(a => {
      if (a.id !== alertId) return a;
      const reservedPortions = Math.min(portions, (Number(a.reservedPortions) || 0) + 1);
      const claimedPct = Math.round(reservedPortions / portions * 100);
      return { ...a, claimedPct, reservedPortions, status: reservedPortions >= portions ? 'COMPLETED' : 'ACTIVE' };
    }));
    const nextClaims = [...new Set([...storedClaims, alertId])];
    try { localStorage.setItem(claimKey, JSON.stringify(nextClaims)); } catch { /* keep this reservation in memory */ }
    setClaimedItems(new Set(nextClaims));
    setClaimToast(`Meal reserved for ${pointsCost} EcoCredits. Collect within 10 minutes at the counter.`);
    window.setTimeout(() => setClaimToast(''), 4000);
    // Auto-resolve corresponding Action Mesh ticket
    actionMesh.resolveTicket("ACT-103", "Canteen surplus claimed & distributed to students.");
    if (currentUser?.id) adjustPoints(currentUser.id, -pointsCost, `Reserved surplus meal: ${targetAlert.event}`, 'FOOD');
    triggerEcoCelebration({
      title: 'Surplus meal reserved',
      message: `Collect your reserved portion at ${targetAlert.location} within 10 minutes.`,
      points: 0,
      badge: `−${pointsCost} EcoCredits`
    });
  };

  const handleBroadcast = (event) => {
    event.preventDefault();
    const portions = Math.floor(Number(broadcast.portions));
    const pointsCost = Math.floor(Number(broadcast.pointsCost));
    if (!broadcast.event.trim() || !broadcast.items.trim() || !broadcast.location.trim() || portions < 1 || pointsCost < 0) return;
    const postedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSurplusAlerts(prev => [{
      id: `SF-${Date.now()}`, event: broadcast.event.trim(), items: broadcast.items.trim(), location: broadcast.location.trim(),
      portions, reservedPortions: 0, pointsCost, bestBefore: broadcast.bestBefore.trim() || 'Within 45 minutes',
      postedAt: `Today, ${postedAt}`, target: 'Students', claimedPct: 0, status: 'ACTIVE',
    }, ...prev]);
    setBroadcast({ event: '', items: '', location: '', portions: '', pointsCost: '10', bestBefore: 'Within 45 minutes' });
    setClaimToast('Leftover meal broadcast is now available to students.');
    window.setTimeout(() => setClaimToast(''), 4000);
  };

  const handleCleanPlate = () => {
    let storedClaims = [];
    try { storedClaims = JSON.parse(localStorage.getItem(claimKey) || '[]'); } catch { /* use in-memory state */ }
    if (claimedItems.has('clean-plate') || storedClaims.includes('clean-plate')) return;
    const nextClaims = [...new Set([...storedClaims, 'clean-plate'])];
    try { localStorage.setItem(claimKey, JSON.stringify(nextClaims)); } catch { /* keep this log in memory */ }
    setClaimedItems(new Set(nextClaims));
    setUserCredits(prev => prev + 10);
    if (addContribution) {
      addContribution({
        action: 'Clean Plate Finish — Zero Food Waste',
        points: 10,
        type: 'FOOD',
        status: 'APPROVED',
      });
    }
    triggerEcoCelebration({
      title: '🌿 Zero Plate Waste!',
      message: 'Empty plate logged — ~350g of food diverted from landfill. You are a campus sustainability hero!',
      points: 10,
      badge: '+10 EcoCredits'
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">Smart Cafeteria & Food Waste</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Zero-Hunger, Zero-Waste Campus Food Loop
          </h1>
          <p className="text-xs text-slate-400">
            Reserve a leftover meal with EcoCredits and collect it from the listed cafeteria counter.
          </p>
        </div>

        <button
          onClick={handleCleanPlate}
          aria-label="Log a clean empty plate and earn 10 EcoCredits"
          disabled={claimedItems.has('clean-plate')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
        >
          <IconCheckCircle className="w-4 h-4" aria-hidden="true" />
          {claimedItems.has('clean-plate') ? 'Plate Logged Today' : 'Log Empty Plate (+10 PTS)'}
        </button>
      </div>

      {/* Live Surplus Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <IconUtensils className="w-5 h-5 text-amber-400" />
            Active Campus Event Surplus Food Broadcasts
          </h2>
          <span className="text-xs text-slate-400">Valid safe consumption window: 45 mins</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {surplusAlerts.map(alert => (
            <div key={alert.id} className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  {alert.event}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">{alert.postedAt}</span>
                  {['STAFF', 'ADMIN'].includes(role) && (
                    <button
                      type="button"
                      onClick={() => setSurplusAlerts(prev => prev.filter(item => item.id !== alert.id))}
                      aria-label={`Remove ${alert.event} meal broadcast`}
                      className="btn-ghost text-[10px] px-2 py-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{alert.items}</h3>
                <div className="text-xs text-slate-400 mt-2 space-y-1">
                  <div>📍 <strong>Pickup Spot:</strong> <span className="text-slate-200">{alert.location}</span></div>
                  <div>⏰ <strong>Safe Window:</strong> <span className="text-amber-300 font-semibold">{alert.bestBefore}</span></div>
                  <div><strong>Available:</strong> <span className="text-slate-300">{Math.max(0, Number(alert.portions || 0) - Number(alert.reservedPortions || 0))} portions</span></div>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs font-bold font-mono">
                  <span className="text-slate-400">Redistribution Claimed</span>
                  <span className="text-emerald-400">{alert.claimedPct}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${alert.claimedPct}%` }}></div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                {alert.status === 'ACTIVE' && !claimedItems.has(alert.id) && alert.claimedPct < 100 ? (
                  <button
                    onClick={() => handleClaimSurplus(alert.id)}
                    disabled={userCredits < Number(alert.pointsCost ?? 10)}
                    aria-label={`Reserve a leftover meal from ${alert.event} for ${Number(alert.pointsCost ?? 10)} EcoCredits`}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-emerald-600/30"
                  >
                    Reserve a meal · {Number(alert.pointsCost ?? 10)} pts
                  </button>
                ) : claimedItems.has(alert.id) ? (
                  <span className="text-xs text-emerald-400 font-bold">✓ Claimed</span>
                ) : (
                  <span className="text-xs text-slate-500 font-bold">100% Fully Distributed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {['STAFF', 'ADMIN'].includes(role) && (
        <form onSubmit={handleBroadcast} className="cafeteria-broadcast tactile-panel">
          <div>
            <h2 className="text-base font-extrabold">Broadcast leftover meals</h2>
            <p className="text-xs text-slate-400">Students can reserve one available portion by spending the listed EcoCredits.</p>
          </div>
          <div className="cafeteria-broadcast-grid">
            <label>Meal/event<input required value={broadcast.event} onChange={e => setBroadcast(v => ({ ...v, event: e.target.value }))} /></label>
            <label>Food available<input required value={broadcast.items} onChange={e => setBroadcast(v => ({ ...v, items: e.target.value }))} /></label>
            <label>Pickup counter<input required value={broadcast.location} onChange={e => setBroadcast(v => ({ ...v, location: e.target.value }))} /></label>
            <label>Portions<input required type="number" min="1" step="1" value={broadcast.portions} onChange={e => setBroadcast(v => ({ ...v, portions: e.target.value }))} /></label>
            <label>Points per portion<input required type="number" min="0" step="1" value={broadcast.pointsCost} onChange={e => setBroadcast(v => ({ ...v, pointsCost: e.target.value }))} /></label>
            <label>Pickup deadline<input value={broadcast.bestBefore} onChange={e => setBroadcast(v => ({ ...v, bestBefore: e.target.value }))} /></label>
          </div>
          <button className="btn-eco" type="submit">Publish meal availability</button>
        </form>
      )}

      {/* Composter & Garden Pipeline Metrics */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Weekly Organic Input</div>
          <div className="text-3xl font-black text-emerald-400 font-mono">684.2 <span className="text-sm">KG</span></div>
          <p className="text-xs text-slate-400">Scraped canteen leftovers diverted from landfills.</p>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Organic Fertilizer Generated</div>
          <div className="text-3xl font-black text-amber-400 font-mono">136.8 <span className="text-sm">KG</span></div>
          <p className="text-xs text-slate-400">Enriched soil compost applied to RNSIT botanical gardens.</p>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Methane & CO2 Prevented</div>
          <div className="text-3xl font-black text-teal-400 font-mono">1,120 <span className="text-sm">KG CO2e</span></div>
          <p className="text-xs text-slate-400">Anaerobic decomposition emissions avoided.</p>
        </div>
      </div>

      {/* Inter-Dependent Pipeline Banner */}
      <div className="bg-emerald-950/30 border border-emerald-500/25 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Closed-Loop Circular Economy Pipeline
          </div>
          <div className="text-xs text-slate-300 font-medium mt-1">
            Canteen organic slurry ➔ Cauvery Anaerobic Compactor (B-107) ➔ Enriched soil compost applied to RNSIT Flora.
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/bins" className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl font-bold transition">
            🗑️ Inspect Bin B-107
          </Link>
          <Link to="/trees" className="text-xs bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700 px-3 py-1.5 rounded-xl font-bold transition">
            🌳 View Enriched Flora
          </Link>
          <Link to="/audit" className="text-xs bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 px-3 py-1.5 rounded-xl font-bold transition">
            📑 NAAC Audit Log
          </Link>
        </div>
      </div>

      {claimToast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(5,150,105,0.95)', color: 'white', fontWeight: 700,
          padding: '12px 24px', borderRadius: 14, fontSize: 13,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 9999,
          backdropFilter: 'blur(8px)', border: '1px solid rgba(52,211,153,0.3)',
          animation: 'revealUp 0.3s ease forwards'
        }}>
          {claimToast}
        </div>
      )}
    </div>
  );
};
