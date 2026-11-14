import React, { useState, useEffect } from 'react';
import { IconVideo, IconAlertTriangle, IconCheckCircle, IconShield } from '../components/Icons';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { guardianTaskService } from '../services/guardianTaskService';
import { HandIcon as Hand } from '@phosphor-icons/react/dist/csr/Hand';
import { PowerIcon as Power } from '@phosphor-icons/react/dist/csr/Power';
import { BroadcastIcon as Radar } from '@phosphor-icons/react/dist/csr/Broadcast';
import { Link } from '../router/Router';
import { useAuth } from '../contexts/AuthContext';
import { inspectClassroomDemo } from '../services/cctvVisionService';

const INITIAL_FEEDS = [
  {
    id: 'CAM-01',
    room: 'Seminar Hall 2',
    location: 'Admin Block, 3rd Floor (Room 302)',
    occupants: 0,
    occupancyStatus: 'EMPTY',
    emptyDurationMins: 28,
    appliances: [
      { name: 'Optoma 4K Laser Projector', power: '450W', active: true, icon: '📽️' },
      { name: '4x High-Speed Ceiling Fans', power: '320W', active: true, icon: '🌀' },
      { name: '8x LED Tube Fixtures (40W ea)', power: '320W', active: true, icon: '💡' },
      { name: 'Daikin Dual AC Unit (21°C)', power: '2200W', active: true, icon: '❄️' },
    ],
    phantomKw: 3.29,
    hourlyCostInr: 29.60,
            cameraAngle: 'Ceiling Mount Wide 120°',
    fps: 30,
    res: '1080p HD',
  },
  {
    id: 'CAM-02',
    room: 'CSE Lab 3 (Turing Lab)',
    location: 'Computer Science Block, 2nd Floor',
    occupants: 0,
    occupancyStatus: 'EMPTY',
    emptyDurationMins: 42,
    appliances: [
      { name: '16x Dell Desktop Workstations', power: '2400W', active: true, icon: '🖥️' },
      { name: 'Voltas 2-Ton Inverter AC', power: '1850W', active: true, icon: '❄️' },
      { name: '6x Ceiling Tube Lights', power: '240W', active: true, icon: '💡' },
      { name: 'LaserJet Network Printer (Idle)', power: '120W', active: true, icon: '🖨️' },
    ],
    phantomKw: 4.61,
    hourlyCostInr: 41.50,
            cameraAngle: 'Front Lectern Dome',
    fps: 30,
    res: '1080p HD',
  },
  {
    id: 'CAM-03',
    room: 'ECE Class 204',
    location: 'Electronics Block, 1st Floor',
    occupants: 34,
    occupancyStatus: 'OCCUPIED',
    emptyDurationMins: 0,
    appliances: [
      { name: 'Smart Interactive Board', power: '200W', active: true, icon: '📺' },
      { name: '4x Ceiling Fans', power: '300W', active: true, icon: '🌀' },
      { name: '6x Tube Lights', power: '240W', active: true, icon: '💡' },
    ],
    phantomKw: 0.0,
    hourlyCostInr: 0.0,
            cameraAngle: 'Rear Wall Perspective',
    fps: 30,
    res: '1080p HD',
  },
  {
    id: 'CAM-04',
    room: 'Mechanical CAD Annex',
    location: 'Mechanical Workshop Yard, Ground Floor',
    occupants: 0,
    occupancyStatus: 'EMPTY',
    emptyDurationMins: 19,
    appliances: [
      { name: '2x High-Capacity Exhaust Fans', power: '750W', active: true, icon: '💨' },
      { name: 'Overhead Bay Halogen Array', power: '1200W', active: true, icon: '💡' },
      { name: 'Central Air Blower Loop', power: '900W', active: true, icon: '⚙️' },
    ],
    phantomKw: 2.85,
    hourlyCostInr: 25.65,
            cameraAngle: 'High-Bay Beam Cam',
    fps: 30,
    res: '1080p HD',
  },
];

export function CctvSentinelPage() {
  const { isAdmin } = useAuth();
  const [baseFeeds, setFeeds] = useState(INITIAL_FEEDS);
  const [activeCameraId, setActiveCameraId] = useState('CAM-01');
  const [clock, setClock] = useState(new Date());
  const [tasks, setTasks] = useState(() => guardianTaskService.getTasks());
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspection, setInspection] = useState(null);
  const [inspectionError, setInspectionError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => guardianTaskService.subscribe(setTasks), []);

  // Newest Guardian task for a room (tasks are stored newest-first)
  const taskFor = (feedId, list = tasks) => list.find(t => t.targetId === feedId && t.category === 'ENERGY_CUTOFF');

  // A room is only "off" once a Guardian has switched it off by hand.
  const feeds = baseFeeds.map(f => {
    const t = taskFor(f.id);
    const switchedOff = t?.status === 'COMPLETED' && f.occupancyStatus === 'EMPTY';
    return {
      ...f,
      task: t,
      cutoffTriggered: switchedOff,
      guardianDispatched: !!t && t.status !== 'COMPLETED',
      appliances: switchedOff ? f.appliances.map(a => ({ ...a, active: false })) : f.appliances,
      phantomKw: switchedOff ? 0 : f.phantomKw,
      hourlyCostInr: switchedOff ? 0 : f.hourlyCostInr,
    };
  });

  const activeFeed = feeds.find(f => f.id === activeCameraId) || feeds[0];

  const totalWastedKw = feeds
    .filter(f => f.occupancyStatus === 'EMPTY' && !f.cutoffTriggered)
    .reduce((acc, f) => acc + f.phantomKw, 0);

  const totalHourlyCost = feeds
    .filter(f => f.occupancyStatus === 'EMPTY' && !f.cutoffTriggered)
    .reduce((acc, f) => acc + f.hourlyCostInr, 0);

  function dispatch(feed) {
    const task = guardianTaskService.createTask({
      title: `Switch off ${feed.appliances.filter(a => a.active).length} appliances in empty ${feed.room}`,
      targetId: feed.id,
      location: feed.location,
      category: 'ENERGY_CUTOFF',
      severity: 'CRITICAL',
      points: 40,
      co2Saved: `${(feed.phantomKw * 0.85).toFixed(1)} kg CO2e saved / hr`,
      detectedBy: `AI CCTV Sentinel (0 occupants for ${feed.emptyDurationMins} mins)`,
      appliances: feed.appliances.filter(a => a.active).map(a => a.name).join(', '),
    });
    triggerEcoCelebration({
      title: 'Guardian alarm sent',
      message: `Every Green Guardian's phone is ringing for ${feed.room}. The first to slide takes it.`,
      points: 0,
      badge: `Task #${task.id}`,
    });
  }

  async function inspectGeneratedClassroom() {
    setInspectionLoading(true);
    setInspectionError('');
    setInspection(null);
    try {
      const result = await inspectClassroomDemo();
      setInspection(result);
      const equipmentOn = result.lights_on || result.fans_on || result.projector_on;
      if (result.empty_room && equipmentOn) {
        const active = guardianTaskService.getTasks().find(t => t.targetId === 'CCTV-DEMO-CLASSROOM' && t.status !== 'COMPLETED');
        if (!active) guardianTaskService.createTask({
          title: 'DEMO: Check generated classroom and switch off equipment',
          targetId: 'CCTV-DEMO-CLASSROOM',
          location: 'Synthetic classroom image — demo only, not a real campus location',
          category: 'ENERGY_CUTOFF', severity: 'HIGH', points: 20,
          detectedBy: 'Groq vision analysis of a generated demo image',
          appliances: ['lights', 'fans', 'projector'].filter(k => result[`${k}_on`]).map(k => `${k} detected on`).join(', '),
          co2Saved: 'Potential energy saving; verify in person before action',
          instructions: 'This alarm comes from a generated demo image. Do not treat it as a real campus detection; physically verify the room before acting.',
          source: 'synthetic-demo-image',
        });
      }
    } catch (error) {
      setInspectionError(error.message || 'Could not inspect the demo image. Check that the local backend and Groq key are configured.');
    } finally {
      setInspectionLoading(false);
    }
  }

  // Demo control: a class ends and the room empties out with everything left on
  const endClass = (feedId) => {
    setFeeds(prev => prev.map(f => f.id === feedId ? {
      ...f, occupants: 0, occupancyStatus: 'EMPTY', emptyDurationMins: 15, emptiedAt: Date.now(),
      phantomKw: f.phantomKw || +(f.appliances.reduce((s, a) => s + parseFloat(a.power), 0) / 1000).toFixed(2),
      hourlyCostInr: f.hourlyCostInr || +(f.appliances.reduce((s, a) => s + parseFloat(a.power), 0) / 1000 * 9).toFixed(2),
    } : f));
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">Classroom Energy Sentinel</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
            <IconVideo className="w-6 h-6 text-emerald-400" />
            AI CCTV Occupancy Sentinel · Demo
          </h1>
          <p className="text-xs text-slate-400">
            Demo footage and simulated room readings show how the energy alert works. No live campus camera is connected; a Guardian verifies each room in person.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Phantom Waste</div>
            <div className="text-sm font-black text-amber-400 font-mono">{totalWastedKw.toFixed(2)} kW/hr</div>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Rate of Loss</div>
            <div className="text-sm font-black text-red-400 font-mono">₹{totalHourlyCost.toFixed(2)} / hr</div>
          </div>
        </div>
      </div>

      {/* Main CCTV Feed + Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Live CCTV Viewfinder Window */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  STOCK CCTV-STYLE DEMO • {activeFeed.id} ({activeFeed.room})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  DEMO · {clock.toLocaleTimeString('en-IN')} IST
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {activeFeed.fps} FPS • {activeFeed.res}
                </span>
              </div>
            </div>

            {/* Viewfinder Canvas / Camera Screen */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between p-4">
              <video
                key={activeFeed.id}
                className="absolute inset-0 h-full w-full object-cover opacity-75"
                src="/cctv/classroom-stock-demo.mp4"
                autoPlay muted loop playsInline preload="metadata"
                aria-label="Stock classroom footage used as a CCTV feed demonstration"
              />
              <div className="absolute bottom-12 left-4 z-10 rounded bg-black/80 px-2 py-1 text-[9px] font-mono text-amber-300">
                STOCK CLASSROOM DEMO FOOTAGE · NOT LIVE CAMPUS VIDEO
              </div>
              {/* Surveillance Overlay Data */}
              <div className="flex justify-between items-start pointer-events-none z-10">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-emerald-400 bg-black/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    CAM: {activeFeed.id} // {activeFeed.cameraAngle}
                  </div>
                  <div className="text-[10px] font-mono text-slate-300 bg-black/80 px-2 py-0.5 rounded">
                    LOC: {activeFeed.location}
                  </div>
                </div>

                <div className={`px-3 py-1 rounded text-xs font-mono font-black tracking-wider uppercase border ${
                  activeFeed.occupancyStatus === 'EMPTY'
                    ? 'bg-red-950/90 text-red-400 border-red-500/50'
                    : 'bg-emerald-950/90 text-emerald-400 border-emerald-500/50'
                }`}>
                  {activeFeed.occupancyStatus === 'EMPTY' ? (
                    <span>⚠️ 0 PERSONS DETECTED ({activeFeed.emptyDurationMins} MINS)</span>
                  ) : (
                    <span>✓ ACTIVE ({activeFeed.occupants} STUDENTS DETECTED)</span>
                  )}
                </div>
              </div>

              {/* Viewfinder Bounding Box Grid Simulation */}
              <div className="absolute inset-8 border border-dashed border-emerald-500/20 rounded-xl pointer-events-none flex items-center justify-center">
                {activeFeed.cutoffTriggered ? (
                  <div className="text-center p-6 bg-slate-950/90 rounded-2xl border border-emerald-500/40 space-y-2">
                    <span className="text-4xl">✋</span>
                    <h3 className="text-sm font-extrabold text-emerald-400">SWITCHED OFF BY HAND</h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Green Guardian {activeFeed.task?.claimedBy?.name || ''} checked the room in person and turned everything off at {activeFeed.task?.completedAt}.
                    </p>
                  </div>
                ) : activeFeed.occupancyStatus === 'EMPTY' ? (
                  <div className="text-center p-4 bg-red-950/60 rounded-2xl border border-red-500/40 backdrop-blur-sm space-y-2 max-w-md">
                    <div className="flex items-center justify-center gap-2 text-red-400 text-xs font-mono font-bold uppercase">
                      <IconAlertTriangle className="w-4 h-4 text-red-400" />
                      Continuous Phantom Waste Detected
                    </div>
                    <p className="text-xs text-slate-200">
                      Room unoccupied for <strong>{activeFeed.emptyDurationMins} minutes</strong> with active high-draw equipment running.
                    </p>
                    <div className="text-[11px] font-mono text-amber-300 bg-black/70 px-3 py-1 rounded-lg border border-amber-500/30">
                      ⚡ Consuming {activeFeed.phantomKw} kW/hr • ₹{activeFeed.hourlyCostInr.toFixed(2)} wasted each hour
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-black/70 rounded-xl border border-emerald-500/30">
                    <span className="text-xs font-mono text-emerald-300">
                      ✓ Class in session • Environmental lighting within optimal VTU lux parameters
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom camera bar */}
              <div className="flex justify-between items-end pointer-events-none z-10">
                <span className="text-[9px] font-mono text-slate-500 bg-black/80 px-2 py-0.5 rounded">
                    STOCK VIDEO · SIMULATED TELEMETRY
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-black/80 px-2 py-0.5 rounded">
                    DEMO FEED
                </span>
              </div>
            </div>

            {/* Quick Camera Selector Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {feeds.map(feed => (
                <button
                  key={feed.id}
                  onClick={() => setActiveCameraId(feed.id)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    activeCameraId === feed.id
                      ? 'bg-slate-800 border-emerald-500/60 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{feed.id}</span>
                    <span className={`w-2 h-2 rounded-full ${feed.occupancyStatus === 'EMPTY' && !feed.cutoffTriggered ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  </div>
                  <div className="text-xs font-bold text-white truncate mt-1">{feed.room}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {feed.cutoffTriggered ? '✋ Off by hand' : feed.guardianDispatched ? (feed.task?.status === 'CLAIMED' ? '🏃 Guardian en route' : '🔔 Ringing') : feed.occupancyStatus === 'EMPTY' ? `Empty (${feed.emptyDurationMins}m)` : `${feed.occupants} Persons`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <section className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div>
              <h2 className="text-sm font-black text-white">Generated empty classroom · vision demo</h2>
              <p className="text-[11px] text-amber-300 mt-1">Synthetic image used for testing only. It is not a live camera feed or a real campus alert.</p>
            </div>
            <img src="/cctv/classroom-empty-demo.jpg" alt="Generated demo image of an empty classroom with lights, fans and projector on" className="w-full max-h-[420px] object-contain bg-black rounded-xl border border-slate-800" />
            <button type="button" disabled={inspectionLoading} aria-busy={inspectionLoading} onClick={inspectGeneratedClassroom} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold">
              {inspectionLoading ? 'Inspecting image…' : 'Run vision inspection'}
            </button>
            {inspectionError && <p role="alert" className="text-xs text-red-300">{inspectionError}</p>}
            {inspection && <div className="rounded-xl bg-slate-950 p-3 text-xs text-slate-200 space-y-1">
              <p>Room empty: <b>{inspection.empty_room ? 'Yes' : 'No'}</b> · Confidence: <b>{Math.round((inspection.confidence || 0) * 100)}%</b></p>
              <p>Lights {inspection.lights_on ? 'on' : 'not detected on'} · Fans {inspection.fans_on ? 'on' : 'not detected on'} · Projector {inspection.projector_on ? 'on' : 'not detected on'}</p>
              <p className="text-slate-400">{inspection.evidence}</p>
              {inspection.empty_room && (inspection.lights_on || inspection.fans_on || inspection.projector_on) && <p className="text-amber-300">Guardian alarm sent for an in-person check. This is a synthetic demo result.</p>}
            </div>}
          </section>
        </div>

        {/* Right Column: Room Control & Green Guardian Task Dispatch */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Room Telemetry</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  activeFeed.occupancyStatus === 'EMPTY' ? 'bg-red-950 text-red-400 border border-red-500/40' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {activeFeed.occupancyStatus}
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-1">{activeFeed.room}</h2>
              <p className="text-xs text-slate-400">{activeFeed.location}</p>
            </div>

            {/* Running Equipment Status */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Active Room Appliances:
              </span>
              <div className="space-y-1.5">
                {activeFeed.appliances.map((app, idx) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{app.icon}</span>
                      <span className={app.active ? 'text-white font-medium' : 'text-slate-500 line-through'}>{app.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">{app.power}</span>
                      <span className={`w-2 h-2 rounded-full ${app.active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Environmental Impact Calculation */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Estimated Resource Drain</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Active Load:</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">{activeFeed.phantomKw} kW</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Wasted / Hour:</span>
                  <span className="text-amber-400 font-mono font-bold text-sm">₹{activeFeed.hourlyCostInr.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action panel — manual only */}
            {activeFeed.cutoffTriggered ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center space-y-1">
                <div className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                  <IconCheckCircle className="w-4 h-4 text-emerald-400" />
                  Switched off by {activeFeed.task?.claimedBy?.name || 'a Green Guardian'}
                </div>
                <div className="text-[11px] text-slate-400">+{activeFeed.task?.points} EcoCredits paid to the Guardian. Zero draw until the next lecture.</div>
              </div>
            ) : activeFeed.occupancyStatus === 'EMPTY' ? (
              <div className="space-y-2 pt-2">
                {activeFeed.task && activeFeed.task.status !== 'COMPLETED' ? (
                  <div className="p-3 rounded-xl border text-xs space-y-1" style={{ borderColor: activeFeed.task.status === 'CLAIMED' ? 'rgba(56,189,248,.35)' : 'rgba(251,191,36,.35)', background: activeFeed.task.status === 'CLAIMED' ? 'rgba(56,189,248,.08)' : 'rgba(251,191,36,.08)' }}>
                    <div className="font-extrabold flex items-center gap-1.5" style={{ color: activeFeed.task.status === 'CLAIMED' ? '#7dd3fc' : '#fcd34d' }}>
                      {activeFeed.task.status === 'CLAIMED' ? <Hand size={14} /> : <Radar size={14} />}
                      {activeFeed.task.status === 'CLAIMED' ? `${activeFeed.task.claimedBy?.name} accepted — on the way` : 'Alarm ringing on Guardian phones'}
                    </div>
                    <div className="text-slate-400">Task {activeFeed.task.id} · +{activeFeed.task.points} pts · AI detected it automatically</div>
                  </div>
                ) : (
                  <button
                    onClick={() => dispatch(activeFeed)}
                    className="w-full py-2.5 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/40"
                  >
                    <IconShield className="w-4 h-4" />
                    <span>Re-ring Green Guardians (+40 PTS)</span>
                  </button>
                )}
                <p className="text-[11px] text-slate-500 leading-relaxed flex gap-1.5">
                  <Power size={13} className="shrink-0 mt-0.5" />
                  Remote cut-off is disabled by policy: labs may be running experiments and cameras have blind spots. Power goes off only when a Guardian is in the room.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                  ✓ Class in session · students actively using the room.
                </div>
                {!isAdmin && (
                  <button onClick={() => endClass(activeFeed.id)} className="w-full py-2 text-[11px] font-bold rounded-xl border border-slate-700 text-slate-300 hover:border-slate-500 transition">
                    Demo: class ends and everyone leaves with the lights on
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
