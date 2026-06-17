import { useState, useEffect } from 'react';
import API from '../../../api/axios';

export default function GIAdmin({ toast }) {
  const [gis, setGis] = useState([]);

  const load = () => API.get('/gi').then(r=>setGis(r.data)).catch(()=>{});
  useEffect(()=>{load();},[]);

  const verify = async (id) => {
    await API.put('/gi/'+id+'/verify');
    toast('GI Product verified ✅');
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete GI Product?')) return;
    await API.delete('/gi/'+id);
    toast('Deleted 🗑️'); load();
  };

  return (
    <>
      <div className="page-header"><h1>🔗 GI Products Management</h1></div>
      <div className="card">
        <table>
          <thead><tr><th>Product</th><th>Origin</th><th>Farmer</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {gis.map((g,i)=>(
              <tr key={i}>
                <td><b>{g.name}</b></td>
                <td>{g.origin}</td>
                <td>{g.farmer}</td>
                <td><span className={`badge ${g.status==='Verified'?'badge-green':'badge-orange'}`}>{g.status}</span></td>
                <td>
                  {g.status!=='Verified' && <button className="btn btn-green btn-sm" onClick={()=>verify(g._id)}>✅ Verify</button>}
                  <button className="btn btn-danger btn-sm" onClick={()=>del(g._id)} style={{marginLeft:'.3rem'}}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
