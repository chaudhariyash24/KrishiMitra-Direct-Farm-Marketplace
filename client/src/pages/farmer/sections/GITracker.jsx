import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../api/axios';

const fallbackGI = [
  { name: 'Alphonso Mango', origin: 'Ratnagiri, Maharashtra', state: 'Maharashtra', farmer: 'GI Registry', journey: [{step:'Picked',date:'2026-03-15',done:true},{step:'Graded',date:'2026-03-18',done:true},{step:'Lab Tested',date:'2026-03-22',done:true},{step:'GI Certified',date:'2026-04-01',done:true},{step:'Market Ready',date:'2026-04-05',done:true}], status: 'Verified', giTag: 'GI/MH/001', regYear: 2018, desc: 'Premium mango variety known for rich flavor, grown exclusively in Konkan region.' },
  { name: 'Darjeeling Tea', origin: 'Darjeeling, West Bengal', state: 'West Bengal', farmer: 'GI Registry', journey: [{step:'Plucked',date:'2026-02-10',done:true},{step:'Processed',date:'2026-02-12',done:true},{step:'Quality Tested',date:'2026-02-20',done:true},{step:'GI Certified',date:'2026-03-01',done:true},{step:'Export Ready',date:'2026-03-05',done:true}], status: 'Verified', giTag: 'GI/WB/001', regYear: 2004, desc: 'World-famous tea with muscatel flavor, grown at 2000m+ elevation.' },
  { name: 'Nashik Grapes', origin: 'Nashik, Maharashtra', state: 'Maharashtra', farmer: 'GI Registry', journey: [{step:'Harvested',date:'2026-01-20',done:true},{step:'Graded',date:'2026-01-22',done:true},{step:'GI Certified',date:'2026-02-01',done:true},{step:'Packed',date:'2026-02-03',done:true}], status: 'Verified', giTag: 'GI/MH/003', regYear: 2016, desc: 'Table and wine grapes from the grape capital of India.' },
  { name: 'Kolhapur Jaggery', origin: 'Kolhapur, Maharashtra', state: 'Maharashtra', farmer: 'GI Registry', journey: [{step:'Cane Harvested',date:'2026-01-10',done:true},{step:'Crushed',date:'2026-01-11',done:true},{step:'Boiled & Molded',date:'2026-01-12',done:true},{step:'GI Certified',date:'2026-01-25',done:true}], status: 'Verified', giTag: 'GI/MH/005', regYear: 2019, desc: 'Traditional dark jaggery with distinct caramel flavor.' },
  { name: 'Kashmiri Saffron', origin: 'Pampore, J&K', state: 'J&K', farmer: 'GI Registry', journey: [{step:'Grown',date:'2025-10-15',done:true},{step:'Handpicked',date:'2025-11-01',done:true},{step:'Dried',date:'2025-11-10',done:true},{step:'GI Certified',date:'2025-12-01',done:true}], status: 'Verified', giTag: 'GI/JK/001', regYear: 2020, desc: 'World\'s most expensive spice, grown only in Kashmir valley.' },
  { name: 'Nagpur Orange', origin: 'Nagpur, Maharashtra', state: 'Maharashtra', farmer: 'GI Registry', journey: [{step:'Picked',date:'2026-02-01',done:true},{step:'Sorted',date:'2026-02-03',done:true},{step:'Lab Tested',date:'2026-02-10',done:true},{step:'GI Certified',date:'2026-02-20',done:true}], status: 'Verified', giTag: 'GI/MH/002', regYear: 2014, desc: 'Sweet and juicy oranges from the Orange City of India.' },
  { name: 'Basmati Rice', origin: 'Punjab / Haryana', state: 'Punjab', farmer: 'GI Registry', journey: [{step:'Sown',date:'2025-06-15',done:true},{step:'Harvested',date:'2025-11-01',done:true},{step:'Milled',date:'2025-11-15',done:true},{step:'GI Certified',date:'2025-12-10',done:true}], status: 'Verified', giTag: 'GI/PB/001', regYear: 2016, desc: 'Long-grain aromatic rice prized worldwide.' },
  { name: 'Mahabaleshwar Strawberry', origin: 'Mahabaleshwar, Maharashtra', state: 'Maharashtra', farmer: 'GI Registry', journey: [{step:'Picked',date:'2026-01-05',done:true},{step:'Cold Stored',date:'2026-01-06',done:true},{step:'Lab Testing',date:null,done:false},{step:'GI Certification',date:null,done:false}], status: 'Pending', giTag: null, regYear: null, desc: 'Fresh hill-grown strawberries from Western Ghats.' },
];

const certSteps = ['Harvest & Collection', 'Quality Testing', 'Origin Verification', 'Lab Analysis', 'GI Certification', 'Market Ready'];

export default function GITracker() {
  const { currentFarmer } = useAuth();
  const [giProducts, setGiProducts] = useState([]);
  const [tab, setTab] = useState('browse');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', origin: '', desc: '' });
  const [myProducts, setMyProducts] = useState([]);

  useEffect(() => {
    API.get('/gi').then(r => {
      setGiProducts(r.data.length > 0 ? r.data : fallbackGI);
    }).catch(() => setGiProducts(fallbackGI));
  }, []);

  const data = giProducts.length > 0 ? giProducts : fallbackGI;
  const verified = data.filter(g => g.status === 'Verified');
  const pending = data.filter(g => g.status === 'Pending');

  const filtered = data.filter(g => {
    if (!search) return true;
    return g.name.toLowerCase().includes(search.toLowerCase()) || g.origin?.toLowerCase().includes(search.toLowerCase());
  });

  const handleVerify = () => {
    if (!verifyCode.trim()) return;
    const found = data.find(g => g.giTag && g.giTag.toLowerCase() === verifyCode.trim().toLowerCase());
    setVerifyResult(found ? { valid: true, product: found } : { valid: false });
  };

  const handleRegister = () => {
    if (!regForm.name || !regForm.origin) return;
    const newProduct = {
      name: regForm.name,
      origin: regForm.origin,
      state: regForm.origin.split(',').pop()?.trim() || '',
      farmer: currentFarmer?.name || 'Farmer',
      desc: regForm.desc || '',
      status: 'Pending',
      giTag: null,
      regYear: null,
      journey: [
        { step: 'Application Submitted', date: new Date().toISOString().split('T')[0], done: true },
        { step: 'Document Verification', date: null, done: false },
        { step: 'Field Inspection', date: null, done: false },
        { step: 'Lab Testing', date: null, done: false },
        { step: 'GI Certification', date: null, done: false },
      ],
    };
    setMyProducts(prev => [...prev, newProduct]);
    setRegForm({ name: '', origin: '', desc: '' });
    setShowRegister(false);
  };

  const allProducts = [...data, ...myProducts];

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>🔗 GI Tracker</h1>
          <p>Geographical Indication — certify origin, verify authenticity, get premium prices</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card"><div className="icon-box icon-green">✅</div><div className="info"><h3>{verified.length}</h3><p>GI Certified</p></div></div>
        <div className="stat-card"><div className="icon-box icon-orange">🔄</div><div className="info"><h3>{pending.length + myProducts.length}</h3><p>Pending</p></div></div>
        <div className="stat-card"><div className="icon-box icon-purple">🌍</div><div className="info"><h3>{new Set(data.map(g => g.state)).size}</h3><p>States</p></div></div>
        <div className="stat-card"><div className="icon-box icon-blue">📦</div><div className="info"><h3>{allProducts.length}</h3><p>Total Products</p></div></div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.2rem' }}>
        <div className={`tab${tab === 'browse' ? ' active' : ''}`} onClick={() => setTab('browse')}>📋 Browse Products</div>
        <div className={`tab${tab === 'verify' ? ' active' : ''}`} onClick={() => setTab('verify')}>🔍 Verify Authenticity</div>
        <div className={`tab${tab === 'my' ? ' active' : ''}`} onClick={() => setTab('my')}>📝 My Applications {myProducts.length > 0 && <span style={{ background: '#E65100', color: '#fff', borderRadius: '50%', padding: '0 .4rem', fontSize: '.7rem', marginLeft: '.3rem' }}>{myProducts.length}</span>}</div>
      </div>

      {/* BROWSE TAB */}
      {tab === 'browse' && (
        <div>
          <div style={{ display: 'flex', gap: '.8rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search products or origin..." type="text" style={{ flex: 1, padding: '.55rem 1rem', border: '2px solid var(--border)', borderRadius: 'var(--radius2)', fontFamily: 'var(--font-body)', fontSize: '.88rem', minWidth: '200px' }} />
          </div>

          {selected ? (
            /* DETAIL VIEW */
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ background: selected.status === 'Verified' ? 'linear-gradient(135deg,#2E7D32,#43A047)' : 'linear-gradient(135deg,#E65100,#FF8F00)', color: '#fff', padding: '1.2rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{selected.name}</h2>
                    <div style={{ opacity: .85, marginTop: '.3rem' }}>📍 {selected.origin} {selected.giTag && `· 🏷️ ${selected.giTag}`}</div>
                  </div>
                  <span style={{ background: 'rgba(255,255,255,.2)', padding: '.3rem .8rem', borderRadius: '20px', fontWeight: 800, fontSize: '.8rem' }}>
                    {selected.status === 'Verified' ? '✅ GI CERTIFIED' : '🔄 PENDING'}
                  </span>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                {selected.desc && <p style={{ color: 'var(--text2)', marginBottom: '1.2rem', lineHeight: 1.6 }}>{selected.desc}</p>}

                <h4 style={{ color: 'var(--primary-dark)', marginBottom: '.8rem' }}>📊 Certification Journey</h4>
                <div style={{ position: 'relative', paddingLeft: '2rem', marginBottom: '1.5rem' }}>
                  {(selected.journey || []).map((j, k) => (
                    <div key={k} style={{ position: 'relative', paddingBottom: k < selected.journey.length - 1 ? '1.5rem' : 0, paddingLeft: '1.5rem' }}>
                      {/* Vertical line */}
                      {k < selected.journey.length - 1 && (
                        <div style={{ position: 'absolute', left: '8px', top: '20px', bottom: 0, width: '2px', background: j.done ? '#4CAF50' : '#E0E0E0' }} />
                      )}
                      {/* Dot */}
                      <div style={{ position: 'absolute', left: 0, top: '4px', width: '18px', height: '18px', borderRadius: '50%', background: j.done ? '#4CAF50' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', color: '#fff', fontWeight: 800 }}>
                        {j.done ? '✓' : k + 1}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '.88rem', color: j.done ? '#2E7D32' : 'var(--text3)' }}>{j.step || j}</div>
                      {j.date && <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{new Date(j.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  {selected.regYear && <span className="badge badge-blue">📅 Registered: {selected.regYear}</span>}
                  <span className="badge badge-purple">🌍 {selected.state}</span>
                </div>

                <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => setSelected(null)}>← Back to List</button>
              </div>
            </div>
          ) : (
            /* LIST VIEW */
            filtered.map((g, i) => (
              <div key={i} className="gi-card" style={{ cursor: 'pointer', borderLeft: `4px solid ${g.status === 'Verified' ? '#4CAF50' : '#FF9800'}` }} onClick={() => setSelected(g)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '.3rem' }}>{g.name}</h3>
                    <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>
                      📍 {g.origin}
                      {g.giTag && <span style={{ marginLeft: '.5rem', background: '#E3F2FD', color: '#1565C0', padding: '.1rem .5rem', borderRadius: '4px', fontSize: '.72rem', fontWeight: 700 }}>🏷️ {g.giTag}</span>}
                    </div>
                    {g.desc && <p style={{ fontSize: '.8rem', color: 'var(--text3)', marginTop: '.3rem', lineHeight: 1.4 }}>{g.desc.slice(0, 80)}...</p>}
                  </div>
                  <span className={`badge ${g.status === 'Verified' ? 'badge-green' : 'badge-orange'}`}>
                    {g.status === 'Verified' ? '✅ Certified' : '🔄 Pending'}
                  </span>
                </div>
                <div className="journey-steps" style={{ marginTop: '.5rem' }}>
                  {(g.journey || []).map((j, k) => {
                    const stepName = j.step || j;
                    const isDone = j.done !== undefined ? j.done : true;
                    return (
                      <span key={k}>
                        <span className="journey-step" style={{ background: isDone ? '#E8F5E9' : '#F5F5F5', color: isDone ? '#2E7D32' : '#9E9E9E' }}>{stepName}</span>
                        {k < g.journey.length - 1 && <span className="journey-arrow" style={{ color: isDone ? '#4CAF50' : '#BDBDBD' }}>→</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VERIFY TAB */}
      {tab === 'verify' && (
        <div className="card" style={{ maxWidth: '500px' }}>
          <div className="card-header"><span className="card-title">🔍 Verify GI Authenticity</span></div>
          <p style={{ color: 'var(--text2)', marginBottom: '1rem', fontSize: '.88rem' }}>
            Enter the GI tag code printed on the product packaging to verify its authenticity and origin.
          </p>
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
            <input value={verifyCode} onChange={e => setVerifyCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleVerify()} placeholder="e.g. GI/MH/001" type="text" style={{ flex: 1, padding: '.6rem 1rem', border: '2px solid var(--border)', borderRadius: 'var(--radius2)', fontFamily: 'var(--font-body)', fontSize: '.95rem', fontWeight: 700 }} />
            <button className="btn btn-green" onClick={handleVerify}>Verify ✓</button>
          </div>
          {verifyResult && (
            verifyResult.valid ? (
              <div style={{ background: '#E8F5E9', border: '2px solid #4CAF50', borderRadius: '12px', padding: '1.2rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2E7D32', marginBottom: '.5rem' }}>✅ AUTHENTIC — GI Verified!</div>
                <div style={{ fontSize: '.88rem', color: '#333' }}>
                  <div><b>Product:</b> {verifyResult.product.name}</div>
                  <div><b>Origin:</b> {verifyResult.product.origin}</div>
                  <div><b>GI Tag:</b> {verifyResult.product.giTag}</div>
                  {verifyResult.product.regYear && <div><b>Registered:</b> {verifyResult.product.regYear}</div>}
                </div>
              </div>
            ) : (
              <div style={{ background: '#FFEBEE', border: '2px solid #E53935', borderRadius: '12px', padding: '1.2rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#C62828' }}>❌ NOT FOUND</div>
                <p style={{ color: '#C62828', fontSize: '.85rem' }}>This GI tag code was not found in our registry. The product may be counterfeit or unregistered.</p>
              </div>
            )
          )}
          <div style={{ marginTop: '1.5rem', background: '#F5F5F5', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '.5rem' }}>📋 Sample GI Codes to Try:</div>
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {['GI/MH/001', 'GI/WB/001', 'GI/JK/001', 'GI/PB/001'].map(code => (
                <button key={code} className="badge badge-blue" style={{ cursor: 'pointer', border: 'none' }} onClick={() => { setVerifyCode(code); setVerifyResult(null); }}>{code}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MY APPLICATIONS TAB */}
      {tab === 'my' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
            <p style={{ color: 'var(--text2)' }}>Register your products for GI certification to get premium prices.</p>
            <button className="btn btn-green" onClick={() => setShowRegister(!showRegister)}>{showRegister ? '✕ Cancel' : '+ Register Product'}</button>
          </div>

          {showRegister && (
            <div className="booking-form-card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--primary-dark)', marginBottom: '1rem' }}>📝 Register for GI Certification</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} placeholder="e.g. Jalgaon Banana" />
                </div>
                <div className="form-group">
                  <label>Origin (District, State) *</label>
                  <input value={regForm.origin} onChange={e => setRegForm({ ...regForm, origin: e.target.value })} placeholder="e.g. Jalgaon, Maharashtra" />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input value={regForm.desc} onChange={e => setRegForm({ ...regForm, desc: e.target.value })} placeholder="What makes this product unique to your region?" />
              </div>
              <button className="btn btn-green" onClick={handleRegister} style={{ marginTop: '.5rem' }}>📝 Submit Application</button>
            </div>
          )}

          {myProducts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
              <h3>No applications yet</h3>
              <p>Click "Register Product" to apply for GI certification for your region-specific products.</p>
            </div>
          ) : (
            myProducts.map((g, i) => (
              <div key={i} className="gi-card" style={{ borderLeft: '4px solid #FF9800' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <h3>{g.name}</h3>
                    <div style={{ fontSize: '.82rem', color: 'var(--text2)' }}>📍 {g.origin} · 👨‍🌾 {g.farmer}</div>
                  </div>
                  <span className="badge badge-orange">🔄 Pending Review</span>
                </div>
                <div style={{ position: 'relative', paddingLeft: '1.5rem', marginTop: '1rem' }}>
                  {g.journey.map((j, k) => (
                    <div key={k} style={{ position: 'relative', paddingBottom: k < g.journey.length - 1 ? '1rem' : 0, paddingLeft: '1.5rem' }}>
                      {k < g.journey.length - 1 && <div style={{ position: 'absolute', left: '8px', top: '18px', bottom: 0, width: '2px', background: j.done ? '#4CAF50' : '#E0E0E0' }} />}
                      <div style={{ position: 'absolute', left: 0, top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: j.done ? '#4CAF50' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.55rem', color: '#fff', fontWeight: 800 }}>
                        {j.done ? '✓' : k + 1}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '.85rem', color: j.done ? '#2E7D32' : 'var(--text3)' }}>{j.step}</div>
                      {j.date && <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{j.date}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
