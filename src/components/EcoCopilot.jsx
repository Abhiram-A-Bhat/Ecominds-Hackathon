import React, { useState, useRef, useEffect } from 'react';
import { IconZap, IconCpu, IconAlertTriangle, IconCheckCircle, IconUtensils } from './Icons';
import { queryHermesAgent, transcribeVoiceAudio } from '../services/hermesService';
import { useAuth } from '../contexts/AuthContext';

export const EcoCopilot = () => {
  const { currentUser, isOperator: isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [agentMode, setAgentMode] = useState('hermes'); // 'hermes' | 'groq'
  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      text: isAdmin
        ? "👋 Hi! I can explain any Ecominds feature available to admins, how to use it, and ways to make the RNSIT campus greener. I explain workflows, but I don't claim to dispatch or change anything for you."
        : `👋 Hi ${currentUser?.name ? currentUser.name.split(' ')[0] : 'there'}! Ask me how to use Ecominds features available to you, understand points and rewards, or make our campus greener. I only answer Ecominds and campus sustainability questions.`,
      timestamp: 'Just now',
      agent: isAdmin ? 'Hermes Operations Agent' : 'Ecominds Assistant'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [voiceError, setVoiceError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0); // 0 - 100 live volume level
  const [voiceMode, setVoiceMode] = useState('whisper'); // 'whisper' | 'webspeech'
  const [selectedVoice, setSelectedVoice] = useState('en-US-JennyNeural');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const currentAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const hasSoundRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Pre-load speech synthesis voices on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      cleanupAudioContext();
    };
  }, []);

  const cleanupAudioContext = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // Stop recording and cleanup helper
  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        // Flush any buffered frames first
        if (typeof mediaRecorderRef.current.requestData === 'function') {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("MediaRecorder stop error:", e);
      }
    }
    setIsListening(false);
  };

  // Start MediaRecorder + Groq Whisper
  const startWhisperRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setVoiceError("Microphone access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true 
        } 
      });
      streamRef.current = stream;
      audioChunksRef.current = [];
      hasSoundRef.current = false;

      // Setup Live Audio Meter
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateMeter = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((avg / 128) * 100));
            setAudioLevel(normalized);

            if (normalized > 3) {
              hasSoundRef.current = true;
            }
            animFrameRef.current = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        }
      } catch (audioCtxErr) {
        console.warn("Audio meter setup notice:", audioCtxErr);
      }

      // Detect optimal supported audio format
      const mimeTypes = [
        'audio/webm;codecs=opus', 
        'audio/webm', 
        'audio/ogg;codecs=opus', 
        'audio/mp4',
        ''
      ];
      let selectedMime = mimeTypes.find(type => type === '' || MediaRecorder.isTypeSupported(type)) || '';
      const options = selectedMime ? { mimeType: selectedMime } : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        cleanupAudioContext();

        // Release mic hardware tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMime || 'audio/webm' });
        console.log(`>>> Captured audio blob: ${audioBlob.size} bytes (${audioBlob.type})`);

        if (audioBlob.size < 100) {
          setVoiceError("Audio snippet was too short. Please speak for at least 1-2 seconds.");
          return;
        }

        setIsTranscribing(true);
        try {
          const res = await transcribeVoiceAudio(audioBlob);
          if (res.success && res.text) {
            setInput(res.text);
            handleSend(res.text);
          } else if (res.error) {
            setVoiceError(res.error);
          } else {
            if (!hasSoundRef.current) {
              setVoiceError("Microphone input signal was silent (0% volume). Check if mic is unmuted or selected properly.");
            } else {
              setVoiceError("No clear speech recognized. Please speak closer to the mic.");
            }
          }
        } catch (err) {
          setVoiceError("Groq Whisper transcription failed. Check backend connection.");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start(200); // 200ms time slice
      setIsListening(true);
    } catch (micErr) {
      console.warn("Microphone access error:", micErr);
      setVoiceError("Microphone permission denied. Please allow microphone access in your browser settings.");
      setIsListening(false);
    }
  };

  // Browser Web Speech API fallback
  const startWebSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Browser Web Speech API not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        setIsListening(false);
        setVoiceError(`Voice error (${e.error || 'unknown'}). Check microphone.`);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      setVoiceError("Failed to initialize browser speech recognition.");
    }
  };

  const toggleListening = () => {
    setVoiceError(null);
    if (isListening) {
      stopAudioRecording();
    } else {
      if (voiceMode === 'whisper') {
        startWhisperRecording();
      } else {
        startWebSpeech();
      }
    }
  };

  // Stop any active audio and speech synthesis
  const stopAllSpeech = () => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setIsPlayingAudio(false);
  };

  // Ultra-Realistic Human Speech System (Azure Neural Voice streaming with Natural fallback)
  const speakText = async (text, overrideVoice = null) => {
    if (!isVoiceEnabled) return;
    stopAllSpeech();

    const cleanText = text
      .replace(/[*#_`>\[\]\(\)]/g, ' ')
      .replace(/\b(?:https?|ftp):\/\/\S+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const voiceToUse = overrideVoice || selectedVoice;

    // 1. Studio-Grade Azure Neural TTS streaming via Edge-TTS
    try {
      const audioUrl = `/api/voice/tts?text=${encodeURIComponent(cleanText.slice(0, 900))}&voice=${voiceToUse}`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onplay = () => setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        console.warn("Neural audio error, falling back to natural browser speech");
        speakBrowserText(cleanText);
      };

      await audio.play();
      return;
    } catch (err) {
      console.warn("Neural speech stream notice:", err);
    }

    // 2. High-Quality Browser Speech Fallback (strictly excludes robotic voices)
    speakBrowserText(cleanText);
  };

  const speakBrowserText = (cleanText) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      // STRICT FILTER: Pick modern natural voices and reject robotic legacy voices
      const naturalVoice = voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Aria')) &&
        !v.name.includes('Desktop') && !v.name.includes('David') && !v.name.includes('Mark') && !v.name.includes('Zira')
      ) || voices.find(v => v.lang.startsWith('en') && !v.name.includes('Desktop') && !v.name.includes('David') && !v.name.includes('Mark'));

      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      activeUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Browser SpeechSynthesis error:", err);
      setIsPlayingAudio(false);
    }
  };

  const testVoiceSample = (voiceId) => {
    const samples = {
      'en-US-JennyNeural': "Hello! I am Jenny, your Hermes Autonomous Agent voice. Ready to guide zero-waste operations across campus!",
      'en-US-GuyNeural': "Greetings. I'm Guy, monitoring campus IoT energy grids and e-waste recycling.",
      'en-IN-NeerjaNeural': "Namaskara! I am Neerja, autonomous sustainability copilot for RNSIT campus.",
      'en-IN-PrabhatNeural': "Hello team! Prabhat here, orchestrating ground ops and zero-waste logistics.",
      'en-US-AriaNeural': "Hi there! Aria here, ready to assist with real-time campus environmental actions!"
    };
    const sampleText = samples[voiceId] || "Hello! Ready to manage campus sustainability.";
    speakText(sampleText, voiceId);
  };

  const handleSend = async (messageText = null) => {
    const query = messageText || input;
    if (!query.trim() || isLoading) return;

    const userMsg = { role: 'user', text: query, timestamp: 'Just now' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setVoiceError(null);

    try {
      if (agentMode === 'hermes') {
        const data = await queryHermesAgent(query, {
          role: currentUser?.role,
          current_page: window.location.pathname,
          history: messages.slice(-10).map(({ role, text }) => ({ role, content: text })),
        });

        const botMsg = {
          role: 'assistant',
          text: data.reply,
          timestamp: 'Just now',
          agent: data.agent || 'Hermes Agent v0.22.1',
          isHermes: true,
        };
        setMessages(prev => [...prev, botMsg]);
        speakText(data.reply);
      } else {
        const res = await fetch("/api/copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: query,
            user_context: {
              name: currentUser?.name,
              role: currentUser?.role,
              credits: currentUser?.credits,
              current_page: window.location.pathname,
              history: messages.slice(-10).map(({ role, text }) => ({ role, content: text })),
            },
          }),
          signal: AbortSignal.timeout(12000),
        });

        if (res.ok) {
          const data = await res.json();
          const botMsg = { 
            role: 'assistant', 
            text: data.reply, 
            timestamp: 'Just now',
            action: data.action,
            agent: 'Groq 120B Copilot'
          };
          setMessages(prev => [...prev, botMsg]);
          speakText(data.reply);

        } else {
          throw new Error("Server error");
        }
      }
    } catch (err) {
      // Local graceful fallback
      const fallbackMsg = {
        role: 'assistant',
        text: "I can explain Ecominds features and how to use them, or suggest practical ways to make the campus greener. The assistant service is temporarily unavailable; please try again shortly.",
        timestamp: 'Just now',
        agent: 'Ecominds Engine'
      };
      setMessages(prev => [...prev, fallbackMsg]);
      speakText(fallbackMsg.text);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="fixed bottom-6 right-6 z-50 dock-br">
      {/* Floating Pill Trigger Button */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-3 rounded-full shadow-2xl border border-emerald-400/40 transition hover:scale-105 active:scale-95 group"
        >
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-white block animate-ping absolute inset-0 opacity-75"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-white block"></span>
          </div>
                  <span>{isAdmin ? 'Hermes Operations Copilot' : 'Ecominds Assistant'}</span>
          <span className="text-[9px] bg-black/40 text-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">
            {isAdmin ? 'ADMIN' : 'AI HELP'}
          </span>
        </button>
      ) : (
        /* Expanded Conversational AI Window */
        <div className="eco-copilot-panel bg-slate-900 border border-slate-700/90 w-[22rem] sm:w-[27rem] h-[33rem] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="bg-slate-950 p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-700 flex items-center justify-center text-white shadow-md">
                <span className="text-sm">🤖</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white">{isAdmin ? 'Hermes Ops Copilot' : 'Ecominds Assistant'}</span>
                  <span className={`text-[9px] px-1.5 rounded font-mono font-bold ${
                    agentMode === 'hermes' 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {agentMode === 'hermes' ? 'Autonomous AI' : 'Fast Response'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">{isAdmin ? 'Campus Operations & Dispatcher' : 'Instant Campus Eco Answers & Help'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (isVoiceEnabled) {
                    stopAllSpeech();
                  }
                  setIsVoiceEnabled(!isVoiceEnabled);
                }}
                className={`p-1.5 rounded-lg text-xs transition ${
                  isVoiceEnabled ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-500 hover:text-white'
                }`}
                title={isVoiceEnabled ? "Voice Output ON" : "Voice Output Muted"}
              >
                {isVoiceEnabled ? "🔊" : "🔇"}
              </button>
              <button
                onClick={() => {
                  stopAllSpeech();
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-white text-xs p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Model Mode Switcher */}
          <div className="bg-slate-950/80 px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 text-[10px] font-bold">{isAdmin ? 'Agent Mode:' : 'AI Mode:'}</span>
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setAgentMode('hermes')}
                className={`px-2 py-0.5 rounded-md font-bold transition text-[10px] ${
                  agentMode === 'hermes'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAdmin ? '🤖 Hermes Agent' : '✨ Deep Reasoner'}
              </button>
              <button
                onClick={() => setAgentMode('groq')}
                className={`px-2 py-0.5 rounded-md font-bold transition text-[10px] ${
                  agentMode === 'groq'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ Fast Answer
              </button>
            </div>
          </div>

          {/* Voice Personality Selector (Studio Neural TTS) */}
          <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="text-[10px] font-bold text-slate-400">🎙️ Voice:</span>
              <select
                value={selectedVoice}
                onChange={(e) => {
                  setSelectedVoice(e.target.value);
                  testVoiceSample(e.target.value);
                }}
                className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-purple-300 font-medium text-[10px] focus:outline-none focus:border-purple-500"
              >
                <option value="en-US-JennyNeural">🌸 Jenny (Natural & Warm)</option>
                <option value="en-US-GuyNeural">🎙️ Guy (Deep & Articulate)</option>
                <option value="en-IN-NeerjaNeural">🇮🇳 Neerja (Bengaluru Natural)</option>
                <option value="en-IN-PrabhatNeural">🇮🇳 Prabhat (Indian English Male)</option>
                <option value="en-US-AriaNeural">🌟 Aria (Dynamic & Expressive)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => testVoiceSample(selectedVoice)}
              className="text-[9px] bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 px-2 py-0.5 rounded transition font-bold flex items-center gap-1"
              title="Preview this natural human voice"
            >
              <span>{isPlayingAudio ? '🔊' : '▶️'}</span>
              <span>{isPlayingAudio ? 'Playing...' : 'Test Voice'}</span>
            </button>
          </div>

          {/* Quick Starter Chips */}
          <div className="bg-slate-950/60 px-3 py-2 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {(isAdmin ? [
              "🤖 Hermes: Plan energy reduction for Mech Block",
              "🤖 Hermes: Dispatch team for leaking cafeteria tap",
              "🔍 How do I verify student submissions?",
              "📋 Review NAAC solid waste diversion"
            ] : [
              "🤝 How do I get free books, uniforms & calculators?",
              "🍽️ How to claim surplus cafeteria meal discounts?",
              "⚡ How do I earn +35 pts by reporting tap leaks?",
              "🌳 How do I adopt a campus tree?",
              "🪙 What rewards can I redeem with my points?"
            ]).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-[10px] whitespace-nowrap bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 px-2.5 py-1 rounded-full transition"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-600/20' 
                      : m.isHermes 
                        ? 'bg-slate-950 text-slate-100 border border-purple-500/40 rounded-bl-none shadow-md shadow-purple-500/10'
                        : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none shadow-md'
                  }`}
                >
                  {m.agent && (
                    <div className="text-[9px] font-mono font-bold text-purple-400 mb-1 flex items-center gap-1">
                      <span>{m.isHermes ? '🤖' : '⚡'}</span>
                      <span>{m.agent}</span>
                    </div>
                  )}
                  <div className="whitespace-pre-line">{m.text}</div>

                  {/* Executed Action Badge */}
                  {m.action && (
                    <div className="mt-2.5 pt-2 border-t border-purple-500/30 bg-purple-950/40 p-2.5 rounded-xl text-[11px] text-purple-200 border border-purple-500/20 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                          <IconCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>Autonomous Action Executed</span>
                        </div>
                        {m.action.co2_saved_kg && (
                          <span className="text-[9px] bg-emerald-900/80 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                            +{m.action.co2_saved_kg} kg CO₂
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[11px] text-white font-semibold">
                        {m.action.title || "Campus Environmental Remediation"}
                      </div>

                      {m.action.assigned_to && (
                        <div className="text-[10px] text-slate-300 flex items-center gap-1">
                          <span className="text-purple-400">⚡ Dispatched:</span>
                          <strong>{typeof m.action.assigned_to === 'string' ? m.action.assigned_to : m.action.assigned_to?.name}</strong>
                          {m.action.location && (
                            <span className="text-slate-400">@ {m.action.location}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></div>
                <span className="font-mono text-[11px]">
                  {agentMode === 'hermes' ? 'Hermes Agent reasoning & planning...' : 'Groq 120B reasoning at 500 T/s...'}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Status & Error Feedback */}
          {voiceError && (
            <div className="bg-red-950/80 border-t border-red-500/30 px-3 py-1.5 flex items-center justify-between text-[11px] text-red-300">
              <span className="truncate">⚠️ {voiceError}</span>
              <button 
                onClick={() => setVoiceError(null)}
                className="text-red-400 hover:text-white ml-2 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {isListening && (
            <div className="bg-red-950/70 border-t border-red-500/40 px-3 py-2 flex items-center justify-between text-xs text-red-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-bold text-[11px]">Recording Voice</span>
                {/* Live Audio Visualizer Bars */}
                <div className="flex items-center gap-1 h-3.5 px-1.5 py-0.5 bg-black/40 rounded-md">
                  {[0.5, 0.9, 1.4, 0.8, 0.4].map((mult, idx) => {
                    const barHeight = Math.max(3, Math.min(14, (audioLevel * mult) / 5));
                    return (
                      <div 
                        key={idx} 
                        className="w-1 bg-red-400 rounded-full transition-all duration-75"
                        style={{ height: `${barHeight}px` }}
                      />
                    );
                  })}
                  <span className="text-[9px] font-mono text-red-300 ml-1">{audioLevel}%</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleListening}
                  className="text-[10px] bg-red-600 hover:bg-red-500 text-white font-bold px-2.5 py-1 rounded-lg shadow-md shadow-red-600/40 transition flex items-center gap-1"
                >
                  <span>⏹️</span>
                  <span>Done</span>
                </button>
              </div>
            </div>
          )}

          {isTranscribing && (
            <div className="bg-purple-950/70 border-t border-purple-500/40 px-3 py-2 flex items-center gap-2 text-xs text-purple-200">
              <div className="w-3 h-3 rounded-full bg-purple-400 animate-spin border-2 border-purple-400 border-t-transparent flex-shrink-0"></div>
              <span className="font-mono text-[11px]">Transcribing via Groq Whisper Turbo...</span>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
            {/* STT Engine Switcher Pill */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span className="font-semibold text-slate-400">Voice Recognition:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setVoiceMode('whisper')}
                  className={`px-2 py-0.5 rounded transition ${
                    voiceMode === 'whisper' 
                      ? 'bg-purple-600 text-white font-bold' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Cloud AI Speech Recognition (High accuracy)"
                >
                  ⚡ High Accuracy
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceMode('webspeech')}
                  className={`px-2 py-0.5 rounded transition ${
                    voiceMode === 'webspeech' 
                      ? 'bg-emerald-600 text-white font-bold' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Local Browser Speech (Instant, low latency)"
                >
                  🗣️ Instant Mic
                </button>
              </div>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleListening}
                disabled={isTranscribing}
                className={`p-2.5 rounded-xl transition ${
                  isListening 
                    ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/50' 
                    : isTranscribing
                      ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40 cursor-wait'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:border-purple-500/40 border border-slate-800'
                }`}
                title={isListening ? "Stop Recording" : `Click to speak via ${voiceMode === 'whisper' ? 'Groq Whisper' : 'Browser Speech'}`}
              >
                {isListening ? '⏹️' : '🎙️'}
              </button>

              <input
                type="text"
                placeholder={
                  isListening 
                    ? "Listening... Speak your campus query..." 
                    : isTranscribing 
                      ? "Groq Whisper transcribing audio..." 
                      : "Ask about Ecominds or campus greening..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTranscribing}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />

              <button
                type="submit"
                disabled={isLoading || isTranscribing || !input.trim()}
                aria-busy={isLoading || isTranscribing}
                className="bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-xl font-bold transition shadow-md shadow-purple-600/30 disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
