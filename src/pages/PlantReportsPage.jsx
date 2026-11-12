import React, { useState } from 'react';
import { ClipboardTextIcon as ClipboardCheck } from '@phosphor-icons/react/dist/csr/ClipboardText';
import { MapPinIcon as MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { DropIcon as Droplets } from '@phosphor-icons/react/dist/csr/Drop';
import { FlameIcon as Flame } from '@phosphor-icons/react/dist/csr/Flame';
import { EyeIcon as Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { EyeSlashIcon as EyeOff } from '@phosphor-icons/react/dist/csr/EyeSlash';
import { GavelIcon as Gavel } from '@phosphor-icons/react/dist/csr/Gavel';
import { XCircleIcon as XCircle } from '@phosphor-icons/react/dist/csr/XCircle';
import { CheckCircleIcon as CheckCircle2 } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { TrayIcon as Inbox } from '@phosphor-icons/react/dist/csr/Tray';
import { UserIcon as User } from '@phosphor-icons/react/dist/csr/User';
import { useAuth } from '../contexts/AuthContext';
import { plantCareService, careStatus, PLANT_RULES } from '../services/plantCareService';
import { usePlantCare } from '../hooks/usePlantCare';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { PlantArt } from '../components/PlantArt';

const ACCENT = '#f472b6';
const fmt = (ms) => plantCareService.formatDuration(ms);

function PendingCard({ r, now, index, onDecide }) {
  const [penalty, setPenalty] = useState(PLANT_RULES.auditPenalties[1]);
  const [zoom, setZoom] = useState(false);
  return (
    <article className="glass" style={{ borderRadius: 22, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', borderColor: `${ACCENT}33`, animation: `staggerIn .45s var(--ease-out) ${index * 0.06}s backwards` }}>
      <button type="button" onClick={() => setZoom(z => !z)} aria-label={zoom ? 'Shrink photo' : 'Enlarge photo'}
        style={{ minHeight: zoom ? 420 : 240, border: 0, padding: 0, cursor: 'zoom-in', background: `#000 center / ${zoom ? 'contain' : 'cover'} no-repeat url(${r.photo})`, transition: 'min-height .4s var(--ease-out)' }} />
      <div style={{ padding: 18, display: 'grid', gap: 12, alignContent: 'start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PlantArt plant={{ name: r.plantName }} level="flagged" size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{r.plantName} <span style={{ color: 'var(--text-3)', fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace' }}>{r.plantId}</span></h3>
            <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 5 }}><MapPin size={12} style={{ marginTop: 2 }} /> {r.location}</div>
          </div>
          <span className="chip" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{r.id}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(56,189,248,.06)', border: '1px solid rgba(56,189,248,.2)', fontSize: 12.5 }}>
            <div className="eyebrow" style={{ fontSize: 9.5, color: '#7dd3fc' }}>Care log claimed</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}><Droplets size={13} /> {fmt(r.createdAt - r.claimedLastWatered)} before report</div>
            <div style={{ display: 'flex', gap: 6 }}><Flame size={13} /> {r.claimedStreak} in a row</div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 12, background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, fontSize: 12.5 }}>
            <div className="eyebrow" style={{ fontSize: 9.5, color: ACCENT }}>Overseer saw</div>
            <div style={{ marginTop: 4, fontWeight: 800 }}>{r.issue}</div>
            <div style={{ color: 'var(--text-3)' }}>{fmt(now - r.createdAt)} ago</div>
          </div>
        </div>

        {r.note && <blockquote style={{ margin: 0, padding: '10px 12px', borderLeft: `3px solid ${ACCENT}`, background: 'rgba(255,255,255,.03)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)' }}>“{r.note}”</blockquote>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12.5, color: 'var(--text-2)' }}>
          <span className="chip"><User size={12} /> Adopter: <strong style={{ color: 'var(--text)' }}>{r.ownerName}</strong></span>
          <span className="chip" style={{ color: '#e879f9' }}><Eye size={12} /> Overseer: <strong style={{ color: 'var(--text)' }}>{r.reporterName || 'Unknown'}</strong>{r.reporterUsn ? ` · ${r.reporterUsn}` : ''} · {r.reporterCode}</span>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Penalty if upheld</div>
          <div role="radiogroup" aria-label="Penalty" style={{ display: 'flex', gap: 6 }}>
            {PLANT_RULES.auditPenalties.map(p => (
              <button key={p} type="button" role="radio" aria-checked={penalty === p} className="chip" onClick={() => setPenalty(p)}
                style={{ cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', color: penalty === p ? '#fecaca' : 'var(--text-3)', background: penalty === p ? 'rgba(248,113,113,.16)' : 'transparent', borderColor: penalty === p ? 'rgba(248,113,113,.5)' : 'var(--border)' }}>
                −{p}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn-eco" onClick={() => onDecide(r, true, penalty)} style={{ flex: 1, padding: '11px 14px', fontSize: 13.5, background: 'linear-gradient(135deg,#f472b6,#ef4444)' }}>
            <Gavel size={15} /> Uphold · −{penalty}
          </button>
          <button type="button" className="btn-ghost" onClick={() => onDecide(r, false)} style={{ padding: '11px 14px', fontSize: 13.5 }}>
            <XCircle size={15} /> Dismiss
          </button>
        </div>
      </div>
    </article>
  );
}

export function PlantReportsPage() {
  const { currentUser, adjustPoints } = useAuth();
  const state = usePlantCare();
  const { reports, plants, now } = state;
  const pending = reports.filter(r => r.status === 'PENDING');
  const decided = reports.filter(r => r.status !== 'PENDING');
  const adopted = plants.filter(p => p.adopterId);
  const holder = plantCareService.seatHolderForStaff();

  const decide = (r, upheld, penalty) => {
    const res = plantCareService.review(r.id, { upheld, penalty, reviewer: currentUser.name });
    if (!res.ok) return;
    if (res.owner) adjustPoints(res.owner.userId, res.owner.delta, `Plant audit failed: ${r.plantName} — care log didn't match the plant`, 'TREE');
    if (res.overseer) adjustPoints(res.overseer.userId, res.overseer.delta, 'Campus stewardship bonus', 'OTHER');
    triggerEcoCelebration(upheld
      ? { title: 'Report upheld', message: `${r.ownerName} loses ${penalty} points and ${r.plantName} is flagged for 48h.`, points: 0, badge: `−${penalty} applied` }
      : { title: 'Report dismissed', message: `${r.plantName}'s care log stands. No points changed.`, points: 0, badge: 'No action' });
  };

  return (
    <div data-own-motion style={{ display: 'grid', gap: 22 }}>
      <header style={{ animation: 'revealUp .5s var(--ease-out) backwards' }}>
        <div className="eyebrow" style={{ color: ACCENT }}>Eco Ranger · Verification</div>
        <h1 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, margin: '4px 0 6px', letterSpacing: '-0.03em' }}>Plant Care Audits</h1>
        <p style={{ color: 'var(--text-2)', margin: 0, fontSize: 14.5, maxWidth: 680, lineHeight: 1.6 }}>
          The Overseer photographs adopted plants that look neglected despite a healthy care log. Check the photo, visit if needed, then uphold or dismiss.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <span className="chip" style={{ color: '#e879f9', borderColor: 'rgba(232,121,249,.4)' }}>
            <Eye size={13} /> {holder ? <>Current Overseer: <strong style={{ color: 'var(--text)' }}>{holder.name}</strong> · {holder.usn} · {holder.code}</> : 'Overseer seat is vacant'}
          </span>
          <span className="chip" style={{ color: 'var(--text-3)' }}><EyeOff size={13} /> Staff only — students never see this name</span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        {[
          { k: 'Awaiting review', v: pending.length, c: '#fbbf24' },
          { k: 'Upheld', v: decided.filter(r => r.status === 'UPHELD').length, c: ACCENT },
          { k: 'Dismissed', v: decided.filter(r => r.status === 'DISMISSED').length, c: '#94a3b8' },
          { k: 'Adopted plants', v: adopted.length, c: '#34d399' },
        ].map((s, i) => (
          <div key={s.k} className="glass" style={{ borderRadius: 18, padding: 16, animation: `staggerIn .45s var(--ease-out) ${i * 0.05}s backwards` }}>
            <div className="eyebrow">{s.k}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.c, fontFamily: 'JetBrains Mono, monospace' }}>{s.v}</div>
          </div>
        ))}
      </div>

      <section style={{ display: 'grid', gap: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardCheck size={18} color={ACCENT} /> Review queue</h2>
        {pending.length === 0 ? (
          <div className="glass" style={{ borderRadius: 20, padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13.5 }}>
            <Inbox size={30} style={{ animation: 'float 4s ease-in-out infinite' }} />
            <p style={{ margin: '8px 0 0' }}>No reports waiting. The Overseer files them from the student app.</p>
          </div>
        ) : pending.map((r, i) => <PendingCard key={r.id} r={r} now={now} index={i} onDecide={decide} />)}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <section className="glass" style={{ borderRadius: 20, padding: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 10px' }}>Decided</h2>
          {decided.length === 0 ? <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>Nothing decided yet.</p> : (
            <div style={{ display: 'grid', gap: 10 }}>
              {decided.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <img src={r.photo} alt="" style={{ width: 38, height: 38, borderRadius: 9, objectFit: 'cover' }} />
                  <span style={{ flex: 1, minWidth: 0 }}><strong>{r.plantName}</strong> <span style={{ color: 'var(--text-3)' }}>· {r.ownerName} · by {r.reviewedBy}</span></span>
                  {r.status === 'UPHELD'
                    ? <span style={{ color: ACCENT, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>−{r.penalty}</span>
                    : <span style={{ color: 'var(--text-3)', display: 'flex', gap: 4, alignItems: 'center' }}><CheckCircle2 size={13} /> cleared</span>}
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="glass" style={{ borderRadius: 20, padding: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 10px' }}>Adopted plants at a glance</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {adopted.map(p => {
              const st = careStatus(p, now);
              const c = { healthy: '#34d399', thirsty: '#fbbf24', overdue: '#f87171', flagged: ACCENT }[st.level];
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <PlantArt plant={p} level={careStatus(p, now).level} size={34} />
                  <span style={{ flex: 1, minWidth: 0 }}><strong>{p.nickname ? `“${p.nickname}” · ${p.name}` : p.name}</strong> <span style={{ color: 'var(--text-3)' }}>· {p.adopterName}</span></span>
                  <span style={{ fontSize: 11.5, color: c, fontWeight: 800, textTransform: 'capitalize' }}>{st.level}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
