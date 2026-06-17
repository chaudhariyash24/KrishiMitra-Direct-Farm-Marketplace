import { useState, useEffect } from 'react';
import API from '../../../api/axios';

export default function WeatherAdmin({ toast }) {
  const [w, setW] = useState({temp:28,humid:72,wind:12,rain:3,cond:'⛅ Partly Cloudy',adv:'Good day for irrigation.'});

  useEffect(() => {
    API.get('/weather').then(r=>setW(r.data)).catch(()=>{});
  }, []);

  const save = async () => {
    try {
      await API.put('/weather', w);
      toast('Weather data updated ✅');
    } catch(e) { toast('❌ Error updating weather'); }
  };

  return (
    <>
      <div className="page-header"><h1>🌤️ Weather Management</h1><p>Update weather data displayed to farmers</p></div>
      <div className="card">
        <div className="form-row">
          <div className="form-group"><label>Temperature (°C)</label><input value={w.temp} onChange={e=>setW({...w,temp:e.target.value})} type="number"/></div>
          <div className="form-group"><label>Humidity (%)</label><input value={w.humid} onChange={e=>setW({...w,humid:e.target.value})} type="number"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Wind (km/h)</label><input value={w.wind} onChange={e=>setW({...w,wind:e.target.value})} type="number"/></div>
          <div className="form-group"><label>Rainfall (mm)</label><input value={w.rain} onChange={e=>setW({...w,rain:e.target.value})} type="number"/></div>
        </div>
        <div className="form-group"><label>Condition</label><input value={w.cond} onChange={e=>setW({...w,cond:e.target.value})} placeholder="⛅ Partly Cloudy" type="text"/></div>
        <div className="form-group"><label>Farming Advisory</label><textarea value={w.adv} onChange={e=>setW({...w,adv:e.target.value})} rows="3"></textarea></div>
        <button className="btn btn-green" onClick={save} style={{width:'100%'}}>Update Weather Data</button>
      </div>
    </>
  );
}
