import React, { useRef, useState } from 'react';
import { PlantIcon as Sprout } from '@phosphor-icons/react/dist/csr/Plant';
import { DropIcon as Droplets } from '@phosphor-icons/react/dist/csr/Drop';
import { FlameIcon as Flame } from '@phosphor-icons/react/dist/csr/Flame';
import { MapPinIcon as MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { ClockIcon as Clock } from '@phosphor-icons/react/dist/csr/Clock';
import { CameraIcon as Camera } from '@phosphor-icons/react/dist/csr/Camera';
import { WarningIcon as AlertTriangle } from '@phosphor-icons/react/dist/csr/Warning';
import { FastForwardIcon as FastForward } from '@phosphor-icons/react/dist/csr/FastForward';
import { EyeIcon as Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { HandHeartIcon as HeartHandshake } from '@phosphor-icons/react/dist/csr/HandHeart';
import { TrendDownIcon as TrendingDown } from '@phosphor-icons/react/dist/csr/TrendDown';
import { TrendUpIcon as TrendingUp } from '@phosphor-icons/react/dist/csr/TrendUp';
import { CheckCircleIcon as CheckCircle2 } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { BellRingingIcon as BellRing } from '@phosphor-icons/react/dist/csr/BellRinging';
import { SunIcon as Sun } from '@phosphor-icons/react/dist/csr/Sun';
import { CloudRainIcon as CloudRain } from '@phosphor-icons/react/dist/csr/CloudRain';
import { SnowflakeIcon as Snowflake } from '@phosphor-icons/react/dist/csr/Snowflake';
import { RadioIcon as Radio } from '@phosphor-icons/react/dist/csr/Radio';
import { LightbulbIcon as Lightbulb } from '@phosphor-icons/react/dist/csr/Lightbulb';
import { HouseIcon as Home } from '@phosphor-icons/react/dist/csr/House';
import { useAuth } from '../contexts/AuthContext';
import { plantCareService, careStatus, PLANT_RULES } from '../services/plantCareService';
import { fmtClock } from '../components/PlantReminder';
import { litres, days, perDays, everyDays } from '../data/plantProfiles';
import { guardianTaskService } from '../services/guardianTaskService';
import { usePlantCare } from '../hooks/usePlantCare';
import { readPhoto } from '../utils/photo';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { playSuccess } from '../utils/alarmSound';
import { PlantArt } from '../components/PlantArt';

const LEVEL = {
  healthy: { label: 'Healthy', color: '#34d399' },
  thirsty: { label: 'Getting thirsty', color: '#fbbf24' },
  overdue: { label: 'Overdue — losing points', color: '#f87171' },
  flagged: { label: 'Flagged by audit', color: '#f472b6' },
};
const fmt = (ms) => plantCareService.formatDuration(ms);
const every = everyDays;

function CarePlan({ plant, st, now }) {
  const sc = plant.schedule;
  return (
    <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
      <div style={{ padding: 16, borderRadius: 18, background: 'rgba(56,189,248,.06)', border: '1px solid rgba(56,189,248,.22)' }}>
        <div className="eyebrow" style={{ color: '#7dd3fc' }}>Auto care plan</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
          {[
            { k: 'Amount', v: litres(sc.ml), I: Droplets },
            { k: 'Gap', v: every(sc.intervalHrs), I: Clock },
            { k: 'Best time', v: st.windowLabel, I: sc.window === 'evening' ? Sun : Sun },
          ].map(({ k, v, I }, i) => (
            <div key={k} style={{ animation: `staggerIn .4s var(--ease-out) ${i * 0.06}s backwards` }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)' }}><I size={12} /> {k}</div>
              <div key={v} style={{ fontSize: 16, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace', marginTop: 2, animation: 'popIn .4s var(--ease-spring)' }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '9px 12px', borderRadius: 12, background: 'rgba(255,255,255,.04)', fontSize: 13 }}>
          <BellRing size={15} color="#fbbf24" style={{ flexShrink: 0 }} />
          {st.level === 'overdue'
            ? <span>Reminder sent — <strong style={{ color: '#f87171' }}>water now</strong>.</span>
            : now >= st.remindAt && st.canWater
              ? <span>Reminder is live: water before <strong>{fmtClock(st.dueAt, now)}</strong>.</span>
              : <span>We'll remind you <strong>{fmtClock(st.remindAt, now)}</strong>.</span>}
        </div>
      </div>
      <div style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)' }}>
        <div className="eyebrow">Why this plan</div>
        <ul style={{ margin: '8px 0 0', paddingLeft: 16, listStyle: 'disc', display: 'grid', gap: 4, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
          {sc.reasons.map(r => <li key={r}>{r}</li>)}
          {sc.indoor && <li style={{ listStyle: 'none', marginLeft: -16, display: 'flex', gap: 6, color: 'var(--text-3)' }}><Home size={13} /> Indoor plant — sheltered from rain</li>}
        </ul>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, fontSize: 12, color: 'var(--text-3)' }}><Lightbulb size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {sc.tip}</div>
      </div>
    </div>
  );
}

const WEATHER_BTNS = [
  { key: null, label: 'Live', I: Radio },
  { key: 'heatwave', label: 'Heatwave', I: Sun },
  { key: 'rainy', label: 'Rain', I: CloudRain },
  { key: 'incoming', label: 'Rain coming', I: CloudRain },
  { key: 'cool', label: 'Cool', I: Snowflake },
];
const when = (ts, now) => `${fmt(now - ts)} ago`;

function MoistureGauge({ value, color }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div aria-label={`Soil moisture ${Math.round(pct * 100)}%`} style={{ position: 'relative', width: 54, height: 150, borderRadius: 18, border: '1px solid var(--border-hi)', background: 'rgba(255,255,255,.03)', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: `${pct * 100}%`,
        background: `linear-gradient(180deg, ${color}aa, ${color}33)`, transition: 'height 1.2s var(--ease-out)',
      }}>
        <div style={{ position: 'absolute', top: -6, left: -10, right: -10, height: 12, borderRadius: '50%', background: `${color}88`, animation: 'breathe 2.4s ease-in-out infinite' }} />
      </div>
      <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 900, fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(pct * 100)}%</span>
    </div>
  );
}

function MyPlant({ plant, now, onWater, onRelease }) {
  const st = careStatus(plant, now);
  const lv = LEVEL[st.level];
  const fileRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [drops, setDrops] = useState(0);
  const [err, setErr] = useState('');

  const pick = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try { setPhoto(await readPhoto(f, 640)); setErr(''); } catch (x) { setErr(x.message); }
  };
  const water = () => {
    const ok = onWater(photo);
    if (ok) { setDrops(d => d + 1); setPhoto(null); }
  };

  return (
    <section className="glass" style={{ borderRadius: 26, padding: 'clamp(18px, 3vw, 28px)', borderColor: `${lv.color}44`, animation: 'revealUp .6s var(--ease-out) backwards' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 150, height: 150, display: 'grid', placeItems: 'center', borderRadius: 32, background: `radial-gradient(circle at 50% 70%, ${lv.color}26, transparent 70%)` }}>
          <PlantArt plant={plant} level={st.level} size={124} />
          {Array.from({ length: drops ? 6 : 0 }).map((_, i) => (
            <span key={`${drops}-${i}`} className="drop" style={{ left: 40 + i * 13, top: 6, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>

        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div className="eyebrow">Your adopted plant · {plant.id}</div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 900, margin: '4px 0 2px', letterSpacing: '-0.02em' }}>{plant.nickname ? `“${plant.nickname}”` : plant.name}</h2>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontStyle: 'italic' }}>{plant.nickname ? `${plant.name} · ` : ''}{plant.species}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <span className="chip" style={{ color: lv.color, borderColor: `${lv.color}55`, background: `${lv.color}14` }}>
              {st.level === 'overdue' ? <AlertTriangle size={13} /> : <Sprout size={13} />} {lv.label}
            </span>
            <span className="chip"><MapPin size={13} /> {plant.location}</span>
            <span className="chip" style={{ color: '#7dd3fc' }}><Droplets size={13} /> {litres(st.ml)} {every(st.intervalHrs)}</span>
            <span className="chip" style={{ color: '#fb923c' }}><Flame size={13} /> {plant.streak || 0} streak</span>
            {(plant.shields > 0 || plant.shieldSaved) && <span className="chip" style={{ color: '#a78bfa', borderColor: 'rgba(167,139,250,.45)' }}>🛡️ {plant.shieldSaved ? 'Shield saved your streak' : 'Streak shield ready'}</span>}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '14px 0 0', lineHeight: 1.6 }}>
            {st.level === 'overdue'
              ? <>Overdue by <strong style={{ color: '#f87171' }}>{fmt(-st.msToDue)}</strong>. Every further {perDays(st.intervalHrs)} without water costs <strong>−{PLANT_RULES.missPenalty}</strong>, and the watering has been offered to other Guardians.</>
              : st.canWater
                ? <>Window is open. Water within <strong style={{ color: 'var(--text)' }}>{fmt(st.msToDue)}</strong> — give it <strong style={{ color: '#7dd3fc' }}>{litres(st.ml)}</strong> for <strong style={{ color: '#facc15' }}>+{PLANT_RULES.wateringReward}</strong>.</>
                : <>Watered {when(plant.lastWateredAt, now)}. Next window opens in <strong style={{ color: 'var(--text)' }}>{fmt(st.canWaterAt - now)}</strong>.</>}
          </p>
        </div>

        <MoistureGauge value={1 - st.progress} color={lv.color} />
      </div>

      {(() => {
        const rescue = guardianTaskService.activeFor(plant.id);
        const rescued = plant.rescuedBy && plant.rescuedBy.at === plant.lastWateredAt;
        const rained = plant.lastRainCredit && plant.lastRainCredit.at === plant.lastWateredAt;
        if (rained && !rescue) return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16, padding: '10px 14px', borderRadius: 14, background: 'rgba(56,189,248,.08)', border: '1px solid rgba(56,189,248,.3)', fontSize: 13, color: 'var(--text-2)', animation: 'slideDown .4s var(--ease-out) both' }}>
            <CloudRain size={15} color="#38bdf8" style={{ flexShrink: 0 }} />
            <span>Rain watered it for you ({plant.lastRainCredit.mm} mm) {fmt(now - plant.lastRainCredit.at)} ago. Your next watering moved back — no points either way.</span>
          </div>
        );
        if (!rescue && !rescued) return null;
        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16, padding: '10px 14px', borderRadius: 14, background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.3)', fontSize: 13, color: 'var(--text-2)', animation: 'slideDown .4s var(--ease-out) both' }}>
            <AlertTriangle size={15} color="#fbbf24" style={{ flexShrink: 0 }} />
            {rescue?.status === 'CLAIMED'
              ? <span>You missed the deadline, so <strong style={{ color: 'var(--text)' }}>{rescue.claimedBy?.name}</strong> is on the way to water it.</span>
              : rescue
                ? <span>You missed the deadline — other Guardians are being offered this watering. Water it now to take it back.</span>
                : <span><strong style={{ color: 'var(--text)' }}>{plant.rescuedBy.name}</strong> watered it after you missed the deadline. Your streak restarts.</span>}
          </div>
        );
      })()}

      <CarePlan plant={plant} st={st} now={now} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
        <button type="button" className="btn-eco" disabled={!st.canWater} onClick={water}
          style={{ padding: '13px 22px', fontSize: 14.5, opacity: st.canWater ? 1 : .5, cursor: st.canWater ? 'pointer' : 'not-allowed' }}>
          <Droplets size={17} /> {st.canWater ? `Log ${litres(st.ml)} watering · +${PLANT_RULES.wateringReward}` : 'Watered — come back later'}
        </button>
        <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()} style={{ padding: '12px 16px', fontSize: 13.5 }}>
          {photo ? <img src={photo} alt="Watering photo preview" style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover' }} /> : <Camera size={15} />}
          {photo ? 'Photo attached' : 'Attach photo (optional)'}
        </button>
        <button type="button" onClick={onRelease} style={{ marginLeft: 'auto', background: 'none', border: 0, color: 'var(--text-3)', fontSize: 12.5, cursor: 'pointer', textDecoration: 'underline' }}>
          Give up adoption
        </button>
      </div>
      {err && <p role="alert" style={{ color: '#fca5a5', fontSize: 12.5, margin: '8px 0 0' }}>{err}</p>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, padding: '10px 14px', borderRadius: 14, background: 'rgba(232,121,249,.06)', border: '1px solid rgba(232,121,249,.22)', fontSize: 12.5, color: 'var(--text-2)' }}>
        <Eye size={15} color="#e879f9" style={{ flexShrink: 0 }} />
        An anonymous Overseer walks campus checking plants against their care logs. Logging water you didn't pour can cost up to −{PLANT_RULES.auditPenalties.at(-1)}.
      </div>

      {plant.log?.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Care log</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {plant.log.slice(0, 8).map((ts, i) => (
              <span key={ts} className="chip" style={{ animation: `staggerIn .35s var(--ease-out) ${i * 0.04}s backwards` }}>
                <Droplets size={12} color="#38bdf8" /> {when(ts, now)}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function AdoptPlantPage() {
  const { currentUser, adjustPoints } = useAuth();
  const { plants, now, offsetMs, conditions } = usePlantCare();
  const [msg, setMsg] = useState('');
  const mine = plants.find(p => p.adopterId === currentUser?.id);
  const open = plants.filter(p => !p.adopterId);
  const others = plants.filter(p => p.adopterId && p.adopterId !== currentUser?.id);
  const plantHistory = (currentUser?.history || []).filter(h => h.type === 'TREE').slice(0, 6);

  const say = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };

  const adopt = (p) => {
    const res = plantCareService.adopt(p.id, currentUser);
    if (!res.ok) { say(res.message); return; }
    adjustPoints(currentUser.id, res.points, `Adopted ${p.name} (${p.id})`, 'TREE');
    triggerEcoCelebration({ title: `${p.name} is yours!`, message: `Give it ${litres(p.schedule.ml)} ${every(p.schedule.intervalHrs)}, ideally ${p.schedule.window === 'evening' ? '5–7 PM' : '6–9 AM'}. We'll remind you. On time: +${PLANT_RULES.wateringReward}. Missed: −${PLANT_RULES.missPenalty}.`, points: res.points, badge: `+${res.points} adoption bonus` });
  };

  const water = (photo) => {
    const res = plantCareService.water(mine.id, currentUser.id, photo);
    if (!res.ok) { say(res.message); return false; }
    adjustPoints(currentUser.id, res.points, `Watered ${mine.name}${res.bonus ? ` · ${res.plant.streak}-streak bonus` : ''}`, 'TREE');
    playSuccess();
    say(res.bonus ? `+${res.points} — includes a ${res.plant.streak}-streak bonus!` : `+${res.points} EcoCredits. ${res.late ? 'Late, so your streak restarts.' : 'Streak kept alive.'}`);
    return true;
  };

  const release = () => {
    if (!window.confirm(`Give up ${mine.name}? Your streak will be lost.`)) return;
    plantCareService.release(mine.id, currentUser.id);
  };

  return (
    <div data-own-motion style={{ display: 'grid', gap: 22 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', animation: 'revealUp .5s var(--ease-out) backwards' }}>
        <div>
          <div className="eyebrow" style={{ color: '#86efac' }}>Green Guardian duty</div>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, margin: '4px 0 6px', letterSpacing: '-0.03em' }}>Adopt-a-Plant</h1>
          <p style={{ color: 'var(--text-2)', margin: 0, fontSize: 14.5, maxWidth: 620, lineHeight: 1.6 }}>
            Pick one plant on campus and keep it alive. Points follow how well you care for it — and a hidden Overseer checks that the log matches the soil.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { t: `+${PLANT_RULES.wateringReward} per on-time watering`, c: '#34d399', I: TrendingUp },
            { t: `+${PLANT_RULES.streakBonus} every ${PLANT_RULES.streakBonusEvery}-streak`, c: '#facc15', I: Flame },
            { t: `−${PLANT_RULES.missPenalty} per missed cycle`, c: '#f87171', I: TrendingDown },
          ].map(({ t, c, I }) => <span key={t} className="chip" style={{ color: c, borderColor: `${c}44`, background: `${c}10` }}><I size={13} /> {t}</span>)}
        </div>
      </header>

      {msg && <div role="status" className="glass" style={{ padding: '12px 16px', borderRadius: 14, fontSize: 13.5, fontWeight: 700, color: 'var(--green-hi)', animation: 'slideDown .3s var(--ease-out) both' }}>{msg}</div>}

      {mine ? <MyPlant plant={mine} now={now} onWater={water} onRelease={release} /> : (
        <section className="glass" style={{ borderRadius: 24, padding: 24, display: 'flex', gap: 16, alignItems: 'center', borderStyle: 'dashed', animation: 'revealUp .6s var(--ease-out) backwards' }}>
          <HeartHandshake size={34} color="#86efac" style={{ flexShrink: 0, animation: 'float 4s ease-in-out infinite' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>You haven't adopted a plant yet</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-2)', fontSize: 13.5 }}>Choose one below. You get +{PLANT_RULES.adoptBonus} to start, and it's yours to keep alive.</p>
          </div>
        </section>
      )}

      {/* Weather the schedules are planned on */}
      <div className="glass" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, fontSize: 12.5, color: 'var(--text-3)' }}>
        <Sun size={15} />
        <span>
          Schedules planned on{' '}
          <strong style={{ color: conditions?.source === 'simulated' ? '#fbbf24' : 'var(--text)' }}>
            {conditions ? conditions.label : 'species defaults (fetching weather…)'}
          </strong>
        </span>
        {conditions && conditions.source !== 'fallback' && (
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, width: '100%', order: 3 }}>
            {[
              `${conditions.temp}°C`,
              `${conditions.humidity}% humidity`,
              conditions.wind != null && `wind ${conditions.wind} m/s`,
              conditions.clouds != null && `${conditions.clouds}% cloud`,
              `rain now ${conditions.rainMm || 0} mm/h`,
              conditions.popNext6h != null && `next 6 h: ${Math.round((conditions.popNext6h || 0) * 100)}% chance, ~${conditions.rainNext6hMm || 0} mm`,
            ].filter(Boolean).map(t => <span key={t} className="chip" style={{ fontSize: 11.5 }}>{t}</span>)}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {WEATHER_BTNS.map(({ key, label, I }) => {
          const active = key ? conditions?.preset === key : conditions?.source !== 'simulated';
          return (
            <button key={label} type="button" className="btn-ghost" aria-pressed={active} onClick={() => plantCareService.simulateWeather(key)}
              style={{ padding: '6px 11px', fontSize: 12, color: active ? 'var(--text)' : undefined, borderColor: active ? 'rgba(56,189,248,.45)' : undefined, background: active ? 'rgba(56,189,248,.1)' : undefined }}>
              <I size={13} /> {label}
            </button>
          );
        })}
      </div>

      {/* Demo clock — lets a presenter show rewards and penalties without waiting days */}
      <div className="glass" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, fontSize: 12.5, color: 'var(--text-3)' }}>
        <FastForward size={15} />
        <span>Demo clock {offsetMs ? <strong style={{ color: '#fbbf24' }}>+{fmt(offsetMs)}</strong> : 'is live'}</span>
        <div style={{ flex: 1 }} />
        {offsetMs > 0 && (
          <button type="button" className="btn-ghost" onClick={() => plantCareService.resetClock()} style={{ padding: '6px 12px', fontSize: 12 }}>Back to live</button>
        )}
        {[12, 24, 48].map(h => (
          <button key={h} type="button" className="btn-ghost" onClick={() => plantCareService.fastForward(h)} style={{ padding: '6px 12px', fontSize: 12 }}>
            Skip {days(h)}
          </button>
        ))}
      </div>

      <section>
        <h2 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 12px' }}>Plants looking for a Guardian <span style={{ color: 'var(--text-3)', fontWeight: 700 }}>· {open.length}</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
          {open.map((p, i) => {
            const st = careStatus(p, now);
            return (
              <article key={p.id} className="glass spotlight" style={{ borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, animation: `staggerIn .45s var(--ease-out) ${i * 0.05}s backwards` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <PlantArt plant={p} level={st.level} size={48} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 15.5 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontStyle: 'italic' }}>{p.species}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'grid', gap: 4 }}>
                  <span style={{ display: 'flex', gap: 6 }}><MapPin size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {p.location}</span>
                  <span style={{ display: 'flex', gap: 6 }}><Droplets size={13} style={{ flexShrink: 0, marginTop: 1 }} /> Needs {litres(p.schedule.ml)} {every(p.schedule.intervalHrs)} · last watered {when(p.lastWateredAt, now)}</span>
                </div>
                <button type="button" className="btn-eco" disabled={!!mine} onClick={() => adopt(p)}
                  style={{ marginTop: 'auto', padding: '10px 14px', fontSize: 13, opacity: mine ? .45 : 1, cursor: mine ? 'not-allowed' : 'pointer' }}>
                  <Sprout size={15} /> {mine ? 'One plant per Guardian' : `Adopt · +${PLANT_RULES.adoptBonus}`}
                </button>
              </article>
            );
          })}
          {open.length === 0 && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Every plant on campus has a Guardian. Nice.</p>}
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <section className="glass" style={{ borderRadius: 20, padding: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 10px' }}>Adopted by other Guardians</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {others.map(p => {
              const st = careStatus(p, now); const lv = LEVEL[st.level];
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <PlantArt plant={p} level={st.level} size={34} />
                  <span style={{ flex: 1, minWidth: 0 }}><strong>{p.nickname ? `“${p.nickname}” · ${p.name}` : p.name}</strong> <span style={{ color: 'var(--text-3)' }}>· {p.location}</span></span>
                  <span style={{ width: 8, height: 8, borderRadius: 9, background: lv.color, boxShadow: `0 0 8px ${lv.color}` }} title={lv.label} />
                </div>
              );
            })}
          </div>
        </section>
        <section className="glass" style={{ borderRadius: 20, padding: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 10px' }}>Your plant points</h2>
          {plantHistory.length === 0 ? <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>No plant activity yet.</p> : (
            <div style={{ display: 'grid', gap: 8 }}>
              {plantHistory.map(h => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  {h.points >= 0 ? <CheckCircle2 size={15} color="#34d399" /> : <AlertTriangle size={15} color="#f87171" />}
                  <span style={{ flex: 1, minWidth: 0, color: 'var(--text-2)' }}>{h.action}</span>
                  <strong style={{ fontFamily: 'JetBrains Mono, monospace', color: h.points >= 0 ? '#34d399' : '#f87171' }}>{h.points > 0 ? '+' : ''}{h.points}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
