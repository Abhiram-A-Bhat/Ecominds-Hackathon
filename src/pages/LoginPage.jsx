import React, { useState, useEffect } from 'react';
import { EyeIcon as Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { EyeSlashIcon as EyeOff } from '@phosphor-icons/react/dist/csr/EyeSlash';
import { CircleNotchIcon as LoaderCircle } from '@phosphor-icons/react/dist/csr/CircleNotch';
import { ArrowRightIcon as ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { CheckIcon as Check } from '@phosphor-icons/react/dist/csr/Check';
import { RecycleIcon as Recycle } from '@phosphor-icons/react/dist/csr/Recycle';
import { DropIcon as Droplets } from '@phosphor-icons/react/dist/csr/Drop';
import { TreeIcon as TreePine } from '@phosphor-icons/react/dist/csr/Tree';
import { ScanIcon as ScanLine } from '@phosphor-icons/react/dist/csr/Scan';
import { WarningCircleIcon as AlertCircle } from '@phosphor-icons/react/dist/csr/WarningCircle';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from '../router/Router';
import { ThemeToggle } from '../components/ThemeToggle';
import { BrandMark } from '../components/shell/BrandMark';
import { INTERFACES } from '../config/demoAccounts';

const HIGHLIGHTS = [
  { icon: Recycle, color: '#a78bfa', text: 'Pass senior gear to juniors for free' },
  { icon: Droplets, color: '#38bdf8', text: 'Report leaks & phantom power for +35 pts' },
  { icon: TreePine, color: '#4ade80', text: 'Adopt a plant — water it on time or lose points' },
  { icon: ScanLine, color: '#34d399', text: 'YOLO vision sorts e-waste in 14 ms' },
];

function RotatingHighlight() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(x => (x + 1) % HIGHLIGHTS.length), 2800);
    return () => clearInterval(t);
  }, []);
  const h = HIGHLIGHTS[i];
  const Icon = h.icon;
  return (
    <div style={{ height: 44, position: 'relative', overflow: 'hidden' }} aria-live="polite">
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, animation: 'revealUp .55s var(--ease-out) both' }}>
        <span style={{ width: 36, height: 36, borderRadius: 11, display: 'grid', placeItems: 'center', color: h.color, background: `${h.color}1f`, border: `1px solid ${h.color}40` }}>
          <Icon size={17} />
        </span>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>{h.text}</span>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, authError, currentUser } = useAuth();
  const { navigate } = useRouter();
  const [mode, setMode] = useState('STUDENT');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [shakeKey, setShakeKey] = useState(0);
  const [picked, setPicked] = useState(null);
  const [openIface, setOpenIface] = useState('STUDENT');
  const [showForm, setShowForm] = useState(false);

  // One click: show progress on the chosen account, then sign in
  const quickLogin = async (acc, role) => {
    setMode(role); setPicked(acc.id); setIdentifier(acc.id); setPassword(acc.pw);
    setStatus('loading');
    await new Promise(r => setTimeout(r, 500));
    if (login(acc.id, acc.pw)) { setStatus('success'); setTimeout(() => navigate('/'), 380); }
    else { setStatus('error'); setShakeKey(k => k + 1); }
  };

  useEffect(() => {
    if (currentUser && status !== 'success') navigate('/');
  }, [currentUser, navigate, status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    await new Promise(r => setTimeout(r, 650));
    const ok = login(identifier.trim(), password);
    if (ok) {
      setStatus('success');
      setTimeout(() => navigate('/'), 450);
    } else {
      setStatus('error');
      setShakeKey(k => k + 1);
    }
  };


  const isStaff = mode !== 'STUDENT';
  const inputStyle = {
    width: '100%', height: 48, padding: '0 16px', borderRadius: 13,
    background: 'rgba(2,10,6,.7)', border: '1px solid var(--border-hi)',
    color: 'var(--text)', fontSize: 15, fontWeight: 600, outline: 'none',
    fontFamily: 'inherit', transition: 'border-color .2s, box-shadow .2s',
  };
  const focusOn = e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(52,211,153,.12)'; };
  const focusOff = e => { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.boxShadow = 'none'; };

  return (
    <div className="login-page" style={{ minHeight: '100vh', position: 'relative', display: 'grid', alignItems: 'center', padding: 'clamp(16px, 4vw, 48px)' }}>
      <div className="login-theme-toggle"><ThemeToggle /></div>

      <div className="login-grid" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 'clamp(28px, 5vw, 72px)', alignItems: 'center' }}>
        {/* ── Story column ─────────────────────────────────────────── */}
        <section className="login-story">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, animation: 'revealUp .6s var(--ease-out) both' }}>
            <BrandMark size={44} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.02em' }}>Ecominds</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.08em' }}>RNSIT · CAMPUS OS</div>
            </div>
          </div>

          <h1 style={{ fontSize: 'clamp(38px, 5.4vw, 66px)', fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.045em', margin: '0 0 20px', animation: 'revealUp .7s var(--ease-out) .08s both' }}>
            Every bin, tree and<br />watt on campus —<br /><span className="gradient-text">working together.</span>
          </h1>
          <p style={{ fontSize: 16.5, color: 'var(--text-2)', lineHeight: 1.65, maxWidth: 480, margin: '0 0 28px', animation: 'revealUp .7s var(--ease-out) .16s both' }}>
            The green intelligence platform for RNS Institute of Technology. Green Guardians (students) race to fix what sensors find,
            Eco Rangers (staff) run the ground operations, and Earth Wardens (admins) see the whole campus.
          </p>
          <div style={{ animation: 'revealUp .7s var(--ease-out) .24s both' }}>
            <RotatingHighlight />
          </div>

          <div style={{ display: 'flex', gap: 28, marginTop: 34, flexWrap: 'wrap', animation: 'revealUp .7s var(--ease-out) .32s both' }}>
            {[['1,685 kg', 'waste diverted'], ['4.8 t', 'CO₂ prevented'], ['42', 'trees mapped']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 22, color: 'var(--green-hi)' }}>{v}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Form column ─────────────────────────────────────────── */}
        <section
          key={shakeKey}
          className="glass"
          style={{
            borderRadius: 26, padding: 'clamp(22px, 3.5vw, 34px)',
            borderColor: 'var(--border-hi)',
            boxShadow: '0 40px 100px -30px rgba(0,0,0,.85), 0 0 80px -30px rgba(52,211,153,.35)',
            animation: shakeKey ? 'shake .5s var(--ease-in-out)' : 'revealScale .7s var(--ease-out) .15s both',
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Choose your interface</h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: '0 0 18px' }}>Three apps, one campus. Pick a role and a demo account to step straight in.</p>

          <div style={{ display: 'grid', gap: 10 }}>
            {INTERFACES.map((it, i) => {
              const isOpen = openIface === it.role;
              const Icon = it.icon;
              return (
                <div key={it.role} style={{ '--c': it.color, animation: `staggerIn .5s var(--ease-out) ${0.2 + i * 0.08}s backwards` }}>
                  <button type="button" className="iface-card spotlight" aria-expanded={isOpen} onClick={() => setOpenIface(isOpen ? null : it.role)}>
                    <span className="ic-icon"><Icon size={22} /></span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span className="display" style={{ fontSize: 18, fontWeight: 800 }}>{it.title}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: it.color, textTransform: 'uppercase', letterSpacing: '.08em' }}>{it.who}</span>
                      </span>
                      <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-2)', marginTop: 3, lineHeight: 1.45 }}>{it.pitch}</span>
                    </span>
                    <ArrowRight size={18} className="ic-arrow" style={{ transform: isOpen ? 'rotate(90deg)' : undefined }} />
                  </button>
                  <div className={`collapsible ${isOpen ? '' : 'closed'}`}>
                    <div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 4px 8px' }}>
                        {it.features.map(f => <span key={f} className="chip" style={{ color: it.color, borderColor: `${it.color}44`, background: `${it.color}10` }}>{f}</span>)}
                      </div>
                      <div style={{ display: 'grid', gap: 6, padding: '0 0 6px' }}>
                        {it.accounts.map(acc => (
                          <button key={acc.id} type="button" className="acct-btn" onClick={() => quickLogin(acc, it.role)} disabled={status === 'loading' || status === 'success'} tabIndex={isOpen ? 0 : -1}>
                            <span style={{ fontSize: 20 }} aria-hidden="true">{acc.avatar}</span>
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800 }}>Enter as {acc.name}</span>
                              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)' }}>{acc.meta}</span>
                            </span>
                            {picked === acc.id && status === 'loading' ? <LoaderCircle size={16} style={{ animation: 'spin .9s linear infinite', color: it.color }} />
                              : picked === acc.id && status === 'success' ? <Check size={16} style={{ color: it.color, animation: 'popIn .35s var(--ease-spring)' }} />
                              : <ArrowRight size={15} style={{ color: it.color }} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={() => setShowForm(f => !f)} aria-expanded={showForm}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', margin: '20px 0 0', background: 'none', border: 0, color: 'var(--text-3)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            {showForm ? 'Hide sign-in form' : 'Or sign in with your USN / username'}
            <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </button>
          <div className={`collapsible ${showForm ? '' : 'closed'}`}>
          <div style={{ paddingTop: 14 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
            <div>
              <label htmlFor="login-id" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 7 }}>
                {isStaff ? 'Username' : 'University Seat Number (USN)'}
              </label>
              <input
                id="login-id"
                type="text"
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); setPicked(null); }}
                placeholder={mode === 'STAFF' ? 'e.g. ramesh' : mode === 'ADMIN' ? 'e.g. admin' : 'e.g. 1RN22CS045'}
                required
                autoFocus
                autoComplete="username"
                style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.02em' }}
                onFocus={focusOn} onBlur={focusOff}
              />
            </div>

            <div>
              <label htmlFor="login-pw" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 7 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-pw"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPicked(null); }}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 48 }}
                  onFocus={focusOn} onBlur={focusOff}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 6, top: 6, width: 36, height: 36, borderRadius: 10, border: 0, background: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {status === 'error' && authError && (
              <div role="alert" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 11, padding: '10px 12px', fontSize: 12.5, color: '#fca5a5', fontWeight: 600, animation: 'slideDown .3s var(--ease-out)' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} /> {authError}
              </div>
            )}

            <button
              type="submit"
              className="btn-eco"
              disabled={status === 'loading' || status === 'success' || !identifier || !password}
              style={{ height: 50, fontSize: 15, marginTop: 4, borderRadius: 14, border: 0, fontFamily: 'inherit', background: status === 'success' ? 'linear-gradient(135deg,#a3e635,#10b981)' : undefined }}
            >
              {status === 'loading' && <><LoaderCircle size={18} style={{ animation: 'spin 0.9s linear infinite' }} /> Verifying…</>}
              {status === 'success' && <><Check size={19} style={{ animation: 'popIn .4s var(--ease-spring)' }} /> Welcome!</>}
              {(status === 'idle' || status === 'error') && <>Sign in <ArrowRight size={17} /></>}
            </button>
          </form>
          </div>
          </div>
        </section>
      </div>

      <style>{`
        .login-grid { grid-template-columns: 1.1fr 0.9fr; }
        @media (max-width: 900px) {
          .login-grid { grid-template-columns: 1fr; }
          .login-story h1 br { display: none; }
        }
        @media (max-width: 420px) { .demo-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
