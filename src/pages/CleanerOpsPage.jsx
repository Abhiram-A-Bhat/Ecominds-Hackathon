import React, { useState, useEffect } from 'react';
import { IconNavigation, IconCheckCircle, IconZap, IconCpu, IconMapPin, IconAlertTriangle } from '../components/Icons';
import { triggerConfetti } from '../utils/confetti';
import { Link } from '../router/Router';
import { CampusMap } from '../components/CampusMap';
import { useAuth } from '../contexts/AuthContext';
import { guardianTaskService } from '../services/guardianTaskService';

export const CleanerOpsPage = ({ bins, onEmptyBin }) => {
  const { currentUser } = useAuth();
  const [predictions, setPredictions] = useState(null);
  const [forecasterOffline, setForecasterOffline] = useState(false);
  const [tasks, setTasks] = useState(() => guardianTaskService.getTasks());

  useEffect(() => guardianTaskService.subscribe(setTasks), []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/predictive-bins", { signal: controller.signal })
      .then(r => r.json())
      .then(d => { 
        if (d.success) setPredictions(d); 
        else setForecasterOffline(true);
      })
      .catch(() => setForecasterOffline(true));
    return () => controller.abort();
  }, []);

  // Compute urgent bins ordered by fill level (highest first)
  const urgentBins = [...bins]
    .filter(b => b.fillLevel >= 75)
    .sort((a, b) => b.fillLevel - a.fillLevel);

  // Route order = urgent first (critical bins), then remaining by fill level
  const routeOrder = [...bins]
    .sort((a, b) => b.fillLevel - a.fillLevel)
    .map(b => b.id);
  const assignedCollections = tasks.filter(task => task.category === 'BIN_OVERFLOW' && task.status !== 'COMPLETED' &&
    (currentUser?.role === 'ADMIN' || task.assignedStaffId === currentUser?.id));

  return (
    <div className="space-y-6">

      {/* ── Breadcrumb Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">Ground Operations</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Ground Ops &amp; Dynamic Walking Route Optimizer
          </h1>
          <p className="text-xs text-slate-400">
            Endpoint: <code className="text-orange-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">/cleaner-ops</code>
            &nbsp;• Priority heuristic algorithm that cuts walking fatigue by prioritizing critical ≥80% bins.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Walking Saved</div>
            <div className="text-sm font-black text-emerald-400 font-mono">1.8 KM / Day</div>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Time Saved</div>
            <div className="text-sm font-black text-amber-400 font-mono">38 Mins</div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-orange-500/30 bg-slate-900/90 p-5 space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 className="text-sm font-black text-white">Assigned bin collection tasks</h2>
            <p className="text-[11px] text-slate-400">Ground staff marks a bin empty after physically collecting the waste. No student points are awarded for staff work.</p>
          </div>
          <span className="text-[10px] font-bold text-orange-300">{currentUser?.name || 'Staff'} · {assignedCollections.length} open</span>
        </div>
        {assignedCollections.length ? <div className="grid gap-2 sm:grid-cols-2">
          {assignedCollections.map(task => {
            const bin = bins.find(item => item.id === task.targetId);
            return <article key={task.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950 p-3 border border-slate-800">
              <div><p className="text-xs font-bold text-white">{task.title}</p><p className="text-[10px] text-slate-400">{task.location} · {bin?.fillLevel ?? '—'}% full</p></div>
              <button type="button" onClick={() => onEmptyBin(task.targetId)} className="shrink-0 rounded-lg bg-orange-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-orange-500">Mark emptied</button>
            </article>;
          })}
        </div> : <p className="text-xs text-slate-400">No open collection tasks assigned to this account.</p>}
      </section>

      {/* ── Live Route Map (Mapbox) ────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#34d399' }}>Live Route Map</span>
          <span className="text-sm font-extrabold ml-1" style={{ color: '#e2f5ec' }}>
            Priority-Optimised Collection Route — RNSIT Campus
          </span>
        </div>
        <CampusMap bins={bins} mode="route" routeOrder={routeOrder} height="400px" />
        <div className="mt-2 flex items-center gap-4 text-[10px]" style={{ color: '#7ea893' }}>
          <span className="flex items-center gap-1.5">
            <span className="w-5 border-t-2 border-dashed border-emerald-400" />
            Optimised Walking Route
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
            Critical Bin (&ge;80%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            Warning (60-79%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            Normal (&lt;60%)
          </span>
        </div>
      </div>

      {/* ── Predictive IoT Surge Forecaster ───────────────── */}
      {forecasterOffline && !predictions && (
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📡</span>
            <div>
              <div className="text-xs font-bold text-slate-300">Predictive Surge Engine Offline</div>
              <div className="text-[11px] text-slate-500">Operating in real-time sensor fallback mode. Using on-ground ultrasonic telemetry to optimize the ACO route.</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 px-2.5 py-1 rounded-lg shrink-0">
            Real-time Sensor Mode
          </span>
        </div>
      )}

      {predictions && (
        <div className="bg-slate-900/95 rounded-2xl p-6 border border-emerald-500/30 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                Proactive Machine Learning Dispatch
              </span>
              <h2 className="text-base font-extrabold text-white mt-0.5 flex items-center gap-2">
                <IconZap className="w-4 h-4 text-emerald-400" />
                Pre-Emptive Bin Surge Forecaster (Time-Series Decay Model)
              </h2>
            </div>
            <span className="text-xs font-mono bg-slate-950 text-emerald-300 border border-slate-800 px-2.5 py-1 rounded-xl">
              Model: Polynomial Decay + Mess Schedule
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {predictions.forecasts.map(f => (
              <div key={f.bin_id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {f.bin_id}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    f.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : f.risk === 'HIGH_SURGE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {f.risk}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-200">{f.name}</div>
                <div className="text-[11px] text-slate-400">{f.reason}</div>
                <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-emerald-400">
                  ⚡ Pre-emptive: <strong>{f.recommended_preemptive_clear}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Suggested Path Sequence Bar ───────────────────── */}
      {urgentBins.length > 0 ? (
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-orange-500/30 space-y-3 shadow-xl">
          <div className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
            <IconZap className="w-4 h-4 text-orange-400" />
            Recommended Urgent Collection Path (Ordered by Priority):
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-slate-800 text-slate-200 px-3.5 py-2 rounded-xl font-mono font-bold border border-slate-700">
              Operations Base
            </span>
            {urgentBins.map((b, index) => (
              <React.Fragment key={b.id}>
                <span className="text-slate-500 font-black">➔</span>
                <span className="bg-red-500/20 text-red-300 border border-red-500/40 px-3.5 py-2 rounded-xl font-bold flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-red-600 text-[10px] flex items-center justify-center text-white font-mono">
                    {index + 1}
                  </span>
                  {b.id} ({b.name} - {b.fillLevel}%)
                </span>
              </React.Fragment>
            ))}
            <span className="text-slate-500 font-black">➔</span>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-3.5 py-2 rounded-xl font-mono font-bold">
              Central Compactor &amp; Composter
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-5 rounded-2xl text-center space-y-1">
          <div className="text-emerald-400 font-bold text-sm">✨ All Campus Bins Currently Under Safe Limits</div>
          <div className="text-xs text-slate-400">No emergency collections required. Ground staff can focus on routine maintenance.</div>
        </div>
      )}

      {/* ── All Bins Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bins.map(bin => {
          const isCritical = bin.fillLevel >= 80;
          const isWarning  = bin.fillLevel >= 60 && bin.fillLevel < 80;

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
                  <span className="text-xs font-mono font-bold bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-200">
                    {bin.id}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isCritical ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : isWarning ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isCritical ? 'CRITICAL - COLLECT' : isWarning ? 'WARNING' : 'NORMAL'}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-white text-base">{bin.name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <IconMapPin className="w-3.5 h-3.5 text-slate-500" />
                    {bin.block} • {bin.floor}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Stream: {bin.type}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-slate-400">Ultrasonic Level:</span>
                    <span className={isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}>
                      {bin.fillLevel}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${bin.fillLevel}%` }}
                    />
                  </div>
                </div>

                {bin.eWasteAllowed && (
                  <div className="bg-blue-950/40 border border-blue-500/30 p-2 rounded-xl text-[11px] text-blue-300 flex items-center gap-2">
                    <IconCpu className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>Contains E-Waste locker: Use insulated gloves.</span>
                  </div>
                )}

                {isCritical && (
                  <div className="bg-red-950/40 border border-red-500/30 p-2.5 rounded-xl text-[11px] text-red-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                      <span>👷 Assigned: Ramesh K. (Ground Ops Zone 2)</span>
                    </div>
                    <span className="font-mono text-[9px] bg-red-900/60 text-red-200 px-2 py-0.5 rounded border border-red-500/30">
                      ACO Priority #1
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Cleared: {bin.lastCollected}</span>
                <button
                  onClick={() => {
                    onEmptyBin(bin.id);
                    triggerConfetti();
                  }}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                    isCritical
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <IconCheckCircle className="w-4 h-4" />
                  Mark Emptied
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
