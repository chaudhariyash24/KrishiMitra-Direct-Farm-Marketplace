const express = require('express');
const router = express.Router();
const Price = require('../models/Price');

const CEDA_BASE = 'https://api.ceda.ashoka.edu.in/v1/agmarknet';
const CEDA_KEY = process.env.CEDA_API_KEY;
const cedaHeaders = () => ({ 'Authorization': `Bearer ${CEDA_KEY}`, 'Content-Type': 'application/json' });

// State name → CEDA census_state_id mapping
const stateIdMap = {
  'jammu & kashmir':1,'himachal pradesh':2,'punjab':3,'chandigarh':4,'uttarakhand':5,
  'haryana':6,'delhi':7,'nct of delhi':7,'rajasthan':8,'uttar pradesh':9,
  'bihar':10,'sikkim':11,'arunachal pradesh':12,'nagaland':13,'manipur':14,
  'mizoram':15,'tripura':16,'meghalaya':17,'assam':18,'west bengal':19,
  'jharkhand':20,'odisha':21,'chhattisgarh':22,'madhya pradesh':23,
  'gujarat':24,'daman & diu':25,'dadra & nagar haveli':26,'maharashtra':27,
  'andhra pradesh':28,'karnataka':29,'goa':30,'lakshadweep':31,
  'kerala':32,'tamil nadu':33,'puducherry':34,'andaman & nicobar':35,'telangana':36,
};

// Commodity name → CEDA commodity_id mapping
const commodityIdMap = {
  'wheat':1,'paddy':2,'rice':3,'maize':4,'jowar':5,
  'bengal gram':6,'chana':6,'red gram':7,'arhar':7,'tur':7,
  'urad':8,'black gram':8,'moong':9,'green gram':9,
  'groundnut':10,'sesame':11,'til':11,'mustard':12,'soybean':13,'soyabean':13,
  'sunflower':14,'cotton':15,'sugarcane':16,'jute':17,
  'onion':18,'potato':19,'tomato':20,'brinjal':21,'cauliflower':22,
  'cabbage':23,'lady finger':24,'okra':24,'bhindi':24,
  'banana':25,'mango':26,'apple':27,'grapes':28,'orange':29,
  'pomegranate':30,'guava':31,'papaya':32,'lemon':33,
  'turmeric':34,'chili':35,'chilli':35,'coriander':36,'cumin':37,'ginger':38,'garlic':39,
  'coconut':40,'arecanut':41,'cardamom':42,'pepper':43,'black pepper':43,
  'bajra':44,'ragi':45,'barley':46,
};

function resolveStateId(stateName) {
  if (!stateName) return 27; // default Maharashtra
  return stateIdMap[stateName.toLowerCase().trim()] || 27;
}

function resolveCommodityId(cropName) {
  if (!cropName) return 1; // default wheat
  const name = cropName.toLowerCase().replace(/\s*\(.*\)/, '').trim();
  return commodityIdMap[name] || commodityIdMap[name.split(' ')[0]] || 1;
}

// GET /api/prices  – returns DB prices (existing behavior)
router.get('/', async (req, res) => {
  try {
    const prices = await Price.find();
    res.json(prices);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/prices/live?commodity=wheat&state=Maharashtra&days=30
router.get('/live', async (req, res) => {
  try {
    const commodity = req.query.commodity || 'Wheat';
    const state = req.query.state || 'Maharashtra';
    const days = parseInt(req.query.days) || 30;

    const commodityId = resolveCommodityId(commodity);
    const stateId = resolveStateId(state);

    // CEDA data available up to ~mid 2025, use latest available window
    const latestDate = '2025-05-01';
    const from = new Date('2025-05-01');
    from.setDate(from.getDate() - days);

    const body = {
      commodity_id: commodityId,
      state_id: stateId,
      from_date: from.toISOString().split('T')[0],
      to_date: latestDate,
    };

    const resp = await fetch(`${CEDA_BASE}/prices`, {
      method: 'POST',
      headers: cedaHeaders(),
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      // Fallback to DB
      const dbPrices = await Price.find();
      return res.json({ source: 'db', data: dbPrices });
    }

    const result = await resp.json();
    const rawData = result.output?.data || [];

    // Process: get latest price + trend
    const processed = rawData.map(d => ({
      date: d.date,
      minPrice: Math.round(d.min_price),
      maxPrice: Math.round(d.max_price),
      modalPrice: Math.round(d.modal_price),
    }));

    // Calculate trend
    let trend = '→', change = '0%';
    if (processed.length >= 2) {
      const latest = processed[processed.length - 1].modalPrice;
      const prev = processed[0].modalPrice;
      const pctChange = ((latest - prev) / prev * 100).toFixed(1);
      trend = pctChange > 0 ? '📈' : pctChange < 0 ? '📉' : '→';
      change = (pctChange > 0 ? '+' : '') + pctChange + '%';
    }

    const latest = processed[processed.length - 1] || {};

    res.json({
      source: 'ceda',
      commodity,
      commodityId,
      state,
      stateId,
      latest: {
        date: latest.date,
        minPrice: latest.minPrice,
        maxPrice: latest.maxPrice,
        modalPrice: latest.modalPrice,
      },
      trend,
      change,
      history: processed,
      totalRecords: processed.length,
    });
  } catch (e) {
    // Fallback to DB
    try {
      const dbPrices = await Price.find();
      res.json({ source: 'db', data: dbPrices });
    } catch (e2) {
      res.status(500).json({ message: e.message });
    }
  }
});

// GET /api/prices/commodities – list available commodities from CEDA
router.get('/commodities', async (req, res) => {
  try {
    const resp = await fetch(`${CEDA_BASE}/commodities`, { headers: cedaHeaders() });
    const result = await resp.json();
    res.json(result.output?.data || []);
  } catch (e) { res.json(Object.keys(commodityIdMap).map(k => ({ name: k, id: commodityIdMap[k] }))); }
});

// Hardcoded fallback prices (latest known CEDA data)
const fallbackPrices = [
  {crop:'Wheat',mandi:2560,minPrice:2200,maxPrice:2900,trend:'📉',change:'-3.5%'},
  {crop:'Rice',mandi:3250,minPrice:2800,maxPrice:3600,trend:'→',change:'+0.2%'},
  {crop:'Maize',mandi:2100,minPrice:1800,maxPrice:2400,trend:'📉',change:'-1.5%'},
  {crop:'Onion',mandi:5500,minPrice:4000,maxPrice:7000,trend:'📈',change:'+8.3%'},
  {crop:'Potato',mandi:1500,minPrice:1200,maxPrice:1800,trend:'→',change:'+0.4%'},
  {crop:'Tomato',mandi:10155,minPrice:6000,maxPrice:14000,trend:'📈',change:'+18.8%'},
  {crop:'Soybean',mandi:4041,minPrice:3600,maxPrice:4500,trend:'📉',change:'-2.0%'},
  {crop:'Cotton',mandi:7442,minPrice:6800,maxPrice:8000,trend:'📈',change:'+0.6%'},
  {crop:'Chili',mandi:2154,minPrice:1800,maxPrice:2500,trend:'📈',change:'+16.5%'},
  {crop:'Turmeric',mandi:1735,minPrice:1400,maxPrice:2000,trend:'📈',change:'+15.3%'},
  {crop:'Groundnut',mandi:3500,minPrice:3000,maxPrice:4000,trend:'📉',change:'-5.9%'},
  {crop:'Mustard',mandi:6600,minPrice:5800,maxPrice:7200,trend:'📈',change:'+4.2%'},
  {crop:'Banana',mandi:7160,minPrice:5000,maxPrice:9000,trend:'📉',change:'-3.8%'},
  {crop:'Mango',mandi:9000,minPrice:6000,maxPrice:12000,trend:'📉',change:'-6.6%'},
  {crop:'Jowar',mandi:2451,minPrice:2100,maxPrice:2800,trend:'📉',change:'-5.7%'},
];

// GET /api/prices/multi – sequential CEDA requests with fallback
router.get('/multi', async (req, res) => {
  try {
    const state = req.query.state || 'Maharashtra';
    const days = parseInt(req.query.days) || 7;
    const stateId = resolveStateId(state);
    const toDate = '2025-05-01';
    const fromD = new Date('2025-05-01');
    fromD.setDate(fromD.getDate() - days);
    const fromDate = fromD.toISOString().split('T')[0];
    const keyCrops = [
      {name:'Wheat',id:1},{name:'Rice',id:3},{name:'Maize',id:4},{name:'Onion',id:18},
      {name:'Potato',id:19},{name:'Tomato',id:20},{name:'Soybean',id:13},{name:'Cotton',id:15},
      {name:'Chili',id:35},{name:'Turmeric',id:34},{name:'Groundnut',id:10},{name:'Mustard',id:12},
      {name:'Banana',id:25},{name:'Mango',id:26},{name:'Jowar',id:5},
    ];
    const liveData = [];
    for (const crop of keyCrops) {
      try {
        const resp = await fetch(`${CEDA_BASE}/prices`, {
          method:'POST', headers:cedaHeaders(),
          body:JSON.stringify({commodity_id:crop.id,state_id:stateId,from_date:fromDate,to_date:toDate}),
        });
        if (resp.status === 429) break;
        if (!resp.ok) continue;
        const result = await resp.json();
        const data = result.output?.data || [];
        if (!data.length) continue;
        const latest = data[data.length-1], first = data[0];
        const pct = first.modal_price ? ((latest.modal_price-first.modal_price)/first.modal_price*100).toFixed(1) : 0;
        liveData.push({
          crop:crop.name, mandi:Math.round(latest.modal_price),
          minPrice:Math.round(latest.min_price), maxPrice:Math.round(latest.max_price),
          trend:pct>0?'📈':pct<0?'📉':'→', change:(pct>0?'+':'')+pct+'%',
          date:latest.date, unit:'₹/qtl',
        });
        await new Promise(r => setTimeout(r, 300));
      } catch { continue; }
    }
    if (liveData.length > 0) {
      res.json({ source: 'ceda', state, data: liveData });
    } else {
      res.json({ source: 'cached', state, data: fallbackPrices });
    }
  } catch (e) {
    res.json({ source: 'cached', state: req.query.state || 'Maharashtra', data: fallbackPrices });
  }
});

// PUT /api/prices/:id (admin update – keeps existing)
router.put('/:id', async (req, res) => {
  try {
    const p = await Price.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    res.json(p);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ========== data.gov.in Integration ==========
const DATAGOV_API_KEY = process.env.DATAGOV_API_KEY || '579b464db66ec23bdd0000010d818f2f1320407d7a81d8462704af84';
const DATAGOV_RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070';
const DATAGOV_BASE = `https://api.data.gov.in/resource/${DATAGOV_RESOURCE}`;

// GET /api/prices/govdata?commodity=Potato&state=Punjab&limit=50
router.get('/govdata', async (req, res) => {
  try {
    const { commodity, state, limit = 50 } = req.query;
    let url = `${DATAGOV_BASE}?api-key=${DATAGOV_API_KEY}&format=json&limit=${limit}`;
    if (state) url += `&filters[state.keyword]=${encodeURIComponent(state)}`;
    if (commodity) url += `&filters[commodity]=${encodeURIComponent(commodity)}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error('data.gov.in API error');
    const result = await resp.json();

    const records = (result.records || []).map(r => ({
      state: r.state,
      district: r.district,
      market: r.market,
      commodity: r.commodity,
      variety: r.variety,
      grade: r.grade,
      arrival_date: r.arrival_date,
      min_price: Number(r.min_price),
      max_price: Number(r.max_price),
      modal_price: Number(r.modal_price),
    }));

    res.json({
      source: 'data.gov.in',
      total: result.total || records.length,
      count: records.length,
      records,
    });
  } catch (e) {
    console.error('data.gov.in fetch error:', e.message);
    res.status(500).json({ source: 'error', message: e.message, records: [] });
  }
});

// GET /api/prices/govdata/suggest?commodity=Onion&state=Maharashtra
router.get('/govdata/suggest', async (req, res) => {
  try {
    const { commodity, state } = req.query;
    if (!commodity) return res.status(400).json({ message: 'commodity is required' });

    let url = `${DATAGOV_BASE}?api-key=${DATAGOV_API_KEY}&format=json&limit=100&filters[commodity]=${encodeURIComponent(commodity)}`;
    if (state) url += `&filters[state.keyword]=${encodeURIComponent(state)}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error('data.gov.in API error');
    const result = await resp.json();
    const records = (result.records || []).map(r => ({
      state: r.state,
      district: r.district,
      market: r.market,
      commodity: r.commodity,
      variety: r.variety,
      arrival_date: r.arrival_date,
      min_price: Number(r.min_price),
      max_price: Number(r.max_price),
      modal_price: Number(r.modal_price),
    }));

    if (records.length === 0) {
      // Try without state filter as fallback
      const url2 = `${DATAGOV_BASE}?api-key=${DATAGOV_API_KEY}&format=json&limit=100&filters[commodity]=${encodeURIComponent(commodity)}`;
      const resp2 = await fetch(url2);
      if (resp2.ok) {
        const result2 = await resp2.json();
        const recs2 = (result2.records || []).map(r => ({
          state: r.state, district: r.district, market: r.market, commodity: r.commodity,
          variety: r.variety, arrival_date: r.arrival_date,
          min_price: Number(r.min_price), max_price: Number(r.max_price), modal_price: Number(r.modal_price),
        }));
        if (recs2.length > 0) {
          return res.json(buildSuggestion(recs2, commodity));
        }
      }
      return res.json({ source: 'data.gov.in', commodity, found: false, records: [], suggestion: null });
    }

    res.json(buildSuggestion(records, commodity));
  } catch (e) {
    console.error('data.gov.in suggest error:', e.message);
    res.status(500).json({ source: 'error', message: e.message });
  }
});

function buildSuggestion(records, commodity) {
  const modalPrices = records.map(r => r.modal_price).filter(p => p > 0);
  const minPrices = records.map(r => r.min_price).filter(p => p > 0);
  const maxPrices = records.map(r => r.max_price).filter(p => p > 0);

  const avgModal = Math.round(modalPrices.reduce((s, p) => s + p, 0) / modalPrices.length) || 0;
  const overallMin = Math.min(...minPrices) || 0;
  const overallMax = Math.max(...maxPrices) || 0;
  const suggestedPrice = Math.round(avgModal * 1.05); // 5% farmer margin

  return {
    source: 'data.gov.in',
    commodity,
    found: true,
    marketCount: records.length,
    avgModal,
    overallMin,
    overallMax,
    suggestedPrice,
    records,
  };
}

module.exports = router;
