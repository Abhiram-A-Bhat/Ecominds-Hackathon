import React, { useRef, useState } from 'react';
import { EyeIcon as Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { EyeSlashIcon as EyeOff } from '@phosphor-icons/react/dist/csr/EyeSlash';
import { LockIcon as Lock } from '@phosphor-icons/react/dist/csr/Lock';
import { ShieldWarningIcon as ShieldQuestion } from '@phosphor-icons/react/dist/csr/ShieldWarning';
import { CameraIcon as Camera } from '@phosphor-icons/react/dist/csr/Camera';
import { MapPinIcon as MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { DropIcon as Droplets } from '@phosphor-icons/react/dist/csr/Drop';
import { FlameIcon as Flame } from '@phosphor-icons/react/dist/csr/Flame';
import { XIcon as X } from '@phosphor-icons/react/dist/csr/X';
import { PaperPlaneTiltIcon as Send } from '@phosphor-icons/react/dist/csr/PaperPlaneTilt';
import { ClockIcon as Clock } from '@phosphor-icons/react/dist/csr/Clock';
import { CheckCircleIcon as CheckCircle2 } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { XCircleIcon as XCircle } from '@phosphor-icons/react/dist/csr/XCircle';
import { UserMinusIcon as UserX } from '@phosphor-icons/react/dist/csr/UserMinus';
import { SignOutIcon as LogOut } from '@phosphor-icons/react/dist/csr/SignOut';
import { SparkleIcon as Sparkles } from '@phosphor-icons/react/dist/csr/Sparkle';
import { useAuth } from '../contexts/AuthContext';
import { plantCareService, careStatus, PLANT_RULES } from '../services/plantCareService';
import { usePlantCare } from '../hooks/usePlantCare';
import { readPhoto } from '../utils/photo';
import { SlideToAccept } from '../components/guardian/SlideToAccept';
import { PlantAuditMap, auditStatusOf, AUDIT_STATUS } from '../components/PlantAuditMap';
import { MapTrifoldIcon as MapIcon } from '@phosphor-icons/react/dist/csr/MapTrifold';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { PlantArt } from '../components/PlantArt';

const ACCENT = '#e879f9';
const ISSUES = ['Soil bone dry', 'Wilting / drooping', 'Dead or dying', 'Plant missing', 'Weeds & litter in pot'];
const fmt = (ms) => plantCareService.formatDuration(ms);
const STATUS = {
  PENDING: { label: 'Awaiting staff', color: '#fbbf24', I: Clock },
  UPHELD: { label: 'Upheld', color: '#f472b6', I: CheckCircle2 },
  DISMISSED: { label: 'Dismissed', color: '#94a3b8', I: XCircle },
};

function Hero({ icon: I, title, children, tone = ACCENT }) {
  return (
    <section className="glass" style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, padding: 'clamp(22px, 4vw, 40px)', borderColor: `${tone}40`, animation: 'revealUp .6s var(--ease-out) backwards' }}>
      <div aria-hidden="true" style={{ position: 'absolute', right: -60, top: -60, width: 260, height: 260, borderRadius: '50%', background: `radial-gradient(circle, ${tone}30, transparent 70%)`, animation: 'breathe 5s ease-in-out infinite' }} />
      <div style={{ position: 'relative', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <span style={{ width: 72, height: 72, borderRadius: 24, display: 'grid', placeItems: 'center', color: tone, background: `${tone}18`, border: `1px solid ${tone}50`, animation: 'float 5s ease-in-out infinite', flexShrink: 0 }}>
          <I size={34} />
        </span>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <h1 style={{ fontSize: 'clamp(24px, 3.4vw, 34px)', fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.02em' }}>{title}</h1>
          {children}
        </div>
      </div>
    </section>
  );
}

function ReportModal({ plant, onClose, onSubmit }) {
  const fileRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [issue, setIssue] = useState(ISSUES[0]);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  const pick = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try { setPhoto(await readPhoto(f)); setErr(''); } catch (x) { setErr(x.message); }
  };
  const submit = () => {
    if (!photo) { setErr('A photo of the plant is required — staff verify against it.'); return; }
    onSubmit({ photo, issue, note });
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="rep-title" style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(1,6,3,.75)', backdropFilter: 'blur(6px)', animation: 'fadeIn .2s both' }} />
      <div className="glass" style={{ position: 'relative', width: '100%', maxWidth: 480, borderRadius: 24, padding: 22, background: 'rgba(8,20,14,.98)', borderColor: `${ACCENT}44`, animation: 'revealScale .35s var(--ease-out) both', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <PlantArt plant={plant} level={careStatus(plant).level} size={42} />
          <div style={{ flex: 1 }}>
            <h2 id="rep-title" style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>Report neglect: {plant.name}</h2>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{plant.location}</div>
          </div>
          <button type="button" className="tb-btn" onClick={onClose} aria-label="Close" style={{ height: 34, minWidth: 34, padding: 0 }}><X size={16} /></button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
        <button type="button" onClick={() => fileRef.current?.click()} style={{
          width: '100%', aspectRatio: '4 / 3', borderRadius: 18, border: `2px dashed ${photo ? 'transparent' : `${ACCENT}66`}`,
          background: photo ? `center / cover no-repeat url(${photo})` : `${ACCENT}0a`, color: 'var(--text-2)', cursor: 'pointer',
          display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden',
        }}>
          {!photo && <span style={{ display: 'grid', justifyItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700 }}><Camera size={30} color={ACCENT} /> Take or upload a photo of the plant</span>}
          {photo && <span className="chip" style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,.6)' }}><Camera size={12} /> Retake</span>}
        </button>

        <div className="eyebrow" style={{ margin: '16px 0 8px' }}>What's wrong?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ISSUES.map(i => (
            <button key={i} type="button" className="chip" onClick={() => setIssue(i)} aria-pressed={issue === i}
              style={{ cursor: 'pointer', color: issue === i ? 'var(--text)' : 'var(--text-3)', background: issue === i ? `${ACCENT}22` : 'transparent', borderColor: issue === i ? `${ACCENT}66` : 'var(--border)' }}>
              {i}
            </button>
          ))}
        </div>

        <label htmlFor="rep-note" className="eyebrow" style={{ display: 'block', margin: '16px 0 8px' }}>Note for staff (optional)</label>
        <textarea id="rep-note" value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="e.g. Log says watered 3 hours ago but the soil is cracked and the leaves are brown."
          style={{ width: '100%', resize: 'vertical', borderRadius: 14, padding: 12, background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13.5 }} />

        {err && <p role="alert" style={{ color: '#fca5a5', fontSize: 12.5, margin: '10px 0 0' }}>{err}</p>}
        <button type="button" className="btn-eco" onClick={submit} style={{ width: '100%', marginTop: 16, padding: '13px 16px', fontSize: 14 }}>
          <Send size={16} /> Send anonymously to staff
        </button>
        <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '10px 0 0', textAlign: 'center' }}>Only verifying staff see your name. Students never do.</p>
      </div>
    </div>
  );
}

function OverseerConsole({ me, state, seatCode }) {
  const [reporting, setReporting] = useState(null);
  const [msg, setMsg] = useState('');
  const [masked, setMasked] = useState(true);
  const { plants, now } = state;
  const auditable = plants.filter(p => p.adopterId && p.adopterId !== me.id);
  const mine = plantCareService.myReports(me.id);
  const [selectedId, setSelectedId] = useState(null);
  const mapRef = useRef(null);

  // Plants the Overseer has walked past and found fine, per watering (re-opens after the next watering)
  const CHECK_KEY = `ecosphere_overseer_checked_${seatCode}`;
  const [checked, setChecked] = useState(() => { try { return JSON.parse(localStorage.getItem(CHECK_KEY)) || {}; } catch { return {}; } });
  const markChecked = (p) => {
    const next = { ...checked, [p.id]: p.lastWateredAt };
    setChecked(next);
    try { localStorage.setItem(CHECK_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setMsg(`${p.nickname || p.name} marked as fine for this round.`);
  };
  const showOnMap = (id) => { setSelectedId(id); mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  const toCheck = auditable.filter(p => auditStatusOf(p, state.reports, checked, now) === 'check').length;

  const submit = (data) => {
    const res = plantCareService.fileReport(me.id, { plantId: reporting.id, ...data });
    setReporting(null);
    if (!res.ok) { setMsg(res.message); return; }
    setMsg(`Report ${res.report.id} sent. Staff will check the photo against the care log.`);
    triggerEcoCelebration({ title: 'Audit filed anonymously', message: `Report ${res.report.id} for ${res.report.plantName} is with staff. If upheld you earn +${PLANT_RULES.overseerReward}, recorded as a stewardship bonus.`, points: 0, badge: seatCode });
  };

  const leave = () => {
    if (!window.confirm('Step down as Overseer? The seat opens for another student.')) return;
    plantCareService.leaveSeat(me.id);
  };

  return (
    <>
      <Hero icon={Eye} title="You are the Overseer">
        <p style={{ color: 'var(--text-2)', margin: 0, fontSize: 14.5, lineHeight: 1.6, maxWidth: 640 }}>
          Walk campus, compare each plant with its care log, and report the ones being faked. Other students can never see that it's you — only the staff who verify your reports know.
          Don't tell anyone; a known Overseer can be bribed.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          <button type="button" className="chip" onClick={() => setMasked(m => !m)} style={{ cursor: 'pointer', color: ACCENT, borderColor: `${ACCENT}55`, background: `${ACCENT}12`, fontFamily: 'JetBrains Mono, monospace' }}>
            {masked ? <EyeOff size={13} /> : <Eye size={13} />} Seat code {masked ? 'OVR-••••' : seatCode}
          </button>
          <span className="chip"><Sparkles size={13} /> +{PLANT_RULES.overseerReward} per upheld report</span>
          <button type="button" className="chip" onClick={leave} style={{ cursor: 'pointer', color: 'var(--text-3)' }}><LogOut size={13} /> Step down</button>
        </div>
      </Hero>

      {msg && <div role="status" className="glass" style={{ padding: '12px 16px', borderRadius: 14, fontSize: 13.5, fontWeight: 700, color: ACCENT, animation: 'slideDown .3s var(--ease-out) both' }}>{msg}</div>}

      <section ref={mapRef}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><MapIcon size={18} color={ACCENT} /> Audit map</h2>
          <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
            {toCheck ? <><strong style={{ color: '#34d399' }}>{toCheck}</strong> plant{toCheck === 1 ? '' : 's'} still to check this round. Tap a pin for its care log, or use the locate button to see where you are.</> : 'Every plant has been checked this round.'}
          </span>
        </div>
        <PlantAuditMap
          plants={auditable} reports={state.reports} now={now} checked={checked}
          selectedId={selectedId} onSelect={setSelectedId} onReport={setReporting} onMarkChecked={markChecked}
          height="min(460px, 70vh)"
        />
      </section>

      <section>
        <h2 style={{ fontSize: 17, fontWeight: 900, margin: '0 0 4px' }}>Plants to audit · {auditable.length}</h2>
        <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '0 0 12px' }}>Adopters are hidden from you too, so audits stay about the plant, not the person.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {auditable.map((p, i) => {
            const st = careStatus(p, now);
            const pending = state.reports.some(r => r.plantId === p.id && r.status === 'PENDING');
            const status = auditStatusOf(p, state.reports, checked, now);
            return (
              <article key={p.id} className="glass spotlight" style={{ borderRadius: 20, padding: 18, display: 'grid', gap: 10, borderColor: selectedId === p.id ? `${AUDIT_STATUS[status].color}88` : undefined, animation: `staggerIn .45s var(--ease-out) ${i * 0.05}s backwards` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <PlantArt plant={p} level={st.level} size={44} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900 }}>{p.nickname ? `“${p.nickname}” · ${p.name}` : p.name} <span style={{ color: 'var(--text-3)', fontWeight: 700, fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace' }}>{p.id}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 5 }}><MapPin size={12} style={{ marginTop: 2 }} /> {p.location}</div>
                  </div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-2)', display: 'grid', gap: 4 }}>
                  <div className="eyebrow" style={{ fontSize: 9.5 }}>The care log claims</div>
                  <span style={{ display: 'flex', gap: 6 }}><Droplets size={13} color="#38bdf8" /> Watered {fmt(now - p.lastWateredAt)} ago</span>
                  <span style={{ display: 'flex', gap: 6 }}><Flame size={13} color="#fb923c" /> {p.streak || 0} waterings in a row</span>
                  {st.level === 'overdue' && <span style={{ color: '#f87171' }}>Already overdue — the system docks this automatically.</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: AUDIT_STATUS[status].color, fontWeight: 700 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 8, background: AUDIT_STATUS[status].color }} /> {AUDIT_STATUS[status].label}
                  <button type="button" onClick={() => showOnMap(p.id)} className="chip" style={{ marginLeft: 'auto', cursor: 'pointer', fontSize: 11 }}><MapPin size={11} /> Show on map</button>
                </div>
                <button type="button" className="btn-ghost" disabled={pending} onClick={() => setReporting(p)}
                  style={{ justifyContent: 'center', padding: '10px 12px', fontSize: 13, color: pending ? 'var(--text-3)' : '#f9a8d4', borderColor: pending ? 'var(--border)' : `${ACCENT}55` }}>
                  <Camera size={15} /> {pending ? 'Report awaiting staff' : 'Report neglect with photo'}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="glass" style={{ borderRadius: 20, padding: 18 }}>
        <h2 style={{ fontSize: 15, fontWeight: 900, margin: '0 0 10px' }}>Your reports this term</h2>
        {mine.length === 0 ? <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>No reports yet.</p> : (
          <div style={{ display: 'grid', gap: 10 }}>
            {mine.map(r => {
              const s = STATUS[r.status];
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                  <img src={r.photo} alt={`Evidence for ${r.plantName}`} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{r.plantName}</strong> <span style={{ color: 'var(--text-3)' }}>· {r.issue}</span>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{r.id}</div>
                  </div>
                  <span className="chip" style={{ color: s.color, borderColor: `${s.color}55` }}><s.I size={13} /> {s.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {reporting && <ReportModal plant={reporting} onClose={() => setReporting(null)} onSubmit={submit} />}
    </>
  );
}

function AdminSeatControl({ state }) {
  const { seat, reports, now } = state;
  const term = seat.occupied ? reports.filter(r => r.reporterCode === seat.code) : [];
  const upheld = reports.filter(r => r.status === 'UPHELD').length;
  const decided = reports.filter(r => r.status !== 'PENDING').length;

  const vacate = () => {
    if (!window.confirm('End the current Overseer term? The holder is notified only by losing access; you will still not learn who it was.')) return;
    plantCareService.vacateSeat();
  };

  return (
    <>
      <Hero icon={seat.occupied ? Lock : ShieldQuestion} title={seat.occupied ? 'The Overseer seat is filled' : 'The Overseer seat is vacant'}>
        <p style={{ color: 'var(--text-2)', margin: 0, fontSize: 14.5, lineHeight: 1.6, maxWidth: 640 }}>
          One student at a time audits adopted plants anonymously. Identity is sealed even from Earth Wardens — you can see the seat code, its activity and outcomes, and rotate the term.
        </p>
        {seat.occupied && (
          <button type="button" className="btn-ghost" onClick={vacate} style={{ marginTop: 16, padding: '10px 16px', fontSize: 13, color: '#fca5a5', borderColor: 'rgba(248,113,113,.35)' }}>
            <UserX size={15} /> End term & open the seat
          </button>
        )}
      </Hero>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { k: 'Seat code', v: seat.occupied ? seat.code : '—', c: ACCENT },
          { k: 'Term length', v: seat.occupied ? fmt(now - seat.since) : '—', c: 'var(--text)' },
          { k: 'Reports this term', v: term.length, c: '#fbbf24' },
          { k: 'Upheld (all time)', v: decided ? `${upheld}/${decided}` : '0', c: '#f472b6' },
        ].map((s, i) => (
          <div key={s.k} className="glass" style={{ borderRadius: 18, padding: 16, animation: `staggerIn .45s var(--ease-out) ${i * 0.06}s backwards` }}>
            <div className="eyebrow">{s.k}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: s.c, fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>{s.v}</div>
          </div>
        ))}
      </div>
    </>
  );
}

export function OverseerPage() {
  const { currentUser, isAdmin } = useAuth();
  const state = usePlantCare();
  const [msg, setMsg] = useState('');
  const amOverseer = !!currentUser && plantCareService.isOverseer(currentUser.id);

  const take = () => {
    const res = plantCareService.takeSeat(currentUser);
    if (!res.ok) { setMsg(res.message); return; }
    triggerEcoCelebration({ title: 'You took the Overseer oath', message: 'Your seat code is your only public identity. Keep the role to yourself.', points: 0, badge: res.code });
  };

  let body;
  if (isAdmin) body = <AdminSeatControl state={state} />;
  else if (amOverseer) body = <OverseerConsole me={currentUser} state={state} seatCode={state.seat.code} />;
  else if (state.seat.occupied) body = (
    <Hero icon={Lock} title="The seat is taken">
      <p style={{ color: 'var(--text-2)', margin: 0, fontSize: 14.5, lineHeight: 1.6, maxWidth: 620 }}>
        Someone on campus is the Overseer right now. Their identity is hidden from students — it could be anyone you know. The best plan is simple: actually water your plant.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        <span className="chip" style={{ color: ACCENT, fontFamily: 'JetBrains Mono, monospace' }}><Lock size={13} /> {state.seat.code}</span>
        <span className="chip"><Clock size={13} /> Serving {fmt(state.now - state.seat.since)}</span>
      </div>
    </Hero>
  );
  else body = (
    <Hero icon={Eye} title="Become the Overseer">
      <p style={{ color: 'var(--text-2)', margin: 0, fontSize: 14.5, lineHeight: 1.6, maxWidth: 640 }}>
        The seat is open. Only one student can hold it at a time. You'll audit adopted plants and report anyone faking their care log with a photo; staff verify and the owner loses points.
      </p>
      <ul style={{ margin: '14px 0 18px', paddingLeft: 18, listStyle: 'disc', color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.8 }}>
        <li>Other students never learn it's you. Only the staff who verify your reports see your name.</li>
        <li>+{PLANT_RULES.overseerReward} for every report staff uphold, logged as a "stewardship bonus".</li>
        <li>You can step down any time; admins can also rotate the seat.</li>
      </ul>
      <div style={{ maxWidth: 420 }}>
        <SlideToAccept accent={ACCENT} label="Slide to take the oath" onAccept={take} />
      </div>
    </Hero>
  );

  return (
    <div data-own-motion style={{ display: 'grid', gap: 20 }}>
      {msg && <div role="status" className="glass" style={{ padding: '12px 16px', borderRadius: 14, fontSize: 13.5, fontWeight: 700, color: '#fca5a5' }}>{msg}</div>}
      {body}
    </div>
  );
}
