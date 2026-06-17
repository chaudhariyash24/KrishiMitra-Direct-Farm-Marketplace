import { useState, useEffect } from 'react';
import API from '../../../api/axios';
import Modal from '../../../components/Modal';

export default function MarketplaceAdmin({ toast }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({name:'',emoji:'🌾',price:'',qty:'',farmer:'',loc:'',cat:'Grains'});

  const load = () => API.get('/products').then(r=>setProducts(r.data)).catch(()=>{});
  useEffect(()=>{load();},[]);

  const save = async () => {
    try {
      if (modal==='edit' && form._id) {
        await API.put('/products/'+form._id, form);
        toast('Product updated ✅');
      } else {
        await API.post('/products', form);
        toast('Product added ✅');
      }
      setModal(null);
      load();
    } catch(e) { toast('❌ Error saving'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this product?')) return;
    await API.delete('/products/'+id);
    toast('Product deleted 🗑️');
    load();
  };

  const filtered = products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="page-header">
        <h1>🛒 Marketplace Management</h1>
        <button className="btn btn-green" onClick={()=>{setForm({name:'',emoji:'🌾',price:'',qty:'',farmer:'',loc:'',cat:'Grains'});setModal('add');}}>+ Add Product</button>
      </div>
      <div className="search-bar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..." type="text"/></div>
      <div className="card">
        <table>
          <thead><tr><th></th><th>Name</th><th>Price</th><th>Qty</th><th>Farmer</th><th>Location</th><th>Category</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((p,i)=>(
              <tr key={i}>
                <td>{p.emoji}</td><td><b>{p.name}</b></td><td>₹{(p.price||0).toLocaleString()}</td><td>{p.qty}</td>
                <td>{p.farmer}</td><td>{p.loc}</td><td><span className="badge badge-blue">{p.cat}</span></td>
                <td>
                  <button className="btn btn-warn btn-sm" onClick={()=>{setForm(p);setModal('edit');}}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>del(p._id)} style={{marginLeft:'.3rem'}}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!modal} title={modal==='edit'?'Edit Product':'Add Product'} onClose={()=>setModal(null)}>
        <div className="form-group"><label>Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} type="text"/></div>
        <div className="form-row">
          <div className="form-group"><label>Price (₹/qtl)</label><input value={form.price} onChange={e=>setForm({...form,price:e.target.value})} type="number"/></div>
          <div className="form-group"><label>Qty (qtl)</label><input value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})} type="number"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Farmer</label><input value={form.farmer} onChange={e=>setForm({...form,farmer:e.target.value})} type="text"/></div>
          <div className="form-group"><label>Location</label><input value={form.loc} onChange={e=>setForm({...form,loc:e.target.value})} type="text"/></div>
        </div>
        <div className="form-group"><label>Category</label>
          <select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}>
            <option>Grains</option><option>Vegetables</option><option>Fruits</option><option>Pulses</option><option>Spices</option><option>Cash Crops</option>
          </select>
        </div>
        <button className="btn btn-green" onClick={save} style={{width:'100%'}}>Save</button>
      </Modal>
    </>
  );
}
