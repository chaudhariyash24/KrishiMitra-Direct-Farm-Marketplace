export default function TransportAdmin({ toast }) {
  const vehicles = [
    {name:'Tata Ace',trips:142,rating:4.6,status:'Active'},
    {name:'Mini Pickup Van',trips:287,rating:4.8,status:'Active'},
    {name:'Tempo (407)',trips:198,rating:4.6,status:'Active'},
    {name:'Tractor Trolley',trips:95,rating:4.5,status:'Active'},
    {name:'Cold Storage Van',trips:76,rating:4.9,status:'Active'},
    {name:'Eicher Truck',trips:164,rating:4.7,status:'Active'},
  ];
  const drivers = [
    {name:'Suresh Kamble',plate:'MH-09 AB 4567',trips:342,rating:4.8},
    {name:'Ramesh Gaikwad',plate:'MH-12 EF 5678',trips:184,rating:4.7},
    {name:'Vijay Pawar',plate:'MH-15 GH 9012',trips:267,rating:4.9},
    {name:'Govind Desai',plate:'MH-04 IJ 3456',trips:211,rating:4.6},
  ];
  const deliveries = [
    {id:'KMT-2025-4891',from:'Solapur',to:'Nashik APMC',crop:'Grapes',status:'Delivered'},
    {id:'KMT-2025-4890',from:'Pune',to:'Mumbai APMC',crop:'Onion',status:'In Transit'},
    {id:'KMT-2025-4889',from:'Nagpur',to:'Hyderabad',crop:'Cotton',status:'Delivered'},
  ];

  return (
    <>
      <div className="page-header"><h1>🚚 Transport Management</h1></div>
      <div className="stats-grid" style={{marginBottom:'1.5rem'}}>
        <div className="stat-card"><div className="icon-box icon-blue">🚛</div><div className="info"><h3>{vehicles.length}</h3><p>Vehicle Types</p></div></div>
        <div className="stat-card"><div className="icon-box icon-green">👨‍✈️</div><div className="info"><h3>{drivers.length}</h3><p>Active Drivers</p></div></div>
        <div className="stat-card"><div className="icon-box icon-orange">📦</div><div className="info"><h3>{deliveries.length}</h3><p>Recent Deliveries</p></div></div>
        <div className="stat-card"><div className="icon-box icon-purple">⭐</div><div className="info"><h3>4.8</h3><p>Avg Rating</p></div></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>
        <div className="card">
          <div className="card-header"><span className="card-title">🚛 Fleet Overview</span></div>
          <table>
            <thead><tr><th>Vehicle</th><th>Trips</th><th>Rating</th><th>Status</th></tr></thead>
            <tbody>{vehicles.map((v,i)=>(
              <tr key={i}><td><b>{v.name}</b></td><td>{v.trips}</td><td>⭐ {v.rating}</td><td><span className="badge badge-green">{v.status}</span></td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">👨‍✈️ Drivers</span></div>
          <table>
            <thead><tr><th>Driver</th><th>Plate</th><th>Trips</th><th>Rating</th></tr></thead>
            <tbody>{drivers.map((d,i)=>(
              <tr key={i}><td><b>{d.name}</b></td><td>{d.plate}</td><td>{d.trips}</td><td>⭐ {d.rating}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div className="card" style={{marginTop:'1.5rem'}}>
        <div className="card-header"><span className="card-title">📦 Recent Deliveries</span></div>
        <table>
          <thead><tr><th>Booking ID</th><th>From</th><th>To</th><th>Crop</th><th>Status</th></tr></thead>
          <tbody>{deliveries.map((d,i)=>(
            <tr key={i}>
              <td style={{fontFamily:'var(--font-head)',fontWeight:700}}>{d.id}</td>
              <td>{d.from}</td><td>{d.to}</td><td>{d.crop}</td>
              <td><span className={`badge ${d.status==='Delivered'?'badge-green':'badge-orange'}`}>{d.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
