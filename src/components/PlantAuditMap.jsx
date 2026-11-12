import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { CameraIcon as Camera } from '@phosphor-icons/react/dist/csr/Camera';
import { DropIcon as Droplets } from '@phosphor-icons/react/dist/csr/Drop';
import { FlameIcon as Flame } from '@phosphor-icons/react/dist/csr/Flame';
import { MapPinIcon as MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { XIcon as X } from '@phosphor-icons/react/dist/csr/X';
import { CheckCircleIcon as CheckCircle2 } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { NavigationArrowIcon as Navigation } from '@phosphor-icons/react/dist/csr/NavigationArrow';
import { careStatus, plantCareService } from '../services/plantCareService';
import { plantConditionClass, plantImagePath } from '../utils/plantArt';
import { PlantArt } from './PlantArt';

// Same public token / campus framing as CampusMap
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
// Area that holds every campus plant — "Show all" falls back to this when nothing is listed
const CAMPUS_PLANT_AREA = [[77.5168, 12.8998], [77.5197, 12.9026]];
const BOUNDS = [[77.5110, 12.8960], [77.5255, 12.9085]];

// What the Overseer needs to know at a glance
export const AUDIT_STATUS = {
  check:   { label: 'Log says cared for — check it', color: '#34d399' },
  checked: { label: 'You checked it this round', color: '#64748b' },
  overdue: { label: 'Overdue — already being penalised', color: '#f87171' },
  pending: { label: 'Your report is with staff', color: '#fbbf24' },
  flagged: { label: 'Recently upheld', color: '#f472b6' },
};

export function auditStatusOf(p, reports, checked, now) {
  if (reports.some(r => r.plantId === p.id && r.status === 'PENDING')) return 'pending';
  const st = careStatus(p, now);
  if (st.level === 'flagged') return 'flagged';
  if (st.level === 'overdue') return 'overdue';
  if (checked[p.id] === p.lastWateredAt) return 'checked';
  return 'check';
}

const fmt = (ms) => plantCareService.formatDuration(ms);

function markerHtml(p, status, selected, level) {
  const c = AUDIT_STATUS[status].color;
  const name = p.nickname ? `“${p.nickname}”` : p.name;
  return `
    <div class="audit-pin ${selected ? 'selected' : ''} ${status === 'check' ? 'pulse' : ''}" style="--c:${c}">
      <div class="audit-pin-head"><img class="audit-pin-art ${plantConditionClass(level)}" src="${plantImagePath(p)}" alt="" /><span class="audit-pin-name">${name.replace(/</g, '&lt;')}</span></div>
      <div class="audit-pin-needle"></div>
      <div class="audit-pin-dot"></div>
    </div>`;
}

/** Fallback when WebGL / Mapbox is unavailable: a schematic plot of the same coordinates. */
function SchematicMap({ items, selectedId, onSelect, theme }) {
  const [[w0, s0], [e0, n0]] = [[77.5165, 12.9002], [77.5203, 12.9030]];
  const mapInk = theme === 'light' ? '#52627a' : '#a9c2e8';
  const mapGrid = theme === 'light' ? 'rgba(39,113,218,.13)' : 'rgba(125,177,255,.14)';
  return (
    <svg viewBox="0 0 100 70" style={{ width: '100%', height: '100%', background: theme === 'light' ? '#e9f0fa' : '#09111e' }} role="img" aria-label="Schematic campus map of plants to audit">
      {[...Array(9)].map((_, i) => <line key={`v${i}`} x1={i * 12.5} y1="0" x2={i * 12.5} y2="70" stroke={mapGrid} strokeWidth=".3" />)}
      {[...Array(6)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 14} x2="100" y2={i * 14} stroke={mapGrid} strokeWidth=".3" />)}
      {items.map(({ p, status, level }) => {
        const x = ((p.lngLat[0] - w0) / (e0 - w0)) * 100;
        const y = (1 - (p.lngLat[1] - s0) / (n0 - s0)) * 70;
        const c = AUDIT_STATUS[status].color;
        return (
          <g key={p.id} onClick={() => onSelect(p.id)} style={{ cursor: 'pointer' }}>
            <image href={plantImagePath(p)} x={x - 2.5} y={y - 7} width="5" height="5" className={plantConditionClass(level)} />
            <circle cx={x} cy={y} r={selectedId === p.id ? 1.1 : .75} fill={c} stroke={theme === 'light' ? '#fff' : '#07111e'} strokeWidth=".35" />
            <text x={x} y={y - 7.4} fontSize="2.4" textAnchor="middle" fill={mapInk} fontWeight="700">{p.nickname || p.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function PlantAuditMap({ plants, reports, now, checked, selectedId, onSelect, onReport, onMarkChecked, height = 420 }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(() => !mapboxgl.supported?.());
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');

  useEffect(() => {
    const onThemeChange = (event) => setTheme(event.detail || document.documentElement.dataset.theme || 'dark');
    window.addEventListener('guardian-theme-change', onThemeChange);
    return () => window.removeEventListener('guardian-theme-change', onThemeChange);
  }, []);

  const items = plants.filter(p => p.lngLat).map(p => ({ p, status: auditStatusOf(p, reports, checked, now), level: careStatus(p, now).level }));
  const selected = items.find(i => i.p.id === selectedId);

  // Create the map once
  useEffect(() => {
    if (failed || !boxRef.current) return;
    let map;
    try {
      map = new mapboxgl.Map({
        container: boxRef.current, style: theme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11', bounds: CAMPUS_PLANT_AREA, fitBoundsOptions: { padding: 40 },
        minZoom: 15.4, maxZoom: 19.5, maxBounds: BOUNDS, dragRotate: false, pitchWithRotate: false, attributionControl: false,
      });
    } catch { setFailed(true); return; }
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    // Lets the Overseer see their own position while walking campus (asks permission only when tapped)
    map.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserHeading: true }), 'top-right');
    setReady(true); // markers are DOM overlays — place them without waiting for tiles
    map.on('error', (e) => { if (!map.loaded() && /token|style|webgl/i.test(String(e?.error?.message))) setFailed(true); });
    return () => { markersRef.current.forEach(m => m.remove()); markersRef.current = []; map.remove(); mapRef.current = null; setReady(false); };
  }, [failed, theme]);

  // (Re)draw markers whenever plants, statuses or the selection change
  const sig = items.map(i => `${i.p.id}:${i.status}:${i.level}:${i.p.nickname || ''}`).join('|') + `#${selectedId}`;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = items.map(({ p, status, level }) => {
      const el = document.createElement('div');
      el.innerHTML = markerHtml(p, status, p.id === selectedId, level);
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `${p.name}: ${AUDIT_STATUS[status].label}`);
      el.tabIndex = 0;
      el.addEventListener('click', (e) => { e.stopPropagation(); onSelect(p.id); });
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSelect(p.id); });
      return new mapboxgl.Marker({ element: el, anchor: 'bottom' }).setLngLat(p.lngLat).addTo(map);
    });
  }, [sig, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to the selected plant
  useEffect(() => {
    if (selected && mapRef.current && ready) mapRef.current.flyTo({ center: selected.p.lngLat, zoom: 18.4, speed: 0.9, essential: true });
  }, [selectedId, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const fitAll = () => {
    const map = mapRef.current;
    onSelect(null);
    if (!map) return;
    const b = new mapboxgl.LngLatBounds(CAMPUS_PLANT_AREA[0], CAMPUS_PLANT_AREA[1]);
    items.forEach(i => b.extend(i.p.lngLat));
    const box = map.getContainer();
    // Leave room for the legend on the left and the zoom controls on the right
    const pad = { top: 40, bottom: 40, left: Math.min(260, box.clientWidth * 0.35), right: 60 };
    map.fitBounds(b, { padding: pad, maxZoom: 18, duration: 900 });
  };

  const sp = selected?.p;
  const sst = sp ? careStatus(sp, now) : null;

  return (
    <div className="glass" style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', height, borderColor: 'rgba(232,121,249,.3)' }}>
      {failed
        ? <SchematicMap items={items} selectedId={selectedId} onSelect={onSelect} theme={theme} />
        : <div ref={boxRef} style={{ position: 'absolute', inset: 0 }} />}

      {items.length === 0 && (
        <div style={{ position: 'absolute', right: 12, bottom: 12, maxWidth: 260, padding: '10px 12px', borderRadius: 14, background: 'rgba(4,13,8,.88)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)' }}>
          No adopted plants to audit right now. Pins appear here as students adopt plants.
        </div>
      )}

      {/* Legend */}
      <div style={{ position: 'absolute', left: 12, top: 12, display: 'grid', gap: 5, padding: '10px 12px', borderRadius: 14, background: 'rgba(4,13,8,.88)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)', fontSize: 11, maxWidth: 'calc(100% - 80px)' }}>
        {Object.entries(AUDIT_STATUS).map(([k, v]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-2)' }}>
            <span style={{ width: 9, height: 9, borderRadius: 9, background: v.color, boxShadow: `0 0 8px ${v.color}`, flexShrink: 0 }} />
            {v.label} <strong style={{ color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>{items.filter(i => i.status === k).length}</strong>
          </span>
        ))}
        {!failed && <button type="button" onClick={fitAll} className="chip" style={{ cursor: 'pointer', marginTop: 4, justifySelf: 'start' }}><Navigation size={11} /> Show all</button>}
      </div>

      {/* Selected plant panel */}
      {sp && (
        <div key={sp.id} style={{ position: 'absolute', left: 12, right: 12, bottom: 12, maxWidth: 420, padding: 14, borderRadius: 18, background: 'rgba(6,18,12,.96)', border: `1px solid ${AUDIT_STATUS[selected.status].color}66`, boxShadow: '0 20px 50px -20px rgba(0,0,0,.9)', animation: 'revealUp .35s var(--ease-out) both' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <PlantArt plant={sp} level={sst?.level} size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 15 }}>{sp.nickname ? `“${sp.nickname}” · ${sp.name}` : sp.name} <span style={{ color: 'var(--text-3)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{sp.id}</span></div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 5 }}><MapPin size={12} style={{ marginTop: 2 }} /> {sp.location}</div>
            </div>
            <button type="button" onClick={() => onSelect(null)} aria-label="Close" style={{ background: 'none', border: 0, color: 'var(--text-3)', cursor: 'pointer' }}><X size={16} /></button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, fontSize: 12 }}>
            <span className="chip"><Droplets size={12} color="#38bdf8" /> Log: watered {fmt(now - sp.lastWateredAt)} ago</span>
            <span className="chip"><Flame size={12} color="#fb923c" /> {sp.streak || 0} in a row</span>
            <span className="chip" style={{ color: AUDIT_STATUS[selected.status].color }}>{AUDIT_STATUS[selected.status].label}</span>
            {sp.lastRainCredit?.at === sp.lastWateredAt && <span className="chip" style={{ color: '#7dd3fc' }}>🌧️ Last watering was rain ({sp.lastRainCredit.mm} mm)</span>}
          </div>
          {sst?.level !== 'overdue' && selected.status !== 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" className="btn-ghost" onClick={() => onReport(sp)} style={{ flex: 1, justifyContent: 'center', padding: '9px 12px', fontSize: 12.5, color: '#f9a8d4', borderColor: 'rgba(232,121,249,.45)' }}>
                <Camera size={14} /> Report neglect
              </button>
              {selected.status !== 'checked' && (
                <button type="button" className="btn-eco" onClick={() => onMarkChecked(sp)} style={{ padding: '9px 12px', fontSize: 12.5 }}>
                  <CheckCircle2 size={14} /> Looks fine
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        .audit-pin { display:flex; flex-direction:column; align-items:center; cursor:pointer; transform-origin:bottom center; transition: transform .25s var(--ease-spring); }
        .audit-pin:hover, .audit-pin.selected { transform: scale(1.15); }
        .audit-pin-head { display:flex; align-items:center; gap:4px; padding:3px 9px 3px 5px; border-radius:999px; background:rgba(4,13,8,.94); border:2px solid var(--c); box-shadow:0 4px 14px rgba(0,0,0,.6), 0 0 14px color-mix(in srgb, var(--c) 60%, transparent); white-space:nowrap; }
        .audit-pin.selected .audit-pin-head { background: var(--c); }
        .audit-pin.selected .audit-pin-name { color:#04110a; }
        .audit-pin-art { display:block; width:26px; height:26px; object-fit:contain; flex:0 0 26px; }
        .audit-pin-name { font-size:11px; font-weight:800; color:#e2f5ec; font-family:'Plus Jakarta Sans', sans-serif; }
        .audit-pin-needle { width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:7px solid var(--c); margin-top:-1px; }
        .audit-pin-dot { width:6px; height:6px; border-radius:50%; background:var(--c); margin-top:1px; }
        .audit-pin.pulse .audit-pin-dot { animation: ping 1.8s var(--ease-out) infinite; }
        .mapboxgl-ctrl-group { background: var(--surface-solid) !important; border: 1px solid var(--border) !important; border-radius: 12px !important; box-shadow: var(--shadow-button) !important; }
        :root[data-theme="light"] .mapboxgl-ctrl-group button .mapboxgl-ctrl-icon { filter: none; }
        :root[data-theme="dark"] .mapboxgl-ctrl-group button .mapboxgl-ctrl-icon { filter: invert(1) hue-rotate(180deg); }
      `}</style>
    </div>
  );
}
