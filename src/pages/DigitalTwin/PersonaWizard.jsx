import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, BrainCircuit, Sparkles, CheckCircle2, Terminal, Loader2 } from 'lucide-react';
import { useDemo } from '../../context/DemoContext';

export default function PersonaWizard({ onComplete }) {
  const { state, dispatch, ACTIONS } = useDemo();
  
  // Local state
  const [phase, setPhase] = useState('precheck'); // 'precheck', 'generating_scenarios', 'qa', 'synthesizing', 'results'
  const [scenarios, setScenarios] = useState([]);
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // scenario title -> answer text
  const [localManifest, setLocalManifest] = useState(null);

  // Stats
  const mcCount = state.masterCases?.length || 0;
  const khCount = state.knowledgeModules?.length || 0;

  // --- Phase 1: Pre-check & Generate Scenarios ---
  const handleStartTraining = async () => {
    if (mcCount === 0) {
      alert("You need at least 1 Master Case to generate meaningful scenarios.");
      return;
    }

    setPhase('generating_scenarios');
    
    try {
      const response = await fetch('http://localhost:8000/api/persona/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          master_cases: state.masterCases,
          knowledge_hub_summaries: state.knowledgeModules.map(m => m.name),
          expert_name: state.user?.name || "Expert"
        })
      });
      
      const data = await response.json();
      if (data.scenarios && data.scenarios.length > 0) {
        setScenarios(data.scenarios);
        setPhase('qa');
      } else {
        throw new Error("No scenarios generated");
      }
    } catch (error) {
      console.error("Failed to generate scenarios:", error);
      alert("Failed to generate scenarios. Make sure the Python backend is running on port 8000.");
      setPhase('precheck');
    }
  };

  // --- Phase 2: Scenario Q&A ---
  const handleNextScenario = () => {
    if (currentScenarioIdx < scenarios.length - 1) {
      setCurrentScenarioIdx(prev => prev + 1);
    } else {
      handleSynthesize();
    }
  };

  const handlePrevScenario = () => {
    if (currentScenarioIdx > 0) {
      setCurrentScenarioIdx(prev => prev - 1);
    }
  };

  const updateAnswer = (scenarioTitle, text) => {
    setAnswers(prev => ({ ...prev, [scenarioTitle]: text }));
  };

  // --- Phase 3: Synthesizing ---
  const handleSynthesize = async () => {
    setPhase('synthesizing');

    // Convert answers into new Master Cases
    const newMasterCases = scenarios.map(s => ({
      id: `mc_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: s.title,
      scenario: s.scenario,
      action: answers[s.title] || "No response provided",
      outcome: "Hypothetical Outcome",
      date: new Date().toISOString().split('T')[0]
    }));

    // Add new MCs to global state
    newMasterCases.forEach(mc => {
      dispatch({ type: ACTIONS.ADD_MASTER_CASE, payload: mc });
    });

    const allMasterCases = [...state.masterCases, ...newMasterCases];

    try {
      const response = await fetch('http://localhost:8000/api/persona/manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          all_master_cases: allMasterCases,
          expert_name: state.user?.name || "Expert"
        })
      });

      const data = await response.json();
      setLocalManifest(data.persona_manifest);
      setPhase('results');
    } catch (error) {
      console.error("Failed to synthesize manifest:", error);
      alert("Failed to generate manifest.");
      setPhase('qa'); // Go back to last question
    }
  };

  // --- Phase 4: Confirm ---
  const handleConfirm = () => {
    dispatch({ type: ACTIONS.SET_PERSONA_MANIFEST, payload: localManifest });
    onComplete();
  };

  // --- Renders ---

  if (phase === 'precheck') {
    return (
      <div style={{ animation: 'slideRight 0.4s ease-out' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Persona DNA Extraction</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
          We will analyze your recorded knowledge and past cases to generate realistic situational challenges. 
          By answering how you would handle them, Sarah will learn your unique communication style, tone, and thinking patterns.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--brand-blue)', marginBottom: '0.5rem' }}>{mcCount}</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Master Cases Ready</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Foundational decision patterns</div>
          </div>
          <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--brand-blue)', marginBottom: '0.5rem' }}>{khCount}</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Knowledge Modules</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Domain context loaded</div>
          </div>
        </div>

        <button 
          onClick={handleStartTraining}
          disabled={mcCount === 0}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', background: mcCount > 0 ? 'var(--brand-blue)' : 'var(--bg-secondary)', color: mcCount > 0 ? 'white' : 'var(--text-muted)', border: 'none', padding: '1rem', borderRadius: 'var(--radius-pill)', fontWeight: 700, cursor: mcCount > 0 ? 'pointer' : 'not-allowed', boxShadow: mcCount > 0 ? '0 4px 14px rgba(0, 96, 255, 0.3)' : 'none' }}
        >
          {mcCount > 0 ? (
            <>Generate Contextual Scenarios <Sparkles size={18} /></>
          ) : (
            "Record at least 1 Master Case first"
          )}
        </button>
      </div>
    );
  }

  if (phase === 'generating_scenarios') {
    return (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
        <Loader2 size={48} color="var(--brand-blue)" style={{ animation: 'spin 2s linear infinite', marginBottom: '2rem' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Architecting Scenarios</h2>
        <p style={{ color: 'var(--text-muted)' }}>Reading Knowledge Hub and Master Cases to generate highly specific challenges...</p>
      </div>
    );
  }

  if (phase === 'synthesizing') {
    return (
      <div style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
        <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', border: '2px solid var(--brand-blue)', position: 'relative' }}>
          <BrainCircuit size={48} color="var(--brand-blue)" className="pulse-slow" />
          <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px dashed var(--brand-blue)', animation: 'spin 10s linear infinite' }}></div>
        </div>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Extracting Communication DNA</h2>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
          [SYS]: Analyzing Master Cases... <br/>
          [NLP]: Distilling communication tone... <br/>
          [LOGIC]: Mapping decision heuristics...
        </p>
      </div>
    );
  }

  if (phase === 'results' && localManifest) {
    return (
      <div style={{ animation: 'slideRight 0.4s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--tier-green)', marginBottom: '1rem' }}>
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Persona Manifest Extracted</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Sarah will now mirror your communication style and thinking patterns.</p>
        </div>

        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>Communication Style</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{localManifest.communication_style}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>Thinking Pattern</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{localManifest.thinking_pattern}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>Tone</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{localManifest.tone}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>Energy Signature</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{localManifest.energy_signature}</div>
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.75rem' }}>Signature Patterns</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(localManifest.signature_patterns || []).map((p, i) => (
                <span key={i} style={{ padding: '0.25rem 0.75rem', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--brand-blue)', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', fontWeight: 600 }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleConfirm}
          style={{ width: '100%', padding: '1rem', background: 'var(--brand-blue)', color: 'white', border: 'none', borderRadius: 'var(--radius-pill)', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 96, 255, 0.3)' }}
        >
          Confirm & Activate Persona
        </button>
      </div>
    );
  }

  // default to 'qa' phase
  const currentScenario = scenarios[currentScenarioIdx];
  if (!currentScenario) return null;

  return (
    <div style={{ animation: 'slideRight 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Scenario {currentScenarioIdx + 1} of {scenarios.length}
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{currentScenario.title}</h2>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {scenarios.map((_, idx) => (
            <div key={idx} style={{ width: '24px', height: '4px', borderRadius: '2px', background: idx <= currentScenarioIdx ? 'var(--brand-blue)' : 'var(--bg-secondary)' }}></div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--brand-blue)', marginBottom: '2rem' }}>
        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          {currentScenario.scenario}
        </p>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BrainCircuit size={14} /> {currentScenario.context}
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          How would you handle this? What specific actions would you take?
        </label>
        <textarea 
          value={answers[currentScenario.title] || ''}
          onChange={(e) => updateAnswer(currentScenario.title, e.target.value)}
          placeholder="Type your response here. Write naturally, as if you are explaining it to a colleague..."
          style={{ width: '100%', minHeight: '150px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem', color: 'var(--text-primary)', fontSize: '0.95rem', resize: 'vertical', transition: 'var(--transition-fast)' }}
          onFocus={(e) => e.target.style.borderColor = 'var(--brand-blue)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem' }}>
        <button 
          onClick={handlePrevScenario}
          disabled={currentScenarioIdx === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: currentScenarioIdx === 0 ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
        >
          <ArrowLeft size={18} /> Previous
        </button>
        <button 
          onClick={handleNextScenario}
          disabled={!(answers[currentScenario.title]?.length > 10)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: (answers[currentScenario.title]?.length > 10) ? 'var(--brand-blue)' : 'var(--bg-secondary)', color: (answers[currentScenario.title]?.length > 10) ? 'white' : 'var(--text-muted)', border: 'none', padding: '0.8rem 2.5rem', borderRadius: 'var(--radius-pill)', fontWeight: 700, cursor: (answers[currentScenario.title]?.length > 10) ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
        >
          {currentScenarioIdx === scenarios.length - 1 ? 'Analyze DNA' : 'Next Scenario'} <ArrowRight size={18} />
        </button>
      </div>

      <style>{`
        @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pulse-slow { animation: pulseAnim 3s infinite; }
        @keyframes pulseAnim { 0% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 0.8; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
