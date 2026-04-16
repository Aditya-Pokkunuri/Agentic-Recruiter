import { useState } from 'react';
import { Activity, BrainCircuit, ShieldCheck, Zap, Heart, Server, Globe, Cpu, Clock, Terminal } from 'lucide-react';

export default function DigitalTwin() {
  const [twinData] = useState({
    name: "Sarah (v4.2-Prod)",
    status: "Optimal",
    health: {
      cognitiveLoad: 42,
      latency: 18,
      neuralUptime: "142 Days",
      empathyIndex: 94
    },
    persona: {
      traits: ["Neutral-Empathetic", "Data-First", "High Resolution Analysis"],
      voice: "Sarah-Standard-v2",
      ethicalConstraints: "Level 4 (Strict Human-in-the-loop)"
    },
    masterCases: [
      { id: 'mc1', title: 'Autonomous Hire: Senior Platform Engineer', date: '2026-03-12', outcome: 'Confirmed by CEO', efficiency: '+420%' },
      { id: 'mc2', title: 'Risk Mitigation: Fraudulent Candidate Detection', date: '2026-03-24', outcome: 'Proctored Ban', efficiency: 'Inf' },
      { id: 'mc3', title: 'Culture Sync: Diversity Hiring Initiative', date: '2026-04-05', outcome: '3 New Hires', efficiency: '+12%' }
    ]
  });

  const StatCard = ({ icon: Icon, label, value, unit, color }) => (
    <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ padding: '0.6rem', background: `rgba(${color}, 0.1)`, borderRadius: '12px', color: `rgb(${color})` }}>
          <Icon size={20} />
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>{value}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{unit}</span>
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Digital Twin Governance</h1>
          <p style={{ color: 'var(--text-muted)' }}>Managing the persona, health, and decision blueprint of your autonomous recruiter.</p>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--tier-green)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--tier-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={18} /> {twinData.status} Operation
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard icon={Activity} label="Cognitive Load" value={twinData.health.cognitiveLoad} unit="%" color="14, 165, 233" />
        <StatCard icon={Clock} label="Latency" value={twinData.health.latency} unit="ms" color="139, 92, 246" />
        <StatCard icon={Server} label="Neural Uptime" value="142" unit="Days" color="16, 185, 129" />
        <StatCard icon={Heart} label="Empathy Index" value={twinData.health.empathyIndex} unit="%" color="236, 72, 153" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Persona Column */}
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #020617' }}>
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Sarah" alt="Sarah Persona" style={{ width: '100%', borderRadius: '50%' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{twinData.name}</h2>
              <p style={{ color: 'var(--brand-blue)', fontSize: '0.85rem', fontWeight: 600 }}>Active Recruiter Persona</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Primary Traits</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {twinData.persona.traits.map(trait => (
                  <span key={trait} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>{trait}</span>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Voice Profile</p>
                <p style={{ fontWeight: 600 }}>{twinData.persona.voice}</p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Safety Gate</p>
                <p style={{ fontWeight: 600 }}>Lvl 4 Strict</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
             <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <BrainCircuit size={20} color="var(--brand-blue)" /> Architectural Blueprint
             </h3>
             <div style={{ height: '200px', background: '#020617', borderRadius: 'var(--radius-md)', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                {/* Symbolic SVG Blueprint */}
                <svg width="100%" height="100%" style={{ opacity: 0.5 }}>
                  <circle cx="20%" cy="50%" r="5" fill="var(--brand-blue)" />
                  <circle cx="50%" cy="20%" r="5" fill="var(--brand-blue)" />
                  <circle cx="50%" cy="50%" r="5" fill="var(--brand-blue)" />
                  <circle cx="50%" cy="80%" r="5" fill="var(--brand-blue)" />
                  <circle cx="80%" cy="50%" r="5" fill="var(--brand-blue)" />
                  <line x1="20%" y1="50%" x2="50%" y2="20%" stroke="var(--brand-blue)" strokeWidth="1" />
                  <line x1="20%" y1="50%" x2="50%" y2="50%" stroke="var(--brand-blue)" strokeWidth="1" />
                  <line x1="20%" y1="50%" x2="50%" y2="80%" stroke="var(--brand-blue)" strokeWidth="1" />
                  <line x1="50%" y1="20%" x2="80%" y2="50%" stroke="var(--brand-blue)" strokeWidth="1" />
                  <line x1="50%" y1="80%" x2="80%" y2="50%" stroke="var(--brand-blue)" strokeWidth="1" />
                </svg>
                <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', color: 'var(--brand-blue)', fontSize: '0.7rem', fontFamily: 'monospace' }}>Neural_Pathways_Active.v4</div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(14, 165, 233, 0.1)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--brand-blue)', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>RuneGrid Core</div>
             </div>
          </div>
        </div>

        {/* Master Cases Column */}
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Terminal size={24} color="var(--brand-blue)" /> Master Decision Cases
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {twinData.masterCases.map(mcase => (
              <div key={mcase.id} style={{ padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'var(--transition-fast)' }} onMouseOver={(e) => e.currentTarget.style.border = '1px solid var(--brand-blue)'} onMouseOut={(e) => e.currentTarget.style.border = '1px solid var(--border-subtle)'}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{mcase.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mcase.date} • <span style={{ color: 'var(--tier-green)' }}>{mcase.outcome}</span></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-blue)' }}>{mcase.efficiency}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hiring Speed</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <div style={{ padding: '1.5rem', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '16px', border: '1px dashed var(--brand-blue)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                "The Twin currently uses a <strong>Multi-Agent Consensus</strong> model for high-stakes hires, integrating signals from the LinkedIn agent, the technical proctoring agent, and the sentiment analyzer."
              </p>
            </div>
          </div>
        </div>

      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
