import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassIcon as Search } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { ArrowBendDownLeftIcon as CornerDownLeft } from '@phosphor-icons/react/dist/csr/ArrowBendDownLeft';
import { TrashIcon as Trash2 } from '@phosphor-icons/react/dist/csr/Trash';
import { CpuIcon as Cpu } from '@phosphor-icons/react/dist/csr/Cpu';
import { LightningIcon as Zap } from '@phosphor-icons/react/dist/csr/Lightning';
import { ClockIcon as Clock } from '@phosphor-icons/react/dist/csr/Clock';
import { ArrowUpRightIcon as ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { useRouter } from '../router/Router';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES, getRoute, getGroupOf } from '../config/navigation';

const RECENT_KEY = 'ecosphere_recent_routes';
const readRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } };

// Track recently visited routes for the "Recent" section
export function useRecentRoutes(path) {
  useEffect(() => {
    if (!ROUTES[path]) return;
    try {
      const next = [path, ...readRecent().filter(p => p !== path)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch { /* storage unavailable */ }
  }, [path]);
}

function score(text, q) {
  const t = text.toLowerCase();
  if (!q) return 1;
  if (t.startsWith(q)) return 3;
  if (t.includes(q)) return 2;
  // loose subsequence match ("cctv sen" → "CCTV Energy Sentinel")
  let i = 0;
  for (const ch of t) if (ch === q[i]) i++;
  return i === q.length ? 1 : 0;
}

export const CommandPalette = ({ isOpen, onClose, bins = [], salvagedItems = [], quickActions = [] }) => {
  const { navigate, path } = useRouter();
  const { role } = useAuth();
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) { setQuery(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [isOpen]);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = Object.keys(ROUTES)
      .filter(p => ROUTES[p].roles.includes(role))
      .map(p => getRoute(p, role))
      .map(r => ({
        key: `page:${r.path}`, kind: 'page', title: r.title, hint: r.desc, icon: r.icon, accent: r.accent,
        meta: getGroupOf(r.path, role) || 'Module',
        s: Math.max(score(r.title, q), score(r.desc, q) * 0.8, score(r.short, q)),
        run: () => navigate(r.path),
      }));

    const out = [];
    if (!q) {
      const recent = readRecent().filter(p => p !== path && ROUTES[p]?.roles.includes(role)).slice(0, 3);
      if (recent.length) out.push({ label: 'Recent', items: recent.map(p => ({ ...pages.find(x => x.key === `page:${p}`), icon: Clock, key: `recent:${p}` })) });
      if (quickActions.length) out.push({ label: 'Quick actions', items: quickActions.map(a => ({ ...a, kind: 'action', key: `act:${a.title}`, icon: a.icon || Zap, accent: a.accent || '#a3e635' })) });
      out.push({ label: 'Modules', items: pages });
      return out;
    }

    const pageHits = pages.filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    if (pageHits.length) out.push({ label: 'Modules', items: pageHits });

    const actHits = quickActions.filter(a => score(a.title, q) > 0)
      .map(a => ({ ...a, kind: 'action', key: `act:${a.title}`, icon: a.icon || Zap, accent: a.accent || '#a3e635' }));
    if (actHits.length) out.push({ label: 'Quick actions', items: actHits });

    const binHits = bins.filter(b => score(`${b.id} ${b.name} ${b.block}`, q) > 0).slice(0, 5).map(b => ({
      key: `bin:${b.id}`, kind: 'bin', title: `${b.name}`, hint: `${b.id} · ${b.block} · ${b.fillLevel}% full`,
      icon: Trash2, accent: b.fillLevel >= 80 ? '#f87171' : b.fillLevel >= 60 ? '#fbbf24' : '#a3e635',
      meta: b.fillLevel >= 80 ? 'CRITICAL' : 'Bin', run: () => navigate('/bins'),
    }));
    if (binHits.length) out.push({ label: 'Smart bins', items: binHits });

    const partHits = salvagedItems.filter(s => score(`${s.name} ${s.category}`, q) > 0).slice(0, 5).map(s => ({
      key: `part:${s.id}`, kind: 'part', title: s.name, hint: `${s.category} · ${s.condition}`,
      icon: Cpu, accent: '#60a5fa', meta: 'Component', run: () => navigate('/ewaste'),
    }));
    if (partHits.length) out.push({ label: 'Salvaged components', items: partHits });
    return out;
  }, [query, role, bins, salvagedItems, quickActions, navigate, path]);

  const flat = useMemo(() => sections.flatMap(s => s.items), [sections]);

  useEffect(() => { setSel(0); }, [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${sel}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setSel(i => (i + 1) % Math.max(flat.length, 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(i => (i - 1 + Math.max(flat.length, 1)) % Math.max(flat.length, 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); const it = flat[sel]; if (it) { it.run(); onClose(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, flat, sel, onClose]);

  if (!isOpen) return null;

  let idx = -1;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '12vh 16px 16px' }}
      role="dialog" aria-modal="true" aria-label="Command palette"
    >
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(1,6,3,.65)', backdropFilter: 'blur(6px)', animation: 'fadeIn .2s both' }} />
      <div className="command-palette-panel" style={{
        position: 'relative', width: '100%', maxWidth: 640, overflow: 'hidden',
        background: 'var(--surface-solid)', border: '1px solid var(--border-hi)', borderRadius: 20,
        boxShadow: '0 40px 100px -20px rgba(0,0,0,.9), 0 0 0 1px rgba(52,211,153,.06), 0 0 60px -20px rgba(52,211,153,.35)',
        animation: 'revealScale .32s var(--ease-out) both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <Search size={18} color="var(--green)" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Jump to a module, find a bin or component…"
            aria-label="Search"
            style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: 'var(--text)', fontSize: 16, fontWeight: 600, fontFamily: 'inherit' }}
          />
          <kbd style={{ fontSize: 10, padding: '3px 7px', borderRadius: 6, border: '1px solid var(--border)', color: 'var(--text-3)' }}>ESC</kbd>
        </div>

        <div ref={listRef} style={{ maxHeight: '55vh', overflowY: 'auto', padding: 8 }}>
          {flat.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13, animation: 'fadeIn .3s both' }}>
              Nothing matches “{query}”. Try “bins”, “trees” or a bin ID like B-102.
            </div>
          )}
          {sections.map(section => (
            <div key={section.label} style={{ marginBottom: 6 }}>
              <div className="eyebrow" style={{ padding: '10px 10px 6px', fontSize: 10 }}>{section.label}</div>
              {section.items.map(item => {
                idx += 1;
                const i = idx;
                const active = i === sel;
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.key}
                    data-idx={i}
                    onMouseMove={() => sel !== i && setSel(i)}
                    onClick={() => { item.run(); onClose(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                      padding: '10px 10px', borderRadius: 12, cursor: 'pointer',
                      background: active ? 'rgba(52,211,153,.09)' : 'transparent',
                      border: `1px solid ${active ? 'rgba(52,211,153,.22)' : 'transparent'}`,
                      transition: 'background .12s, border-color .12s',
                      animation: `staggerIn .35s var(--ease-out) ${Math.min(i, 10) * 0.02}s backwards`,
                    }}
                  >
                    <span style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center',
                      color: item.accent, background: `${item.accent}1c`, border: `1px solid ${item.accent}33`,
                      transition: 'transform .25s var(--ease-spring)', transform: active ? 'scale(1.08)' : 'none',
                    }}>
                      {Icon && <Icon size={16} />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
                      {item.hint && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.hint}</span>}
                    </span>
                    {item.meta && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{item.meta}</span>}
                    {active ? <CornerDownLeft size={14} color="var(--green)" /> : <ArrowUpRight size={14} color="var(--text-3)" style={{ opacity: .4 }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, padding: '10px 18px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span style={{ marginLeft: 'auto' }}><kbd>⌘K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
};
