import React, { useState, useEffect, useRef } from 'react';
import { triggerConfetti } from '../utils/confetti';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { IconAward, IconZap, IconCheckCircle } from './Icons';
import { useAuth } from '../contexts/AuthContext';

const WHEEL_PRIZES = [
  { label: '+50 Credits', type: 'credits', value: 50, color: '#059669' },
  { label: '☕ Free Coffee', type: 'perk', value: 'Canteen Coffee Voucher', color: '#047857' },
  { label: '+25 Credits', type: 'credits', value: 25, color: '#10b981' },
  { label: '🌱 Rare Seed Pack', type: 'perk', value: 'Botanical Seed Kit', color: '#065f46' },
  { label: '+100 JACKPOT', type: 'credits', value: 100, color: '#f59e0b' },
  { label: '+30 Credits', type: 'credits', value: 30, color: '#34d399' },
  { label: '⚡ 2x XP Boost', type: 'perk', value: '24h XP Multiplier', color: '#0d9488' },
  { label: '+40 Credits', type: 'credits', value: 40, color: '#14b8a6' },
];

export function GamificationDrawer({
  isOpen,
  onClose,
  userCredits,
  setUserCredits,
  streakDays = 5,
  userXp = 1840,
  userLevel = 4,
  onAddXp
}) {
  const { addContribution } = useAuth();
  const [activeTab, setActiveTab] = useState('quests'); // 'quests' | 'wheel' | 'badges'
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);

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
      credits: 35,
      completed: true,
      icon: '🤝'
    },
    {
      id: 'q2',
      title: 'Water an Adopted Campus Tree',
      desc: 'Log a hydration cycle for Gulmohar or Neem flora on Campus Trees.',
      xp: 45,
      credits: 25,
      completed: false,
      icon: '🌿'
    },
    {
      id: 'q3',
      title: 'Clean Plate Dining Pledge',
      desc: 'Commit to zero cafeteria food waste during today\'s lunch service.',
      xp: 35,
      credits: 20,
      completed: true,
      icon: '🍽️'
    },
    {
      id: 'q4',
      title: 'Spot & Report a Resource Leak',
      desc: 'Report an unattended classroom projector or dripping tap in Bounties.',
      xp: 40,
      credits: 30,
      completed: false,
      icon: '⚡'
    }
  ]);

  const [badges, setBadges] = useState([
    { id: 'b1', name: 'Silicon Recycler', desc: 'Disposed 5+ verified e-waste units', icon: '🏆', unlocked: true },
    { id: 'b2', name: 'Flora Guardian', desc: 'Adopted and sustained a campus tree', icon: '🌳', unlocked: true },
    { id: 'b3', name: 'Zero-Plate Hero', desc: 'Prevented cafeteria food discard', icon: '🍱', unlocked: true },
    { id: 'b4', name: 'IoT Node Sentinel', desc: 'Reported an ultrasonic surge bin', icon: '📡', unlocked: true },
    { id: 'b5', name: 'Pass-The-Torch Patron', desc: 'Passed textbook or lab kit to junior', icon: '📚', unlocked: false },
    { id: 'b6', name: 'Mission LiFE Grandmaster', desc: 'Reached Level 5 with 2500+ XP', icon: '👑', unlocked: false }
  ]);

  const handleCompleteQuest = (qId) => {
    const targetQuest = quests.find(q => q.id === qId);
    if (!targetQuest || targetQuest.completed) return;

    setQuests(prev => prev.map(q => {
      if (q.id === qId && !q.completed) {
        setUserCredits(c => c + q.credits);
        if (onAddXp) onAddXp(q.xp);
        if (addContribution) {
          addContribution({
            action: `Daily Mission: ${q.title}`,
            points: q.credits,
            type: 'OTHER',
            status: 'APPROVED',
          });
        }
        triggerConfetti();
        triggerEcoCelebration({
          title: `Mission Accomplished: ${q.title}!`,
          message: `Great job! You claimed +${q.credits} EcoCredits and +${q.xp} XP towards Level ${userLevel + 1}.`,
          points: q.credits,
          badge: `+${q.credits} EcoCredits`,
        });
        return { ...q, completed: true };
      }
      return q;
    }));
  };

  const handleSpinWheel = () => {
    if (spinning || hasSpunToday) return;
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
      setHasSpunToday(true);
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
  const xpNeeded = 2500;
  const xpProgress = Math.min(100, Math.round((userXp / xpNeeded) * 100));

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
        background: 'rgba(7,15,10,0.96)', border: '1px solid rgba(52,211,153,0.3)',
        borderRadius: 24, maxWidth: 620, width: '100%', maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(52,211,153,0.15)'
      }}>

        {/* Header Bar */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(52,211,153,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(5,20,12,0.6)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#e2f5ec', margin: 0, letterSpacing: '-0.02em' }}>
                Ecominds Gamification Hub
              </h2>
              <span style={{
                background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)',
                padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 800
              }}>
                {streakDays}-Day Streak!
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#7ea893', marginTop: 3 }}>
              Level {userLevel} Campus Eco-Guardian • {userXp.toLocaleString()} / {xpNeeded} XP
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 12, width: 34, height: 34, color: '#e2f5ec',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, transition: 'all 0.2s'
            }}
          >
            ✕
          </button>
        </div>

        {/* Level XP Progress Strip */}
        <div style={{ padding: '12px 24px', background: 'rgba(3,13,8,0.5)', borderBottom: '1px solid rgba(52,211,153,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
            <span style={{ color: '#7ea893' }}>Level {userLevel} Progression</span>
            <span style={{ color: '#34d399', fontFamily: 'monospace' }}>{xpProgress}% to Level 5 (Bio-Architect)</span>
          </div>
          <div style={{ width: '100%', height: 7, borderRadius: 99, background: 'rgba(52,211,153,0.1)', overflow: 'hidden' }}>
            <div style={{
              width: `${xpProgress}%`, height: '100%',
              background: '#059669',
              borderRadius: 99, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)'
            }} />
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex', gap: 6, padding: '12px 24px',
          borderBottom: '1px solid rgba(52,211,153,0.08)', background: 'rgba(5,15,10,0.4)'
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
                color: activeTab === t.id ? '#34d399' : '#7ea893',
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
                <span style={{ fontSize: 12, color: '#7ea893' }}>Complete all daily missions for a +50 EcoCredits bonus!</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#34d399' }}>Resets at Midnight</span>
              </div>

              {quests.map(q => (
                <div
                  key={q.id}
                  style={{
                    background: q.completed ? 'rgba(52,211,153,0.06)' : 'rgba(10,25,18,0.7)',
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
                        color: q.completed ? '#7ea893' : '#e2f5ec',
                        textDecoration: q.completed ? 'line-through' : 'none'
                      }}>
                        {q.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#7ea893', marginTop: 2 }}>{q.desc}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 5, fontSize: 10, fontFamily: 'monospace' }}>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>+{q.credits} Credits</span>
                        <span style={{ color: '#60a5fa' }}>+{q.xp} XP</span>
                      </div>
                    </div>
                  </div>

                  {q.completed ? (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: '#34d399', fontSize: 11, fontWeight: 800,
                      background: 'rgba(52,211,153,0.1)', padding: '5px 12px',
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
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#e2f5ec', margin: 0 }}>
                  🎡 Daily RNSIT Eco-Wheel of Fortune
                </h3>
                <p style={{ fontSize: 11, color: '#7ea893', margin: '4px 0 0' }}>
                  Spin once per 24 hours to win EcoCredits, canteen perks, and tree naming tokens!
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
                  position: 'relative', overflow: 'hidden',
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
                  boxShadow: '0 0 30px rgba(52,211,153,0.2)'
                }}>
                  {WHEEL_PRIZES.map((prize, idx) => {
                    const angle = (360 / WHEEL_PRIZES.length) * idx;
                    return (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute', width: '50%', height: '50%',
                          top: 0, right: 0, transformOrigin: '0% 100%',
                          transform: `rotate(${angle}deg) skewY(${90 - (360 / WHEEL_PRIZES.length)}deg)`,
                          background: prize.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#ffffff', fontSize: 9, fontWeight: 800,
                          userSelect: 'none'
                        }}
                      />
                    );
                  })}
                  {/* Wheel center hub */}
                  <div style={{
                    position: 'absolute', inset: '38%', borderRadius: '50%',
                    background: '#030d08', border: '3px solid #34d399',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, zIndex: 5, color: '#34d399', fontWeight: 900
                  }}>
                    🌿
                  </div>
                </div>
              </div>

              {/* Prize Announcement */}
              {wonPrize && (
                <div style={{
                  background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)',
                  padding: '10px 20px', borderRadius: 14, textAlign: 'center',
                  animation: 'fadeIn 0.4s ease-out'
                }}>
                  <div style={{ fontSize: 10, color: '#7ea893', textTransform: 'uppercase', fontWeight: 700 }}>
                    Congratulations! You won:
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#34d399', marginTop: 2 }}>
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
                    ? 'rgba(52,211,153,0.2)'
                    : '#059669',
                  color: hasSpunToday ? '#7ea893' : '#ffffff',
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
                    background: b.unlocked ? 'rgba(52,211,153,0.06)' : 'rgba(10,20,15,0.4)',
                    border: b.unlocked ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 16, padding: '14px 16px', display: 'flex',
                    alignItems: 'center', gap: 12, opacity: b.unlocked ? 1 : 0.55
                  }}
                >
                  <span style={{ fontSize: 28, filter: b.unlocked ? 'none' : 'grayscale(1)' }}>{b.icon}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: b.unlocked ? '#e2f5ec' : '#7ea893' }}>
                        {b.name}
                      </span>
                      {b.unlocked && (
                        <span style={{ fontSize: 9, color: '#34d399', fontWeight: 800 }}>✓ UNLOCKED</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#7ea893', marginTop: 2 }}>{b.desc}</div>
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
