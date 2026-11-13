import React, { useState, useRef } from 'react';
import { 
  IconCamera, 
  IconCpu, 
  IconRecycle, 
  IconUtensils, 
  IconLeaf, 
  IconAward, 
  IconCheckCircle,
  IconMapPin,
  IconZap,
  IconDownload
} from './Icons';
import { PRESET_SCAN_ITEMS, classifyImageHeuristic } from '../services/aiVisionService';
import { triggerConfetti } from '../utils/confetti';

export const StudentPortal = ({ 
  userCredits, 
  setUserCredits, 
  salvagedItems, 
  setSalvagedItems,
  exchangeItems,
  setExchangeItems,
  trees,
  setTrees,
  surplusAlerts,
  setSurplusAlerts,
}) => {
  const [activeTab, setActiveTab] = useState('ai-scanner');
  
  // AI Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(PRESET_SCAN_ITEMS[0]);
  const videoRef = useRef(null);

  // E-Waste Deposit Modal / Form state
  const [newEwaste, setNewEwaste] = useState({ name: '', category: 'Batteries / Hazardous', specs: '', locker: 'Locker #4 (ECE Block)' });
  const [isEwasteSubmitted, setIsEwasteSubmitted] = useState(false);

  // New Exchange item state
  const [newExchange, setNewExchange] = useState({ title: '', branch: 'CSE / ISE', category: 'Textbooks', condition: 'Good' });

  // Handle Live Camera Toggle
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera access denied or unavailable. You can still test with the preset chips below!");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const runAiScan = async (presetItem = null) => {
    setIsScanning(true);
    await new Promise(r => setTimeout(r, 600));
    const result = presetItem || (await classifyImageHeuristic());
    setScanResult(result);
    setIsScanning(false);
  };

  const handleClaimPoints = () => {
    setUserCredits(prev => prev + (scanResult?.ecoCredits || 25));
    triggerConfetti();
    alert(`🎉 Success! +${scanResult?.ecoCredits || 25} EcoCredits deposited to your RNSIT Green Wallet!`);
  };

  const handleDepositEwaste = (e) => {
    e.preventDefault();
    if (!newEwaste.name) return;
    const newItem = {
      id: `EW-${Math.floor(100 + Math.random() * 900)}`,
      name: newEwaste.name,
      category: newEwaste.category,
      condition: "Student Locker Deposit",
      sourceDept: "Student Community Drop",
      salvagedBy: "Verified Student",
      status: "Available for Student Checkout",
      creditsCost: 0,
      specs: newEwaste.specs || "Safe inspected casing",
      claimCount: 0
    };
    setSalvagedItems([newItem, ...salvagedItems]);
    setUserCredits(prev => prev + 50);
    setIsEwasteSubmitted(true);
    triggerConfetti();
    setTimeout(() => {
      setIsEwasteSubmitted(false);
      setNewEwaste({ name: '', category: 'Batteries / Hazardous', specs: '', locker: 'Locker #4 (ECE Block)' });
    }, 2000);
  };

  const handleClaimSalvage = (itemId) => {
    setSalvagedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, status: "Checked Out for Student Project", claimCount: item.claimCount + 1 };
      }
      return item;
    }));
    triggerConfetti();
    alert("🎉 Component checked out successfully! Pick it up at ECE Dept IoT Hub using your Student ID.");
  };

  const handleWaterTree = (treeId) => {
    setTrees(prev => prev.map(t => {
      if (t.id === treeId) {
        return { ...t, lastWatered: "Just now", waterDueInHours: 24, health: "Flourishing" };
      }
      return t;
    }));
    setUserCredits(prev => prev + 30);
    triggerConfetti();
  };

  return (
    <div className="space-y-6">
      {/* Student Sub-Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-slate-800">
        {[
          { id: 'ai-scanner', label: 'AI Smart Segregator', icon: IconCamera, badge: 'Live AI' },
          { id: 'ewaste-hub', label: 'E-Waste & Salvage', icon: IconCpu, badge: 'Crucial' },
          { id: 'exchange', label: 'Pass-The-Torch Store', icon: IconRecycle },
          { id: 'cafeteria', label: 'Food & Zero-Waste Mess', icon: IconUtensils },
          { id: 'greenery', label: 'Adopt-A-Tree Map', icon: IconLeaf },
          { id: 'wallet', label: 'EcoCredits & Ranks', icon: IconAward }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-1 ring-emerald-400' 
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                  isActive ? 'bg-black/30 text-emerald-200' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: AI CAMERA VISION SEGREGATOR */}
      {activeTab === 'ai-scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Camera / Presets */}
          <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconCamera className="w-5 h-5 text-emerald-400" />
                  AI Computer Vision Source Segregator
                </h3>
                <p className="text-xs text-slate-400">Point phone or select item to get instant bin routing & avoid wrong disposal.</p>
              </div>
              <div className="flex gap-2">
                {!isCameraActive ? (
                  <button 
                    onClick={startCamera}
                    className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    <IconCamera className="w-3.5 h-3.5" /> Start Webcam
                  </button>
                ) : (
                  <button 
                    onClick={stopCamera}
                    className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                  >
                    Stop Camera
                  </button>
                )}
              </div>
            </div>

            {/* Video Viewport / Viewfinder */}
            <div className="relative aspect-video bg-black/80 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {isCameraActive ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <div className="text-4xl">{scanResult ? scanResult.emoji : '📷'}</div>
                  <p className="text-sm text-slate-300 font-semibold">Webcam Viewfinder Ready</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Click "Start Webcam" or click any preset sample below to simulate instant real-time AI classification.
                  </p>
                </div>
              )}

              {/* Scanning Overlay Animation */}
              {isScanning && (
                <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] flex flex-col items-center justify-center">
                  <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-xs font-bold tracking-widest text-emerald-300 uppercase animate-pulse">
                    Analyzing Material Spectra & Hazard Index...
                  </span>
                </div>
              )}

              {/* Overlay target frame */}
              <div className="absolute inset-8 border-2 border-dashed border-emerald-500/40 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-[10px] text-emerald-400/60 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">
                  Target Disposal Item
                </span>
              </div>
            </div>

            {/* Quick Demo Test Samples (So judges can click even without physical waste) */}
            <div>
              <div className="text-xs font-bold text-slate-400 mb-2 flex items-center justify-between">
                <span>Quick Hackathon Test Samples (Instant Simulation):</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Click to classify</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_SCAN_ITEMS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => runAiScan(item)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition hover:border-emerald-500/50"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-200 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{item.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Scan Output & Routing Instructions */}
          <div className="lg:col-span-5 space-y-4">
            {scanResult && (
              <div className={`rounded-2xl p-5 border ${
                scanResult.isHazardous 
                  ? 'bg-red-950/30 border-red-500/40' 
                  : 'bg-slate-900 border-emerald-500/40'
              } space-y-4`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${
                    scanResult.isHazardous ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {scanResult.category}
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    AI Confidence: <strong className="text-white">{scanResult.confidence}</strong>
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <span>{scanResult.emoji}</span>
                    {scanResult.name}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">{scanResult.action}</p>
                </div>

                {/* Target Bin Card */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Correct Campus Disposal Route:
                  </div>
                  <div className="flex items-center gap-2 text-sm font-black text-emerald-400">
                    <IconMapPin className="w-4 h-4 text-emerald-400" />
                    {scanResult.targetBin}
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    {scanResult.recyclingGuidance}
                  </p>
                </div>

                {/* Carbon & Reward Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">CO2 Impact Prevented</div>
                    <div className="text-sm font-extrabold text-emerald-400 font-mono">{scanResult.carbonSavedKg}</div>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400">Earnable EcoCredits</div>
                    <div className="text-sm font-extrabold text-amber-400 font-mono">+{scanResult.ecoCredits} PTS</div>
                  </div>
                </div>

                <button
                  onClick={handleClaimPoints}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                >
                  <IconCheckCircle className="w-5 h-5" />
                  Confirm Proper Disposal & Claim +{scanResult.ecoCredits} PTS
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* TAB 2: E-WASTE & LAB COMPONENT SALVAGE HUB */}
      {activeTab === 'ewaste-hub' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-emerald-950/40 p-5 rounded-2xl border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <IconCpu className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-black text-white">Campus E-Waste Salvage & Upcycling Loop</h3>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl mt-1">
                Engineering colleges generate tons of electronic waste from lab project carcasses, discarded chargers, and lithium cells. 
                Our platform catalogs functional components for free student reuse and ensures hazardous items are handed to certified RoHS recyclers.
              </p>
            </div>
            <button
              onClick={() => {
                const formEl = document.getElementById('depositEwasteSection');
                formEl?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 whitespace-nowrap"
            >
              + Deposit E-Waste at Smart Locker
            </button>
          </div>

          {/* Salvaged Component Marketplace */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Available Salvaged Components (Free Student Checkout for Projects)
              </h4>
              <span className="text-xs text-slate-400">{salvagedItems.length} components salvaged this semester</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salvagedItems.map(item => (
                <div key={item.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold bg-slate-800 text-blue-400 px-2 py-0.5 rounded font-mono">
                        {item.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.status.includes('Available') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <h5 className="font-extrabold text-white text-sm">{item.name}</h5>
                    <div className="text-xs text-slate-400 font-mono bg-slate-950 p-2 rounded-lg">
                      {item.specs}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      <div><strong className="text-slate-300">Source:</strong> {item.sourceDept}</div>
                      <div><strong className="text-slate-300">Condition:</strong> {item.condition}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-400">₹0 Free Checkout</span>
                    {item.status.includes('Available') ? (
                      <button
                        onClick={() => handleClaimSalvage(item.id)}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        Claim for Project
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">Claimed by Student</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deposit E-Waste Section */}
          <div id="depositEwasteSection" className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-1">Deposit Broken Gadget or Component at Campus E-Locker</h4>
            <p className="text-xs text-slate-400 mb-4">Earn 50 EcoCredits immediately upon placing item inside locker and locking door.</p>

            {isEwasteSubmitted ? (
              <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-xl text-center space-y-2">
                <IconCheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-sm font-bold text-white">Locker Door Unlocked! Pin: #4829</div>
                <div className="text-xs text-emerald-300">+50 EcoCredits credited to your wallet. Thank you for keeping RNSIT green!</div>
              </div>
            ) : (
              <form onSubmit={handleDepositEwaste} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Item Name (e.g. Broken Laptop Charger, PCB)"
                  value={newEwaste.name}
                  onChange={e => setNewEwaste({ ...newEwaste, name: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
                <select
                  value={newEwaste.category}
                  onChange={e => setNewEwaste({ ...newEwaste, category: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="Batteries / Hazardous">Batteries / Hazardous</option>
                  <option value="Development Boards">Development Boards</option>
                  <option value="Peripherals & Cables">Peripherals & Cables</option>
                  <option value="Display & Panels">Display & Panels</option>
                </select>
                <select
                  value={newEwaste.locker}
                  onChange={e => setNewEwaste({ ...newEwaste, locker: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="Locker #1 (Admin Foyer)">Locker #1 (Admin Foyer)</option>
                  <option value="Locker #4 (ECE Block)">Locker #4 (ECE Block)</option>
                  <option value="Locker #7 (CSE 1st Floor)">Locker #7 (CSE 1st Floor)</option>
                  <option value="Locker #9 (Library Entrance)">Locker #9 (Library Entrance)</option>
                </select>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition shadow-md shadow-emerald-600/30"
                >
                  Generate Locker Pin & Deposit
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PASS-THE-TORCH ACADEMIC SECONDHAND STORE */}
      {activeTab === 'exchange' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconRecycle className="w-5 h-5 text-emerald-400" />
                "Pass-The-Torch" Secondhand Academic Exchange
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Senior students pass down mini drafters, engineering drawing boards, reference textbooks, and lab coats to incoming juniors instead of discarding them.
              </p>
            </div>
            <button
              onClick={() => {
                const title = prompt("Enter item you want to pass down (e.g. 1st Year Chemistry Cycle Textbooks):");
                if (title) {
                  setExchangeItems([
                    {
                      id: `PT-${Math.floor(100 + Math.random() * 900)}`,
                      title,
                      branch: "All Branches",
                      donor: "Current User (Student)",
                      condition: "Good Condition",
                      status: "Available",
                      category: "Academic Essentials"
                    },
                    ...exchangeItems
                  ]);
                  setUserCredits(prev => prev + 35);
                  triggerConfetti();
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/30 whitespace-nowrap"
            >
              + Pass Down An Item (+35 PTS)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {exchangeItems.map(item => (
              <div key={item.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                      {item.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{item.title}</h4>
                  <div className="text-[11px] text-slate-400">
                    <div><strong>For:</strong> {item.branch}</div>
                    <div><strong>Condition:</strong> {item.condition}</div>
                    <div><strong>Shared By:</strong> {item.donor}</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      alert(`Request sent to ${item.donor}! Check your campus email for pickup location.`);
                    }}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition"
                  >
                    Request Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SMART CAFETERIA & ZERO-WASTE MESS */}
      {activeTab === 'cafeteria' && (
        <div className="space-y-6">
          {/* Active Surplus Food Alerts */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <IconUtensils className="w-5 h-5 text-amber-400" />
              Live Campus Surplus Food Redistribution Broadcasts
            </h3>
            <p className="text-xs text-slate-400">
              When college events or mess halls have unserved safe food, broadcasts alert campus support staff and late laboratory groups within 30 minutes to ensure Zero Food Waste.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {surplusAlerts.map(alert => (
                <div key={alert.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      {alert.event}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{alert.postedAt}</span>
                  </div>
                  <div className="text-sm font-bold text-white">{alert.items}</div>
                  <div className="text-xs text-slate-400">
                    <div>📍 <strong>Pickup Spot:</strong> {alert.location}</div>
                    <div>⏰ <strong>Safe Window:</strong> {alert.bestBefore}</div>
                    <div>🎯 <strong>Audience:</strong> {alert.target}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-emerald-400 font-bold">{alert.claimedPct}% Claimed</span>
                    <button
                      onClick={() => {
                        setSurplusAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, claimedPct: 100, status: "COMPLETED" } : a));
                        triggerConfetti();
                      }}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                    >
                      Reserve Portion (Free)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Zero Plate Waste Challenge */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Daily Canteen Challenge
              </span>
              <h4 className="text-lg font-black text-white">"Clean Plate Club" Streak</h4>
              <p className="text-xs text-slate-300">
                Show an empty, scraped meal plate at the canteen return counter to earn 15 EcoCredits daily. Diverted organic scraps are weighed and routed to the campus anaerobic composter.
              </p>
              <button
                onClick={() => {
                  setUserCredits(prev => prev + 15);
                  triggerConfetti();
                  alert("🎉 Streak verified! +15 EcoCredits added. You kept 0.35kg food out of landfill today.");
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
              >
                <IconCheckCircle className="w-4 h-4" />
                Log Finished Meal (Zero Food Waste)
              </button>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300">RNSIT Campus Composter Pipeline Today:</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">148.5 KG</div>
              <div className="text-xs text-slate-400">Total organic waste diverted into garden fertilizer this week.</div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-emerald-500 h-full w-4/5 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ADOPT-A-TREE & CAMPUS FLORA */}
      {activeTab === 'greenery' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconLeaf className="w-5 h-5 text-emerald-400" />
                RNSIT Campus Biodiversity & Tree Adoption Registry
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Every tree on campus is geo-tagged. Student groups or faculty adopt trees, log maintenance, and track CO2 sequestration for institutional green audit points.
              </p>
            </div>
            <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              42 Campus Trees Tagged
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trees.map(tree => (
              <div key={tree.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <img className="tree-leaf-art" src="/plants/tree-leaf.png" alt="" />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      tree.health === 'Flourishing' || tree.health === 'Excellent' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {tree.health}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-white text-sm">{tree.species}</h4>
                    <p className="text-[11px] text-slate-400">📍 {tree.location}</p>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                    <div><span className="text-slate-400">Adopted by:</span> <strong className="text-slate-200">{tree.adoptedBy}</strong></div>
                    <div><span className="text-slate-400">CO2 Sequestered:</span> <strong className="text-emerald-400 font-mono">{tree.co2AbsorbedPerYear}</strong></div>
                    <div><span className="text-slate-400">Last Watered:</span> <strong className="text-slate-300">{tree.lastWatered}</strong></div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleWaterTree(tree.id)}
                    className="w-full py-2 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <IconLeaf className="w-3.5 h-3.5" />
                    Log Watering (+30 PTS)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ECOCREDITS WALLET & LEADERBOARD */}
      {activeTab === 'wallet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Rewards Store */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <IconAward className="w-5 h-5 text-amber-400" />
                Redeem EcoCredits for Real Campus Perks
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Your current balance: <strong className="text-emerald-400 font-mono text-sm">{userCredits} PTS</strong>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { title: "Canteen ₹50 Snack Voucher", cost: 150, emoji: "☕" },
                  { title: "Library Late-Book Fine Waiver", cost: 100, emoji: "📚" },
                  { title: "Principal Signed Green Certificate", cost: 400, emoji: "🎖️" },
                  { title: "Campus High-Speed Wi-Fi Boost", cost: 250, emoji: "⚡" },
                  { title: "RNSIT Bamboo Coffee Mug", cost: 500, emoji: "🌱" }
                ].map((reward, i) => (
                  <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{reward.emoji}</span>
                      <div>
                        <div className="text-xs font-bold text-white">{reward.title}</div>
                        <div className="text-[11px] text-amber-400 font-mono font-bold">{reward.cost} PTS</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (userCredits >= reward.cost) {
                          setUserCredits(prev => prev - reward.cost);
                          triggerConfetti();
                          alert(`🎉 Redeemed "${reward.title}"! Voucher code sent to your student portal.`);
                        } else {
                          alert(`Not enough points! You need ${reward.cost - userCredits} more EcoCredits.`);
                        }
                      }}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Redeem
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Department Leaderboard */}
          <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <IconZap className="w-5 h-5 text-emerald-400" />
                Inter-Department Green Cup Leaderboard
              </h3>
              <p className="text-xs text-slate-400">Monthly RNSIT Sustainability Standing</p>
            </div>

            <div className="space-y-2">
              {[
                { rank: "1st", dept: "Computer Science & Engg", pts: "14,250", badge: "🏆" },
                { rank: "2nd", dept: "Electronics & Communication", pts: "12,890", badge: "🥈" },
                { rank: "3rd", dept: "Information Science & Engg", pts: "11,400", badge: "🥉" },
                { rank: "4th", dept: "Mechanical Engineering", pts: "9,850", badge: "⚙️" },
                { rank: "5th", dept: "Civil Engineering", pts: "8,900", badge: "🏗️" }
              ].map((d, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-slate-400 font-mono w-6">{d.rank}</span>
                    <span className="text-lg">{d.badge}</span>
                    <span className="text-xs font-bold text-white">{d.dept}</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-400 font-mono">{d.pts} PTS</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
