import React, { useState, useRef, useEffect } from 'react';
import { 
  IconCamera, 
  IconCheckCircle, 
  IconAlertTriangle, 
  IconMapPin
} from '../components/Icons';
import { PRESET_SCAN_ITEMS, classifyPhoneCapture } from '../services/aiVisionService';
import { triggerEcoCelebration } from '../utils/ecoCelebration';
import { Link } from '../router/Router';
import { useAuth } from '../contexts/AuthContext';

export const AiScannerPage = () => {
  const { isOperator: isAdmin, getLiveUsers, allotVerifiedPoints } = useAuth();
  const allStudents = (getLiveUsers ? getLiveUsers() : []).filter(u => u.role === 'STUDENT');
  const [selectedStudentUsn, setSelectedStudentUsn] = useState(allStudents[0]?.usn || '1RN23IS005');
  const [customUsnInput, setCustomUsnInput] = useState('');
  const [awardError, setAwardError] = useState('');

  // The laptop does not need a camera; the native photo picker opens the phone camera.
  const [cameraState, setCameraState] = useState('prompt');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [pointsClaimed, setPointsClaimed] = useState(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState(null);
  const [phoneHost, setPhoneHost] = useState('');
  const [phoneHostError, setPhoneHostError] = useState('');
  const [copiedPhoneUrl, setCopiedPhoneUrl] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const phoneCaptureRef = useRef(null);

  useEffect(() => {
    const currentHost = window.location.hostname;
    const isLoopback = currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost === '0.0.0.0';
    if (!isLoopback) {
      setPhoneHost(currentHost);
      return;
    }

    fetch('http://127.0.0.1:8000/api/local-network')
      .then(response => {
        if (!response.ok) throw new Error('Local network address is unavailable.');
        return response.json();
      })
      .then(info => {
        if (info.lanIp) setPhoneHost(info.lanIp);
        else setPhoneHostError('Could not detect the laptop Wi-Fi address. Open the scanner using the laptop’s local IP, or check that the API is running.');
      })
      .catch(() => setPhoneHostError('Start the local API to create a phone link and QR code.'));
  }, []);

  const phoneCaptureUrl = phoneHost
    ? `http://${phoneHost}:${window.location.port || '5173'}/scanner/capture`
    : '';

  const compressCapture = (dataUrl) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    image.onerror = () => reject(new Error('Could not prepare this photo.'));
    image.src = dataUrl;
  });

  const handlePhoneCapture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPointsClaimed(false);
    setErrorMessage('');
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imageDataUrl = await compressCapture(String(reader.result || ''));
        setCapturedSnapshot(imageDataUrl);
        setScanResult(await classifyPhoneCapture(imageDataUrl));
      } catch (error) {
        setErrorMessage(error.message || 'Could not prepare or classify this photo. Check that the laptop backend is running.');
      } finally {
        setIsAnalyzing(false);
        event.target.value = '';
      }
    };
    reader.onerror = () => { setErrorMessage('Could not read this photo. Please try again.'); setIsAnalyzing(false); event.target.value = ''; };
    reader.readAsDataURL(file);
  };

  // Check initial browser permission status if supported
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' })
        .then(permissionStatus => {
          if (permissionStatus.state === 'denied') {
            setCameraState('denied');
          }
          permissionStatus.onchange = () => {
            if (permissionStatus.state === 'denied') setCameraState('denied');
            if (permissionStatus.state === 'granted') setCameraState('prompt');
          };
        })
        .catch(() => {
          // Ignore if permission query not supported
        });
    }

    return () => {
      // Clean up stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // KEY FIX: Attach stream to video element AFTER React mounts it
  // The video element is always in the DOM; this effect fires when cameraState changes to 'streaming'
  useEffect(() => {
    if (cameraState === 'streaming' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.warn('Video play failed:', err));
    }
    if (cameraState !== 'streaming' && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [cameraState]);

  // Camera access is handled by the device's native photo picker. This works on
  // phones over a campus LAN without requiring webcam permissions or HTTPS.
  const requestCameraPermission = async () => {
    setErrorMessage('');
    phoneCaptureRef.current?.click();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraState('prompt');
    setCapturedSnapshot(null);
  };

  // Capture frame from video and analyze
  const captureAndAnalyze = async () => {
    phoneCaptureRef.current?.click();
  };

  const handleSelectPreset = async (item) => {
    setIsAnalyzing(true);
    setPointsClaimed(false);
    setAwardError('');
    setCapturedSnapshot(null);
    await new Promise(r => setTimeout(r, 200));
    setScanResult({ ...item, confidence: 'Demo sample', isDemo: true });
    setIsAnalyzing(false);
  };

  const handleClaimPoints = () => {
    if (pointsClaimed) return;
    const pts = scanResult?.ecoCredits || 25;
    const targetUsn = customUsnInput.trim() ? customUsnInput.trim().toUpperCase() : selectedStudentUsn;
    const targetStudent = allStudents.find(s => s.usn === targetUsn);

    if (!allotVerifiedPoints?.(targetUsn, pts, `AI Verified: ${scanResult?.name || 'Recyclable'} (Lab 104)`)) {
      setAwardError(`No student account matches ${targetUsn || 'that USN'}. Choose a listed student or enter a valid USN.`);
      return;
    }
    setAwardError('');
    setPointsClaimed(true);

    triggerEcoCelebration({
      title: '✅ EcoCredits Allotted to Student!',
      message: `+${pts} EcoCredits officially awarded to ${targetStudent?.name || targetUsn} (${targetUsn}) for correctly sorting ${scanResult?.name || 'material'}!`,
      points: pts,
      badge: `Allotted to ${targetUsn}`
    });
  };

  // ── Access guard: Students cannot self-scan to prevent point fabrication ──
  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', padding: 36, background: 'rgba(7,15,10,0.92)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f87171', margin: '0 0 12px' }}>
          Restricted to Campus Staff & Lab Intake Desks
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          To maintain fairness and eliminate point abuse, students are not permitted to scan items and self-award EcoCredits.
          <br /><br />
          Please take your segregated recyclables, circuit boards, or lab components to <strong>ECE Lab 104</strong> or any designated <strong>Campus Green Intake Station</strong>. The lab coordinator will scan your item using this terminal and credit verified points directly to your student account!
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/handmedowns" className="btn-eco" style={{ padding: '10px 20px', textDecoration: 'none', fontSize: 13, borderRadius: 10 }}>
            🤝 Donate via Hand-Me-Downs
          </Link>
          <Link to="/" className="btn-ghost" style={{ padding: '10px 20px', textDecoration: 'none', fontSize: 13, borderRadius: 10 }}>
            🏠 Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden canvas for snapshot capture */}
      <canvas ref={canvasRef} className="hidden" />
      <input ref={phoneCaptureRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoneCapture} aria-label="Take a waste photo with your phone camera" />

      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Link to="/" className="hover:underline">Campus Hub</Link>
            <span>/</span>
            <span className="text-slate-400">AI Source Segregator</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            AI-Assisted Waste Material Classifier
          </h1>
          <p className="text-xs text-slate-400">
            Classifies materials at the point of disposal to keep recycling, compost and hazardous e-waste separate.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ⚡ Camera-Assisted Optical Classifier • Material Segregator
          </span>
        </div>
      </div>

      <section className="scanner-phone-connect glass" aria-labelledby="scanner-phone-title">
        <div className="scanner-phone-copy">
          <span className="scanner-phone-kicker">Use your phone camera</span>
          <h2 id="scanner-phone-title">Send a photo to this laptop</h2>
          <p>Keep both devices on the same Wi-Fi, scan the QR code, and take a photo. The laptop’s local vision service analyzes the image and returns its result to your phone.</p>
          {phoneCaptureUrl ? (
            <>
              <a className="scanner-phone-url" href={phoneCaptureUrl}>{phoneCaptureUrl}</a>
              <button type="button" className="scanner-copy-url" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(phoneCaptureUrl);
                  setCopiedPhoneUrl(true);
                  window.setTimeout(() => setCopiedPhoneUrl(false), 1800);
                } catch { setPhoneHostError('Copy was blocked by the browser. You can open the address shown above on the phone.'); }
              }}>{copiedPhoneUrl ? 'Address copied' : 'Copy phone address'}</button>
            </>
          ) : (
            <p className="scanner-phone-error" role="status">{phoneHostError || 'Detecting this laptop’s Wi-Fi address…'}</p>
          )}
          {phoneHostError && phoneCaptureUrl && <p className="scanner-phone-error" role="status">{phoneHostError}</p>}
        </div>
        {phoneCaptureUrl && (
          <img
            className="scanner-phone-qr"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(phoneCaptureUrl)}`}
            alt={`QR code that opens ${phoneCaptureUrl} on a phone`}
            loading="lazy"
          />
        )}
      </section>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Viewfinder & Permission Flow */}
        <div className="lg:col-span-7 bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconCamera className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-white">Phone Camera Photo Classifier</span>
            </div>
            {cameraState === 'streaming' && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  STREAM ACTIVE
                </span>
                <button
                  onClick={stopCamera}
                  className="text-xs bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-500/30 font-bold px-2.5 py-1 rounded-lg transition"
                >
                  Stop Camera
                </button>
              </div>
            )}
          </div>

          {/* Viewfinder Window */}
        <div className="relative min-h-[27rem] bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center p-3 sm:p-5">
            {/* STATE 1: PERMISSION PROMPT SCREEN */}
            {cameraState === 'prompt' && (
              <div className="max-w-md p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <IconCamera className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-white">Capture a photo to classify waste</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Choose a photo on this laptop or use the QR code above to capture one on your phone. Only a still image is sent to the local classifier.</p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    onClick={() => phoneCaptureRef.current?.click()}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                  >
                    <IconCamera className="w-4 h-4" />
                    Take Photo / Choose Image
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 italic">No continuous video is transmitted.</p>
              </div>
            )}

            {/* STATE 2: REQUESTING / LOADING */}
            {cameraState === 'requesting' && (
              <div className="text-center p-6 space-y-3">
                <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-bold text-emerald-300">Requesting Browser Camera Permission...</p>
                <p className="text-[11px] text-slate-500">Please click "Allow" in your browser prompt.</p>
              </div>
            )}

            {/* STATE 3: PERMISSION DENIED SCREEN */}
            {cameraState === 'denied' && (
              <div className="max-w-md p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                  <IconAlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-white">Camera Permission Denied</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {errorMessage || 'Browser camera access is blocked. To re-enable, click the camera or padlock icon in your browser URL bar and change Camera to "Allow".'}
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                    onClick={requestCameraPermission}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
                  >
                    Open Camera / Choose Photo
                  </button>
                </div>
                <p className="text-[11px] text-emerald-400 font-semibold pt-1">
                  💡 Don't worry! You can use the instant preset samples below to demonstrate full classification.
                </p>
              </div>
            )}

            {/* STATE 4: UNSUPPORTED */}
            {cameraState === 'unsupported' && (
              <div className="p-6 text-center space-y-2">
                <IconAlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Physical Camera Detected</h3>
                <p className="text-xs text-slate-400">{errorMessage || 'Your device does not have an active camera attached.'}</p>
              </div>
            )}

            {/* STATE 5: STREAMING LIVE - Video is ALWAYS in DOM (hidden when not streaming to keep ref valid) */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              onLoadedMetadata={() => {
                if (videoRef.current) videoRef.current.play().catch(() => {});
              }}
              className={`w-full h-full object-cover ${cameraState === 'streaming' ? 'block' : 'hidden'}`}
            />

            {cameraState === 'streaming' && (
              <>
                {/* Visual Viewfinder Target Frame */}
                <div className="absolute inset-8 border-2 border-dashed border-emerald-400/50 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-mono font-bold bg-black/60 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                      OPTICAL SCAN READY
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded">
                      HD VIEWFINDER
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-emerald-300 font-bold bg-black/70 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-500/30">
                      Center Waste Object Here
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[9px] font-mono text-emerald-400">EDGE CLASSIFIER</span>
                  </div>
                </div>

                {/* Shutter Capture Button */}
                <div className="absolute bottom-4 inset-x-0 flex justify-center">
                  <button
                    onClick={captureAndAnalyze}
                    disabled={isAnalyzing}
                    aria-busy={isAnalyzing}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-full shadow-xl shadow-emerald-500/40 transition hover:scale-105 active:scale-95"
                  >
                    <IconCamera className="w-4 h-4 text-slate-950" />
                    {isAnalyzing ? 'Analyzing Frame...' : 'Capture & Identify Material'}
                  </button>
                </div>
              </>
            )}

            {capturedSnapshot && cameraState !== 'streaming' && <img src={capturedSnapshot} alt="Captured waste item" className="absolute inset-0 h-full w-full object-contain" />}

            {capturedSnapshot && !isAnalyzing && (
              <button
                type="button"
                onClick={() => { setCapturedSnapshot(null); phoneCaptureRef.current?.click(); }}
                className="absolute bottom-3 right-3 z-20 rounded-lg border border-white/20 bg-slate-950/90 px-3 py-2 text-xs font-bold text-white shadow-lg"
              >
                Retake photo
              </button>
            )}

            {/* Analyzing Spinner Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-30">
                <div className="w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest animate-pulse">
                  Classifying Waste Material...
                </div>
                <p className="text-[11px] text-slate-400 font-mono">Matching visual profile with waste categories...</p>
              </div>
            )}
          </div>

          {/* Test Samples (Allows full demo even without camera or rubbish on hand) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Instant Preset Test Bench (Click to Simulate Classification):
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold font-mono">6 Categories</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_SCAN_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSelectPreset(item)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition ${
                    scanResult?.id === item.id 
                      ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-900/20' 
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-200 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{item.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Scan Output & Routing Instructions */}
        <div className="lg:col-span-5 space-y-4">
          {scanResult ? (
            <div className={`rounded-2xl p-6 border shadow-xl ${
              scanResult.isHazardous 
                ? 'bg-red-950/30 border-red-500/40' 
                : 'bg-slate-900/90 border-emerald-500/30'
            } space-y-5`}>
              {/* Category & Confidence */}
              <div className="flex items-center justify-between gap-3">
                {scanResult.isDemo && <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30">Preset simulation</span>}
                <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                  scanResult.isHazardous 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {scanResult.category}
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  Object score: <strong className="text-white text-sm">{scanResult.confidence}</strong>
                </span>
              </div>
              {!scanResult.isDemo && <p className="text-[10px] text-slate-400 -mt-3">Object detection score only; this model has not been validated for material-classification accuracy.</p>}
              {scanResult.isDemo && <p className="text-[10px] text-amber-700 -mt-3">Preset values are for UI demonstration only and are not model predictions.</p>}

              {/* Title & Description */}
              <div>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2.5">
                  <span className="text-2xl">{scanResult.emoji}</span>
                  {scanResult.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {scanResult.action}
                </p>
              </div>

              {/* Materials Detected */}
              {scanResult.materials && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Spectral Materials Detected:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResult.materials.map((m, i) => (
                      <span key={i} className="text-[10px] font-mono bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Designated Bin Routing Card */}
              <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                  <IconMapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Mandatory Campus Disposal Destination:
                </div>
                <div className="text-sm font-black text-emerald-400">
                  {scanResult.targetBin}
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  {scanResult.recyclingGuidance}
                </p>
              </div>

              {/* CO2 Abatement & Reward Metric */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Carbon Abatement</div>
                  <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">{scanResult.carbonSavedKg}</div>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">EcoCredits Bounty</div>
                  <div className="text-sm font-black text-amber-400 font-mono mt-0.5">+{scanResult.ecoCredits} PTS</div>
                </div>
              </div>

              {/* Autonomous Closed-Loop Resolution Box */}
              <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-emerald-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Autonomous Closed-Loop Resolution
                  </div>
                  <span className="text-[9px] font-mono text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    Auto-Assigned
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-medium">
                  {scanResult.isHazardous || scanResult.category.includes('E-Waste') ? (
                    <>
                      ⚡ <strong>Auto-Assigned:</strong> Specialized E-Waste Locker #4 (ECE Block). If tested intact, autonomously listed on <strong className="text-emerald-300">Pass-The-Torch Exchange</strong> for academic reuse and registered on the <strong className="text-cyan-300">SHA-256 Ledger</strong>.
                    </>
                  ) : scanResult.category.includes('Organic') ? (
                    <>
                      🌱 <strong>Auto-Diversion:</strong> Routed to Cauvery Anaerobic Digester (Bin B-107) to produce organic fertilizer for <strong className="text-emerald-300">RNSIT Campus Flora</strong>.
                    </>
                  ) : (
                    <>
                      ♻️ <strong>Auto-Triage:</strong> Routed to clean shredding stream. Verification bounty spawned in <strong className="text-emerald-300">Campus Eco-Bounties</strong>.
                    </>
                  )}
                </p>

                {/* Inter-dependent Action Deep Links */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {scanResult.isHazardous || scanResult.category.includes('E-Waste') ? (
                    <>
                      <Link to="/ewaste" className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition">
                        🔐 Locker in /ewaste
                      </Link>
                      <Link to="/exchange" className="text-[10px] bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition">
                        🤝 Listing in /exchange
                      </Link>
                      <Link to="/traceability" className="text-[10px] bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition">
                        🔗 Inspect Ledger Hash
                      </Link>
                    </>
                  ) : scanResult.category.includes('Organic') ? (
                    <>
                      <Link to="/bins" className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition">
                        🗑️ Compactor B-107
                      </Link>
                      <Link to="/trees" className="text-[10px] bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition">
                        🌳 Flora at /trees
                      </Link>
                    </>
                  ) : (
                    <Link to="/cleaner-ops" className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition">
                      🗺️ Ground Ops Dispatch Path
                    </Link>
                  )}
                </div>
              </div>

              {/* Student Allotment Selector for Admin */}
              <div className="bg-purple-950/30 p-4 rounded-xl border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🎓</span> Select Student to Award Points
                  </span>
                  <span className="text-[9px] font-mono text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/30">
                    Verified Intake Desk
                  </span>
                </div>

                <div className="space-y-2">
                  <select
                    value={selectedStudentUsn}
                    onChange={(e) => {
                      setSelectedStudentUsn(e.target.value);
                      setCustomUsnInput('');
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    {allStudents.map(stu => (
                      <option key={stu.usn} value={stu.usn}>
                        {stu.usn} — {stu.name} ({stu.branch || 'Student'}, Yr {stu.year}) • {stu.credits} pts
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Or enter any custom USN (e.g. 1RN23IS005)..."
                    value={customUsnInput}
                    onChange={(e) => { setCustomUsnInput(e.target.value.toUpperCase()); setAwardError(''); }}
                    className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Confirmation Allotment Button */}
              <button
                onClick={handleClaimPoints}
                disabled={pointsClaimed || scanResult.isDemo}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <IconCheckCircle className="w-4 h-4" />
                {scanResult.isDemo ? 'Preset demo — points cannot be awarded' : pointsClaimed ? 'Points Allotted for This Scan' : `Allot +${scanResult.ecoCredits} Verified PTS to ${customUsnInput.trim() ? customUsnInput.trim().toUpperCase() : selectedStudentUsn}`}
              </button>
              {awardError && <p role="alert" className="text-xs font-bold text-rose-300 mt-2">{awardError}</p>}
            </div>
          ) : (
            <div className="scanner-empty-result rounded-2xl p-6 border">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700">No live result yet</div>
              <h2 className="text-lg font-extrabold text-slate-900 mt-2">Take a photo to classify an item</h2>
              <p className="text-sm text-slate-600 mt-2">Results appear here after a laptop capture. A photo taken from the QR page is analyzed by the same laptop service and shown on the phone.</p>
              <p className="text-xs text-slate-500 mt-3">The preset test bench below is simulated and does not measure classifier accuracy.</p>
            </div>
          )}

          {/* Quick Jump to Other Endpoints */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Have electronic circuit boards or batteries?</span>
            <Link to="/ewaste" className="text-emerald-400 font-bold hover:underline flex items-center gap-1">
              Go to E-Waste Hub →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
