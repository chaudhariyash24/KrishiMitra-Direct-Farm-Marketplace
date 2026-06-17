import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../api/axios';

export default function MarketPrices({ initialSearch = '' }) {
  const { currentFarmer } = useAuth();
  const [govData, setGovData] = useState([]);
  const [govLoading, setGovLoading] = useState(true);
  const [govCommodity, setGovCommodity] = useState('');
  const [govState, setGovState] = useState('');
  const [govTotal, setGovTotal] = useState(0);

  // Sync search with initialSearch prop (from chatbot auto-navigation)
  useEffect(() => {
    if (initialSearch) {
      setGovCommodity(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    fetchGovData();
  }, []);

  // Fetch data.gov.in data
  const fetchGovData = (overrideState) => {
    setGovLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    const stateToUse = overrideState !== undefined ? overrideState : govState;
    if (stateToUse) params.append('state', stateToUse);
    if (govCommodity) params.append('commodity', govCommodity);
    API.get(`/prices/govdata?${params.toString()}`)
      .then(r => {
        const records = r.data.records || [];
        if (records.length === 0 && stateToUse && overrideState === undefined) {
          return fetchGovData('');
        }
        setGovData(records);
        setGovTotal(r.data.total || 0);
        setGovLoading(false);
      })
      .catch(() => { setGovData([]); setGovLoading(false); });
  };

  const states = ['Maharashtra','Uttar Pradesh','Madhya Pradesh','Rajasthan','Gujarat','Punjab','Haryana','Karnataka','Tamil Nadu','Andhra Pradesh','Telangana','Bihar','West Bengal','Odisha','Chhattisgarh','Kerala','Jharkhand','Assam','Uttarakhand'];
  const govCommodities = ['Potato','Onion','Tomato','Wheat','Rice','Maize','Brinjal','Cauliflower','Cabbage','Banana','Mango','Apple','Grapes','Orange','Soyabean','Cotton','Groundnut','Mustard','Turmeric','Chilli','Coriander','Cumin','Ginger','Garlic','Coconut','Sugarcane','Jowar','Bajra'];

  // Stats
  const govStats = govData.length > 0 ? {
    avgModal: Math.round(govData.reduce((s, r) => s + r.modal_price, 0) / govData.length),
    minPrice: Math.min(...govData.map(r => r.min_price)),
    maxPrice: Math.max(...govData.map(r => r.max_price)),
    markets: [...new Set(govData.map(r => r.market))].length,
  } : null;

  return (
    <>
      <div className="page-header">
        <h1>📈 Live Market Prices</h1>
        <p>Real-time mandi rates from Government of India (data.gov.in)</p>
      </div>

      {/* Filters */}
      <div className="search-bar" style={{ gap: '.75rem', flexWrap: 'wrap' }}>
        <select value={govCommodity} onChange={e => setGovCommodity(e.target.value)}
          style={{ padding: '.6rem 1rem', borderRadius: 'var(--radius2)', border: '2px solid var(--border)', fontFamily: 'var(--font-body)', fontSize: '.88rem', background: '#fff', cursor: 'pointer', minWidth: '200px' }}>
          <option value="">🔍 All Commodities</option>
          {govCommodities.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={govState} onChange={e => setGovState(e.target.value)}
          style={{ padding: '.6rem 1rem', borderRadius: 'var(--radius2)', border: '2px solid var(--border)', fontFamily: 'var(--font-body)', fontSize: '.88rem', background: '#fff', cursor: 'pointer', minWidth: '180px' }}>
          <option value="">All States</option>
          {states.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="btn btn-green" onClick={() => fetchGovData()} style={{ padding: '.6rem 1.5rem' }}>
          🔄 Fetch Prices
        </button>
      </div>

      {govLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
          <p style={{ color: 'var(--text2)' }}>Fetching live prices from <b>data.gov.in</b>...</p>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          {govStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)', borderRadius: '12px', padding: '1rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                <div style={{ fontSize: '.72rem', color: 'var(--text2)', fontWeight: 600 }}>📊 Avg Modal Price</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--primary)', fontSize: '1.3rem' }}>₹{govStats.avgModal.toLocaleString()}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg,#E3F2FD,#BBDEFB)', borderRadius: '12px', padding: '1rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                <div style={{ fontSize: '.72rem', color: 'var(--text2)', fontWeight: 600 }}>⬇️ Lowest Price</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: '#1565C0', fontSize: '1.3rem' }}>₹{govStats.minPrice.toLocaleString()}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg,#F3E5F5,#E1BEE7)', borderRadius: '12px', padding: '1rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                <div style={{ fontSize: '.72rem', color: 'var(--text2)', fontWeight: 600 }}>⬆️ Highest Price</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: '#7B1FA2', fontSize: '1.3rem' }}>₹{govStats.maxPrice.toLocaleString()}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg,#FFF3E0,#FFE0B2)', borderRadius: '12px', padding: '1rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                <div style={{ fontSize: '.72rem', color: 'var(--text2)', fontWeight: 600 }}>🏪 Markets</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: '#E65100', fontSize: '1.3rem' }}>{govStats.markets}</div>
              </div>
            </div>
          )}

          {/* Bar Chart */}
          {govData.length > 0 && (() => {
            const chartData = govData.slice(0, 20);
            const allModal = chartData.map(d => d.modal_price);
            const maxP = Math.max(...allModal);
            const minP = Math.min(...allModal);
            const range = maxP - minP || 1;
            const chartHeight = 200;
            return (
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="card-header">
                  <span className="card-title">📊 Price Comparison Across Mandis (₹/qtl)</span>
                </div>
                <div style={{ display: 'flex', gap: '1px', padding: '1.5rem .75rem .5rem', overflowX: 'auto' }}>
                  {/* Y-axis */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '22px', marginRight: '4px', minWidth: '45px' }}>
                    <span style={{ fontSize: '.6rem', color: 'var(--text3)', textAlign: 'right' }}>₹{maxP.toLocaleString()}</span>
                    <span style={{ fontSize: '.6rem', color: 'var(--text3)', textAlign: 'right' }}>₹{Math.round((maxP + minP) / 2).toLocaleString()}</span>
                    <span style={{ fontSize: '.6rem', color: 'var(--text3)', textAlign: 'right' }}>₹{minP.toLocaleString()}</span>
                  </div>
                  {/* Bars */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', flex: 1, height: chartHeight + 'px', borderLeft: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', paddingLeft: '4px' }}>
                    {chartData.map((r, i) => {
                      const barH = ((r.modal_price - minP) / range) * (chartHeight - 30) + 25;
                      const hue = Math.round((r.modal_price - minP) / range * 120);
                      return (
                        <div key={i} style={{ flex: 1, minWidth: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontSize: '.58rem', fontWeight: 700, color: `hsl(${hue}, 60%, 35%)`, whiteSpace: 'nowrap' }}>
                            ₹{r.modal_price.toLocaleString()}
                          </span>
                          <div
                            title={`${r.market}, ${r.district} (${r.state})\n${r.commodity} — ₹${r.modal_price}/qtl\nMin: ₹${r.min_price} | Max: ₹${r.max_price}\n${r.arrival_date}`}
                            style={{
                              width: '100%', height: barH + 'px',
                              background: `linear-gradient(to top, hsl(${hue}, 65%, 42%), hsl(${hue}, 55%, 58%))`,
                              borderRadius: '4px 4px 0 0', cursor: 'pointer', transition: 'all .25s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.transform = 'scaleY(1.04)'; }}
                            onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'scaleY(1)'; }}
                          />
                          <span style={{ fontSize: '.5rem', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.1, maxWidth: '50px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.market?.replace(' APMC', '')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: 'var(--text3)', padding: '.5rem .75rem 0' }}>
                  <span>🔴 Lower price → 🟢 Higher price</span>
                  <span>Hover bars for full details</span>
                </div>
              </div>
            );
          })()}

          {/* Table */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="card-title">🏛️ Mandi Prices – data.gov.in</span>
              <span style={{ fontSize: '.72rem', color: '#1565C0', background: '#E3F2FD', padding: '.25rem .75rem', borderRadius: '50px', fontWeight: 700 }}>
                🏛️ LIVE • {govTotal} records
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Commodity</th>
                    <th>Market</th>
                    <th>District</th>
                    <th>State</th>
                    <th>Min Price (₹)</th>
                    <th>Max Price (₹)</th>
                    <th>Modal Price (₹)</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {govData.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text3)', padding: '2rem' }}>
                      No data found. Try changing filters and click "Fetch Prices".
                    </td></tr>
                  ) : (
                    govData.map((r, i) => (
                      <tr key={i}>
                        <td><b>{r.commodity}</b>{r.variety && r.variety !== r.commodity ? <span style={{ fontSize: '.72rem', color: 'var(--text3)', display: 'block' }}>{r.variety}</span> : null}</td>
                        <td>{r.market}</td>
                        <td>{r.district}</td>
                        <td>{r.state}</td>
                        <td>₹{r.min_price.toLocaleString()}</td>
                        <td>₹{r.max_price.toLocaleString()}</td>
                        <td style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>₹{r.modal_price.toLocaleString()}</td>
                        <td style={{ fontSize: '.8rem', color: 'var(--text2)' }}>{r.arrival_date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.75rem', color: 'var(--text3)' }}>
            🏛️ Source: Ministry of Agriculture & Farmers Welfare via data.gov.in • Prices in ₹/quintal • Updated daily
          </div>
        </>
      )}
    </>
  );
}
