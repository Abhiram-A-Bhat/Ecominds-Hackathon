// ─── Student Profile Page ────────────────────────────────────────────────────
// Shows per-user EcoCredits, history, pending contributions, and rewards.

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from '../router/Router';
import { getEcoLevel } from '../utils/ecoLevels';

const TYPE_META = {
  SCAN:       { icon: '📷', label: 'AI Scanner',     color: '#34d399' },
  EWASTE:     { icon: '♻️', label: 'E-Waste',         color: '#6ee7b7' },
  TREE:       { icon: '🌳', label: 'Tree Care',        color: '#4ade80' },
  FOOD:       { icon: '🍱', label: 'Food Waste',       color: '#fbbf24' },
  BOUNTY:     { icon: '🏆', label: 'Bounty',           color: '#a78bfa' },
  HANDMEDOWN: { icon: '🤝', label: 'Hand-Me-Down',    color: '#38bdf8' },
  OTHER:      { icon: '⭐', label: 'Other',             color: '#e2e8f0' },
};

export function StudentProfilePage() {
  const { currentUser, isAdmin, logout } = useAuth();
  const [tab, setTab] = useState('history');
  const [ewasteDeposits, setEwasteDeposits] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ecominds-ewaste-deposits-v1') || '[]'); } catch { return []; }
  });
  useEffect(() => {
    const refresh = () => {
      try { setEwasteDeposits(JSON.parse(localStorage.getItem('ecominds-ewaste-deposits-v1') || '[]')); } catch { setEwasteDeposits([]); }
    };
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); };
  }, []);

  if (!currentUser) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p>You must be logged in to view your profile.</p>
        <Link to="/login" className="text-emerald-400 hover:underline mt-2 block">← Sign In</Link>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-8 text-center max-w-xl mx-auto mt-8 shadow-2xl">
          <div style={{ fontSize: 56, marginBottom: 16 }}>🛡️</div>
          <h2 className="text-2xl font-black text-white mb-2">{currentUser.name}</h2>
          <div className="inline-block bg-purple-950/60 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold mb-4">
            {currentUser.designation || 'Faculty Administrator'} • {currentUser.department}
          </div>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            Official institutional administrator account for RNSIT Ecominds.
            You have full authorization to verify student e-waste drop-offs, award EcoCredits via the AI Intake Station, and approve Hand-Me-Downs donations.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/admin-verify" className="btn-eco px-4 py-2 text-xs rounded-xl no-underline font-bold">
              🔍 Open Verification Desk
            </Link>
            <Link to="/scanner" className="btn-ghost px-4 py-2 text-xs rounded-xl no-underline font-bold">
              📷 Lab 104 AI Scanner
            </Link>
            <Link to="/admin" className="btn-ghost px-4 py-2 text-xs rounded-xl no-underline font-bold">
              📊 IoT Console
            </Link>
            <button onClick={logout} className="text-xs font-bold text-red-300 border border-red-500/30 bg-red-900/20 hover:bg-red-900/40 px-4 py-2 rounded-xl transition">Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  const approved = currentUser.history?.filter(h => h.status === 'APPROVED') || [];
  const pending  = currentUser.history?.filter(h => h.status === 'PENDING')  || [];
  const rejected = currentUser.history?.filter(h => h.status === 'REJECTED') || [];

  const ecoLevel = getEcoLevel(currentUser.lifetimePoints ?? currentUser.credits ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">My Profile</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">👤 My Ecominds Profile</h1>
        </div>
        <button
          onClick={logout}
          className="text-xs font-bold text-red-400 border border-red-500/30 bg-red-900/20 hover:bg-red-900/40 px-4 py-2 rounded-xl transition"
        >
          Sign Out
        </button>
      </div>

      {/* Profile card */}
      <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div style={{
          width: 72, height: 72, borderRadius: 20, background: 'rgba(52,211,153,0.12)',
          border: '2px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 36, flexShrink: 0,
        }}>
          {currentUser.avatar}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-black text-white">{currentUser.name}</h2>
            {isAdmin && (
              <span className="text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">ADMIN</span>
            )}
            {currentUser.financialAid && (
              <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">Financial Aid</span>
            )}
          </div>
          {currentUser.usn && (
            <p className="text-xs font-mono text-emerald-400 font-bold">{currentUser.usn}</p>
          )}
          {currentUser.branch && (
            <p className="text-xs text-slate-400">{currentUser.branch} · Year {currentUser.year} · Sem {currentUser.semester}</p>
          )}
          {currentUser.designation && (
            <p className="text-xs text-slate-400">{currentUser.designation}</p>
          )}
          {currentUser.email && (
            <p className="text-xs text-slate-500">{currentUser.email}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center sm:border-l sm:border-slate-800 sm:pl-6">
          <div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{currentUser.credits ?? 0}</div>
            <div className="text-[10px] text-slate-500 font-bold">EcoCredits</div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400 font-mono">{currentUser.xp ?? 0}</div>
            <div className="text-[10px] text-slate-500 font-bold">Total XP</div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-400 font-mono">Lv.{ecoLevel.level}</div>
            <div className="text-[10px] text-slate-500 font-bold">Level</div>
          </div>
        </div>
      </div>

      {/* EcoCredit level progress */}
      {!isAdmin && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-white">{ecoLevel.title}</span>
            <span className="text-slate-400">{ecoLevel.next == null ? `${ecoLevel.points.toLocaleString()} lifetime points · Max level` : `${ecoLevel.points.toLocaleString()} / ${ecoLevel.next.toLocaleString()} lifetime points`}</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              style={{ width: `${ecoLevel.progress}%`, transition: 'width 1s ease' }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Profile Sections">
        {[
          { id: 'history', label: `📋 History (${currentUser.history?.length || 0})` },
          { id: 'pending', label: `⏳ Pending (${pending.length})` },
          { id: 'rewards', label: `🎁 Rewards (${currentUser.rewards?.length || 0})` },
          { id: 'handmedowns', label: `🤝 Pass-The-Torch (${(currentUser.handMeDowns?.donated?.length || 0) + (currentUser.handMeDowns?.received?.length || 0)})` },
          { id: 'ewaste', label: `♻️ My E-waste (${ewasteDeposits.filter(d => d.studentId === currentUser.id).length})` },
        ].map(t => (
          <button 
            key={t.id} 
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)} 
            style={{
              padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              background: tab === t.id ? 'rgba(52,211,153,0.2)' : 'rgba(15,25,20,0.8)',
              color: tab === t.id ? '#34d399' : '#64748b',
              border: tab === t.id ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(51,65,55,0.6)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* History tab */}
      {tab === 'history' && (
        <div 
          id="panel-history"
          role="tabpanel"
          aria-labelledby="tab-history"
          className="space-y-3"
        >
          {(currentUser.history?.length || 0) === 0 ? (
            <div className="text-center py-12 text-slate-500 font-semibold">No activity yet. Start taking eco-actions on campus!</div>
          ) : (
            currentUser.history.map(h => {
              const meta = TYPE_META[h.type] || TYPE_META.OTHER;
              return (
                <div key={h.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.color + '15', border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{h.action}</div>
                    <div className="text-xs text-slate-500">{meta.label} · {h.date}</div>
                    {h.adminNote && <div className="text-xs text-red-400 mt-0.5">Note: {h.adminNote}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{ fontSize: 13, fontWeight: 900, color: h.status === 'APPROVED' ? '#34d399' : h.status === 'REJECTED' ? '#fca5a5' : '#fbbf24' }}>
                      {h.status === 'APPROVED' ? `+${h.points}` : h.status === 'REJECTED' ? '—' : '~' + h.points}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
                      background: h.status === 'APPROVED' ? 'rgba(52,211,153,0.12)' : h.status === 'REJECTED' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                      color: h.status === 'APPROVED' ? '#34d399' : h.status === 'REJECTED' ? '#fca5a5' : '#fbbf24',
                      border: `1px solid ${h.status === 'APPROVED' ? 'rgba(52,211,153,0.25)' : h.status === 'REJECTED' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                    }}>
                      {h.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'ewaste' && (
        <section id="panel-ewaste" role="tabpanel" aria-labelledby="tab-ewaste" className="space-y-3">
          {ewasteDeposits.filter(d => d.studentId === currentUser.id).length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">No e-waste deposits have been logged for your account.</div>
          ) : ewasteDeposits.filter(d => d.studentId === currentUser.id).map(deposit => (
            <article key={deposit.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="font-bold text-white">{deposit.name}</h3><p className="text-xs text-slate-400">{deposit.weightKg} kg · {deposit.condition} · {new Date(deposit.createdAt).toLocaleDateString()}</p></div>
              <div className="text-right"><span className={`text-xs font-bold ${deposit.status === 'APPROVED' ? 'text-emerald-300' : 'text-amber-300'}`}>{deposit.status === 'APPROVED' ? `+${deposit.approvedPoints} EcoCredits` : 'Awaiting staff approval'}</span><p className="text-[10px] text-slate-500">{deposit.analysis?.summary}</p></div>
            </article>
          ))}
        </section>
      )}

      {/* Pending tab */}
      {tab === 'pending' && (
        <div 
          id="panel-pending"
          role="tabpanel"
          aria-labelledby="tab-pending"
          className="space-y-3"
        >
          {pending.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-semibold">No pending contributions. All verified! 🎉</div>
          ) : (
            <>
              <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 font-semibold">
                ⏳ These contributions are awaiting admin verification. EcoCredits will be credited once approved.
              </div>
              {pending.map(h => {
                const meta = TYPE_META[h.type] || TYPE_META.OTHER;
                return (
                  <div key={h.id} className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
                    <div style={{ fontSize: 20 }}>{meta.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{h.action}</div>
                      <div className="text-xs text-slate-500">{h.date} · Estimated: +{h.points} EcoCredits</div>
                    </div>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">⏳ PENDING</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Rewards tab */}
      {tab === 'rewards' && (
        <div 
          id="panel-rewards"
          role="tabpanel"
          aria-labelledby="tab-rewards"
          className="space-y-4"
        >
          <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>🎁</span> EcoCredits Rewards &amp; Active Vouchers
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Present your active digital voucher codes at campus canteen or library counters.
              </p>
            </div>
            <Link to="/leaderboard" className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 text-xs rounded-xl no-underline font-bold whitespace-nowrap transition">
              Redeem More Perks →
            </Link>
          </div>

          {(currentUser.rewards?.length || 0) === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
              <span className="text-3xl block mb-2">🎟️</span>
              <p className="text-sm text-slate-400 font-medium">No rewards redeemed yet.</p>
              <p className="text-xs text-slate-500 mt-1">Earn EcoCredits across campus to claim cafeteria meal vouchers and library printing perks!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentUser.rewards.map(r => (
                <div key={r.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg">
                  <div className="flex items-start gap-3">
                    <span style={{ fontSize: 32 }} className="flex-shrink-0">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{r.name}</h4>
                      <div className="text-[11px] text-slate-500 mt-0.5">Redeemed {r.redeemedAt}</div>
                      {r.code && (
                        <div className="mt-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-dashed border-emerald-500/30 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Code:</span>
                          <span className="text-xs font-mono font-black text-emerald-400">{r.code}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-400">Status: <strong className="text-emerald-400">ACTIVE</strong></span>
                    <span className="text-xs font-mono font-black text-amber-400">{r.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pass-The-Torch tab */}
      {tab === 'handmedowns' && (
        <div 
          id="panel-handmedowns"
          role="tabpanel"
          aria-labelledby="tab-handmedowns"
          className="space-y-6"
        >
          <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>🤝</span> Pass-The-Torch Circular Exchange
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Keep uniforms, blazers, drafters, and textbooks circulating within RNSIT.
              </p>
            </div>
            <Link to="/exchange" className="btn-eco px-4 py-2 text-xs rounded-xl no-underline font-bold whitespace-nowrap">
              Open Exchange Hub →
            </Link>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>🎁</span> Academic Gear I Donated ({currentUser.handMeDowns?.donated?.length || 0})
              </h3>
            </div>
            {(currentUser.handMeDowns?.donated?.length || 0) === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                <span className="text-3xl block mb-2">👔</span>
                <p className="text-sm text-slate-400 font-medium">You haven't listed any academic gear yet.</p>
                <p className="text-xs text-slate-500 mt-1">Pass down lab coats, calculators, or blazers to earn +35 to +70 EcoCredits!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentUser.handMeDowns.donated.map((d, i) => (
                  <div key={i} className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-emerald-500/30 transition">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          {d.category || 'ACADEMIC GEAR'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {d.date || 'Active Listing'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-2">{d.title}</h4>
                      {d.condition && <p className="text-xs text-slate-400">Condition: {d.condition}</p>}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                      <span className="font-mono font-bold text-emerald-400">+{d.points || 50} EcoCredits</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {d.status || 'AVAILABLE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>🎒</span> Items I Reserved / Received ({currentUser.handMeDowns?.received?.length || 0})
              </h3>
            </div>
            {(currentUser.handMeDowns?.received?.length || 0) === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                <span className="text-3xl block mb-2">📚</span>
                <p className="text-sm text-slate-400 font-medium">No items claimed yet.</p>
                <p className="text-xs text-slate-500 mt-1">Browse free uniforms, mini drafters, and lecture notes in Pass-The-Torch!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentUser.handMeDowns.received.map((d, i) => (
                  <div key={i} className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                          RESERVED GEAR
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">{d.claimedAt || 'Recently'}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-2">{d.title}</h4>
                      {d.donorName && <p className="text-xs text-slate-400">Passed down by: {d.donorName}</p>}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                      <span className="text-slate-400 text-[11px]">📍 Pickup: ECE Lab 104</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        READY FOR PICKUP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
