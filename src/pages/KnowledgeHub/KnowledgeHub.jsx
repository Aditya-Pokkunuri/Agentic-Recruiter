import { useState } from 'react';
import { UploadCloud, FileText, Globe, BookOpen, Search, CheckCircle2, LayoutGrid, List, Sparkles, Database } from 'lucide-react';

export default function KnowledgeHub() {
  const [modules] = useState([
    { id: 'm1', name: 'Fullstack Architecture', level: 'Master', docs: 124, icon: Globe, status: 'Active' },
    { id: 'm2', name: 'React Internals & Optimization', level: 'Expert', docs: 82, icon: Sparkles, status: 'Active' },
    { id: 'm3', name: 'DevOps & K8s Resilience', level: 'Interim', docs: 45, icon: Database, status: 'Syncing' },
    { id: 'm4', name: 'Behavioral Psychology', level: 'Master', docs: 210, icon: BookOpen, status: 'Active' },
    { id: 'm5', name: 'Data Privacy Laws (GDPR)', level: 'Expert', docs: 15, icon: CheckCircle2, status: 'Active' }
  ]);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Knowledge & Intelligence Hub</h1>
          <p style={{ color: 'var(--text-muted)' }}>Train your Twin by uploading technical rubrics, culture decks, and domain expertise.</p>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderTop: '2px solid var(--brand-blue)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Core Intelligence Index</p>
            <p style={{ fontWeight: 800, fontSize: '1.25rem' }}>4.8 TB <span style={{ fontSize: '0.8rem', color: 'var(--tier-green)' }}>+12%</span></p>
        </div>
      </div>

      {/* Upload Zone */}
      <div style={{ 
        background: 'var(--bg-card)', 
        border: '2px dashed var(--border-subtle)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '3rem', 
        textAlign: 'center',
        marginBottom: '3rem',
        cursor: 'pointer',
        transition: 'var(--transition-fast)'
      }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--brand-blue)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
        <div style={{ width: '80px', height: '80px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', color: 'var(--brand-blue)' }}>
          <UploadCloud size={40} />
        </div>
        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Upload Intelligence Blocks</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Drag & drop PDFs, Technical Rubrics, or Culture Documents</p>
        <button style={{ background: 'var(--brand-blue)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: 'var(--radius-pill)', fontWeight: 600, cursor: 'pointer' }}>
          Browse Files
        </button>
      </div>

      {/* Showcase Grid */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Learned Modules</h2>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.4rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ padding: '0.4rem', background: 'var(--brand-blue)', color: 'white', borderRadius: '50%', cursor: 'pointer' }}><LayoutGrid size={18} /></div>
          <div style={{ padding: '0.4rem', color: 'var(--text-muted)', cursor: 'pointer' }}><List size={18} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {modules.map(module => (
          <div key={module.id} style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-fast)' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--brand-blue)' }}>
                <module.icon size={24} />
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', background: module.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: module.status === 'Active' ? 'var(--tier-green)' : 'var(--tier-amber)', borderRadius: '4px', textTransform: 'uppercase' }}>
                {module.status}
              </span>
            </div>
            
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{module.name}</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <FileText size={14} /> {module.docs} Sources
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-blue)' }}>
                {module.level}
              </div>
            </div>
          </div>
        ))}
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
