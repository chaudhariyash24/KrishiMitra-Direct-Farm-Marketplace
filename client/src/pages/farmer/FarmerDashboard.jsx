import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import FloatingChatbot from '../../components/FloatingChatbot';
import GovPortal from '../../components/GovPortal';

// Section imports
import Overview from './sections/Overview';
import Profile from './sections/Profile';
import Weather from './sections/Weather';
import MarketPrices from './sections/MarketPrices';
import Marketplace from './sections/Marketplace';
import Schemes from './sections/Schemes';

import Transport from './sections/Transport';
import BookTruck from './sections/BookTruck';
import ChatbotSection from './sections/ChatbotSection';

export const ToastContext = { show: null };

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const { currentFarmer, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('f-overview');
  const [toastMsg, setToastMsg] = useState('');
  const [toastShow, setToastShow] = useState(false);
  const [govPortalOpen, setGovPortalOpen] = useState(false);
  const [govScheme, setGovScheme] = useState(null);

  // Search terms for sections (set by chatbot auto-navigation)
  const [sectionSearch, setSectionSearch] = useState({});

  const toast = (msg) => {
    setToastMsg(msg);
    setToastShow(true);
  };
  window.__toast = toast;
  window.__openGovPortal = (scheme) => { setGovScheme(scheme); setGovPortalOpen(true); };

  // Expose navigation functions globally for FloatingChatbot
  window.__setActiveSection = useCallback((section) => {
    setActiveSection(section);
  }, []);

  window.__setSectionSearch = useCallback((section, searchTerm) => {
    setSectionSearch(prev => ({ ...prev, [section]: searchTerm }));
  }, []);

  // Clear search term when user manually navigates away
  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
  };

  const navItems = [
    { id: 'f-overview', ico: '📊', label: 'Overview' },
    { id: 'f-profile', ico: '👤', label: 'My Profile' },
    { id: 'f-weather', ico: '🌤️', label: 'Weather' },
    { id: 'f-market', ico: '📈', label: 'Market Prices' },
    { id: 'f-marketplace', ico: '🛒', label: 'Marketplace' },
    { id: 'f-schemes', ico: '🏛️', label: 'Schemes' },

    { id: 'f-chatbot', ico: '🤖', label: 'AI Chatbot' },
  ];

  const sectionMap = {
    'f-overview': <Overview toast={toast} />,
    'f-profile': <Profile />,
    'f-weather': <Weather />,
    'f-market': <MarketPrices initialSearch={sectionSearch['f-market'] || ''} />,
    'f-marketplace': <Marketplace toast={toast} />,
    'f-schemes': <Schemes toast={toast} />,

    'f-chatbot': <ChatbotSection />,
    'f-transport': <Transport toast={toast} />,
    'f-booktruck': <BookTruck toast={toast} />,
  };

  return (
    <div className="page active" id="page-farmer">
      <FloatingChatbot />
      <Toast message={toastMsg} show={toastShow} onHide={() => setToastShow(false)} />
      {govPortalOpen && <GovPortal scheme={govScheme} onClose={() => setGovPortalOpen(false)} toast={toast} />}

      <nav className="nav">
        <div className="nav-logo">🌾 <span>Krushi</span>Mitra AI</div>
        <div className="nav-links">
          <span id="farmer-nav-name" style={{color:'#a5d6a7',fontWeight:'700'}}>{currentFarmer?.name}</span>
          <a onClick={() => { logout(); navigate('/'); }} style={{color:'#c8e6c9',cursor:'pointer'}}>Logout</a>
        </div>
      </nav>

      <div className="dashboard">
        <div className="sidebar">
          <div className="sidebar-brand"><h3>🌾 KrushiMitra</h3><p>Farmer Portal</p></div>
          <div className="sidebar-menu">
            {navItems.map(item => (
              <a key={item.id}
                className={activeSection === item.id ? 'active' : ''}
                onClick={() => handleNavClick(item.id)}
                style={{cursor:'pointer'}}>
                <span className="ico">{item.ico}</span> {item.label}
              </a>
            ))}
            <div className="sidebar-section-title">Logistics</div>
            <a className={activeSection === 'f-transport' ? 'active' : ''} onClick={() => handleNavClick('f-transport')} style={{cursor:'pointer'}}>
              <span className="ico">📦</span> Orders
            </a>
            <a className={activeSection === 'f-booktruck' ? 'active' : ''} onClick={() => handleNavClick('f-booktruck')} style={{cursor:'pointer'}}>
              <span className="ico">🚛</span> Book Truck
            </a>
          </div>
        </div>

        <div className="main-content">
          {Object.entries(sectionMap).map(([id, comp]) => (
            <div key={id} className={`dashboard-section${activeSection === id ? ' active' : ''}`} id={id}>
              {activeSection === id ? comp : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
