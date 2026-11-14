import React, { useState, useEffect } from 'react';
import { Link } from '../router/Router';
import { CampusMap } from '../components/CampusMap';
import { RouteErrorBoundary } from '../components/RouteErrorBoundary';
import { fetchCampusWeather } from '../services/weatherService';
import { useAuth } from '../contexts/AuthContext';
import { IconMapPin, IconCpu } from '../components/Icons';
import { triggerConfetti } from '../utils/confetti';
import { fetchLiveBinReading } from '../services/liveBinReadingsService';

export const CampusBinsPage = ({ bins, onEmptyBin, liveReading = null, onLiveBinReading }) => {
  const { isOperator: isAdmin } = useAuth();
  const [filter, setFilter] = useState('ALL');
  const [dataMode, setDataMode] = useState('mock');
  const [ambientWeather, setAmbientWeather] = useState(null);
  const [sensorReading, setSensorReading] = useState(liveReading);
  const [sensorReachable, setSensorReachable] = useState(false);

  useEffect(() => {
    if (dataMode !== 'live') return undefined;
    let cancelled = false;
    const loadLatest = async () => {
      try {
        const binId = import.meta.env.VITE_LIVE_BIN_ID || 'B-101';
        const reading = await fetchLiveBinReading(binId);
        if (!cancelled) {
          setSensorReading(reading);
          setSensorReachable(!!reading);
          if (reading) onLiveBinReading?.(reading);
        }
      } catch {
        if (!cancelled) setSensorReachable(false);
      }
    };
    loadLatest();
    const timer = window.setInterval(loadLatest, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [dataMode, onLiveBinReading]);

  useEffect(() => {
    fetchCampusWeather().then(w => setAmbientWeather(w)).catch(() => {});
  }, []);

  const filteredBins = bins.filter(b => {
    if (filter === 'CRITICAL') return b.fillLevel >= 80;
    if (filter === 'WARNING') return b.fillLevel >= 60 && b.fillLevel < 80;
    if (filter === 'EWASTE') return b.eWasteAllowed;
    return true;
  });

  // Integration point for the ESP32 feed: { fillPercent, measuredAt, deviceId, binId, binName }.
  const reportedFill = Number(sensorReading?.fillPercent);
  const hasLiveReading = sensorReachable && Number.isFinite(reportedFill) && reportedFill >= 0 && reportedFill <= 100;
  const liveFillPercent = hasLiveReading ? Math.round(reportedFill) : null;
  const liveFillColor = liveFillPercent >= 80 ? '#ff7b83' : liveFillPercent >= 60 ? '#f3b84b' : '#2784ff';
  const liveReadingAge = sensorReading?.measuredAt ? Date.now() - new Date(sensorReading.measuredAt).getTime() : Infinity;
  const sensorIsFresh = hasLiveReading && liveReadingAge < 60000;

  return (
    <div className="space-y-6">
      {/* Friendly Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">Campus Bins</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            {isAdmin ? 'Campus Smart Bin Sensor Network' : '🗑️ Campus Smart Bins & Disposal Map'}
          </h1>
          <p className="text-xs text-slate-400">
            {isAdmin 
              ? 'Compare simulated campus bin levels with live ESP32 ultrasonic readings when the sensor feed is connected.'
              : 'Find the nearest disposal bin on campus and check available space before dropping your waste.'}
          </p>
        </div>

        {/* Filter Pills */}
        {dataMode === 'mock' && <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['ALL', 'CRITICAL', 'WARNING', 'EWASTE'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filter === f 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f === 'ALL' ? 'All 7 Bins' : f === 'CRITICAL' ? 'Needs Emptying (≥80%)' : f === 'WARNING' ? 'Half Full (60-79%)' : 'E-Waste Depots'}
            </button>
          ))}
        </div>}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-extrabold text-white">Bin readings</h2>
          <p className="text-xs text-slate-400">Choose between simulated campus bins and the physical sensor feed.</p>
        </div>
        <div className="bin-source-tabs" role="tablist" aria-label="Bin data source">
          {[
            { id: 'live', label: 'Live' },
            { id: 'mock', label: 'Mock' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={dataMode === tab.id}
              className={`bin-source-tab ${dataMode === tab.id ? 'is-active' : ''}`}
              onClick={() => setDataMode(tab.id)}
            >
              {tab.id === 'live' && <span className={`bin-source-indicator ${hasLiveReading ? 'is-connected' : ''}`} />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {dataMode === 'live' ? (
        <section className="bin-live-panel" role="tabpanel" aria-label="Live sensor reading">
          <div className="bin-live-heading">
            <div>
              <div className="bin-live-kicker"><span className={`bin-source-indicator ${hasLiveReading ? 'is-connected' : ''}`} /> Physical bin sensor</div>
              <h3>{hasLiveReading ? (sensorReading?.binName || sensorReading?.binId || 'Dustbin fill level') : 'Waiting for sensor data'}</h3>
              <p>{hasLiveReading ? `Sensor ${sensorReading?.deviceId || 'ESP32'} · Updated ${new Date(sensorReading.measuredAt).toLocaleString()}` : 'The laptop bridge sends ESP32 readings to the shared live feed.'}</p>
            </div>
            <span className={`bin-live-status ${sensorIsFresh ? 'is-connected' : ''}`}>{sensorIsFresh ? 'Receiving data' : hasLiveReading ? 'Signal stale' : 'Waiting for sensor'}</span>
          </div>
          <div className="bin-live-reading" aria-live="polite">
            <div className="bin-live-percent" style={{ color: hasLiveReading ? liveFillColor : 'var(--text-3)' }}>
              {hasLiveReading ? liveFillPercent : '—'}<span>%</span>
            </div>
            <div className="bin-live-meter" role="progressbar" aria-label="Live dustbin fill level" aria-valuemin="0" aria-valuemax="100" aria-valuenow={hasLiveReading ? liveFillPercent : undefined}>
              <div style={{ width: `${liveFillPercent ?? 0}%`, background: liveFillColor }} />
            </div>
            <div className="bin-live-caption">{hasLiveReading ? `${liveFillPercent}% full · ${Math.round(sensorReading.spaceLeftPercent ?? (100 - reportedFill))}% capacity left` : 'No live reading yet'}</div>
          </div>
        </section>
      ) : (
        <div role="tabpanel" aria-label="Mock campus bins">
          {/* Simulated Mapbox Bin Network Map */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className="live-dot" />
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--role-hi)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Mock Campus Bin Network — {bins.filter(b => b.fillLevel >= 80).length} Bins Full
              </span>
            </div>
            <RouteErrorBoundary
              resetKey="campus-bin-map"
              fallback={(
                <div role="status" style={{ minHeight: 260, display: 'grid', placeContent: 'center', gap: 8, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 16, background: 'var(--surface)', color: 'var(--text-2)' }}>
                  <strong style={{ color: 'var(--text)' }}>Map view is unavailable in this browser</strong>
                  <span>The campus bin list below is still available.</span>
                </div>
              )}
            >
              <CampusMap bins={bins} mode="bins" height="360px" />
            </RouteErrorBoundary>
          </div>

          {/* Mock Bins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBins.map(bin => {
              const isCritical = bin.fillLevel >= 80;
              const isWarning = bin.fillLevel >= 60 && bin.fillLevel < 80;

              // Simulated thermal reading calibrated against campus ambient weather
              const baseAmbient = ambientWeather?.exactTemp || 25.0;
              const thermalOffset = bin.fillLevel >= 80 ? 2.4 : bin.fillLevel >= 60 ? 1.2 : 0.4;
              const eWasteOffset = bin.eWasteAllowed ? 0.8 : 0;
              const liveBinTemp = (baseAmbient + thermalOffset + eWasteOffset).toFixed(1);

              return (
                <div
                  key={bin.id}
                  className={`rounded-2xl p-5 border transition flex flex-col justify-between shadow-xl ${
                    isCritical
                      ? 'bg-red-950/25 border-red-500/40'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-200">{bin.id}</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isCritical ? 'bg-red-500/20 text-red-400 border border-red-500/30' : isWarning ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>{bin.status}</span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-white text-base">{bin.name}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><IconMapPin className="w-3.5 h-3.5 text-slate-500" />{bin.block} • {bin.floor}</p>
                      <p className="text-[11px] text-slate-400 mt-1">Stream: <strong className="text-slate-300">{bin.type}</strong></p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Mock fill level:</span>
                        <span className={isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-blue-300'}>{bin.fillLevel}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${bin.fillLevel}%` }} />
                      </div>
                    </div>

                    {isAdmin ? (
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                        <div><span className="text-slate-500 block">Battery:</span><strong className="text-slate-200">{bin.batteryPct}% Solar</strong></div>
                        <div><span className="text-slate-500 block">Thermal (simulated):</span><div className="flex items-center gap-1.5"><strong className="text-blue-300">{liveBinTemp}°C</strong><span className="text-[9px] text-slate-400 font-sans">Mock</span></div></div>
                      </div>
                    ) : (
                      <div className="text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-slate-300 flex items-center justify-between">
                        <span>Space: <strong className={isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-blue-300'}>{isCritical ? 'Full (Needs Clearing)' : isWarning ? 'Half Full' : 'Plenty of Space'}</strong></span>
                        <span className="text-slate-500 text-[10px]">{bin.fillLevel}% full</span>
                      </div>
                    )}

                    {bin.eWasteAllowed && <div className="bg-blue-950/40 border border-blue-500/30 p-2 rounded-xl text-[11px] text-blue-300 flex items-center gap-2"><IconCpu className="w-4 h-4 text-blue-400 flex-shrink-0" /><span>Certified electronics &amp; circuit board drop-off depot.</span></div>}
                  </div>

                  {isAdmin && <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                    <button onClick={() => { onEmptyBin(bin.id); triggerConfetti(); }} aria-label={`Admin action: Mark ${bin.name} as emptied`} className="bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl transition">Clear Bin (Ground Ops)</button>
                  </div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
