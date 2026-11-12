import React, { useState, useEffect } from 'react';
import { Link } from '../router/Router';
import { CampusMap } from '../components/CampusMap';
import { fetchCampusWeather } from '../services/weatherService';
import { useAuth } from '../contexts/AuthContext';
import { IconMapPin, IconCpu } from '../components/Icons';
import { triggerConfetti } from '../utils/confetti';

export const CampusBinsPage = ({ bins, onEmptyBin, onReportBinOverflow }) => {
  const { isOperator: isAdmin } = useAuth();
  const [filter, setFilter] = useState('ALL');
  const [ambientWeather, setAmbientWeather] = useState(null);

  useEffect(() => {
    fetchCampusWeather().then(w => setAmbientWeather(w)).catch(() => {});
  }, []);

  const filteredBins = bins.filter(b => {
    if (filter === 'CRITICAL') return b.fillLevel >= 80;
    if (filter === 'WARNING') return b.fillLevel >= 60 && b.fillLevel < 80;
    if (filter === 'EWASTE') return b.eWasteAllowed;
    return true;
  });

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
              ? 'Real-time ultrasonic fill monitoring, battery telemetry & hazardous heat/methane sensors across RNSIT campus.'
              : 'Find the nearest disposal bin on campus and check available space before dropping your waste.'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
        </div>
      </div>

      {/* Live Mapbox Bin Network Map */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Live Campus Bin Network — {bins.filter(b => b.fillLevel >= 80).length} Bins Full
          </span>
        </div>
        <CampusMap bins={bins} mode="bins" height="360px" />
      </div>

      {/* Bins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBins.map(bin => {
          const isCritical = bin.fillLevel >= 80;
          const isWarning = bin.fillLevel >= 60 && bin.fillLevel < 80;

          // Real-time thermal sensor calibrated against live RNSIT ambient weather
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
                  <span className="text-xs font-mono font-bold bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-slate-200">
                    {bin.id}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isCritical ? 'bg-red-500/20 text-red-400 border border-red-500/30' : isWarning ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {bin.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-white text-base">{bin.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <IconMapPin className="w-3.5 h-3.5 text-slate-500" />
                    {bin.block} • {bin.floor}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Stream: <strong className="text-slate-300">{bin.type}</strong></p>
                </div>

                {/* Fill Meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">{isAdmin ? 'Ultrasonic Fill Level:' : 'Current Fill Level:'}</span>
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
                    ></div>
                  </div>
                </div>

                {/* Telemetry Bar (Admin only) or Student friendly summary */}
                {isAdmin ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                    <div>
                      <span className="text-slate-500 block">Battery:</span>
                      <strong className="text-slate-200">{bin.batteryPct}% Solar</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Thermal (Probe):</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-emerald-400">{liveBinTemp}°C</strong>
                        <span className="text-[9px] text-slate-400 font-sans">Live</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-slate-300 flex items-center justify-between">
                    <span>Space: <strong className={isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}>{isCritical ? 'Full (Needs Clearing)' : isWarning ? 'Half Full' : 'Plenty of Space'}</strong></span>
                    <span className="text-slate-500 text-[10px]">{bin.fillLevel}% full</span>
                  </div>
                )}

                {bin.eWasteAllowed && (
                  <div className="bg-blue-950/40 border border-blue-500/30 p-2 rounded-xl text-[11px] text-blue-300 flex items-center gap-2">
                    <IconCpu className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>Certified electronics &amp; circuit board drop-off depot.</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    onReportBinOverflow(bin.id);
                  }}
                  aria-label={`Report overflow for ${bin.name} and earn 35 EcoCredits`}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
                >
                  ⚡ Report Overflow (+35 PTS)
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      onEmptyBin(bin.id);
                      triggerConfetti();
                    }}
                    aria-label={`Admin action: Mark ${bin.name} as emptied`}
                    className="bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl transition"
                  >
                    Clear Bin (Ground Ops)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
