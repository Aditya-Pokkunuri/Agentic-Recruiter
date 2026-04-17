import { useState } from 'react';
import { Plus, Terminal, CheckCircle2, Zap, BrainCircuit, X } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';

export default function MasterCaseStudio() {
  const { state, dispatch, ACTIONS } = useDemo();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCase, setNewCase] = useState({
    title: '',
    scenario: '',
    action: '',
    outcome: '',
    efficiency: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const caseData = {
      ...newCase,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0]
    };
    dispatch({ type: ACTIONS.ADD_MASTER_CASE, payload: caseData });
    setShowAddForm(false);
    setNewCase({ title: '', scenario: '', action: '', outcome: '', efficiency: '' });
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Expert Inference Studio</h2>
          <p style={{ color: 'var(--text-muted)' }}>Hardening your Twin's reasoning by recording high-stakes professional victories.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          style={{ background: 'var(--brand-blue)', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-pill)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 96, 255, 0.3)' }}
        >
          <Plus size={18} /> Record Master Case
        </button>
      </div>

      {showAddForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(2, 6, 23, 0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '700px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', animation: 'scaleUp 0.3s' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <BrainCircuit size={20} color="var(--brand-blue)" /> New Inference Case
              </h3>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Case Title</label>
                <input required value={newCase.title} onChange={e => setNewCase({...newCase, title: e.target.value})} placeholder="e.g. Navigating Team Restructuring" style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.8rem 1rem', color: '#020617' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Problem Scenario</label>
                  <textarea required value={newCase.scenario} onChange={e => setNewCase({...newCase, scenario: e.target.value})} placeholder="What was the challenge?" style={{ width: '100%', minHeight: '100px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.8rem 1rem', color: '#020617' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Expert Action</label>
                  <textarea required value={newCase.action} onChange={e => setNewCase({...newCase, action: e.target.value})} placeholder="What was your move?" style={{ width: '100%', minHeight: '100px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.8rem 1rem', color: '#020617' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Outcome</label>
                  <input required value={newCase.outcome} onChange={e => setNewCase({...newCase, outcome: e.target.value})} placeholder="What happened?" style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.8rem 1rem', color: '#020617' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Efficiency (e.g. +20%)</label>
                  <input value={newCase.efficiency} onChange={e => setNewCase({...newCase, efficiency: e.target.value})} placeholder="+0%" style={{ width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.8rem 1rem', color: '#020617' }} />
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', textAlign: 'right' }}>
              <button type="submit" style={{ background: 'var(--brand-blue)', color: 'white', border: 'none', padding: '0.8rem 2.5rem', borderRadius: 'var(--radius-pill)', fontWeight: 700, cursor: 'pointer' }}>Commit to Neural Engine</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {(state.masterCases || []).map(mcase => (
          <div key={mcase.id} style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', borderLeft: '4px solid var(--brand-blue)', boxShadow: 'var(--shadow-sm)', transition: '0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
               <div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>{mcase.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Case Recorded on {mcase.date}</p>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-blue)' }}>{mcase.efficiency || 'N/A'}</span>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Efficiency Lift</p>
               </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
               <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>Scenario</p>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{mcase.scenario}</p>
               </div>
               <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>Expert Action</p>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{mcase.action}</p>
               </div>
               <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>Outcome</p>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--tier-green)', fontWeight: 600 }}>{mcase.outcome}</p>
               </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
