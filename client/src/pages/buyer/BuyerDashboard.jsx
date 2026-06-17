import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import BuyerOverview from './sections/BuyerOverview';
import BuyerMarket from './sections/BuyerMarket';
import BuyerOrders from './sections/BuyerOrders';
import BuyerProfile from './sections/BuyerProfile';

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { currentBuyer, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('b-overview');
  const [toastMsg, setToastMsg] = useState('');
  const [toastShow, setToastShow] = useState(false);

  const toast = (msg) => { setToastMsg(msg); setToastShow(true); };

  const navItems = [
    { id: 'b-overview', ico: '📊', label: 'Overview' },
    { id: 'b-market', ico: '🛒', label: 'Browse Market' },
    { id: 'b-orders', ico: '📦', label: 'My Orders' },
    { id: 'b-profile', ico: '👤', label: 'My Profile' },
  ];

  const sectionMap = {
    'b-overview': <BuyerOverview toast={toast} />,
    'b-market': <BuyerMarket toast={toast} />,
    'b-orders': <BuyerOrders toast={toast} />,
    'b-profile': <BuyerProfile />,
  };

  return (
    <div className="page active" id="page-buyer">
      <Toast message={toastMsg} show={toastShow} onHide={() => setToastShow(false)} />

      <nav className="nav" style={{ background: 'linear-gradient(135deg,#0D47A1,#1565C0,#1976D2)' }}>
        <div className="nav-logo">🛒 <span>Buyer</span> Portal</div>
        <div className="nav-links">
          <span style={{ color: '#BBDEFB', fontWeight: 700 }}>{currentBuyer?.name}</span>
          <a onClick={() => { logout(); navigate('/'); }} style={{ color: '#90CAF9', cursor: 'pointer' }}>Logout</a>
        </div>
      </nav>

      <div className="dashboard">
        <div className="sidebar" style={{ background: 'linear-gradient(180deg,#0D47A1,#1565C0)' }}>
          <div className="sidebar-brand" style={{ background: 'linear-gradient(135deg,#0D47A1,#1565C0)' }}>
            <h3>🛒 KrushiMitra</h3><p>Buyer Portal</p>
          </div>
          <div className="sidebar-menu">
            {navItems.map(item => (
              <a key={item.id}
                className={activeSection === item.id ? 'active' : ''}
                onClick={() => setActiveSection(item.id)}
                style={{ cursor: 'pointer' }}>
                <span className="ico">{item.ico}</span> {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="main-content">
          {Object.entries(sectionMap).map(([id, comp]) => (
            <div key={id} className={`dashboard-section${activeSection === id ? ' active' : ''}`}>
              {activeSection === id ? comp : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
