import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../api/axios';

export default function Marketplace({ toast }) {
  const { currentFarmer } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [showSell, setShowSell] = useState(false);
  const [selling, setSelling] = useState(false);
  const [sellForm, setSellForm] = useState({ name:'', minPrice:'', maxPrice:'', qty:'', cat:'Grains', emoji:'🌾', loc:'' });

  // Price advisor state
  const [priceAdvisor, setPriceAdvisor] = useState(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [showAdvisor, setShowAdvisor] = useState(false);

  // Incoming offers state
  const [offers, setOffers] = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchOffers = () => {
    const id = currentFarmer?.id;
    if (id) API.get(`/orders?sellerId=${id}`).then(r => setOffers(r.data.filter(o => o.status === 'offer-pending'))).catch(() => {});
  };

  useEffect(() => {
    API.get('/products').then(r => setProducts(r.data)).catch(() => {});
    fetchOffers();
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (!cat || p.cat === cat)
  );

  const cropEmojis = {
    'Wheat':'🌾','Rice':'🍚','Maize':'🌽','Onion':'🧅','Tomato':'🍅','Potato':'🥔','Banana':'🍌','Mango':'🥭',
    'Grapes':'🍇','Orange':'🍊','Apple':'🍎','Sugarcane':'🎍','Cotton':'☁️','Soybean':'🫘','Chili':'🌶️',
    'Turmeric':'🟡','Groundnut':'🥜','Garlic':'🧄','Ginger':'🫚','Coconut':'🥥','Cauliflower':'🥦',
    'Cabbage':'🥬','Cucumber':'🥒','Pumpkin':'🎃','Pomegranate':'🔴','Papaya':'🟠','Guava':'🟢',
  };

  const updateEmoji = (name) => {
    const match = Object.keys(cropEmojis).find(k => name.toLowerCase().includes(k.toLowerCase()));
    return match ? cropEmojis[match] : '🌿';
  };

  // Fetch price suggestion when crop name changes
  const handleCropChange = (cropName) => {
    setSellForm(prev => ({ ...prev, name: cropName, emoji: updateEmoji(cropName) }));
    if (!cropName) {
      setPriceAdvisor(null);
      setShowAdvisor(false);
      return;
    }
    setAdvisorLoading(true);
    setShowAdvisor(true);
    const farmerState = currentFarmer?.loc?.split(',')[1]?.trim() || currentFarmer?.state || '';
    const params = new URLSearchParams({ commodity: cropName });
    if (farmerState) params.append('state', farmerState);

    API.get(`/prices/govdata/suggest?${params.toString()}`)
      .then(r => {
        setPriceAdvisor(r.data);
        setAdvisorLoading(false);
      })
      .catch(() => {
        setPriceAdvisor(null);
        setAdvisorLoading(false);
      });
  };

  const submitSell = async () => {
    if (!sellForm.name || !sellForm.minPrice || !sellForm.maxPrice || !sellForm.qty) {
      toast('❌ Please fill all required fields (crop, min/max price, qty)');
      return;
    }
    if (Number(sellForm.minPrice) > Number(sellForm.maxPrice)) {
      toast('❌ Min price cannot be more than max price');
      return;
    }
    setSelling(true);
    try {
      const mn = Number(sellForm.minPrice);
      const mx = Number(sellForm.maxPrice);
      const payload = {
        name: sellForm.name,
        price: Math.round((mn + mx) / 2),
        minPrice: mn,
        maxPrice: mx,
        qty: Number(sellForm.qty),
        cat: sellForm.cat,
        emoji: sellForm.emoji || updateEmoji(sellForm.name),
        farmer: currentFarmer?.name || 'Farmer',
        sellerId: currentFarmer?.id || '',
        loc: sellForm.loc || currentFarmer?.loc || 'Maharashtra',
      };
      const { data } = await API.post('/products', payload);
      setProducts(prev => [data, ...prev]);
      toast('✅ Product listed with price range! Buyers can now make offers.');
      setShowSell(false);
      setSellForm({ name:'', minPrice:'', maxPrice:'', qty:'', cat:'Grains', emoji:'🌾', loc:'' });
      setPriceAdvisor(null);
      setShowAdvisor(false);
    } catch (e) {
      toast('❌ ' + (e.response?.data?.message || 'Failed to list product'));
    }
    setSelling(false);
  };

  const cropOptions = [
    'Wheat','Rice','Maize','Bajra','Jowar','Ragi','Onion','Tomato','Potato','Brinjal','Cauliflower','Cabbage',
    'Okra / Lady Finger','Bottle Gourd','Spinach','Garlic','Ginger','Cucumber','Banana','Mango','Grapes',
    'Orange','Apple','Papaya','Guava','Pomegranate','Lemon','Watermelon','Sugarcane','Cotton','Soybean',
    'Groundnut','Mustard','Sunflower','Chana','Arhar / Tur','Moong','Urad','Turmeric','Chili','Coriander',
    'Cumin','Black Pepper','Cardamom','Coconut','Jute','Tea','Coffee',
  ];

  return (
    <>
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'}}>
        <div><h1>🛒 Marketplace</h1><p>Sell crops & manage buyer offers</p></div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {offers.length > 0 && <span style={{ background: '#FF5722', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.8rem', animation: 'pulse 1.5s infinite' }}>{offers.length}</span>}
          <button className="btn btn-green" onClick={() => setShowSell(!showSell)}>
            {showSell ? '✕ Cancel' : '📦 Sell Your Crop'}
          </button>
        </div>
      </div>

      {/* INCOMING OFFERS */}
      {offers.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid #FF9800', background: '#FFF8E1' }}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg,#E65100,#FF9800)', color: '#fff', margin: '-1rem -1rem .75rem', padding: '.75rem 1rem', borderRadius: 'var(--radius2) var(--radius2) 0 0' }}>
            <span className="card-title" style={{ color: '#fff' }}>📩 Incoming Buyer Offers ({offers.length})</span>
          </div>
          {offers.map(o => (
            <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.75rem', background: '#fff', borderRadius: '10px', marginBottom: '.5rem', border: '1px solid #FFE0B2', flexWrap: 'wrap', gap: '.5rem' }}>
              <div>
                <b>{o.productName}</b> · {o.qty} qtl
                <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>🛒 Buyer: {o.buyerName} · 📍 {o.buyerLoc}</div>
                <div style={{ fontSize: '.82rem', marginTop: '.2rem' }}>
                  <span style={{ color: 'var(--text3)' }}>Listed: ₹{o.price}/qtl</span>
                  <span style={{ color: '#1565C0', fontWeight: 800, marginLeft: '.75rem', fontSize: '.95rem' }}>Offer: ₹{o.offeredPrice}/qtl</span>
                  <span style={{ color: '#E65100', fontWeight: 700, marginLeft: '.75rem' }}>Total: ₹{(o.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.4rem' }}>
                <button className="btn btn-green btn-sm" onClick={async () => {
                  try { await API.put(`/orders/${o._id}/accept`); toast('✅ Offer accepted! Buyer will pay to escrow.'); fetchOffers(); } catch { toast('❌ Failed'); }
                }}>✅ Accept</button>
                <button className="btn btn-sm" style={{ background: '#FFEBEE', color: '#C62828', border: '1px solid #EF9A9A' }} onClick={() => setRejectModal(o)}>❌ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }} onClick={() => setRejectModal(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '420px', width: '100%', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 .5rem', color: '#C62828' }}>❌ Reject Offer</h3>
            <p style={{ fontSize: '.85rem', color: 'var(--text2)' }}>{rejectModal.productName} · ₹{rejectModal.offeredPrice}/qtl from {rejectModal.buyerName}</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason (optional) — price too low, not available..." rows={2} style={{ width: '100%', padding: '.6rem', border: '2px solid var(--border)', borderRadius: '8px', fontFamily: 'var(--font-body)', marginTop: '.5rem' }} />
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
              <button className="btn" style={{ flex: 1, background: '#C62828', color: '#fff' }} onClick={async () => {
                try { await API.put(`/orders/${rejectModal._id}/reject`, { reason: rejectReason }); toast('❌ Offer rejected. Buyer notified.'); setRejectModal(null); setRejectReason(''); fetchOffers(); } catch { toast('❌ Failed'); }
              }}>❌ Reject Offer</button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Form */}
      {showSell && (
        <div className="card" style={{marginBottom:'1.5rem',border:'2px solid var(--primary)',background:'#f0f9f0'}}>
          <div className="card-header"><span className="card-title">📦 List Your Crop for Sale</span></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div className="reg-field">
              <label>Crop Name *</label>
              <select value={sellForm.name} onChange={e => handleCropChange(e.target.value)}>
                <option value="">Select crop to sell</option>
                {cropOptions.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="reg-field">
              <label>Min Price (₹/qtl) *</label>
              <input value={sellForm.minPrice} onChange={e=>setSellForm({...sellForm,minPrice:e.target.value})} type="number" placeholder="e.g. 3000"/>
              {priceAdvisor?.found && priceAdvisor?.overallMin && (
                <div style={{ fontSize: '.68rem', color: '#1565C0', marginTop: '.2rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setSellForm({...sellForm, minPrice: String(priceAdvisor.overallMin)})}>
                  💡 Market min: ₹{priceAdvisor.overallMin.toLocaleString()} (click to use)
                </div>
              )}
            </div>
            <div className="reg-field">
              <label>Max Price (₹/qtl) *</label>
              <input value={sellForm.maxPrice} onChange={e=>setSellForm({...sellForm,maxPrice:e.target.value})} type="number" placeholder="e.g. 4000"/>
              {priceAdvisor?.found && priceAdvisor?.overallMax && (
                <div style={{ fontSize: '.68rem', color: '#E65100', marginTop: '.2rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setSellForm({...sellForm, maxPrice: String(priceAdvisor.overallMax)})}>
                  💡 Market max: ₹{priceAdvisor.overallMax.toLocaleString()} (click to use)
                </div>
              )}
            </div>
            <div className="reg-field">
              <label>Quantity (quintals) *</label>
              <input value={sellForm.qty} onChange={e=>setSellForm({...sellForm,qty:e.target.value})} type="number" placeholder="e.g. 25"/>
            </div>
            <div className="reg-field">
              <label>Category</label>
              <select value={sellForm.cat} onChange={e=>setSellForm({...sellForm,cat:e.target.value})}>
                <option>Grains</option><option>Vegetables</option><option>Fruits</option>
                <option>Pulses</option><option>Spices</option><option>Cash Crops</option><option>Oilseeds</option>
              </select>
            </div>
            <div className="reg-field">
              <label>Your Location</label>
              <input value={sellForm.loc} onChange={e=>setSellForm({...sellForm,loc:e.target.value})} placeholder={currentFarmer?.loc || 'e.g. Nashik, Maharashtra'} type="text"/>
            </div>
            <div className="reg-field">
              <label>Emoji Icon</label>
              <input value={sellForm.emoji} onChange={e=>setSellForm({...sellForm,emoji:e.target.value})} placeholder="🌾" type="text" style={{fontSize:'1.2rem',textAlign:'center'}}/>
            </div>
          </div>

          {/* ===== PRICE ADVISOR PANEL ===== */}
          {showAdvisor && (
            <div style={{
              marginTop: '1.25rem',
              padding: '1.25rem',
              background: 'linear-gradient(135deg, #f8fdf8, #e8f5e9)',
              borderRadius: '14px',
              border: '1.5px solid #C8E6C9',
              animation: 'slideDown .3s ease',
            }}>
              <style>{`
                @keyframes slideDown { from { opacity: 0; max-height: 0; transform: translateY(-10px); } to { opacity: 1; max-height: 2000px; transform: translateY(0); } }
                @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
              `}</style>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>💹</span>
                  <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: '1rem', color: '#1B5E20' }}>
                    Price Advisor – {sellForm.name}
                  </span>
                  <span style={{ fontSize: '.65rem', color: '#fff', background: '#2E7D32', padding: '.15rem .55rem', borderRadius: '50px', fontWeight: 700 }}>
                    🏛️ data.gov.in
                  </span>
                </div>
                <button onClick={() => setShowAdvisor(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#999' }}>✕</button>
              </div>

              {advisorLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{
                    width: '100%', height: '10px', borderRadius: '5px',
                    background: 'linear-gradient(90deg, #E8F5E9 25%, #A5D6A7 50%, #E8F5E9 75%)',
                    backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
                  }} />
                  <p style={{ color: 'var(--text2)', marginTop: '.75rem', fontSize: '.85rem' }}>
                    Fetching real-time market prices...
                  </p>
                </div>
              ) : priceAdvisor?.found ? (
                <>
                  {/* Stats Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.65rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#fff', borderRadius: '10px', padding: '.75rem .5rem', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.05)', border: '1px solid #E8F5E9' }}>
                      <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Avg Modal</div>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--primary)', fontSize: '1.15rem' }}>₹{priceAdvisor.avgModal.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '10px', padding: '.75rem .5rem', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.05)', border: '1px solid #E3F2FD' }}>
                      <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Min Price</div>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: '#1565C0', fontSize: '1.15rem' }}>₹{priceAdvisor.overallMin.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '10px', padding: '.75rem .5rem', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.05)', border: '1px solid #F3E5F5' }}>
                      <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Max Price</div>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: '#7B1FA2', fontSize: '1.15rem' }}>₹{priceAdvisor.overallMax.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '10px', padding: '.75rem .5rem', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.05)', border: '1px solid #FFF3E0' }}>
                      <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Markets</div>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: '#E65100', fontSize: '1.15rem' }}>{priceAdvisor.marketCount}</div>
                    </div>
                  </div>

                  {/* Suggested Price Banner */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1B5E20, #2E7D32, #43A047)',
                    borderRadius: '12px', padding: '1rem 1.25rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '1rem', boxShadow: '0 4px 12px rgba(46,125,50,.25)',
                  }}>
                    <div>
                      <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>🎯 RECOMMENDED SELLING PRICE</div>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, color: '#fff', fontSize: '1.8rem', letterSpacing: '-0.5px' }}>
                        ₹{priceAdvisor.suggestedPrice.toLocaleString()}<span style={{ fontSize: '.8rem', fontWeight: 400, opacity: .7 }}>/quintal</span>
                      </div>
                      <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.7)', marginTop: '.15rem' }}>
                        Average market price + 5% farmer advantage margin
                      </div>
                    </div>
                    <button
                      onClick={() => setSellForm(prev => ({ ...prev, price: String(priceAdvisor.suggestedPrice) }))}
                      style={{
                        background: '#fff', color: '#1B5E20', border: 'none',
                        padding: '.65rem 1.25rem', borderRadius: '10px', fontWeight: 800,
                        cursor: 'pointer', fontSize: '.85rem', fontFamily: 'var(--font-body)',
                        boxShadow: '0 2px 8px rgba(0,0,0,.15)', transition: 'all .2s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; }}
                      onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
                    >
                      ✅ Use This Price
                    </button>
                  </div>

                  {/* Bar Chart */}
                  {priceAdvisor.records?.length > 0 && (
                    <div style={{ background: '#fff', borderRadius: '10px', padding: '1rem', marginBottom: '.75rem', border: '1px solid #eee' }}>
                      <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text1)', marginBottom: '.75rem' }}>
                        📊 Modal Price Across {priceAdvisor.records.length} Mandis
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '120px', overflowX: 'auto' }}>
                        {priceAdvisor.records.slice(0, 25).map((r, i) => {
                          const allModal = priceAdvisor.records.map(d => d.modal_price);
                          const maxP = Math.max(...allModal);
                          const minP = Math.min(...allModal);
                          const range = maxP - minP || 1;
                          const height = ((r.modal_price - minP) / range) * 90 + 20;
                          const isAboveAvg = r.modal_price >= priceAdvisor.avgModal;
                          return (
                            <div key={i}
                              title={`${r.market}, ${r.district} (${r.state})\n₹${r.modal_price}/qtl • Min: ₹${r.min_price} • Max: ₹${r.max_price}`}
                              style={{
                                flex: 1, minWidth: '12px', height: height + 'px',
                                background: isAboveAvg ? 'linear-gradient(to top, #43A047, #66BB6A)' : 'linear-gradient(to top, #EF5350, #E57373)',
                                borderRadius: '3px 3px 0 0', cursor: 'pointer', transition: 'all .2s', opacity: .85,
                              }}
                              onMouseEnter={e => { e.target.style.opacity = '1'; e.target.style.transform = 'scaleY(1.08)'; }}
                              onMouseLeave={e => { e.target.style.opacity = '.85'; e.target.style.transform = 'scaleY(1)'; }}
                            />
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.62rem', color: 'var(--text3)', marginTop: '.35rem' }}>
                        <span>🟢 Above average</span>
                        <span>Hover for mandi details</span>
                        <span>🔴 Below average</span>
                      </div>
                    </div>
                  )}

                  {/* Market Table */}
                  {priceAdvisor.records?.length > 0 && (
                    <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' }}>
                      <div style={{ padding: '.65rem 1rem', borderBottom: '1px solid #eee', fontSize: '.78rem', fontWeight: 700, color: 'var(--text1)' }}>
                        📋 Detailed Market Prices
                      </div>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <table style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th style={{ fontSize: '.7rem', padding: '.45rem .6rem' }}>Market</th>
                              <th style={{ fontSize: '.7rem', padding: '.45rem .6rem' }}>State</th>
                              <th style={{ fontSize: '.7rem', padding: '.45rem .6rem' }}>Min (₹)</th>
                              <th style={{ fontSize: '.7rem', padding: '.45rem .6rem' }}>Max (₹)</th>
                              <th style={{ fontSize: '.7rem', padding: '.45rem .6rem' }}>Modal (₹)</th>
                              <th style={{ fontSize: '.7rem', padding: '.45rem .6rem' }}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {priceAdvisor.records.map((r, i) => (
                              <tr key={i}>
                                <td style={{ fontSize: '.78rem', padding: '.4rem .6rem' }}><b>{r.market}</b><br /><span style={{ fontSize: '.65rem', color: 'var(--text3)' }}>{r.district}</span></td>
                                <td style={{ fontSize: '.75rem', padding: '.4rem .6rem' }}>{r.state}</td>
                                <td style={{ fontSize: '.78rem', padding: '.4rem .6rem' }}>₹{r.min_price.toLocaleString()}</td>
                                <td style={{ fontSize: '.78rem', padding: '.4rem .6rem' }}>₹{r.max_price.toLocaleString()}</td>
                                <td style={{ fontSize: '.85rem', padding: '.4rem .6rem', fontWeight: 800, color: 'var(--primary)' }}>₹{r.modal_price.toLocaleString()}</td>
                                <td style={{ fontSize: '.72rem', padding: '.4rem .6rem', color: 'var(--text3)' }}>{r.arrival_date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div style={{ textAlign: 'center', marginTop: '.75rem', fontSize: '.65rem', color: 'var(--text3)' }}>
                    🏛️ Source: Ministry of Agriculture & Farmers Welfare via data.gov.in
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🔍</div>
                  <p style={{ color: 'var(--text2)', fontSize: '.85rem' }}>
                    No live market data available for <b>{sellForm.name}</b> right now.
                  </p>
                  <p style={{ color: 'var(--text3)', fontSize: '.75rem', marginTop: '.25rem' }}>
                    Try checking the Market Prices section for historical data from CEDA.
                  </p>
                </div>
              )}
            </div>
          )}

          <button className="btn btn-green" onClick={submitSell} disabled={selling} style={{marginTop:'1rem',width:'100%'}}>
            {selling ? '⏳ Listing...' : '🚀 List on Marketplace'}
          </button>
        </div>
      )}

      <div className="search-bar">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search crops..." type="text"/>
        <select value={cat} onChange={e=>setCat(e.target.value)}>
          <option value="">All Categories</option>
          <option>Grains</option><option>Vegetables</option><option>Fruits</option>
          <option>Pulses</option><option>Spices</option><option>Cash Crops</option><option>Oilseeds</option>
        </select>
      </div>
      <div className="product-grid">
        {filtered.map((p,i) => (
          <div key={i} className="product-card">
            <div className="p-emoji">{p.emoji}</div>
            <h4>{p.name}</h4>
            {p.minPrice && p.maxPrice ? (
              <div className="price" style={{ fontSize: '.95rem' }}>
                ₹{p.minPrice.toLocaleString()} — ₹{p.maxPrice.toLocaleString()}<span style={{fontSize:'.72rem',fontWeight:400,color:'var(--text2)'}}>/qtl</span>
              </div>
            ) : (
              <div className="price">₹{(p.price||0).toLocaleString()}<span style={{fontSize:'.72rem',fontWeight:400,color:'var(--text2)'}}>/qtl</span></div>
            )}
            <div className="meta">📦 {p.qty} qtl available</div>
            <div className="meta">👨‍🌾 {p.farmer}</div>
            <div className="meta">📍 {p.loc}</div>
            <div className="meta"><span className="badge badge-blue">{p.cat}</span></div>
            <div className="actions">
              <button className="btn btn-outline btn-sm" style={{flex:1}} onClick={() => toast(`${p.name} added to watchlist ⭐`)}>⭐ Watch</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
