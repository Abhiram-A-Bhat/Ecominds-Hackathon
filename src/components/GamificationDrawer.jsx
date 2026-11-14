import React, { useState, useEffect, useRef } from 'react';
import { triggerConfetti } from '../utils/confetti';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { IconAward, IconZap, IconCheckCircle } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import { getEcoLevel } from '../utils/ecoLevels';

const WHEEL_PRIZES = [
  { label: '+5 Credits', type: 'credits', value: 5, color: '#059669' },
  { label: '+10 Credits', type: 'credits', value: 10, color: '#047857' },
  { label: '+10 Credits', type: 'credits', value: 10, color: '#10b981' },
  { label: '+10 Credits', type: 'credits', value: 10, color: '#065f46' },
  { label: '+30 JACKPOT', type: 'credits', value: 30, color: '#f59e0b' },
  { label: '+15 Credits', type: 'credits', value: 15, color: 'var(--role)' },
  { label: '+15 Credits', type: 'credits', value: 15, color: '#0d9488' },
  { label: '+20 Credits', type: 'credits', value: 20, color: '#14b8a6' },
];

export function GamificationDrawer({
  isOpen,
  onClose,
  userCredits,
  setUserCredits,
  lifetimePoints = userCredits,
  streakDays = 5,
  userXp = 1840,
  onAddXp
}) {
  const { addContribution, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('quests'); // 'quests' | 'wheel' | 'badges'
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const claimKey = `ecominds_daily_rewards_${currentUser?.id || 'guest'}_${new Date().toLocaleDateString('en-CA')}`;
  const [dailyClaims, setDailyClaims] = useState(() => {
    try { return JSON.parse(localStorage.getItem(claimKey) || '{"quests":[],"spun":false}'); }
    catch { return { quests: [], spun: false }; }
  });
  const hasSpunToday = dailyClaims.spun;

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const [quests, setQuests] = useState([
    {
      id: 'q1',
      title: 'Pass Down Academic Gear',
      desc: 'List notes, uniforms, or a calculator on Pass-The-Torch for juniors.',
      xp: 60,
      credits: 10,
      completed: false,
      icon: '🤝'
    },
    {
      id: 'q2',
      title: 'Water an Adopted Campus Tree',
      desc: 'Log a hydration cycle for Gulmohar or Neem flora on Campus Trees.',
      xp: 45,
      credits: 12,
      completed: false,
      icon: '🌿'
    },
    {
      id: 'q3',
      title: 'Clean Plate Dining Pledge',
      desc: 'Commit to zero cafeteria food waste during today\'s lunch service.',
      xp: 35,
      credits: 10,
      completed: false,
      icon: '🍽️'
    },
    {
      id: 'q4',
      title: 'Spot & Report a Resource Leak',
      desc: 'Report an unattended classroom projector or dripping tap in Bounties.',
      xp: 40,
      credits: 15,
      completed: false,
      icon: '⚡'
    }
  ]);

  useEffect(() => {
    setDailyClaims(() => {
      try { return JSON.parse(localStorage.getItem(claimKey) || '{"quests":[],"spun":false}'); }
      catch { return { quests: [], spun: false }; }
    });
  }, [claimKey]);

  useEffect(() => {
    setQuests(prev => prev.map(q => ({ ...q, completed: dailyClaims.quests?.includes(q.id) || false })));
  }, [dailyClaims.quests]);

  const [badges, setBadges] = useState([
    { id: 'b1', name: 'Silicon Recycler', desc: 'Disposed 5+ verified e-waste units', icon: '🏆', unlocked: true },
    { id: 'b2', name: 'Flora Guardian', desc: 'Adopted and sustained a campus tree', icon: '🌳', unlocked: true },
    { id: 'b3', name: 'Zero-Plate Hero', desc: 'Prevented cafeteria food discard', icon: '🍱', unlocked: true },
    { id: 'b4', name: 'IoT Node Sentinel', desc: 'Reported an ultrasonic surge bin', icon: '📡', unlocked: true },
    { id: 'b5', name: 'Pass-The-Torch Patron', desc: 'Passed textbook or lab kit to junior', icon: '📚', unlocked: false },
    { id: 'b6', name: 'Mission LiFE Grandmaster', desc: 'Reached Level 5 with 2500 lifetime EcoCredits', icon: '👑', unlocked: false }
  ]);

  const handleCompleteQuest = (qId) => {
    const targetQuest = quests.find(q => q.id === qId);
    let storedClaims = dailyClaims;
    try { storedClaims = JSON.parse(localStorage.getItem(claimKey) || '{"quests":[],"spun":false}'); } catch { /* use in-memory state */ }
    if (!targetQuest || targetQuest.completed || storedClaims.quests?.includes(qId)) return;
    const nextClaims = { ...storedClaims, quests: [...new Set([...(storedClaims.quests || []), qId])] };
    localStorage.setItem(claimKey, JSON.stringify(nextClaims));
    setDailyClaims(nextClaims);

    setQuests(prev => prev.map(q => q.id === qId ? { ...q, completed: true } : q));
    setUserCredits(c => c + targetQuest.credits);
    if (onAddXp) onAddXp(targetQuest.xp);
    if (addContribution) {
      addContribution({
        action: `Daily Mission: ${targetQuest.title}`,
        points: targetQuest.credits,
        type: 'OTHER',
        status: 'APPROVED',
      });
    }
    triggerConfetti();
    triggerEcoCelebration({
      title: `Mission Accomplished: ${targetQuest.title}!`,
      message: `Great job! You earned +${targetQuest.credits} EcoCredits and +${targetQuest.xp} bonus XP. Levels are based on lifetime EcoCredits.`,
      points: targetQuest.credits,
      badge: `+${targetQuest.credits} EcoCredits`,
    });
  };

  const handleSpinWheel = () => {
    if (spinning || hasSpunToday) return;
    const nextClaims = { ...dailyClaims, spun: true };
    localStorage.setItem(claimKey, JSON.stringify(nextClaims));
    setDailyClaims(nextClaims);
    setSpinning(true);
    setWonPrize(null);

    // Random rotations (between 5 and 9 full spins + random prize slot)
    const prizeIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const sliceAngle = 360 / WHEEL_PRIZES.length;
    const extraRotations = 360 * (5 + Math.floor(Math.random() * 4));
    const targetAngle = extraRotations + (360 - (prizeIndex * sliceAngle + sliceAngle / 2));

    setWheelRotation(prev => prev + targetAngle);

    setTimeout(() => {
      setSpinning(false);
      const prize = WHEEL_PRIZES[prizeIndex];
      setWonPrize(prize);
      triggerConfetti();

      if (prize.type === 'credits') {
        setUserCredits(c => c + prize.value);
        if (addContribution) {
          addContribution({
            action: `Daily Wheel Reward: ${prize.label}`,
            points: prize.value,
            type: 'OTHER',
            status: 'APPROVED',
          });
        }
      }

      triggerEcoCelebration({
        title: `🎡 Wheel Prize: ${prize.label}!`,
        message: prize.type === 'credits'
          ? `Lucky spin! +${prize.value} EcoCredits credited to your wallet.`
          : `Awesome! You won "${prize.value}". Show your confirmation on profile!`,
        points: prize.type === 'credits' ? prize.value : 10,
        badge: prize.label,
      });
    }, 4000);
  };

  if (!isOpen) return null;

  const completedCount = quests.filter(q => q.completed).length;
  const ecoLevel = getEcoLevel(lifetimePoints);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(3,13,8,0.85)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16
      }}
    >
      <div style={{
        background: 'var(--surface-solid)', border: '1px solid rgba(52,211,153,0.3)',
        borderRadius: 24, maxWidth: 620, width: '100%', maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(52,211,153,0.15)'
      }}>

        {/* Header Bar */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(52,211,153,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
                Ecominds Gamification Hub
              </h2>
              <span style={{
                background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)',
                padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 800
              }}>
                {streakDays}-Day Streak!
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3 }}>
              Level {ecoLevel.level} · {ecoLevel.title} • {lifetimePoints.toLocaleString()} lifetime EcoCredits • {userXp.toLocaleString()} bonus XP
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--role-soft)', border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 12, width: 34, height: 34, color: 'var(--text)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'all 0.2s'
            }}
          >
            ✕
          </button>
        </div>

        {/* Lifetime EcoCredits determine levels and never fall when rewards are redeemed. */}
        <div style={{ padding: '12px 24px', background: 'var(--surface)', borderBottom: '1px solid rgba(52,211,153,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
            <span style={{ color: 'var(--text-2)' }}>Level {ecoLevel.level} · {ecoLevel.title}</span>
            <span style={{ color: 'var(--role)', fontFamily: 'monospace' }}>{ecoLevel.next == null ? 'Max level reached' : `${lifetimePoints.toLocaleString()} / ${ecoLevel.next.toLocaleString()} pts to Level ${ecoLevel.level + 1}`}</span>
          </div>
          <div style={{ width: '100%', height: 7, borderRadius: 99, background: 'var(--role-soft)', overflow: 'hidden' }}>
            <div style={{
              width: `${ecoLevel.progress}%`, height: '100%',
              background: '#059669',
              borderRadius: 99, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)'
            }} />
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex', gap: 6, padding: '12px 24px',
          borderBottom: '1px solid rgba(52,211,153,0.08)', background: 'var(--surface)'
        }}>
          {[
            { id: 'quests', label: `🎯 Daily Quests (${completedCount}/4)` },
            { id: 'wheel', label: '🎡 Daily Eco-Wheel' },
            { id: 'badges', label: '🏆 Badges & Trophies' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 12,
                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                background: activeTab === t.id ? 'rgba(52,211,153,0.18)' : 'transparent',
                color: activeTab === t.id ? 'var(--role)' : 'var(--text-2)',
                border: activeTab === t.id ? '1px solid rgba(52,211,153,0.3)' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

          {/* TAB 1: DAILY QUESTS */}
          {activeTab === 'quests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Complete all daily missions for a +50 EcoCredits bonus!</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--role)' }}>Resets at Midnight</span>
              </div>

              {quests.map(q => (
                <div
                  key={q.id}
                  style={{
                    background: q.completed ? 'var(--role-soft)' : 'var(--surface)',
                    border: q.completed ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(52,211,153,0.12)',
                    borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 12, transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 26 }}>{q.icon}</span>
                    <div>
                      <div style={{
                        fontSize: 13, fontWeight: 800,
                        color: q.completed ? 'var(--text-2)' : 'var(--text)',
                        textDecoration: q.completed ? 'line-through' : 'none'
                      }}>
                        {q.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{q.desc}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 5, fontSize: 10, fontFamily: 'monospace' }}>
                        <span style={{ color: 'var(--role)', fontWeight: 700 }}>+{q.credits} Credits</span>
                        <span style={{ color: '#60a5fa' }}>+{q.xp} XP</span>
                      </div>
                    </div>
                  </div>

                  {q.completed ? (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: 'var(--role)', fontSize: 11, fontWeight: 800,
                      background: 'var(--role-soft)', padding: '5px 12px',
                      borderRadius: 10, border: '1px solid rgba(52,211,153,0.25)'
                    }}>
                      ✓ Done
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCompleteQuest(q.id)}
                      style={{
                        background: '#059669',
                        color: '#ffffff', fontWeight: 800, fontSize: 11,
                        padding: '7px 14px', borderRadius: 10, border: 'none',
                        cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                        transition: 'transform 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: SPIN THE ECO-WHEEL */}
          {activeTab === 'wheel' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  🎡 Daily RNSIT Eco-Wheel of Fortune
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-2)', margin: '4px 0 0' }}>
                  One spin per day. Every wheel segment awards EcoCredits.
                </p>
              </div>

              {/* Wheel Container with Pointer */}
              <div style={{ position: 'relative', width: 240, height: 240 }}>
                {/* Pointer Arrow */}
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '12px solid transparent',
                  borderRight: '12px solid transparent',
                  borderTop: '20px solid #ef4444',
                  zIndex: 10, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                }} />

                {/* Rotating Wheel */}
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  border: '6px solid rgba(52,211,153,0.4)',
                  background: `conic-gradient(${WHEEL_PRIZES.map((prize, idx) => `${prize.color} ${idx * (360 / WHEEL_PRIZES.length)}deg ${(idx + 1) * (360 / WHEEL_PRIZES.length)}deg`).join(', ')})`,
                  position: 'relative', overflow: 'hidden',
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
                  boxShadow: '0 0 30px rgba(52,211,153,0.2)'
                }}>
                  {WHEEL_PRIZES.map((prize, idx) => {
                    const midAngle = ((idx + 0.5) * 360 / WHEEL_PRIZES.length) * Math.PI / 180;
                    const left = 50 + Math.sin(midAngle) * 31;
                    const top = 50 - Math.cos(midAngle) * 31;
                    return (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute', left: `${left}%`, top: `${top}%`,
                          transform: 'translate(-50%, -50%)', width: 53,
                          display: 'grid', justifyItems: 'center', gap: 1,
                          color: '#ffffff', fontSize: 10, lineHeight: 1.05, fontWeight: 900,
                          textAlign: 'center', textShadow: '0 1px 3px rgba(0,0,0,.75)',
                          userSelect: 'none', pointerEvents: 'none'
                        }}
                      >
                        <span>+{prize.value}</span>
                        <span style={{ fontSize: 7, letterSpacing: '.04em' }}>{prize.label.toUpperCase().includes('JACKPOT') ? 'JACKPOT' : 'CREDITS'}</span>
                      </div>
                    );
                  })}
                  {/* Wheel center hub */}
                  <div style={{
                    position: 'absolute', inset: '38%', borderRadius: '50%',
                    background: 'var(--surface-solid)', border: '3px solid #34d399',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, zIndex: 5, color: 'var(--role)', fontWeight: 900
                  }}>
                    🌿
                  </div>
                </div>
              </div>

              {/* Prize Announcement */}
              {wonPrize && (
                <div style={{
                  background: 'var(--role-soft)', border: '1px solid rgba(52,211,153,0.35)',
                  padding: '10px 20px', borderRadius: 14, textAlign: 'center',
                  animation: 'fadeIn 0.4s ease-out'
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Congratulations! You won:
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--role)', marginTop: 2 }}>
                    {wonPrize.label}
                  </div>
                </div>
              )}

              <button
                onClick={handleSpinWheel}
                disabled={spinning || hasSpunToday}
                aria-label={spinning ? 'Wheel is spinning' : hasSpunToday ? 'Come back tomorrow to spin again' : 'Spin the Eco-Wheel to win credits'}
                style={{
                  background: hasSpunToday
                    ? 'var(--role-line)'
                    : '#059669',
                  color: hasSpunToday ? 'var(--text-2)' : '#ffffff',
                  fontWeight: 900, fontSize: 13, padding: '12px 32px',
                  borderRadius: 14, border: 'none',
                  cursor: spinning || hasSpunToday ? 'not-allowed' : 'pointer',
                  boxShadow: hasSpunToday ? 'none' : '0 6px 20px rgba(52,211,153,0.3)',
                  transition: 'all 0.2s', letterSpacing: '0.02em',
                  opacity: hasSpunToday ? 0.7 : 1,
                }}
              >
                {spinning ? '🎡 Spinning...' : hasSpunToday ? '⏰ Spin Again Tomorrow' : '🎡 SPIN THE WHEEL!'}
              </button>
            </div>
          )}

          {/* TAB 3: BADGES & TROPHY HALL */}
          {activeTab === 'badges' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {badges.map(b => (
                <div
                  key={b.id}
                  style={{
                    background: b.unlocked ? 'var(--role-soft)' : 'rgba(10,20,15,0.4)',
                    border: b.unlocked ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 16, padding: '14px 16px', display: 'flex',
                    alignItems: 'center', gap: 12, opacity: b.unlocked ? 1 : 0.55
                  }}
                >
                  <span style={{ fontSize: 28, filter: b.unlocked ? 'none' : 'grayscale(1)' }}>{b.icon}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: b.unlocked ? 'var(--text)' : 'var(--text-2)' }}>
                        {b.name}
                      </span>
                      {b.unlocked && (
                        <span style={{ fontSize: 9, color: 'var(--role)', fontWeight: 800 }}>✓ UNLOCKED</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
