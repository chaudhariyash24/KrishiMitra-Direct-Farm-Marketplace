/**
 * Auto-seed: Populates reference data (schemes, prices, GI, chatbot, weather)
 * on first run. Does NOT create products or accounts — those are user-created.
 * Called automatically from index.js on server start.
 */
const Scheme = require('./models/Scheme');
const GIProduct = require('./models/GIProduct');
const ChatQA = require('./models/ChatQA');
const Price = require('./models/Price');
const Weather = require('./models/Weather');

const schemes = [
  { name: 'PM-KISAN Samman Nidhi', benefit: '₹6,000/year (₹2,000 per installment)', elig: 'Land <2 hectares, Small & Marginal Farmer', desc: 'Direct income support of ₹6,000/year to landholding farmer families. Credited directly to bank accounts.', docs: ['Aadhaar Card', 'Bank Passbook', 'Land Record (7/12)'], status: 'Active' },
  { name: 'Pradhan Mantri Fasal Bima Yojana', benefit: 'Crop insurance up to ₹2 Lakh', elig: 'All farmers growing notified crops', desc: 'Comprehensive crop insurance against natural calamities, pests & diseases. Low premium rates for farmers.', docs: ['Aadhaar', 'Land Record', 'Bank Account', 'Sowing Certificate'], status: 'Active' },
  { name: 'Kisan Credit Card (KCC)', benefit: 'Credit up to ₹3 Lakh at 4% interest', elig: 'All farmers, fishermen, SHGs', desc: 'Provides timely credit for agricultural needs. Interest subvention available.', docs: ['Aadhaar', 'PAN Card', 'Land Record', 'Passport Photo'], status: 'Active' },
  { name: 'PM Krishi Sinchai Yojana', benefit: '75-90% subsidy on irrigation', elig: 'Farmers with land ownership', desc: 'Promotes micro-irrigation. 75% subsidy for small & marginal farmers on drip/sprinkler systems.', docs: ['Land Record', 'Aadhaar', 'Bank Account', 'Soil Health Card'], status: 'Active' },
  { name: 'Soil Health Card Scheme', benefit: 'Free soil testing & advisory', elig: 'All farmers', desc: 'Free soil health card with crop-wise nutrient recommendations every 2 years.', docs: ['Aadhaar', 'Land Record'], status: 'Active' },
  { name: 'e-NAM (National Agriculture Market)', benefit: 'Direct market access, better prices', elig: 'All farmers with produce', desc: 'Online trading platform connecting farmers directly to buyers across India.', docs: ['Aadhaar', 'Bank Account', 'Mandi Registration'], status: 'Active' },
  { name: 'Rashtriya Krishi Vikas Yojana', benefit: 'Project-based funding up to ₹25 Lakh', elig: 'Farmer groups, FPOs with 5+ acres', desc: 'Grants for cold storage, processing units, farm ponds.', docs: ['Land Record', 'Group Registration', 'Project Proposal', 'Bank Account'], status: 'Active' },
  { name: 'PM Kisan Maandhan Yojana', benefit: '₹3,000/month pension after 60', elig: 'Small farmers, age 18-40', desc: 'Voluntary old-age pension. Contribute ₹55-200/month, get ₹3,000/month after 60.', docs: ['Aadhaar', 'Bank Account', 'Land Record', 'Age Proof'], status: 'Active' },
  { name: 'Paramparagat Krishi Vikas Yojana', benefit: '₹50,000/ha over 3 years', elig: 'Farmers willing to go organic', desc: 'Promotes organic farming through cluster approach. ₹50,000/hectare support.', docs: ['Land Record', 'Aadhaar', 'Cluster Group Registration'], status: 'Active' },
  { name: 'Agriculture Infrastructure Fund', benefit: 'Loans up to ₹2 Cr at 3% less', elig: 'Farmers, FPOs, Cooperatives', desc: 'Debt financing for post-harvest management and community farming assets.', docs: ['Business Plan', 'Land Record', 'Bank Account', 'Registration Cert'], status: 'Active' },
  { name: 'National Mission on Oilseeds', benefit: '50-75% subsidy on seeds', elig: 'Farmers growing oilseed crops', desc: 'Promotes oilseed production through quality seed distribution.', docs: ['Land Record', 'Aadhaar', 'Crop Declaration'], status: 'Active' },
];

const giProducts = [
  { name: 'Alphonso Mango', origin: 'Ratnagiri, Maharashtra', state: 'Maharashtra', farmer: 'GI Registry', journey: ['Picked', 'Graded', 'Certified', 'Packed', 'Market'], status: 'Verified' },
  { name: 'Darjeeling Tea', origin: 'Darjeeling, West Bengal', state: 'West Bengal', farmer: 'GI Registry', journey: ['Plucked', 'Processed', 'Tested', 'Certified', 'Export'], status: 'Verified' },
  { name: 'Nashik Grapes', origin: 'Nashik, Maharashtra', state: 'Maharashtra', farmer: 'GI Registry', journey: ['Harvested', 'Graded', 'Certified', 'Packed'], status: 'Verified' },
  { name: 'Kolhapur Jaggery', origin: 'Kolhapur, Maharashtra', state: 'Maharashtra', farmer: 'GI Registry', journey: ['Cane Harvested', 'Crushed', 'Boiled', 'Molded', 'Certified'], status: 'Verified' },
  { name: 'Solapur Pomegranate', origin: 'Solapur, Maharashtra', state: 'Maharashtra', farmer: 'GI Registry', journey: ['Picked', 'Sorted', 'Certified', 'Packed'], status: 'Pending' },
  { name: 'Lucknow Dussehri Mango', origin: 'Lucknow, UP', state: 'Uttar Pradesh', farmer: 'GI Registry', journey: ['Harvested', 'Certified', 'Packed', 'Market'], status: 'Verified' },
  { name: 'Nagpur Orange', origin: 'Nagpur, Maharashtra', state: 'Maharashtra', farmer: 'GI Registry', journey: ['Picked', 'Sorted', 'Tested', 'Certified'], status: 'Verified' },
  { name: 'Kashmiri Saffron', origin: 'Pampore, J&K', state: 'J&K', farmer: 'GI Registry', journey: ['Grown', 'Handpicked', 'Dried', 'Graded', 'Certified'], status: 'Verified' },
];

const chatQAs = [
  { keywords: ['msp', 'rate', 'price', 'bhav'], answer: 'Current MSP rates: Wheat ₹2,275/qtl, Rice ₹2,183/qtl, Soybean ₹4,600/qtl, Maize ₹1,870/qtl.' },
  { keywords: ['loan', 'kcc', 'credit', 'paise'], answer: 'KCC offers loans up to ₹3 lakh at 4% interest. Apply through Loan section.' },
  { keywords: ['weather', 'mausam', 'rain'], answer: 'Check Weather section for live updates and irrigation advisory.' },
  { keywords: ['scheme', 'yojana', 'pm', 'government'], answer: 'Top schemes: PM-KISAN ₹6,000/yr, PMFBY crop insurance, KCC credit. Go to Schemes!' },
  { keywords: ['sell', 'market', 'bech', 'bazaar'], answer: 'List crops on KrushiMitra Marketplace – no commission, no middlemen.' },
  { keywords: ['fertilizer', 'khad', 'urea'], answer: 'Use Soil Health Card recommendations. Wheat: 120 kg/ha urea.' },
  { keywords: ['soil', 'mitti', 'test'], answer: 'Get free Soil Health Card under government scheme.' },
  { keywords: ['insurance', 'bima', 'fasal'], answer: 'PMFBY: Rabi 1.5%, Kharif 2% premium. Covers natural disasters.' },
  { keywords: ['organic', 'jaivik', 'bio'], answer: 'PKVY: ₹50,000/ha for organic farming. Check Schemes!' },
  { keywords: ['gi', 'origin', 'brand'], answer: 'GI products get premium prices. Check GI Tracker section.' },
  { keywords: ['pest', 'disease', 'rog', 'keeda'], answer: 'Wheat rust→Propiconazole. Rice blast→Tricyclazole. Cotton→Neem spray.' },
  { keywords: ['hi', 'hello', 'namaskar', 'help'], answer: 'Namaskar! 🙏 I can help with prices, loans, schemes, weather & crops!' },
];

const prices = [
  { crop: 'Wheat (गेहूं)', msp: 2275, mandi: 2310, change: '+1.5%', trend: '📈' },
  { crop: 'Rice (धान)', msp: 2183, mandi: 2150, change: '-1.5%', trend: '📉' },
  { crop: 'Soybean (सोयाबीन)', msp: 4600, mandi: 4720, change: '+2.6%', trend: '📈' },
  { crop: 'Maize (मक्का)', msp: 1870, mandi: 1900, change: '+1.6%', trend: '📈' },
  { crop: 'Cotton (कपास)', msp: 6620, mandi: 6580, change: '-0.6%', trend: '📉' },
  { crop: 'Sugarcane (गन्ना)', msp: 3200, mandi: 3250, change: '+1.6%', trend: '📈' },
  { crop: 'Arhar Dal', msp: 7000, mandi: 7200, change: '+2.9%', trend: '📈' },
  { crop: 'Urad Dal', msp: 6800, mandi: 6750, change: '-0.7%', trend: '📉' },
  { crop: 'Mustard (सरसों)', msp: 5650, mandi: 5800, change: '+2.7%', trend: '📈' },
  { crop: 'Groundnut (मूंगफली)', msp: 5550, mandi: 5620, change: '+1.3%', trend: '📈' },
  { crop: 'Onion (प्याज)', msp: 1500, mandi: 2200, change: '+46.7%', trend: '🔥' },
  { crop: 'Tomato (टमाटर)', msp: 800, mandi: 1800, change: '+125%', trend: '🔥' },
  { crop: 'Potato (आलू)', msp: 600, mandi: 1200, change: '+100%', trend: '🔥' },
  { crop: 'Chana (ग्राम)', msp: 5440, mandi: 5380, change: '-1.1%', trend: '📉' },
  { crop: 'Bajra (बाजरा)', msp: 2500, mandi: 2480, change: '-0.8%', trend: '📉' },
];

async function autoSeed() {
  try {
    // Only seed if data is empty (first run on new device)
    const schemeCount = await Scheme.countDocuments();
    if (schemeCount > 0) {
      console.log('📦 Data already exists, skipping auto-seed');
      return;
    }

    console.log('🌱 First run detected — seeding reference data...');

    await Scheme.insertMany(schemes);
    console.log('  ✅ Schemes:', schemes.length);

    await GIProduct.insertMany(giProducts);
    console.log('  ✅ GI Products:', giProducts.length);

    await ChatQA.insertMany(chatQAs);
    console.log('  ✅ ChatQA:', chatQAs.length);

    await Price.insertMany(prices);
    console.log('  ✅ Prices:', prices.length);

    await Weather.create({ temp: 28, humid: 72, wind: 12, rain: 3, cond: '⛅ Partly Cloudy', adv: 'Good day for irrigation. Avoid pesticide spraying.' });
    console.log('  ✅ Weather');

    console.log('🎉 Auto-seed complete!');
  } catch (err) {
    console.error('Auto-seed error:', err.message);
  }
}

module.exports = autoSeed;
