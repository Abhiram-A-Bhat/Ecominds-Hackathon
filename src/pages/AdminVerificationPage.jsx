// ─── Admin Verification Page ──────────────────────────────────────────────────
// Lists ALL pending student contributions across the platform.
// Admin can approve with custom points or reject with a note.

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { Link } from '../router/Router';

const TYPE_META = {
  SCAN:       { icon: '📷', label: 'AI Scanner',      color: '#34d399' },
  EWASTE:     { icon: '♻️', label: 'E-Waste',          color: '#6ee7b7' },
  TREE:       { icon: '🌳', label: 'Tree Care',         color: '#4ade80' },
  FOOD:       { icon: '🍱', label: 'Food Waste',        color: '#fbbf24' },
  BOUNTY:     { icon: '🏆', label: 'Bounty',            color: '#a78bfa' },
  HANDMEDOWN: { icon: '🤝', label: 'Hand-Me-Down',     color: '#38bdf8' },
  OTHER:      { icon: '⭐', label: 'Other',              color: '#e2e8f0' },
};

export function AdminVerificationPage() {
  const { currentUser, isOperator: isAdmin, getAllUsers, approveContribution, rejectContribution } = useAuth();
  const [users, setUsers] = useState(() => getAllUsers());
  const [rejectForm, setRejectForm] = useState({ open: false, studentId: null, contributionId: null, reason: '' });
  const [customPoints, setCustomPoints] = useState({});
  const [filter, setFilter] = useState('PENDING');

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <p className="text-red-400 font-bold text-lg">Staff Access Required</p>
        <p className="text-slate-500 text-sm mt-2">This page is available to the assigned Eco Ranger and administrators.</p>
        <Link to="/" className="mt-4 inline-block text-emerald-400 hover:underline text-sm">← Back to Home</Link>
      </div>
    );
  }

  const refresh = () => setUsers(getAllUsers());

  const allContributions = users.flatMap(u =>
    u.history.map(h => ({ ...h, studentId: u.id, studentName: u.name, studentUSN: u.usn || u.username, branch: u.department || u.branch, avatar: u.avatar }))
  );

  const filtered = allContributions.filter(c => {
    if (filter === 'PENDING') return c.status === 'PENDING';
    if (filter === 'APPROVED') return c.status === 'APPROVED';
    if (filter === 'REJECTED') return c.status === 'REJECTED';
    return true;
  });

  const pendingCount = allContributions.filter(c => c.status === 'PENDING').length;

  const handleApprove = (studentId, contributionId, defaultPoints) => {
    const pts = parseInt(customPoints[contributionId] ?? defaultPoints, 10) || defaultPoints;
    if (!approveContribution(studentId, contributionId, pts)) return;
    refresh();
    triggerEcoCelebration({
      title: '✅ Contribution Approved!',
      message: `+${pts} EcoCredits sent to student account. Logged to NAAC audit trail.`,
      points: pts,
      badge: `+${pts} EcoCredits Allotted`,
      variant: 'THUMBS_UP'
    });
  };

  const handleRejectSubmit = () => {
    if (!rejectForm.reason.trim()) return;
    rejectContribution(rejectForm.studentId, rejectForm.contributionId, rejectForm.reason);
    setRejectForm({ open: false, studentId: null, contributionId: null, reason: '' });
    refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">Admin Verification</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            🔍 Contribution Verification & Points Allotment
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review student eco-contributions, verify evidence, and allot EcoCredits. All approvals are logged to the NAAC audit trail.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              ⏳ {pendingCount} Pending
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['PENDING','APPROVED','REJECTED','ALL'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: filter === f ? 'rgba(52,211,153,0.15)' : 'rgba(15,25,20,0.8)',
            color: filter === f ? '#34d399' : '#64748b',
            border: filter === f ? '1px solid rgba(52,211,153,0.35)' : '1px solid rgba(51,65,55,0.6)',
            cursor: 'pointer',
          }}>
            {f === 'PENDING' ? `⏳ Pending (${pendingCount})` : f === 'ALL' ? '🗂️ All' : f === 'APPROVED' ? '✅ Approved' : '❌ Rejected'}
          </button>
        ))}
      </div>

      {/* Contributions list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 font-semibold">
          {filter === 'PENDING' ? '🎉 No pending contributions! All caught up.' : 'No records to show.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const meta = TYPE_META[c.type] || TYPE_META.OTHER;
            const defaultPts = c.points || 25;
            return (
              <div
                key={`${c.studentId}-${c.id}`}
                className="bg-slate-900/90 border rounded-2xl p-5 space-y-3"
                style={{ borderColor: c.status === 'PENDING' ? 'rgba(245,158,11,0.25)' : c.status === 'APPROVED' ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `${meta.color}15`, border: `1px solid ${meta.color}30`, fontSize: 20, flexShrink: 0,
                    }}>
                      {meta.icon}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{c.action}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{c.avatar} {c.studentName}</span>
                        <span className="font-mono text-slate-500">({c.studentUSN})</span>
                        {c.branch && <span className="text-slate-500">· {c.branch}</span>}
                        <span className="text-slate-600">· {c.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                      background: meta.color + '15', color: meta.color, border: `1px solid ${meta.color}30`
                    }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                      background: c.status === 'PENDING' ? 'rgba(245,158,11,0.15)' : c.status === 'APPROVED' ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
                      color: c.status === 'PENDING' ? '#fbbf24' : c.status === 'APPROVED' ? '#34d399' : '#fca5a5',
                      border: c.status === 'PENDING' ? '1px solid rgba(245,158,11,0.3)' : c.status === 'APPROVED' ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(239,68,68,0.3)',
                    }}>
                      {c.status === 'PENDING' ? '⏳ PENDING' : c.status === 'APPROVED' ? '✅ APPROVED' : '❌ REJECTED'}
                    </span>
                  </div>
                </div>

                {c.status === 'PENDING' && (
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-800/60">
                    <label className="text-xs font-bold text-slate-400 flex-shrink-0">Points to Allot:</label>
                    <input
                      type="number" min={0} max={500}
                      value={customPoints[c.id] ?? defaultPts}
                      onChange={e => setCustomPoints(prev => ({ ...prev, [c.id]: e.target.value }))}
                      className="w-20 bg-slate-950 border border-slate-700 text-emerald-400 rounded-lg px-2 py-1 text-sm font-mono font-bold outline-none"
                    />
                    <button
                      onClick={() => handleApprove(c.studentId, c.id, defaultPts)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition"
                    >
                      ✅ Approve & Send Credits
                    </button>
                    <button
                      onClick={() => setRejectForm({ open: true, studentId: c.studentId, contributionId: c.id, reason: '' })}
                      className="bg-red-900/40 hover:bg-red-800 border border-red-500/30 text-red-300 font-bold px-4 py-1.5 rounded-lg text-xs transition"
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}

                {c.status === 'APPROVED' && (
                  <div className="text-xs text-emerald-400 font-semibold pt-1 border-t border-slate-800/60">
                    ✅ +{c.points} EcoCredits allotted on {c.date}
                  </div>
                )}

                {c.status === 'REJECTED' && c.adminNote && (
                  <div className="text-xs text-red-400 font-semibold pt-1 border-t border-slate-800/60">
                    ❌ Rejected: {c.adminNote}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectForm.open && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setRejectForm({ open: false, studentId: null, contributionId: null, reason: '' });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setRejectForm({ open: false, studentId: null, contributionId: null, reason: '' });
            }
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div style={{ background: 'var(--surface-solid)', color: 'var(--text)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: 24, maxWidth: 440, width: '100%', boxShadow: 'var(--shadow-card)' }}>
            <h3 id="reject-dialog-title" className="text-base font-black text-white mb-2">❌ Reject Contribution</h3>
            <p className="text-xs text-slate-400 mb-3">Please provide a constructive reason. The student will be notified directly in their history profile.</p>
            <label htmlFor="reject-reason" className="sr-only">Rejection Reason</label>
            <textarea
              id="reject-reason"
              rows={3}
              value={rejectForm.reason}
              onChange={e => setRejectForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Photo proof unclear. Please re-submit with clear lighting."
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm outline-none resize-none mb-4 focus:border-red-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={handleRejectSubmit} 
                aria-label="Confirm rejection of contribution"
                className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded-xl text-sm transition shadow-lg shadow-red-700/20"
              >
                Confirm Rejection
              </button>
              <button 
                onClick={() => setRejectForm({ open: false, studentId: null, contributionId: null, reason: '' })} 
                aria-label="Cancel rejection and close modal"
                className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-sm transition"
              >
                Cancel (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
