const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

// Models
const Price = require('../models/Price');
const Scheme = require('../models/Scheme');
const Product = require('../models/Product');
const Loan = require('../models/Loan');
const Weather = require('../models/Weather');
const GIProduct = require('../models/GIProduct');
const Order = require('../models/Order');
const Farmer = require('../models/Farmer');

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Fetch all relevant system data from MongoDB to use as AI context
 */
async function getSystemContext() {
  const [prices, schemes, products, loans, weather, giProducts, orders] = await Promise.all([
    Price.find().lean(),
    Scheme.find().lean(),
    Product.find().lean(),
    Loan.find().sort({ date: -1 }).limit(20).lean(),
    Weather.findOne().sort({ updatedAt: -1 }).lean(),
    GIProduct.find().lean(),
    Order.find().sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  // Build a structured context string
  let context = `=== KRUSHIMITRA SYSTEM DATA (LIVE FROM DATABASE) ===\n\n`;

  // --- Market Prices ---
  if (prices.length > 0) {
    context += `📊 MARKET PRICES (${prices.length} crops):\n`;
    prices.forEach(p => {
      context += `  • ${p.crop}: MSP ₹${p.msp}/qtl, Mandi ₹${p.mandi}/qtl, Change: ${p.change} ${p.trend}\n`;
    });
    context += '\n';
  }

  // --- Government Schemes ---
  if (schemes.length > 0) {
    context += `🏛️ GOVERNMENT SCHEMES (${schemes.length}):\n`;
    schemes.forEach(s => {
      context += `  • ${s.name}: ${s.benefit} | Eligibility: ${s.elig} | Status: ${s.status}\n`;
      context += `    Description: ${s.desc}\n`;
      context += `    Documents needed: ${s.docs.join(', ')}\n`;
    });
    context += '\n';
  }

  // --- Products on Marketplace ---
  if (products.length > 0) {
    context += `🛒 MARKETPLACE PRODUCTS (${products.length} listed):\n`;
    products.forEach(p => {
      context += `  • ${p.emoji} ${p.name}: ₹${p.price}/qtl, Qty: ${p.qty} qtl, Farmer: ${p.farmer}, Location: ${p.loc}, Category: ${p.cat}\n`;
    });
    context += '\n';
  } else {
    context += `🛒 MARKETPLACE: No products currently listed. Farmers can list their crops in the Products section.\n\n`;
  }

  // --- Loans ---
  if (loans.length > 0) {
    context += `💰 RECENT LOANS (${loans.length}):\n`;
    loans.forEach(l => {
      context += `  • Farmer: ${l.farmer}, Amount: ₹${l.amount}, Purpose: ${l.purpose}, Rate: ${l.rate}%, Duration: ${l.duration} months, Status: ${l.status}\n`;
    });
    context += '\n';
  }

  // --- Weather ---
  if (weather) {
    context += `🌤️ CURRENT WEATHER:\n`;
    context += `  Temperature: ${weather.temp}°C, Humidity: ${weather.humid}%, Wind: ${weather.wind} km/h, Rain: ${weather.rain}mm\n`;
    context += `  Condition: ${weather.cond}\n`;
    context += `  Advisory: ${weather.adv}\n\n`;
  }

  // --- GI Products ---
  if (giProducts.length > 0) {
    context += `🏷️ GI-TAGGED PRODUCTS (${giProducts.length}):\n`;
    giProducts.forEach(g => {
      context += `  • ${g.name}: Origin: ${g.origin}, State: ${g.state}, Status: ${g.status}, Journey: ${g.journey.join(' → ')}\n`;
    });
    context += '\n';
  }

  // --- Orders ---
  if (orders.length > 0) {
    context += `📦 RECENT ORDERS (${orders.length}):\n`;
    orders.forEach(o => {
      context += `  • Order ${o.orderId || 'N/A'}: ${o.productName}, Qty: ${o.qty}, ₹${o.totalAmount || o.price * o.qty}, Buyer: ${o.buyerName}, Seller: ${o.sellerName}, Status: ${o.status}\n`;
    });
    context += '\n';
  }

  return context;
}

/**
 * Build the system prompt for Gemini
 */
function buildSystemPrompt(systemData, lang) {
  const isHindi = lang === 'hi';

  return `You are KrushiMitra AI — an intelligent farming assistant for Indian farmers on the KrushiMitra platform.

YOUR ROLE:
- Answer farmer questions using ONLY the system data provided below
- Be helpful, warm, and practical
- Use emojis to make responses engaging
- Keep answers concise (2-4 sentences for simple queries, more for detailed queries)
- If asked about prices, schemes, weather, products, loans, GI products, or orders — use the EXACT data from below
- If asked about something not in the data, say you don't have that information and suggest checking the relevant section or calling Kisan Helpline 1800-180-1551
- You can do comparisons, calculations, and analysis on the data (e.g., "which crop has highest MSP?", "how many schemes are active?")
- ${isHindi ? 'Respond in Hindi (Devanagari script). Use simple Hindi that farmers understand.' : 'Respond in English. Use simple language that farmers understand.'}
- NEVER make up data. ONLY use what is provided below.
- Mention specific sections of the KrushiMitra app when relevant (e.g., "Check the Market Prices section", "Go to Schemes", "Visit Loan section")

NAVIGATION TAGS (IMPORTANT):
When the user asks about a topic that maps to a section in the app, you MUST include a navigation tag at the END of your response. This lets the app auto-navigate the user to the right page.
Format: [NAV:section_id:search_term]

Section mappings:
- Market prices / crop rates / MSP / mandi prices → [NAV:f-market:CropName] (use the crop name as search_term, e.g. [NAV:f-market:Wheat])
- Government schemes / yojana / PM-KISAN → [NAV:f-schemes:SchemeName]
- Weather / mausam / rain → [NAV:f-weather:]
- Loans / KCC / credit → [NAV:f-loan:]
- Marketplace / sell / buy crops → [NAV:f-marketplace:ProductName]
- GI products / geographical indication → [NAV:f-gi:]
- Transport / delivery / shipping → [NAV:f-transport:]
- Profile → [NAV:f-profile:]
- Overview / dashboard → [NAV:f-overview:]

Rules for NAV tags:
- ALWAYS include a NAV tag when the user asks about these topics
- Put the NAV tag on its OWN LINE at the very end of your response
- Use the most specific search term possible (e.g., the crop name, scheme name)
- If no specific search term, leave it empty after the colon: [NAV:f-weather:]
- Only ONE NAV tag per response
- The NAV tag will be hidden from the user and processed by the app

PLATFORM FEATURES TO REFERENCE:
- Market Prices: Live MSP and Mandi prices for crops
- Schemes: Government schemes with eligibility and benefits
- Marketplace: Buy/sell crops directly — zero commission
- Loans: KCC and agricultural loans
- Weather: Live weather updates and irrigation advisory
- GI Tracker: Geographical Indication tagged products
- Orders: Order tracking and transport booking
- Transport: Book vehicles for crop delivery

${systemData}

Remember: You are a helpful farming assistant. Be supportive and guide farmers to the right section of the app.`;
}

/**
 * POST /api/chatai
 * Body: { message: string, lang?: 'en' | 'hi', history?: [{role, text}] }
 */
router.post('/', async (req, res) => {
  try {
    const { message, lang = 'en', history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch live system data
    const systemData = await getSystemContext();

    // Build conversation history for context
    const contents = [];

    // Add recent history (last 10 messages for context window)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: buildSystemPrompt(systemData, lang),
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'Sorry, I could not generate a response. Please try again.';

    res.json({ reply, source: 'gemini-ai' });
  } catch (error) {
    console.error('ChatAI Error:', error.message);

    // Fallback message
    const fallback = req.body.lang === 'hi'
      ? 'माफ़ करें, AI सहायक अभी उपलब्ध नहीं है। कृपया किसान हेल्पलाइन 1800-180-1551 पर कॉल करें।'
      : 'Sorry, the AI assistant is currently unavailable. Please call Kisan Helpline 1800-180-1551 (toll-free).';

    res.status(500).json({ reply: fallback, error: error.message, source: 'fallback' });
  }
});

module.exports = router;
