import React, { useEffect, useRef, useState } from 'react';
import { ShieldIcon as Shield } from '@phosphor-icons/react/dist/csr/Shield';
import { XIcon as X } from '@phosphor-icons/react/dist/csr/X';
import { MapPinIcon as MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { GearIcon as Cog } from '@phosphor-icons/react/dist/csr/Gear';
import { LeafIcon as Leaf } from '@phosphor-icons/react/dist/csr/Leaf';
import { BroadcastIcon as Radar } from '@phosphor-icons/react/dist/csr/Broadcast';
import { CameraIcon as Camera } from '@phosphor-icons/react/dist/csr/Camera';
import { CheckCircleIcon as CheckCircle2 } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { LockIcon as Lock } from '@phosphor-icons/react/dist/csr/Lock';
import { TrophyIcon as Trophy } from '@phosphor-icons/react/dist/csr/Trophy';
import { ClockIcon as Clock } from '@phosphor-icons/react/dist/csr/Clock';
import { triggerConfetti } from '../utils/confetti';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { guardianTaskService, timeAgo, canClaimTask } from '../services/guardianTaskService';
import { plantCareService } from '../services/plantCareService';
import { useAuth } from '../contexts/AuthContext';
import { readPhoto } from '../utils/photo';
import { SlideToAccept } from './guardian/SlideToAccept';
import { metaFor } from './guardian/taskMeta';

const STATUS = {
  OPEN: { label: 'Open', color: '#fbbf24' },
  CLAIMED: { label: 'In progress', color: '#38bdf8' },
  COMPLETED: { label: 'Done', color: '#34d399' },
};

function TaskCard({ task, me, isStudent, onClaim, onComplete, index }) {
  const meta = metaFor(task.category);
  const Icon = meta.icon;
  const mine = task.status === 'CLAIMED' && task.claimedBy?.id && task.claimedBy.id === me?.id;
  const st = STATUS[task.status];
  const fileRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [err, setErr] = useState('');

  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try { setPhoto(await readPhoto(f, 640)); setErr(''); } catch (x) { setErr(x.message); }
  };

  return (
    <article className="glass spotlight" style={{
      padding: 16, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 12,
      borderColor: mine ? `${meta.accent}66` : task.status === 'OPEN' ? `${meta.accent}33` : 'var(--border)',
      opacity: task.status === 'COMPLETED' ? 0.75 : 1,
      animation: `staggerIn .4s var(--ease-out) ${Math.min(index, 8) * 0.04}s backwards`,
    }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, display: 'grid', placeItems: 'center', color: meta.accent, background: `${meta.accent}1c`, border: `1px solid ${meta.accent}40` }}>
          <Icon size={18} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{task.id}</span>
            <span>·</span><span>{timeAgo(task.createdAt)}</span>
            <span style={{ marginLeft: 'auto', color: st.color, background: `${st.color}18`, border: `1px solid ${st.color}40`, padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>
              {mine ? 'Yours' : st.label}
            </span>
          </div>
          <h3 style={{ fontSize: 14.5, fontWeight: 800, margin: '4px 0 0', lineHeight: 1.35 }}>{task.title}</h3>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 5, fontSize: 12, color: 'var(--text-2)' }}>
        <span style={{ display: 'flex', gap: 6 }}><MapPin size={13} style={{ flexShrink: 0, marginTop: 2 }} /> {task.location}</span>
        {task.appliances && <span style={{ display: 'flex', gap: 6 }}><Cog size={13} style={{ flexShrink: 0, marginTop: 2 }} /> {task.appliances}</span>}
        {task.co2Saved && <span style={{ display: 'flex', gap: 6, color: 'var(--green)' }}><Leaf size={13} style={{ flexShrink: 0, marginTop: 2 }} /> {task.co2Saved}</span>}
        {task.detectedBy && <span style={{ display: 'flex', gap: 6, color: 'var(--text-3)' }}><Radar size={13} style={{ flexShrink: 0, marginTop: 2 }} /> {task.detectedBy}</span>}
      </div>

      {task.status !== 'OPEN' && task.claimedBy && (
        <div style={{ fontSize: 12, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{task.claimedBy.avatar || '🌿'}</span>
          {task.status === 'COMPLETED'
            ? <>Done by <strong style={{ color: 'var(--text)' }}>{mine ? 'you' : task.claimedBy.name}</strong> at {task.completedAt}</>
            : <>Claimed by <strong style={{ color: 'var(--text)' }}>{mine ? 'you' : task.claimedBy.name}</strong> at {task.claimedBy.time}</>}
          {task.proofPhoto && <img src={task.proofPhoto} alt="Completion proof" style={{ marginLeft: 'auto', width: 36, height: 36, objectFit: 'cover', borderRadius: 8 }} />}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 900, color: '#facc15', fontFamily: 'JetBrains Mono, monospace' }}>
          <Trophy size={14} /> +{task.points}
        </span>
        <div style={{ flex: 1 }} />
        {task.status === 'CLAIMED' && !mine && <span style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}><Lock size={12} /> Locked</span>}
        {task.status === 'COMPLETED' && <span style={{ fontSize: 11.5, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle2 size={13} /> Fulfilled</span>}
        {task.status === 'OPEN' && !isStudent && <span style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} /> Waiting for a Guardian</span>}
      </div>

      {task.status === 'OPEN' && isStudent && !canClaimTask(task, me) && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 6, alignItems: 'center' }}><Lock size={12} /> {task.assignedStaffId ? `Assigned to ${task.assignedStaffName || 'Ground Staff'} for collection.` : task.ownerId === me?.id ? 'Your own plant — water it from Adopt-a-Plant.' : 'Plant rescue: only for Guardians without their own plant.'}</div>
      )}
      {task.status === 'OPEN' && isStudent && canClaimTask(task, me) && (
        <SlideToAccept height={52} accent={meta.accent} label="Slide to claim" onAccept={() => onClaim(task)} />
      )}

      {mine && (
        <div style={{ display: 'grid', gap: 8 }}>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pick} hidden />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()} style={{ padding: '9px 12px', fontSize: 12.5 }}>
              {photo ? <img src={photo} alt="Proof preview" style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover' }} /> : <Camera size={14} />}
              {photo ? 'Retake' : 'Add proof photo'}
            </button>
            <button type="button" className="btn-eco" onClick={() => onComplete(task, photo)} style={{ flex: 1, padding: '9px 12px', fontSize: 12.5 }}>
              <CheckCircle2 size={14} /> Mark done · +{task.points}
            </button>
          </div>
          {err && <span role="alert" style={{ fontSize: 11.5, color: '#fca5a5' }}>{err}</span>}
        </div>
      )}
    </article>
  );
}

export function GreenGuardianDrawer({ isOpen, onClose }) {
  const { currentUser, isStudent, roleMeta, adjustPoints } = useAuth();
  const [tasks, setTasks] = useState(() => guardianTaskService.getTasks());
  const [filter, setFilter] = useState('OPEN');
  const [toast, setToast] = useState('');
  const me = currentUser && { ...currentUser, ownsPlant: plantCareService.getState().plants.some(p => p.adopterId === currentUser.id) };

  useEffect(() => guardianTaskService.subscribe(setTasks), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  // Students land on their active mission first
  useEffect(() => {
    if (isOpen && isStudent && tasks.some(t => t.status === 'CLAIMED' && t.claimedBy?.id === currentUser?.id)) setFilter('MINE');
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 3200); };

  const claim = (task) => {
    const res = guardianTaskService.claimTask(task.id, me);
    if (!res.success) { say(res.message); return; }
    say(`Locked in. Head to ${res.task.location}.`);
    setFilter('MINE');
  };

  const complete = (task, photo) => {
    const res = guardianTaskService.completeTask(task.id, currentUser?.id, 'Resolved on site by hand.', photo);
    if (!res.success) { say(res.message); return; }
    if (task.category === 'FLORA_CARE' && task.ownerId) plantCareService.rescueWater(task.targetId, currentUser.name);
    adjustPoints(currentUser.id, res.points, `Green Guardian task done: ${task.title}`, 'BOUNTY');
    triggerConfetti();
    triggerEcoCelebration({ title: 'Mission accomplished!', message: `${task.title} — resolved by hand.`, points: res.points, badge: `+${res.points} EcoCredits` });
    say(`+${res.points} EcoCredits added.`);
  };

  const simulate = () => {
    const t = guardianTaskService.simulateDetection();
    say(isStudent ? `New detection raised: ${t.title}` : `Broadcast to every Green Guardian: ${t.title}`);
    if (isStudent) onClose(); // let the alarm take the stage
  };

  if (!isOpen) return null;

  const mineCount = tasks.filter(t => t.status === 'CLAIMED' && t.claimedBy?.id === currentUser?.id).length;
  const filters = [
    { id: 'OPEN', label: 'Open', n: tasks.filter(t => t.status === 'OPEN' && (!isStudent || !t.assignedStaffId)).length },
    ...(isStudent ? [{ id: 'MINE', label: 'My missions', n: mineCount }] : [{ id: 'CLAIMED', label: 'In progress', n: tasks.filter(t => t.status === 'CLAIMED').length }]),
    { id: 'COMPLETED', label: 'Done', n: tasks.filter(t => t.status === 'COMPLETED').length },
  ];
  const shown = tasks.filter(t =>
    (filter === 'MINE' ? t.status === 'CLAIMED' && t.claimedBy?.id === currentUser?.id : t.status === filter) &&
    (!isStudent || !t.assignedStaffId));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', justifyContent: 'flex-end' }} role="dialog" aria-modal="true" aria-label="Green Guardian missions">
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(1,6,3,.7)', backdropFilter: 'blur(6px)', animation: 'fadeIn .2s both' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 520, height: '100%', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, rgba(8,22,15,.98), rgba(4,12,8,.99))', borderLeft: '1px solid var(--border-hi)',
        boxShadow: '-20px 0 60px rgba(0,0,0,.7)', animation: 'drawerInRight .4s var(--ease-out) both',
      }}>
        <header style={{ padding: '20px 22px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(52,211,153,.14)', border: '1px solid rgba(52,211,153,.3)', color: 'var(--green)' }}>
              <Shield size={19} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '-0.01em' }}>{isStudent ? 'Guardian missions' : 'Guardian dispatch board'}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>
                {isStudent ? 'First to slide gets the task. Fix it by hand, earn the points.' : `Viewing as ${roleMeta?.title}. Students claim; you raise and monitor.`}
              </p>
            </div>
            <button type="button" className="tb-btn" onClick={onClose} aria-label="Close" style={{ height: 34, minWidth: 34, padding: 0 }}><X size={16} /></button>
          </div>
          <button type="button" className="btn-ghost" onClick={simulate} style={{ width: '100%', marginTop: 14, padding: '9px 12px', fontSize: 12.5, justifyContent: 'center', color: '#fbbf24', borderColor: 'rgba(251,191,36,.3)' }}>
            <Radar size={14} /> {isStudent ? 'Simulate a sensor detection (demo)' : 'Raise a test detection to all Guardians'}
          </button>
          <div role="tablist" style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {filters.map(f => (
              <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
                className="chip" style={{
                  cursor: 'pointer', fontSize: 12,
                  color: filter === f.id ? 'var(--text)' : 'var(--text-3)',
                  background: filter === f.id ? 'rgba(52,211,153,.14)' : 'transparent',
                  borderColor: filter === f.id ? 'rgba(52,211,153,.4)' : 'var(--border)',
                }}>
                {f.label} <span style={{ fontFamily: 'JetBrains Mono, monospace', opacity: .8 }}>{f.n}</span>
              </button>
            ))}
          </div>
        </header>

        {toast && (
          <div role="status" style={{ margin: '12px 22px 0', padding: '10px 14px', borderRadius: 12, background: 'rgba(52,211,153,.12)', border: '1px solid rgba(52,211,153,.3)', color: 'var(--green-hi)', fontSize: 12.5, fontWeight: 700, animation: 'slideDown .3s var(--ease-out) both' }}>
            {toast}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-3)', fontSize: 13 }}>
              {filter === 'MINE' ? 'No active missions. Keep the app open — the next alarm could be yours.' : 'Nothing here right now.'}
            </div>
          ) : shown.map((t, i) => (
            <TaskCard key={t.id} task={t} me={me} isStudent={isStudent} onClaim={claim} onComplete={complete} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
