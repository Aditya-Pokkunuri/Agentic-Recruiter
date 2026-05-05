import { useCopilot } from '../../hooks/useCopilot';
import { 
  Download,
  Mic, 
  MicOff, 
  Activity, 
  Database, 
  Layers, 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BrainCircuit,
  MessageSquareQuote,
  Volume2,
  Headphones,
  Waves,
  MessageCircle
} from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

export default function Journalist() {
  const lastPromptRef = useRef("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const {
    isRecording,
    transcript,
    currentChunk,
    copilotState,
    dgStatus,
    beStatus,
    startInterview,
    stopInterview
  } = useCopilot({
    knowledgeModules: [], // Standalone mode: no initial modules
    masterCases: []       // Standalone mode: no initial cases
  });

  // Automatic TTS when a new prompt is generated
  useEffect(() => {
    const newPrompt = copilotState?.next_suggested_prompt?.text;
    if (newPrompt && newPrompt !== lastPromptRef.current && isRecording) {
      lastPromptRef.current = newPrompt;
      
      // Automatic Speech
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(newPrompt);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [copilotState?.next_suggested_prompt?.text, isRecording]);

  const handleExport = () => {
    if (!transcript && !copilotState) {
      alert("No data to export yet.");
      return;
    }

    const exportData = {
      timestamp: new Date().toISOString(),
      session_id: "agentic-recruiter-session",
      transcript: transcript,
      cognitive_analysis: {
        final_state: copilotState?.expert_cognitive_state,
        final_phase: copilotState?.current_interview_phase,
        avg_depth_score: copilotState?.topic_depth_score,
      },
      extracted_knowledge: {
        frameworks: copilotState?.detected_frameworks || [],
        insights: copilotState?.key_insights || [],
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `implicit_knowledge_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    if (status === 'connected') return '#22c55e'; // green-500
    if (status === 'connecting') return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const getEnergyIcon = (trend) => {
    if (trend === 'increasing') return <TrendingUp size={16} color="#4ade80" />;
    if (trend === 'declining') return <TrendingDown size={16} color="#f87171" />;
    return <Minus size={16} color="#94a3b8" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', background: 'var(--bg-primary)', overflow: 'hidden', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-lg)' }}>
      {/* --- Top Bar --- */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BrainCircuit size={24} color="var(--brand-blue)" />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>AI Journalist Copilot</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(dgStatus), boxShadow: `0 0 8px ${getStatusColor(dgStatus)}` }} />
              <span style={{ color: 'var(--text-muted)' }}>Deepgram</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(beStatus), boxShadow: `0 0 8px ${getStatusColor(beStatus)}` }} />
              <span style={{ color: 'var(--text-muted)' }}>Backend</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleExport}
            disabled={!transcript && !copilotState}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', cursor: (!transcript && !copilotState) ? 'not-allowed' : 'pointer', opacity: (!transcript && !copilotState) ? 0.5 : 1 }}
          >
            <Download size={16} /> Export
          </button>

          <button
            onClick={isRecording ? stopInterview : startInterview}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
              background: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'var(--brand-blue)',
              color: isRecording ? '#ef4444' : 'white',
              border: isRecording ? '1px solid rgba(239, 68, 68, 0.5)' : 'none',
              boxShadow: isRecording ? 'none' : '0 4px 14px rgba(0, 96, 255, 0.3)'
            }}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            {isRecording ? 'End Interview' : 'Start Interview'}
          </button>
        </div>
      </header>

      {/* --- Main Dashboard --- */}
      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* --- Left Sidebar: Telemetry --- */}
        <aside style={{ width: '280px', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} /> Cognitive State
            </h2>
            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'capitalize', color: 'var(--brand-blue)' }}>
                {copilotState?.expert_cognitive_state || 'Waiting...'}
              </div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Phase: <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{copilotState?.current_interview_phase || 'Rapport'}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={16} /> Energy & Depth
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Energy Level</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {getEnergyIcon(copilotState?.energy_trend || 'stable')}
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{(copilotState?.expert_energy_level || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div style={{ height: '6px', width: '100%', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--brand-blue)', transition: 'width 0.5s ease', width: `${(copilotState?.expert_energy_level || 0) * 100}%` }} />
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Topic Depth</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{(copilotState?.topic_depth_score || 0).toFixed(2)}</span>
                </div>
                <div style={{ height: '6px', width: '100%', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--tier-green)', transition: 'width 0.5s ease', width: `${(copilotState?.topic_depth_score || 0) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} /> Session Roadmap
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['rapport', 'exploration', 'deep_dive', 'framework_extraction', 'synthesis'].map((phase, idx) => {
                const isActive = copilotState?.current_interview_phase === phase;
                const isPast = ['rapport', 'exploration', 'deep_dive', 'framework_extraction', 'synthesis'].indexOf(copilotState?.current_interview_phase) > idx;
                return (
                  <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: (isActive || isPast) ? 1 : 0.4 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid', borderColor: isPast ? 'var(--tier-green)' : (isActive ? 'var(--brand-blue)' : 'var(--border-subtle)'), background: isPast ? 'var(--tier-green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isPast && <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%' }} />}
                      {isActive && <div style={{ width: '6px', height: '6px', background: 'var(--brand-blue)', borderRadius: '50%', animation: 'pulseAnim 1s infinite' }} />}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: (isActive || isPast) ? 700 : 500, color: isActive ? 'var(--brand-blue)' : 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {phase.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* --- Center Stage: Prompter --- */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: isSpeaking ? 'var(--brand-blue)' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
             {isRecording ? (
               <>
                 {isSpeaking ? (
                   <>
                     <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {[1,2,3].map(i => (
                          <div key={i} style={{ width: '6px', height: '6px', background: 'var(--brand-blue)', borderRadius: '50%', animation: `pulseAnim 1s infinite ${i * 0.2}s` }} />
                        ))}
                     </div>
                     <span style={{ letterSpacing: '2px' }}>AI IS SPEAKING...</span>
                   </>
                 ) : (
                   <>
                     <div style={{ display: 'flex', gap: '2px' }}>
                        {[1,2,3,4,5].map(i => (
                          <div key={i} style={{ width: '3px', height: '12px', background: 'var(--brand-blue)', borderRadius: '2px', animation: `waveAnim 1s ease-in-out infinite ${i * 0.1}s` }} />
                        ))}
                     </div>
                     <span>AI IS LISTENING...</span>
                   </>
                 )}
               </>
             ) : (
               <span>READY TO START INTERVIEW</span>
             )}
          </div>

          {copilotState?.next_suggested_prompt?.text ? (
            <div style={{ maxWidth: '800px', animation: 'fadeIn 0.5s' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-pill)', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.3)', color: 'var(--brand-blue)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>
                <Lightbulb size={12} />
                Strategy: {copilotState.active_prompt_strategy}
              </div>
              <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '2rem', color: 'var(--text-primary)' }}>
                "{copilotState.next_suggested_prompt.text}"
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontStyle: 'italic', maxWidth: '600px', margin: '0 auto', fontWeight: 500 }}>
                {copilotState.next_suggested_prompt.reasoning}
              </p>
              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <div style={{ height: '1px', width: '40px', background: 'var(--border-subtle)' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Confidence: {((copilotState.next_suggested_prompt.confidence || 0) * 100).toFixed(0)}%
                </span>
                <div style={{ height: '1px', width: '40px', background: 'var(--border-subtle)' }} />
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      const utterance = new SpeechSynthesisUtterance(copilotState.next_suggested_prompt.text);
                      utterance.rate = 0.95;
                      utterance.pitch = 1.0;
                      window.speechSynthesis.speak(utterance);
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--brand-blue)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Volume2 size={16} /> Speak Prompt
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '4px solid var(--border-subtle)', borderTopColor: 'var(--brand-blue)', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', animation: 'pulseAnim 2s infinite' }}>Waiting for expert insight...</p>
            </div>
          )}
        </section>

        {/* --- Right Sidebar: Frameworks --- */}
        <aside style={{ width: '320px', borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
          <div>
            <h2 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={16} /> Extracted Frameworks
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(copilotState?.detected_frameworks || []).map((fw, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border-subtle)', transition: 'border-color 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--brand-blue)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-blue)', margin: '0 0 0.25rem 0' }}>{fw.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: '0 0 0.5rem 0', fontStyle: 'italic', fontWeight: 500 }}>"{fw.core_principle}"</p>
                  {fw.actionable_steps && fw.actionable_steps.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {fw.actionable_steps.map((step, si) => (
                         <li key={si} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{step}</li>
                      ))}
                    </ul>
                  )}
                  <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Source: {fw.source_quote}
                  </div>
                </div>
              ))}
              {(!copilotState?.detected_frameworks?.length) && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>No frameworks detected yet.</div>
              )}
            </div>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquareQuote size={16} /> Key Insights
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(copilotState?.key_insights || []).map((insight, i) => (
                <div key={i} style={{ background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--tier-green)', margin: 0, fontStyle: 'italic' }}>"{insight}"</p>
                </div>
              ))}
              {(!copilotState?.key_insights?.length) && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>Awaiting novel insights.</div>
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* --- Bottom Ticker --- */}
      <footer style={{ height: '80px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', padding: '0 1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, marginRight: '1rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isRecording ? '#ef4444' : 'var(--text-muted)', animation: isRecording ? 'pulseAnim 2s infinite' : 'none' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Current Session</span>
        </div>
        <div style={{ 
          fontSize: '0.85rem', 
          color: 'var(--text-secondary)', 
          flex: 1, 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            whiteSpace: 'normal', 
            fontFamily: 'monospace',
            maxHeight: '100%',
            overflowY: 'hidden',
            padding: '10px 0',
            lineHeight: '1.4',
            fontSize: '1.1rem',
            color: 'var(--brand-blue)',
            fontWeight: 600
          }}>
            {currentChunk || (isRecording ? 'Listening for your insights...' : 'Microphone inactive...')}
          </div>
        </div>
      </footer>
      
      <style>{`
        @keyframes scrollText {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseAnim { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes waveAnim {
          0%, 100% { height: 8px; transform: translateY(0); }
          50% { height: 20px; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
