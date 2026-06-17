import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../api/axios';

const trucks = [
  { id:'tata-ace', icon:'🛻', name:'Tata Ace', capKg:750, rate:10, speed:55, cold:false, tags:['Budget','City'] },
  { id:'pickup', icon:'🚐', name:'Mini Pickup', capKg:1500, rate:12, speed:70, cold:false, tags:['Fast','Popular'] },
  { id:'tempo', icon:'🚛', name:'Tempo 407', capKg:2000, rate:13, speed:60, cold:false, tags:['Medium'] },
  { id:'tractor', icon:'🚜', name:'Tractor Trolley', capKg:3000, rate:8, speed:35, cold:false, tags:['Cheapest','Bulk'] },
  { id:'eicher', icon:'🚛', name:'Eicher Truck', capKg:5000, rate:16, speed:65, cold:false, tags:['Heavy'] },
  { id:'cold', icon:'❄️', name:'Cold Storage Van', capKg:3000, rate:22, speed:65, cold:true, tags:['Cold Chain'] },
];

const mandis = [
  { state:'Maharashtra', list:['Vashi APMC, Navi Mumbai','Pune Market Yard','Nashik APMC','Kolhapur APMC','Nagpur Kalamna Market','Aurangabad APMC','Solapur APMC'] },
  { state:'Uttar Pradesh', list:['Azadpur Mandi, Delhi','Lucknow Mandi','Agra Mandi','Varanasi Mandi','Kanpur Mandi','Allahabad APMC'] },
  { state:'Madhya Pradesh', list:['Neemuch Mandi','Indore Mandi','Bhopal APMC','Jabalpur Mandi','Gwalior APMC'] },
  { state:'Gujarat', list:['Rajkot APMC','Ahmedabad APMC','Surat APMC','Unjha APMC','Gondal APMC'] },
  { state:'Rajasthan', list:['Jaipur Mandi','Jodhpur APMC','Kota Mandi','Udaipur APMC'] },
  { state:'Punjab', list:['Ludhiana Mandi','Amritsar Mandi','Jalandhar APMC','Patiala Mandi'] },
  { state:'Karnataka', list:['Bangalore APMC, Yeshwanthpur','Hubli APMC','Mysore APMC','Belgaum APMC'] },
  { state:'Tamil Nadu', list:['Koyambedu Market, Chennai','Coimbatore APMC','Madurai Mandi','Salem APMC'] },
  { state:'Andhra Pradesh', list:['Guntur Mandi','Vijayawada APMC','Kurnool APMC'] },
  { state:'West Bengal', list:['Kolkata Koley Market','Siliguri APMC','Howrah Mandi'] },
];

const colors = ['#2E7D32','#1565C0','#E65100','#7B1FA2','#C62828','#00838F','#4E342E','#AD1457'];

export default function BookTruck({ toast, onRefreshShared }) {
  const { currentFarmer } = useAuth();
  const [bStep, setBStep] = useState(1); // 1=truck, 2=config, 3=confirm
  const [truck, setTruck] = useState(null);
  const [myWeight, setMyWeight] = useState('');
  const [myProduct, setMyProduct] = useState('');
  const [pickupLoc, setPickupLoc] = useState('');
  const [destination, setDestination] = useState('');
  const [mandiSearch, setMandiSearch] = useState('');
  const [sharingMode, setSharingMode] = useState('public');
  const [departureDate, setDepartureDate] = useState('');
  const [booked, setBooked] = useState(null);

  const allMandis = mandis.flatMap(m => m.list.map(l => ({ state: m.state, name: l })));
  const filteredMandis = mandiSearch ? allMandis.filter(m => m.name.toLowerCase().includes(mandiSearch.toLowerCase()) || m.state.toLowerCase().includes(mandiSearch.toLowerCase())) : allMandis;

  const capPct = truck ? Math.min(100, Math.round(((parseInt(myWeight) || 0) * 100) / truck.capKg * 100)) : 0;
  const dist = 80 + Math.floor(Math.random() * 120);

  const handleBook = async () => {
    if (!truck || !myWeight || !destination || !pickupLoc) { toast('⚠️ Fill all fields!'); return; }
    const wKg = parseInt(myWeight) * 100;
    const fare = truck.rate * dist + (wKg > 1000 ? Math.round(wKg * 0.08) : 0) + (truck.cold ? dist * 5 : 0) + 250;
    try {
      const r = await API.post('/shared-trips', {
        creatorId: currentFarmer?.id || '', creatorName: currentFarmer?.name || 'Farmer',
        creatorPhone: currentFarmer?.phone || '', creatorWeightKg: wKg,
        creatorProductName: myProduct || 'Crops',
        pickup: pickupLoc, drop: destination, distance: dist,
        duration: `${Math.floor(dist / truck.speed)}h ${Math.round((dist % truck.speed) / truck.speed * 60)}m`,
        vehicleId: truck.id, vehicleName: truck.name, vehicleIcon: truck.icon,
        vehicleCapacityKg: truck.capKg, vehicleRate: truck.rate, vehicleCold: truck.cold,
        totalCapacityKg: truck.capKg, usedCapacityKg: wKg,
        departureDate: departureDate || new Date().toISOString(),
        baseFare: fare - 250, totalFare: fare,
        sharingMode, status: 'open',
      });
      setBooked(r.data);
      toast('✅ Truck booked!');
      if (onRefreshShared) onRefreshShared();
    } catch { toast('❌ Booking failed'); }
  };

  // Success screen
  if (booked) return (
    <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '.5rem' }}>✅</div>
      <h2 style={{ color: 'var(--primary)', fontFamily: 'var(--font-head)' }}>Truck Booked!</h2>
      <p style={{ color: 'var(--text2)', marginBottom: '1.5rem' }}>Trip ID: <b>{booked.tripId}</b></p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#E8F5E9', borderRadius: '10px', padding: '.75rem' }}><div style={{ fontSize: '.7rem', color: 'var(--text2)' }}>Vehicle</div><b>{truck?.icon} {truck?.name}</b></div>
        <div style={{ background: '#E3F2FD', borderRadius: '10px', padding: '.75rem' }}><div style={{ fontSize: '.7rem', color: 'var(--text2)' }}>Mode</div><b>{sharingMode === 'public' ? '🤝 Public' : '🔒 Private'}</b></div>
        <div style={{ background: '#FFF3E0', borderRadius: '10px', padding: '.75rem' }}><div style={{ fontSize: '.7rem', color: 'var(--text2)' }}>Destination</div><b>{destination.split(',')[0]}</b></div>
      </div>
      {sharingMode === 'public' && <p style={{ background: '#F1F8E9', padding: '.8rem', borderRadius: '10px', fontSize: '.85rem', color: '#33691E' }}>🤝 Other farmers can now see & join your trip in the "Shared Trips" tab!</p>}
      <button className="btn btn-green" style={{ marginTop: '1rem' }} onClick={() => { setBooked(null); setBStep(1); setTruck(null); }}>📋 Book Another</button>
    </div>
  );

  return (
    <>
      {/* Progress Steps */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem' }}>
        {['Select Truck', 'Load & Configure', 'Confirm'].map((label, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: '.6rem', background: bStep > i + 1 ? '#C8E6C9' : bStep === i + 1 ? 'var(--primary)' : '#f5f5f5', color: bStep === i + 1 ? '#fff' : bStep > i + 1 ? '#2E7D32' : 'var(--text3)', fontWeight: 700, fontSize: '.78rem', borderRadius: i === 0 ? '8px 0 0 8px' : i === 2 ? '0 8px 8px 0' : '0' }}>
            {bStep > i + 1 ? '✅' : `${i + 1}.`} {label}
          </div>
        ))}
      </div>

      {/* STEP 1: Select Truck */}
      {bStep === 1 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-head)', marginBottom: '1rem' }}>🚛 Choose Your Truck</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
            {trucks.map(t => (
              <div key={t.id} onClick={() => setTruck(t)} style={{
                border: truck?.id === t.id ? '3px solid var(--primary)' : '2px solid var(--border)',
                borderRadius: '14px', padding: '1.2rem', cursor: 'pointer', transition: 'all .2s',
                background: truck?.id === t.id ? '#f0f9f0' : '#fff', position: 'relative',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                {truck?.id === t.id && <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem' }}>✓</div>}
                <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '.5rem' }}>{t.icon}</div>
                <h4 style={{ textAlign: 'center', fontFamily: 'var(--font-head)', margin: '0 0 .3rem' }}>{t.name}</h4>
                <div style={{ textAlign: 'center', fontSize: '.78rem', color: 'var(--text2)' }}>🏋️ {t.capKg >= 1000 ? (t.capKg/1000) + ' Ton' : t.capKg + ' kg'} • ₹{t.rate}/km</div>
                {/* Capacity bar */}
                <div style={{ height: '6px', background: '#e0e0e0', borderRadius: '3px', margin: '.6rem 0 .4rem', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '0%', background: 'var(--primary)', borderRadius: '3px' }} />
                </div>
                <div style={{ display: 'flex', gap: '.3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {t.tags.map((tag, j) => <span key={j} style={{ background: '#E8F5E9', color: '#2E7D32', padding: '.1rem .4rem', borderRadius: '4px', fontSize: '.65rem', fontWeight: 600 }}>{tag}</span>)}
                  {t.cold && <span style={{ background: '#E3F2FD', color: '#1565C0', padding: '.1rem .4rem', borderRadius: '4px', fontSize: '.65rem', fontWeight: 600 }}>❄️ Cold</span>}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" disabled={!truck} onClick={() => { if (!truck) { toast('⚠️ Select a truck!'); return; } setPickupLoc(currentFarmer?.loc || ''); setBStep(2); }} style={{ width: '100%', marginTop: '1.5rem', padding: '.9rem', opacity: truck ? 1 : .5 }}>Next → Load & Configure</button>
        </div>
      )}

      {/* STEP 2: Load & Configure */}
      {bStep === 2 && truck && (
        <div>
          {/* Truck Visual */}
          <div className="card" style={{ marginBottom: '1.25rem', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#1B5E20,#2E7D32)', padding: '1rem 1.25rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><span style={{ fontSize: '1.5rem', marginRight: '.5rem' }}>{truck.icon}</span><b>{truck.name}</b></div>
              <span style={{ background: 'rgba(255,255,255,.2)', padding: '.2rem .7rem', borderRadius: '50px', fontSize: '.75rem' }}>Capacity: {truck.capKg >= 1000 ? (truck.capKg/1000) + ' Ton' : truck.capKg + ' kg'}</span>
            </div>
            {/* Loading visualization */}
            <div style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', fontWeight: 700, marginBottom: '.3rem' }}>
                <span>🏋️ Loaded: {myWeight || 0} qtl ({(parseInt(myWeight || 0) * 100)} kg)</span>
                <span style={{ color: capPct > 90 ? '#C62828' : capPct > 70 ? '#E65100' : 'var(--primary)' }}>{capPct}%</span>
              </div>
              <div style={{ height: '28px', background: '#f5f5f5', borderRadius: '14px', overflow: 'hidden', position: 'relative', border: '1px solid #e0e0e0' }}>
                <div style={{ height: '100%', width: Math.min(capPct, 100) + '%', background: capPct > 90 ? 'linear-gradient(90deg,#C62828,#E53935)' : capPct > 70 ? 'linear-gradient(90deg,#E65100,#FF9800)' : 'linear-gradient(90deg,#2E7D32,#43A047)', borderRadius: '14px', transition: 'width .4s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {capPct > 15 && <span style={{ color: '#fff', fontSize: '.7rem', fontWeight: 700 }}>👨‍🌾 {currentFarmer?.name?.split(' ')[0]} — {myWeight || 0} qtl</span>}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.68rem', color: 'var(--text3)', marginTop: '.2rem' }}>
                <span>0 kg</span><span>{truck.capKg >= 1000 ? (truck.capKg/1000) + ' Ton' : truck.capKg + ' kg'}</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header"><span className="card-title">📦 Load Details</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '0' }}>
              <div className="form-group"><label>⚖️ Your Cargo Weight (Quintals)</label><input type="number" value={myWeight} onChange={e => setMyWeight(e.target.value)} placeholder="e.g. 10" /></div>
              <div className="form-group"><label>🌾 Product Name</label><input value={myProduct} onChange={e => setMyProduct(e.target.value)} placeholder="e.g. Wheat, Onion" /></div>
            </div>
            <div className="form-group" style={{ marginTop: '.5rem' }}><label>📍 Pickup Location</label><input value={pickupLoc} onChange={e => setPickupLoc(e.target.value)} placeholder="Your farm/village" /></div>
          </div>

          {/* Destination Mandi */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header"><span className="card-title">🏪 Select Destination Mandi</span></div>
            <input value={mandiSearch} onChange={e => setMandiSearch(e.target.value)} placeholder="🔍 Search mandi or state..." style={{ width: '100%', padding: '.6rem 1rem', border: '2px solid var(--border)', borderRadius: 'var(--radius2)', marginBottom: '.75rem', fontFamily: 'var(--font-body)' }} />
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              {filteredMandis.map((m, i) => (
                <div key={i} onClick={() => { setDestination(m.name); setMandiSearch(''); }}
                  style={{ padding: '.55rem .8rem', borderRadius: '8px', cursor: 'pointer', border: destination === m.name ? '2px solid var(--primary)' : '1px solid var(--border)', background: destination === m.name ? '#f0f9f0' : '#fff', transition: 'all .15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '.85rem' }}>🏪 {m.name}</span>
                  <span style={{ fontSize: '.7rem', color: 'var(--text3)', background: '#f5f5f5', padding: '.15rem .5rem', borderRadius: '4px' }}>{m.state}</span>
                </div>
              ))}
            </div>
            {destination && <div style={{ marginTop: '.5rem', padding: '.5rem .8rem', background: '#E8F5E9', borderRadius: '8px', fontSize: '.82rem', fontWeight: 700, color: '#2E7D32' }}>✅ Selected: {destination}</div>}
          </div>

          {/* Sharing Mode */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header"><span className="card-title">🤝 Sharing Mode</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div onClick={() => setSharingMode('public')} style={{ padding: '1rem', borderRadius: '12px', border: sharingMode === 'public' ? '3px solid #2E7D32' : '2px solid var(--border)', cursor: 'pointer', background: sharingMode === 'public' ? '#E8F5E9' : '#fff', textAlign: 'center', transition: 'all .2s' }}>
                <div style={{ fontSize: '2rem', marginBottom: '.3rem' }}>🤝</div>
                <b style={{ color: '#2E7D32' }}>Public Sharing</b>
                <p style={{ fontSize: '.75rem', color: 'var(--text2)', margin: '.3rem 0 0' }}>Other farmers can see & join. Split costs by weight.</p>
              </div>
              <div onClick={() => setSharingMode('private')} style={{ padding: '1rem', borderRadius: '12px', border: sharingMode === 'private' ? '3px solid #1565C0' : '2px solid var(--border)', cursor: 'pointer', background: sharingMode === 'private' ? '#E3F2FD' : '#fff', textAlign: 'center', transition: 'all .2s' }}>
                <div style={{ fontSize: '2rem', marginBottom: '.3rem' }}>🔒</div>
                <b style={{ color: '#1565C0' }}>Private</b>
                <p style={{ fontSize: '.75rem', color: 'var(--text2)', margin: '.3rem 0 0' }}>Only you use this truck. Full fare, full control.</p>
              </div>
            </div>
          </div>

          {/* Departure */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>📅 Departure Date & Time</label>
            <input type="datetime-local" value={departureDate} onChange={e => setDepartureDate(e.target.value)} style={{ width: '100%', padding: '.65rem 1rem', border: '2px solid var(--border)', borderRadius: 'var(--radius2)', fontFamily: 'var(--font-body)' }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setBStep(1)}>← Back</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { if (!myWeight || !destination || !pickupLoc) { toast('⚠️ Fill weight, pickup & destination!'); return; } setBStep(3); }}>Review & Confirm →</button>
          </div>
        </div>
      )}

      {/* STEP 3: Confirm */}
      {bStep === 3 && truck && (
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header"><span className="card-title">📋 Booking Summary</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 600 }}>TRUCK</div><b>{truck.icon} {truck.name}</b></div>
              <div><div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 600 }}>CAPACITY</div><b>{truck.capKg >= 1000 ? (truck.capKg/1000)+' Ton' : truck.capKg+' kg'}</b></div>
              <div><div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 600 }}>YOUR LOAD</div><b>{myWeight} qtl ({myProduct || 'Crops'})</b></div>
              <div><div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 600 }}>MODE</div><b>{sharingMode === 'public' ? '🤝 Public' : '🔒 Private'}</b></div>
              <div><div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 600 }}>PICKUP</div><b>📍 {pickupLoc}</b></div>
              <div><div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 600 }}>DESTINATION</div><b>🏪 {destination}</b></div>
            </div>

            {/* Visual truck loading */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ fontSize: '.78rem', fontWeight: 700, marginBottom: '.4rem' }}>🚛 Truck Load Visualization</div>
              <div style={{ height: '40px', background: '#f5f5f5', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e0e0e0', position: 'relative' }}>
                <div style={{ height: '100%', width: Math.min(capPct, 100) + '%', background: colors[0], borderRadius: '10px 0 0 10px', display: 'flex', alignItems: 'center', paddingLeft: '.5rem', transition: 'width .4s' }}>
                  <span style={{ color: '#fff', fontSize: '.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>👨‍🌾 {currentFarmer?.name?.split(' ')[0]} — {myWeight} qtl</span>
                </div>
                {capPct < 100 && <div style={{ position: 'absolute', right: '.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '.7rem', color: 'var(--text3)' }}>{100 - capPct}% free</div>}
              </div>
              {sharingMode === 'public' && <p style={{ fontSize: '.72rem', color: '#E65100', marginTop: '.3rem' }}>⚡ Remaining space will be visible to other farmers for sharing</p>}
            </div>

            {/* Fare */}
            <div style={{ marginTop: '1.25rem', background: '#f8f8f8', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ fontSize: '.78rem', fontWeight: 700, marginBottom: '.5rem' }}>💰 Fare Estimate</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', marginBottom: '.3rem' }}><span>Base ({dist} km × ₹{truck.rate}/km)</span><span>₹{(truck.rate * dist).toLocaleString()}</span></div>
              {truck.cold && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', marginBottom: '.3rem' }}><span>❄️ Cold storage</span><span>₹{(dist * 5).toLocaleString()}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', marginBottom: '.3rem' }}><span>Loading & Platform</span><span>₹250</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', borderTop: '2px solid var(--border)', paddingTop: '.5rem', marginTop: '.3rem', color: '#1565C0' }}>
                <span>Total</span><span>₹{(truck.rate * dist + (truck.cold ? dist * 5 : 0) + 250).toLocaleString()}</span>
              </div>
              {sharingMode === 'public' && <p style={{ fontSize: '.72rem', color: '#2E7D32', marginTop: '.4rem' }}>💡 Cost will be split by weight when others join!</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setBStep(2)}>← Back</button>
            <button className="btn btn-green" style={{ flex: 1, padding: '.9rem', fontSize: '1rem' }} onClick={handleBook}>✅ Confirm & Book Truck</button>
          </div>
        </div>
      )}
    </>
  );
}
