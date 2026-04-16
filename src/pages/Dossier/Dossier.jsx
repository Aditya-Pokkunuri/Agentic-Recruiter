import { useParams } from 'react-router-dom';

export default function Dossier() {
  const { id } = useParams();
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Candidate Dossier: {id}</h1>
      <div style={{ background: 'var(--bg-card)', padding: '3rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Deep dive evaluation for candidate will appear here.</p>
      </div>
    </div>
  );
}
