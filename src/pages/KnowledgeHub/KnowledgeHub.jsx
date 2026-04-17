import { useState, useRef } from 'react';
import { UploadCloud, FileText, Globe, BookOpen, Search, CheckCircle2, LayoutGrid, List, Sparkles, Database, BrainCircuit, Loader2 } from 'lucide-react';
import MasterCaseStudio from './MasterCaseStudio';
import { useDemo } from '../../context/DemoContext';

const ICON_MAP = {
  Globe, Sparkles, Database, BookOpen, CheckCircle2, FileText
};

export default function KnowledgeHub() {
  const { state, dispatch, ACTIONS } = useDemo();
  const [activeTab, setActiveTab] = useState('base');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);

  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      const fileUrl = URL.createObjectURL(file);
      const isPdf = file.type === 'application/pdf';

      setTimeout(() => {
        const newModule = {
          id: Date.now().toString(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          level: 'Learning',
          docs: 1,
          icon: isPdf ? 'FileText' : 'Globe',
          status: 'Active',
          url: fileUrl,
          type: file.type
        };
        dispatch({ type: ACTIONS.ADD_KNOWLEDGE_MODULE, payload: newModule });
        setIsUploading(false);
      }, 2500);
    }
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button 
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2rem',
        border: 'none', background: 'transparent', cursor: 'pointer',
        color: activeTab === id ? 'var(--brand-blue)' : 'var(--text-muted)',
        borderBottom: activeTab === id ? '2px solid var(--brand-blue)' : '2px solid transparent',
        fontWeight: 700, transition: '0.3s', fontSize: '1rem'
      }}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Document Preview Modal */}
      {selectedModule && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(2, 6, 23, 0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: 'var(--bg-card)', width: '100%', maxWidth: '1000px', height: '85vh', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
                 <FileText size={20} color="var(--brand-blue)" /> {selectedModule.name}
               </h3>
               <button onClick={() => setSelectedModule(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700 }}>CLOSE</button>
            </div>
            <div style={{ flex: 1, background: '#020617', padding: '1rem' }}>
              {selectedModule.url ? (
                selectedModule.type === 'application/pdf' ? (
                  <iframe src={selectedModule.url} width="100%" height="100%" style={{ border: 'none', borderRadius: '8px' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', textAlign: 'center' }}>
                    <BookOpen size={64} color="var(--brand-blue)" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Neural Summary Prepared</h2>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>Since this is an ingested block, Sarah has mapped the core concepts to her neural engine. Previewing the raw source format is restricted.</p>
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', textAlign: 'center' }}>
                  <BrainCircuit size={64} color="var(--brand-blue)" style={{ marginBottom: '1.5rem' }} />
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Sample Intelligence Block</h2>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>This is a pre-loaded knowledge module. In a live environment, you would see the structured technical rubric here.</p>
                </div>
              )}
            </div>
            <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: '2rem' }}>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingestion Depth</p>
                    <p style={{ fontWeight: 700, color: 'var(--brand-blue)' }}>94% Accurate</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sync Status</p>
                    <p style={{ fontWeight: 700, color: 'var(--tier-green)' }}>Verified</p>
                  </div>
               </div>
               <button style={{ background: 'var(--brand-blue)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}>Update Ingestion</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Knowledge & Intelligence Hub</h1>
          <p style={{ color: 'var(--text-muted)' }}>Train your Twin with base knowledge (docs) and inference logic (master cases).</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '3rem' }}>
        <TabButton id="base" label="Base Knowledge" icon={Database} />
        <TabButton id="inference" label="Inference Knowledge" icon={BrainCircuit} />
      </div>

      {activeTab === 'base' ? (
        <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
          {/* Upload Zone */}
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '2px dashed var(--border-subtle)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '3rem', 
            textAlign: 'center',
            marginBottom: '3rem',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'var(--transition-fast)',
            opacity: isUploading ? 0.7 : 1
          }} onMouseOver={(e) => !isUploading && (e.currentTarget.style.borderColor = 'var(--brand-blue)')} onMouseOut={(e) => !isUploading && (e.currentTarget.style.borderColor = 'var(--border-subtle)')} onClick={() => !isUploading && fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} />
            <div style={{ width: '80px', height: '80px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', color: 'var(--brand-blue)', animation: isUploading ? 'spin 2s linear infinite' : 'none' }}>
              {isUploading ? <Loader2 size={40} /> : <UploadCloud size={40} />}
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{isUploading ? 'Sarah is Learning...' : 'Upload Intelligence Blocks'}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{isUploading ? 'Analyzing document structure and mapping to neural core...' : 'Drag & drop PDFs, Technical Rubrics, or Culture Documents'}</p>
            <button disabled={isUploading} style={{ background: isUploading ? 'var(--border-subtle)' : 'var(--brand-blue)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: 'var(--radius-pill)', fontWeight: 600, cursor: isUploading ? 'not-allowed' : 'pointer' }}>
              {isUploading ? 'Processing...' : 'Browse Files'}
            </button>
          </div>

          {/* Showcase Grid */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Learned Modules (Base)</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {state.knowledgeModules.map(module => {
              const Icon = ICON_MAP[module.icon] || FileText;
              return (
              <div key={module.id} onClick={() => setSelectedModule(module)} style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-fast)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--brand-blue)' }}>
                    <Icon size={24} />
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
                  <div style={{ color: 'var(--brand-blue)', fontSize: '0.75rem', fontWeight: 700 }}>VIEW BLOCK</div>
                </div>
              </div>
            )})}
          </div>
        </div>

      ) : (
        <MasterCaseStudio />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
