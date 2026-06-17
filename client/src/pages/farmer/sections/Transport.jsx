import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../api/axios';
import TrackingMap from '../../../components/TrackingMap';

const vehicles = [
  {id:'tata-ace',icon:'🛻',name:'Tata Ace',cap:'750 kg',rate:10,eta:'3h 50m',rating:4.6,speed:'55 km/h',cold:false,badge:null,tags:['Budget','City OK']},
  {id:'pickup',icon:'🚐',name:'Mini Pickup Van',cap:'1.5 Ton',rate:12,eta:'3h 10m',rating:4.8,speed:'70 km/h',cold:false,badge:'Best Value',tags:['Fast','Popular']},
  {id:'tempo',icon:'🚛',name:'Tempo (407)',cap:'2 Ton',rate:13,eta:'3h 40m',rating:4.6,speed:'60 km/h',cold:false,badge:null,tags:['Medium Load']},
  {id:'tractor',icon:'🚜',name:'Tractor Trolley',cap:'3 Ton',rate:8,eta:'5h 30m',rating:4.5,speed:'35 km/h',cold:false,badge:null,tags:['Cheapest','Bulk']},
  {id:'eicher',icon:'🚛',name:'Eicher Truck',cap:'5 Ton',rate:16,eta:'3h 50m',rating:4.7,speed:'65 km/h',cold:false,tags:['Large Load']},
  {id:'cold',icon:'❄️',name:'Cold Storage Van',cap:'3 Ton',rate:22,eta:'4h 00m',rating:4.9,speed:'65 km/h',cold:true,badge:'Recommended',tags:['Cold Chain','Premium']},
];

export default function Transport({ toast }) {
  const { currentFarmer } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [step, setStep] = useState('orders'); // orders | booking | vehicles | confirm | tracking
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState('');
  const [trackProgress, setTrackProgress] = useState(0);
  const [orderTab, setOrderTab] = useState('active'); // active | previous | shared | myshared
  const [disputeModal, setDisputeModal] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  // Sharing state
  const [shareEnabled, setShareEnabled] = useState(false);
  const [sharedTrips, setSharedTrips] = useState([]);
  const [mySharedTrips, setMySharedTrips] = useState([]);
  const [joinWeight, setJoinWeight] = useState('');
  const [joinProduct, setJoinProduct] = useState('');
  const [joiningTrip, setJoiningTrip] = useState(null);
  const [departureDate, setDepartureDate] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchSharedTrips();
    fetchMySharedTrips();
  }, []);

  const fetchSharedTrips = () => {
    API.get('/shared-trips?status=open').then(r => setSharedTrips(r.data)).catch(() => {});
  };
  const fetchMySharedTrips = () => {
    const id = currentFarmer?.id || '';
    if (id) API.get(`/shared-trips?farmerId=${id}`).then(r => setMySharedTrips(r.data)).catch(() => {});
  };

  const fetchOrders = () => {
    setLoading(true);
    const id = currentFarmer?.id || '';
    const name = encodeURIComponent(currentFarmer?.name || '');
    // Fetch orders where farmer is seller OR buyer
    Promise.all([
      API.get(`/orders?sellerId=${id}&sellerName=${name}`),
      API.get(`/orders?buyerId=${id}`),
    ]).then(([sellerRes, buyerRes]) => {
      // Merge and deduplicate by _id
      const all = [...sellerRes.data, ...buyerRes.data];
      const unique = all.filter((o, i, arr) => arr.findIndex(x => x._id === o._id) === i);
      setOrders(unique);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const startTransport = (order) => {
    setActiveOrder(order);
    setPickup(order.sellerLoc || currentFarmer?.loc || '');
    setDrop(order.buyerLoc || '');
    setWeight(order.qty?.toString() || '10');
    setStep('booking');
  };

  const calculateFare = () => {
    if (!pickup || !drop) { toast('⚠️ Enter pickup & drop!'); return; }
    const d = 80 + Math.floor(Math.random() * 150);
    setDistance(d);
    setDuration(`${Math.floor(d / 55)}h ${Math.round((d % 55) / 55 * 60)}m`);
    setStep('vehicles');
    toast(`🔍 Found ${vehicles.length} vehicles!`);
  };

  const confirmBooking = async () => {
    const sv = vehicles.find(v => v.id === selectedVehicle) || vehicles[1];
    const fare = sv.rate * distance + (parseInt(weight) > 10 ? parseInt(weight) * 8 : 0) + (sv.cold ? distance * 5 : 0) + 250;
    const bookingId = 'KMT-' + Date.now().toString(36).toUpperCase();
    const now = new Date().toISOString();
    try {
      await API.put(`/orders/${activeOrder._id}`, {
        status: 'in-transit',
        transportBooked: true,
        shippedAt: now,
        transportDetails: { vehicle: sv.name, driver: 'Suresh Kamble', fare, bookingId },
      });
      // Create shared trip if sharing is enabled
      if (shareEnabled) {
        const capKg = parseFloat(sv.cap) * (sv.cap.includes('Ton') ? 1000 : 1);
        await API.post('/shared-trips', {
          creatorId: currentFarmer?.id || '',
          creatorName: currentFarmer?.name || 'Farmer',
          creatorPhone: currentFarmer?.phone || '',
          creatorWeightKg: parseInt(weight) * 100,
          creatorOrderId: activeOrder.orderId,
          creatorProductName: activeOrder.productName,
          pickup, drop, distance, duration,
          vehicleId: sv.id, vehicleName: sv.name, vehicleIcon: sv.icon,
          vehicleCapacityKg: capKg, vehicleRate: sv.rate, vehicleCold: sv.cold,
          totalCapacityKg: capKg, usedCapacityKg: parseInt(weight) * 100,
          departureDate: departureDate || now,
          baseFare: fare - 250, totalFare: fare,
          status: 'open',
        });
        toast('✅ Transport booked & shared trip created! Others can join.');
      } else {
        toast('✅ Transport booked! Live tracking started.');
      }
      setActiveOrder({ ...activeOrder, shippedAt: now });
      setStep('tracking');
      setTrackProgress(0);
      fetchSharedTrips();
      fetchMySharedTrips();
    } catch { toast('❌ Booking failed'); }
  };

  const joinTrip = async (trip) => {
    if (!joinWeight) { toast('⚠️ Enter your cargo weight'); return; }
    try {
      await API.put(`/shared-trips/${trip._id}/join`, {
        farmerId: currentFarmer?.id || '',
        farmerName: currentFarmer?.name || 'Farmer',
        farmerPhone: currentFarmer?.phone || '',
        farmerLoc: currentFarmer?.loc || '',
        weightKg: parseInt(joinWeight) * 100,
        productName: joinProduct || 'Crops',
      });
      toast('✅ Join request sent! The trip creator will accept your request.');
      setJoiningTrip(null); setJoinWeight(''); setJoinProduct('');
      fetchSharedTrips(); fetchMySharedTrips();
    } catch (e) { toast('❌ ' + (e.response?.data?.message || 'Failed')); }
  };

  const respondToJoin = async (tripId, farmerId, action) => {
    try {
      await API.put(`/shared-trips/${tripId}/respond`, { farmerId, action });
      toast(action === 'accept' ? '✅ Participant accepted!' : '❌ Request rejected');
      fetchMySharedTrips();
    } catch { toast('❌ Failed'); }
  };

  const handleTrackProgress = (pct) => {
    setTrackProgress(pct);
  };

  const handleDeliveryComplete = () => {
    API.put(`/orders/${activeOrder._id}`, { status: 'delivered' });
    toast('🎉 Delivery completed! Both parties can now confirm to release escrow.');
    setTimeout(() => fetchOrders(), 2000);
  };

  // Escrow handlers
  const escrowConfirm = async (orderId, role) => {
    try {
      await API.put(`/orders/${orderId}/escrow/confirm`, { role });
      toast(`✅ Confirmed! Both must confirm to release payment.`);
      fetchOrders();
    } catch (e) { toast('❌ ' + (e.response?.data?.message || 'Failed')); }
  };

  const escrowApproveUnload = async (orderId) => {
    try {
      await API.put(`/orders/${orderId}/escrow/approve-unload`);
      toast('✅ Unload approved! Buyer will confirm receipt, then payment releases to you.');
      fetchOrders();
    } catch (e) { toast('❌ Failed'); }
  };

  const escrowDispute = async (orderId, role) => {
    if (!disputeReason) { toast('⚠️ Enter a reason'); return; }
    try {
      await API.put(`/orders/${orderId}/escrow/dispute`, { role, reason: disputeReason });
      toast('⚠️ Dispute raised. Payment frozen.');
      setDisputeModal(null); setDisputeReason('');
      fetchOrders();
    } catch (e) { toast('❌ Failed'); }
  };

  const getEscrowBadge = (esc) => {
    if (!esc) return null;
    const m = {
      'pending': { bg: '#f5f5f5', c: '#888', icon: '○', label: 'Pending' },
      'held': { bg: '#FFF3E0', c: '#E65100', icon: '🔒', label: 'Payment Held' },
      'payment-confirmed': { bg: '#E3F2FD', c: '#1565C0', icon: '💰', label: 'Payment Secured' },
      'awaiting-unload': { bg: '#F3E5F5', c: '#7B1FA2', icon: '📦', label: 'Awaiting Unload' },
      'released': { bg: '#E8F5E9', c: '#2E7D32', icon: '✅', label: 'Released' },
      'disputed': { bg: '#FFEBEE', c: '#C62828', icon: '⚠️', label: 'Disputed' },
      'refunded': { bg: '#F3E5F5', c: '#7B1FA2', icon: '↩️', label: 'Refunded' },
    };
    const s = m[esc.status] || m['pending'];
    return <span style={{ background: s.bg, color: s.c, padding: '.2rem .6rem', borderRadius: '50px', fontSize: '.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{s.icon} {s.label}</span>;
  };

  const isBuyer = (o) => o.buyerId === currentFarmer?.id;
  const isSeller = (o) => o.sellerId === currentFarmer?.id;

  const sv = vehicles.find(v => v.id === selectedVehicle) || vehicles[1];
  const speedKmh = parseInt(sv.speed) || 55;
  const baseFare = sv.rate * distance;
  const wSurcharge = parseInt(weight || 0) > 10 ? Math.round(parseInt(weight) * 8) : 0;
  const coldSurcharge = sv.cold ? distance * 5 : 0;
  const total = baseFare + wSurcharge + coldSurcharge + 250;

  const statusColor = s => ({
    'offer-pending': '#9E9E9E', pending: '#1565C0', accepted: '#E65100',
    'payment-held': '#1565C0', 'in-transit': '#FF8F00',
    'unload-pending': '#7B1FA2', delivered: '#2E7D32',
    rejected: '#C62828', cancelled: '#C62828'
  }[s] || '#888');
  const statusLabel = s => ({
    'offer-pending': '📩 Offer Pending', pending: '🆕 New', accepted: '✅ Accepted',
    'payment-held': '🔒 Payment Held', 'in-transit': '🚛 In Transit',
    'unload-pending': '📦 Unloading', delivered: '✅ Delivered',
    rejected: '❌ Rejected', cancelled: '❌ Cancelled'
  }[s] || s);

  const pendingOrders = orders.filter(o => o.status === 'payment-held' || o.status === 'accepted');
  const activeOrders = orders.filter(o => o.status === 'in-transit' || o.status === 'unload-pending');
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const myOrders = [...pendingOrders, ...activeOrders];

  const capPct = (used, total) => Math.min(100, Math.round((used / total) * 100));
  const capClass = (pct) => pct >= 90 ? 'full' : pct >= 70 ? 'high' : '';
  const stStatusBadge = (s) => ({ open: 'st-badge-open', full: 'st-badge-full', 'in-transit': 'st-badge-transit', completed: 'st-badge-done' }[s] || 'st-badge-open');
  const stStatusLabel = (s) => ({ open: '🟢 Open', full: '🟡 Full', 'in-transit': '🚛 In Transit', completed: '✅ Done' }[s] || s);

  // ===== SHARED TRIPS BOARD =====
  const renderSharedBoard = () => {
    if (sharedTrips.length === 0) return (
      <div className="st-empty"><div className="st-empty-icon">🤝</div><h3>No shared trips available</h3><p>When someone creates a shared trip, it will appear here. You can also create one when booking transport!</p></div>
    );
    return sharedTrips.map(t => {
      const pct = capPct(t.usedCapacityKg, t.totalCapacityKg);
      const remainKg = t.totalCapacityKg - t.usedCapacityKg;
      const isJoining = joiningTrip === t._id;
      const alreadyJoined = t.participants?.some(p => p.farmerId === currentFarmer?.id);
      const isCreator = t.creatorId === currentFarmer?.id;
      return (
        <div key={t._id} className="st-card">
          <div className="st-card-accent"></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '.3rem' }}>
            <div>
              <b style={{ fontSize: '1rem', color: 'var(--primary-dark)' }}>{t.vehicleIcon} {t.vehicleName}</b>
              <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: '.2rem' }}>by {t.creatorName} · {t.tripId}</div>
            </div>
            <span className={`st-badge ${stStatusBadge(t.status)}`}>{stStatusLabel(t.status)}</span>
          </div>
          <div className="st-route">
            <span className="st-route-dot pickup"></span><span>{t.pickup?.split(',')[0]}</span>
            <div className="st-route-line"></div>
            <span>{t.drop?.split(',')[0]}</span><span className="st-route-dot drop"></span>
          </div>
          <div className="st-meta">
            <span className="st-meta-item">📏 {t.distance} km</span>
            <span className="st-meta-item">⏱️ {t.duration}</span>
            <span className="st-meta-item">📅 {new Date(t.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            <span className="st-meta-item">💰 ₹{t.totalFare?.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text2)', marginBottom: '.2rem' }}>Capacity: {(t.usedCapacityKg / 100).toFixed(0)} / {(t.totalCapacityKg / 100).toFixed(0)} qtl ({pct}%)</div>
          <div className="st-cap-bar"><div className={`st-cap-fill ${capClass(pct)}`} style={{ width: pct + '%' }}></div></div>
          <div style={{ fontSize: '.82rem', color: '#1565C0', fontWeight: 700 }}>🆓 {(remainKg / 100).toFixed(0)} qtl remaining</div>

          {isCreator ? (
            <div style={{ marginTop: '.6rem', padding: '.5rem .8rem', background: '#E8F5E9', borderRadius: '8px', fontSize: '.82rem', fontWeight: 700, color: '#2E7D32' }}>✅ Your trip — manage in "My Shares" tab</div>
          ) : alreadyJoined ? (
            <div style={{ marginTop: '.6rem', padding: '.5rem .8rem', background: '#FFF3E0', borderRadius: '8px', fontSize: '.82rem', fontWeight: 700, color: '#E65100' }}>⏳ You've requested to join this trip</div>
          ) : isJoining ? (
            <div style={{ marginTop: '.8rem', padding: '1rem', background: '#F1F8E9', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <b style={{ fontSize: '.88rem' }}>Join this trip</b>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginTop: '.6rem' }}>
                <div className="form-group"><label>⚖️ Weight (qtl)</label><input value={joinWeight} onChange={e => setJoinWeight(e.target.value)} type="number" placeholder="e.g. 5" /></div>
                <div className="form-group"><label>🌾 Product</label><input value={joinProduct} onChange={e => setJoinProduct(e.target.value)} placeholder="e.g. Wheat" /></div>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.6rem' }}>
                <button className="btn btn-green btn-sm" style={{ flex: 1 }} onClick={() => joinTrip(t)}>✅ Send Request</button>
                <button className="btn btn-outline btn-sm" onClick={() => setJoiningTrip(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" style={{ marginTop: '.8rem', width: '100%' }} onClick={() => setJoiningTrip(t._id)}>🤝 Request to Join</button>
          )}
        </div>
      );
    });
  };

  // ===== MY SHARED TRIPS =====
  const renderMyShared = () => {
    if (mySharedTrips.length === 0) return (
      <div className="st-empty"><div className="st-empty-icon">📋</div><h3>No shared trips yet</h3><p>Create one by toggling "Open for Sharing" when booking transport.</p></div>
    );
    return mySharedTrips.map(t => {
      const isCreator = t.creatorId === currentFarmer?.id;
      const accepted = t.participants?.filter(p => p.status === 'accepted') || [];
      const pending = t.participants?.filter(p => p.status === 'pending') || [];
      const totalW = t.creatorWeightKg + accepted.reduce((s, p) => s + p.weightKg, 0);
      const creatorShare = totalW > 0 ? Math.round((t.creatorWeightKg / totalW) * t.totalFare) : t.totalFare;
      return (
        <div key={t._id} className="st-card">
          <div className="st-card-accent" style={{ background: isCreator ? 'linear-gradient(90deg,#2E7D32,#66BB6A)' : 'linear-gradient(90deg,#1565C0,#42A5F5)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.3rem' }}>
            <div><b>{t.vehicleIcon} {t.vehicleName}</b> · <span style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{t.tripId}</span></div>
            <span className={`st-badge ${stStatusBadge(t.status)}`}>{stStatusLabel(t.status)}</span>
          </div>
          <div className="st-route">
            <span className="st-route-dot pickup"></span><span>{t.pickup?.split(',')[0]}</span>
            <div className="st-route-line"></div>
            <span>{t.drop?.split(',')[0]}</span><span className="st-route-dot drop"></span>
          </div>
          <div className="st-meta">
            <span className="st-meta-item">📅 {new Date(t.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            <span className="st-meta-item">📏 {t.distance} km</span>
            <span className="st-meta-item">{isCreator ? '👑 Creator' : '🤝 Joined'}</span>
          </div>

          {/* Participants */}
          {isCreator && pending.length > 0 && (
            <div style={{ marginTop: '.8rem' }}>
              <b style={{ fontSize: '.85rem', color: '#E65100' }}>⏳ Pending Requests ({pending.length})</b>
              {pending.map(p => (
                <div key={p.farmerId} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.6rem', marginTop: '.4rem', background: '#FFF3E0', borderRadius: '10px', border: '1px solid #FFE0B2' }}>
                  <div className="st-avatar pending">{p.farmerName?.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: '.85rem' }}>{p.farmerName}</b>
                    <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{(p.weightKg / 100).toFixed(0)} qtl · {p.productName || 'Crops'}</div>
                  </div>
                  <button className="btn btn-green btn-sm" onClick={() => respondToJoin(t._id, p.farmerId, 'accept')}>✅</button>
                  <button className="btn btn-danger btn-sm" onClick={() => respondToJoin(t._id, p.farmerId, 'reject')}>✕</button>
                </div>
              ))}
            </div>
          )}

          {accepted.length > 0 && (
            <div style={{ marginTop: '.8rem' }}>
              <b style={{ fontSize: '.85rem', color: '#2E7D32' }}>✅ Co-Riders ({accepted.length})</b>
              {accepted.map(p => (
                <div key={p.farmerId} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.6rem', marginTop: '.4rem', background: '#E8F5E9', borderRadius: '10px' }}>
                  <div className="st-avatar member">{p.farmerName?.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: '.85rem' }}>{p.farmerName}</b>
                    <div style={{ fontSize: '.75rem', color: 'var(--text2)' }}>{(p.weightKg / 100).toFixed(0)} qtl · {p.productName || 'Crops'} · Share: ₹{p.fareShare?.toLocaleString()}</div>
                  </div>
                  <div className="st-contact-btns">
                    {p.farmerPhone && <a href={`tel:${p.farmerPhone}`} className="st-contact-btn call">📞 Call</a>}
                    {p.farmerPhone && <a href={`https://wa.me/91${p.farmerPhone}`} target="_blank" rel="noreferrer" className="st-contact-btn msg">💬 WhatsApp</a>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fare Split */}
          {(isCreator || accepted.some(p => p.farmerId === currentFarmer?.id)) && accepted.length > 0 && (
            <div className="st-fare-split">
              <b style={{ fontSize: '.85rem' }}>💰 Fare Split</b>
              <div className="st-fare-row"><span>👑 {t.creatorName} ({(t.creatorWeightKg / 100).toFixed(0)} qtl)</span><span style={{ fontWeight: 700 }}>₹{creatorShare.toLocaleString()}</span></div>
              {accepted.map(p => (
                <div key={p.farmerId} className="st-fare-row"><span>🤝 {p.farmerName} ({(p.weightKg / 100).toFixed(0)} qtl)</span><span style={{ fontWeight: 700 }}>₹{p.fareShare?.toLocaleString()}</span></div>
              ))}
              <div className="st-fare-row"><span>Total</span><span>₹{t.totalFare?.toLocaleString()}</span></div>
            </div>
          )}

          {/* Creator contact for joined participants */}
          {!isCreator && (
            <div style={{ marginTop: '.6rem', display: 'flex', gap: '.4rem' }}>
              {t.creatorPhone && <a href={`tel:${t.creatorPhone}`} className="st-contact-btn call">📞 Call {t.creatorName}</a>}
              {t.creatorPhone && <a href={`https://wa.me/91${t.creatorPhone}`} target="_blank" rel="noreferrer" className="st-contact-btn msg">💬 WhatsApp</a>}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div><h1>🚚 Transport & Logistics</h1><p>Manage incoming orders and book deliveries</p></div>
        {step !== 'orders' && <button className="btn btn-outline" onClick={() => { setStep('orders'); fetchOrders(); }}>← Back to Orders</button>}
      </div>

      {/* ORDERS VIEW */}
      {step === 'orders' && (
        <div>
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card"><div className="icon-box icon-blue">🆕</div><div className="info"><h3>{pendingOrders.length}</h3><p>New Orders</p></div></div>
            <div className="stat-card"><div className="icon-box icon-orange">🚛</div><div className="info"><h3>{activeOrders.length}</h3><p>In Transit</p></div></div>
            <div className="stat-card"><div className="icon-box icon-green">✅</div><div className="info"><h3>{completedOrders.length}</h3><p>Delivered</p></div></div>
            <div className="stat-card"><div className="icon-box icon-purple">📦</div><div className="info"><h3>{orders.length}</h3><p>Total</p></div></div>
          </div>

          {/* TABS */}
          <div className="tabs" style={{ marginBottom: '1.2rem' }}>
            <div className={`tab${orderTab === 'active' ? ' active' : ''}`} onClick={() => setOrderTab('active')}>
              📋 My Orders {myOrders.length > 0 && <span style={{ background: '#E53935', color: '#fff', borderRadius: '50%', padding: '0 .4rem', fontSize: '.7rem', marginLeft: '.3rem', fontWeight: 800 }}>{myOrders.length}</span>}
            </div>
            <div className={`tab${orderTab === 'previous' ? ' active' : ''}`} onClick={() => setOrderTab('previous')}>
              📦 Previous {completedOrders.length > 0 && <span style={{ background: '#2E7D32', color: '#fff', borderRadius: '50%', padding: '0 .4rem', fontSize: '.7rem', marginLeft: '.3rem', fontWeight: 800 }}>{completedOrders.length}</span>}
            </div>
            <div className={`tab${orderTab === 'shared' ? ' active' : ''}`} onClick={() => { setOrderTab('shared'); fetchSharedTrips(); }}>
              🤝 Shared Trips {sharedTrips.length > 0 && <span style={{ background: '#1565C0', color: '#fff', borderRadius: '50%', padding: '0 .4rem', fontSize: '.7rem', marginLeft: '.3rem', fontWeight: 800 }}>{sharedTrips.length}</span>}
            </div>
            <div className={`tab${orderTab === 'myshared' ? ' active' : ''}`} onClick={() => { setOrderTab('myshared'); fetchMySharedTrips(); }}>
              📋 My Shares {mySharedTrips.length > 0 && <span style={{ background: '#E65100', color: '#fff', borderRadius: '50%', padding: '0 .4rem', fontSize: '.7rem', marginLeft: '.3rem', fontWeight: 800 }}>{mySharedTrips.length}</span>}
            </div>
          </div>

          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}><p>Loading orders...</p></div>
          ) : orderTab === 'shared' ? (
            /* SHARED TRIPS BOARD */
            <>{renderSharedBoard()}</>
          ) : orderTab === 'myshared' ? (
            /* MY SHARED TRIPS */
            <>{renderMyShared()}</>
          ) : orderTab === 'active' ? (
            /* MY ORDERS TAB */
            myOrders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h3>No active orders</h3>
                <p>When someone buys your product from the Marketplace, the order will appear here. You can then book transport to deliver it.</p>
              </div>
            ) : (
              <div className="card">
                <div className="card-header"><span className="card-title">📋 Active Orders</span></div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Order</th><th>Product</th><th>Qty</th><th>Buyer</th><th>Amount</th><th>💰 Escrow</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {myOrders.map(o => {
                        const esc = o.escrow || {};
                        const amIBuyer = isBuyer(o);
                        const amISeller = isSeller(o);
                        const myRole = amIBuyer ? 'buyer' : 'seller';
                        const iConfirmed = amIBuyer ? esc.buyerConfirmed : esc.sellerConfirmed;
                        const otherConfirmed = amIBuyer ? esc.sellerConfirmed : esc.buyerConfirmed;
                        return (
                          <tr key={o._id}>
                            <td><b style={{ color: 'var(--primary)', fontSize: '.8rem' }}>{o.orderId}</b></td>
                            <td><b>{o.productName}</b></td>
                            <td>{o.qty} qtl</td>
                            <td style={{ fontSize: '.82rem' }}>{o.buyerName}<br /><span style={{ color: 'var(--text3)', fontSize: '.72rem' }}>📍 {o.buyerLoc}</span></td>
                            <td style={{ fontWeight: 700 }}>₹{(o.totalAmount || 0).toLocaleString()}</td>
                            <td>
                              {getEscrowBadge(esc)}
                              {esc.buyerPaid && amISeller && (
                                <div style={{ fontSize: '.65rem', marginTop: '.2rem', color: '#2E7D32', fontWeight: 700 }}>💰 Buyer paid to platform</div>
                              )}
                            </td>
                            <td><span style={{ background: statusColor(o.status) + '18', color: statusColor(o.status), padding: '.2rem .6rem', borderRadius: '50px', fontSize: '.72rem', fontWeight: 700 }}>{statusLabel(o.status)}</span></td>
                            <td>
                              {(o.status === 'accepted' || o.status === 'payment-held') && amISeller && esc.buyerPaid && (
                                <button className="btn btn-green btn-sm" onClick={() => startTransport(o)}>🚚 Ship Now</button>
                              )}
                              {o.status === 'in-transit' && (
                                <button className="btn btn-sm" style={{ background: '#E65100', color: '#fff' }} onClick={() => { setActiveOrder(o); setPickup(o.sellerLoc || ''); setDrop(o.buyerLoc || ''); setStep('tracking'); }}>📍 Track</button>
                              )}
                              {o.status === 'in-transit' && amISeller && esc.buyerPaid && !esc.farmerApprovedUnload && (
                                <button className="btn btn-sm" style={{ background: '#7B1FA2', color: '#fff', marginTop: '.3rem' }} onClick={() => escrowApproveUnload(o._id)}>📦 Approve Unload</button>
                              )}
                              {esc.farmerApprovedUnload && !esc.buyerConfirmedReceived && (
                                <span style={{ fontSize: '.68rem', color: '#7B1FA2', fontWeight: 700, display: 'block', marginTop: '.3rem' }}>📦 Unload approved — waiting buyer</span>
                              )}
                              {esc.status === 'released' && (
                                <span style={{ fontSize: '.68rem', color: '#2E7D32', fontWeight: 700, display: 'block', marginTop: '.3rem' }}>✅ Payment released to you</span>
                              )}
                              {esc.status !== 'released' && esc.status !== 'disputed' && o.status === 'in-transit' && (
                                <button className="btn btn-sm" style={{ background: '#FFEBEE', color: '#C62828', border: '1px solid #EF9A9A', marginTop: '.3rem' }} onClick={() => setDisputeModal(o)}>⚠️</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            /* PREVIOUS ORDERS TAB */
            completedOrders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <h3>No previous orders</h3>
                <p>Completed deliveries will show up here.</p>
              </div>
            ) : (
              <div className="card">
                <div className="card-header"><span className="card-title">📦 Previous Orders</span></div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Order</th><th>Product</th><th>Qty</th><th>Buyer</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                    <tbody>
                      {completedOrders.map(o => (
                        <tr key={o._id}>
                          <td><b style={{ color: 'var(--primary)', fontSize: '.8rem' }}>{o.orderId}</b></td>
                          <td><b>{o.productName}</b></td>
                          <td>{o.qty} qtl</td>
                          <td style={{ fontSize: '.82rem' }}>{o.buyerName}<br /><span style={{ color: 'var(--text3)', fontSize: '.72rem' }}>📍 {o.buyerLoc}</span></td>
                          <td style={{ fontWeight: 700 }}>₹{(o.totalAmount || 0).toLocaleString()}</td>
                          <td style={{ fontSize: '.8rem' }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                          <td><span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '.2rem .6rem', borderRadius: '50px', fontSize: '.72rem', fontWeight: 700 }}>✅ Delivered</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* BOOKING FORM */}
      {step === 'booking' && activeOrder && (
        <div>
          <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)', background: '#f0f9f0' }}>
            <div className="card-header"><span className="card-title">📦 Shipping Order: {activeOrder.orderId}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '.88rem' }}>
              <div><b>Product:</b> {activeOrder.productName}</div>
              <div><b>Qty:</b> {activeOrder.qty} qtl</div>
              <div><b>Buyer:</b> {activeOrder.buyerName}</div>
            </div>
          </div>
          <div className="booking-form-card">
            <div className="booking-form-title">📍 Pickup & Delivery</div>
            <div className="form-row" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 700, marginBottom: '.4rem', display: 'block' }}>🌾 Pickup (Your Location)</label>
                <div className="location-input-wrap"><span className="location-icon">🌾</span><input value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Your farm" type="text" /></div>
              </div>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 700, marginBottom: '.4rem', display: 'block' }}>📍 Deliver To (Buyer)</label>
                <div className="location-input-wrap"><span className="location-icon">📍</span><input value={drop} onChange={e => setDrop(e.target.value)} placeholder="Buyer location" type="text" /></div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>📅 Pickup Date</label><input type="datetime-local" style={{ width: '100%', padding: '.65rem 1rem', border: '2px solid var(--border)', borderRadius: 'var(--radius2)', fontFamily: 'var(--font-body)' }} /></div>
              <div className="form-group"><label>⚖️ Weight (Quintal)</label><input value={weight} onChange={e => setWeight(e.target.value)} type="number" /></div>
            </div>
          </div>
          {/* Share toggle */}
          <div className={`st-toggle${shareEnabled ? ' active' : ''}`} onClick={() => setShareEnabled(!shareEnabled)}>
            <div className="st-toggle-switch"></div>
            <div><b>{shareEnabled ? '🤝 Sharing ON' : '🤝 Open for Sharing?'}</b><br/><span style={{fontSize:'.78rem',opacity:.8}}>{shareEnabled ? 'Others can join your trip & split costs!' : 'Toggle to let nearby farmers share this ride'}</span></div>
          </div>
          {shareEnabled && (
            <div className="form-group" style={{marginBottom:'1rem'}}>
              <label>📅 Departure Date & Time</label>
              <input type="datetime-local" value={departureDate} onChange={e => setDepartureDate(e.target.value)} style={{width:'100%',padding:'.65rem 1rem',border:'2px solid var(--border)',borderRadius:'var(--radius2)',fontFamily:'var(--font-body)'}} />
            </div>
          )}
          <button className="btn btn-primary" onClick={calculateFare} style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>🔍 Find Vehicles →</button>
        </div>
      )}

      {/* VEHICLE SELECTION */}
      {step === 'vehicles' && (
        <div>
          <div className="fare-estimate-card">
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: '#1565c0', marginBottom: '1rem' }}>📊 Route: {pickup.split(',')[0]} → {drop.split(',')[0]}</div>
            <div className="fare-row">
              <div className="fare-item"><div className="fare-val">{distance}</div><div className="fare-lbl">KM</div></div>
              <div className="fare-item"><div className="fare-val">{duration}</div><div className="fare-lbl">Duration</div></div>
              <div className="fare-item"><div className="fare-val">₹{(distance * 10).toLocaleString()}</div><div className="fare-lbl">Est. Fare</div></div>
            </div>
          </div>
          <div className="booking-form-card" style={{ marginBottom: '1.5rem' }}>
            <div className="booking-form-title">🚛 Select Vehicle</div>
            <div className="vehicle-grid">
              {vehicles.map(v => {
                const fare = v.rate * distance + (parseInt(weight) > 10 ? parseInt(weight) * 8 : 0) + (v.cold ? distance * 5 : 0);
                return (
                  <div key={v.id} className={`vehicle-card${selectedVehicle === v.id ? ' selected' : ''}`} onClick={() => setSelectedVehicle(v.id)}>
                    {v.badge && <div className="v-badge-best">{v.badge}</div>}
                    <div className="v-icon">{v.icon}</div>
                    <h4>{v.name}</h4>
                    <div className="v-cap">🏋️ {v.cap} | ⚡ {v.speed}</div>
                    <div className="v-fare">₹{fare.toLocaleString()} <span>/ trip</span></div>
                    <div className="v-meta">{v.tags.map((t, i) => <span key={i} className="v-tag">{t}</span>)}{v.cold && <span className="v-tag cold">❄️</span>}</div>
                    <div className="v-rating">⭐ {v.rating} · ETA {v.eta}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setStep('booking')}>← Back</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { if (!selectedVehicle) { toast('⚠️ Select a vehicle!'); return; } setStep('confirm'); }}>Confirm →</button>
          </div>
        </div>
      )}

      {/* CONFIRM & PAY */}
      {step === 'confirm' && (
        <div>
          <div className="driver-card" style={{ marginBottom: '1.5rem' }}>
            <div className="driver-avatar">👨‍✈️</div>
            <div className="driver-info">
              <h3>Suresh Kamble</h3><p>MH-09 AB 4567 · {sv.name}</p>
              <div className="d-tags"><span className="d-tag">⭐ 4.8</span><span className="d-tag">✅ Verified</span><span className="d-tag">📦 342 Trips</span></div>
            </div>
          </div>
          <div className="confirm-card">
            <div className="card-header"><span className="card-title">💰 Fare Summary</span></div>
            <table className="fare-summary-table"><tbody>
              <tr><td>Base ({distance} km × ₹{sv.rate}/km)</td><td style={{ textAlign: 'right', fontWeight: 700 }}>₹{baseFare.toLocaleString()}</td></tr>
              {wSurcharge > 0 && <tr><td>Weight surcharge</td><td style={{ textAlign: 'right', fontWeight: 700 }}>₹{wSurcharge}</td></tr>}
              {coldSurcharge > 0 && <tr><td>❄️ Cold storage</td><td style={{ textAlign: 'right', fontWeight: 700 }}>₹{coldSurcharge.toLocaleString()}</td></tr>}
              <tr><td>Loading + Platform</td><td style={{ textAlign: 'right', fontWeight: 700 }}>₹250</td></tr>
              <tr className="total-row"><td>Total</td><td style={{ textAlign: 'right', color: '#1565c0' }}>₹{total.toLocaleString()}</td></tr>
            </tbody></table>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setStep('vehicles')}>← Back</button>
            <button className="btn btn-primary" style={{ flex: 1, background: '#1565c0' }} onClick={confirmBooking}>✅ Book & Ship</button>
          </div>
        </div>
      )}

      {/* LIVE TRACKING */}
      {step === 'tracking' && (
        <div>
          <div className="booking-form-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--primary-dark)' }}>🔴 Live Tracking</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>{activeOrder?.orderId} · {activeOrder?.productName}</div>
              </div>
              <span className={`delivery-status-badge ${trackProgress >= 100 ? 'status-delivered' : 'status-transit'}`}>{trackProgress >= 100 ? '✅ Delivered' : '🚛 In Transit'}</span>
            </div>
            <div style={{ padding: '.75rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', fontWeight: 700, color: 'var(--text2)' }}>
                <span>🌾 {pickup.split(',')[0] || 'Pickup'}</span><span style={{ color: 'var(--primary)', fontSize: '.85rem' }}>{trackProgress}%</span><span>📍 {drop.split(',')[0] || 'Buyer'}</span>
              </div>
              <div className="delivery-progress-wrap"><div className="delivery-progress-bar" style={{ width: trackProgress + '%', transition: 'width .8s ease' }}></div></div>
            </div>
            <div style={{ margin: '0 1.5rem 1.5rem' }}>
              <TrackingMap
                pickupName={pickup}
                dropName={drop}
                speed={speedKmh}
                shippedAt={activeOrder?.shippedAt}
                onProgress={handleTrackProgress}
                onComplete={handleDeliveryComplete}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setStep('orders'); fetchOrders(); }}>← Back to Orders</button>
            {trackProgress >= 100 && <button className="btn btn-green" style={{ flex: 1 }} onClick={() => { setStep('orders'); fetchOrders(); }}>✅ View All Orders</button>}
          </div>
        </div>
      )}

      {/* DISPUTE MODAL */}
      {disputeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }} onClick={() => setDisputeModal(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 .5rem', fontFamily: 'var(--font-head)', color: '#C62828' }}>⚠️ Raise Dispute</h3>
            <p style={{ fontSize: '.85rem', color: 'var(--text2)', margin: '0 0 1rem' }}>Order: <b>{disputeModal.orderId}</b> · ₹{(disputeModal.totalAmount || 0).toLocaleString()}</p>
            <p style={{ fontSize: '.82rem', color: 'var(--text2)', margin: '0 0 .5rem' }}>Payment will remain frozen until admin resolves the dispute.</p>
            <div className="form-group">
              <label>📝 Reason for Dispute</label>
              <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="Describe the issue — wrong product, damaged goods, quality mismatch..." rows={3} style={{ width: '100%', padding: '.65rem 1rem', border: '2px solid var(--border)', borderRadius: 'var(--radius2)', fontFamily: 'var(--font-body)', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => { setDisputeModal(null); setDisputeReason(''); }}>Cancel</button>
              <button className="btn" style={{ flex: 1, background: '#C62828', color: '#fff' }} onClick={() => escrowDispute(disputeModal._id, isBuyer(disputeModal) ? 'buyer' : 'seller')}>⚠️ Submit Dispute</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
