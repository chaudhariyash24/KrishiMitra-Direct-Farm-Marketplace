import { useState, useRef, useEffect } from 'react';

const kmKB = {
  greetings: "Namaskar! 🙏 I'm KrushiMitra AI! I can help with market prices, loans, schemes, crop advice, and weather. What would you like to know today?",
  rules: [
    {keys:['msp','rate','price','bhav'], ans:'📊 Current MSP rates: Wheat ₹2,275/qtl, Rice ₹2,183/qtl, Soybean ₹4,600/qtl, Maize ₹1,870/qtl.'},
    {keys:['loan','kcc','credit','paise'], ans:'💰 Kisan Credit Card offers loans up to ₹3 lakh at 4% interest. Go to Loan section to apply!'},
    {keys:['weather','mausam','rain','temperature'], ans:'🌤️ Today: 28°C, Humidity 72%, Wind 12km/h. Good conditions for field work.'},
    {keys:['scheme','yojana','pm','government'], ans:'🏛️ Top schemes: PM-KISAN ₹6,000/year, PMFBY crop insurance, KCC credit. Check Schemes section!'},
    {keys:['sell','market','bech','bazaar'], ans:'🛒 Sell on KrushiMitra Marketplace! Zero commission. Check Marketplace section.'},
    {keys:['fertilizer','khad','urea'], ans:'🌱 Use Soil Health Card recommendations. Urea: 120 kg/ha for wheat. Balance NPK for better yield.'},
    {keys:['pest','disease','kit','rog'], ans:'🐛 Wheat Rust → Propiconazole. Rice Blast → Tricyclazole. Contact Krishi Kendra for free diagnosis.'},
    {keys:['organic','bio','natural'], ans:'🌿 PKVY scheme gives ₹50,000/ha for organic farming. Check Schemes section!'},
    {keys:['gi','geographical'], ans:'🔗 GI products get 20-30% premium prices. Check GI Tracker section!'},
    {keys:['helpline','help','contact'], ans:'📞 Kisan Call Centre: 1800-180-1551 (free). PM-KISAN: 155261. I\'m here 24/7!'},
    {keys:['hi','hello','namaskar','namaste'], ans:'Namaskar! 🙏 I\'m KrushiMitra AI. Ask me about loans, schemes, market prices, weather, or crops!'},
  ],
  fallback: "I'm not sure about that. Please call Kisan Helpline 1800-180-1551 (free) or ask about loans, schemes, crop prices, or weather!"
};

function getReply(q) {
  const low = q.toLowerCase();
  for (const rule of kmKB.rules) {
    if (rule.keys.some(k => low.includes(k))) return rule.ans;
  }
  return kmKB.fallback;
}

export default function ChatbotSection() {
  const [msgs, setMsgs] = useState([{ role: 'bot', text: kmKB.greetings }]);
  const [input, setInput] = useState('');
  const msgsRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMsgs(m => [...m, { role: 'user', text: q }]);
    setInput('');
    setTimeout(() => {
      setMsgs(m => [...m, { role: 'bot', text: getReply(q) }]);
    }, 600);
  };

  const quick = ['MSP rates?', 'Loan kaise milega?', 'Aaj ka mausam?', 'PM-KISAN scheme?', 'Sell crops?'];

  return (
    <>
      <div className="page-header"><h1>🤖 KrushiMitra AI Assistant</h1><p>Ask me anything about farming, schemes, or loans</p></div>
      <div className="card">
        <div className="chatbot-container">
          <div className="chatbot-messages" ref={msgsRef}>
            {msgs.map((m,i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <div className="avatar">{m.role === 'bot' ? '🤖' : '👤'}</div>
                <div className="bubble">{m.text}</div>
              </div>
            ))}
          </div>
          <div className="chatbot-quick">
            {quick.map((q,i) => <button key={i} className="quick-btn" onClick={() => { setInput(q); setTimeout(send, 50); }}>{q}</button>)}
          </div>
          <div className="chatbot-input">
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Type your question... (Hindi or English)" type="text"/>
            <button className="btn btn-green btn-sm" onClick={send}>Send</button>
          </div>
        </div>
      </div>
    </>
  );
}
