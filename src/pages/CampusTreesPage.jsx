import React, { useState } from 'react';
import { IconLeaf, IconCheckCircle, IconMapPin, IconHeart } from '../components/Icons';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { Link } from '../router/Router';
import { CampusMap } from '../components/CampusMap';
import { actionMesh } from '../services/actionMeshService';
import { useAuth } from '../contexts/AuthContext';

export const CampusTreesPage = ({ trees, setTrees, userCredits, setUserCredits }) => {
  const { currentUser, addContribution, isOperator, isStudent } = useAuth();
  const [filter, setFilter] = useState('ALL');
  const [adoptingTree, setAdoptingTree] = useState(null);
  const [wateringLogs, setWateringLogs] = useState({});
  const [expandedLog, setExpandedLog] = useState(null);

  const handleWater = (treeId) => {
    const targetTree = trees.find(t => t.id === treeId);
    setTrees(prev => prev.map(t => {
      if (t.id === treeId) {
        return {
          ...t,
          lastWatered: "Just now",
          waterDueInHours: 24,
          health: "Flourishing"
        };
      }
      return t;
    }));

    // Log the watering entry
    const now = new Date();
    const logEntry = `${now.toLocaleDateString('en-IN')} at ${now.toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}`;
    setWateringLogs(prev => ({
      ...prev,
      [treeId]: [...(prev[treeId] || []), logEntry].slice(-5),
    }));

    // Auto-resolve corresponding Action Mesh ticket if open
    const matchingTicket = actionMesh.getTickets().find(t => t.targetEntityId === treeId && t.status !== 'RESOLVED');
    if (matchingTicket) {
      actionMesh.resolveTicket(matchingTicket.id, "Watered & sustained by student volunteer squad.");
    }

    triggerEcoCelebration({
      title: 'Grounds watering logged',
      message: `${targetTree?.species || treeId} watered by the grounds team. Any open eco-ticket was resolved.`,
      points: 0,
      badge: 'Grounds team'
    });
  };

  const handleAdopt = (tree) => {
    const adopterName = currentUser?.name ? `${currentUser.name} (${currentUser.usn || 'Student'})` : 'Student Volunteer';
    setTrees(prev => prev.map(t => {
      if (t.id === tree.id) {
        return {
          ...t,
          adoptedBy: adopterName
        };
      }
      return t;
    }));

    setUserCredits(prev => prev + 50);
    if (addContribution) {
      addContribution({
        action: `Adopted Campus Tree: ${tree.species}`,
        points: 50,
        type: 'TREE',
        status: 'APPROVED',
      });
    }

    triggerEcoCelebration({
      title: '🌿 Tree Adopted!',
      message: `You are now the proud guardian of ${tree.species} at ${tree.location}. Earned +50 EcoCredits!`,
      points: 50,
      badge: '+50 EcoCredits'
    });

    setAdoptingTree(null);
  };

  const filteredTrees = trees.filter(tree => {
    if (filter === 'ATTENTION') return tree.health === 'Needs Attention';
    if (filter === 'OPEN') return tree.adoptedBy === 'Open for Adoption';
    if (filter === 'FLOURISHING') return tree.health === 'Flourishing' || tree.health === 'Excellent';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">Campus Flora & Biodiversity</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Campus Flora GIS Digital Twin & Tree Adoption
          </h1>
          <p className="text-xs text-slate-400">
            Adopt, water, and care for campus trees to earn EcoCredits and help offset carbon emissions across RNSIT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-bold">
            Total Sequestration: 1.24 Tons CO2/yr
          </span>
        </div>
      </div>

      {/* Mapbox Campus Flora Map */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Live Campus Flora Map — {trees.length} Geo-Tagged Specimens
          </span>
        </div>
        <CampusMap trees={trees} mode="trees" height="380px" />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'ALL', label: `All Trees (${trees.length})` },
            { id: 'ATTENTION', label: `⚠️ Needs Water (${trees.filter(t => t.health === 'Needs Attention').length})` },
            { id: 'OPEN', label: `🌱 Open to Adopt (${trees.filter(t => t.adoptedBy === 'Open for Adoption').length})` },
            { id: 'FLOURISHING', label: `🌿 Flourishing (${trees.filter(t => t.health === 'Flourishing' || t.health === 'Excellent').length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 700,
                background: filter === tab.id ? 'rgba(52,211,153,0.2)' : 'rgba(15,25,20,0.8)',
                color: filter === tab.id ? '#34d399' : '#64748b',
                border: filter === tab.id ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(51,65,55,0.6)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Geo-Tagged Trees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTrees.map(tree => (
          <div key={tree.id} className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-emerald-500/40 transition flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <img src="/plants/tree-leaf.png" alt={`${tree.species} leaf`} className="tree-leaf-art" />
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  tree.health === 'Flourishing' || tree.health === 'Excellent'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {tree.health}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono font-bold bg-slate-950 text-emerald-400 px-2 py-0.5 rounded border border-slate-800">
                  {tree.id}
                </span>
                <h3 className="font-extrabold text-white text-base mt-1.5">{tree.species}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <IconMapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  {tree.location}
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-slate-400">Guardian:</span>
                  <span className={`font-bold truncate max-w-[140px] ${tree.adoptedBy === 'Open for Adoption' ? 'text-amber-400' : 'text-slate-200'}`}>
                    {tree.adoptedBy}
                  </span>
                </div>
                <div><span className="text-slate-400">CO2 Absorbed:</span> <strong className="text-emerald-400 font-mono block">{tree.co2AbsorbedPerYear}</strong></div>
                <div><span className="text-slate-400">Last Watered:</span> <strong className="text-slate-300 block">{tree.lastWatered}</strong></div>
              </div>

              {tree.health === 'Needs Attention' && (
                <div className="bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl text-[11px] text-amber-300 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    Auto-Assigned Bounty
                  </span>
                  <Link to="/bounties" className="text-[10px] text-white bg-amber-600/40 hover:bg-amber-600 px-2 py-0.5 rounded font-mono font-bold transition">
                    View in /bounties ➔
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 space-y-2">
              {isOperator && (
                <button
                  onClick={() => handleWater(tree.id)}
                  className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <IconLeaf className="w-4 h-4" />
                  Log grounds-team watering
                </button>
              )}

              {wateringLogs[tree.id]?.length > 0 && (
                <div>
                  <button
                    onClick={() => setExpandedLog(expandedLog === tree.id ? null : tree.id)}
                    style={{ fontSize: 11, color: '#7ea893', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700 }}
                  >
                    {expandedLog === tree.id ? '▲ Hide Log' : `📋 Watering Log (${wateringLogs[tree.id].length})`}
                  </button>
                  {expandedLog === tree.id && (
                    <div style={{ marginTop: 6, padding: '8px 12px', background: 'rgba(52,211,153,0.04)', borderRadius: 8, border: '1px solid rgba(52,211,153,0.1)' }}>
                      {wateringLogs[tree.id].map((entry, i) => (
                        <div key={i} style={{ fontSize: 11, color: '#7ea893', fontFamily: 'JetBrains Mono, monospace', padding: '2px 0' }}>
                          💧 {entry}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {isStudent && (
                <Link
                  to="/adopt"
                  className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  style={{ textDecoration: 'none' }}
                >
                  <IconHeart className="w-3.5 h-3.5" />
                  Adopt a plant you can water daily ➔
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Adoption Confirmation Modal */}
      {adoptingTree && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="adopt-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setAdoptingTree(null)}
          onKeyDown={e => {
            if (e.key === 'Escape') setAdoptingTree(null);
          }}
          tabIndex={-1}
        >
          <div
            className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <img src="/plants/tree-leaf.png" alt={`${adoptingTree.species} leaf`} className="tree-leaf-art" />
              <div>
                <h3 id="adopt-dialog-title" className="text-lg font-black text-white">{adoptingTree.species}</h3>
                <p className="text-xs text-slate-400">{adoptingTree.location}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              By adopting this tree, you commit to monitoring its soil moisture and logging routine watering during your weekly campus schedule. You will be credited on the tree's digital twin and receive <strong>+50 EcoCredits</strong>!
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Adopter Name:</span>
                <span className="text-emerald-400 font-bold">{currentUser?.name || 'Student Volunteer'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Annual Offset:</span>
                <span className="text-white font-mono">{adoptingTree.co2AbsorbedPerYear}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setAdoptingTree(null)}
                aria-label="Cancel tree adoption and close modal"
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Cancel (Esc)
              </button>
              <button
                onClick={() => handleAdopt(adoptingTree)}
                aria-label={`Confirm adoption of ${adoptingTree.species} for 50 EcoCredits`}
                className="btn-eco px-4 py-2 text-xs rounded-xl font-bold"
              >
                Confirm Adoption (+50 EcoCredits)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
