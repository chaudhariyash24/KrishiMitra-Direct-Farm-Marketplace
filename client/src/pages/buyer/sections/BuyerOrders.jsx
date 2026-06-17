import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../api/axios';

export default function BuyerOrders({ toast }) {
  const { currentBuyer } = useAuth();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('active');
  const [disputeModal, setDisputeModal] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  const fetchOrders = () => {
    if (currentBuyer?.id) API.get(`/orders?buyerId=${currentBuyer.id}`).then(r => setOrders(r.data)).catch(() => {});
  };
  useEffect(fetchOrders, []);

  const payToEscrow = async (id) => {
    try {
      await API.put(`/orders/${id}/escrow/pay`);
      toast('✅ Payment transferred to platform escrow! Farmer can now see your payment is secured.');
      fetchOrders();
    } catch { toast('❌ Failed'); }
  };

  const confirmReceived = async (id) => {
    try {
      await API.put(`/orders/${id}/escrow/confirm-received`);
      toast('✅ You confirmed goods received! Payment released to farmer.');
      fetchOrders();
    } catch { toast('❌ Failed'); }
  };

  const raiseDispute = async (id) => {
    if (!disputeReason) { toast('⚠️ Enter reason'); return; }
    try {
      await API.put(`/orders/${id}/escrow/dispute`, { role: 'buyer', reason: disputeReason });
      toast('⚠️ Dispute raised. Payment frozen.');
      setDisputeModal(null); setDisputeReason('');
      fetchOrders();
    } catch { toast('❌ Failed'); }
  };

  const active = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'rejected');
  const completed = orders.filter(o => o.status === 'delivered' || o.status === 'rejected');
  const display = tab === 'active' ? active : completed;

  const statusMeta = {
    'offer-pending': { icon: '📩', label: 'Offer Sent', bg: '#FFF3E0', c: '#E65100' },
    'accepted': { icon: '✅', label: 'Accepted — Pay Now', bg: '#E8F5E9', c: '#2E7D32' },
    'rejected': { icon: '❌', label: 'Rejected', bg: '#FFEBEE', c: '#C62828' },
    'payment-held': { icon: '🔒', label: 'Payment Held', bg: '#E3F2FD', c: '#1565C0' },
    'in-transit': { icon: '🚛', label: 'In Transit', bg: '#FFF3E0', c: '#E65100' },
    'unload-pending': { icon: '📦', label: 'Unloading', bg: '#F3E5F5', c: '#7B1FA2' },
    'delivered': { icon: '✅', label: 'Delivered', bg: '#E8F5E9', c: '#2E7D32' },
    'cancelled': { icon: '❌', label: 'Cancelled', bg: '#FFEBEE', c: '#C62828' },
  };

  return (
    <>
      <div className="page-header"><h1>📦 My Orders</h1><p>Track offers, payments & deliveries</p></div>
      <div className="tabs" style={{ marginBottom: '1.2rem' }}>
        <div className={`tab${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>📋 Active ({active.length})</div>
        <div className={`tab${tab === 'completed' ? ' active' : ''}`} onClick={() => setTab('completed')}>✅ History ({completed.length})</div>
      </div>

      {display.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h3>{tab === 'active' ? 'No active orders' : 'No order history'}</h3>
        </div>
      ) : display.map(o => {
        const sm = statusMeta[o.status] || statusMeta['offer-pending'];
        const esc = o.escrow || {};
        return (
          <div key={o._id} className="card" style={{ marginBottom: '1rem', borderLeft: `4px solid ${sm.c}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
              <div>
                <b style={{ fontSize: '1rem' }}>{o.productName}</b>
                <span style={{ fontSize: '.75rem', color: 'var(--text3)', marginLeft: '.5rem' }}>{o.orderId}</span>
                <div style={{ fontSize: '.82rem', color: 'var(--text2)', marginTop: '.2rem' }}>
                  👨‍🌾 {o.sellerName} · 📍 {o.sellerLoc} · {o.qty} qtl
                </div>
                {o.offeredPrice && o.offeredPrice !== o.price && (
                  <div style={{ fontSize: '.78rem', marginTop: '.2rem' }}>
                    <span style={{ color: 'var(--text3)', textDecoration: 'line-through' }}>₹{o.price}/qtl</span>
                    <span style={{ color: '#1565C0', fontWeight: 700, marginLeft: '.5rem' }}>Your offer: ₹{o.offeredPrice}/qtl</span>
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1565C0' }}>₹{(o.totalAmount || 0).toLocaleString()}</div>
                <span style={{ background: sm.bg, color: sm.c, padding: '.2rem .6rem', borderRadius: '50px', fontSize: '.7rem', fontWeight: 700 }}>{sm.icon} {sm.label}</span>
              </div>
            </div>

            {/* ESCROW TIMELINE */}
            <div style={{ display: 'flex', gap: '0', marginTop: '.75rem', fontSize: '.65rem', fontWeight: 700 }}>
              {['Offer', 'Accepted', 'Paid', 'Shipped', 'Unload', 'Done'].map((step, i) => {
                const stepsDone = { 'offer-pending': 1, 'accepted': 2, 'payment-held': 3, 'in-transit': 4, 'unload-pending': 5, 'delivered': 6 };
                const done = (stepsDone[o.status] || 0) >= i + 1;
                return (
                  <div key={i} style={{ flex: 1, textAlign: 'center', padding: '.3rem 0', background: done ? '#E8F5E9' : '#f5f5f5', color: done ? '#2E7D32' : '#bbb', borderRight: i < 5 ? '1px solid #e0e0e0' : 'none', borderRadius: i === 0 ? '6px 0 0 6px' : i === 5 ? '0 6px 6px 0' : '' }}>
                    {done ? '✅' : '○'} {step}
                  </div>
                );
              })}
            </div>

            {/* ACTIONS */}
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem', flexWrap: 'wrap' }}>
              {o.status === 'accepted' && (
                <button className="btn btn-green btn-sm" style={{ flex: 1 }} onClick={() => payToEscrow(o._id)}>
                  🔒 Pay ₹{(o.totalAmount || 0).toLocaleString()} to Escrow
                </button>
              )}
              {o.status === 'unload-pending' && !esc.buyerConfirmedReceived && (
                <button className="btn btn-green btn-sm" style={{ flex: 1 }} onClick={() => confirmReceived(o._id)}>
                  ✅ Confirm Goods Received — Release Payment
                </button>
              )}
              {['in-transit', 'unload-pending'].includes(o.status) && esc.status !== 'disputed' && (
                <button className="btn btn-sm" style={{ background: '#FFEBEE', color: '#C62828', border: '1px solid #EF9A9A' }} onClick={() => setDisputeModal(o)}>⚠️ Dispute</button>
              )}
              {o.status === 'rejected' && (
                <div style={{ fontSize: '.82rem', color: '#C62828' }}>❌ Farmer rejected: {o.rejectedReason || 'No reason given'}</div>
              )}
            </div>
          </div>
        );
      })}

      {/* Dispute Modal */}
      {disputeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }} onClick={() => setDisputeModal(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 .5rem', color: '#C62828' }}>⚠️ Raise Dispute</h3>
            <p style={{ fontSize: '.85rem', color: 'var(--text2)' }}>Order: <b>{disputeModal.orderId}</b></p>
            <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="Describe the issue..." rows={3} style={{ width: '100%', padding: '.65rem 1rem', border: '2px solid var(--border)', borderRadius: 'var(--radius2)', fontFamily: 'var(--font-body)', marginTop: '.5rem' }} />
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => { setDisputeModal(null); setDisputeReason(''); }}>Cancel</button>
              <button className="btn" style={{ flex: 1, background: '#C62828', color: '#fff' }} onClick={() => raiseDispute(disputeModal._id)}>⚠️ Submit</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
