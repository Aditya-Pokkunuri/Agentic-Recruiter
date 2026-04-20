import { useState, useEffect, useRef, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { useDemo } from '../../context/DemoContext';
import { BrainCircuit, Mic, MicOff, Send, Activity, Video as VideoIcon, Sparkles, Shield, Volume2, VolumeX, Radio } from 'lucide-react';
import roomService from '../../services/RoomService';
import SpeechService from '../../services/SpeechService';
import AITwinService from '../../services/AITwinService';

export default function LiveInterviews() {
  const data = useData();
  const { state, dispatch, ACTIONS } = useDemo();
  
  const [transcript, setTranscript] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [aiStatus, setAiStatus] = useState('offline'); // 'offline' | 'listening' | 'thinking' | 'responding' | 'deactivated'
  const [rubricScore, setRubricScore] = useState(0);
  const [signals, setSignals] = useState([]);
  const [elapsed, setElapsed] = useState('00:00');
  const [activeSession, setActiveSession] = useState(null); // The one we are currently watching

  const transcriptEndRef = useRef(null);
  const speechRef = useRef(null);
  const aiRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const candidatePendingRef = useRef(null);
  const lastProcessedRef = useRef('');

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, interimText]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const mins = String(Math.floor(diff / 60)).padStart(2, '0');
      const secs = String(diff % 60).padStart(2, '0');
      setElapsed(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync activeSession with state.roomCode if set
  useEffect(() => {
    if (state.roomCode && !activeSession) {
      const session = state.activeRooms.find(r => r.code === state.roomCode);
      if (session) setActiveSession(session);
    }
  }, [state.roomCode, state.activeRooms, activeSession]);

  // Handle Switching Sessions
  const handleSwitchSession = (session) => {
    if (activeSession?.code === session.code) return;
    
    // Clear current monitor
    setTranscript([]);
    setRubricScore(0);
    setSignals([]);
    setAiStatus('initializing');
    
    // Switch Room
    roomService.leave();
    roomService.joinRoom(session.code, 'recruiter');
    dispatch({ type: ACTIONS.SET_ROOM, payload: session.code });
    setActiveSession(session);
    
    // Re-init AI Twin for this context if needed
    initAITwin(session);
  };

  const initAITwin = (session) => {
    if (aiRef.current) aiRef.current.destroy();
    
    const ai = new AITwinService();
    aiRef.current = ai;

    const initialized = ai.init({
      personaAnswers: state.personaAnswers,
      personaBlueprint: state.personaBlueprint,
      knowledgeModules: state.knowledgeModules,
      userName: state.user?.name || 'Sarah',
      candidateName: session.candidateName,
      targetRole: session.role || 'Senior Backend Engineer'
    });

    if (initialized) {
      setAiStatus('listening');
      addSignal(`Spectating session: ${session.candidateName} (${session.code})`);
    } else {
      setAiStatus('deactivated');
    }
  };

  // Initialize AI Twin for initial room
  useEffect(() => {
    if (state.roomCode && !aiRef.current) {
      const session = state.activeRooms.find(r => r.code === state.roomCode);
      if (session) initAITwin(session);
    }
  }, [state.roomCode]);

  // Listen for candidate transcript
  useEffect(() => {
    const unsubTranscript = roomService.on('transcript', (data) => {
      if (data.sender === 'Candidate' && data.isFinal) {
        const msg = {
          id: data.id,
          sender: 'Candidate',
          text: data.text,
          timestamp: data.timestamp,
          isFinal: true
        };
        setTranscript(prev => [...prev, msg]);

        // Update rubric score
        setRubricScore(prev => Math.min(100, prev + Math.floor(Math.random() * 8 + 3)));

        if (aiRef.current?.isActive && !state.handoff_active) {
          if (candidatePendingRef.current) clearTimeout(candidatePendingRef.current);
          candidatePendingRef.current = setTimeout(async () => {
            if (data.text === lastProcessedRef.current) return;
            lastProcessedRef.current = data.text;
            
            setAiStatus('thinking');
            const response = await aiRef.current.getResponse(data.text);
            if (response && aiRef.current?.isActive) {
              const aiMsg = {
                id: `ai-${Date.now()}`,
                sender: 'Sarah',
                text: response,
                timestamp: Date.now(),
                isAI: true
              };
              setTranscript(prev => [...prev, aiMsg]);
              roomService.sendAIResponse(response);
              setAiStatus('listening');
            }
          }, 1500);
        }
      }
    });

    return () => unsubTranscript();
  }, [state.handoff_active, activeSession]);

  // Add a signal
  const addSignal = useCallback((text) => {
    setSignals(prev => [...prev.slice(-6), { text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
  }, []);

  const handleTakeOver = () => {
    dispatch({ type: ACTIONS.OVERRIDE_TWIN });
    roomService.sendTakeover();
    if (aiRef.current) aiRef.current.deactivate();
    setAiStatus('deactivated');
    addSignal('🚨 HUMAN TAKEOVER: Twin autonomy paused.');
  };

  const handleSendTyped = () => {
    if (!typedMessage.trim()) return;
    const msg = { id: `typed-${Date.now()}`, sender: 'Sarah (Recruiter)', text: typedMessage.trim(), timestamp: Date.now(), isTyped: true };
    setTranscript(prev => [...prev, msg]);
    roomService.sendTypedMessage(typedMessage.trim(), 'Sarah (Recruiter)');
    setTypedMessage('');
  };

  const toggleRecruiterMic = useCallback(() => {
    if (!state.handoff_active) return;
    if (isMicOn) {
      if (speechRef.current) speechRef.current.stop();
      setIsMicOn(false);
      setInterimText('');
    } else {
      if (!speechRef.current) {
        const speech = new SpeechService();
        speechRef.current = speech;
        speech.onResult = (text, isFinal) => {
          if (isFinal) {
            setInterimText('');
            const msg = { id: `r-${Date.now()}`, sender: 'Sarah (Recruiter)', text, timestamp: Date.now(), isFinal: true };
            setTranscript(prev => [...prev, msg]);
            roomService.sendTranscript(text, 'Sarah (Recruiter)', true, false);
          } else {
            setInterimText(text);
          }
        };
        speech.init();
      }
      speechRef.current.start();
      setIsMicOn(true);
    }
  }, [isMicOn, state.handoff_active]);

  useEffect(() => {
    return () => {
      if (speechRef.current) speechRef.current.destroy();
      if (candidatePendingRef.current) clearTimeout(candidatePendingRef.current);
      if (aiRef.current) aiRef.current.destroy();
    };
  }, []);

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', height: 'calc(100vh - 120px)' }}>
      
      {/* Session Hub Sidebar */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} color="var(--brand-blue)" /> Active Sessions
          </h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {state.activeRooms.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>No active interviews. Start one from the Pipeline.</p>
          )}
          {state.activeRooms.map(session => (
            <div 
              key={session.code}
              onClick={() => handleSwitchSession(session)}
              style={{
                padding: '1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                background: activeSession?.code === session.code ? 'rgba(0, 96, 255, 0.05)' : 'var(--bg-secondary)',
                border: `1px solid ${activeSession?.code === session.code ? 'var(--brand-blue)' : 'var(--border-subtle)'}`,
                transition: 'all 200ms ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{session.candidateName}</span>
                <span style={{ fontSize: '0.7rem', background: '#0f172a', color: 'var(--brand-blue)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>{session.code}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{session.role}</p>
            </div>
          ))}
        </div>
      </div>

      {!activeSession ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-subtle)' }}>
          <div style={{ textAlign: 'center' }}>
            <Radio size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Select a session to monitor</h2>
            <p style={{ color: 'var(--text-muted)' }}>Real-time telemetry will appear here once selected.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Detailed Monitor View */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Live Session: {activeSession.candidateName}</h1>
              <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--brand-blue)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {activeSession.code}
                </span>
                Proctoring active for {activeSession.role}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(activeSession.code);
                  alert('Interview Code Copied: ' + activeSession.code);
                }}
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-pill)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 200ms ease' }}
              >
                <div style={{ padding: '4px', background: 'var(--brand-blue)', borderRadius: '4px', display: 'flex' }}><Send size={14} color="white" /></div>
                Copy Code: {activeSession.code}
              </button>
              <button 
                onClick={handleTakeOver}
                style={{ background: 'white', color: 'var(--tier-red)', border: '2px solid var(--tier-red)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-pill)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 200ms ease', fontSize: '0.9rem' }}
              >
                🚨 Take Over
              </button>
            </div>
          </div>

      {/* Main Content */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        
        {/* Session Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Arjun" alt="Candidate" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '2px solid var(--brand-blue)' }} />
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Arjun Mehta</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Senior Backend Engineer</span>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#020617', color: 'var(--brand-blue)', padding: '0.25rem 0.75rem', borderRadius: '1rem', border: '1px solid #1e293b', fontWeight: 600 }}>
              {state.handoff_active ? '👤 Human Control' : '🤖 AI Twin Active'}
            </span>
          </div>

          {state.handoff_active ? (
            <div style={{ background: 'var(--tier-green)', color: 'white', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-pill)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              ✅ Human Control Active
            </div>
          ) : (
            <button 
              onClick={handleTakeOver}
              style={{ background: 'white', color: 'var(--tier-red)', border: '2px solid var(--tier-red)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-pill)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)', transition: 'all 200ms ease', fontSize: '0.9rem' }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'var(--tier-red)'; e.currentTarget.style.color = 'white'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--tier-red)'; }}
            >
              🚨 Take Over Interview
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: '550px' }}>
          
          {/* Transcript Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)' }}>
            
            {/* AI Status Bar */}
            <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem', background: aiStatus === 'thinking' ? 'rgba(14, 165, 233, 0.05)' : 'transparent' }}>
              <div style={{ 
                width: '10px', height: '10px', borderRadius: '50%', 
                background: aiStatus === 'deactivated' ? 'var(--text-muted)' : aiStatus === 'thinking' ? 'var(--tier-amber)' : 'var(--tier-green)',
                animation: aiStatus === 'thinking' ? 'blink 0.8s infinite' : 'none'
              }}></div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {aiStatus === 'initializing' && 'Initializing AI Twin...'}
                {aiStatus === 'listening' && 'AI Twin Listening...'}
                {aiStatus === 'thinking' && '🧠 AI Twin Processing Response...'}
                {aiStatus === 'deactivated' && 'AI Twin Deactivated — Human Control'}
              </span>
            </div>

            {/* Transcript Messages */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {transcript.length === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <BrainCircuit size={40} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.4 }} />
                    <p style={{ color: 'var(--text-muted)' }}>AI Twin is preparing the interview...</p>
                  </div>
                </div>
              )}
              {transcript.map((msg) => (
                <div key={msg.id} style={{ 
                  paddingBottom: '0.75rem', 
                  borderBottom: '1px dashed var(--border-subtle)',
                  animation: 'fadeSlideIn 0.3s ease-out'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                      color: msg.isSystem ? 'var(--tier-red)' : (msg.sender === 'Candidate' ? 'var(--text-secondary)' : 'var(--brand-blue)'),
                      display: 'flex', alignItems: 'center', gap: '0.4rem'
                    }}>
                      {msg.isAI && <BrainCircuit size={12} />}
                      {msg.isTyped && <span>⌨️</span>}
                      {msg.isSystem && <Shield size={12} />}
                      {msg.sender}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatTime(msg.timestamp)}</span>
                  </div>
                  <p style={{ 
                    fontSize: '0.95rem', lineHeight: 1.6,
                    color: msg.isSystem ? 'var(--tier-red)' : 'var(--text-primary)',
                    fontStyle: msg.isSystem ? 'italic' : 'normal'
                  }}>{msg.text}</p>
                </div>
              ))}
              {interimText && (
                <div style={{ paddingBottom: '0.75rem', borderBottom: '1px dashed var(--brand-blue)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-blue)', textTransform: 'uppercase' }}>You (speaking...)</span>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--brand-blue)', fontStyle: 'italic', marginTop: '0.3rem' }}>{interimText}</p>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Recruiter Input (after takeover) */}
            {state.handoff_active && (
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button 
                    onClick={toggleRecruiterMic}
                    style={{ 
                      width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                      background: isMicOn ? 'var(--tier-red)' : 'var(--brand-blue)',
                      color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 200ms ease', flexShrink: 0
                    }}
                    title={isMicOn ? 'Stop speaking' : 'Start speaking'}
                  >
                    {isMicOn ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  <input 
                    type="text" 
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendTyped(); }}
                    placeholder="Type a message to the candidate..." 
                    style={{ 
                      flex: 1, padding: '0.7rem 1rem', borderRadius: 'var(--radius-pill)', 
                      border: '1px solid var(--border-subtle)', background: 'var(--bg-card)',
                      color: 'var(--text-primary)', fontSize: '0.9rem'
                    }} 
                  />
                  <button 
                    onClick={handleSendTyped}
                    style={{ 
                      width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                      background: 'var(--brand-blue)', color: 'white', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      transition: 'all 200ms ease'
                    }}
                  >
                    <Send size={18} />
                  </button>
                </div>
                {isMicOn && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--tier-red)' }}>
                    <span style={{ width: '6px', height: '6px', background: 'var(--tier-red)', borderRadius: '50%', animation: 'blink 1s infinite' }}></span>
                    Recording — speak into your microphone
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rubric Telemetry Sidebar */}
          <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brain Telemetry</h4>
            
            {/* Score */}
            <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${rubricScore > 70 ? 'var(--tier-green)' : rubricScore > 40 ? 'var(--tier-amber)' : 'var(--tier-red)'}` }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Running Rubric Score</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, transition: 'all 300ms ease' }}>{rubricScore}</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
              </div>
              <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${rubricScore}%`, background: rubricScore > 70 ? 'var(--tier-green)' : rubricScore > 40 ? 'var(--tier-amber)' : 'var(--tier-red)', transition: 'width 500ms ease', borderRadius: '2px' }}></div>
              </div>
            </div>

            {/* AI Status */}
            <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Twin Status</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: aiStatus === 'deactivated' ? 'var(--text-muted)' : 'var(--tier-green)',
                  boxShadow: aiStatus !== 'deactivated' ? '0 0 8px var(--tier-green)' : 'none'
                }}></span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {aiStatus === 'deactivated' ? 'Paused (Human)' : 'Autonomous'}
                </span>
              </div>
            </div>

            {/* Live Signals */}
            {/* Live Signals */}
            <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', flex: 1 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Live Signals</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {signals.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Awaiting candidate input...</p>
                )}
                {signals.map((sig, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', animation: 'fadeSlideIn 0.3s ease-out' }}>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, fontSize: '0.65rem' }}>{sig.time}</span>
                    <span>{sig.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {state.handoff_active && (
              <div style={{ marginTop: 'auto', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--tier-red)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--tier-red)', fontWeight: 600, textAlign: 'center' }}>Twin Autonomy Paused</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )}
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
