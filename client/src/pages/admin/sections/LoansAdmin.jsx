import { useState, useEffect } from 'react';
import API from '../../../api/axios';

export default function LoansAdmin({ toast }) {
  const [loans, setLoans] = useState([]);
  const [rate, setRate] = useState(7);
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [remarks, setRemarks] = useState({});

  const load = () => {
    API.get('/loans').then(r => setLoans(r.data)).catch(() => {});
    API.get('/loans/rate').then(r => setRate(r.data.rate)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleVerify = async (id, status) => {
    try {
      await API.put(`/loans/${id}/verify`, { status, adminRemarks: remarks[id] || '' });
      toast(`Loan ${status} ✅`);
      load();
    } catch (e) { toast('❌ Action failed'); }
  };

  const updateRate = async () => {
    await API.put('/loans/rate', { rate });
    toast('Interest rate updated to ' + rate + '% ✅');
  };

  const filtered = filter === 'All' ? loans : loans.filter(l => l.status === filter);

  const getScoreColor = (s) => s >= 750 ? '#4CAF50' : s >= 650 ? '#8BC34A' : s >= 550 ? '#FFC107' : '#F44336';

  return (
    <>
      <div className="page-header"><h1>💰 Loan Management</h1><p>Review KYC, CIBIL scores, and approve/reject applications</p></div>

      {/* Interest Rate Config */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><span className="card-title">⚙️ Interest Rate Config</span></div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input value={rate} onChange={e => setRate(e.target.value)} min="1" max="20" step="0.5" type="number" style={{ width: '120px' }} />
          <span style={{ fontSize: '.85rem', color: 'var(--text2)' }}>% per annum</span>
          <button className="btn btn-green btn-sm" onClick={updateRate}>Update Rate</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
        {['All', 'Pending', 'Approved', 'Rejected'].map(f => (
          <button key={f} className={`tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f} {f !== 'All' && `(${loans.filter(l => l.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Loans Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="e-icon">📋</div><p>No {filter !== 'All' ? filter.toLowerCase() : ''} loans</p></div>
        ) : filtered.map((l, i) => (
          <div key={i} className="loan-admin-card" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            {/* Header Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === l._id ? null : l._id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👨‍🌾</div>
                <div>
                  <div style={{ fontWeight: 800, fontFamily: 'var(--font-head)' }}>{l.farmer}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>₹{(l.amount || 0).toLocaleString()} • {l.purpose} • {l.duration}mo</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {l.cibilScore > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: getScoreColor(l.cibilScore), fontFamily: 'var(--font-head)' }}>{l.cibilScore}</div>
                    <div style={{ fontSize: '.65rem', color: 'var(--text3)' }}>CIBIL</div>
                  </div>
                )}
                <span className={`badge ${l.status === 'Approved' ? 'badge-green' : l.status === 'Rejected' ? 'badge-red' : 'badge-orange'}`}>{l.status}</span>
                <span style={{ fontSize: '.85rem', color: 'var(--text3)' }}>{expanded === l._id ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Expanded Details */}
            {expanded === l._id && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#fafffe', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div><div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>Aadhaar</div><div style={{ fontWeight: 700 }}>{l.aadhaar || 'N/A'}</div></div>
                  <div><div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>PAN</div><div style={{ fontWeight: 700 }}>{l.pan || 'N/A'}</div></div>
                  <div><div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>OTP Verified</div><div style={{ fontWeight: 700, color: l.otpVerified ? '#4CAF50' : '#F44336' }}>{l.otpVerified ? '✅ Yes' : '❌ No'}</div></div>
                  <div><div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>EMI</div><div style={{ fontWeight: 700 }}>₹{(l.emi || 0).toLocaleString()}/mo</div></div>
                  <div><div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>Rate</div><div style={{ fontWeight: 700 }}>{l.rate}%</div></div>
                  <div><div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>KYC</div><div style={{ fontWeight: 700, color: l.kycCompleted ? '#4CAF50' : '#FF9800' }}>{l.kycCompleted ? '✅ Complete' : '⏳ Pending'}</div></div>
                </div>

                {/* Documents */}
                {l.documents && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '.5rem' }}>📁 Documents</div>
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                      {Object.entries(l.documents || {}).map(([k, v]) => v && (
                        <span key={k} className="badge badge-blue" style={{ fontSize: '.72rem' }}>📄 {k}</span>
                      ))}
                      {!Object.values(l.documents || {}).some(Boolean) && <span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>No documents</span>}
                    </div>
                  </div>
                )}

                {/* CIBIL Breakdown */}
                {l.cibilBreakdown && l.cibilScore > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '.5rem' }}>📊 CIBIL Breakdown</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.5rem' }}>
                      <div style={{ textAlign: 'center', background: '#f5f5f5', borderRadius: '8px', padding: '.5rem' }}>
                        <div style={{ fontWeight: 800, color: '#4CAF50' }}>{l.cibilBreakdown.paymentHistory}%</div>
                        <div style={{ fontSize: '.65rem', color: 'var(--text3)' }}>Payment</div>
                      </div>
                      <div style={{ textAlign: 'center', background: '#f5f5f5', borderRadius: '8px', padding: '.5rem' }}>
                        <div style={{ fontWeight: 800, color: '#FF9800' }}>{l.cibilBreakdown.creditUtilization}%</div>
                        <div style={{ fontSize: '.65rem', color: 'var(--text3)' }}>Utilization</div>
                      </div>
                      <div style={{ textAlign: 'center', background: '#f5f5f5', borderRadius: '8px', padding: '.5rem' }}>
                        <div style={{ fontWeight: 800, color: '#2196F3' }}>{l.cibilBreakdown.creditAge} yrs</div>
                        <div style={{ fontSize: '.65rem', color: 'var(--text3)' }}>Age</div>
                      </div>
                      <div style={{ textAlign: 'center', background: '#f5f5f5', borderRadius: '8px', padding: '.5rem' }}>
                        <div style={{ fontWeight: 800, color: '#9C27B0' }}>{l.cibilBreakdown.enquiries}</div>
                        <div style={{ fontSize: '.65rem', color: 'var(--text3)' }}>Enquiries</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                {l.status === 'Pending' && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: '.75rem' }}>
                      <label style={{ fontSize: '.82rem' }}>Admin Remarks (optional)</label>
                      <input value={remarks[l._id] || ''} onChange={e => setRemarks(p => ({ ...p, [l._id]: e.target.value }))} placeholder="Add remarks for farmer..." />
                    </div>
                    <div style={{ display: 'flex', gap: '.75rem' }}>
                      <button className="btn btn-green" onClick={() => handleVerify(l._id, 'Approved')} style={{ flex: 1 }}>✅ Approve Loan</button>
                      <button className="btn btn-danger" onClick={() => handleVerify(l._id, 'Rejected')} style={{ flex: 1 }}>❌ Reject Loan</button>
                    </div>
                  </div>
                )}
                {l.adminRemarks && <div style={{ marginTop: '.75rem', fontSize: '.82rem', color: '#E65100', background: '#FFF3E0', padding: '.5rem .75rem', borderRadius: '8px' }}>💬 Admin: {l.adminRemarks}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
