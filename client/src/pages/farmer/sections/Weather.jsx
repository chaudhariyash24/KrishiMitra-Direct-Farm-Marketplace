import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API from '../../../api/axios';

export default function Weather() {
  const { currentFarmer } = useAuth();
  const [data, setData] = useState(null);
  const [city, setCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const farmerCity = currentFarmer?.district || currentFarmer?.loc?.split(',')[0]?.trim() || '';

  const fetchWeather = (q) => {
    setLoading(true);
    API.get('/weather?city=' + encodeURIComponent(q))
      .then(r => {
        setData(r.data);
        setLoading(false);
        // If API returned "db" source (city not found), try state name
        if (r.data.source === 'db' && currentFarmer?.state) {
          API.get('/weather?city=' + encodeURIComponent(currentFarmer.state))
            .then(r2 => { if (r2.data.source === 'live') { setData(r2.data); } })
            .catch(() => {});
        }
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const city = farmerCity || 'Mumbai';
    fetchWeather(city);
  }, [farmerCity]);

  const searchCity = (q) => {
    setCity(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    API.get('/weather/search?q=' + encodeURIComponent(q))
      .then(r => { setSearchResults(r.data); setSearching(false); })
      .catch(() => setSearching(false));
  };

  const selectCity = (c) => {
    setCity(c.name);
    setSearchResults([]);
    fetchWeather(c.name);
  };

  const getWeatherEmoji = (cond) => {
    if (!cond) return '🌤️';
    const c = cond.toLowerCase();
    if (c.includes('sunny') || c.includes('clear')) return '☀️';
    if (c.includes('cloud') && c.includes('partly')) return '⛅';
    if (c.includes('cloud') || c.includes('overcast')) return '☁️';
    if (c.includes('rain') && c.includes('heavy')) return '🌧️';
    if (c.includes('rain') || c.includes('drizzle')) return '🌦️';
    if (c.includes('thunder') || c.includes('storm')) return '⛈️';
    if (c.includes('snow') || c.includes('blizzard')) return '❄️';
    if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return '🌫️';
    if (c.includes('wind')) return '💨';
    return '🌤️';
  };

  const cur = data?.current;
  const forecast = data?.forecast || [];
  const loc = data?.location;
  const adv = data?.advisory;

  return (
    <>
      <div className="page-header">
        <h1>🌤️ Live Weather Information</h1>
        <p>{loc ? `${loc.name}, ${loc.region} • ${loc.localtime}` : 'Loading...'}</p>
      </div>

      {/* City Search */}
      <div className="search-bar" style={{position:'relative',marginBottom:'1.5rem'}}>
        <input
          value={city}
          onChange={e => searchCity(e.target.value)}
          placeholder="🔍 Search any city... (e.g. Nashik, Pune, Delhi)"
          type="text"
          style={{flex:1}}
        />
        <button className="btn btn-green btn-sm" onClick={() => city && fetchWeather(city)}>Get Weather</button>
        {searchResults.length > 0 && (
          <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',borderRadius:'0 0 var(--radius2) var(--radius2)',boxShadow:'var(--shadow2)',zIndex:50,maxHeight:'200px',overflowY:'auto',border:'1px solid var(--border)'}}>
            {searchResults.map((c,i) => (
              <div key={i} onClick={() => selectCity(c)} style={{padding:'.65rem 1rem',cursor:'pointer',borderBottom:'1px solid var(--border)',fontSize:'.88rem',transition:'.15s'}}
                onMouseEnter={e => e.target.style.background='#E8F5E9'}
                onMouseLeave={e => e.target.style.background='#fff'}>
                📍 <b>{c.name}</b>, {c.region}, {c.country}
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="card" style={{textAlign:'center',padding:'3rem'}}>
          <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🌤️</div>
          <p>Loading weather data...</p>
        </div>
      ) : (
        <>
          {/* Current Weather Card */}
          {cur && (
            <div className="card" style={{background:'linear-gradient(135deg,#1565C0,#0D47A1)',color:'#fff',marginBottom:'1.5rem',padding:'2rem'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1.5rem'}}>
                <div>
                  <div style={{fontSize:'4rem',marginBottom:'.5rem'}}>{getWeatherEmoji(cur.condition)}</div>
                  <div style={{fontFamily:'var(--font-head)',fontSize:'3.5rem',fontWeight:800,lineHeight:1}}>{cur.temp}°C</div>
                  <div style={{fontSize:'1rem',color:'#90CAF9',marginTop:'.3rem'}}>Feels like {cur.feelslike}°C • {cur.condition}</div>
                  <div style={{fontSize:'.85rem',color:'#BBDEFB',marginTop:'.2rem'}}>📍 {loc?.name}, {loc?.region}</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                  <div style={{background:'rgba(255,255,255,.12)',borderRadius:'12px',padding:'1rem 1.2rem',textAlign:'center',backdropFilter:'blur(8px)'}}>
                    <div style={{fontSize:'1.5rem'}}>💧</div>
                    <div style={{fontFamily:'var(--font-head)',fontSize:'1.4rem',fontWeight:800}}>{cur.humid}%</div>
                    <div style={{fontSize:'.72rem',color:'#90CAF9'}}>Humidity</div>
                  </div>
                  <div style={{background:'rgba(255,255,255,.12)',borderRadius:'12px',padding:'1rem 1.2rem',textAlign:'center',backdropFilter:'blur(8px)'}}>
                    <div style={{fontSize:'1.5rem'}}>💨</div>
                    <div style={{fontFamily:'var(--font-head)',fontSize:'1.4rem',fontWeight:800}}>{cur.wind}</div>
                    <div style={{fontSize:'.72rem',color:'#90CAF9'}}>Wind km/h ({cur.windDir})</div>
                  </div>
                  <div style={{background:'rgba(255,255,255,.12)',borderRadius:'12px',padding:'1rem 1.2rem',textAlign:'center',backdropFilter:'blur(8px)'}}>
                    <div style={{fontSize:'1.5rem'}}>🌧️</div>
                    <div style={{fontFamily:'var(--font-head)',fontSize:'1.4rem',fontWeight:800}}>{cur.rain} mm</div>
                    <div style={{fontSize:'.72rem',color:'#90CAF9'}}>Rainfall</div>
                  </div>
                  <div style={{background:'rgba(255,255,255,.12)',borderRadius:'12px',padding:'1rem 1.2rem',textAlign:'center',backdropFilter:'blur(8px)'}}>
                    <div style={{fontSize:'1.5rem'}}>☀️</div>
                    <div style={{fontFamily:'var(--font-head)',fontSize:'1.4rem',fontWeight:800}}>{cur.uv}</div>
                    <div style={{fontSize:'.72rem',color:'#90CAF9'}}>UV Index</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7-Day Forecast */}
          {forecast.length > 0 && (
            <>
              <h3 style={{fontFamily:'var(--font-head)',color:'var(--primary-dark)',marginBottom:'1rem'}}>📅 {forecast.length}-Day Forecast</h3>
              <div className="weather-grid">
                {forecast.map((d,i) => (
                  <div key={i} className="weather-card" style={{background: i===0 ? 'linear-gradient(135deg,#1976D2,#1565C0)' : 'linear-gradient(135deg,#283593,#1a237e)'}}>
                    <div className="w-icon" style={{fontSize:'2.5rem'}}>{getWeatherEmoji(d.condition)}</div>
                    <h3>{Math.round(d.avgTemp)}°C</h3>
                    <p style={{fontSize:'.72rem',color:'#BBDEFB'}}>{Math.round(d.minTemp)}° – {Math.round(d.maxTemp)}°</p>
                    <p>{d.day}</p>
                    <p style={{fontSize:'.72rem',marginTop:'.2rem',color:'#90CAF9'}}>{d.condition}</p>
                    <div style={{display:'flex',justifyContent:'center',gap:'.6rem',marginTop:'.4rem',fontSize:'.68rem',color:'#BBDEFB'}}>
                      <span>💧{d.humidity}%</span>
                      <span>🌧️{d.rainChance}%</span>
                    </div>
                    {i === 0 && d.sunrise && (
                      <div style={{fontSize:'.65rem',color:'#90CAF9',marginTop:'.4rem'}}>🌅 {d.sunrise} • 🌇 {d.sunset}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Farming Advisory */}
          {adv && (
            <div className="card" style={{marginTop:'1.5rem'}}>
              <div className="card-header"><span className="card-title">🌾 AI Farming Advisory (Based on Live Weather)</span></div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:'1rem'}}>
                <div style={{background:'#E8F5E9',borderRadius:'var(--radius2)',padding:'1rem'}}>
                  <b>🌱 Sowing Advisory</b><br/>
                  <span style={{fontSize:'.85rem',color:'var(--text2)'}}>{adv.sowing || 'Check conditions before sowing.'}</span>
                </div>
                <div style={{background:'#FFF3E0',borderRadius:'var(--radius2)',padding:'1rem'}}>
                  <b>💧 Irrigation</b><br/>
                  <span style={{fontSize:'.85rem',color:'var(--text2)'}}>{adv.irrigation || 'Monitor soil moisture levels.'}</span>
                </div>
                <div style={{background:'#F3E5F5',borderRadius:'var(--radius2)',padding:'1rem'}}>
                  <b>🐛 Pest Alert</b><br/>
                  <span style={{fontSize:'.85rem',color:'var(--text2)'}}>{adv.pest || 'Regular monitoring recommended.'}</span>
                </div>
                <div style={{background:'#E3F2FD',borderRadius:'var(--radius2)',padding:'1rem'}}>
                  <b>🌾 Harvest Window</b><br/>
                  <span style={{fontSize:'.85rem',color:'var(--text2)'}}>{adv.harvest || 'Check forecast before harvesting.'}</span>
                </div>
              </div>
            </div>
          )}

          {data?.source === 'live' && (
            <div style={{textAlign:'center',marginTop:'1rem',fontSize:'.75rem',color:'var(--text3)'}}>
              ✅ Live data from WeatherAPI.com • Last updated: {loc?.localtime}
            </div>
          )}
        </>
      )}
    </>
  );
}
