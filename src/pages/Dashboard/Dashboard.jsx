import { useData } from '../../context/DataContext';
import { useDemo } from '../../context/DemoContext';
import ReactApexChart from 'react-apexcharts';

export default function Dashboard() {
  const data = useData();
  const { state } = useDemo();

  const firstName = state.user?.name?.split(' ')[0] || 'Sarah';

  // Area chart tracking Data Lifecycle (Redis -> Vaulted vs Purged)
  const chartOptions = {
    chart: { 
      type: 'area',
      toolbar: { show: false }, 
      zoom: { enabled: false }, 
      fontFamily: 'var(--font-sans)',
      parentHeightOffset: 0
    },
    colors: ['#0ea5e9', '#8b5cf6', '#ef4444'], // Blue (Sourced), Purple (Vaulted), Red (Purged)
    fill: { 
      type: 'gradient', 
      gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05, stops: [0, 90, 100] } 
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: [3, 3, 3] },
    xaxis: { 
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 } }
    },
    yaxis: { 
      show: true,
      labels: { style: { colors: 'var(--text-muted)', fontSize: '12px' } }
    },
    grid: { borderColor: 'var(--border-subtle)', strokeDashArray: 4, yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    tooltip: { theme: 'light' },
    legend: { position: 'top', horizontalAlign: 'left', fontWeight: 600 }
  };

  const chartSeries = [
    { name: 'Sourced to Redis (Ephemeral)', data: [450, 520, 480, 610, 590, 210, 340] },
    { name: 'Consented & Vaulted (RuneGrid)', data: [120, 145, 130, 210, 195, 45, 80] },
    { name: 'Purged via TTL (Destroyed)', data: [310, 350, 330, 380, 400, 150, 240] }
  ];

  const TrendBadge = ({ value, label, positive = true, invertColors = false }) => {
    const isGood = invertColors ? !positive : positive;
    return (
      <span style={{ 
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        background: isGood ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        color: isGood ? 'var(--tier-green)' : 'var(--tier-red)',
        padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600
      }}>
        {positive ? '+' : '-'}{value} {label}
      </span>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '2rem', alignItems: 'start' }}>
      
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Welcome Area */}
        <div style={{ padding: '0 0.5rem 1rem 0' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Welcome back, {firstName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: '0.5rem 0 0 0' }}>
            System architectures are nominal. Compliance health is optimal.
          </p>
        </div>

        {/* AI Insights Card */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', background: 'rgba(0, 96, 255, 0.08)', color: 'var(--brand-blue)', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            ✨ Vaulted Candidates Ready
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem', lineHeight: 1.3, letterSpacing: '-0.5px' }}>
            Top profiles secured in RuneGrid this week
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {data.candidates.filter(c => c.email_status === 'consented').map((candidate, i) => (
              <div key={candidate.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-pill)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${candidate.name}`} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff' }} />
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{candidate.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{candidate.role}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {candidate.match_score}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>%</span>
                  </div>
                  <div style={{ background: 'white', color: 'var(--tier-green)', border: '1px solid var(--border-subtle)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                    ✓
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ATS WriteBack Payload Monitor */}
        <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Minimal ATS Write-back
            </h3>
            <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{width:'6px',height:'6px',background:'#10b981',borderRadius:'50%'}}></div>LIVE</span>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '1rem' }}>Latest payload securely pushed to Employer Workday ATS instance. Notice enriched fields have explicitly been stripped.</p>
          
          <pre style={{ margin: 0, background: '#020617', padding: '1rem', borderRadius: '8px', color: '#38bdf8', fontSize: '0.8rem', overflowX: 'auto', fontFamily: 'var(--font-mono)' }}>
{`{
  "timestamp": "2026-04-16T13:42:01Z",
  "candidate_name": "Arjun Mehta",
  "verified_contact": "arjun.m@gmail.com",
  "qalana_match": 87,
  "runegrid_verification_badge": "https://vault.qalana.ai/v/arj89x",
  "_stripped_fields": ["audio_session", "code_eval_video", "pdl_inferences"]
}`}
          </pre>
        </div>

      </div>

      {/* Right Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Top Metrics Row - Completely revamped for Ephemeral Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 500 }}>Active Redis Sessions <span style={{fontSize: '0.7rem', background:'#f1f5f9', padding:'0.2rem', borderRadius:'4px'}}>Unconsented</span></p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{data.ephemeralStats.redis_active_sessions}</span>
              <TrendBadge value="5.4%" label="dropped" positive={false} invertColors={true} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Pending TTL Expiration</p>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 500 }}>Profiles Vaulted in RuneGrid</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{data.ephemeralStats.items_vaulted_runegrid}</span>
              <TrendBadge value="12" label="today" positive={true} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--tier-green)', marginTop: '0.5rem' }}>Consent verification passed</p>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 500 }}>Ephemeral Data Purged <span style={{fontSize: '0.7rem', background:'#f1f5f9', padding:'0.2rem', borderRadius:'4px'}}>GB</span></p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{data.ephemeralStats.data_purged_today_gb}</span>
              <TrendBadge value="2.1" label="GB" positive={true} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Video/Audio streams destroyed</p>
          </div>
          
        </div>

        {/* Main Chart */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v6h6"/></svg>
              Ephemeral Enrichment Lifecycle
            </h3>
            <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>•••</span>
          </div>

          <div style={{ height: '300px', marginLeft: '-15px' }}>
            <ReactApexChart options={chartOptions} series={chartSeries} type="area" height="100%" />
          </div>
          
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Automated cleanup routines are operating nominally. <br/><span style={{ color: '#ef4444', fontWeight: 500 }}>Scheduled purge of unconsented Redis memory running next at exactly 00:00 UTC.</span></p>
            <button style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '0.5rem 1rem', borderRadius: 'var(--radius-pill)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
              Force Purge Memory Now
            </button>
          </div>
        </div>

        {/* Bottom Double Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>
          
          {/* Compliance Status */}
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                System Compliance Health
              </h3>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-end' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Architecture Compliance Frameworks</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>GDPR Target</span>
                  <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>EU AI Act</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.25rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--tier-green)', lineHeight: 1 }}>{data.ephemeralStats.compliance_health}%</span>
              </div>
            </div>

            <div style={{ height: '8px', width: '100%', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: '100%', background: 'var(--tier-green)' }}></div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1.5rem', lineHeight: 1.4 }}>
              Zero instances of unconsented sensitive data persisted to disk. Automated Ephemeral layer verified active.
            </p>
          </div>

          {/* Agents Activity */}
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Realtime Agentic Activity
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ background: 'rgba(0, 96, 255, 0.1)', color: 'var(--brand-blue)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>QRecruiter</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2m ago</span>
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>Retell.ai stream destroyed</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Screening with Priya Sharma completed. Raw audio memory erased successfully.</p>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--tier-green)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>Consent Gate</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>35m ago</span>
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>Vault payload inserted</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Arjun Mehta explicitly granted pipeline permissions. Synced to RuneGrid.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
