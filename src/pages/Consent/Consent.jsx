import { useData } from '../../context/DataContext';

export default function Consent() {
  const data = useData();

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Candidate Consent & Privacy Portal</h1>
        <p style={{ color: 'var(--text-secondary)' }}>You are viewing the candidate experience. Qalana uses Ephemeral Enrichment Architecture.</p>
      </div>

      {data.consents.map((consent) => (
        <div key={consent.id} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '2rem', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{consent.candidate_name}'s Vaulted Data</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>This data is held in the encrypted RuneGrid repository. Pre-consent sourcing data in Redis has expired.</p>
            </div>
            <button style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
              Revoke All Access
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-subtle)' }}>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Data Field</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Value Held</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: 600 }}>Source / Origin</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {consent.data_held.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 500 }}>{row.field}</td>
                  <td style={{ padding: '1rem 0' }}>{row.value}</td>
                  <td style={{ padding: '1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{row.source}</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                    <button style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', marginRight: '1rem', fontWeight: 600 }}>Edit</button>
                    <button style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(241, 245, 249, 0.5)', borderRadius: 'var(--radius-sm)' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Access Scopes Granted</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {consent.scopes.map(scope => (
                <label key={scope} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '2rem', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{scope}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            <span>Verified Compliant:</span>
            <span style={{ background: 'white', padding: '0.2rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>GDPR</span>
            <span style={{ background: 'white', padding: '0.2rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>DPDP Act</span>
            <span style={{ background: 'white', padding: '0.2rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>EU AI Act</span>
          </div>
        </div>
      ))}
    </div>
  );
}
