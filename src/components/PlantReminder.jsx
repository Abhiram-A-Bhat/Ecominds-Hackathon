import React, { useEffect, useState } from 'react';
import { DropIcon as Droplets } from '@phosphor-icons/react/dist/csr/Drop';
import { BellRingingIcon as BellRing } from '@phosphor-icons/react/dist/csr/BellRinging';
import { XIcon as X } from '@phosphor-icons/react/dist/csr/X';
import { AlarmIcon as AlarmClock } from '@phosphor-icons/react/dist/csr/Alarm';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../router/Router';
import { usePlantCare } from '../hooks/usePlantCare';
import { careStatus, plantCareService, PLANT_RULES } from '../services/plantCareService';
import { litres, perDays } from '../data/plantProfiles';
import { PlantArt } from './PlantArt';

const SEEN_KEY = 'ecosphere_plant_reminders_v1';
const read = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || {}; } catch { return {}; } };
const write = (v) => { try { localStorage.setItem(SEEN_KEY, JSON.stringify(v)); } catch { /* ignore */ } };

export const fmtClock = (ts, now) => {
  const d = new Date(ts), n = new Date(now);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const days = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date(n).setHours(0, 0, 0, 0)) / 864e5);
  return days === 0 ? `today, ${time}` : days === 1 ? `tomorrow, ${time}` : days === -1 ? `yesterday, ${time}` : `${d.toLocaleDateString([], { weekday: 'short' })}, ${time}`;
};

const COPY = {
  due:     { title: (p) => `Time to water your ${p.name}`, tone: '#38bdf8' },
  urgent:  { title: (p) => `${p.name} is due soon`, tone: '#fbbf24' },
  overdue: { title: (p) => `${p.name} missed its watering`, tone: '#f87171' },
};

/**
 * Watering reminders for students with an adopted plant. Fires an in-app card
 * and (if allowed) a browser notification once per stage per watering cycle:
 * when the recommended time arrives, 2 hours before the deadline, and when overdue.
 */
export function PlantReminder() {
  const { currentUser } = useAuth();
  const { navigate, path } = useRouter();
  const { plants, now } = usePlantCare();
  const [seen, setSeen] = useState(read);
  const plant = plants.find(p => p.adopterId === currentUser?.id);

  let stage = null, st = null;
  if (plant) {
    st = careStatus(plant, now);
    if (st.level === 'overdue') stage = 'overdue';
    else if (st.canWater && st.msToDue <= 2 * 3600e3) stage = 'urgent';
    else if (st.canWater && now >= st.remindAt) stage = 'due';
  }
  const key = plant && stage ? `${plant.id}:${plant.lastWateredAt}:${stage}` : null;
  const entry = key ? seen[key] : null;
  const show = key && !(entry?.dismissed) && !(entry?.snoozeUntil > now);

  // Browser notification once per key
  useEffect(() => {
    if (!key || entry?.notified) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🌱 ${COPY[stage].title(plant)}`, {
          body: stage === 'overdue'
            ? `Water ${litres(st.ml)} now. It has been offered to other Guardians, and you lose ${PLANT_RULES.missPenalty} points each further ${perDays(st.intervalHrs)} it stays dry.`
            : `Give it ${litres(st.ml)} before ${fmtClock(st.dueAt, now)} for +${PLANT_RULES.wateringReward} EcoCredits.`,
          tag: key,
        });
      } catch { /* some browsers need a service worker */ }
    }
    const next = { ...read(), [key]: { ...(read()[key] || {}), notified: true } };
    write(next); setSeen(next);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!show || path === '/login') return null;
  const c = COPY[stage];

  const update = (patch) => { const next = { ...read(), [key]: { ...(read()[key] || {}), ...patch } }; write(next); setSeen(next); };

  return (
    <div role="alert" className="plant-reminder" style={{ '--tone': c.tone }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ position: 'relative', width: 46, height: 46, flexShrink: 0, borderRadius: 14, display: 'grid', placeItems: 'center', background: `${c.tone}1c`, border: `1px solid ${c.tone}55` }}>
          <PlantArt plant={plant} level={st.level} size={34} />
          <BellRing size={14} color={c.tone} style={{ position: 'absolute', top: -5, right: -5, animation: 'alarmWobble 1s ease-in-out infinite' }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 14.5 }}>{c.title(plant)}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 3, lineHeight: 1.5 }}>
            <strong style={{ color: '#7dd3fc' }}>{litres(st.ml)}</strong> at {plant.location}.{' '}
            {stage === 'overdue'
              ? <span style={{ color: '#fca5a5' }}>Deadline missed — other Guardians can now take it. −{PLANT_RULES.missPenalty} for each further {perDays(st.intervalHrs)}.</span>
              : <>Due by {fmtClock(st.dueAt, now)} for +{PLANT_RULES.wateringReward}.</>}
          </div>
        </div>
        <button type="button" onClick={() => update({ dismissed: true })} aria-label="Dismiss reminder" style={{ background: 'none', border: 0, color: 'var(--text-3)', cursor: 'pointer', padding: 2 }}><X size={16} /></button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" className="btn-eco" style={{ flex: 1, padding: '9px 12px', fontSize: 13 }} onClick={() => { update({ dismissed: true }); navigate('/adopt'); }}>
          <Droplets size={15} /> Water now
        </button>
        {stage !== 'overdue' && (
          <button type="button" className="btn-ghost" style={{ padding: '9px 12px', fontSize: 13 }} onClick={() => update({ snoozeUntil: plantCareService.now() + 30 * 60e3 })}>
            <AlarmClock size={15} /> 30 min
          </button>
        )}
      </div>
    </div>
  );
}
