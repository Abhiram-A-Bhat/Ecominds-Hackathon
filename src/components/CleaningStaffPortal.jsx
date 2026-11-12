import React from 'react';
import { 
  IconNavigation, 
  IconTrash, 
  IconCheckCircle, 
  IconAlertTriangle, 
  IconMapPin, 
  IconZap,
  IconCpu
} from './Icons';
import { triggerConfetti } from '../utils/confetti';

export const CleaningStaffPortal = ({ bins, onEmptyBin }) => {
  // Filter bins that need attention (Fill level >= 75%)
  const urgentBins = [...bins]
    .filter(b => b.fillLevel >= 75)
    .sort((a, b) => b.fillLevel - a.fillLevel);

  const normalBins = bins.filter(b => b.fillLevel < 75);

  return (
    <div className="space-y-6">
      {/* Top Banner: Dynamic Dispatch & Route Optimizer */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 p-5 rounded-2xl border border-amber-500/30 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <IconNavigation className="w-6 h-6 text-amber-400" />
            <h3 className="text-lg font-black text-white">Smart Dynamic Collection Route Optimizer</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Instead of fixed schedule walking, our TSP/Ant Colony path algorithm prioritizes bins based on real-time fill level sensors and student overflow alerts, reducing daily staff walking fatigue.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <div className="text-center px-2 border-r border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Critical Bins</div>
            <div className="text-lg font-black text-red-400 font-mono">{urgentBins.length}</div>
          </div>
          <div className="text-center px-2 border-r border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Walking Saved</div>
            <div className="text-lg font-black text-emerald-400 font-mono">1.8 km</div>
          </div>
          <div className="text-center px-2">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Time Saved</div>
            <div className="text-lg font-black text-amber-400 font-mono">38 mins</div>
          </div>
        </div>
      </div>

      {/* Suggested Sequence Flow */}
      {urgentBins.length > 0 && (
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <IconZap className="w-4 h-4 text-amber-400" />
            Recommended Step-by-Step Collection Sequence:
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-mono font-bold">
              Ground Ops Station
            </span>
            {urgentBins.map((b, index) => (
              <React.Fragment key={b.id}>
                <span className="text-slate-500 font-black">➔</span>
                <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-red-600 text-[10px] flex items-center justify-center text-white">
                    {index + 1}
                  </span>
                  {b.id} ({b.name} - {b.fillLevel}%)
                </span>
              </React.Fragment>
            ))}
            <span className="text-slate-500 font-black">➔</span>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-mono font-bold">
              Central RNSIT Compactor & Compost Pit
            </span>
          </div>
        </div>
      )}

      {/* Grid of Bins */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center justify-between">
          <span>All 7 Campus Smart Bins Live Status:</span>
          <span className="text-xs text-slate-400 font-normal">Click "Mark As Emptied" once collected</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bins.map(bin => {
            const isCritical = bin.fillLevel >= 80;
            const isWarning = bin.fillLevel >= 60 && bin.fillLevel < 80;

            return (
              <div 
                key={bin.id} 
                className={`rounded-2xl p-4 border transition flex flex-col justify-between ${
                  isCritical 
                    ? 'bg-red-950/20 border-red-500/40 shadow-lg shadow-red-900/10' 
                    : isWarning 
                    ? 'bg-amber-950/20 border-amber-500/30' 
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-200">
                      {bin.id}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isCritical ? 'bg-red-500/20 text-red-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {isCritical ? 'CRITICAL - COLLECT NOW' : isWarning ? 'WARNING' : 'NORMAL'}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-extrabold text-white text-base">{bin.name}</h5>
                    <p className="text-xs text-slate-400">📍 {bin.block} • {bin.floor}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Stream: {bin.type}</p>
                  </div>

                  {/* Fill Level Meter */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold font-mono">
                      <span className="text-slate-400">Fill Level</span>
                      <span className={isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}>
                        {bin.fillLevel}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCritical ? 'bg-gradient-to-r from-red-600 to-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${bin.fillLevel}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* E-Waste Indicator */}
                  {bin.eWasteAllowed && (
                    <div className="bg-blue-950/40 border border-blue-500/30 p-2 rounded-xl text-[11px] text-blue-300 flex items-center gap-2">
                      <IconCpu className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>E-Waste drop point: Wear antistatic gloves during collection.</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Last clear: {bin.lastCollected}
                  </span>
                  <button
                    onClick={() => {
                      onEmptyBin(bin.id);
                      triggerConfetti();
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      isCritical 
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <IconCheckCircle className="w-3.5 h-3.5" />
                    Mark Emptied
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
