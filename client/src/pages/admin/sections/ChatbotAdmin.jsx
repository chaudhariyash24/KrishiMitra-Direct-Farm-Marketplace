import { useState, useEffect } from 'react';
import API from '../../../api/axios';
import Modal from '../../../components/Modal';

export default function ChatbotAdmin({ toast }) {
  const [qas, setQas] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({keywords:'',answer:''});

  const load = () => API.get('/chat').then(r=>setQas(r.data)).catch(()=>{});
  useEffect(()=>{load();},[]);

  const save = async () => {
    const data = {keywords: form.keywords.split(',').map(k=>k.trim().toLowerCase()), answer: form.answer};
    if (modal==='edit' && form._id) { await API.put('/chat/'+form._id, data); }
    else { await API.post('/chat', data); }
    toast('Saved ✅'); setModal(null); load();
  };

  const del = async (id) => { await API.delete('/chat/'+id); toast('Deleted 🗑️'); load(); };

  return (
    <>
      <div className="page-header">
        <h1>🤖 Chatbot Q&A</h1>
        <button className="btn btn-green" onClick={()=>{setForm({keywords:'',answer:''});setModal('add');}}>+ Add Q&A</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Keywords</th><th>Answer</th><th>Actions</th></tr></thead>
          <tbody>{qas.map((q,i)=>(
            <tr key={i}>
              <td>{(q.keywords||[]).map((k,j)=><span key={j} className="badge badge-blue" style={{margin:'.1rem'}}>{k}</span>)}</td>
              <td style={{fontSize:'.82rem',maxWidth:'400px'}}>{(q.answer||'').substring(0,80)}...</td>
              <td>
                <button className="btn btn-warn btn-sm" onClick={()=>{setForm({...q,keywords:(q.keywords||[]).join(', ')});setModal('edit');}}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={()=>del(q._id)} style={{marginLeft:'.3rem'}}>Del</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Modal open={!!modal} title={modal==='edit'?'Edit Q&A':'Add Q&A'} onClose={()=>setModal(null)}>
        <div className="form-group"><label>Keywords (comma separated)</label><input value={form.keywords} onChange={e=>setForm({...form,keywords:e.target.value})} type="text"/></div>
        <div className="form-group"><label>Answer</label><textarea value={form.answer} onChange={e=>setForm({...form,answer:e.target.value})} rows="4"></textarea></div>
        <button className="btn btn-green" onClick={save} style={{width:'100%'}}>Save</button>
      </Modal>
    </>
  );
}
