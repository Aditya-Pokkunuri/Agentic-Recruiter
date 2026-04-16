export default function Escalation() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Human-in-the-Loop Escalations</h1>
      <div style={{ background: 'var(--bg-card)', padding: '3rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Pending exceptions requiring recruiter review will appear here.</p>
      </div>
    </div>
  );
}
