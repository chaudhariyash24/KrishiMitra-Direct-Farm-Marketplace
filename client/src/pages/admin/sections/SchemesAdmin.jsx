import { useState, useEffect } from 'react';
import API from '../../../api/axios';
import Modal from '../../../components/Modal';

export default function SchemesAdmin({ toast }) {
  const [schemes, setSchemes] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({name:'',benefit:'',elig:'',desc:'',docs:''});

  const load = () => API.get('/schemes').then(r=>setSchemes(r.data)).catch(()=>{});
  useEffect(()=>{load();},[]);

  const save = async () => {
    try {
      const data = {...form, docs: typeof form.docs === 'string' ? form.docs.split(',').map(d=>d.trim()) : form.docs};
      if (modal==='edit' && form._id) {
        await API.put('/schemes/'+form._id, data);
        toast('Scheme updated ✅');
      } else {
        await API.post('/schemes', data);
        toast('Scheme added ✅');
      }
      setModal(null); load();
    } catch(e) { toast('❌ Error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete scheme?')) return;
    await API.delete('/schemes/'+id);
    toast('Deleted 🗑️'); load();
  };

  return (
    <>
      <div className="page-header">
        <h1>🏛️ Schemes Management</h1>
        <button className="btn btn-green" onClick={()=>{setForm({name:'',benefit:'',elig:'',desc:'',docs:''});setModal('add');}}>+ Add Scheme</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Scheme Name</th><th>Benefit</th><th>Eligibility</th><th>Actions</th></tr></thead>
          <tbody>
            {schemes.map((s,i)=>(
              <tr key={i}>
                <td><b>{s.name}</b></td>
                <td>{s.benefit}</td>
                <td style={{fontSize:'.82rem'}}>{s.elig}</td>
                <td>
                  <button className="btn btn-warn btn-sm" onClick={()=>{setForm({...s,docs:(s.docs||[]).join(', ')});setModal('edit');}}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>del(s._id)} style={{marginLeft:'.3rem'}}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!modal} title={modal==='edit'?'Edit Scheme':'Add Scheme'} onClose={()=>setModal(null)}>
        <div className="form-group"><label>Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} type="text"/></div>
        <div className="form-group"><label>Benefit</label><input value={form.benefit} onChange={e=>setForm({...form,benefit:e.target.value})} type="text"/></div>
        <div className="form-group"><label>Eligibility</label><input value={form.elig} onChange={e=>setForm({...form,elig:e.target.value})} type="text"/></div>
        <div className="form-group"><label>Description</label><textarea value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} rows="3"></textarea></div>
        <div className="form-group"><label>Documents (comma separated)</label><input value={form.docs} onChange={e=>setForm({...form,docs:e.target.value})} type="text" placeholder="Aadhaar, Land Record"/></div>
        <button className="btn btn-green" onClick={save} style={{width:'100%'}}>Save Scheme</button>
      </Modal>
    </>
  );
}
