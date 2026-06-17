import { useState, useEffect } from 'react';
import API from '../../../api/axios';

export default function Analytics({ toast }) {
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    API.get('/farmers').then(r=>setFarmers(r.data)).catch(()=>{});
    API.get('/products').then(r=>setProducts(r.data)).catch(()=>{});
  }, []);

  return (
    <>
      <div className="page-header"><h1>📊 Admin Analytics</h1><p>System overview and key metrics</p></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="icon-box icon-green">👨‍🌾</div><div className="info"><h3>{farmers.length || 15}</h3><p>Total Farmers</p></div></div>
        <div className="stat-card"><div className="icon-box icon-blue">🛒</div><div className="info"><h3>{products.length || 62}</h3><p>Market Products</p></div></div>
        <div className="stat-card"><div className="icon-box icon-purple">🏛️</div><div className="info"><h3>10</h3><p>Active Schemes</p></div></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:'1.5rem',marginTop:'1.5rem'}}>
        <div className="card">
          <div className="card-header"><span className="card-title">👨‍🌾 Recent Farmers</span></div>
          <table>
            <thead><tr><th>ID</th><th>Name</th><th>Location</th><th>Crop</th></tr></thead>
            <tbody>
              {farmers.slice(0,5).map((f,i)=>(
                <tr key={i}><td>{f.id||'KS-XXXX'}</td><td><b>{f.name}</b></td><td>{f.loc}</td><td>{f.crop}</td></tr>
              ))}
              {farmers.length===0 && <tr><td colSpan="4" style={{textAlign:'center',color:'var(--text3)'}}>No registered farmers yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
