import React, { useEffect, useRef, useState } from 'react';
import { MapPinIcon as MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { SpeakerHighIcon as Volume2 } from '@phosphor-icons/react/dist/csr/SpeakerHigh';
import { SpeakerXIcon as VolumeX } from '@phosphor-icons/react/dist/csr/SpeakerX';
import { UsersIcon as Users } from '@phosphor-icons/react/dist/csr/Users';
import { FootprintsIcon as Footprints } from '@phosphor-icons/react/dist/csr/Footprints';
import { TrophyIcon as Trophy } from '@phosphor-icons/react/dist/csr/Trophy';
import { XIcon as X } from '@phosphor-icons/react/dist/csr/X';
import { ShieldCheckIcon as ShieldCheck } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import { SmileySadIcon as Frown } from '@phosphor-icons/react/dist/csr/SmileySad';
import { guardianTaskService, canClaimTask } from '../../services/guardianTaskService';
import { plantCareService } from '../../services/plantCareService';
import { useAuth } from '../../contexts/AuthContext';
import { startAlarm, stopAlarm, playSuccess } from '../../utils/alarmSound';
import { SlideToAccept } from './SlideToAccept';
import { metaFor } from './taskMeta';

const WINDOW_S = 30;
const asGuardian = (u) => ({ ...u, ownsPlant: plantCareService.getState().plants.some(p => p.adopterId === u?.id) });
const MUTE_KEY = 'ecosphere_alarm_muted';

/**
 * Incoming-task alarm for Green Guardians (students). Every new task raised by a
 * sensor or staff member rings on every Guardian's screen; the first one to
 * slide accepts it. If nobody here slides within the window, another Guardian
 * on campus takes it.
 */
export function GuardianAlarm({ onOpenMissions }) {
  const { currentUser } = useAuth();
  const seenKey = `ecosphere_alarm_seen_${currentUser?.id}`;
  const seen = useRef(null);
  const [queue, setQueue] = useState([]);
  const [phase, setPhase] = useState('ringing'); // ringing | won | lost
  const [result, setResult] = useState(null);
  const [left, setLeft] = useState(WINDOW_S);
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } });
  const [crowd] = useState(() => 3 + Math.floor(Math.random() * 5));
  const [dist, setDist] = useState(120);

  const task = queue[0];

  const ringingId = useRef(null);
  useEffect(() => { ringingId.current = task?.id ?? null; }, [task?.id]);

  // Track which tasks this Guardian has already been alerted about
  useEffect(() => {
    if (!currentUser) return;
    try { seen.current = new Set(JSON.parse(sessionStorage.getItem(seenKey)) || []); } catch { seen.current = new Set(); }
    return guardianTaskService.subscribe(tasks => {
      const fresh = [];
      tasks.forEach(t => {
        if (seen.current.has(t.id)) return;
        seen.current.add(t.id);
        if (t.status === 'OPEN' && !t.assignedStaffId && canClaimTask(t, asGuardian(currentUser))) fresh.push(t);
      });
      try { sessionStorage.setItem(seenKey, JSON.stringify([...seen.current])); } catch { /* ignore */ }
      if (fresh.length) setQueue(q => [...q, ...fresh]);
      // If the ringing task was taken in another window, flip to "lost"
      const live = ringingId.current && tasks.find(t => t.id === ringingId.current);
      if (live && live.status !== 'OPEN' && live.claimedBy?.id !== currentUser.id) {
        setResult(live);
        setPhase(p => (p === 'ringing' ? 'lost' : p));
      }
    });
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sound + countdown while ringing
  useEffect(() => {
    if (!task || phase !== 'ringing') { stopAlarm(); return; }
    setLeft(WINDOW_S);
    setDist(80 + Math.floor(Math.random() * 300));
    if (!muted) startAlarm();
    const started = Date.now();
    const iv = setInterval(() => {
      const remain = Math.max(0, WINDOW_S - Math.floor((Date.now() - started) / 1000));
      setLeft(remain);
      if (remain === 0) {
        clearInterval(iv);
        const res = guardianTaskService.rivalClaim(task.id);
        setResult(res.task || task);
        setPhase('lost');
      }
    }, 250);
    return () => { clearInterval(iv); stopAlarm(); };
  }, [task?.id, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (muted) stopAlarm(); else if (task && phase === 'ringing') startAlarm(); }, [muted]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopAlarm(), []);

  const next = () => { setQueue(q => q.slice(1)); setPhase('ringing'); setResult(null); };

  const accept = () => {
    stopAlarm();
    const res = guardianTaskService.claimTask(task.id, asGuardian(currentUser));
    setResult(res.task || task);
    if (res.success) {
      setPhase('won');
      playSuccess();
    } else {
      setPhase('lost');
    }
  };

  const toggleMute = () => setMuted(m => {
    try { localStorage.setItem(MUTE_KEY, m ? '0' : '1'); } catch { /* ignore */ }
    return !m;
  });

  if (!task || !currentUser) return null;
  const meta = metaFor(task.category);
  const Icon = meta.icon;
  const C = 2 * Math.PI * 22;
  const urgent = phase === 'ringing' && left <= 10;

  return (
    <div className="alarm-root" role="alertdialog" aria-modal="true" aria-labelledby="alarm-title" aria-describedby="alarm-desc" style={{ '--accent': meta.accent }}>
      <div className={`alarm-backdrop ${phase === 'ringing' ? 'pulsing' : ''}`} />
      <div className={`alarm-sheet ${phase === 'lost' ? 'shake-once' : ''}`}>
        {/* Header strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <span className="chip" style={{ color: meta.accent, borderColor: `${meta.accent}55`, background: `${meta.accent}14` }}>
            <span className="live-dot" style={{ width: 6, height: 6, background: meta.accent }} />
            {phase === 'ringing' ? 'Incoming Guardian task' : phase === 'won' ? 'Task assigned to you' : 'Task taken'}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {phase === 'ringing' && (
              <button type="button" className="tb-btn" onClick={toggleMute} aria-label={muted ? 'Unmute alarm' : 'Mute alarm'} style={{ height: 34, minWidth: 34, padding: 0 }}>
                {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            )}
            <button type="button" className="tb-btn" onClick={next} aria-label="Dismiss" style={{ height: 34, minWidth: 34, padding: 0 }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Radar + countdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
            {phase === 'ringing' && [0, 1, 2].map(i => (
              <span key={i} className="radar-ring" style={{ animationDelay: `${i * 0.5}s` }} />
            ))}
            <span style={{
              position: 'relative', width: 64, height: 64, borderRadius: 20, display: 'grid', placeItems: 'center',
              background: phase === 'lost' ? 'rgba(248,113,113,.14)' : `${meta.accent}22`,
              color: phase === 'lost' ? '#f87171' : meta.accent, border: `1px solid ${phase === 'lost' ? 'rgba(248,113,113,.4)' : `${meta.accent}66`}`,
              animation: phase === 'ringing' ? 'alarmWobble .9s ease-in-out infinite' : 'popIn .5s var(--ease-spring) both',
            }}>
              {phase === 'won' ? <ShieldCheck size={30} /> : phase === 'lost' ? <Frown size={30} /> : <Icon size={30} />}
            </span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: meta.accent, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              {meta.label} · {task.severity}
            </div>
            <h2 id="alarm-title" style={{ fontSize: 19, fontWeight: 900, margin: '4px 0 6px', lineHeight: 1.25, letterSpacing: '-0.01em' }}>{task.title}</h2>
            <div id="alarm-desc" style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12.5, color: 'var(--text-2)' }}>
              <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} /> {task.location}
            </div>
          </div>
          {phase === 'ringing' && (
            <svg width="56" height="56" viewBox="0 0 56 56" aria-label={`${left} seconds left`} style={{ flexShrink: 0 }}>
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5" />
              <circle cx="28" cy="28" r="22" fill="none" stroke={urgent ? '#f87171' : meta.accent} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - left / WINDOW_S)} transform="rotate(-90 28 28)"
                style={{ transition: 'stroke-dashoffset .3s linear, stroke .3s' }} />
              <text x="28" y="33" textAnchor="middle" fontSize="15" fontWeight="900" fill={urgent ? '#f87171' : 'var(--text)'} fontFamily="JetBrains Mono, monospace">{left}</text>
            </svg>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '18px 0' }}>
          {[
            { k: 'Reward', v: `+${task.points}`, icon: Trophy, c: '#facc15' },
            { k: 'Distance', v: `${dist} m`, icon: Footprints, c: 'var(--text)' },
            { k: 'Racing', v: `${crowd} Guardians`, icon: Users, c: '#f87171' },
          ].map(({ k, v, icon: I, c }, i) => (
            <div key={k} className="glass" style={{ padding: '10px 12px', borderRadius: 14, animation: `staggerIn .4s var(--ease-out) ${0.1 + i * 0.06}s backwards` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)' }}><I size={12} /> {k}</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: c, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>

        {phase === 'ringing' && (
          <>
            <SlideToAccept accent={meta.accent} label={`Slide to accept · +${task.points}`} onAccept={accept} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 11.5, color: 'var(--text-3)' }}>
              <span>First Guardian to slide gets the task.</span>
              <button type="button" onClick={next} style={{ background: 'none', border: 0, color: 'var(--text-2)', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Not now</button>
            </div>
          </>
        )}

        {phase === 'won' && (
          <div style={{ animation: 'revealUp .45s var(--ease-out) both' }}>
            <div className="glass" style={{ padding: '12px 14px', borderRadius: 14, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, borderColor: `${meta.accent}44` }}>
              <strong style={{ color: 'var(--text)' }}>{meta.verb}.</strong> Head to the location now. Once done, open your mission and mark it complete with a photo to collect <strong style={{ color: '#facc15' }}>+{task.points} EcoCredits</strong>.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button type="button" className="btn-eco" style={{ flex: 1, padding: '12px 16px', fontSize: 14 }} onClick={() => { next(); onOpenMissions?.(); }}>
                Open my mission
              </button>
              <button type="button" className="btn-ghost" style={{ padding: '12px 16px', fontSize: 14 }} onClick={next}>Later</button>
            </div>
          </div>
        )}

        {phase === 'lost' && (
          <div style={{ animation: 'revealUp .45s var(--ease-out) both' }}>
            <div className="glass" style={{ padding: '12px 14px', borderRadius: 14, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55, borderColor: 'rgba(248,113,113,.3)' }}>
              <strong style={{ color: '#fca5a5' }}>{result?.claimedBy?.name || 'Another Guardian'}</strong> slid first and is on the way. Stay close: the next alert could be yours.
            </div>
            <button type="button" className="btn-ghost" style={{ width: '100%', marginTop: 14, padding: '12px 16px', fontSize: 14, justifyContent: 'center' }} onClick={next}>
              {queue.length > 1 ? `Next alert (${queue.length - 1})` : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
