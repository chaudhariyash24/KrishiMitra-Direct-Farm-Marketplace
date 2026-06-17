import { useState, useEffect } from 'react';
import API from '../../../api/axios';
import defaultSchemes from './schemesData';

export default function Schemes({ toast }) {
  const [schemes, setSchemes] = useState([]);
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [lang, setLang] = useState('en'); // 'en' | 'hi'

  useEffect(() => {
    // Always use local schemes (which have detailed guidelines + apply URLs)
    // Merge any extra DB schemes that aren't in the local list
    API.get('/schemes').then(r => {
      const dbSchemes = r.data || [];
      const localNames = defaultSchemes.map(s => s.name.toLowerCase());
      const extraFromDb = dbSchemes
        .filter(db => !localNames.includes(db.name.toLowerCase()))
        .map(db => ({ ...db, steps: null, applyUrl: null }));
      setSchemes([...defaultSchemes, ...extraFromDb]);
    }).catch(() => setSchemes(defaultSchemes));
  }, []);

  const filtered = schemes.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase());
    if (tab === 'active') return matchSearch && s.status === 'Active';
    if (tab === 'upcoming') return matchSearch && s.status === 'Upcoming';
    if (tab === 'closed') return matchSearch && s.status === 'Closed';
    return matchSearch;
  });

  const activeCount = schemes.filter(s => s.status === 'Active').length;
  const upcomingCount = schemes.filter(s => s.status === 'Upcoming').length;

  const badge = (status) => {
    const m = { Active: { bg: '#E8F5E9', c: '#2E7D32', i: '✅' }, Upcoming: { bg: '#FFF3E0', c: '#E65100', i: '🔜' }, Closed: { bg: '#FFEBEE', c: '#C62828', i: '❌' } };
    const s = m[status] || m.Active;
    return <span style={{ background: s.bg, color: s.c, padding: '.2rem .7rem', borderRadius: '50px', fontSize: '.72rem', fontWeight: 700 }}>{s.i} {status}</span>;
  };

  return (
    <>
      <div className="page-header"><h1>🏛️ Government Schemes</h1><p>Schemes you're eligible for — click to see full application guide</p></div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card"><div className="icon-box icon-green">✅</div><div className="info"><h3>{activeCount}</h3><p>Active</p></div></div>
        <div className="stat-card"><div className="icon-box icon-orange">🔜</div><div className="info"><h3>{upcomingCount}</h3><p>Upcoming</p></div></div>
        <div className="stat-card"><div className="icon-box icon-purple">📋</div><div className="info"><h3>{schemes.length}</h3><p>Total</p></div></div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tabs" style={{ marginBottom: 0, flex: 1 }}>
          <div className={`tab${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>✅ Active</div>
          <div className={`tab${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>📋 All</div>
          <div className={`tab${tab === 'upcoming' ? ' active' : ''}`} onClick={() => setTab('upcoming')}>🔜 Upcoming</div>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search schemes..." type="text"
          style={{ padding: '.55rem 1rem', border: '2px solid var(--border)', borderRadius: 'var(--radius2)', fontFamily: 'var(--font-body)', fontSize: '.88rem', minWidth: '180px' }} />
      </div>

      <div id="schemes-list">
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div><h3>No schemes found</h3>
          </div>
        ) : filtered.map((s, i) => (
          <div key={i} className="scheme-card" onClick={() => setSelected(s)}
            style={{ borderLeftColor: s.status === 'Active' ? 'var(--primary)' : '#FF9800', cursor: 'pointer', transition: 'all .2s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
            <h3>{s.name}</h3>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
              {badge(s.status)}
              <span className="badge badge-blue">💰 {s.benefit}</span>
              {s.ministry && <span style={{ background: '#F3E5F5', color: '#7B1FA2', padding: '.2rem .7rem', borderRadius: '50px', fontSize: '.72rem', fontWeight: 700 }}>🏢 {s.ministry}</span>}
            </div>
            <p style={{ color: 'var(--text2)', fontSize: '.88rem', marginBottom: '.5rem' }}>{s.desc}</p>
            <button className="btn btn-green btn-sm" onClick={e => { e.stopPropagation(); setSelected(s); }}>📖 View Guide & Apply →</button>
          </div>
        ))}
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}
            onClick={e => e.stopPropagation()}>

            {/* Green Header */}
            <div style={{ background: 'linear-gradient(135deg,#1B5E20,#2E7D32,#43A047)', padding: '1.25rem 1.5rem', borderRadius: '16px 16px 0 0', color: '#fff', position: 'relative' }}>
              <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: '.75rem', right: '.75rem', background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '.9rem' }}>✕</button>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-head)', paddingRight: '2rem' }}>{selected.name}</h2>
              <div style={{ display: 'flex', gap: '.4rem', marginTop: '.6rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,.2)', padding: '.15rem .55rem', borderRadius: '50px', fontSize: '.7rem' }}>💰 {selected.benefit}</span>
                <span style={{ background: 'rgba(255,255,255,.2)', padding: '.15rem .55rem', borderRadius: '50px', fontSize: '.7rem' }}>📅 {selected.deadline}</span>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>
              {/* Language Toggle */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--primary)' }}>
                  <button onClick={() => setLang('en')} style={{ padding: '.35rem .9rem', border: 'none', background: lang === 'en' ? 'var(--primary)' : '#fff', color: lang === 'en' ? '#fff' : 'var(--primary)', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer' }}>English</button>
                  <button onClick={() => setLang('hi')} style={{ padding: '.35rem .9rem', border: 'none', background: lang === 'hi' ? 'var(--primary)' : '#fff', color: lang === 'hi' ? '#fff' : 'var(--primary)', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer' }}>हिंदी</button>
                </div>
              </div>

              {/* About */}
              <div style={{ background: '#f8fdf8', border: '1px solid #C8E6C9', borderRadius: '10px', padding: '.9rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#1B5E20', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.3rem' }}>
                  {lang === 'hi' ? '📋 योजना के बारे में' : '📋 About This Scheme'}
                </div>
                <p style={{ margin: 0, fontSize: '.88rem', lineHeight: 1.6 }}>{lang === 'hi' && selected.descHi ? selected.descHi : selected.desc}</p>
              </div>

              {/* Eligibility */}
              <div style={{ background: '#E3F2FD', borderRadius: '10px', padding: '.9rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#1565C0', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.3rem' }}>
                  {lang === 'hi' ? '👤 कौन आवेदन कर सकता है' : '👤 Who Can Apply'}
                </div>
                <p style={{ margin: 0, fontSize: '.88rem' }}>{lang === 'hi' && selected.eligHi ? selected.eligHi : selected.elig}</p>
              </div>

              {/* Documents */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#7B1FA2', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.4rem' }}>
                  {lang === 'hi' ? '📄 आवश्यक दस्तावेज़' : '📄 Required Documents'}
                </div>
                <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                  {(selected.docs || []).map((d, j) => (
                    <span key={j} style={{ background: '#F3E5F5', color: '#7B1FA2', padding: '.25rem .6rem', borderRadius: '8px', fontSize: '.75rem', fontWeight: 600 }}>📎 {d}</span>
                  ))}
                </div>
              </div>

              {/* Steps */}
              {selected.steps && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#E65100', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.6rem' }}>
                    {lang === 'hi' ? '📝 आवेदन कैसे करें — चरण-दर-चरण' : '📝 How to Apply — Step by Step'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    {selected.steps.map((step, j) => (
                      <div key={j} style={{ display: 'flex', gap: '.65rem', alignItems: 'flex-start', padding: '.6rem .7rem', background: j % 2 === 0 ? '#FFFDE7' : '#fff', borderRadius: '8px', border: '1px solid #FFF9C4' }}>
                        <div style={{ minWidth: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#FF9800,#F57C00)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 800, flexShrink: 0 }}>
                          {j + 1}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '.84rem', color: 'var(--text1)', lineHeight: 1.5 }}>
                            {lang === 'hi' ? step.hi : step.en}
                          </p>
                          {/* Show other language as subtitle */}
                          <p style={{ margin: '.15rem 0 0', fontSize: '.72rem', color: 'var(--text3)', lineHeight: 1.4, fontStyle: 'italic' }}>
                            {lang === 'hi' ? step.en : step.hi}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Button */}
              {selected.applyUrl && selected.status === 'Active' && (
                <a href={selected.applyUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', padding: '.9rem', background: 'linear-gradient(135deg,#1B5E20,#2E7D32)', color: '#fff', border: 'none',
                    borderRadius: '12px', fontSize: '.95rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-body)',
                    boxShadow: '0 4px 12px rgba(46,125,50,.3)', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    {lang === 'hi' ? '🌐 सरकारी वेबसाइट पर आवेदन करें →' : '🌐 Apply on Official Government Website →'}
                  </button>
                </a>
              )}
              {selected.status === 'Upcoming' && (
                <div style={{ textAlign: 'center', padding: '.9rem', background: '#FFF3E0', borderRadius: '10px', color: '#E65100', fontWeight: 700 }}>
                  {lang === 'hi' ? '🔜 आवेदन जल्द शुरू होंगे' : '🔜 Applications will open soon'}
                </div>
              )}

              <p style={{ textAlign: 'center', marginTop: '.75rem', fontSize: '.68rem', color: 'var(--text3)' }}>
                🏛️ {lang === 'hi' ? 'जानकारी सरकारी पोर्टल से ली गई है • आधिकारिक वेबसाइट पर विवरण सत्यापित करें' : 'Information from official government portals • Always verify on the official website'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
