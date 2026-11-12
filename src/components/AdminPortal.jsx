import React, { useState } from 'react';
import { 
  IconBarChart, 
  IconSliders, 
  IconAlertTriangle, 
  IconCheckCircle, 
  IconFileText, 
  IconMapPin, 
  IconZap, 
  IconLeaf,
  IconCpu
} from './Icons';

export const AdminPortal = ({ bins, onUpdateBinFill, onOpenAudit }) => {
  const [selectedBin, setSelectedBin] = useState(bins[1]); // Default CSE B-102

  const criticalCount = bins.filter(b => b.fillLevel >= 80).length;
  const warningCount = bins.filter(b => b.fillLevel >= 60 && b.fillLevel < 80).length;
  const normalCount = bins.filter(b => b.fillLevel < 60).length;

  return (
    <div className="space-y-6">
      {/* Top Banner with NAAC Quick Action */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-5 rounded-2xl border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <IconBarChart className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-black text-white">RNSIT Institutional Green & E-Waste Dashboard</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Real-time analytics feeding directly into <strong>NAAC Criterion 7.1.3</strong> (Waste Management) and <strong>NIRF Green Campus Metrics</strong>.
          </p>
        </div>
        <button
          onClick={onOpenAudit}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 whitespace-nowrap"
        >
          <IconFileText className="w-4 h-4" />
          Generate Official NAAC Audit Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Waste Diverted</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">1,685.4 <span className="text-xs">KG</span></div>
          <div className="text-[10px] text-emerald-400 mt-1">↑ 18.2% from previous month</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">E-Waste Salvaged / Handled</div>
          <div className="text-2xl font-black text-blue-400 font-mono mt-1">370.2 <span className="text-xs">KG</span></div>
          <div className="text-[10px] text-blue-400 mt-1">100% RoHS & CPCB Compliant</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Estimated CO₂ Abatement</div>
          <div className="text-2xl font-black text-teal-400 font-mono mt-1">4,820 <span className="text-xs">KG CO2e</span></div>
          <div className="text-[10px] text-teal-400 mt-1">Equivalent to planting 219 trees</div>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Campus Bins Status</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded font-mono">{criticalCount} Critical</span>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded font-mono">{warningCount} Warning</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded font-mono">{normalCount} Normal</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5">7 of 7 IoT Nodes Active</div>
        </div>
      </div>

      {/* Campus Map & Live Telemetry Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Campus Map */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <IconMapPin className="w-4 h-4 text-emerald-400" />
              RNSIT Campus Digital Twin (Live Bin Pins)
            </h4>
            <span className="text-[10px] text-slate-400">Click a node to inspect telemetry</span>
          </div>

          <div className="relative aspect-[16/10] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden p-4">
            {/* Campus Outline Illustration */}
            <div className="absolute inset-4 border border-dashed border-slate-800 rounded-lg pointer-events-none flex items-center justify-center opacity-30">
              <span className="text-3xl font-black text-slate-700 uppercase tracking-widest">
                RNSIT Campus Grounds
              </span>
            </div>

            {/* Render Pins */}
            {bins.map(bin => {
              const isSelected = selectedBin?.id === bin.id;
              const isCritical = bin.fillLevel >= 80;
              const isWarning = bin.fillLevel >= 60 && bin.fillLevel < 80;

              return (
                <button
                  key={bin.id}
                  onClick={() => setSelectedBin(bin)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all duration-300 ${
                    isSelected ? 'ring-4 ring-white scale-125 z-20' : 'hover:scale-110 z-10'
                  } ${
                    isCritical 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' 
                      : isWarning 
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/50' 
                      : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                  }`}
                  style={{ left: `${bin.coordinates.x}%`, top: `${bin.coordinates.y}%` }}
                  title={`${bin.id}: ${bin.name} (${bin.fillLevel}%)`}
                >
                  <span className="text-[10px] font-black px-1 font-mono">{bin.id}</span>
                </button>
              );
            })}

            {/* Map Legend */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-400 font-bold"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> &lt;60% Fill</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold"><span className="w-2 h-2 rounded-full bg-amber-400"></span> 60-79%</span>
              <span className="flex items-center gap-1 text-red-400 font-bold"><span className="w-2 h-2 rounded-full bg-red-400"></span> &ge;80% Alert</span>
            </div>
          </div>
        </div>

        {/* Selected Bin Telemetry Inspector */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4 flex flex-col justify-between">
          {selectedBin ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black bg-slate-950 text-emerald-400 px-2.5 py-1 rounded-md font-mono border border-slate-800">
                  NODE: {selectedBin.id}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  selectedBin.fillLevel >= 80 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {selectedBin.status}
                </span>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-white">{selectedBin.name}</h4>
                <p className="text-xs text-slate-400">📍 {selectedBin.block} • {selectedBin.floor}</p>
                <p className="text-xs text-slate-300 mt-1 font-medium">Type: {selectedBin.type}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-bold font-mono">
                  <span className="text-slate-400">Current Ultrasonic Fill:</span>
                  <span className={selectedBin.fillLevel >= 80 ? 'text-red-400' : 'text-emerald-400'}>
                    {selectedBin.fillLevel}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${selectedBin.fillLevel >= 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${selectedBin.fillLevel}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400">
                  <div>Battery: <strong className="text-slate-200">{selectedBin.batteryPct}%</strong></div>
                  <div>Last Cleared: <strong className="text-slate-200">{selectedBin.lastCollected}</strong></div>
                </div>
              </div>

              {selectedBin.eWasteAllowed && (
                <div className="bg-blue-950/30 border border-blue-500/30 p-2.5 rounded-xl text-xs text-blue-300 flex items-center gap-2">
                  <IconCpu className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Configured with specialized E-Waste & Battery Locker sub-compartment.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-slate-500 py-12">
              Select any node from the map to view real-time diagnostics.
            </div>
          )}

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            Node communications verified via LoRaWAN / Wi-Fi Gateway mesh.
          </div>
        </div>
      </div>

      {/* SIMULATED IOT SENSOR CONSOLE (HACKATHON SHOWCASE KILLER FEATURE!) */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-amber-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <IconSliders className="w-4 h-4 text-amber-400" />
              Live IoT Sensor Simulation Control Rack
            </h4>
            <p className="text-xs text-slate-400">
              Judges can adjust fill level sliders in real-time to observe automatic critical alert triggers and dynamic routing recalculations.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Simulate sudden event in CSE B-102
                onUpdateBinFill("B-102", 98);
              }}
              className="bg-red-700/80 hover:bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
            >
              Simulate Surge (CSE 98%)
            </button>
            <button
              onClick={() => {
                bins.forEach(b => onUpdateBinFill(b.id, Math.floor(20 + Math.random() * 40)));
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-lg transition"
            >
              Reset All to Normal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {bins.map(bin => (
            <div key={bin.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
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
                onChange={(e) => onUpdateBinFill(bin.id, parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
