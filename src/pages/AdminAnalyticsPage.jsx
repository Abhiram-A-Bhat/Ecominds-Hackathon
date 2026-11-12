import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { IconBarChart, IconSliders, IconMapPin, IconCpu, IconZap, IconFileText } from '../components/Icons';
import { Link } from '../router/Router';
import { CampusMap } from '../components/CampusMap';
import { fetchCampusWeather } from '../services/weatherService';

/* ─── Mock chart data ─────────────────────────────────────── */
const co2Data = [
  { day: 'Mon', co2: 280, target: 300 },
  { day: 'Tue', co2: 310, target: 300 },
  { day: 'Wed', co2: 290, target: 300 },
  { day: 'Thu', co2: 350, target: 300 },
  { day: 'Fri', co2: 420, target: 300 },
  { day: 'Sat', co2: 390, target: 300 },
  { day: 'Sun', co2: 460, target: 300 },
];

const wasteCategories = [
  { cat: 'Organic', kg: 580, fill: '#34d399' },
  { cat: 'Plastic',  kg: 340, fill: '#60a5fa' },
  { cat: 'Paper',   kg: 290, fill: '#a78bfa' },
  { cat: 'E-Waste', kg: 95,  fill: '#f87171' },
  { cat: 'Metal',   kg: 120, fill: '#fbbf24' },
];

const binFillTrend = Array.from({ length: 24 }, (_, h) => ({
  hr: `${h}:00`,
  CSE:  Math.round(30 + 50 * Math.sin(h / 23 * Math.PI) + (Math.random() - 0.5) * 8),
  MECH: Math.round(20 + 60 * Math.sin((h - 2) / 23 * Math.PI) + (Math.random() - 0.5) * 10),
  LIB:  Math.round(10 + 40 * Math.sin((h - 4) / 23 * Math.PI) + (Math.random() - 0.5) * 6),
})).map(d => ({
  ...d,
  CSE:  Math.max(0, Math.min(100, d.CSE)),
  MECH: Math.max(0, Math.min(100, d.MECH)),
  LIB:  Math.max(0, Math.min(100, d.LIB)),
}));

const wasteStream = [
  { name: 'Organic', value: 580, color: '#34d399' },
  { name: 'Plastic', value: 340, color: '#60a5fa' },
  { name: 'Paper',   value: 290, color: '#a78bfa' },
  { name: 'E-Waste', value: 95,  color: '#f87171' },
  { name: 'Metal',   value: 120, color: '#fbbf24' },
];

/* ─── Custom Tooltip ─────────────────────────────────────── */
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(3,13,8,0.97)',
      border: '1px solid rgba(52,211,153,0.2)',
      borderRadius: 10,
      padding: '8px 14px',
      fontSize: 12,
      color: '#e2f5ec',
    }}>
      {label && <div style={{ color: '#7ea893', marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#34d399', fontWeight: 700 }}>
          {p.name}: {p.value}{p.unit || ''}
        </div>
      ))}
    </div>
  );
};

/* ─── Chart Section Header ───────────────────────────────── */
const ChartHeader = ({ label, title }) => (
  <div className="mb-3">
    <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#34d399' }}>{label}</div>
    <div className="text-sm font-extrabold" style={{ color: '#e2f5ec' }}>{title}</div>
  </div>
);

export const AdminAnalyticsPage = ({ bins, onUpdateBinFill }) => {
  const [selectedBin, setSelectedBin] = useState(bins[1]);
  const [ambientWeather, setAmbientWeather] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [surgeAlert, setSurgeAlert] = useState(null);

  useEffect(() => {
    fetchCampusWeather().then(w => setAmbientWeather(w)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSimulateSurge = (binId = "B-102", level = 98) => {
    onUpdateBinFill(binId, level);
    const target = bins.find(b => b.id === binId) || { id: binId, name: 'CSE Corridor East', block: 'Computer Science Block' };
    setSelectedBin({ ...target, fillLevel: level, status: 'CRITICAL' });
    setSurgeAlert(`🚨 CRITICAL SURGE ACTIVATED: ${target.name} (${binId}) reached ${level}%! Cleaner route reprioritized & Green Guardian notification broadcast.`);
    setTimeout(() => setSurgeAlert(null), 6500);
  };

  const criticalCount = bins.filter(b => b.fillLevel >= 80).length;
  const warningCount  = bins.filter(b => b.fillLevel >= 60 && b.fillLevel < 80).length;
  const normalCount   = bins.filter(b => b.fillLevel < 60).length;

  return (
    <div className="space-y-6">

      {/* ── Breadcrumb Header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">Executive Console</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Admin Sustainability &amp; IoT Sensor Console
          </h1>
          <p className="text-xs text-slate-400">
            Endpoint: <code className="text-cyan-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">/admin</code>
            &nbsp;• Live sensor diagnostics, digital twin telemetry, and interactive simulation sliders.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            fontWeight: 700,
            color: '#34d399',
            background: 'rgba(52,211,153,0.06)',
            border: '1px solid rgba(52,211,153,0.18)',
            padding: '6px 12px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span>🕐</span>
            <span>{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          <Link
            to="/audit"
            className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
          >
            <IconFileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Accreditation Audit</span>
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 shadow-xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Waste Diverted</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">1,685.4 <span className="text-xs">KG</span></div>
          <div className="text-[10px] text-emerald-400 mt-1">↑ 18.2% MoM increase</div>
        </div>
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 shadow-xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">E-Waste Salvaged</div>
          <div className="text-2xl font-black text-blue-400 font-mono mt-1">370.2 <span className="text-xs">KG</span></div>
          <div className="text-[10px] text-blue-400 mt-1">100% RoHS &amp; CPCB Tracked</div>
        </div>
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 shadow-xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Net Carbon Abatement</div>
          <div className="text-2xl font-black text-teal-400 font-mono mt-1">4,820 <span className="text-xs">KG CO2e</span></div>
          <div className="text-[10px] text-teal-400 mt-1">Scope 3 Certified</div>
        </div>
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800/80 shadow-xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Campus Bins Status</div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[11px] font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded font-mono">{criticalCount} Crit</span>
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded font-mono">{warningCount} Warn</span>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded font-mono">{normalCount} Norm</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5">7 of 7 IoT Nodes Active</div>
        </div>
      </div>

      {/* ── Mapbox Campus Digital Twin ─────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#34d399' }}>Live Digital Twin</span>
          <span className="text-sm font-extrabold ml-1" style={{ color: '#e2f5ec' }}>RNSIT Campus — Admin Overview</span>
        </div>
        <CampusMap bins={bins} mode="admin" height="420px" />
      </div>

      {/* ── Live Telemetry Inspector ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-4 flex flex-col justify-between shadow-xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Select a Bin Node</div>
          <div className="grid grid-cols-2 gap-2">
            {bins.map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBin(b)}
                className={`text-xs font-bold px-3 py-2 rounded-xl border transition text-left ${
                  selectedBin?.id === b.id
                    ? 'border-emerald-400 bg-emerald-900/30 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-mono">{b.id}</span>
                <span className="block text-[10px] text-slate-500 truncate">{b.name}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedBin && (
          <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-black bg-slate-950 text-emerald-400 px-2.5 py-1 rounded-md border border-slate-800">
                NODE: {selectedBin.id}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                selectedBin.fillLevel >= 80 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {selectedBin.status}
              </span>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white">{selectedBin.name}</h4>
              <p className="text-xs text-slate-400">📍 {selectedBin.block} • {selectedBin.floor}</p>
              <p className="text-xs text-slate-300 mt-1 font-medium">Type: {selectedBin.type}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-slate-400">Ultrasonic Level:</span>
                <span className={selectedBin.fillLevel >= 80 ? 'text-red-400' : 'text-emerald-400'}>
                  {selectedBin.fillLevel}%
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${selectedBin.fillLevel >= 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${selectedBin.fillLevel}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400">
                <div>Battery: <strong className="text-slate-200">{selectedBin.batteryPct}%</strong></div>
                <div>Last Cleared: <strong className="text-slate-200">{selectedBin.lastCollected}</strong></div>
                <div>Thermal Probe: <strong className="text-emerald-400 font-mono">{((ambientWeather?.exactTemp || 25.0) + (selectedBin.fillLevel >= 80 ? 2.4 : selectedBin.fillLevel >= 60 ? 1.2 : 0.4)).toFixed(1)}°C</strong></div>
                <div>Ambient Station: <strong className="text-slate-300 font-mono">{ambientWeather?.temp || 25}°C</strong></div>
              </div>
            </div>
            {selectedBin.eWasteAllowed && (
              <div className="bg-blue-950/40 border border-blue-500/30 p-2.5 rounded-xl text-xs text-blue-300 flex items-center gap-2">
                <IconCpu className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Configured with specialized E-Waste &amp; Battery sub-compartment.</span>
              </div>
            )}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              Node communications verified via LoRaWAN / Wi-Fi Gateway mesh.
            </div>
          </div>
        )}
      </div>

      {/* ── Analytics Charts 2×2 Grid ─────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#34d399' }}>Sustainability Analytics</span>
          <span className="text-sm font-extrabold ml-1" style={{ color: '#e2f5ec' }}>7-Day &amp; Real-Time Data</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Chart 1 — CO2 Trend */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-xl">
            <ChartHeader label="Carbon Abatement Trend" title="7-Day CO₂ Saved (KG)" />
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={co2Data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(52,211,153,0.07)" />
                <XAxis dataKey="day" tick={{ fill: '#7ea893', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7ea893', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="co2" name="CO₂ Saved" stroke="#34d399" strokeWidth={2.5} fill="url(#co2Grad)" dot={false} />
                <Area type="monotone" dataKey="target" name="Target" stroke="#7ea893" strokeWidth={1} strokeDasharray="4 4" fill="none" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2 — Waste by Category */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-xl">
            <ChartHeader label="Waste Stream Breakdown" title="Category-wise Collection (KG)" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={wasteCategories} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(52,211,153,0.07)" />
                <XAxis dataKey="cat" tick={{ fill: '#7ea893', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7ea893', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="kg" name="Weight" radius={[6, 6, 0, 0]}>
                  {wasteCategories.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} fillOpacity={0.88} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3 — Bin Fill Trend 24h */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-xl">
            <ChartHeader label="IoT Sensor Telemetry" title="24-Hr Bin Fill Simulation (Top 3 Bins)" />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={binFillTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(52,211,153,0.07)" />
                <XAxis dataKey="hr" tick={{ fill: '#7ea893', fontSize: 9 }} axisLine={false} tickLine={false}
                  interval={3} />
                <YAxis domain={[0, 100]} tick={{ fill: '#7ea893', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#7ea893' }} />
                <Line type="monotone" dataKey="CSE"  name="B-102 CSE"  stroke="#34d399" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="MECH" name="B-201 Mech" stroke="#60a5fa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="LIB"  name="B-301 Lib"  stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4 — Pie Chart */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-xl">
            <ChartHeader label="Waste Stream Composition" title="% Share by Material Type" />
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={wasteStream} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={78} strokeWidth={0}>
                    {wasteStream.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 text-[11px]">
                {wasteStream.map((s, i) => {
                  const total = wasteStream.reduce((a, b) => a + b.value, 0);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span style={{ color: '#7ea893' }}>{s.name}</span>
                      <span className="font-bold ml-auto pl-3" style={{ color: '#e2f5ec' }}>
                        {Math.round(s.value / total * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Simulated IoT Sensor Console ──────────────────── */}
      {surgeAlert && (
        <div className="bg-red-950/90 border border-red-500 p-4 rounded-2xl flex items-center justify-between text-white shadow-2xl animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🚨</span>
            <span className="text-xs font-black">{surgeAlert}</span>
          </div>
          <button onClick={() => setSurgeAlert(null)} className="text-xs text-red-300 font-bold ml-4">✕</button>
        </div>
      )}

      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <IconSliders className="w-5 h-5 text-emerald-400" />
              Live Simulated IoT Sensor Console
            </h3>
            <p className="text-xs text-slate-400">
              Drag sliders to dynamically alter bin fill levels and observe immediate alert dispatch and cleaner route updates.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSimulateSurge("B-102", 98)}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg shadow-red-600/30 flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>Simulate Surge (CSE 98%)</span>
            </button>
            <button
              onClick={() => {
                bins.forEach(b => onUpdateBinFill(b.id, Math.floor(20 + Math.random() * 35)));
                setSurgeAlert("✓ All sensor telemetries reset to normal baseline.");
                setTimeout(() => setSurgeAlert(null), 3000);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition"
            >
              Reset All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {bins.map(bin => (
            <div key={bin.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white truncate">{bin.id} - {bin.name}</span>
                <span className={bin.fillLevel >= 80 ? 'text-red-400 font-mono' : 'text-emerald-400 font-mono'}>
                  {bin.fillLevel}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={bin.fillLevel}
                onChange={(e) => {
                  const lvl = parseInt(e.target.value);
                  onUpdateBinFill(bin.id, lvl);
                  if (selectedBin?.id === bin.id) {
                    setSelectedBin(prev => ({
                      ...prev,
                      fillLevel: lvl,
                      status: lvl >= 80 ? 'CRITICAL' : lvl >= 60 ? 'WARNING' : 'NORMAL'
                    }));
                  }
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
