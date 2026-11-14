import React from 'react';
import { IconFileText, IconCheckCircle, IconDownload, IconRecycle, IconCpu, IconLeaf } from './Icons';

export const NaacAuditModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconFileText className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-white text-sm">NAAC Criterion 7.1.3 Institutional Compliance Certificate</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
            >
              <IconDownload className="w-3.5 h-3.5" /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Formal Document Content */}
        <div className="p-8 overflow-y-auto bg-white text-slate-900 print:p-0 print:m-0 space-y-6" id="naacReportPrintArea">
          {/* Institutional Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <div className="text-xl font-black tracking-tight text-slate-950 uppercase">
              RNS INSTITUTE OF TECHNOLOGY
            </div>
            <div className="text-xs text-slate-600 font-medium">
              (AICTE Approved, Affiliated to VTU Belagavi, Accredited by NAAC with 'A+' Grade & NBA)
            </div>
            <div className="text-xs text-slate-500">
              Dr. Vishnuvardhan Road, Channasandra, RR Nagar Post, Bengaluru - 560 098, Karnataka, India
            </div>
            <div className="mt-2 inline-block bg-emerald-100 text-emerald-900 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              ANNUAL CAMPUS SUSTAINABILITY & CIRCULAR E-WASTE AUDIT REPORT — ACADEMIC YEAR 2025-26
            </div>
          </div>

          {/* Audit Metadata Table */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div><span className="text-slate-500 font-semibold">Audit Parameter:</span> <strong className="block text-slate-900">NAAC Criterion 7.1.3</strong></div>
            <div><span className="text-slate-500 font-semibold">Evaluating Body:</span> <strong className="block text-slate-900">RNSIT Green Cell & IQAC</strong></div>
            <div><span className="text-slate-500 font-semibold">Tech Framework:</span> <strong className="block text-slate-900">Ecominds</strong></div>
            <div><span className="text-slate-500 font-semibold">Project Lead:</span> <strong className="block text-emerald-800 font-bold">Team ECO MINDS</strong></div>
          </div>

          {/* Executive Summary Metrics */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-sm text-slate-900 border-l-4 border-emerald-600 pl-2">
              1. EXECUTIVE CAMPUS WASTE DIVERSION & SEQUESTRATION SUMMARY
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-100 rounded border border-slate-200 text-center">
                <div className="text-xs text-slate-600 font-bold">Total Waste Diverted</div>
                <div className="text-xl font-black text-emerald-700 font-mono">1,685.4 KG</div>
                <div className="text-[10px] text-slate-500">Organic + Recyclables</div>
              </div>
              <div className="p-3 bg-slate-100 rounded border border-slate-200 text-center">
                <div className="text-xs text-slate-600 font-bold">E-Waste Salvaged / Recycled</div>
                <div className="text-xl font-black text-blue-700 font-mono">370.2 KG</div>
                <div className="text-[10px] text-slate-500">Zero Landfill Dumping</div>
              </div>
              <div className="p-3 bg-slate-100 rounded border border-slate-200 text-center">
                <div className="text-xs text-slate-600 font-bold">Net Carbon Abatement</div>
                <div className="text-xl font-black text-teal-700 font-mono">4,820 KG CO2e</div>
                <div className="text-[10px] text-slate-500">Verified by Scope-3 LCA</div>
              </div>
            </div>
          </div>

          {/* E-Waste Lifecycle Deep Dive */}
          <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
            <h4 className="font-extrabold text-sm text-slate-900 border-l-4 border-blue-600 pl-2">
              2. E-WASTE & LAB HARDWARE CIRCULAR MANAGEMENT (RoHS COMPLIANT)
            </h4>
            <p>
              In accordance with Ministry of Environment, Forest and Climate Change (MoEFCC) <strong>E-Waste Management Rules 2022</strong>, RNSIT has instituted a closed-loop electronic hardware lifecycle:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Component Salvage Loop:</strong> 184 functional microcontrollers (Arduino, ESP32), sensor modules, and power relays salvaged from final-year engineering projects re-issued to junior labs at zero cost.</li>
              <li><strong>Hazardous Heavy Metal Channeling:</strong> 100% of expired Lithium-ion (18650) and Lead-Acid backup cells diverted to state-authorized CPCB recyclers with manifest tracking.</li>
              <li><strong>Right-To-Repair Clinics:</strong> 92 student laptops and peripherals serviced by student electronics clubs, avoiding early disposal.</li>
            </ul>
          </div>

          {/* Organic Composting & Tree Sequestration */}
          <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
            <h4 className="font-extrabold text-sm text-slate-900 border-l-4 border-emerald-600 pl-2">
              3. ORGANIC MESS BIO-CONVERSION & TREE ADOPTION
            </h4>
            <p>
              42 mature campus trees (Silver Oak, Neem, Gulmohar, Mahua) cataloged into the digital twin GIS map, sequestering an estimated <strong>1.24 metric tons of carbon annually</strong>. 100% of unserved mess food announced via real-time surplus notifications, achieving a 78% reduction in canteen plate waste.
            </p>
          </div>

          {/* Project Team & Sign-Off Block */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="font-bold text-slate-900 mb-1">Presented by Team ECO MINDS:</div>
              <div className="text-slate-600 space-y-0.5">
                <div>• Draupadi</div>
                <div>• Subhadra</div>
                <div>• Vyasa</div>
                <div>• Parvati</div>
                <div>• Gargi</div>
                <div>• Lakshmi</div>
              </div>
            </div>
            <div className="flex flex-col justify-end text-right">
              <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
              <div className="font-bold text-slate-900">Dr. M. K. Venkatesha / Principal</div>
              <div className="text-slate-500 text-[10px]">Chairman, Green Campus Initiative, RNSIT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
