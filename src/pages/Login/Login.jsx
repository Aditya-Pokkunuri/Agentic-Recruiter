import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { Copy, Check, Loader2, ArrowRight, Users, Zap, Sparkles, Wifi, Monitor } from 'lucide-react';
import roomService from '../../services/RoomService';

export default function Login() {
  const { dispatch, ACTIONS, state } = useDemo();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null); // null | 'recruiter_waiting' | 'candidate_join'
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [peerConnected, setPeerConnected] = useState(false);
  const [networkMode, setNetworkMode] = useState(false);
  const [serverUrl, setServerUrl] = useState('ws://localhost:4000');

  // Listen for peer connections
  useEffect(() => {
    const unsubJoin = roomService.on('peerJoined', ({ role }) => {
      setPeerConnected(true);
      dispatch({ type: ACTIONS.PEER_JOINED });
      
      // Small delay for the animation to show "Connected!"
      setTimeout(() => {
        if (roomService.role === 'recruiter') {
          dispatch({ type: ACTIONS.LOGIN, payload: { name: 'Sarah', role: 'recruiter' } });
          navigate('/interviews');
        } else {
          dispatch({ type: ACTIONS.LOGIN, payload: { name: 'Arjun Mehta', role: 'candidate' } });
          navigate('/interview');
        }
      }, 1200);
    });

    return () => {
      unsubJoin();
    };
  }, [dispatch, ACTIONS, navigate]);

  const handleRecruiterLogin = () => {
    if (networkMode && serverUrl) {
      roomService.setServerUrl(serverUrl.trim());
    }
    dispatch({ type: ACTIONS.LOGIN, payload: { name: 'Sarah', role: 'recruiter' } });
    navigate('/dashboard');
  };

  const handleCandidateStart = () => {
    setMode('candidate_join');
  };

  const handleCandidateJoin = () => {
    if (!inputCode.trim()) {
      setError('Please enter the room code');
      return;
    }
    if (networkMode && serverUrl) {
      roomService.setServerUrl(serverUrl.trim());
    }
    const code = inputCode.toUpperCase().trim();
    roomService.joinRoom(code, 'candidate');
    dispatch({ type: ACTIONS.SET_ROOM, payload: code });
    dispatch({ type: ACTIONS.SET_CONNECTION_STATUS, payload: 'connecting' });
    setRoomCode(code);
    setPeerConnected(true);

    setTimeout(() => {
      dispatch({ type: ACTIONS.PEER_JOINED });
      dispatch({ type: ACTIONS.LOGIN, payload: { name: 'Arjun Mehta', role: 'candidate' } });
      navigate('/interview');
    }, 800);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Recruiter Waiting Screen
  if (mode === 'recruiter_waiting') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', animation: 'fadeIn 0.5s ease-out' }}>
          
          {/* Logo */}
          <div style={{ width: '56px', height: '56px', background: 'var(--brand-blue)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.8rem' }}>Q</span>
          </div>

          {peerConnected ? (
            /* Connected State */
            <div style={{ animation: 'scaleIn 0.4s ease-out' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', border: '3px solid var(--tier-green)' }}>
                <Check size={36} color="var(--tier-green)" />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--tier-green)', marginBottom: '0.5rem' }}>Candidate Connected!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Entering interview chamber...</p>
            </div>
          ) : (
            /* Waiting State */
            <>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Interview Room Created</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2.5rem' }}>Share this code with the candidate to begin</p>

              {/* Room Code Card */}
              <div style={{
                background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--radius-xl)',
                boxShadow: '0 20px 60px -15px rgba(0, 96, 255, 0.15)', border: '2px solid var(--brand-blue)',
                marginBottom: '2rem', position: 'relative', overflow: 'hidden'
              }}>
                {/* Subtle gradient background */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--brand-blue), #8b5cf6, var(--brand-blue))', backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }}></div>
                
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, marginBottom: '1rem' }}>Room Code</p>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '4px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{roomCode}</span>
                  <button 
                    onClick={copyCode}
                    style={{
                      background: copied ? 'var(--tier-green)' : 'var(--bg-secondary)',
                      border: `1px solid ${copied ? 'var(--tier-green)' : 'var(--border-subtle)'}`,
                      color: copied ? 'white' : 'var(--text-secondary)',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              {/* Waiting Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '1rem' }}>Waiting for candidate to join...</span>
              </div>

              {/* Back Button */}
              <button 
                onClick={() => { roomService.leave(); setMode(null); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
              >
                ← Cancel and go back
              </button>
            </>
          )}
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        `}</style>
      </div>
    );
  }

  // Candidate Join Screen
  if (mode === 'candidate_join') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', animation: 'fadeIn 0.5s ease-out' }}>
          
          <div style={{ width: '56px', height: '56px', background: 'var(--brand-blue)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.8rem' }}>Q</span>
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Join Interview Room</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2.5rem' }}>Enter the room code provided by your recruiter</p>

          {/* Room Code Input */}
          <div style={{
            background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)',
            marginBottom: '2rem'
          }}>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => { setInputCode(e.target.value.toUpperCase()); setError(''); }}
              placeholder="QAL-XXXX"
              maxLength={8}
              style={{
                width: '100%',
                textAlign: 'center',
                fontSize: '2.5rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '4px',
                padding: '1rem',
                background: 'var(--bg-secondary)',
                border: `2px solid ${error ? 'var(--tier-red)' : 'var(--border-subtle)'}`,
                borderRadius: '12px',
                color: 'var(--text-primary)',
                transition: 'border-color 200ms ease'
              }}
              onFocus={(e) => { if (!error) e.target.style.borderColor = 'var(--brand-blue)'; }}
              onBlur={(e) => { if (!error) e.target.style.borderColor = 'var(--border-subtle)'; }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCandidateJoin(); }}
              autoFocus
            />
            {error && <p style={{ color: 'var(--tier-red)', fontSize: '0.85rem', marginTop: '0.75rem' }}>{error}</p>}
          </div>

          <button 
            onClick={handleCandidateJoin}
            style={{
              background: 'var(--brand-blue)', color: 'white', border: 'none',
              padding: '1rem 3rem', borderRadius: 'var(--radius-pill)',
              fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(0, 96, 255, 0.3)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              margin: '0 auto', transition: 'all 200ms ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
          >
            <ArrowRight size={20} /> Join Interview
          </button>

          <button 
            onClick={() => setMode(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline', marginTop: '1.5rem' }}
          >
            ← Back to selection
          </button>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  // Default — Role Selection Screen
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ width: '56px', height: '56px', background: 'var(--brand-blue)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: '1.8rem' }}>Q</span>
        </div>
        <h1 style={{ fontWeight: 800, fontSize: '2.5rem', color: 'var(--text-primary)', letterSpacing: '-1px' }}>Qalana.AI</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Agentic Recruiter — Real-Time Interview</p>
      </div>

      {/* Network Mode Toggle */}
      <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div 
          onClick={() => setNetworkMode(!networkMode)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer',
            background: 'var(--bg-card)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-pill)',
            border: `1px solid ${networkMode ? 'var(--brand-blue)' : 'var(--border-subtle)'}`,
            transition: 'all 200ms ease'
          }}
        >
          {networkMode ? <Wifi size={16} color="var(--brand-blue)" /> : <Monitor size={16} color="var(--text-muted)" />}
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: networkMode ? 'var(--brand-blue)' : 'var(--text-muted)' }}>
            {networkMode ? 'Network Mode (Two Computers)' : 'Local Mode (Same Computer)'}
          </span>
          <div style={{ 
            width: '36px', height: '20px', borderRadius: '10px', position: 'relative', cursor: 'pointer',
            background: networkMode ? 'var(--brand-blue)' : 'var(--border-subtle)', transition: 'background 200ms ease'
          }}>
            <span style={{ 
              position: 'absolute', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'left 200ms ease',
              left: networkMode ? '18px' : '2px'
            }}></span>
          </div>
        </div>
        {networkMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 0.3s ease-out' }}>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="ws://192.168.x.x:4000"
              style={{
                padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)', width: '280px', textAlign: 'center'
              }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Run: node server.js</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        {/* Candidate Portal */}
        <div 
          onClick={handleCandidateStart}
          style={{
            background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)',
            width: '100%', maxWidth: '350px', cursor: 'pointer', transition: 'var(--transition-fast)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
        >
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '2.5rem' }}>
            🤝
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Join as Candidate</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
            Enter the room code to join a live interview session with the AI Twin.
          </p>
          <button style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-pill)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Users size={18} /> Enter Interview
          </button>
        </div>

        {/* Recruiter Portal */}
        <div 
          onClick={handleRecruiterLogin}
          style={{
            background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-card)', border: '2px solid var(--brand-blue)',
            width: '100%', maxWidth: '350px', cursor: 'pointer', transition: 'var(--transition-fast)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
        >
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0, 96, 255, 0.1)', color: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '2.5rem' }}>
            ⚡
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Start as Recruiter</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
            Create an interview room. The AI Twin will conduct the interview while you spectate.
          </p>
          <button style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-pill)', background: 'var(--brand-blue)', color: 'white', border: 'none', fontWeight: 600, fontSize: '1rem', boxShadow: '0 4px 12px rgba(0, 96, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Zap size={18} /> Create Room
          </button>
        </div>

      </div>
    </div>
  );
}
