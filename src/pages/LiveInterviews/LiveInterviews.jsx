import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useDemo } from '../../context/DemoContext';
import { BrainCircuit } from 'lucide-react';

export default function LiveInterviews() {
  const data = useData();
  const { state, dispatch, ACTIONS } = useDemo();
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // Mock live active sessions currently being handled by the Twin
  const [activeSessions] = useState([
    { id: 'sess1', candidate: 'Arjun Mehta', role: 'Senior Backend Engineer', round: 'System Design', elapsed: '14m 20s', score: 87 },
    { id: 'sess2', candidate: 'David Kim', role: 'Frontend Developer', round: 'Live Coding', elapsed: '05m 12s', score: 92 },
    { id: 'sess3', candidate: 'Sanya Gupta', role: 'Product Manager', round: 'Screening Call', elapsed: '21m 45s', score: 68 }
  ]);

  const [liveTranscript, setLiveTranscript] = useState([
    { sender: 'AI Twin', text: "Can you explain how you would handle stale cache data during a high-traffic spike?" },
    { sender: 'Candidate', text: "I would implement a cache-aside pattern with a reasonable TTL, plus a background worker to asynchronously refresh keys before they expire." }
  ]);

  // Simulate incoming live transcript while spectating
  useEffect(() => {
    if (!selectedSessionId || state.handoff_active) return;
    
    const timers = [
      setTimeout(() => setLiveTranscript(prev => [...prev, { sender: 'AI Twin', text: "That introduces eventual consistency. How does the frontend handle serving slightly stale data to users?" }]), 4000),
      setTimeout(() => setLiveTranscript(prev => [...prev, { sender: 'Candidate', text: "Our UI would need optimistic rendering and perhaps a polling fallback if absolute freshness is suddenly required." }]), 9000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [selectedSessionId, state.handoff_active]);

  const handleTakeOver = () => {
    dispatch({ type: ACTIONS.OVERRIDE_TWIN });
  };

  const selectedSession = activeSessions.find(s => s.id === selectedSessionId);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Live Twin Interviews</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitoring active autonomous sessions.</p>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderTop: '2px solid var(--tier-red)' }}>
          <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--tier-red)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
            Live Now: <span style={{ color: 'var(--text-primary)' }}>{activeSessions.length}</span>
          </p>
        </div>
      </div>

      {!selectedSessionId ? (
        // Grid View
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {activeSessions.map(session => (
            <div 
              key={session.id} 
              onClick={() => setSelectedSessionId(session.id)}
              style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'var(--transition-fast)' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{session.candidate}</h3>
                <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--tier-red)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>🔴 {session.elapsed}</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{session.role}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--brand-blue)', fontWeight: 500, marginBottom: '1.5rem' }}>Current: {session.round}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Twin Confidence</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: session.score > 80 ? 'var(--tier-green)' : 'var(--tier-amber)' }}>{session.score}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Spectator / Under-the-hood View
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <div>
              <button 
                onClick={() => setSelectedSessionId(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
              >
                ← Back to Grid
              </button>
              <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {selectedSession.candidate} 
                <span style={{ fontSize: '0.8rem', background: '#020617', color: 'var(--brand-blue)', padding: '0.25rem 0.75rem', borderRadius: '1rem', border: '1px solid #1e293b' }}>Spectator Mode</span>
              </h2>
            </div>

            {state.handoff_active ? (
              <div style={{ background: 'var(--tier-green)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-pill)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✅ Human Control Active
              </div>
            ) : (
              <button 
                onClick={handleTakeOver}
                style={{ background: 'white', color: 'var(--tier-red)', border: '2px solid var(--tier-red)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-pill)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
              >
                🚨 Take Over Interview
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: '500px' }}>
            
            {/* Live Feed Simulator */}
            <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
              
              {/* Fake Video Streams */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#020617', height: '220px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #1e293b', position: 'relative', overflow: 'hidden' }}>
                  <img src={selectedSession.id === 'sess1' ? '/candidate_feed.png' : `https://api.dicebear.com/7.x/notionists/svg?seed=${selectedSession.candidate}`} alt="Candidate" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', bottom: '1rem', left: '1rem', color: 'white', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', padding: '0.2rem 0.5rem', borderRadius: '4px', backdropFilter: 'blur(4px)' }}>{selectedSession.candidate}</span>
                </div>
                
                {state.handoff_active ? (
                  <div style={{ background: '#020617', height: '220px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--tier-green)', position: 'relative' }}>
                    <h3 style={{ color: 'var(--tier-green)' }}>You (Recruiter)</h3>
                  </div>
                ) : (
                  <div style={{ background: '#020617', height: '220px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #1e293b', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', opacity: 0.8, animation: 'pulse 2s infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <BrainCircuit size={32} color="white" />
                    </div>
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                      <span style={{ color: 'var(--brand-blue)', fontSize: '0.8rem', background: 'rgba(14, 165, 233, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'block', marginBottom: '0.5rem' }}>Digital Twin S-4 Active</span>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace' }}>[LOG]: Analyzing_Semantics...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Transcript / Control Chat */}
              <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', overflowY: 'auto' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>Live Transcript Flow</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {liveTranscript.map((msg, idx) => (
                    <div key={idx} style={{ paddingBottom: '0.5rem', borderBottom: '1px dashed var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: msg.sender === 'Candidate' ? 'var(--text-secondary)' : 'var(--brand-blue)', textTransform: 'uppercase' }}>{msg.sender}</span>
                      <p style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}>{msg.text}</p>
                    </div>
                  ))}
                  {state.handoff_active && (
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px dashed var(--tier-green)', borderRadius: '8px', color: 'var(--tier-green)' }}>
                      <p style={{ fontWeight: 600 }}>You are now actively speaking to the candidate.</p>
                      <input type="text" placeholder="Type message to candidate..." style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', borderRadius: '4px', border: '1px solid var(--tier-green)', background: 'white' }} />
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Rubric Telemetry Sidebar */}
            <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brain Telemetry</h4>
              
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--tier-green)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Current Rubric Score</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 700 }}>87</span><span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Key Signals Detected</p>
                <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>Strong knowledge of caching patterns.</li>
                  <li>Good communication of tradeoffs.</li>
                  <li style={{ color: 'var(--tier-amber)' }}>Hesitant on CAP theorem specifics.</li>
                </ul>
              </div>
              
              {state.handoff_active && (
                <div style={{ marginTop: 'auto', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--tier-red)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--tier-red)', fontWeight: 600, textAlign: 'center' }}>Twin Autonomy Paused</p>
                </div>
              )}
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
      `}</style>
    </div>
  );
}
