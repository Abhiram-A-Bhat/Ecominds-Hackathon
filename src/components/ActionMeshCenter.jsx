import React, { useState, useEffect } from 'react';
import { actionMesh } from '../services/actionMeshService';
import { dispatchWithHermesAgent } from '../services/hermesService';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { Link, useRouter } from '../router/Router';

export function ActionMeshCenter({
  isOpen,
  onClose,
  bins,
  onEmptyBin,
  trees,
  setTrees,
  userCredits,
  setUserCredits,
  onAddXp
}) {
  const [tickets, setTickets] = useState(actionMesh.getTickets());
  const [filter, setFilter] = useState('ACTIVE'); // 'ACTIVE' | 'RESOLVED' | 'ALL'
  const [hermesLoading, setHermesLoading] = useState({});
  const { navigate } = useRouter();

  useEffect(() => {
    return actionMesh.subscribe(updated => setTickets([...updated]));
  }, []);

  if (!isOpen) return null;

  const handleHermesDispatch = async (ticket) => {
    setHermesLoading(prev => ({ ...prev, [ticket.id]: true }));
    try {
      const res = await dispatchWithHermesAgent(ticket);
      if (res && res.dispatch) {
        const d = res.dispatch;
        // Mutate dependent state
        if (ticket.category === 'IOT_SURGE' && ticket.targetEntityId && onEmptyBin) {
          onEmptyBin(ticket.targetEntityId);
        } else if (ticket.category === 'FLORA_HEALTH' && ticket.targetEntityId && setTrees) {
          setTrees(prev => prev.map(t => {
            if (t.id === ticket.targetEntityId) {
              return { ...t, health: 'Flourishing', waterDueInHours: 24, lastWatered: 'Just now' };
            }
            return t;
          }));
        }

        // Reassign & Resolve with Hermes plan
        actionMesh.reassignTicket(ticket.id, {
          name: d.assigned_to?.name || "Hermes Rapid Actuator Unit",
          role: d.assigned_to?.role || "Autonomous Operator",
          id: `HERMES-${Math.floor(100 + Math.random() * 900)}`,
          type: d.assigned_to?.type || "AUTOMATED"
        });

        actionMesh.resolveTicket(
          ticket.id,
          `🤖 Resolved by Hermes Agent (v0.22.1 • Groq Qwen-27B): ${d.resolution_summary || 'Tactical remediation executed.'}`
        );

        setUserCredits(c => c + (d.bounty_points || 50));
        if (onAddXp) onAddXp(80);
        triggerEcoCelebration({
          title: '🤖 Hermes Executed!',
          message: `Autonomous action dispatched: ${d.resolution_summary || 'Tactical eco-remediation completed.'}`,
          points: d.bounty_points || 50,
          badge: `+${d.bounty_points || 50} EcoCredits`
        });
      }
    } catch (err) {
      console.error("Hermes dispatch failed:", err);
    } finally {
      setHermesLoading(prev => ({ ...prev, [ticket.id]: false }));
    }
  };

  const handleResolve = (ticket) => {
    // Execute dependent state mutations based on category
    if (ticket.category === 'IOT_SURGE' && ticket.targetEntityId) {
      if (onEmptyBin) onEmptyBin(ticket.targetEntityId);
    } else if (ticket.category === 'FLORA_HEALTH' && ticket.targetEntityId && setTrees) {
      setTrees(prev => prev.map(t => {
        if (t.id === ticket.targetEntityId) {
          return { ...t, health: 'Flourishing', waterDueInHours: 24, lastWatered: 'Just now' };
        }
        return t;
      }));
    }

    actionMesh.resolveTicket(ticket.id, "Autonomous resolution executed & validated by operator.");
    setUserCredits(c => c + 40);
    if (onAddXp) onAddXp(60);
    triggerEcoCelebration({
      title: '✅ Ticket Resolved!',
      message: `Action Mesh ticket #${ticket.id} closed. Campus eco-impact registered to NAAC audit trail.`,
      points: 40,
      badge: '+40 EcoCredits'
    });
  };

  const handleReassign = (ticketId) => {
    const newAssignee = {
      name: "Emergency Eco-Squad Volunteers (Batch 2026)",
      role: "Crowdsourced Student Rapid Response Cell",
      id: "ECO-RAPID-01",
      type: "STUDENT"
    };
    actionMesh.reassignTicket(ticketId, newAssignee);
    triggerEcoCelebration({
      title: '📋 Ticket Reassigned!',
      message: 'Eco-Squad Volunteers mobilised for rapid response. Mission briefing dispatched!',
      points: 10,
      badge: 'Squad Deployed'
    });
  };

  const activeCount = tickets.filter(t => t.status !== 'RESOLVED').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  const filteredTickets = tickets.filter(t => {
    if (filter === 'ACTIVE') return t.status !== 'RESOLVED';
    if (filter === 'RESOLVED') return t.status === 'RESOLVED';
    return true;
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 110,
      background: 'rgba(3,13,8,0.85)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16
    }}>
      <div style={{
        background: 'rgba(7,15,10,0.97)', border: '1px solid rgba(52,211,153,0.3)',
        borderRadius: 24, maxWidth: 740, width: '100%', maxHeight: '92vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 50px rgba(52,211,153,0.15)'
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(52,211,153,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(5,20,12,0.6)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#e2f5ec', margin: 0, letterSpacing: '-0.02em' }}>
                Autonomous Action &amp; Dispatch Mesh
              </h2>
              <span style={{
                background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)',
                padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 800
              }}>
                Closed-Loop Auto Resolution
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#7ea893', marginTop: 3 }}>
              Detects campus anomalies ➔ Automatically assigns staff, students, or actuators ➔ Executes inter-dependent resolution.
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 12, width: 34, height: 34, color: '#e2f5ec',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Strip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px', background: 'rgba(3,13,8,0.5)', borderBottom: '1px solid rgba(52,211,153,0.08)'
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'ACTIVE', label: `⚡ Active Dispatches (${activeCount})` },
              { id: 'RESOLVED', label: `✓ Resolved (${resolvedCount})` },
              { id: 'ALL', label: `All Tickets (${tickets.length})` }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 800,
                  cursor: 'pointer',
                  background: filter === f.id ? 'rgba(52,211,153,0.18)' : 'transparent',
                  color: filter === f.id ? '#34d399' : '#7ea893',
                  border: filter === f.id ? '1px solid rgba(52,211,153,0.3)' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: 11, color: '#7ea893', fontFamily: 'monospace' }}>
            RNSIT Mesh 868MHz LoRa / Wi-Fi
          </span>
        </div>

        {/* Tickets List */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7ea893' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
              <div style={{ fontWeight: 800, color: '#e2f5ec', fontSize: 15 }}>All Campus Incidents Resolved!</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Autonomous actuators and ground ops are on standby.</div>
            </div>
          ) : (
            filteredTickets.map(t => {
              const isResolved = t.status === 'RESOLVED';
              const isCrit = t.severity === 'CRITICAL';

              return (
                <div
                  key={t.id}
                  style={{
                    background: isResolved
                      ? 'rgba(52,211,153,0.04)'
                      : isCrit ? 'rgba(239,68,68,0.08)' : 'rgba(10,25,18,0.7)',
                    border: isResolved
                      ? '1px solid rgba(52,211,153,0.18)'
                      : isCrit ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(52,211,153,0.2)',
                    borderRadius: 18, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12
                  }}
                >
                  {/* Top Bar: ID, Severity, Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontFamily: 'monospace', fontWeight: 900,
                        background: '#030d08', color: '#34d399', padding: '2px 8px',
                        borderRadius: 6, border: '1px solid rgba(52,211,153,0.2)'
                      }}>
                        {t.id}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
                        padding: '2px 8px', borderRadius: 99,
                        background: isCrit ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                        color: isCrit ? '#f87171' : '#fbbf24',
                        border: isCrit ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(245,158,11,0.4)'
                      }}>
                        {t.severity} SEVERITY
                      </span>
                      <span style={{ fontSize: 10, color: '#7ea893' }}>Detected {t.detectedAt} via {t.detectedBy}</span>
                    </div>

                    <span style={{
                      fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                      padding: '3px 10px', borderRadius: 99,
                      background: isResolved ? 'rgba(52,211,153,0.15)' : 'rgba(59,130,246,0.15)',
                      color: isResolved ? '#34d399' : '#60a5fa',
                      border: isResolved ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(59,130,246,0.3)'
                    }}>
                      {t.status}
                    </span>
                  </div>

                  {/* Problem & Location */}
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#e2f5ec', margin: 0 }}>
                      {t.title}
                    </h3>
                    <div style={{ fontSize: 11, color: '#7ea893', marginTop: 4 }}>
                      📍 {t.location}
                    </div>
                  </div>

                  {/* Assigned Personnel / Actuator Box */}
                  <div style={{
                    background: 'rgba(3,13,8,0.7)', border: '1px solid rgba(52,211,153,0.12)',
                    borderRadius: 14, padding: '12px 14px', display: 'flex',
                    alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: t.assignedTo.type === 'STAFF' ? 'rgba(245,158,11,0.2)' : t.assignedTo.type === 'AUTOMATED' ? 'rgba(59,130,246,0.2)' : 'rgba(52,211,153,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                      }}>
                        {t.assignedTo.type === 'STAFF' ? '👷' : t.assignedTo.type === 'AUTOMATED' ? '⚙️' : '🎓'}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#7ea893', textTransform: 'uppercase', fontWeight: 700 }}>
                          Assigned Resolver ({t.assignedTo.type}):
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#e2f5ec' }}>
                          {t.assignedTo.name}
                        </div>
                        <div style={{ fontSize: 10, color: '#34d399', fontFamily: 'monospace' }}>
                          {t.assignedTo.role} • ID: {t.assignedTo.id}
                        </div>
                      </div>
                    </div>

                    {!isResolved && t.assignedTo.type === 'STAFF' && (
                      <button
                        onClick={() => handleReassign(t.id)}
                        style={{
                          background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
                          color: '#34d399', fontSize: 10, fontWeight: 800, padding: '5px 10px',
                          borderRadius: 8, cursor: 'pointer'
                        }}
                      >
                        Reassign to Student Squad
                      </button>
                    )}
                  </div>

                  {/* Automated Resolution Steps & Impact */}
                  <div style={{
                    fontSize: 11, color: '#7ea893', background: 'rgba(52,211,153,0.04)',
                    padding: '10px 14px', borderRadius: 12, border: '1px dashed rgba(52,211,153,0.2)'
                  }}>
                    <div style={{ fontWeight: 800, color: '#34d399', marginBottom: 2 }}>
                      ⚡ Autonomous Resolution Pipeline:
                    </div>
                    <div>{t.automatedResolution}</div>
                    <div style={{ color: '#e2f5ec', fontWeight: 600, marginTop: 4 }}>
                      Impact: {t.impactMetric}
                    </div>
                  </div>

                  {/* Inter-Dependent Links & Resolution Button */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 10, paddingTop: 4
                  }}>
                    {/* Inter-Dependent Jump Links */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {t.interDependentLinks.map((link, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            onClose();
                            navigate(link.path);
                          }}
                          style={{
                            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
                            borderRadius: 8, padding: '4px 10px', fontSize: 10, fontWeight: 700,
                            color: '#e2f5ec', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                          }}
                        >
                          <span>{link.label}</span>
                          <span style={{ fontSize: 9, color: '#34d399', fontFamily: 'monospace' }}>({link.badge})</span>
                        </button>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {!isResolved ? (
                        <>
                          {/* Hermes Autonomous Agent Button */}
                          <button
                            onClick={() => handleHermesDispatch(t)}
                            disabled={hermesLoading[t.id]}
                            style={{
                              background: hermesLoading[t.id]
                                ? 'rgba(139,92,246,0.3)'
                                : '#7c3aed',
                              color: '#ffffff', fontWeight: 900, fontSize: 11,
                              padding: '8px 16px', borderRadius: 10, border: 'none',
                              cursor: hermesLoading[t.id] ? 'wait' : 'pointer',
                              boxShadow: '0 4px 14px rgba(139,92,246,0.35)',
                              display: 'flex', alignItems: 'center', gap: 6,
                              transition: 'all 0.2s'
                            }}
                          >
                            <span>{hermesLoading[t.id] ? '⏳ Hermes Reasoning...' : '🤖 Hermes Autonomous Dispatch'}</span>
                            <span style={{ fontSize: 9, opacity: 0.9, background: 'rgba(0,0,0,0.25)', padding: '1px 5px', borderRadius: 6 }}>
                              +50 PTS
                            </span>
                          </button>

                          {/* Quick Solve Button */}
                          <button
                            onClick={() => handleResolve(t)}
                            style={{
                              background: '#059669',
                              color: '#ffffff', fontWeight: 900, fontSize: 11,
                              padding: '8px 16px', borderRadius: 10, border: 'none',
                              cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                              display: 'flex', alignItems: 'center', gap: 6
                            }}
                          >
                            <span>✓ Manual Resolve</span>
                            <span style={{ fontSize: 10, opacity: 0.9 }}>(+40 PTS)</span>
                          </button>
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontSize: 11, color: '#34d399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>✓ Case Closed &amp; Verified</span>
                            <span style={{ fontSize: 9, color: '#7ea893' }}>({t.resolvedAt || 'Just now'})</span>
                          </div>
                          {t.resolutionNote && (
                            <div style={{ fontSize: 10, color: t.resolutionNote.includes('Hermes') ? '#c084fc' : '#a7f3d0', fontFamily: 'sans-serif' }}>
                              {t.resolutionNote}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
