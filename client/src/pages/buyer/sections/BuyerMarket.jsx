import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../api/axios';

const categories = ['All', 'Grains', 'Vegetables', 'Fruits', 'Pulses', 'Oilseeds', 'Spices', 'Cash Crops'];

export default function BuyerMarket({ toast }) {
  const { currentBuyer } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [buyModal, setBuyModal] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState(1);
  // Real market price
  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);

  useEffect(() => {
    API.get('/products').then(r => setProducts(r.data)).catch(() => {});
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.farmer || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = cat === 'All' || (p.cat || '').toLowerCase().includes(cat.toLowerCase());
    return matchSearch && matchCat;
  });

  const openOffer = (p) => {
    setBuyModal(p);
    setOfferPrice(String(p.price));
    setOfferQty(1);
    // Fetch real market price for this crop
    setMarketData(null);
    setMarketLoading(true);
    const buyerState = currentBuyer?.state || currentBuyer?.loc?.split(',')[1]?.trim() || '';
    const params = new URLSearchParams({ commodity: p.name });
    if (buyerState) params.append('state', buyerState);
    API.get(`/prices/govdata/suggest?${params.toString()}`)
      .then(r => { setMarketData(r.data); setMarketLoading(false); })
      .catch(() => { setMarketData(null); setMarketLoading(false); });
  };

  const sendOffer = async () => {
    if (!buyModal) return;
    const op = parseInt(offerPrice);
    if (!op || op <= 0) { toast('⚠️ Enter a valid offer price'); return; }
    try {
      await API.post('/orders', {
        productId: buyModal._id,
        productName: buyModal.name,
        qty: offerQty,
        price: buyModal.price,
        offeredPrice: op,
        buyerName: currentBuyer?.name || 'Buyer',
        buyerId: currentBuyer?.id || '',
        buyerPhone: currentBuyer?.phone || '',
        buyerLoc: currentBuyer?.loc || '',
        sellerName: buyModal.farmer || 'Seller',
        sellerId: buyModal.sellerId || '',
        sellerLoc: buyModal.loc || '',
      });
      toast(`✅ Offer sent! ₹${op}/qtl × ${offerQty} qtl = ₹${(op * offerQty).toLocaleString()} — waiting for farmer to accept.`);
      setBuyModal(null);
    } catch (e) { toast('❌ ' + (e.response?.data?.message || 'Failed')); }
  };

  return (
    <>
      <div className="page-header"><h1>🛒 Browse Market</h1><p>Buy from farmers — send offers, negotiate price</p></div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search products or farmers..." style={{ flex: 1, minWidth: '200px', padding: '.6rem 1rem', border: '2px solid var(--border)', borderRadius: 'var(--radius2)', fontFamily: 'var(--font-body)' }} />
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ padding: '.6rem 1rem', border: '2px solid var(--border)', borderRadius: 'var(--radius2)', fontFamily: 'var(--font-body)' }}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div><h3>No products found</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
          {filtered.map(p => (
            <div key={p._id} className="card" style={{ padding: '1rem', transition: 'all .2s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 .2rem', fontFamily: 'var(--font-head)' }}>{p.name}</h4>
                  <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '.15rem .5rem', borderRadius: '4px', fontSize: '.68rem', fontWeight: 600 }}>{p.cat}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {p.minPrice && p.maxPrice ? (
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: '#1565C0', fontSize: '.95rem' }}>
                      ₹{p.minPrice.toLocaleString()} — ₹{p.maxPrice.toLocaleString()}<span style={{ fontSize: '.65rem', fontWeight: 400, color: 'var(--text2)' }}>/qtl</span>
                    </div>
                  ) : (
                    <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: '#1565C0', fontSize: '1.1rem' }}>₹{(p.price || 0).toLocaleString()}<span style={{ fontSize: '.7rem', fontWeight: 400, color: 'var(--text2)' }}>/qtl</span></div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: '.82rem', color: 'var(--text2)', margin: '.5rem 0' }}>
                <div>👨‍🌾 {p.farmer} · 📍 {p.loc}</div>
                <div>📦 {p.qty} qtl available</div>
              </div>
              <button className="btn btn-green btn-sm" style={{ width: '100%' }} onClick={() => openOffer(p)}>💰 Make Offer</button>
            </div>
          ))}
        </div>
      )}

      {/* OFFER MODAL */}
      {buyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }} onClick={() => setBuyModal(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 .3rem', fontFamily: 'var(--font-head)', color: 'var(--primary)' }}>💰 Make an Offer</h3>
            <p style={{ fontSize: '.85rem', color: 'var(--text2)', margin: '0 0 1rem' }}>{buyModal.name} by {buyModal.farmer}</p>

            {/* Farmer's Price Range */}
            <div style={{ background: '#E8F5E9', borderRadius: '10px', padding: '.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                <span style={{ fontSize: '.85rem', fontWeight: 600 }}>👨‍🌾 Farmer's Price Range</span>
              </div>
              {buyModal.minPrice && buyModal.maxPrice ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '.65rem', color: 'var(--text3)' }}>MIN</div>
                    <b style={{ color: '#1565C0', fontSize: '1.05rem' }}>₹{buyModal.minPrice.toLocaleString()}</b>
                  </div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--text3)' }}>—</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '.65rem', color: 'var(--text3)' }}>MAX</div>
                    <b style={{ color: '#E65100', fontSize: '1.05rem' }}>₹{buyModal.maxPrice.toLocaleString()}</b>
                  </div>
                  <span style={{ fontSize: '.7rem', color: 'var(--text3)' }}>/qtl</span>
                </div>
              ) : (
                <b style={{ color: '#2E7D32' }}>₹{(buyModal.price || 0).toLocaleString()}/qtl</b>
              )}
            </div>

            {/* Real Market Price Advisor */}
            <div style={{ background: 'linear-gradient(135deg, #f8fdf8, #e8f5e9)', borderRadius: '12px', padding: '.85rem', marginBottom: '1rem', border: '1.5px solid #C8E6C9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '.82rem', color: '#1B5E20' }}>💹 Real Market Prices</span>
                <span style={{ fontSize: '.6rem', color: '#fff', background: '#2E7D32', padding: '.12rem .45rem', borderRadius: '50px', fontWeight: 700 }}>🏛️ data.gov.in</span>
              </div>
              {marketLoading ? (
                <div style={{ textAlign: 'center', padding: '.5rem' }}>
                  <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'linear-gradient(90deg, #E8F5E9 25%, #A5D6A7 50%, #E8F5E9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                  <p style={{ fontSize: '.75rem', color: 'var(--text2)', marginTop: '.4rem' }}>Fetching market data...</p>
                  <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
                </div>
              ) : marketData?.found ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.4rem' }}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '.5rem', textAlign: 'center', border: '1px solid #E8F5E9' }}>
                      <div style={{ fontSize: '.58rem', color: 'var(--text3)', fontWeight: 600 }}>AVG MODAL</div>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '.95rem' }}>₹{marketData.avgModal?.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '.5rem', textAlign: 'center', border: '1px solid #E3F2FD' }}>
                      <div style={{ fontSize: '.58rem', color: 'var(--text3)', fontWeight: 600 }}>MIN PRICE</div>
                      <div style={{ fontWeight: 800, color: '#1565C0', fontSize: '.95rem' }}>₹{marketData.overallMin?.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '.5rem', textAlign: 'center', border: '1px solid #FCE4EC' }}>
                      <div style={{ fontSize: '.58rem', color: 'var(--text3)', fontWeight: 600 }}>MAX PRICE</div>
                      <div style={{ fontWeight: 800, color: '#C62828', fontSize: '.95rem' }}>₹{marketData.overallMax?.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '.5rem', textAlign: 'center', border: '1px solid #E8F5E9' }}>
                      <div style={{ fontSize: '.58rem', color: 'var(--text3)', fontWeight: 600 }}>SUGGESTED</div>
                      <div style={{ fontWeight: 800, color: '#E65100', fontSize: '.95rem' }}>₹{marketData.suggestedPrice?.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '.65rem', color: 'var(--text3)', marginTop: '.4rem', textAlign: 'center' }}>
                    Based on {marketData.marketCount} mandi records · All prices ₹/quintal
                  </div>
                  {/* Price comparison bar */}
                  <div style={{ marginTop: '.5rem', background: '#fff', borderRadius: '6px', padding: '.5rem', border: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.6rem', color: 'var(--text3)', marginBottom: '.2rem' }}>
                      <span>₹{marketData.overallMin?.toLocaleString()}</span>
                      <span>₹{marketData.overallMax?.toLocaleString()}</span>
                    </div>
                    <div style={{ position: 'relative', height: '8px', background: 'linear-gradient(90deg, #4CAF50, #FFC107, #F44336)', borderRadius: '4px' }}>
                      {/* Farmer's listed price marker */}
                      {(() => {
                        const pct = Math.min(100, Math.max(0, ((buyModal.price - marketData.overallMin) / (marketData.overallMax - marketData.overallMin)) * 100));
                        return <div style={{ position: 'absolute', left: `${pct}%`, top: '-4px', width: '3px', height: '16px', background: '#1565C0', borderRadius: '2px' }} title={`Listed: ₹${buyModal.price}`} />;
                      })()}
                    </div>
                    <div style={{ fontSize: '.58rem', color: '#1565C0', marginTop: '.2rem', fontWeight: 700, textAlign: 'center' }}>▲ Farmer's listed price: ₹{buyModal.price}</div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '.78rem', color: 'var(--text3)', textAlign: 'center', padding: '.5rem' }}>
                  📊 Market data not available for this crop. Use listed price as reference.
                </div>
              )}
            </div>

            {/* Quantity — SLIDER ONLY */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '.82rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                <span>📦 Quantity</span>
                <span style={{ color: '#1565C0' }}>{offerQty} qtl of {buyModal.qty} available</span>
              </label>
              <input type="range" min="1" max={buyModal.qty} value={offerQty} onChange={e => setOfferQty(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', marginTop: '.3rem' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: 'var(--text3)' }}>
                <span>1 qtl</span><span>{buyModal.qty} qtl</span>
              </div>
            </div>

            {/* Offer Price */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '.82rem', fontWeight: 700 }}>💰 Your Offer Price (₹/qtl)</label>
              <input type="number" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} placeholder="Enter your price"
                style={{ width: '100%', padding: '.65rem 1rem', border: '2px solid var(--border)', borderRadius: 'var(--radius2)', fontFamily: 'var(--font-body)', marginTop: '.3rem', fontSize: '1.1rem', fontWeight: 700 }} />
              {marketData?.found && (
                <div style={{ display: 'flex', gap: '.4rem', marginTop: '.4rem', flexWrap: 'wrap' }}>
                  <button type="button" style={{ fontSize: '.68rem', padding: '.2rem .5rem', borderRadius: '6px', border: '1px solid #C8E6C9', background: '#E8F5E9', color: '#2E7D32', cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => setOfferPrice(String(marketData.overallMin))}>Min ₹{marketData.overallMin?.toLocaleString()}</button>
                  <button type="button" style={{ fontSize: '.68rem', padding: '.2rem .5rem', borderRadius: '6px', border: '1px solid #C8E6C9', background: '#E8F5E9', color: '#1565C0', cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => setOfferPrice(String(marketData.avgModal))}>Avg ₹{marketData.avgModal?.toLocaleString()}</button>
                  <button type="button" style={{ fontSize: '.68rem', padding: '.2rem .5rem', borderRadius: '6px', border: '1px solid #FFE0B2', background: '#FFF3E0', color: '#E65100', cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => setOfferPrice(String(marketData.suggestedPrice))}>Suggested ₹{marketData.suggestedPrice?.toLocaleString()}</button>
                  <button type="button" style={{ fontSize: '.68rem', padding: '.2rem .5rem', borderRadius: '6px', border: '1px solid #FFCDD2', background: '#FFEBEE', color: '#C62828', cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => setOfferPrice(String(marketData.overallMax))}>Max ₹{marketData.overallMax?.toLocaleString()}</button>
                </div>
              )}
            </div>

            {/* Total */}
            <div style={{ background: '#E3F2FD', borderRadius: '10px', padding: '.75rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>Total Amount</span>
              <b style={{ fontSize: '1.2rem', color: '#1565C0' }}>₹{((parseInt(offerPrice) || 0) * offerQty).toLocaleString()}</b>
            </div>

            <p style={{ fontSize: '.72rem', color: 'var(--text3)', marginBottom: '1rem', textAlign: 'center' }}>
              🔒 Farmer will see your offer. If accepted, you'll pay to escrow. Payment released after both confirm.
            </p>

            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button className="btn btn-outline" onClick={() => setBuyModal(null)}>Cancel</button>
              <button className="btn btn-green" style={{ flex: 1 }} onClick={sendOffer}>📩 Send Offer to Farmer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
