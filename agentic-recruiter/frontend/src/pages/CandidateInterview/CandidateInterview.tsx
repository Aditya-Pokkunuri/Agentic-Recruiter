import { useEffect, useState, useRef, useCallback } from 'react';
import { useDemo } from '../../context/DemoContext';
import { Mic, MicOff, Video as VideoIcon, VideoOff, UserCircle, BrainCircuit, Activity, ShieldCheck, LogOut, Sparkles, MessageSquare } from 'lucide-react';
import roomService from '../../services/RoomService';
import SpeechService from '../../services/SpeechService';
import AITwinService from '../../services/AITwinService';

export default function CandidateInterview() {
  const { state, ACTIONS, dispatch } = useDemo();
  const [transcript, setTranscript] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [aiThinking, setAiThinking] = useState(false); // To handle latency
  const [speechSupported, setSpeechSupported] = useState(true);
  const [streamingAIResponse, setStreamingAIResponse] = useState(''); // New state for syncing text with speech


  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const speechRef = useRef(null);
  const aiRef = useRef(null);
  const audioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const lastFinalRef = useRef('');
  const candidatePendingRef = useRef(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, interimText]);

  // Setup camera + audio
  useEffect(() => {
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // Start streaming to recruiter
        roomService.startStreaming(stream);
      } catch (err) {
        console.error("Error accessing media:", err);
      }
    }
    setupMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Setup Speech Recognition
  useEffect(() => {
    if (!SpeechService.isSupported()) {
      setSpeechSupported(false);
      return;
    }

    const speech = new SpeechService();
    speechRef.current = speech;

    speech.onResult = (text, isFinal) => {
      if (isFinal) {
        if (text === lastFinalRef.current) return;
        lastFinalRef.current = text;
        
        setInterimText('');
        const msg = {
          id: `c-${Date.now()}`,
          sender: 'Candidate',
          text: text,
          timestamp: Date.now(),
          isFinal: true
        };
        setTranscript(prev => [...prev, msg]);
        roomService.sendTranscript(text, 'Candidate', true, false);
        dispatch({ type: ACTIONS.ADD_TRANSCRIPT_MESSAGE, payload: msg });

        // AUTOMATIC RESPONSE TRIGGER
        if (!state.handoff_active) {
          handleAIStep(text);
        }
      } else {
        setInterimText(text);
        roomService.sendTranscript(text, 'Candidate', false, true);
      }
    };

    speech.onError = (err) => {
      if (err.type === 'unsupported') {
        setSpeechSupported(false);
      }
    };

    speech.init();
    speech.start();

    return () => {
      if (speechRef.current) {
        speechRef.current.destroy();
      }
    };
  }, [dispatch, ACTIONS]);

  const handleSpeak = (text, originalMsg) => {
    if (!window.speechSynthesis) {
      setTranscript(prev => [...prev, originalMsg]);
      dispatch({ type: ACTIONS.ADD_TRANSCRIPT_MESSAGE, payload: originalMsg });
      return;
    }

    // Pause speech recognition while AI speaks to avoid capturing TTS audio
    if (speechRef.current && speechRef.current.isListening) {
      speechRef.current.stop();
    }

    setAiThinking(true);
    setAiSpeaking(false);
    setStreamingAIResponse('');
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Samantha') || v.female);
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setAiThinking(false);
      setAiSpeaking(true);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const spokenText = text.substring(0, event.charIndex + event.charLength);
        setStreamingAIResponse(spokenText);
      }
    };

    utterance.onend = () => {
      setAiSpeaking(false);
      setAiThinking(false);
      setStreamingAIResponse('');
      setTranscript(prev => [...prev, originalMsg]);
      dispatch({ type: ACTIONS.ADD_TRANSCRIPT_MESSAGE, payload: originalMsg });

      // Resume speech recognition after AI finishes speaking
      // Small delay to let TTS audio fully clear before re-activating mic
      setTimeout(() => {
        if (speechRef.current && isMicOn) {
          speechRef.current.start();
        }
      }, 400);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleAIStep = async (text) => {
    if (!aiRef.current) return;
    setAiThinking(true);
    const response = await aiRef.current.getResponse(text);
    if (response) {
      const aiMsg = { id: `ai-${Date.now()}`, sender: 'Sarah', text: response, timestamp: Date.now(), isFinal: true, isAI: true };
      handleSpeak(response, aiMsg);
      // Broadcast AI response to recruiter
      roomService.sendTranscript(response, 'Sarah', true, false);
    }
  };

  // Initialize Autonomous AI Twin on Candidate Side
  useEffect(() => {
    const ai = new AITwinService();
    ai.init({
      personaAnswers: state.personaAnswers,
      personaBlueprint: state.personaBlueprint,
      knowledgeModules: state.knowledgeModules,
      userName: 'Sarah',
      candidateName: 'Candidate'
    });
    aiRef.current = ai;

    // Initial Greeting
    setTimeout(async () => {
      setAiThinking(true);
      const greeting = await ai.getGreeting();
      if (greeting) {
        const msg = { id: `ai-greet`, sender: 'Sarah', text: greeting, timestamp: Date.now(), isFinal: true, isAI: true };
        handleSpeak(greeting, msg);
        // Broadcast initial AI greeting to recruiter
        roomService.sendTranscript(greeting, 'Sarah', true, false);
      }
    }, 2000);

    // Note: AI response is triggered directly from speech.onResult (handleAIStep).
    // This listener only handles displaying incoming candidate transcripts from the room channel
    // (relevant for network mode where candidate is on a different machine).
    const unsubCandidateSpeech = roomService.on('transcript', async (data) => {
      // Only process if this is a remote candidate (network mode)
      // In local mode, speech.onResult already handles everything
      if (data.sender === 'Candidate' && data.isFinal) {
        // Check if we already have this message (from local speech.onResult)
        if (data.text === lastFinalRef.current) return;
        lastFinalRef.current = data.text;

        const msg = {
          id: data.id,
          sender: 'Candidate',
          text: data.text,
          timestamp: data.timestamp,
          isFinal: true
        };
        setTranscript(prev => {
          if (prev.find(m => m.id === data.id)) return prev;
          return [...prev, msg];
        });

        // Trigger AI response for remote candidate speech
        if (!state.handoff_active && aiRef.current) {
          if (candidatePendingRef.current) clearTimeout(candidatePendingRef.current);
          candidatePendingRef.current = setTimeout(async () => {
            setAiThinking(true);
            const response = await aiRef.current.getResponse(data.text);
            if (response) {
              const aiMsg = { id: `ai-${Date.now()}`, sender: 'Sarah', text: response, timestamp: Date.now(), isFinal: true, isAI: true };
              handleSpeak(response, aiMsg);
              roomService.sendTranscript(response, 'Sarah', true, false);
            }
          }, 1500);
        }
      }
    });

    const unsubAI = roomService.on('aiResponse', (data) => {
      // Only handle if it's external (e.g. recruiter sending a specific AI override)
    });

    const unsubTakeover = roomService.on('takeover', () => {
      dispatch({ type: ACTIONS.OVERRIDE_TWIN });
      const msg = {
        id: `sys-${Date.now()}`,
        sender: 'System',
        text: '🚨 A human recruiter has joined your session.',
        timestamp: Date.now(),
        isSystem: true
      };
      setTranscript(prev => [...prev, msg]);
    });

    const unsubTyped = roomService.on('typedMessage', (data) => {
      const msg = {
        id: data.id,
        sender: data.sender,
        text: data.text,
        timestamp: data.timestamp,
        isFinal: true,
        isTyped: true
      };
      setTranscript(prev => [...prev, msg]);
      dispatch({ type: ACTIONS.ADD_TRANSCRIPT_MESSAGE, payload: msg });
    });

    // Also receive recruiter's spoken transcript
    const unsubRecruiterSpeech = roomService.on('transcript', (data) => {
      if (data.sender !== 'Candidate') {
        const msg = {
          id: data.id,
          sender: data.sender,
          text: data.text,
          timestamp: data.timestamp,
          isFinal: data.isFinal
        };
        if (data.isFinal) {
          setTranscript(prev => [...prev, msg]);
          dispatch({ type: ACTIONS.ADD_TRANSCRIPT_MESSAGE, payload: msg });
        }
      }
    });

    const unsubStream = roomService.on('stream', (stream) => {
      console.log('[CandidateInterview] Received remote stream (recruiter voice)');
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
      }
    });

    // Check if stream already arrived
    if (roomService.remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = roomService.remoteStream;
    }

    return () => {
      unsubAI();
      unsubTakeover();
      unsubTyped();
      unsubCandidateSpeech();
      unsubRecruiterSpeech();
      unsubStream();
      if (candidatePendingRef.current) clearTimeout(candidatePendingRef.current);
      if (aiRef.current) aiRef.current.destroy();
    };
  }, [dispatch, ACTIONS, state.handoff_active]);

  // Mic toggle
  const toggleMic = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        if (audioTrack.enabled && speechRef.current) {
          speechRef.current.start();
        } else if (speechRef.current) {
          speechRef.current.stop();
          setInterimText('');
        }
      }
    }
  }, []);

  // Video toggle
  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  }, []);

  const handleLeave = () => {
    // Save transcript before leaving
    if (transcript.length > 0) {
      dispatch({
        type: ACTIONS.SAVE_INTERVIEW_TRANSCRIPT,
        payload: {
          id: `interview-${Date.now()}`,
          candidateName: 'Arjun Mehta',
          role: 'Senior Backend Engineer',
          date: new Date().toISOString(),
          messages: transcript,
          duration: Math.round((Date.now() - (transcript[0]?.timestamp || Date.now())) / 60000),
        }
      });
    }
    roomService.leave();
    dispatch({ type: ACTIONS.LOGOUT });
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const [joinCode, setJoinCode] = useState('');
  const [isJoined, setIsJoined] = useState(!!state.roomCode);

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    const success = roomService.joinRoom(joinCode);
    if (success) {
      dispatch({ type: ACTIONS.SET_ROOM, payload: joinCode });
      setIsJoined(true);
      // Re-trigger stream start
      if (streamRef.current) {
        roomService.startStreaming(streamRef.current);
      }
    }
  };

  useEffect(() => {
    if (state.roomCode && !isJoined) {
      roomService.joinRoom(state.roomCode);
      setIsJoined(true);
    }
  }, [state.roomCode, isJoined]);

  if (!isJoined) {
    return (
      <div style={{ height: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)' }}>
        <div style={{ background: 'var(--bg-card)', padding: '3rem', borderRadius: 'var(--radius-lg)', width: '400px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--brand-blue)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <span style={{ color: 'white', fontSize: '2rem', fontWeight: 800 }}>Q</span>
          </div>
          <h1 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Join Interview</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Enter the interview code provided by your recruiter to begin.</p>
          
          <input 
            type="text" 
            placeholder="e.g. QAL-X7K2"
            value={joinCode}
            onChange={(e) => setJoinCode(e.currentTarget.value.toUpperCase())}
            style={{ width: '100%', padding: '1rem', background: '#0f172a', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '2px', marginBottom: '1.5rem', outline: 'none' }}
          />
          
          <button 
            onClick={handleJoin}
            style={{ width: '100%', padding: '1rem', background: 'var(--brand-blue)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
          >
            Enter Interview Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'var(--font-sans)' }}>
      <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />
      {/* Header */}
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <div style={{ width: '32px', height: '32px', background: 'var(--brand-blue)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 800 }}>Q</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Senior Backend Engineer - Technical Round</h2>
              {state.isTrained && (
                <span style={{ fontSize: '0.65rem', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--tier-amber)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Persona Sync Active
                </span>
              )}
              {state.roomCode && (
                <span style={{ fontSize: '0.65rem', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--brand-blue)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(14, 165, 233, 0.2)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {state.roomCode}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={14} color="var(--brand-blue)" /> Proctoring Active • End-to-End Encrypted
            </p>
          </div>
        </div>
        <button onClick={handleLeave} style={{ background: 'var(--tier-red)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-pill)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={16} /> Leave Session
        </button>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left Side (Video) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020617', padding: '2rem', position: 'relative', overflow: 'hidden' }}>

          {/* Main Candidate Video Feed */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#0f172a', zIndex: 1 }}>
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: isVideoOn ? 'block' : 'none' }} 
            />
            {!isVideoOn && (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <VideoOff size={48} color="#64748b" />
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(4px)', zIndex: 5 }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--tier-green)', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span> Candidate Feed
          </div>

          {/* Speech Indicator */}
          {interimText && (
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.7)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', zIndex: 5, backdropFilter: 'blur(4px)', maxWidth: '300px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                <span style={{ width: '3px', height: '12px', background: 'var(--brand-blue)', borderRadius: '2px', animation: 'soundBar1 0.6s infinite' }}></span>
                <span style={{ width: '3px', height: '18px', background: 'var(--brand-blue)', borderRadius: '2px', animation: 'soundBar2 0.6s infinite' }}></span>
                <span style={{ width: '3px', height: '10px', background: 'var(--brand-blue)', borderRadius: '2px', animation: 'soundBar3 0.6s infinite' }}></span>
              </div>
              {interimText.substring(0, 50)}{interimText.length > 50 ? '...' : ''}
            </div>
          )}

          {/* Active Question Banner */}
          {(streamingAIResponse || aiThinking) && (
            <div style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', width: '80%', background: 'rgba(30, 41, 59, 0.85)', border: '1px solid #334155', padding: '1.5rem', borderRadius: 'var(--radius-lg)', backdropFilter: 'blur(10px)', textAlign: 'center', animation: 'slideDown 0.5s ease-out', zIndex: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--brand-blue)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px' }}>
                <Activity size={14} className={aiThinking ? 'animate-pulse' : ''} /> {state.handoff_active ? 'Recruiter Question' : 'AI Twin Question'}
              </div>
              <p style={{ color: 'white', fontSize: '1.25rem', lineHeight: 1.5, fontWeight: 500 }}>
                {aiThinking ? "Sarah is thinking..." : `"${streamingAIResponse}"`}
              </p>
            </div>
          )}

          {/* Controls */}
          <div style={{ position: 'absolute', bottom: '2rem', display: 'flex', gap: '1.5rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem 2.5rem', borderRadius: 'var(--radius-pill)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
            <button 
              onClick={toggleMic}
              style={{ 
                width: '56px', height: '56px', borderRadius: '50%', border: 'none', 
                background: isMicOn ? 'white' : 'var(--tier-red)', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: isMicOn ? '#020617' : 'white', 
                transition: 'var(--transition-fast)' 
              }}
            >
              {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
            </button>
            <button 
              onClick={toggleVideo}
              style={{ 
                width: '56px', height: '56px', borderRadius: '50%', 
                border: `1px solid ${isVideoOn ? 'rgba(255,255,255,0.2)' : 'var(--tier-red)'}`, 
                background: isVideoOn ? 'transparent' : 'var(--tier-red)', 
                cursor: 'pointer', color: 'white', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                transition: 'var(--transition-fast)' 
              }}
            >
              {isVideoOn ? <VideoIcon size={24} /> : <VideoOff size={24} />}
            </button>
          </div>

          {/* AI/Recruiter PIP View */}
          <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', width: '260px', height: '180px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-secondary)', border: state.handoff_active ? '2px solid var(--tier-green)' : '1px solid var(--border-subtle)', boxShadow: '0 15px 35px rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {state.handoff_active ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.5s' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '3px solid white', boxShadow: 'var(--shadow-sm)' }}>
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Sarah`} alt="Human Recruiter" style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'white' }} />
                </div>
                <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.25rem' }}>Sarah (Recruiter)</h3>
                <span style={{ fontSize: '0.7rem', background: 'var(--tier-green)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>Live • Human</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', background: '#020617' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%', background: 'var(--brand-blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
                  boxShadow: aiSpeaking ? '0 0 30px rgba(14, 165, 233, 0.6)' : '0 0 20px rgba(14, 165, 233, 0.4)', 
                  animation: 'pulse 2s infinite', position: 'relative'
                }}>
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Sarah`} alt="Interviewer" style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'white', position: 'relative', zIndex: 2 }} />
                  <div style={{ position: 'absolute', width: '100%', height: '100%', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', animation: 'ripple 1.5s infinite linear', zIndex: 1 }}></div>
                </div>
                <h3 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Sarah (AI Twin) <span style={{ width: '6px', height: '6px', background: 'var(--tier-green)', borderRadius: '50%' }}></span>
                </h3>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {aiSpeaking ? 'Thinking...' : 'Listening...'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side (Transcript) */}
        <div style={{ width: '400px', background: 'var(--bg-card)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>

          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', background: 'var(--tier-red)', borderRadius: '50%', animation: 'blink 1s infinite' }}></span>
              Live Transcript
            </h3>
            {!speechSupported && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--tier-amber)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                ⚠️ Speech Recognition not supported. Use Chrome or Edge.
              </div>
            )}
            {state.isTrained && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(14,165,233, 0.1)', color: 'var(--brand-blue)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Sparkles size={12} /> Persona Sync: {state.personaBlueprint?.name || 'Active'}
              </div>
            )}
            {state.handoff_active && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--tier-red)', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🚨 A human recruiter has joined your session.
              </div>
            )}
          </div>

          {/* Transcript Messages */}
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {transcript.length === 0 && !interimText && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div>
                  <Activity size={32} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Waiting for conversation to begin...</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Speak into your microphone</p>
                </div>
              </div>
            )}
            {transcript.map((msg) => (
              <div key={msg.id} style={{
                alignSelf: msg.sender === 'Candidate' ? 'flex-end' : 'flex-start',
                background: msg.isSystem ? 'rgba(239, 68, 68, 0.1)' : (msg.sender === 'Candidate' ? 'var(--brand-blue)' : 'var(--bg-secondary)'),
                color: msg.isSystem ? 'var(--tier-red)' : (msg.sender === 'Candidate' ? 'white' : 'var(--text-primary)'),
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                maxWidth: '85%',
                boxShadow: 'var(--shadow-sm)',
                animation: 'msgSlideIn 0.3s ease-out',
                border: msg.isSystem ? '1px dashed var(--tier-red)' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {msg.isAI && <BrainCircuit size={10} />}
                    {msg.isTyped && <MessageSquare size={10} />}
                    {msg.sender}
                  </span>
                  <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{formatTime(msg.timestamp)}</span>
                </div>
                <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {msg.isAI && aiSpeaking && msg.id === transcript[transcript.length-1].id 
                   ? (streamingAIResponse || "...") 
                   : msg.text}
                </div>
              </div>
            ))}
            {/* Interim (being spoken) text */}
            {interimText && (
              <div style={{
                alignSelf: 'flex-end',
                background: 'rgba(0, 96, 255, 0.15)',
                color: 'var(--brand-blue)',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                maxWidth: '85%',
                fontStyle: 'italic',
                border: '1px dashed var(--brand-blue)',
                animation: 'msgSlideIn 0.3s ease-out'
              }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.2rem', opacity: 0.8 }}>You (speaking...)</div>
                <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{interimText}</div>
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Cognitive Trace Panel */}
          {state.isTrained && (
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
              <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BrainCircuit size={14} color="var(--brand-blue)" /> Sarah's Cognitive Trace
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.1)' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--brand-blue)', fontWeight: 700, marginBottom: '0.2rem' }}>HEURISTIC ALIGNMENT</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Using your <strong>"{state.personaAnswers.q5?.substring(0, 20) || 'Scan Metrics'}..."</strong> screening logic.</p>
                </div>
                {/* Thinking / Interim Text */}
                {(aiThinking || aiSpeaking) && (
                  <div style={{ padding: '0.75rem', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--brand-blue)', marginBottom: '1rem', animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                       <BrainCircuit size={12} className="animate-pulse" /> SARAH
                    </div>
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                       {aiThinking ? (
                         <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           Sarah is thinking<span className="dot-animate">...</span>
                         </span>
                       ) : (
                         streamingAIResponse
                       )}
                    </div>
                  </div>
                )}
                <div style={{ padding: '0.75rem', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.1)' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--brand-blue)', fontWeight: 700, marginBottom: '0.2rem' }}>TONE TRACKING</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mirroring: <strong>"{state.personaAnswers.q7?.substring(0, 20) || 'Natural Style'}..."</strong></p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
          70% { box-shadow: 0 0 0 40px rgba(14, 165, 233, 0); }
          100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes msgSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes soundBar1 {
          0%, 100% { height: 6px; }
          50% { height: 16px; }
        }
        @keyframes soundBar2 {
          0%, 100% { height: 14px; }
          50% { height: 6px; }
        }
        @keyframes soundBar3 {
          0%, 100% { height: 8px; }
          50% { height: 18px; }
        }
      `}</style>
    </div>
  );
}
