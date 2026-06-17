import { useState, useEffect } from 'react';
import API from '../../../api/axios';

export default function FarmersList({ toast }) {
  const [farmers, setFarmers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/farmers').then(r=>setFarmers(r.data)).catch(()=>{});
  }, []);

  const filtered = farmers.filter(f=>
    (f.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (f.id||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header"><h1>👨‍🌾 Registered Farmers</h1><p>All farmer accounts in the system</p></div>
      <div className="search-bar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or ID..." type="text"/></div>
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Location</th><th>Land</th><th>Crop</th><th>Income</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map((f,i)=>(
              <tr key={i}>
                <td style={{fontFamily:'var(--font-head)',fontWeight:700}}>{f.id}</td>
                <td><b>{f.name}</b></td>
                <td>{f.loc}</td>
                <td>{f.land} ac</td>
                <td>{f.crop}</td>
                <td>₹{(f.income||0).toLocaleString()}</td>
                <td><span className="badge badge-green">{f.status||'Active'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
