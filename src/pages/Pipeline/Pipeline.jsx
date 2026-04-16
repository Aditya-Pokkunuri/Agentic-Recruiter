import { useData } from '../../context/DataContext';

export default function Pipeline() {
  const data = useData();

  const stages = [
    { key: 'sourced', label: 'Sourced' },
    { key: 'screened', label: 'Screened (Voice AI)' },
    { key: 'interviewed', label: 'Interviewed (Code+Video)' },
    { key: 'engaged', label: 'Engaged' }
  ];

  const getCandidatesByStage = (stageKey) => {
    return data.candidates.filter(c => c.pipeline_stage === stageKey);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Recruiting Pipeline</h1>
        <p style={{ color: 'var(--text-muted)' }}>Candidates are autonomously progressed by Qalana Agents.</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflowX: 'auto', paddingBottom: '1rem' }}>
        {stages.map(stage => {
          const columnCandidates = getCandidatesByStage(stage.key);
          return (
            <div key={stage.key} style={{ minWidth: '300px', flex: 1, background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <h3 style={{ textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{stage.label}</h3>
                <span style={{ background: 'var(--bg-card)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem' }}>{columnCandidates.length}</span>
              </div>
              
              {columnCandidates.map(candidate => (
                <div key={candidate.id} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderTop: `3px solid var(--tier-${candidate.confidence_tier.toLowerCase()})`, boxShadow: 'var(--shadow-card)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1rem' }}>{candidate.name}</h4>
                    <span style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--tier-green)', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                      {candidate.match_score}% Match
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{candidate.role}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: candidate.email_status === 'consented' ? 'var(--tier-green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {candidate.email_status === 'consented' ? (
                        <>✓ Consent Verified (RuneGrid)</>
                      ) : (
                        <div style={{ color: 'var(--tier-red)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          ⏱ TTL: {Math.floor(Math.random() * 48)}h {Math.floor(Math.random() * 60)}m
                        </div>
                      )}
                    </span>
                    <span style={{ background: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: `var(--${candidate.last_agent})` }}>
                      Last: {candidate.last_agent}
                    </span>
                  </div>
                </div>
              ))}
              
              {columnCandidates.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '2rem 0', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  Empty Stage
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
