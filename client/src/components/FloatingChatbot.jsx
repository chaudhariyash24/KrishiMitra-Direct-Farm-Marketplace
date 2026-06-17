import { useState, useRef, useEffect } from 'react';
import API from '../api/axios';

const quickSuggestions = {
  en: ['Market prices?', 'KCC loan info?', 'Weather update?', 'PM-KISAN details?', 'Sell crops?', 'Pest control tips'],
  hi: ['बाजार भाव?', 'KCC लोन?', 'मौसम अपडेट?', 'PM-KISAN जानकारी?', 'फसल बेचें?', 'कीट नियंत्रण']
};

const greetings = {
  en: "Namaskar! 🙏 I'm KrushiMitra AI — your intelligent farming assistant powered by AI! I can look up live market prices, schemes, weather, loans and everything in your system. Ask me anything!",
  hi: "नमस्कार! 🙏 मैं कृषिमित्र AI हूँ — आपका बुद्धिमान AI खेती सहायक! मैं आपके सिस्टम से लाइव बाजार भाव, योजनाएं, मौसम, लोन सब देख सकता हूँ। कुछ भी पूछें!"
};

// Maps section IDs to readable labels & icons
const sectionLabels = {
  'f-market': { label: 'Market Prices', labelHi: 'बाजार भाव', icon: '📈' },
  'f-schemes': { label: 'Schemes', labelHi: 'योजनाएं', icon: '🏛️' },
  'f-weather': { label: 'Weather', labelHi: 'मौसम', icon: '🌤️' },
  'f-loan': { label: 'Loans', labelHi: 'लोन', icon: '💰' },
  'f-marketplace': { label: 'Marketplace', labelHi: 'मार्केटप्लेस', icon: '🛒' },
  'f-gi': { label: 'GI Tracker', labelHi: 'GI ट्रैकर', icon: '🔗' },
  'f-transport': { label: 'Transport', labelHi: 'परिवहन', icon: '🚚' },
  'f-profile': { label: 'Profile', labelHi: 'प्रोफाइल', icon: '👤' },
  'f-overview': { label: 'Overview', labelHi: 'अवलोकन', icon: '📊' },
  'f-chatbot': { label: 'AI Chatbot', labelHi: 'AI चैटबॉट', icon: '🤖' },
};

/**
 * Parse [NAV:section:search] tag from AI response
 * Returns { cleanText, navSection, navSearch } or null for nav
 */
function parseNavTag(text) {
  const navRegex = /\[NAV:([a-z\-]+):([^\]]*)\]/i;
  const match = text.match(navRegex);
  if (match) {
    return {
      cleanText: text.replace(navRegex, '').trim(),
      navSection: match[1],
      navSearch: match[2] || '',
    };
  }
  return { cleanText: text, navSection: null, navSearch: '' };
}

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [inited, setInited] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const msgsRef = useRef(null);
  const recognitionRef = useRef(null);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !inited) {
      setInited(true);
      const g = greetings[lang];
      setMsgs([{ role: 'bot', text: g }]);
      if (ttsEnabled) speak(g);
    }
  };

  const switchLang = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    const g = greetings[next];
    setMsgs(m => [...m, { role: 'bot', text: `🌐 ${next === 'hi' ? 'हिंदी में बदला गया' : 'Switched to English'}. ${g}` }]);
    if (ttsEnabled) speak(g, next);
  };

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs]);

  const speak = (text, forceLang) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[📊💰🌤️🏛️🛒🌱🐛🌿🙏🚚🌾💧✅❌⚠️🌐🤖⏳🔊🔇]/g, '').trim();
    const utter = new SpeechSynthesisUtterance(clean);
    const l = forceLang || lang;
    utter.lang = l === 'hi' ? 'hi-IN' : 'en-IN';
    utter.rate = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang === utter.lang) || voices.find(v => v.lang.startsWith(l === 'hi' ? 'hi' : 'en'));
    if (v) utter.voice = v;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => { window.speechSynthesis.cancel(); setSpeaking(false); };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported. Try Chrome!'); return; }
    const recognition = new SR();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      // Send the voice input to AI
      handleSend(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => { if (recognitionRef.current) recognitionRef.current.stop(); setListening(false); };

  /**
   * Navigate to a dashboard section and optionally set a search term
   */
  const navigateToSection = (section, searchTerm) => {
    // Use global functions exposed by FarmerDashboard
    if (window.__setActiveSection) {
      window.__setActiveSection(section);
    }
    if (searchTerm && window.__setSectionSearch) {
      window.__setSectionSearch(section, searchTerm);
    }
    // Close the chatbot panel after navigation
    setOpen(false);
  };

  /**
   * Send message to Gemini AI via backend
   */
  const handleSend = async (overrideText) => {
    const q = (overrideText || input).trim();
    if (!q || loading) return;

    // Add user message
    const userMsg = { role: 'user', text: q };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Add typing indicator
    setMsgs(prev => [...prev, { role: 'bot', text: '⏳', isTyping: true }]);

    try {
      // Build history for context (exclude typing indicators)
      const history = msgs
        .filter(m => !m.isTyping)
        .map(m => ({ role: m.role === 'bot' ? 'model' : 'user', text: m.text }));

      const { data } = await API.post('/chatai', {
        message: q,
        lang,
        history,
      });

      const rawReply = data.reply;

      // Parse navigation tag from AI response
      const { cleanText, navSection, navSearch } = parseNavTag(rawReply);

      // Replace typing indicator with actual response
      setMsgs(prev => {
        const filtered = prev.filter(m => !m.isTyping);
        return [...filtered, {
          role: 'bot',
          text: cleanText,
          navSection,
          navSearch,
        }];
      });

      if (ttsEnabled) speak(cleanText);
    } catch (err) {
      console.error('Chat AI error:', err);
      const fallback = lang === 'hi'
        ? 'माफ़ करें, AI से जवाब नहीं मिल सका। कृपया फिर से कोशिश करें।'
        : 'Sorry, could not get a response from AI. Please try again.';

      setMsgs(prev => {
        const filtered = prev.filter(m => !m.isTyping);
        return [...filtered, { role: 'bot', text: fallback }];
      });
    } finally {
      setLoading(false);
    }
  };

  const send = () => handleSend();

  return (
    <>
      <button className={`km-fab${open ? ' open' : ''}`} id="km-fab" onClick={toggle}>{open ? '✕' : '🌾'}</button>
      <div className={`km-panel${open ? ' open' : ''}`} id="km-panel">
        <div className="km-header">
          <div className="km-hdr-top" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <div className="km-hdr-avatar">🌾</div>
              <div><div className="km-hdr-title">KrushiMitra AI</div><div className="km-hdr-sub">{lang === 'hi' ? '🤖 AI-संचालित सहायक' : '🤖 AI-Powered Assistant'} {speaking && '🔊'}</div></div>
            </div>
            <div style={{ display: 'flex', gap: '.3rem' }}>
              <button onClick={switchLang} style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: '6px', padding: '.2rem .5rem', cursor: 'pointer', fontSize: '.72rem', fontWeight: 800 }} title="Switch language">
                {lang === 'en' ? 'हिं' : 'EN'}
              </button>
              <button onClick={() => setTtsEnabled(!ttsEnabled)} style={{ background: ttsEnabled ? 'rgba(255,255,255,.2)' : 'rgba(255,0,0,.3)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={ttsEnabled ? 'Mute' : 'Unmute'}>
                {ttsEnabled ? '🔊' : '🔇'}
              </button>
            </div>
          </div>
        </div>
        <div className="km-messages" id="km-messages" ref={msgsRef}>
          {msgs.map((m, i) => (
            <div key={i} className={`km-msg km-${m.role}`}>
              <div className="km-av">{m.role === 'bot' ? '🌾' : '👤'}</div>
              <div className={`km-bubble${m.isTyping ? ' km-typing' : ''}`}>
                {m.isTyping ? (
                  <div className="km-dots">
                    <span className="km-dot"></span>
                    <span className="km-dot"></span>
                    <span className="km-dot"></span>
                  </div>
                ) : (
                  <>
                    <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.text}</div>
                    {/* Navigation action button */}
                    {m.role === 'bot' && m.navSection && sectionLabels[m.navSection] && (
                      <button
                        className="km-nav-btn"
                        onClick={() => navigateToSection(m.navSection, m.navSearch)}
                        title={lang === 'hi' ? `${sectionLabels[m.navSection].labelHi} पर जाएं` : `Go to ${sectionLabels[m.navSection].label}`}
                      >
                        {sectionLabels[m.navSection].icon} {lang === 'hi' ? `${sectionLabels[m.navSection].labelHi} खोलें` : `Open ${sectionLabels[m.navSection].label}`}
                        {m.navSearch && <span className="km-nav-search-tag">{m.navSearch}</span>}
                        <span style={{ marginLeft: 'auto', fontSize: '.75rem' }}>→</span>
                      </button>
                    )}
                    {m.role === 'bot' && (
                      <button onClick={() => speaking ? stopSpeaking() : speak(m.text)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.75rem', marginLeft: '.4rem', opacity: .6 }} title={lang === 'hi' ? 'सुनें' : 'Read aloud'}>
                        {speaking ? '⏹️' : '🔈'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <div id="km-suggested" className="km-suggested">
          {quickSuggestions[lang].map((s, i) => (
            <button key={i} className="km-sug-btn" onClick={() => {
              if (!loading) handleSend(s);
            }}>{s}</button>
          ))}
        </div>
        <div className="km-input-bar" style={{ flexDirection: 'column', gap: 0 }}>
          {speaking && (
            <button onClick={stopSpeaking} style={{ width: '100%', padding: '.5rem', background: '#FFEBEE', color: '#C62828', border: 'none', borderBottom: '1px solid #FFCDD2', cursor: 'pointer', fontWeight: 800, fontSize: '.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem' }}>
              ⏹️ {lang === 'hi' ? 'पढ़ना बंद करें' : 'Stop Reading'}
            </button>
          )}
          <div style={{ display: 'flex', gap: '.4rem', width: '100%', padding: '.5rem .6rem', alignItems: 'center' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder={loading ? (lang === 'hi' ? '⏳ सोच रहा हूँ...' : '⏳ Thinking...') : listening ? '🎤 ...' : lang === 'hi' ? 'कुछ भी पूछें...' : 'Ask me anything...'} type="text" id="km-input" disabled={loading} style={listening ? { borderColor: '#E53935', background: '#FFF5F5', flex: 1 } : { flex: 1 }} />
            <button className={`km-mic-btn${listening ? ' listening' : ''}`} onClick={listening ? stopListening : startListening} title={listening ? 'Stop' : lang === 'hi' ? 'बोलें' : 'Speak'} disabled={loading} style={listening ? { background: '#E53935', borderColor: '#E53935', color: '#fff' } : {}}>🎤</button>
            <button className="km-send" onClick={send} disabled={loading}>{loading ? '⏳' : '➤'}</button>
          </div>
        </div>
      </div>
    </>
  );
}
