import React from 'react';
import { IconFileText, IconDownload, IconCheckCircle, IconZap } from '../components/Icons';
import { Link } from '../router/Router';

export const NaacAuditPage = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">NAAC Compliance Portal</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            NAAC Criterion 7.1.3 Sustainability & E-Waste Audit
          </h1>
          <p className="text-xs text-slate-400">
            Endpoint: <code className="text-amber-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">/audit</code> • Official printable compliance document for university accreditation panels.
          </p>
        </div>

        <button
          onClick={handlePrint}
          aria-label="Print or save NAAC Criterion 7.1.3 audit report as PDF"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
        >
          <IconDownload className="w-4 h-4" aria-hidden="true" />
          Print / Save as PDF
        </button>
      </div>

      {/* Printable Formal Document Content */}
      <div className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-2xl max-w-4xl mx-auto space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Institutional Letterhead */}
        <div className="border-b-2 border-slate-900 pb-5 text-center space-y-1.5">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
            RNS INSTITUTE OF TECHNOLOGY
          </h2>
          <div className="text-xs text-slate-600 font-medium">
            (Approved by AICTE New Delhi, Affiliated to VTU Belagavi, Accredited by NAAC with 'A+' Grade & NBA)
          </div>
          <div className="text-xs text-slate-500">
            Dr. Vishnuvardhan Road, Post Channasandra, RR Nagar Post, Bengaluru - 560098, Karnataka, India
          </div>
          <div className="pt-2">
            <span className="inline-block bg-emerald-100 text-emerald-900 text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
              ANNUAL CAMPUS SUSTAINABILITY & CIRCULAR E-WASTE AUDIT — AY 2025-26
            </span>
          </div>
        </div>

        {/* Audit Parameters Table */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div><span className="text-slate-500 font-bold block">Accreditation Criterion:</span> <strong className="text-slate-900 text-sm">NAAC 7.1.3</strong></div>
          <div><span className="text-slate-500 font-bold block">Assessing Agency:</span> <strong className="text-slate-900 text-sm">IQAC Green Audit Cell</strong></div>
          <div><span className="text-slate-500 font-bold block">Software Platform:</span> <strong className="text-slate-900 text-sm">Guardian Campus OS</strong></div>
          <div><span className="text-slate-500 font-bold block">Innovators:</span> <strong className="text-emerald-800 font-bold text-sm">Team ECO MINDS</strong></div>
        </div>

        {/* Section 1: Executive KPI Metrics */}
        <div className="space-y-3">
          <h3 className="font-black text-base text-slate-900 border-l-4 border-emerald-600 pl-3">
            1. EXECUTIVE SOLID & ELECTRONIC WASTE METRICS
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-xs font-bold text-slate-600">Total Waste Diverted</div>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-1">1,685.4 KG</div>
              <div className="text-[10px] text-slate-500">Zero Landfill Dumping</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-xs font-bold text-slate-600">E-Waste Salvaged / Channelled</div>
              <div className="text-2xl font-black text-blue-700 font-mono mt-1">370.2 KG</div>
              <div className="text-[10px] text-slate-500">RoHS 2022 Compliant</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-xs font-bold text-slate-600">Net Carbon Offset</div>
              <div className="text-2xl font-black text-teal-700 font-mono mt-1">4,820 KG CO2e</div>
              <div className="text-[10px] text-slate-500">Scope 3 LCA Verified</div>
            </div>
          </div>
        </div>

        {/* Section 2: E-Waste Lifecycle Deep Dive */}
        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
          <h3 className="font-black text-base text-slate-900 border-l-4 border-blue-600 pl-3">
            2. INSTITUTIONAL E-WASTE & HARDWARE RECOVERY PROTOCOLS
          </h3>
          <p>
            In compliance with the Ministry of Environment, Forest and Climate Change (MoEFCC) <strong>E-Waste (Management) Rules 2022</strong>, RNSIT has operationalized an end-to-end circular hardware loop:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-800">
            <li><strong>Component Salvage Loop:</strong> 184 functional microcontrollers (Arduino Uno, ESP32), sensor modules, and relays salvaged from final-year engineering capstone projects re-issued to junior labs at ₹0 cost.</li>
            <li><strong>Hazardous Heavy Metal Channeling:</strong> 100% of expired Lithium-ion (18650) and Lead-Acid backup cells diverted to state-authorized CPCB recyclers with manifest tracking.</li>
            <li><strong>Student Fix-It Clinics:</strong> 92 student laptops and lab power supplies serviced by student electronics clubs, preventing premature disposal.</li>
          </ul>
        </div>

        {/* Section 3: Organic Composting & Tree Sequestration */}
        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
          <h3 className="font-black text-base text-slate-900 border-l-4 border-emerald-600 pl-3">
            3. MESS BIO-CONVERSION & TREE ADOPTION
          </h3>
          <p>
            42 mature campus trees (Silver Oak, Neem, Gulmohar, Mahua) cataloged into the digital twin GIS map, sequestering an estimated <strong>1.24 metric tons of carbon annually</strong>. 100% of unserved mess food announced via real-time surplus notifications, achieving a 78% reduction in canteen plate waste.
          </p>
        </div>

        {/* Signatures Block */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
          <div>
            <div className="font-bold text-slate-900 mb-1">Presented by Team ECO MINDS:</div>
            <div className="text-slate-600 space-y-0.5">
              <div>• Divyashree S</div>
              <div>• Sowmyashree S</div>
              <div>• Kavitha S</div>
              <div>• Purnima S Mittalkod</div>
              <div>• Nayana C P</div>
              <div>• Harshitha P</div>
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
  );
};
