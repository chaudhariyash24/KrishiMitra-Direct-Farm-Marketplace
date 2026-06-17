import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../api/axios';

export default function Profile({ toast }) {
  const { currentFarmer, loginFarmer } = useAuth();
  const f = currentFarmer || {};
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: f.name || '',
    phone: f.phone || '',
    land: f.land || '',
    crop: f.crop || '',
    income: f.income || '',
    state: f.loc?.split(',')[1]?.trim() || f.state || '',
    district: f.loc?.split(',')[0]?.trim() || f.district || '',
  });

  const startEdit = () => {
    setForm({
      name: f.name || '',
      phone: f.phone || '',
      land: f.land || '',
      crop: f.crop || '',
      income: f.income || '',
      state: f.loc?.split(',')[1]?.trim() || f.state || '',
      district: f.loc?.split(',')[0]?.trim() || f.district || '',
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await API.put(`/farmers/${f.id}`, form);
      loginFarmer(data, localStorage.getItem('token'));
      toast('✅ Profile updated successfully!');
      setEditing(false);
    } catch (e) {
      toast('❌ ' + (e.response?.data?.message || 'Update failed'));
    }
    setSaving(false);
  };

  const crops = ['Wheat (गेहूं)','Rice (धान)','Maize (मक्का)','Bajra (बाजरा)','Jowar (ज्वार)',
    'Sugarcane (गन्ना)','Cotton (कपास)','Soybean (सोयाबीन)','Onion (प्याज)','Tomato (टमाटर)',
    'Potato (आलू)','Groundnut (मूंगफली)','Turmeric (हल्दी)','Chili (मिर्च)','Banana (केला)',
    'Mango (आम)','Grapes (अंगूर)','Orange (संतरा)','Mustard (सरसों)','Sunflower (सूरजमुखी)',
    'Chana / Chickpea (चना)','Arhar / Tur Dal (अरहर)','Moong Dal (मूंग)','Urad Dal (उड़द)',
    'Tea (चाय)','Coffee (कॉफी)','Jute (जूट)','Coconut (नारियल)','Cardamom (इलायची)'];

  return (
    <>
      <div className="page-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'}}>
        <div><h1>👤 My Profile</h1><p>Manage your farming profile</p></div>
        {!editing && (
          <button className="btn btn-green" onClick={startEdit}>✏️ Edit Profile</button>
        )}
      </div>

      <div className="profile-card">
        <div className="profile-avatar">👨‍🌾</div>
        <div className="profile-info">
          <h2>{f.name || 'Farmer Name'}</h2>
          <p>{f.loc || 'Location'}</p>
          <div className="profile-tags">
            <span className="profile-tag">{f.land || 0} Acres</span>
            <span className="profile-tag">{f.crop || 'Crop'}</span>
            <span className="profile-tag">₹{(f.income||0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {editing ? (
        <div className="card">
          <div className="card-header"><span className="card-title">✏️ Edit Profile</span></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',padding:'.5rem 0'}}>
            <div className="reg-field">
              <label>Full Name</label>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name" type="text"/>
            </div>
            <div className="reg-field">
              <label>Mobile Number</label>
              <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} maxLength="10" placeholder="10-digit" type="tel"/>
            </div>
            <div className="reg-field">
              <label>State</label>
              <input value={form.state} onChange={e=>setForm({...form,state:e.target.value})} placeholder="Maharashtra" type="text"/>
            </div>
            <div className="reg-field">
              <label>District</label>
              <input value={form.district} onChange={e=>setForm({...form,district:e.target.value})} placeholder="Nashik" type="text"/>
            </div>
            <div className="reg-field">
              <label>Land Area (Acres)</label>
              <input value={form.land} onChange={e=>setForm({...form,land:e.target.value})} type="number" step="0.1" placeholder="5.5"/>
            </div>
            <div className="reg-field">
              <label>Primary Crop</label>
              <select value={form.crop} onChange={e=>setForm({...form,crop:e.target.value})}>
                <option value="">Select Crop</option>
                {crops.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="reg-field">
              <label>Annual Income (₹)</label>
              <input value={form.income} onChange={e=>setForm({...form,income:e.target.value})} type="number" placeholder="120000"/>
            </div>
          </div>
          <div style={{display:'flex',gap:'1rem',marginTop:'1rem'}}>
            <button className="btn btn-green" onClick={saveProfile} disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
            <button className="btn btn-outline" onClick={()=>setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header"><span className="card-title">📋 Farm Details</span></div>
          <table>
            <thead><tr><th>Field</th><th>Value</th></tr></thead>
            <tbody>
              <tr><td>Farmer ID</td><td>{f.id || 'KS-XXXX'}</td></tr>
              <tr><td>Name</td><td>{f.name || '-'}</td></tr>
              <tr><td>Location</td><td>{f.loc || '-'}</td></tr>
              <tr><td>Land Area</td><td>{f.land || '-'} Acres</td></tr>
              <tr><td>Primary Crop</td><td>{f.crop || '-'}</td></tr>
              <tr><td>Annual Income</td><td>₹{(f.income||0).toLocaleString()}</td></tr>
              <tr><td>Member Since</td><td>2025</td></tr>
              <tr><td>Status</td><td><span className="badge badge-green">Active</span></td></tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
