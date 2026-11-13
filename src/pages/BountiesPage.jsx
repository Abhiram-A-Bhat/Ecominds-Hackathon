import React, { useState } from 'react';
import { IconAlertTriangle, IconCheckCircle, IconZap } from '../components/Icons';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { Link } from '../router/Router';
import { useAuth } from '../contexts/AuthContext';

export const BountiesPage = ({ userCredits, setUserCredits }) => {
  const { currentUser, addContribution } = useAuth();
  const resolvedKey = `ecominds_resolved_bounties_${currentUser?.id || 'guest'}`;
  const [bounties, setBounties] = useState([
    {
      id: "BNT-101",
      title: "Projector & 4 High-Power Ceiling Fans Running in Empty Seminar Hall 2",
      location: "Admin Block, 3rd Floor",
      reporter: "Nayana C P",
      reportedAt: "25 mins ago",
      energySavedEst: "~3.2 kWh / hour",
      bountyPts: 30,
      status: "RESOLVED",
      actionTaken: "Green Guardian switched it off by hand."
    },
    {
      id: "BNT-102",
      title: "Continuously Leaking Restroom Flush Valve & Tap Drip",
      location: "CSE Block, 1st Floor Boys Washroom",
      reporter: "Sowmyashree S",
      reportedAt: "1 hour ago",
      energySavedEst: "~15 Liters / hour saved",
      bountyPts: 35,
      status: "DISPATCHED",
      actionTaken: "Plumbing maintenance ticket #829 assigned."
    },
    {
      id: "BNT-103",
      title: "Lawn Sprinkler Spraying Concrete Path instead of Turf",
      location: "Main Quadrangle North Garden",
      reporter: "Harshitha P",
      reportedAt: "3 hours ago",
      energySavedEst: "~40 Liters water redirected",
      bountyPts: 25,
      status: "RESOLVED",
      actionTaken: "Sprinkler head realignment completed."
    }
  ]);

  const [newBounty, setNewBounty] = useState({ title: '', location: '', type: 'Electricity / Phantom Load' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const QUICK_PRESETS = [
    { title: 'Projector & lights left ON in empty classroom', location: 'CSE Block Room 204' },
    { title: 'Dripping water tap in washroom', location: 'Mechanical Block 1st Floor' },
    { title: 'AC running in empty computer lab', location: 'ISE Lab 3' },
    { title: 'Garden hose overflowing on walkway', location: 'Library Garden Area' },
  ];

  const handleClaimAndSolve = (bountyId, pts) => {
    const targetBounty = bounties.find(b => b.id === bountyId);
    let resolvedIds = [];
    try { resolvedIds = JSON.parse(localStorage.getItem(resolvedKey) || '[]'); } catch { /* ignore malformed cache */ }
    if (!targetBounty || targetBounty.status !== 'DISPATCHED' || targetBounty.reporterId === currentUser?.id || resolvedIds.includes(bountyId)) return;
    localStorage.setItem(resolvedKey, JSON.stringify([...resolvedIds, bountyId]));
    setBounties(prev => prev.map(b => {
      if (b.id === bountyId) {
        return {
          ...b,
          status: 'RESOLVED',
          actionTaken: 'Verified & physically resolved on-site by student responder.'
        };
      }
      return b;
    }));
    const verifiedPoints = Math.min(35, Math.max(0, Number(pts) || 0));
    setUserCredits(c => c + verifiedPoints);
    if (addContribution) {
      addContribution({
        action: `Resolved Bounty: ${targetBounty?.title || bountyId}`,
        points: verifiedPoints,
        type: 'BOUNTY',
        status: 'APPROVED',
      });
    }
    triggerEcoCelebration({
      title: '🏆 Bounty Resolved!',
      message: `Campus waste issue physically fixed on-site. +${verifiedPoints} EcoCredits for direct impact action!`,
      points: verifiedPoints,
      badge: `+${verifiedPoints} EcoCredits`
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newBounty.title) return;

    const bnt = {
      id: `BNT-${Math.floor(104 + Math.random() * 800)}`,
      title: newBounty.title,
      location: newBounty.location || "Campus Grounds",
      reporter: currentUser?.name || "Current Student (Eco-Watchdog)",
      reporterId: currentUser?.id,
      reportedAt: "Just now",
      energySavedEst: "Calculating impact...",
      bountyPts: 25,
      status: "DISPATCHED",
      actionTaken: "Facility maintenance automated ticket generated.",
      ...(photoPreview ? { photo: photoPreview } : {}),
    };

    setBounties([bnt, ...bounties]);
    triggerEcoCelebration({
      title: '🚨 Bounty Report Filed!',
      message: "Campus resource waste alert dispatched to facilities team. You are guarding RNSIT's eco-future!",
      points: 0,
      badge: 'Points after verified fix'
    });
    setNewBounty({ title: '', location: '', type: 'Electricity / Phantom Load' });
    setPhotoPreview(null);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">Resource Conservation</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            ⚡ Resource Leak Bounties
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Spot empty rooms with running projectors, fans left on, or dripping taps — report them and earn EcoCredits while helping campus maintenance!
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          aria-expanded={isFormOpen}
          aria-controls="bounty-report-form"
          className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center gap-2"
        >
          <IconAlertTriangle className="w-4 h-4" aria-hidden="true" />
          {isFormOpen ? '✕ Close Form' : '+ Report Waste'}
        </button>
      </div>

      {/* Form Drawer */}
      {isFormOpen && (
        <form
          id="bounty-report-form"
          onSubmit={handleSubmit}
          className="bg-slate-900 p-6 rounded-2xl border border-amber-500/30 space-y-4 shadow-xl"
          aria-label="Report a resource waste bounty"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white">Log Unattended Power or Water Waste</h3>
            <span className="text-xs text-amber-400 font-bold">Earn 25 EcoCredits only after a dispatched issue is fixed</span>
          </div>

          {/* Quick Preset Chips */}
          <div>
            <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase tracking-wider" id="preset-label">
              Quick Fill — tap to auto-fill:
            </span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="preset-label">
              {QUICK_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Fill form with: ${p.title} at ${p.location}`}
                  onClick={() => setNewBounty({ ...newBounty, title: p.title, location: p.location })}
                  className="text-[10px] bg-slate-950 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 px-2.5 py-1 rounded-lg transition"
                >
                  ⚡ {p.title.split(' in ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="bounty-title" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                What is being wasted? <span className="text-amber-500">*</span>
              </label>
              <input
                id="bounty-title"
                type="text"
                placeholder="e.g. AC left on in empty Lab 302"
                value={newBounty.title}
                onChange={e => setNewBounty({ ...newBounty, title: e.target.value })}
                maxLength={120}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              />
              <span className="text-[9px] text-slate-600 text-right">{newBounty.title.length}/120</span>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="bounty-location" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Location <span className="text-amber-500">*</span>
              </label>
              <input
                id="bounty-location"
                type="text"
                placeholder="e.g. ECE Block, 2nd Floor Room 204"
                value={newBounty.location}
                onChange={e => setNewBounty({ ...newBounty, location: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <button
              type="submit"
              aria-label="Submit resource waste report"
              className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs py-2 rounded-xl transition shadow-lg shadow-amber-600/30 self-end"
            >
              🚨 Submit Report
            </button>
          </div>

          {/* Photo Upload */}
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#7ea893', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              📷 Evidence Photo (Optional)
            </label>
            {photoPreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={photoPreview} alt="Evidence" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(52,211,153,0.2)' }} />
                <button onClick={() => setPhotoPreview(null)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(239,68,68,0.8)', border: 'none', borderRadius: 6, color: 'white', fontSize: 11, padding: '2px 8px', cursor: 'pointer', fontWeight: 700 }}>✕ Remove</button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: '1px dashed rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.04)', cursor: 'pointer', fontSize: 12, color: '#7ea893' }}>
                <span style={{ fontSize: 18 }}>📎</span>
                <span>Tap to attach photo evidence</span>
                <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setPhotoPreview(ev.target.result);
                    reader.readAsDataURL(file);
                  }
                }} />
              </label>
            )}
          </div>
        </form>
      )}

      {/* Bounties Feed */}
      <div className="space-y-3" role="feed" aria-label="Reported resource bounties">
        {bounties.map(bnt => (
          <div
            key={bnt.id}
            className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
            aria-label={`Bounty ${bnt.id}: ${bnt.title}`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold bg-slate-950 text-amber-400 px-2 py-0.5 rounded border border-slate-800">
                  {bnt.id}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  bnt.status === 'RESOLVED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {bnt.status === 'RESOLVED' ? '✓ Resolved' : '⏳ In Progress'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{bnt.reportedAt}</span>
              </div>

              <h3 className="font-extrabold text-white text-base">{bnt.title}</h3>
              <p className="text-xs text-slate-400">📍 {bnt.location} • Reported by: <strong className="text-slate-300">{bnt.reporter}</strong></p>
              <p className="text-xs text-emerald-400 font-medium">✅ {bnt.actionTaken}</p>
              {bnt.photo && <img src={bnt.photo} alt="Evidence" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />}
            </div>

            <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-800 gap-2">
              <div className="text-right">
                <div className="text-xs font-mono font-extrabold text-amber-400">
                  +{bnt.bountyPts} PTS
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  {bnt.energySavedEst}
                </div>
              </div>

              {bnt.status === 'DISPATCHED' && bnt.reporterId !== currentUser?.id && (
                <button
                  onClick={() => handleClaimAndSolve(bnt.id, bnt.bountyPts)}
                  aria-label={`Resolve bounty ${bnt.id} and claim ${bnt.bountyPts} EcoCredits`}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 whitespace-nowrap"
                >
                  <IconCheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Resolve &amp; Claim</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
