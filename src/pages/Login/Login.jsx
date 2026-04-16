import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';

export default function Login() {
  const { dispatch, ACTIONS } = useDemo();
  const navigate = useNavigate();

  const handleLogin = (role) => {
    if (role === 'recruiter') {
      dispatch({ type: ACTIONS.LOGIN, payload: { name: 'Sarah', role: 'recruiter' } });
      navigate('/dashboard');
    } else {
      dispatch({ type: ACTIONS.LOGIN, payload: { name: 'Arjun Mehta', role: 'candidate' } });
      navigate('/interview');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ width: '56px', height: '56px', background: 'var(--brand-blue)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
          <span style={{ color: 'white', fontWeight: 800, fontSize: '1.8rem' }}>Q</span>
        </div>
        <h1 style={{ fontWeight: 800, fontSize: '2.5rem', color: 'var(--text-primary)', letterSpacing: '-1px' }}>Qalana.AI</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Agentic Recruiter Interactive Demo</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        {/* Candidate Portal */}
        <div 
          onClick={() => handleLogin('candidate')}
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Simulate Candidate</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
            Experience the "Digital Twin" interview process from the applicant's perspective.
          </p>
          <button style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-pill)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: '1rem' }}>
            Enter Interview
          </button>
        </div>

        {/* Recruiter Portal */}
        <div 
          onClick={() => handleLogin('recruiter')}
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Simulate Recruiter</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
            Access the command center to monitor live AI agents and override sessions.
          </p>
          <button style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-pill)', background: 'var(--brand-blue)', color: 'white', border: 'none', fontWeight: 600, fontSize: '1rem', boxShadow: '0 4px 12px rgba(0, 96, 255, 0.3)' }}>
            Access Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
