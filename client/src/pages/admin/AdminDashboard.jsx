import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import Analytics from './sections/Analytics';
import FarmersList from './sections/FarmersList';
import MarketplaceAdmin from './sections/MarketplaceAdmin';
import SchemesAdmin from './sections/SchemesAdmin';

import WeatherAdmin from './sections/WeatherAdmin';
import GIAdmin from './sections/GIAdmin';
import ChatbotAdmin from './sections/ChatbotAdmin';
import PricesAdmin from './sections/PricesAdmin';
import TransportAdmin from './sections/TransportAdmin';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { adminUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('a-analytics');
  const [toastMsg, setToastMsg] = useState('');
  const [toastShow, setToastShow] = useState(false);

  const toast = (msg) => { setToastMsg(msg); setToastShow(true); };

  const navItems = [
    {id:'a-analytics',ico:'📊',label:'Analytics'},
    {id:'a-farmers',ico:'👨‍🌾',label:'Farmers'},
    {id:'a-marketplace',ico:'🛒',label:'Marketplace'},
    {id:'a-schemes',ico:'🏛️',label:'Schemes'},

    {id:'a-weather',ico:'🌤️',label:'Weather'},
    {id:'a-gi',ico:'🔗',label:'GI Products'},
    {id:'a-chatbot',ico:'🤖',label:'Chatbot Q&A'},
    {id:'a-prices',ico:'📈',label:'Market Prices'},
    {id:'a-transport',ico:'🚚',label:'Transport'},
  ];

  const sectionMap = {
    'a-analytics': <Analytics toast={toast} />,
    'a-farmers': <FarmersList toast={toast} />,
    'a-marketplace': <MarketplaceAdmin toast={toast} />,
    'a-schemes': <SchemesAdmin toast={toast} />,

    'a-weather': <WeatherAdmin toast={toast} />,
    'a-gi': <GIAdmin toast={toast} />,
    'a-chatbot': <ChatbotAdmin toast={toast} />,
    'a-prices': <PricesAdmin toast={toast} />,
    'a-transport': <TransportAdmin toast={toast} />,
  };

  return (
    <div className="page active" id="page-admin">
      <Toast message={toastMsg} show={toastShow} onHide={() => setToastShow(false)} />
      <nav className="nav" style={{background:'linear-gradient(135deg,#1a1a2e,#16213e)'}}>
        <div className="nav-logo">🏛️ <span>Admin</span> Portal</div>
        <div className="nav-links">
          <span style={{color:'#a5d6a7',fontWeight:700}}>{adminUser?.name || 'Admin'}</span>
          <a onClick={() => {logout();navigate('/');}} style={{color:'#ef9a9a',cursor:'pointer'}}>Logout</a>
        </div>
      </nav>
      <div className="dashboard">
        <div className="sidebar admin-sidebar">
          <div className="sidebar-brand" style={{background:'linear-gradient(135deg,#1a1a2e,#16213e)'}}><h3>🏛️ Admin Panel</h3><p>Management Portal</p></div>
          <div className="sidebar-menu">
            {navItems.map(item=>(
              <a key={item.id} className={activeSection===item.id?'active':''} onClick={()=>setActiveSection(item.id)} style={{cursor:'pointer'}}>
                <span className="ico">{item.ico}</span> {item.label}
              </a>
            ))}
          </div>
        </div>
        <div className="main-content">
          {Object.entries(sectionMap).map(([id,comp])=>(
            <div key={id} className={`dashboard-section${activeSection===id?' active':''}`}>
              {activeSection===id?comp:null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
