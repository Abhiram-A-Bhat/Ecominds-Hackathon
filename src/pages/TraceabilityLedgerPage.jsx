import React, { useState, useEffect } from 'react';
import { IconCpu, IconZap, IconCheckCircle, IconDownload, IconFileText } from '../components/Icons';
import { Link } from '../router/Router';

export const TraceabilityLedgerPage = () => {
  const [ledgerEntries] = useState([
    {
      txHash: "0x89f4b27c19ae8204",
      item: "Lithium-Ion 18650 Battery Batch #42 (12 Cells)",
      dropLocation: "ECE Robotics Lab Smart Locker",
      studentId: "1RN23EC048 (Divyashree S)",
      timestamp: "Today, 11:24 AM",
      lifecycleStage: "CPCB Certified Recycler Handover",
      recyclerName: "E-Terra Global Recyclers (Govt Reg: KSPCB/EW/2022/94)",
      metalsRecovered: "Cobalt (84g), Nickel (62g), Lithium Carbonate (28g)",
      status: "VERIFIED & SEALED",
      complianceCode: "CPCB-MANIFEST-FORM-6"
    },
    {
      txHash: "0x42c8d109f08a4112",
      item: "Mixed Microcontroller Boards (Arduino & ESP32)",
      dropLocation: "CSE 2nd Floor Smart Locker",
      studentId: "1RN22CS110 (Purnima S)",
      timestamp: "Yesterday, 04:15 PM",
      lifecycleStage: "Academic Lab Upcycling Re-Issue",
      recyclerName: "RNSIT Component Salvage Club Desk",
      metalsRecovered: "100% Component Re-Use (Zero Scrap Loss)",
      status: "RE-ISSUED TO JUNIORS",
      complianceCode: "CAMPUS-CIRCULAR-REUSE"
    },
    {
      txHash: "0x31a0e98214bc7754",
      item: "Damaged SMPS Power Supply & Transformers",
      dropLocation: "Mechanical Workshop Yard Locker",
      studentId: "1RN21ME074 (Kavitha S)",
      timestamp: "12 Oct 2026, 02:40 PM",
      lifecycleStage: "Smelting & Heavy Metal Extraction",
      recyclerName: "Bangalore Green Metallics Ltd.",
      metalsRecovered: "Copper (380g), Ferrite Core (420g), Aluminium (150g)",
      status: "SMELTED & RECOVERED",
      complianceCode: "CPCB-MANIFEST-FORM-6"
    }
  ]);

  const [computedHashes, setComputedHashes] = useState({});

  useEffect(() => {
    const computeHashes = async () => {
      const hashes = {};
      for (let i = 0; i < ledgerEntries.length; i++) {
        const entry = ledgerEntries[i];
        const data = `${entry.txHash}|${entry.item}|${entry.studentId}|${entry.timestamp}`;
        const encoded = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        hashes[i] = hashHex;
      }
      setComputedHashes(hashes);
    };
    computeHashes();
  }, []);

  const handleExport = () => {
    const lines = ledgerEntries.map((e, i) => [
      `TX: ${e.txHash}`,
      `Item: ${e.item}`,
      `Deposited At: ${e.dropLocation}`,
      `By: ${e.studentId}`,
      `Time: ${e.timestamp}`,
      `Recipient: ${e.recyclerName}`,
      `Stage: ${e.lifecycleStage}`,
      `Materials Recovered: ${e.metalsRecovered}`,
      `Status: ${e.status}`,
      `Compliance: ${e.complianceCode}`,
      `Audit Hash (SHA-256): ${computedHashes[i] || 'computing...'}`,
      '---',
    ].join('\n')).join('\n');
    const blob = new Blob([`Ecominds E-Waste Audit Ledger\nGenerated: ${new Date().toISOString()}\n\n${lines}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ecosphere-audit-ledger.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">Traceability Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            E-Waste Chain-of-Custody Audit Trail
          </h1>
          <p className="text-xs text-slate-400">
            Endpoint: <code className="text-teal-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">/traceability</code> • Tamper-evident audit log ensuring zero illegal dumping or toxic soil leakage.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center gap-2"
        >
          <IconDownload className="w-4 h-4" />
          Export Ledger Manifest
        </button>
      </div>

      {/* Top Banner: Tamper Proof Guarantee */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-teal-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <IconZap className="w-4 h-4" />
            Verified Environmental Compliance Ledger
          </div>
          <h2 className="text-lg font-black text-white">
            Guaranteed End-of-Life Destruction & Material Recovery
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            In typical waste management, discarded electronics frequently get diverted to informal scrap burning. 
            Ecominds binds every deposited item to a tamper-evident audit log, tracking it until raw precious metals (gold, copper, cobalt) are certified recovered.
          </p>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl text-center">
          <div className="text-[10px] text-slate-400 font-bold uppercase">CPCB Compliance Score</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">100%</div>
          <div className="text-[10px] text-emerald-400">Zero Unaccounted E-Waste</div>
        </div>
      </div>

      {/* Ledger Cards */}
      <div className="space-y-3">
        {ledgerEntries.map((entry, idx) => (
          <div key={idx} className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-teal-500/40 transition shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-slate-950 text-teal-400 px-2.5 py-1 rounded border border-slate-800">
                  TX: {entry.txHash}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{entry.timestamp}</span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <IconCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                {entry.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Deposited Hardware Item</div>
                <div className="text-sm font-black text-white mt-0.5">{entry.item}</div>
                <div className="text-xs text-slate-400 mt-1">Origin: {entry.dropLocation}</div>
                <div className="text-xs text-slate-400">Initiated By: {entry.studentId}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Chain-of-Custody Recipient</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">{entry.recyclerName}</div>
                <div className="text-xs text-teal-400 mt-1 font-semibold">{entry.lifecycleStage}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{entry.complianceCode}</div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Materials Certified Recovered</div>
                <div className="text-xs font-mono text-emerald-400 font-bold mt-1">{entry.metalsRecovered}</div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Verified Hash: {computedHashes[idx] ? computedHashes[idx].slice(0, 16) : 'computing...'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
