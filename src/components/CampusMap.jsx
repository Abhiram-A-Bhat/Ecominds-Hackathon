import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const RNSIT_CENTER = [77.5184, 12.9018]; // RNSIT Bengaluru [lng, lat]
const RNSIT_BOUNDS = [
  [77.5110, 12.8960], // Southwest [lng, lat]
  [77.5255, 12.9085]  // Northeast [lng, lat]
];

function fillColor(level) {
  if (level >= 80) return '#ef4444';
  if (level >= 60) return '#fbbf24';
  return '#2784ff';
}

function healthColor(health) {
  if (health === 'Needs Attention') return '#fbbf24';
  if (health === 'Flourishing' || health === 'Excellent') return '#2784ff';
  return '#8bc0ff';
}

export function CampusMap({ bins = [], trees = [], mode = 'bins', routeOrder = [], height = '500px' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const animFrameRef = useRef(null);
  const resizeFrameRef = useRef(null);
  const [currentZoom, setCurrentZoom] = useState(17.2);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');

  useEffect(() => {
    const onThemeChange = (event) => setTheme(event.detail || document.documentElement.dataset.theme || 'dark');
    window.addEventListener('guardian-theme-change', onThemeChange);
    return () => window.removeEventListener('guardian-theme-change', onThemeChange);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: theme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11',
      center: RNSIT_CENTER,
      zoom: 17.2,
      minZoom: 15.2,
      maxZoom: 19.5,
      maxBounds: RNSIT_BOUNDS,
      pitch: 0,
      maxPitch: 0,
      bearing: 0,
      dragRotate: false,
      touchPitch: false,
      attributionControl: false,
    });

    mapRef.current = map;

    // The map can mount while its responsive parent is still sizing (for
    // example, when the shell finishes its mobile layout). Mapbox only tracks
    // window resizes by default, so observe the actual container as well.
    const resizeObserver = new ResizeObserver(() => {
      if (resizeFrameRef.current) cancelAnimationFrame(resizeFrameRef.current);
      resizeFrameRef.current = requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        if (containerRef.current?.isConnected) map.resize();
      });
    });
    resizeObserver.observe(containerRef.current);
    resizeFrameRef.current = requestAnimationFrame(() => {
      resizeFrameRef.current = null;
      if (containerRef.current?.isConnected) map.resize();
    });

    // Scale child elements (.pin-inner), NEVER the root marker element (which Mapbox transforms)
    const updateMarkerScales = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);
      const scale = Math.max(0.65, Math.min(1.15, 0.65 + (zoom - 15.2) * 0.22));
      
      const pinElements = containerRef.current?.querySelectorAll('.pin-inner');
      if (pinElements) {
        pinElements.forEach(el => {
          el.style.transform = `scale(${scale})`;
        });
      }
    };

    map.on('zoom', updateMarkerScales);

    map.on('load', () => {
      map.resize();
      // ── CAMPUS BASE LABEL ──────────────────────────────────────────────────
      const labelEl = document.createElement('div');
      labelEl.innerHTML = `
        <div style="
          background:rgba(4,10,20,0.94);
          border:1px solid rgba(39,132,255,0.42);
          border-radius:6px;padding:3px 8px;
          color:#8bc0ff;font-size:9.5px;font-weight:800;
          letter-spacing:0.06em;white-space:nowrap;
          pointer-events:none;
        ">RNSIT CAMPUS</div>
      `;
      new mapboxgl.Marker({ element: labelEl, anchor: 'center' })
        .setLngLat(RNSIT_CENTER)
        .addTo(map);

      // ── BIN MARKERS WITH PRECISION NEEDLE ANCHOR ────────────────────────────
      if (mode === 'bins' || mode === 'admin' || mode === 'route') {
        (bins || []).forEach((bin) => {
          if (!bin.lngLat) return;
          const color = fillColor(bin.fillLevel);

          // Root element (handed to Mapbox for translate transforms - NEVER apply scale or transition here)
          const rootEl = document.createElement('div');
          rootEl.className = 'campus-bin-anchor';

          // Inner element handles visual layout & zoom-dependent scale
          rootEl.innerHTML = `
            <div class="pin-inner" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              cursor: pointer;
              transform-origin: bottom center;
              user-select: none;
            ">
              <!-- Pin Pill Head -->
              <div class="pin-head" style="
                display: flex;
                align-items: center;
                gap: 3px;
                background: ${color};
                border: 2px solid #ffffff;
                border-radius: 9999px;
                padding: 2.5px 7px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.6), 0 0 10px ${color}80;
                position: relative;
                z-index: 2;
                white-space: nowrap;
              ">
                <span style="font-size: 11px;">🗑️</span>
                <span class="pin-fill-text" style="
                  font-size: 11px;
                  font-weight: 900;
                  color: #ffffff;
                  font-family: JetBrains Mono, monospace;
                ">${bin.fillLevel}%</span>
              </div>

              <!-- Precision Needle Pointer -->
              <div class="pin-needle" style="
                width: 0;
                height: 0;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-top: 6px solid ${color};
                margin-top: -1px;
                position: relative;
                z-index: 2;
              "></div>

              <!-- Ground Contact Anchor Dot (Exact Coordinate Center) -->
              <div style="
                width: 5px;
                height: 5px;
                border-radius: 50%;
                background: #ffffff;
                border: 1.5px solid #040d07;
                box-shadow: 0 0 6px ${color};
                margin-top: -1px;
                position: relative;
                z-index: 1;
              "></div>
            </div>
          `;

          const popup = new mapboxgl.Popup({ offset: [0, -32], closeButton: false, maxWidth: '230px' })
            .setHTML(`
              <div style="background:#07160e;border:1px solid rgba(52,211,153,0.25);border-radius:12px;padding:12px;font-family:system-ui">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                  <span style="font-size:9px;color:#34d399;font-weight:800;letter-spacing:0.07em;font-family:monospace">${bin.id}</span>
                  <span style="font-size:9px;color:${color};font-weight:800;background:${color}20;padding:1px 6px;border-radius:6px">${bin.status}</span>
                </div>
                <div style="font-size:13px;font-weight:900;color:#ffffff;margin-bottom:2px">${bin.name}</div>
                <div style="font-size:10px;color:#7ea893;margin-bottom:8px">📍 ${bin.block} • ${bin.floor}</div>
                <div style="background:#040d07;border-radius:8px;padding:6px 8px;margin-bottom:6px">
                  <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                    <span style="font-size:9px;color:#7ea893;text-transform:uppercase;font-weight:700">Capacity</span>
                    <span style="font-size:11px;font-weight:900;color:${color}">${bin.fillLevel}%</span>
                  </div>
                  <div style="height:5px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden">
                    <div style="height:100%;width:${bin.fillLevel}%;background:${color};border-radius:99px"></div>
                  </div>
                </div>
                <div style="font-size:9px;color:#6ee7b7">Geo-Locked: [${bin.lngLat[1].toFixed(4)}° N, ${bin.lngLat[0].toFixed(4)}° E]</div>
              </div>
            `);

          const marker = new mapboxgl.Marker({ element: rootEl, anchor: 'bottom' })
            .setLngLat(bin.lngLat)
            .setPopup(popup)
            .addTo(map);

          markersRef.current.push({ marker, binId: bin.id, rootEl });
        });

        updateMarkerScales();
      }

      // ── TREE MARKERS ────────────────────────────────────────────────────────
      if (mode === 'trees' || mode === 'admin') {
        (trees || []).forEach(tree => {
          if (!tree.lngLat) return;
          const hColor = healthColor(tree.health);

          const rootEl = document.createElement('div');
          rootEl.className = 'campus-tree-anchor';
          rootEl.innerHTML = `
            <div class="pin-inner" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              cursor: pointer;
              transform-origin: bottom center;
              user-select: none;
            ">
              <img src="/plants/tree-leaf.png" alt="" style="width:26px;height:26px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35))" title="${tree.species}" />
              <div style="
                width: 5px; height: 5px;
                border-radius: 50%;
                background: #2784ff;
                border: 1px solid #040a14;
                box-shadow: 0 0 6px #2784ff;
                margin-top: -2px;
              "></div>
            </div>
          `;

          const popup = new mapboxgl.Popup({ offset: [0, -24], closeButton: false, maxWidth: '200px' })
            .setHTML(`
              <div style="background:#07160e;border:1px solid rgba(52,211,153,0.25);border-radius:12px;padding:12px;font-family:system-ui">
                <div style="font-size:9px;color:#34d399;font-weight:800;letter-spacing:0.07em">${tree.id}</div>
                <div style="font-size:12px;font-weight:900;color:#ffffff;margin-bottom:2px">${tree.species}</div>
                <div style="font-size:10px;color:#7ea893;margin-bottom:6px">📍 ${tree.location}</div>
                <div style="font-size:10px;color:#34d399;font-weight:700">CO₂: ${tree.co2AbsorbedPerYear}</div>
                <div style="font-size:9px;color:#7ea893;margin-top:4px">Adopted by: ${tree.adoptedBy}</div>
              </div>
            `);

          new mapboxgl.Marker({ element: rootEl, anchor: 'bottom' })
            .setLngLat(tree.lngLat)
            .setPopup(popup)
            .addTo(map);
        });

        updateMarkerScales();
      }

      // ── ROUTE LINE (animated) ──────────────────────────────────────────────
      if (mode === 'route' && routeOrder.length > 1) {
        const ordered = routeOrder
          .map(id => (bins || []).find(b => b.id === id))
          .filter(b => b && b.lngLat);

        if (ordered.length > 1) {
          const coords = ordered.map(b => b.lngLat);

          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: coords }
            }
          });

          map.addLayer({
            id: 'route-glow',
            type: 'line',
            source: 'route',
            paint: {
              'line-color': '#34d399',
              'line-width': 6,
              'line-opacity': 0.2,
              'line-blur': 3,
            }
          });

          map.addLayer({
            id: 'route-dash',
            type: 'line',
            source: 'route',
            paint: {
              'line-color': '#34d399',
              'line-width': 2.5,
              'line-dasharray': [0, 4, 3],
            }
          });

          const dashArraySeq = [
            [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
            [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 3, 1],
          ];
          let step = 0;
          function animateDash() {
            if (!map.getLayer('route-dash')) return;
            map.setPaintProperty('route-dash', 'line-dasharray', dashArraySeq[step]);
            step = (step + 1) % dashArraySeq.length;
            animFrameRef.current = setTimeout(animateDash, 90);
          }
          animateDash();

          // Waypoint order badges
          ordered.forEach((bin, i) => {
            if (i === 0) return;
            const numEl = document.createElement('div');
            numEl.style.cssText = `
              width: 20px; height: 20px; border-radius: 50%;
              background: #34d399; color: #040d07;
              font-size: 10px; font-weight: 900;
              display: flex; align-items: center; justify-content: center;
              border: 1.5px solid #ffffff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.6);
            `;
            numEl.textContent = i;
            new mapboxgl.Marker({ element: numEl, anchor: 'center' })
              .setLngLat(bin.lngLat)
              .addTo(map);
          });
        }
      }

      // ── MAP LEGEND ────────────────────────────────────────────────────────
      if (mode === 'bins' || mode === 'admin' || mode === 'route') {
        const legend = document.createElement('div');
        legend.style.cssText = `
          position: absolute; bottom: 20px; left: 12px; z-index: 10;
          background: rgba(4,13,8,0.92); border: 1px solid rgba(52,211,153,0.18);
          border-radius: 10px; padding: 8px 12px; backdrop-filter: blur(8px);
          font-family: system-ui;
        `;
        legend.innerHTML = `
          <div style="font-size:8px;color:#7ea893;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:5px">Fill Status</div>
          ${[['#10b981','Normal (< 60%)'],['#fbbf24','Warning (60-79%)'],['#ef4444','Critical (≥ 80%)']].map(([c,l]) =>
            `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
              <div style="width:7px;height:7px;border-radius:50%;background:${c};box-shadow:0 0 5px ${c}80"></div>
              <span style="font-size:9.5px;color:#e2f5ec">${l}</span>
            </div>`
          ).join('')}
        `;
        containerRef.current.appendChild(legend);
      }
    });

    // Navigation Controls
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    return () => {
      resizeObserver.disconnect();
      if (resizeFrameRef.current) cancelAnimationFrame(resizeFrameRef.current);
      markersRef.current.forEach(item => item.marker?.remove());
      markersRef.current = [];
      if (animFrameRef.current) clearTimeout(animFrameRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, [theme]);

  // Live update of fill levels without moving markers
  useEffect(() => {
    if (!mapRef.current || !markersRef.current.length) return;

    markersRef.current.forEach(({ binId, rootEl }) => {
      const bin = (bins || []).find(b => b.id === binId);
      if (!bin || !rootEl) return;

      const color = fillColor(bin.fillLevel);
      const head = rootEl.querySelector('.pin-head');
      const needle = rootEl.querySelector('.pin-needle');
      const text = rootEl.querySelector('.pin-fill-text');

      if (head) {
        head.style.background = color;
        head.style.boxShadow = `0 3px 10px rgba(0,0,0,0.6), 0 0 10px ${color}80`;
      }
      if (needle) {
        needle.style.borderTopColor = color;
      }
      if (text) {
        text.textContent = `${bin.fillLevel}%`;
      }
    });
  }, [bins]);

  // Recenter handler
  const handleRecenter = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: RNSIT_CENTER,
      zoom: 17.2,
      pitch: 0,
      bearing: 0,
      essential: true
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', minWidth: 0, boxSizing: 'border-box', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(52,211,153,0.18)', height }}>
      {/* Top Campus Coordinates & Reset View Badge */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 10,
        background: 'rgba(4,13,8,0.92)', backdropFilter: 'blur(8px)',
        border: '1px solid rgba(52,211,153,0.25)', borderRadius: 10,
        padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 11, color: '#e2f5ec', fontWeight: 600
      }}>
        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
        <span>RNSIT Campus Digital Twin</span>
        <span style={{ color: '#7ea893', fontFamily: 'monospace', fontSize: 10 }}>[12.9018° N, 77.5184° E]</span>
        <button
          onClick={handleRecenter}
          title="Reset map view to default campus center"
          style={{
            background: 'rgba(52,211,153,0.12)',
            border: '1px solid rgba(52,211,153,0.25)',
            color: '#34d399',
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 6,
            cursor: 'pointer',
            marginLeft: 4
          }}
        >
          Recenter
        </button>
      </div>

      <div ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
