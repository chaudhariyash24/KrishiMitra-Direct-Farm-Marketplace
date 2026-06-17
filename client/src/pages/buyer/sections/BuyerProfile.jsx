import { useAuth } from '../../../context/AuthContext';

export default function BuyerProfile() {
  const { currentBuyer } = useAuth();
  const b = currentBuyer || {};

  return (
    <>
      <div className="page-header"><h1>👤 My Profile</h1><p>Your buyer account details</p></div>
      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg,#1565C0,#42A5F5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff', fontWeight: 800 }}>
            {b.name?.charAt(0) || '?'}
          </div>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-head)' }}>{b.name}</h2>
            <span style={{ background: '#E3F2FD', color: '#1565C0', padding: '.2rem .6rem', borderRadius: '50px', fontSize: '.72rem', fontWeight: 700 }}>🆔 {b.id}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '.75rem', background: '#f8f8f8', borderRadius: '10px' }}><div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 600 }}>PHONE</div><b>📱 {b.phone}</b></div>
          <div style={{ padding: '.75rem', background: '#f8f8f8', borderRadius: '10px' }}><div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 600 }}>LOCATION</div><b>📍 {b.loc}</b></div>
          <div style={{ padding: '.75rem', background: '#f8f8f8', borderRadius: '10px' }}><div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 600 }}>BUSINESS</div><b>🏢 {b.businessName || 'N/A'}</b></div>
          <div style={{ padding: '.75rem', background: '#f8f8f8', borderRadius: '10px' }}><div style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 600 }}>TYPE</div><b>📋 {b.businessType || 'N/A'}</b></div>
        </div>
      </div>
    </>
  );
}
