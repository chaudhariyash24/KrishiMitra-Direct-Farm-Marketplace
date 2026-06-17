import { useNavigate } from 'react-router-dom';
import FloatingChatbot from '../components/FloatingChatbot';

export default function Home() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="page active" id="page-home">
      <FloatingChatbot />
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">🌾 <span>Krushi</span>Mitra AI</div>
        <div className="nav-links">
          <a onClick={() => scrollToSection('about-section')} style={{cursor:'pointer'}}>About</a>
          <a onClick={() => scrollToSection('features-section')} style={{cursor:'pointer'}}>Features</a>
          <a className="btn btn-primary" onClick={() => navigate('/register')} style={{cursor:'pointer'}}>Login / Join</a>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <div className="tagline-badge">🇮🇳 India's #1 Agri Platform</div>
            <h1>Kisan se <span>Bazaar</span> tak – Sab kuch ek Setu par 🌾</h1>
            <p>KrushiMitra AI connects farmers directly to markets, government schemes, loans, and buyers — powered by Artificial Intelligence and designed for Bharat's kisans.</p>
            <div className="hero-btns">
              <button className="btn btn-primary" onClick={() => navigate('/register')}>🚀 Get Started</button>
              <button className="btn btn-outline" onClick={() => scrollToSection('about-section')} style={{color:'#fff',borderColor:'rgba(255,255,255,.5)'}}>Learn More ↓</button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card"><span className="icon">🌤️</span><div><h3>Live Weather Alerts</h3><p>Real-time weather updates for your region</p></div></div>
            <div className="hero-card"><span className="icon">💰</span><div><h3>Instant Loan Access</h3><p>Kisan Credit Card &amp; crop loan in minutes</p></div></div>
            <div className="hero-card"><span className="icon">🛒</span><div><h3>Direct Market Prices</h3><p>No middlemen – sell at fair MSP rates</p></div></div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-bar">
        <div className="stats-inner">
          <div className="stat-item"><div className="num">1.2L+</div><div className="lbl">Registered Farmers</div></div>
          <div className="stat-item"><div className="num">60+</div><div className="lbl">Crops Listed</div></div>
          <div className="stat-item"><div className="num">₹340Cr</div><div className="lbl">Loans Disbursed</div></div>
          <div className="stat-item"><div className="num">10+</div><div className="lbl">Govt Schemes</div></div>
          <div className="stat-item"><div className="num">28</div><div className="lbl">States Covered</div></div>
        </div>
      </div>

      {/* ABOUT */}
      <div className="section" id="about-section">
        <div className="section-title"><h2>🌱 How It Works</h2><p>Simple steps to transform your farming journey</p></div>
        <div className="steps-grid">
          <div className="step"><div className="step-num">1</div><h3>Register</h3><p>Create your Kisan profile with land &amp; crop details in 2 minutes</p></div>
          <div className="step"><div className="step-num">2</div><h3>Explore</h3><p>Access weather, market prices, and government schemes tailored for you</p></div>
          <div className="step"><div className="step-num">3</div><h3>Sell</h3><p>List your crops on the marketplace and connect with buyers directly</p></div>
          <div className="step"><div className="step-num">4</div><h3>Grow</h3><p>Apply for loans, government subsidies, and GI certification with one click</p></div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="section" id="features-section" style={{background:'var(--bg2)',borderRadius:'var(--radius)',padding:'3rem 2rem'}}>
        <div className="section-title"><h2>✨ Platform Features</h2><p>Everything a kisan needs, in one place</p></div>
        <div className="features-grid">
          <div className="feature-card"><div className="feature-icon">🛒</div><h3>Smart Marketplace</h3><p>60+ crops listed with real-time MSP prices. Buy and sell with zero commission.</p></div>
          <div className="feature-card"><div className="feature-icon">💰</div><h3>Loan System</h3><p>Apply for Kisan Credit Card, crop loans with instant EMI calculator and eligibility check.</p></div>
          <div className="feature-card"><div className="feature-icon">🏛️</div><h3>Scheme Finder</h3><p>10+ government schemes with eligibility checker. Apply with required documents listed.</p></div>
          <div className="feature-card"><div className="feature-icon">🌦️</div><h3>Weather Alerts</h3><p>7-day forecast, rainfall probability, and pest outbreak alerts for your district.</p></div>
          <div className="feature-card"><div className="feature-icon">🔗</div><h3>GI Tracker</h3><p>Track your product's Geographical Indication certification journey from farm to shelf.</p></div>
          <div className="feature-card"><div className="feature-icon">🤖</div><h3>AI Chatbot</h3><p>Ask questions in Hindi or English. Get advice on crops, schemes, and farming techniques.</p></div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section">
        <h2>🌾 Join 1.2 Lakh Kisans Today!</h2>
        <p>Start your journey to better income, fair prices, and modern farming.</p>
        <button className="btn btn-primary" onClick={() => navigate('/register')} style={{fontSize:'1.05rem',padding:'.8rem 2rem'}}>Register as Farmer →</button>
      </div>

      <footer>© 2025 KrushiMitra AI. Kisan se Bazaar tak – Sab kuch ek Setu par 🌾 | Built with ❤️ for Bharat's Kisans</footer>
    </div>
  );
}
