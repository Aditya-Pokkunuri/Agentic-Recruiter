import { NavLink, Outlet } from 'react-router-dom';
import { useDemo } from '../../context/DemoContext';
import { LayoutDashboard, PhoneCall, Video, Send, Workflow, ShieldAlert, FileKey2, Search, Settings, HelpCircle, UserCircle2, Plus, BrainCircuit, Database } from 'lucide-react';

export default function AppLayout() {
  const { state, dispatch, ACTIONS } = useDemo();

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.85rem 1.25rem',
    borderRadius: 'var(--radius-pill)', 
    background: isActive ? 'var(--brand-blue)' : 'transparent',
    color: isActive ? '#ffffff' : 'var(--text-secondary)',
    textDecoration: 'none',
    fontWeight: isActive ? 600 : 500,
    transition: 'var(--transition-fast)',
    marginBottom: '0.25rem',
  });

  if (state.role === 'candidate') {
    return (
      <div style={{ height: '100vh', width: '100vw', background: 'var(--bg-primary)', overflow: 'hidden' }}>
        <Outlet />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Sidebar - Pure White background */}
      <aside style={{ 
        width: '280px', 
        background: 'var(--bg-secondary)', 
        padding: '1.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        borderRight: '1px solid var(--border-subtle)',
        zIndex: 10
      }}>
        {/* Logo Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--text-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>Q</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Qalana.AI</h2>
        </div>
        
        {/* Search Bar - like the screenshot */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'var(--bg-primary)', 
          padding: '0.75rem 1rem', 
          borderRadius: 'var(--radius-pill)', 
          marginBottom: '2rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search here.." 
            style={{ border: 'none', background: 'transparent', fontSize: '0.9rem', width: '100%', color: 'var(--text-primary)' }} 
          />
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <NavLink to="/dashboard" style={linkStyle}><LayoutDashboard size={20} /> Dashboard</NavLink>
          
          <p style={{ marginTop: '1rem', padding: '0 1.25rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Autonomous Agents</p>
          <NavLink to="/interviews" style={linkStyle}><Video size={20} /> Live Interviews</NavLink>
          <NavLink to="/engage" style={linkStyle}><Send size={20} /> Qalana Engage</NavLink>
          
          <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border-subtle)' }}></div>
          <p style={{ padding: '0 1.25rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Ephemeral Layer</p>
          <NavLink to="/pipeline" style={linkStyle}><Workflow size={20} /> Redis Sourcing TTL</NavLink>
          <NavLink to="/consent" style={linkStyle}><FileKey2 size={20} /> Consent Gate</NavLink>

          <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border-subtle)' }}></div>
          <p style={{ padding: '0 1.25rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Intelligence Core</p>
          <NavLink to="/twin" style={linkStyle}><BrainCircuit size={20} /> Digital Twin</NavLink>
          <NavLink to="/knowledge" style={linkStyle}><Database size={20} /> Knowledge Hub</NavLink>
          
          <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border-subtle)' }}></div>
          <p style={{ padding: '0 1.25rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '0.5rem' }}>RuneGrid View</p>
          <NavLink to="/escalation" style={linkStyle}><ShieldAlert size={20} /> Escalations</NavLink>
        </nav>
        
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem', width: '100%', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer' }}>
            <Settings size={20} /> Setting
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem', width: '100%', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer' }}>
            <HelpCircle size={20} /> Feedback
          </button>
        </div>
      </aside>
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <header style={{ padding: '1.5rem 3rem', display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', alignItems: 'center' }}>
          <button onClick={() => dispatch({ type: ACTIONS.LOGOUT })} style={{ border: 'none', background: 'transparent', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Sign Out
          </button>
          <div style={{ padding: '0.5rem', borderRadius: '50%', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', color: 'var(--text-secondary)', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}>
            <UserCircle2 size={24} />
          </div>
          <button style={{ background: 'var(--brand-blue)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-pill)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 96, 255, 0.3)' }}>
            <Plus size={18} strokeWidth={3} /> Create new jobs
          </button>
        </header>

        <div style={{ padding: '0 3rem 4rem 3rem', width: '100%', flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
