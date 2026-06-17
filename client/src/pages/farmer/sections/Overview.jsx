import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../api/axios';

export default function Overview({ toast }) {
  const { currentFarmer } = useAuth();
  const [weather, setWeather] = useState(null);
  const [prices, setPrices] = useState([]);
  const [schemes, setSchemes] = useState([]);

  const farmerCity = currentFarmer?.district || currentFarmer?.loc?.split(',')[0]?.trim() || 'Mumbai';

  useEffect(() => {
    API.get('/weather?city=' + encodeURIComponent(farmerCity)).then(r => setWeather(r.data)).catch(() => {});
    API.get('/prices').then(r => setPrices(r.data)).catch(() => {});
    API.get('/schemes').then(r => setSchemes(r.data)).catch(() => {});
  }, []);

  const f = currentFarmer;
  const inc = f?.income || 120000;
  const cur = weather?.current;
  const loc = weather?.location;

  const getEmoji = (cond) => {
    if (!cond) return '🌤️';
    const c = cond.toLowerCase();
    if (c.includes('sunny') || c.includes('clear')) return '☀️';
    if (c.includes('cloud') && c.includes('partly')) return '⛅';
    if (c.includes('cloud') || c.includes('overcast')) return '☁️';
    if (c.includes('rain')) return '🌧️';
    if (c.includes('thunder')) return '⛈️';
    if (c.includes('fog') || c.includes('mist')) return '🌫️';
    return '🌤️';
  };

  return (
    <>
      <div className="page-header"><h1>📊 Dashboard Overview</h1><p>Welcome back! Here's your farming summary.</p></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="icon-box icon-green">🌾</div><div className="info"><h3>{f?.land || 4} ac</h3><p>Farm Size</p></div></div>
        <div className="stat-card"><div className="icon-box icon-orange">💰</div><div className="info"><h3>₹{Math.round(inc/1000)}K</h3><p>Annual Income</p></div></div>
        <div className="stat-card"><div className="icon-box icon-blue">🏛️</div><div className="info"><h3>{schemes.length || 11}</h3><p>Available Schemes</p></div></div>
        <div className="stat-card"><div className="icon-box icon-purple">📦</div><div className="info"><h3>62</h3><p>Market Products</p></div></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',flexWrap:'wrap'}}>
        <div className="card">
          <div className="card-header"><span className="card-title">🌤️ Today's Weather {loc ? `– ${loc.name}` : ''}</span></div>
          {cur ? (
            <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
              <div style={{textAlign:'center',flex:1}}>
                <div style={{fontSize:'2.5rem'}}>{getEmoji(cur.condition)}</div>
                <div style={{fontFamily:'var(--font-head)',fontSize:'1.5rem',fontWeight:800}}>{cur.temp}°C</div>
                <div style={{fontSize:'.8rem',color:'var(--text2)'}}>{cur.condition}</div>
              </div>
              <div style={{flex:2}}>
                <div style={{fontSize:'.85rem',color:'var(--text2)',marginBottom:'.3rem'}}>💧 Humidity: <b>{cur.humid}%</b></div>
                <div style={{fontSize:'.85rem',color:'var(--text2)',marginBottom:'.3rem'}}>💨 Wind: <b>{cur.wind} km/h</b></div>
                <div style={{fontSize:'.85rem',color:'var(--text2)',marginBottom:'.3rem'}}>🌧️ Rainfall: <b>{cur.rain} mm</b></div>
                <div style={{fontSize:'.83rem',color:'var(--primary)',fontWeight:700,marginTop:'.5rem'}}>📌 {weather?.advisory?.sowing || 'Loading advisory...'}</div>
              </div>
            </div>
          ) : (
            <div style={{textAlign:'center',padding:'1rem',color:'var(--text3)'}}>Loading weather...</div>
          )}
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">📈 Top Crop Prices</span></div>
          {prices.slice(0,5).map((p,i) => (
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'.5rem 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{fontWeight:700,fontSize:'.88rem'}}>{p.crop?.split(' (')[0]}</span>
              <span style={{fontFamily:'var(--font-head)',fontWeight:800,color:'var(--primary)'}}>₹{p.mandi}</span>
              <span>{p.trend} {p.change}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><span className="card-title">🏛️ Active Schemes for You</span></div>
        {schemes.slice(0,3).map((s,i) => (
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'.7rem 0',borderBottom:'1px solid var(--border)'}}>
            <div>
              <div style={{fontWeight:700,fontSize:'.9rem'}}>{s.name}</div>
              <div style={{fontSize:'.78rem',color:'var(--text2)'}}>{s.benefit}</div>
            </div>
            <button className="btn btn-green btn-sm" onClick={() => toast('Navigate to Schemes to apply!')}>Apply</button>
          </div>
        ))}
      </div>
    </>
  );
}
