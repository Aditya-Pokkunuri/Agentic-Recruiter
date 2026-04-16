import { useEffect, useState, useRef } from 'react';
import { useDemo } from '../../context/DemoContext';
import { Mic, Video as VideoIcon, UserCircle, BrainCircuit, Activity, ShieldCheck, LogOut } from 'lucide-react';

export default function CandidateInterview() {
  const { state, ACTIONS, dispatch } = useDemo();
  const [transcript, setTranscript] = useState([
    { sender: 'Sarah', text: "Hello Arjun, I am Sarah. I'll be conducting your technical interview today. Are you ready to begin?" },
    { sender: 'Candidate', text: "Yes, I'm ready." }
  ]);

  // Simulate AI talking
  useEffect(() => {
    if (state.handoff_active) return;

    const timers = [
      setTimeout(() => setTranscript(prev => [...prev, { sender: 'Sarah', text: "Great. Let's start with System Design. How would you architect a scalable rate limiter for a public API?" }]), 3000),
      setTimeout(() => setTranscript(prev => [...prev, { sender: 'Candidate', text: "Well, I'd probably use a Redis cluster with a sliding window log algorithm to track the timestamps..." }]), 8000),
      setTimeout(() => setTranscript(prev => [...prev, { sender: 'Sarah', text: "That approach works. However, sliding window log can be memory intensive at scale. How would you optimize the memory footprint?" }]), 15000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [state.handoff_active]);

  const handleLeave = () => {
    dispatch({ type: ACTIONS.LOGOUT });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--brand-blue)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 800 }}>Q</span>
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Senior Backend Engineer - Technical Round</h2>
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

        {/* Left Side (Visuals) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020617', padding: '2rem', position: 'relative', overflow: 'hidden' }}>

          {/* Main Candidate Avatar Feed */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', zIndex: 1 }}>
            <img src="/candidate_feed.png" alt="Candidate Feed" style={{ width: '450px', height: '450px', objectFit: 'cover', borderRadius: '50%', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', border: '8px solid rgba(255,255,255,0.05)' }} />
          </div>

          <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(4px)', zIndex: 5 }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--tier-green)', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span> Candidate Feed
          </div>

          {/* Active Question Banner */}
          {!state.handoff_active && transcript.length > 0 && transcript[transcript.length - 1].sender === 'Sarah' && (
            <div style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', width: '80%', background: 'rgba(30, 41, 59, 0.85)', border: '1px solid #334155', padding: '1.5rem', borderRadius: 'var(--radius-lg)', backdropFilter: 'blur(10px)', textAlign: 'center', animation: 'slideDown 0.5s ease-out', zIndex: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--brand-blue)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px' }}>
                <Activity size={14} /> Active Prompt
              </div>
              <p style={{ color: 'white', fontSize: '1.25rem', lineHeight: 1.5, fontWeight: 500 }}>
                "{transcript[transcript.length - 1].text}"
              </p>
            </div>
          )}

          {/* Controls */}
          <div style={{ position: 'absolute', bottom: '2rem', display: 'flex', gap: '1.5rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem 2.5rem', borderRadius: 'var(--radius-pill)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
            <button style={{ width: '56px', height: '56px', borderRadius: '50%', border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#020617', transition: 'var(--transition-fast)' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
              <Mic size={24} />
            </button>
            <button style={{ width: '56px', height: '56px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition-fast)' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
              <VideoIcon size={24} />
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
                <span style={{ fontSize: '0.7rem', background: 'var(--tier-green)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>Live Feed</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', background: '#020617' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%', background: 'var(--brand-blue)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
                  boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)', animation: 'pulse 2s infinite', position: 'relative'
                }}>
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Sarah`} alt="Interviewer" style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'white', position: 'relative', zIndex: 2 }} />
                  <div style={{ position: 'absolute', width: '100%', height: '100%', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', animation: 'ripple 1.5s infinite linear', zIndex: 1 }}></div>
                </div>
                <h3 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Sarah (Interviewer) <span style={{ width: '6px', height: '6px', background: 'var(--tier-green)', borderRadius: '50%' }}></span>
                </h3>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Connection Secure...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side (Transcript) */}
        <div style={{ width: '400px', background: 'var(--bg-card)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>

          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Live Transcript</h3>
            {state.handoff_active && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--tier-red)', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🚨 A human recruiter has joined your session.
              </div>
            )}
          </div>

          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {transcript.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.sender === 'Candidate' ? 'flex-end' : 'flex-start',
                background: msg.sender === 'Candidate' ? 'var(--brand-blue)' : 'var(--bg-secondary)',
                color: msg.sender === 'Candidate' ? 'white' : 'var(--text-primary)',
                padding: '1rem',
                borderRadius: '12px',
                maxWidth: '85%',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.25rem', opacity: 0.8 }}>{msg.sender}</div>
                <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{msg.text}</div>
              </div>
            ))}
          </div>

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
      `}</style>
    </div>
  );
}
