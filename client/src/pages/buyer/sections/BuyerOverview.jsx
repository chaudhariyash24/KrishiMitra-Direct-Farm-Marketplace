import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../api/axios';

export default function BuyerOverview({ toast }) {
  const { currentBuyer } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (currentBuyer?.id) API.get(`/orders?buyerId=${currentBuyer.id}`).then(r => setOrders(r.data)).catch(() => {});
    API.get('/products').then(r => setProducts(r.data)).catch(() => {});
  }, []);

  const held = orders.filter(o => o.escrow?.status === 'held' || o.escrow?.status === 'awaiting-confirmation');
  const totalSpent = orders.filter(o => o.escrow?.status === 'released').reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <>
      <div className="page-header">
        <h1>👋 Welcome, {currentBuyer?.name || 'Buyer'}!</h1>
        <p>Your buying dashboard — browse products, track orders, manage escrow</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="icon-box icon-blue">🛒</div><div className="info"><h3>{orders.length}</h3><p>Total Orders</p></div></div>
        <div className="stat-card"><div className="icon-box icon-orange">🔒</div><div className="info"><h3>{held.length}</h3><p>In Escrow</p></div></div>
        <div className="stat-card"><div className="icon-box icon-green">💰</div><div className="info"><h3>₹{totalSpent.toLocaleString()}</h3><p>Total Spent</p></div></div>
        <div className="stat-card"><div className="icon-box icon-purple">📦</div><div className="info"><h3>{products.length}</h3><p>Products Available</p></div></div>
      </div>

      {held.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem', border: '2px solid #FF9800' }}>
          <div className="card-header"><span className="card-title">🔒 Escrow — Awaiting Your Confirmation</span></div>
          {held.map(o => (
            <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <b>{o.productName}</b> · {o.qty} qtl
                <div style={{ fontSize: '.78rem', color: 'var(--text2)' }}>From: {o.sellerName} · ₹{(o.totalAmount || 0).toLocaleString()}</div>
              </div>
              <span style={{ background: '#FFF3E0', color: '#E65100', padding: '.2rem .6rem', borderRadius: '50px', fontSize: '.72rem', fontWeight: 700 }}>
                {o.escrow?.buyerConfirmed ? '✅ You Confirmed' : '⏳ Confirm Delivery'}
              </span>
            </div>
          ))}
          <p style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.5rem' }}>Go to "My Orders" to confirm delivery and release payments.</p>
        </div>
      )}
    </>
  );
}
