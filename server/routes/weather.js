const express = require('express');
const router = express.Router();
const Weather = require('../models/Weather');

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = 'https://api.weatherapi.com/v1';

// Common Indian city name alternates for WeatherAPI compatibility
const cityAliases = {
  'nashik':'Nasik','bengaluru':'Bangalore','mysuru':'Mysore','belagavi':'Belgaum',
  'kochi':'Cochin','kozhikode':'Calicut','thiruvananthapuram':'Trivandrum',
  'varanasi':'Benaras','prayagraj':'Allahabad','gurugram':'Gurgaon',
  'hubli':'Hubli-Dharwad','mangaluru':'Mangalore','puducherry':'Pondicherry',
  'shimoga':'Shivamogga','tumkur':'Tumakuru','bellary':'Ballari',
  'gulbarga':'Kalaburagi','rajahmundry':'Rajamahendravaram',
};

function resolveCity(city) {
  const key = city.toLowerCase().trim();
  return cityAliases[key] || city;
}

async function fetchWeather(city) {
  const resolved = resolveCity(city);
  const url = `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(resolved)}&days=7&aqi=no`;
  const resp = await fetch(url);
  if (resp.ok) return await resp.json();
  // If resolved name didn't work and it was different from original, try original
  if (resolved !== city) {
    const url2 = `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&days=7&aqi=no`;
    const resp2 = await fetch(url2);
    if (resp2.ok) return await resp2.json();
  }
  return null;
}

// GET /api/weather?city=Nashik  (live weather + 7-day forecast)
router.get('/', async (req, res) => {
  try {
    const city = req.query.city || 'Mumbai';
    const data = await fetchWeather(city);

    if (!data) {
      // Fallback to DB
      let w = await Weather.findOne();
      if (!w) w = await Weather.create({});
      return res.json({ source: 'db', current: { temp: w.temp, humid: w.humid, wind: w.wind, rain: w.rain, condition: w.cond }, forecast: [], advisory: { sowing: w.adv, irrigation: '', pest: '', harvest: '' } });
    }

    const current = data.current;
    const location = data.location;
    const forecast = data.forecast.forecastday.map((day, i) => ({
      date: day.date,
      day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      maxTemp: day.day.maxtemp_c,
      minTemp: day.day.mintemp_c,
      avgTemp: day.day.avgtemp_c,
      humidity: day.day.avghumidity,
      wind: day.day.maxwind_kph,
      rain: day.day.totalprecip_mm,
      rainChance: day.day.daily_chance_of_rain,
      condition: day.day.condition.text,
      icon: day.day.condition.icon,
      uv: day.day.uv,
      sunrise: day.astro.sunrise,
      sunset: day.astro.sunset,
    }));

    // Generate farming advisory based on real data
    const advisory = generateAdvisory(current, forecast);

    res.json({
      source: 'live',
      location: {
        name: location.name,
        region: location.region,
        country: location.country,
        localtime: location.localtime,
      },
      current: {
        temp: current.temp_c,
        feelslike: current.feelslike_c,
        humid: current.humidity,
        wind: current.wind_kph,
        windDir: current.wind_dir,
        rain: current.precip_mm,
        cloud: current.cloud,
        uv: current.uv,
        condition: current.condition.text,
        icon: current.condition.icon,
      },
      forecast,
      advisory,
    });
  } catch (e) {
    // Fallback to DB
    try {
      let w = await Weather.findOne();
      if (!w) w = await Weather.create({});
      res.json({ source: 'db', current: { temp: w.temp, humid: w.humid, wind: w.wind, rain: w.rain, condition: w.cond }, forecast: [], advisory: { sowing: w.adv, irrigation: '', pest: '', harvest: '' } });
    } catch (e2) {
      res.status(500).json({ message: e.message });
    }
  }
});

// PUT /api/weather (admin update - keeps DB fallback)
router.put('/', async (req, res) => {
  try {
    let w = await Weather.findOne();
    if (!w) w = new Weather();
    Object.assign(w, req.body, { updatedAt: new Date() });
    await w.save();
    res.json(w);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /api/weather/search?q=Pun (city autocomplete)
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (q.length < 2) return res.json([]);
    const url = `${BASE_URL}/search.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(q)}`;
    const resp = await fetch(url);
    const data = await resp.json();
    res.json(data.map(c => ({ name: c.name, region: c.region, country: c.country })));
  } catch (e) { res.json([]); }
});

function generateAdvisory(current, forecast) {
  const temp = current.temp_c;
  const humid = current.humidity;
  const rain = current.precip_mm;
  const wind = current.wind_kph;
  const upcomingRain = forecast.filter(d => d.rainChance > 50).length;

  let sowing = '';
  if (temp >= 20 && temp <= 35 && humid >= 50) {
    sowing = 'Good conditions for sowing. Soil moisture is adequate with current humidity levels.';
  } else if (temp < 15) {
    sowing = 'Temperature is low. Consider delayed sowing for Rabi crops. Protect seedlings from frost.';
  } else if (temp > 38) {
    sowing = 'Extreme heat – avoid sowing. Wait for temperature to drop below 35°C.';
  } else {
    sowing = 'Moderate conditions. Check soil moisture before sowing operations.';
  }

  let irrigation = '';
  if (rain > 10 || upcomingRain >= 2) {
    irrigation = `No irrigation needed. ${rain > 0 ? rain + 'mm rainfall recorded.' : ''} Rain expected in next ${upcomingRain} day(s).`;
  } else if (humid < 40 && temp > 30) {
    irrigation = 'Urgently irrigate! Low humidity and high temperature causing moisture stress.';
  } else if (humid < 60) {
    irrigation = 'Consider light irrigation. Moisture levels are below optimal.';
  } else {
    irrigation = 'Adequate moisture. Monitor crop water needs and irrigate as needed.';
  }

  let pest = '';
  if (humid > 80 && temp > 25) {
    pest = '⚠️ High humidity + warm temp = fungal disease risk! Apply preventive fungicide spray. Monitor for blight and rust.';
  } else if (temp > 35 && humid < 40) {
    pest = 'Watch for mite and aphid infestations in dry heat. Use neem-based sprays as preventive measure.';
  } else {
    pest = 'Low pest risk currently. Continue regular field monitoring. Report unusual symptoms to Krishi Kendra.';
  }

  let harvest = '';
  if (upcomingRain === 0 && wind < 30) {
    harvest = `Excellent harvest window! Clear weather for next ${forecast.length} days. Proceed with harvesting and drying.`;
  } else if (upcomingRain > 0) {
    harvest = `Rain expected in ${upcomingRain} day(s). Complete harvesting before rain or ensure proper storage/covering.`;
  } else if (wind > 30) {
    harvest = 'High winds expected. Secure harvested crops and delay winnowing operations.';
  } else {
    harvest = 'Fair conditions for harvest. Keep monitoring weather updates.';
  }

  return { sowing, irrigation, pest, harvest };
}

module.exports = router;
