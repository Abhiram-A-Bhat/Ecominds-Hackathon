import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { IconAward, IconZap, IconShield, IconLeaf, IconCheckCircle } from '../components/Icons';
import { 
  DEPARTMENT_LEADERBOARD, 
  REWARDS_CATALOG, 
  REWARD_CATEGORIES,
  STUDENT_LIFETIME_LEADERBOARD, 
  STAFF_LIFETIME_LEADERBOARD 
} from '../data/mockData';
import { triggerConfetti } from '../utils/confetti';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { useAuth } from '../contexts/AuthContext';
import { Link } from '../router/Router';
import { plantCareService } from '../services/plantCareService';
import { usePlantCare } from '../hooks/usePlantCare';
import { MapPinIcon as MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { LockIcon as Lock } from '@phosphor-icons/react/dist/csr/Lock';
import { SparkleIcon as Sparkles } from '@phosphor-icons/react/dist/csr/Sparkle';
import { CheckIcon as Check } from '@phosphor-icons/react/dist/csr/Check';

// Tooltip for Department comparison chart
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface-solid)',
      border: '1px solid rgba(52,211,153,0.25)',
      borderRadius: 10,
      padding: '8px 14px',
      fontSize: 12,
      color: 'var(--text)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
    }}>
      <div style={{ color: '#34d399', fontWeight: 800, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#34d399', fontWeight: 600 }}>
          {p.name}: {p.value.toLocaleString()} {p.unit || ''}
        </div>
      ))}
    </div>
  );
};

export const LeaderboardPage = ({ userCredits }) => {
  const { currentUser, redeemReward } = useAuth();
  const [activeTab, setActiveTab] = useState('STUDENTS'); // 'STUDENTS' | 'STAFF' | 'DEPARTMENTS' | 'REWARDS'
  const [activeVoucher, setActiveVoucher] = useState(null);
  const [toast, setToast] = useState('');
  const [rewardCat, setRewardCat] = useState('All');
  const [plantName, setPlantName] = useState('');
  usePlantCare(); // re-render when plant perks change eligibility

  useEffect(() => {
    if (userCredits >= 500) {
      const timer = setTimeout(() => triggerConfetti(), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const getUserRank = (credits) => {
    if (credits >= 1000) return { title: '🏆 Eco Champion', color: '#facc15', desc: 'Top 1% campus sustainability leaders' };
    if (credits >= 500) return { title: '⭐ Green Guardian', color: '#34d399', desc: 'Active student circular eco-ambassador' };
    if (credits >= 200) return { title: '🌱 Eco Starter', color: '#86efac', desc: 'Consistent recycler & contributor' };
    return { title: '🌿 Green Seedling', color: 'var(--text-2)', desc: 'Starting your sustainability journey' };
  };

  const userRank = getUserRank(userCredits);

  const handleRedeem = (reward) => {
    if (userCredits < reward.cost) {
      setToast(`You need ${reward.cost - userCredits} more EcoCredits to redeem ${reward.title}.`);
      setTimeout(() => setToast(''), 4000);
      return;
    }
    // Plant perks change the plant itself rather than issuing a counter voucher
    if (reward.kind === 'STREAK_SHIELD' || reward.kind === 'NAMING_RIGHTS') {
      const res = reward.kind === 'STREAK_SHIELD'
        ? plantCareService.addShield(currentUser.id)
        : plantCareService.setNickname(currentUser.id, plantName);
      if (!res.ok) { setToast(res.reason); setTimeout(() => setToast(''), 4000); return; }
      const redeemed = redeemReward?.(reward, reward.kind === 'STREAK_SHIELD' ? 'SHIELD-ACTIVE' : `NAMED-${res.plant.nickname}`);
      if (!redeemed) { setToast('Your EcoCredit balance changed. Please try redeeming again.'); setTimeout(() => setToast(''), 4000); return; }
      triggerConfetti();
      triggerEcoCelebration({
        title: reward.kind === 'STREAK_SHIELD' ? 'Streak shield on' : `Your ${res.plant.name} is now “${res.plant.nickname}”`,
        message: reward.kind === 'STREAK_SHIELD' ? 'Your next missed watering won\'t reset your streak.' : 'Everyone on campus will see the name you chose.',
        points: -reward.cost,
        badge: reward.title,
      });
      setPlantName('');
      return;
    }
    // redeemReward deducts the cost and records the voucher + history (once)
    const code = `RNSIT-${reward.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const redeemed = redeemReward?.(reward, code);
    if (!redeemed) { setToast('Your EcoCredit balance changed. Please try redeeming again.'); setTimeout(() => setToast(''), 4000); return; }
    triggerConfetti();
    triggerEcoCelebration({
      title: `Redeemed: ${reward.title}!`,
      message: `Show your code at: ${reward.where || 'the counter'}.`,
      points: -reward.cost,
      badge: reward.title,
    });
    setActiveVoucher({ reward, code, issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
  };

  const chartData = DEPARTMENT_LEADERBOARD.map(d => ({
    name: d.dept.split(' ')[0],
    fullName: d.dept,
    points: d.ecoCredits,
    wasteKg: d.wasteDivertedKg,
    rank: d.rank
  }));

  const rankColors = ['#fbbf24', '#cbd5e1', '#d97706', '#34d399', '#60a5fa'];

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div style={{
          background: 'color-mix(in srgb, var(--amber) 12%, var(--surface))',
          border: '1px solid rgba(245,158,11,0.4)',
          color: '#fef3c7',
          padding: '12px 16px',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 13
        }}>
          <span>⚠️ {toast}</span>
          <button onClick={() => setToast('')} style={{ color: '#fbbf24', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        borderBottom: '1px solid rgba(52,211,153,0.12)',
        paddingBottom: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#34d399' }}>
            <Link to="/" style={{ color: '#34d399', textDecoration: 'none' }}>Campus Hub</Link>
            <span style={{ color: '#4b6356' }}>/</span>
            <span style={{ color: '#94a3b8' }}>Lifetime Leaderboard &amp; Rewards</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: '4px 0 2px' }}>
            🏆 Campus Sustainability Hall of Fame
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>
            Official RNSIT Lifetime Leaderboards for students, faculty &amp; staff, and campus department standings.
          </p>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid rgba(52,211,153,0.28)',
          borderRadius: 14,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            width: 36, height: 36,
            borderRadius: 10,
            background: 'rgba(52,211,153,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#34d399'
          }}>
            🏆
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Balance</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', fontFamily: 'JetBrains Mono, monospace' }}>
              {userCredits} <span style={{ fontSize: 12, color: '#34d399' }}>PTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 4,
        borderBottom: '1px solid rgba(52,211,153,0.08)'
      }}>
        <button
          onClick={() => setActiveTab('STUDENTS')}
          style={{
            background: activeTab === 'STUDENTS' ? '#059669' : 'var(--surface)',
            color: activeTab === 'STUDENTS' ? '#ffffff' : 'var(--text-2)',
            border: activeTab === 'STUDENTS' ? '1px solid #059669' : '1px solid rgba(52,211,153,0.15)',
            borderRadius: 99,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
        >
          <span>👨‍🎓</span>
          <span>Students Lifetime</span>
          <span style={{
            background: activeTab === 'STUDENTS' ? 'rgba(0,0,0,0.3)' : 'var(--role-line)',
            color: activeTab === 'STUDENTS' ? '#ffffff' : '#34d399',
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: 10
          }}>
            {STUDENT_LIFETIME_LEADERBOARD.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('STAFF')}
          style={{
            background: activeTab === 'STAFF' ? '#059669' : 'var(--surface)',
            color: activeTab === 'STAFF' ? '#ffffff' : 'var(--text-2)',
            border: activeTab === 'STAFF' ? '1px solid #059669' : '1px solid rgba(52,211,153,0.15)',
            borderRadius: 99,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
        >
          <span>👩‍🏫</span>
          <span>Faculty &amp; Staff Lifetime</span>
          <span style={{
            background: activeTab === 'STAFF' ? 'rgba(0,0,0,0.3)' : 'var(--role-line)',
            color: activeTab === 'STAFF' ? '#ffffff' : '#34d399',
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: 10
          }}>
            {STAFF_LIFETIME_LEADERBOARD.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('DEPARTMENTS')}
          style={{
            background: activeTab === 'DEPARTMENTS' ? '#059669' : 'var(--surface)',
            color: activeTab === 'DEPARTMENTS' ? '#ffffff' : 'var(--text-2)',
            border: activeTab === 'DEPARTMENTS' ? '1px solid #059669' : '1px solid rgba(52,211,153,0.15)',
            borderRadius: 99,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
        >
          <span>🏢</span>
          <span>Department Green Cup</span>
        </button>

        <button
          onClick={() => setActiveTab('REWARDS')}
          style={{
            background: activeTab === 'REWARDS' ? '#059669' : 'var(--surface)',
            color: activeTab === 'REWARDS' ? '#ffffff' : 'var(--text-2)',
            border: activeTab === 'REWARDS' ? '1px solid #059669' : '1px solid rgba(52,211,153,0.15)',
            borderRadius: 99,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
        >
          <span>🎁</span>
          <span>Redeem Perks</span>
          <span style={{
            background: activeTab === 'REWARDS' ? 'rgba(0,0,0,0.3)' : 'rgba(245,158,11,0.2)',
            color: activeTab === 'REWARDS' ? '#ffffff' : '#fbbf24',
            fontSize: 11,
            padding: '1px 6px',
            borderRadius: 10
          }}>
            {REWARDS_CATALOG.length}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: STUDENTS LIFETIME LEADERBOARD ─────────────────────────────── */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-6">
          {/* Top 3 Podium */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {STUDENT_LIFETIME_LEADERBOARD.slice(0, 3).map((stu, idx) => {
              const medals = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
              const borderColors = ['#f59e0b', '#94a3b8', '#d97706'];
              return (
                <div
                  key={stu.usn}
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${borderColors[idx]}55`,
                    borderRadius: 18,
                    padding: 20,
                    position: 'relative',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }}
                >
                  <div style={{
                    display: 'inline-block',
                    fontSize: 11,
                    fontWeight: 800,
                    color: borderColors[idx],
                    background: `${borderColors[idx]}18`,
                    border: `1px solid ${borderColors[idx]}35`,
                    padding: '2px 8px',
                    borderRadius: 99,
                    marginBottom: 10
                  }}>
                    {medals[idx]}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: 'var(--surface-hi)', border: '1px solid rgba(52,211,153,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
                    }}>
                      {stu.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>{stu.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {stu.usn} · {stu.branch}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    background: 'var(--surface-solid)',
                    border: '1px solid rgba(52,211,153,0.1)',
                    borderRadius: 12,
                    padding: 10,
                    marginTop: 10
                  }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase' }}>Lifetime Pts</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                        {stu.lifetimePoints.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase' }}>Missions</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff' }}>
                        {stu.tasksCompleted} <span style={{ fontSize: 11, color: 'var(--text-2)' }}>done</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#6ee7b7' }}>
                    <span>⭐ {stu.badge}</span>
                    <span>🌱 {stu.carbonSavedKg} kg CO₂ saved</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Students Table */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid rgba(52,211,153,0.18)',
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  All-Time Top Student Green Guardians
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-2)', margin: '2px 0 0' }}>
                  Ranked by cumulative lifetime sustainability points earned across all campus years.
                </p>
              </div>
              <span style={{ fontSize: 11, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', padding: '3px 8px', borderRadius: 8 }}>
                Live Sync
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-solid)', borderBottom: '1px solid rgba(52,211,153,0.12)', color: 'var(--text-2)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Rank</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Student</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>USN / Branch</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Guardian Badge</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Tasks Done</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>CO₂ Saved</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: '#34d399', textAlign: 'right' }}>Lifetime Points</th>
                  </tr>
                </thead>
                <tbody>
                  {STUDENT_LIFETIME_LEADERBOARD.map((stu) => {
                    const isSelf = currentUser && (currentUser.usn === stu.usn || currentUser.name === stu.name);
                    return (
                      <tr
                        key={stu.usn}
                        style={{
                          borderBottom: '1px solid rgba(52,211,153,0.06)',
                          background: isSelf ? 'rgba(52,211,153,0.08)' : 'transparent',
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 900 }}>
                          <span style={{
                            display: 'inline-block',
                            width: 24, height: 24, borderRadius: 6,
                            textAlign: 'center', lineHeight: '24px',
                            background: stu.rank <= 3 ? '#059669' : 'var(--surface-hi)',
                            color: '#ffffff', fontSize: 11
                          }}>
                            #{stu.rank}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 20 }}>{stu.avatar}</span>
                            <div>
                              <div style={{ fontWeight: 800, color: '#ffffff' }}>
                                {stu.name} {isSelf && <span style={{ color: '#34d399', fontSize: 10, marginLeft: 4 }}>(You)</span>}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-2)' }}>Level {stu.level} • {stu.year}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', color: '#94a3b8' }}>
                          {stu.usn} <span style={{ color: '#34d399', fontWeight: 700 }}>({stu.branch})</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: 'rgba(52,211,153,0.1)',
                            border: '1px solid rgba(52,211,153,0.22)',
                            color: '#6ee7b7',
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 99
                          }}>
                            {stu.badge}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text)', fontWeight: 700 }}>
                          {stu.tasksCompleted}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-2)' }}>
                          {stu.carbonSavedKg} kg
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, fontSize: 14, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                          {stu.lifetimePoints.toLocaleString()} PTS
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: FACULTY & STAFF LIFETIME LEADERBOARD ──────────────────────── */}
      {activeTab === 'STAFF' && (
        <div className="space-y-6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {STAFF_LIFETIME_LEADERBOARD.slice(0, 3).map((staff, idx) => {
              const medals = ['🥇 Lead Champion', '🥈 Distinguished Mentor', '🥉 Senior Custodian'];
              return (
                <div
                  key={staff.name}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid rgba(139,92,246,0.35)',
                    borderRadius: 18,
                    padding: 20,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }}
                >
                  <div style={{
                    display: 'inline-block',
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#c084fc',
                    background: 'rgba(139,92,246,0.15)',
                    border: '1px solid rgba(139,92,246,0.3)',
                    padding: '2px 8px',
                    borderRadius: 99,
                    marginBottom: 10
                  }}>
                    {medals[idx]}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: 'color-mix(in srgb, var(--violet) 12%, var(--surface))', border: '1px solid rgba(168,85,247,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
                    }}>
                      {staff.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#ffffff' }}>{staff.name}</div>
                      <div style={{ fontSize: 11, color: '#c084fc' }}>
                        {staff.department} Dept
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
                    {staff.designation}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    background: 'var(--surface-solid)',
                    border: '1px solid rgba(52,211,153,0.1)',
                    borderRadius: 12,
                    padding: 10
                  }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase' }}>Lifetime Pts</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                        {staff.lifetimePoints.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase' }}>Energy Saved</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff' }}>
                        {staff.energySavedKwh} <span style={{ fontSize: 11, color: 'var(--text-2)' }}>kWh</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid rgba(52,211,153,0.18)',
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(52,211,153,0.12)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Faculty, Technical Officers &amp; Staff Lifetime Ranks
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-2)', margin: '2px 0 0' }}>
                Points accrued through NAAC green audit verifications, Guardian-led manual power switch-offs, and e-waste batch certifications.
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--surface-solid)', borderBottom: '1px solid rgba(52,211,153,0.12)', color: 'var(--text-2)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Rank</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Faculty / Staff Member</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Department</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Honorary Title</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Audits Approved</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700 }}>Energy Saved</th>
                    <th style={{ padding: '12px 16px', fontWeight: 800, color: '#34d399', textAlign: 'right' }}>Lifetime Points</th>
                  </tr>
                </thead>
                <tbody>
                  {STAFF_LIFETIME_LEADERBOARD.map((staff) => (
                    <tr key={staff.name} style={{ borderBottom: '1px solid rgba(52,211,153,0.06)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 900 }}>
                        <span style={{
                          display: 'inline-block',
                          width: 24, height: 24, borderRadius: 6,
                          textAlign: 'center', lineHeight: '24px',
                          background: '#059669',
                          color: '#ffffff', fontSize: 11
                        }}>
                          #{staff.rank}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{staff.avatar}</span>
                          <div>
                            <div style={{ fontWeight: 800, color: '#ffffff' }}>{staff.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-2)' }}>{staff.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text)', fontWeight: 700 }}>
                        {staff.department}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: 'rgba(168,85,247,0.12)',
                          border: '1px solid rgba(168,85,247,0.25)',
                          color: '#c084fc',
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 99
                        }}>
                          {staff.badge}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text)', fontWeight: 700 }}>
                        {staff.auditsApproved}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#34d399', fontWeight: 700 }}>
                        {staff.energySavedKwh} kWh
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, fontSize: 14, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                        {staff.lifetimePoints.toLocaleString()} PTS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: DEPARTMENT GREEN CUP ──────────────────────────────────────── */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="space-y-6">
          <div style={{
            background: 'var(--surface)',
            border: '1px solid rgba(52,211,153,0.18)',
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Branch Standings Analytics
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconZap style={{ width: 18, height: 18, color: '#34d399' }} />
                  Inter-Department Sustainability Performance
                </h2>
              </div>
              <span style={{
                fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-2)',
                background: 'var(--surface-solid)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(52,211,153,0.15)'
              }}>
                Monthly Cycle • AY 2025-26
              </span>
            </div>

            <div style={{ paddingTop: 8 }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(52,211,153,0.07)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-2)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="points" name="EcoCredits" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={rankColors[index % rankColors.length]} fillOpacity={0.88} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid rgba(52,211,153,0.18)',
            borderRadius: 18,
            padding: 20
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: '0 0 12px' }}>
              Department Green Cup Standing Breakdown
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {DEPARTMENT_LEADERBOARD.map(dept => (
                <div
                  key={dept.rank}
                  style={{
                    background: 'var(--surface-solid)',
                    border: '1px solid rgba(52,211,153,0.12)',
                    borderRadius: 12,
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontWeight: 900,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 14,
                      width: 28, height: 28, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: dept.rank === 1 ? '#f59e0b' : dept.rank === 2 ? '#94a3b8' : dept.rank === 3 ? '#d97706' : '#1e293b',
                      color: '#ffffff'
                    }}>
                      #{dept.rank}
                    </span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff' }}>{dept.dept}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-2)' }}>
                        {dept.wasteDivertedKg} kg waste • {dept.eWasteKg} kg e-waste
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
                    {dept.ecoCredits.toLocaleString()} PTS
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: REDEEM PERKS & REWARDS STORE ─────────────────────────────── */}
      {activeTab === 'REWARDS' && (
        <div style={{ display: 'grid', gap: 18 }}>
          <div className="glass" style={{ borderRadius: 22, padding: 'clamp(18px, 3vw, 26px)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={20} color="#fbbf24" /> Spend your EcoCredits
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>
                  You have <strong style={{ color: '#facc15', fontFamily: 'JetBrains Mono, monospace' }}>{userCredits}</strong> points. Earn more from Guardian tasks, plant care, e-waste and clean plates.
                </p>
              </div>
              <div role="tablist" aria-label="Reward categories" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['All', ...REWARD_CATEGORIES].map(c => (
                  <button key={c} type="button" role="tab" aria-selected={rewardCat === c} className="chip" onClick={() => setRewardCat(c)}
                    style={{ cursor: 'pointer', color: rewardCat === c ? 'var(--text)' : 'var(--text-3)', background: rewardCat === c ? 'rgba(52,211,153,.14)' : 'transparent', borderColor: rewardCat === c ? 'rgba(52,211,153,.45)' : 'var(--border)' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {REWARD_CATEGORIES.filter(c => rewardCat === 'All' || rewardCat === c).map(cat => {
            const items = REWARDS_CATALOG.filter(r => r.category === cat);
            if (!items.length) return null;
            return (
              <section key={cat}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>{cat}</h3>
                  <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--border-hi), transparent)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 12 }}>
                  {items.map((reward, i) => {
                    const canAfford = userCredits >= reward.cost;
                    const elig = reward.kind ? plantCareService.rewardEligibility(reward.kind, currentUser?.id) : { ok: true };
                    const ready = canAfford && elig.ok && (reward.kind !== 'NAMING_RIGHTS' || plantName.trim().length >= 2);
                    return (
                      <article key={reward.id} className="glass spotlight" style={{ borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, animation: `staggerIn .4s var(--ease-out) ${i * 0.04}s backwards` }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden="true">{reward.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{reward.title}</h4>
                            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '4px 0 0', lineHeight: 1.45 }}>{reward.desc}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-3)' }}>
                          <MapPin size={12} /> {reward.where}
                        </div>
                        {reward.kind === 'NAMING_RIGHTS' && elig.ok && (
                          <input value={plantName} onChange={e => setPlantName(e.target.value)} maxLength={24} placeholder={`Name for your ${elig.plant.name}`} aria-label="New name for your plant"
                            style={{ height: 38, borderRadius: 10, padding: '0 12px', background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13 }} />
                        )}
                        {!elig.ok && (
                          <div style={{ display: 'flex', gap: 6, fontSize: 11.5, color: '#fbbf24' }}><Lock size={12} style={{ marginTop: 2, flexShrink: 0 }} /> {elig.reason}</div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', gap: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 900, color: '#facc15', fontFamily: 'JetBrains Mono, monospace' }}>{reward.cost} pts</span>
                          <button type="button" className={ready ? 'btn-eco' : 'btn-ghost'} disabled={!ready} onClick={() => handleRedeem(reward)}
                            style={{ padding: '8px 14px', fontSize: 12.5, opacity: ready ? 1 : 0.55, cursor: ready ? 'pointer' : 'not-allowed' }}>
                            {!canAfford ? `Need ${reward.cost - userCredits} more` : !elig.ok ? 'Locked' : reward.kind ? <><Check size={14} /> Apply</> : 'Redeem'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Active Voucher Modal */}
      {activeVoucher && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid rgba(52,211,153,0.4)',
            borderRadius: 24,
            padding: 24,
            maxWidth: 380,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
          }}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>🎉</div>
            <div style={{
              display: 'inline-block',
              fontSize: 10,
              fontWeight: 800,
              color: '#34d399',
              background: 'var(--role-line)',
              border: '1px solid rgba(52,211,153,0.25)',
              padding: '2px 8px',
              borderRadius: 99,
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Perk Voucher Activated
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', margin: '8px 0 16px' }}>
              {activeVoucher.reward.title}
            </h3>

            <div style={{
              background: 'var(--surface-solid)',
              border: '1px dashed rgba(52,211,153,0.4)',
              borderRadius: 14,
              padding: 16,
              marginBottom: 16
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase' }}>Present code at counter</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#34d399', fontFamily: 'JetBrains Mono, monospace', margin: '6px 0' }}>
                {activeVoucher.code}
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>
                Issued {activeVoucher.issuedAt} • Valid 7 Days
              </div>
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 16 }}>
              Show this code at: <strong style={{ color: 'var(--text)' }}>{activeVoucher.reward.where || 'the counter'}</strong>. Also saved under My Profile → rewards.
            </p>

            <button
              onClick={() => setActiveVoucher(null)}
              style={{
                width: '100%',
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Done &amp; Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
