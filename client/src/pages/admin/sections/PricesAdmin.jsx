import { useState, useEffect } from 'react';
import API from '../../../api/axios';
import Modal from '../../../components/Modal';

export default function PricesAdmin({ toast }) {
  const [prices, setPrices] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

  const load = () => API.get('/prices').then(r=>setPrices(r.data)).catch(()=>{});
  useEffect(()=>{load();},[]);

  const save = async () => {
    const oldMandi = prices.find(p=>p._id===form._id)?.mandi || form.mandi;
    const diff = ((form.mandi - oldMandi) / oldMandi * 100).toFixed(1);
    const change = (diff > 0 ? '+' : '') + diff + '%';
    const trend = diff > 0 ? '📈' : '📉';
    await API.put('/prices/'+form._id, {...form, change, trend});
    toast('Price updated ✅'); setModal(false); load();
  };

  return (
    <>
      <div className="page-header"><h1>📈 Market Prices</h1></div>
      <div className="card">
        <table>
          <thead><tr><th>Crop</th><th>MSP (₹/qtl)</th><th>Mandi Rate</th><th>Actions</th></tr></thead>
          <tbody>{prices.map((p,i)=>(
            <tr key={i}>
              <td><b>{p.crop}</b></td>
              <td>₹{(p.msp||0).toLocaleString()}</td>
              <td>₹{(p.mandi||0).toLocaleString()}</td>
              <td><button className="btn btn-warn btn-sm" onClick={()=>{setForm(p);setModal(true);}}>Edit</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Modal open={modal} title={'Edit Price: '+form.crop} onClose={()=>setModal(false)}>
        <div className="form-row">
          <div className="form-group"><label>MSP (₹/qtl)</label><input value={form.msp||''} onChange={e=>setForm({...form,msp:parseInt(e.target.value)})} type="number"/></div>
          <div className="form-group"><label>Mandi Rate (₹/qtl)</label><input value={form.mandi||''} onChange={e=>setForm({...form,mandi:parseInt(e.target.value)})} type="number"/></div>
        </div>
        <button className="btn btn-green" onClick={save} style={{width:'100%'}}>Update Price</button>
      </Modal>
    </>
  );
}
