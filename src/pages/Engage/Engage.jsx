import { useState, useEffect } from 'react';
import { Mail, CheckCircle2, XCircle, BrainCircuit, AlertCircle, PlaySquare, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Engage() {
  const [candidates] = useState({
    selected: [
      {
        id: 'c1',
        name: 'Arjun Mehta',
        role: 'Senior Backend Engineer',
        score: 94,
        image: '/candidate_feed.png',
        reasoning: "Demonstrated exceptional understanding of distributed systems architecture, specifically regarding Redis caching and sliding window rate limiting. Clear communication and flawless code implementation during the proctored exam.",
        emailStatus: 'sent',
        transcript: [
          { sender: 'Twin S-4', type: 'thought', text: '[SYS_INIT]: BOOTSTRAPPING_SESSION. TARGET_ROLE="Senior Backend Engineer". LOADING_RUBRICS: [Distributed_Systems, System_Design]. SYNC_OVERHEAD: 12ms.' },
          { sender: 'Twin S-4', type: 'thought', text: '[VISUAL_SENTIMENT]: Candidate posture indicates high confidence. Pulse-rate estimation: 72bpm (Stable). [AUDIO_QUAL]: Lossless. Signal-to-Noise: 42dB.' },
          { sender: 'Twin S-4', type: 'thought', text: '[NLG_ENGINE]: Generating contextual icebreaker. Target: System Architecture. Probability_Distribution: {Architecture: 0.85, DB_Concurrency: 0.1, Security: 0.05}.' },
          { sender: 'Sarah', text: 'Great. Let\'s start with System Design. How would you architect a scalable rate limiter for a public API?' },
          { sender: 'Twin S-4', type: 'thought', text: '[NLP_PARSER]: Active listening... Awaiting entities: ["Redis", "Memcached", "Token Bucket", "Sliding Window"]. Cross-referencing against Top-100 Architectural Patterns.' },
          { sender: 'Candidate', text: 'Well, I\'d probably use a Redis cluster with a sliding window log algorithm to track the timestamps...' },
          { sender: 'Twin S-4', type: 'thought', text: '[SEMANTIC_ANALYSIS]: Entity "Redis cluster" detected (Confidence: 0.99). Entity "sliding window log" detected (Confidence: 0.98). Response latency: 1.4s (Optimal).' },
          { sender: 'Twin S-4', type: 'thought', text: '[COGNITIVE EVALUATION]: Hardware topology choice is optimal. Sliding window log handles burst traffic gracefully. Probability_of_Senior_Fit: 0.92. TEMPORARY_SCORE_DELTA: +15.' },
          { sender: 'Twin S-4', type: 'thought', text: '[ADVERSARIAL_PROBE]: Generating constraint injection. Testing candidate on O(N) memory scaling. Goal: Observe pivot strategy.' },
          { sender: 'Sarah', text: 'That approach works. However, sliding window log can be memory intensive at scale. How would you optimize the memory footprint?' },
          { sender: 'Twin S-4', type: 'thought', text: '[INTENT_CLASSIFIER]: Monitoring for memory optimization patterns. EXPECTED_HEURISTIC: "Sliding Window Counter" or "Batching". Cognitive_Shadow_Match: 97%.' },
          { sender: 'Candidate', text: 'I would drop the raw logs and switch to a Sliding Window Counter approach. We just keep a rolling count of requests per minute bucket, which drops the memory from O(N) to O(1) per user.' },
          { sender: 'Twin S-4', type: 'thought', text: '[SEMANTIC_ANALYSIS]: Match "Sliding Window Counter" (Weight 1.0). Match "O(1) memory" (Weight 1.0). Acoustic analysis indicates high confidence (Tone stability: 99.2%).' },
          { sender: 'Twin S-4', type: 'thought', text: '[CODE_CLARITY_INDEX]: 0.98. Logic is concise and numerically accurate. Candidate has likely implemented this in production environments.' },
          { sender: 'Twin S-4', type: 'thought', text: '[COGNITIVE EVALUATION 94% MATCH]: Candidate instantly resolved O(N) constraint. Flawless logical reasoning. Performance exceeds 95th percentile of peer group.' },
          { sender: 'Twin S-4', type: 'thought', text: '[PIPELINE_ROUTER]: Assessment complete. AGGREGATE_SCORE=94. REQUIRED_THRESHOLD=85. ACTION: ROUTE_TO_OFFER -> Triggering Auto-Engage Dispatcher.' }
        ]
      },
      {
        id: 'c2',
        name: 'David Kim',
        role: 'Frontend Developer',
        score: 88,
        reasoning: "Strong command of React hooks and state management. Passed all technical algorithms. Minor hesitations on CSS grid layouts, but overall an excellent fit for the senior frontend team.",
        emailStatus: 'sending',
        transcript: [
          { sender: 'Twin S-4', type: 'thought', text: '[SYS_INIT]: BOOTSTRAPPING_SESSION. TARGET_ROLE="Frontend Developer". LOADING_RUBRICS: [React_Internals, State_Management, DOM_Optimizations]. Environment: Vite/React.' },
          { sender: 'Twin S-4', type: 'thought', text: '[VISUAL_ANALYSIS]: Ambient light levels moderate. Candidate eye-tracking indicates high focus on proctored code-editor.' },
          { sender: 'Sarah', text: 'How do you handle complex state management in a large-scale React application?' },
          { sender: 'Twin S-4', type: 'thought', text: '[NLP_PARSER]: Awaiting ecosystem keywords: ["Redux", "Zustand", "Context", "Jotai", "Signals"]. Monitoring for architectural trade-offs.' },
          { sender: 'Candidate', text: 'I usually prefer using standard React Context with modular custom hooks. If propagating state deeply, I might use Zustand to avoid re-render bloat, rather than heavy Redux implementations.' },
          { sender: 'Twin S-4', type: 'thought', text: '[SEMANTIC_ANALYSIS]: Entities "Zustand", "Context" matched. Sentiment on "Redux" is critical/pragmatic. Weighted_Score: +12.' },
          { sender: 'Twin S-4', type: 'thought', text: '[ARCHITECTURAL_VIABILITY]: Zustand selection indicates awareness of modern rendering performance issues. 88% alignment with internal team stack.' },
          { sender: 'Twin S-4', type: 'thought', text: '[ADVERSARIAL_PROBE]: Shifting to rendering performance edge-cases. Complexity: High.' },
          { sender: 'Sarah', text: 'Good choice. Now, what if you need to optimize rendering performance for a massive list of tens of thousands of DOM nodes?' },
          { sender: 'Twin S-4', type: 'thought', text: '[INTENT_CLASSIFIER]: Searching for "Virtualization", "Windowing", or "Canvas interpolation".' },
          { sender: 'Candidate', text: 'I would implement a virtualized list so the browser only renders the elements currently visible in the viewport.' },
          { sender: 'Twin S-4', type: 'thought', text: '[COGNITIVE EVALUATION 88% MATCH]: Correctly identified virtualization approach (react-window/virtualized). Minor acoustic hesitation (Latency: 2.1s). Technically sound. Finalizing evaluation matrix.' }
        ]
      }
    ],
    rejected: [
      {
        id: 'c3',
        name: 'Michael Chen',
        role: 'DevOps Engineer',
        score: 52,
        reasoning: "Lacked fundamental knowledge of Kubernetes orchestration and failed to properly secure the mock Docker containers. Communication was poor during the system design phase.",
        emailStatus: 'none',
        transcript: [
          { sender: 'Twin S-4', type: 'thought', text: '[SYS_INIT]: BOOTSTRAPPING_SESSION. TARGET_ROLE="DevOps Engineer". LOADING_RUBRICS: [Kubernetes, Distributed_Resilience, CI/CD, Terraform].' },
          { sender: 'Twin S-4', type: 'thought', text: '[VISUAL_SENTIMENT]: Candidate appears fatigued. Micro-expression analysis suggests minor anxiety during K8s module load.' },
          { sender: 'Sarah', text: 'Assume we have a microservice that crashed continuously due to OOM errors. How do you construct the Kubernetes manifest to prevent cascading node failures?' },
          { sender: 'Twin S-4', type: 'thought', text: '[NLP_PARSER]: Waiting for resilience mechanisms. TARGETS: ["Resource Quota", "Memory Limit", "OOMKilled", "LivenessProbe"].' },
          { sender: 'Candidate', text: 'Um, I would probably just restart the pod using a script, or scale up the instances so it doesn\'t crash.' },
          { sender: 'Twin S-4', type: 'thought', text: '[SEMANTIC_ANALYSIS]: "restart pod via script". CRITICAL_FAILURE: Anti-pattern detected. Cloud-native disregard. "scale up instances". FLAG: Inefficient resource allocation.' },
          { sender: 'Twin S-4', type: 'thought', text: '[COGNITIVE ALERT - CRITICAL FAILURE]: Candidate failed to mention native K8s constraints. Restart scripts are legacy monolithic patterns. Evaluation_Stability: 0.12. PENALTY: -25.' },
          { sender: 'Twin S-4', type: 'thought', text: '[NLG_HINT_ENGINE]: Generating guidance to allow self-correction. Intensity: 0.8.' },
          { sender: 'Sarah', text: 'What about preventing the pod from scheduling on a node that lacks sufficient memory in the first place?' },
          { sender: 'Twin S-4', type: 'thought', text: '[SYS_HINT]: Probing for Node Selectors, Taints, or Resource Requests. Awaiting architectural pivot.' },
          { sender: 'Candidate', text: 'I usually just manually assign it to a bigger AWS EC2 instance if it fails.' },
          { sender: 'Twin S-4', type: 'thought', text: '[COGNITIVE ALERT - CRITICAL FAILURE]: Candidate shows zero understanding of K8s Scheduler mechanics. Reliability Index: 0.34. ACTION: ABORT_LOGIC. ROUTE: Reject.' }
        ]
      },
      {
        id: 'c4',
        name: 'Sarah Jenkins',
        role: 'Data Scientist',
        score: 65,
        reasoning: "Good conceptual grasp of machine learning algorithms, but struggled significantly with the actual Python and pandas implementation. Recommending for junior roles instead.",
        emailStatus: 'none',
        transcript: [
          { sender: 'Twin S-4', type: 'thought', text: '[SYS_INIT]: BOOTSTRAPPING_SESSION. TARGET_ROLE="Data Scientist". LOADING_RUBRICS: [Data_Wrangling, Statistics, ML_Pipelines].' },
          { sender: 'Sarah', text: 'We need to normalize a skewed dataset with heavy outliers before feeding it into our regression model. What\'s your approach?' },
          { sender: 'Twin S-4', type: 'thought', text: '[NLP_PARSER]: Monitoring for "Log Transformation", "RobustScaler", or "Z-score clipping". Match: None.' },
          { sender: 'Candidate', text: 'I would use a standard Min-Max scaler across all the features to keep them bounded between 0 and 1.' },
          { sender: 'Twin S-4', type: 'thought', text: '[SEMANTIC_ANALYSIS]: Entity match "Min-Max scaler". ALERT: Inappropriate scaler for outlier-heavy data. Signal_Strength: 0.45.' },
          { sender: 'Twin S-4', type: 'thought', text: '[COGNITIVE EVALUATION PENALTY]: Mathematical error detected. Min-Max squashes valid distribution in presence of extreme outliers. TEMPORARY_SCORE_DELTA: -10.' },
          { sender: 'Twin S-4', type: 'thought', text: '[PROBING_INJECTION]: Testing for outlier mitigation strategy.' },
          { sender: 'Sarah', text: 'But wouldn\'t the existing outliers squash the rest of the data tightly in your 0 to 1 range mapping?' },
          { sender: 'Candidate', text: 'Oh true, maybe I would just delete the outlier rows manually first so it scales better then.' },
          { sender: 'Twin S-4', type: 'thought', text: '[COGNITIVE ALERT]: "Manual deletion" detected. FLAG: Unscientific data preprocessing. Candidate lacks depth in applied feature engineering. Score finalization: Stable (Medium-Low).' }
        ]
      }
    ]
  });

  const [activeEmails, setActiveEmails] = useState(['c1']);
  const [selectedTranscript, setSelectedTranscript] = useState(null);

  useEffect(() => {
    // Simulate sending an email to David Kim after a few seconds
    const timer = setTimeout(() => {
      setActiveEmails(['c1', 'c2']);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const Card = ({ candidate, type }) => {
    const isSelected = type === 'selected';
    const emailSent = activeEmails.includes(candidate.id);

    return (
      <div style={{ 
        background: 'var(--bg-card)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '1.5rem', 
        borderTop: isSelected ? '4px solid var(--tier-green)' : '4px solid var(--tier-red)',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'var(--transition-fast)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <img 
              src={candidate.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${candidate.name.split(' ')[0]}`} 
              alt={candidate.name} 
              style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--brand-blue)', border: '2px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} 
            />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{candidate.name}</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{candidate.role}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: isSelected ? 'var(--tier-green)' : 'var(--tier-red)' }}>{candidate.score}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Twin Score</span>
          </div>
        </div>

        {/* AI Reasoning */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px dashed var(--border-subtle)' }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--brand-blue)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BrainCircuit size={14} /> Digital Twin Analysis
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            "{candidate.reasoning}"
          </p>
        </div>

        {/* Action Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {isSelected ? (
            emailSent ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--tier-green)', fontSize: '0.85rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)' }}>
                <CheckCircle2 size={16} /> Automated Offer Sent
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-blue)', fontSize: '0.85rem', fontWeight: 600, background: 'rgba(14, 165, 233, 0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)' }}>
                <Mail size={16} style={{ animation: 'bounce 2s infinite' }} /> Drafting Email...
              </div>
            )
          ) : (
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)' }}>
               <AlertCircle size={16} /> Archived in Pipeline
             </div>
          )}

          <button onClick={() => setSelectedTranscript(candidate)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
            View Full Transcript
          </button>
        </div>

        {/* Recruiter Action Buttons */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border-subtle)', display: 'flex', gap: '1rem' }}>
          {isSelected ? (
            <>
              <button style={{ flex: 1, padding: '0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'var(--transition-fast)' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}>
                <PlaySquare size={16} /> Review Video
              </button>
              <button style={{ flex: 1, padding: '0.6rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--tier-red)', color: 'var(--tier-red)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'var(--transition-fast)' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--tier-red)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}>
                <ShieldAlert size={16} /> Overrule & Halt
              </button>
            </>
          ) : (
            <>
              <button style={{ flex: 1, padding: '0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'var(--transition-fast)' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}>
                <PlaySquare size={16} /> Auto-Filter Logs
              </button>
              <button style={{ flex: 1, padding: '0.6rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--tier-green)', color: 'var(--tier-green)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'var(--transition-fast)' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--tier-green)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}>
                <CheckCircle2 size={16} /> Overrule & Hire
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render Full Screen Transcript View
  if (selectedTranscript) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setSelectedTranscript(null)} 
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-pill)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, transition: 'var(--transition-fast)' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'} 
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
            >
              <ArrowLeft size={18} /> Back to Dashboard
            </button>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              Cognitive Trace Log: <span style={{ color: 'var(--brand-blue)' }}>{selectedTranscript.name}</span>
            </h1>
          </div>
          <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--brand-blue)' }}>
             <BrainCircuit size={18} color="var(--brand-blue)" />
             <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-blue)', textTransform: 'uppercase' }}>Twin Telemetry Active</span>
          </div>
        </div>

        <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', boxShadow: 'var(--shadow-sm)', overflowY: 'auto', border: '1px solid var(--border-subtle)' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {selectedTranscript.transcript.map((msg, idx) => (
              <div key={idx} style={{ 
                background: msg.type === 'thought' ? 'rgba(14, 165, 233, 0.05)' : (msg.sender === 'Candidate' ? 'var(--bg-secondary)' : 'transparent'),
                border: msg.type === 'thought' ? '1px dashed var(--brand-blue)' : (msg.sender !== 'Candidate' ? '1px solid var(--border-subtle)' : '1px solid transparent'),
                padding: '1.5rem',
                borderRadius: '12px',
                marginLeft: msg.sender === 'Candidate' ? '4rem' : '0',
                marginRight: msg.sender !== 'Candidate' && msg.type !== 'thought' ? '4rem' : '0',
                boxShadow: msg.type === 'thought' ? 'none' : 'var(--shadow-sm)'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: msg.type === 'thought' ? 'var(--brand-blue)' : 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {msg.type === 'thought' && <BrainCircuit size={14} />} {msg.sender}
                </div>
                <div style={{ fontSize: '1.1rem', lineHeight: 1.7, color: msg.type === 'thought' ? 'var(--brand-blue)' : 'var(--text-primary)', fontStyle: msg.type === 'thought' ? 'italic' : 'normal', fontWeight: msg.type === 'thought' ? '500' : '400' }}>
                  {msg.text}
                </div>
              </div>
            ))}
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

  // Render Dashboard
  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Automated Post-Interview Decisions</h1>
          <p style={{ color: 'var(--text-muted)' }}>Twin evaluation reasoning and automated candidate engagement.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          
          {/* Autopilot Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid var(--brand-blue)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', marginRight: '1rem' }}>
            <BrainCircuit size={16} color="var(--brand-blue)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Twin Autopilot</span>
            <div style={{ width: '36px', height: '20px', background: 'var(--brand-blue)', borderRadius: '10px', position: 'relative', cursor: 'pointer' }}>
               <span style={{ position: 'absolute', right: '2px', top: '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderTop: '2px solid var(--tier-green)' }}>
            <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Selected:</span> {candidates.selected.length}
            </p>
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderTop: '2px solid var(--tier-red)' }}>
            <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Rejected:</span> {candidates.rejected.length}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        
        {/* Selected Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '50%' }}>
              <CheckCircle2 size={24} color="var(--tier-green)" />
            </div>
            <h2 style={{ fontSize: '1.4rem' }}>Approved Candidates</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {candidates.selected.map(cand => (
              <Card key={cand.id} candidate={cand} type="selected" />
            ))}
          </div>
        </div>

        {/* Rejected Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '50%' }}>
              <XCircle size={24} color="var(--tier-red)" />
            </div>
            <h2 style={{ fontSize: '1.4rem' }}>Rejected Candidates</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {candidates.rejected.map(cand => (
              <Card key={cand.id} candidate={cand} type="rejected" />
            ))}
          </div>
        </div>

      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
