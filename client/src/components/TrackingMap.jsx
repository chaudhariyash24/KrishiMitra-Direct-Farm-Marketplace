import { useEffect, useState, useRef } from 'react';

const cityCoords = {
  'mumbai':[19.076,72.8777],'pune':[18.5204,73.8567],'nashik':[20.0063,73.7907],'nasik':[20.0063,73.7907],
  'nagpur':[21.1458,79.0882],'aurangabad':[19.8762,75.3433],'solapur':[17.6599,75.9064],'kolhapur':[16.7050,74.2433],
  'jalgaon':[21.0077,75.5626],'thane':[19.2183,72.9781],'navi mumbai':[19.0330,73.0297],
  'kolkata':[22.5726,88.3639],'howrah':[22.5958,88.2636],'darjeeling':[27.0360,88.2627],'siliguri':[26.7271,88.3953],
  'durgapur':[23.5204,87.3119],'asansol':[23.6889,86.9661],'kharagpur':[22.3460,87.2320],
  'lucknow':[26.8467,80.9462],'agra':[27.1767,78.0081],'varanasi':[25.3176,82.9739],'kanpur':[26.4499,80.3319],
  'prayagraj':[25.4358,81.8463],'meerut':[28.9845,77.7064],'noida':[28.5355,77.3910],
  'bhopal':[23.2599,77.4126],'indore':[22.7196,75.8577],'gwalior':[26.2183,78.1828],'jabalpur':[23.1815,79.9864],
  'jaipur':[26.9124,75.7873],'jodhpur':[26.2389,73.0243],'udaipur':[24.5854,73.7125],'kota':[25.2138,75.8648],
  'ahmedabad':[23.0225,72.5714],'surat':[21.1702,72.8311],'vadodara':[22.3072,73.1812],'rajkot':[22.3039,70.8022],
  'chandigarh':[30.7333,76.7794],'ludhiana':[30.9010,75.8573],'amritsar':[31.6340,74.8723],
  'bengaluru':[12.9716,77.5946],'bangalore':[12.9716,77.5946],'mysuru':[12.2958,76.6394],
  'chennai':[13.0827,80.2707],'coimbatore':[11.0168,76.9558],'madurai':[9.9252,78.1198],
  'hyderabad':[17.3850,78.4867],'visakhapatnam':[17.6868,83.2185],'vijayawada':[16.5062,80.6480],
  'patna':[25.6093,85.1376],'ranchi':[23.3441,85.3096],'jamshedpur':[22.8046,86.2029],
  'bhubaneswar':[20.2961,85.8245],'delhi':[28.7041,77.1025],'new delhi':[28.6139,77.2090],
  'guwahati':[26.1445,91.7362],'raipur':[21.2514,81.6296],'dehradun':[30.3165,78.0322],
  'shimla':[31.1048,77.1734],'goa':[15.2993,74.1240],'kochi':[9.9312,76.2673],
  'maharashtra':[19.7515,75.7139],'west bengal':[22.9868,87.8550],
  'noney':[25.0168,93.5168],'manipur':[24.8170,93.9368],
};

function geocode(place) {
  if (!place) return null;
  const clean = place.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  if (cityCoords[clean]) return cityCoords[clean];
  const words = clean.split(/[\s,]+/);
  for (const w of words) { if (cityCoords[w]) return cityCoords[w]; }
  for (const [key] of Object.entries(cityCoords)) {
    if (clean.includes(key) || key.includes(words[0])) return cityCoords[key];
  }
  return null;
}

function haversineKm(a, b) {
  const R = 6371, dLat = ((b[0]-a[0])*Math.PI)/180, dLon = ((b[1]-a[1])*Math.PI)/180;
  const x = Math.sin(dLat/2)**2 + Math.cos((a[0]*Math.PI)/180)*Math.cos((b[0]*Math.PI)/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function TrackingMap({ pickupName, dropName, speed = 55, shippedAt, onProgress, onComplete }) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const completedRef = useRef(false);

  const pickupCoords = geocode(pickupName) || [20.0, 75.0];
  const dropCoords = geocode(dropName) || [22.5, 88.3];
  const distKm = Math.round(haversineKm(pickupCoords, dropCoords) * 1.3);
  const totalSeconds = Math.max(20, Math.round(distKm / 10));

  const pickupCity = pickupName?.split(',')[0] || 'Pickup';
  const dropCity = dropName?.split(',')[0] || 'Drop';

  useEffect(() => {
    completedRef.current = false;
    let startPct = 0;
    if (shippedAt) {
      const elapsed = (Date.now() - new Date(shippedAt).getTime()) / 1000;
      startPct = Math.min(Math.round((elapsed / totalSeconds) * 100), 100);
    }
    if (startPct >= 100) {
      setProgress(100);
      if (onProgress) onProgress(100);
      if (onComplete && !completedRef.current) { completedRef.current = true; onComplete(); }
      return;
    }
    setProgress(startPct);
    if (onProgress) onProgress(startPct);
    let currentPct = startPct;
    intervalRef.current = setInterval(() => {
      currentPct += Math.max(1, Math.round(100 / totalSeconds));
      const pct = Math.min(currentPct, 100);
      setProgress(pct);
      if (onProgress) onProgress(pct);
      if (pct >= 100 && !completedRef.current) {
        completedRef.current = true;
        clearInterval(intervalRef.current);
        if (onComplete) onComplete();
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pickupName, dropName, speed, shippedAt]);

  const kmLeft = Math.round(distKm * (1 - progress / 100));
  const etaMin = Math.round((kmLeft / speed) * 60);
  const etaStr = etaMin > 60 ? `${Math.floor(etaMin/60)}h ${etaMin%60}m` : `${etaMin}m`;
  const done = progress >= 100;

  // SVG path for curved route
  const svgW = 600, svgH = 200;
  const startX = 60, startY = 150, endX = 540, endY = 50;
  const cpX = svgW / 2, cpY = -20;
  const pathD = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;

  // Calculate truck position on the quadratic bezier curve
  const t = progress / 100;
  const truckX = (1-t)*(1-t)*startX + 2*(1-t)*t*cpX + t*t*endX;
  const truckY = (1-t)*(1-t)*startY + 2*(1-t)*t*cpY + t*t*endY;

  // Waypoints along the route
  const waypoints = [];
  const numWaypoints = 3;
  for (let i = 1; i <= numWaypoints; i++) {
    const wt = i / (numWaypoints + 1);
    const wx = (1-wt)*(1-wt)*startX + 2*(1-wt)*wt*cpX + wt*wt*endX;
    const wy = (1-wt)*(1-wt)*startY + 2*(1-wt)*wt*cpY + wt*wt*endY;
    const wpKm = Math.round(distKm * wt);
    const passed = progress >= wt * 100;
    waypoints.push({ x: wx, y: wy, km: wpKm, passed });
  }

  const statusText = done ? '✅ Delivered!' : progress < 5 ? '🚛 Departing...' : progress < 25 ? '🚛 On Highway' : progress < 50 ? '🚛 Midway' : progress < 80 ? '🚛 Approaching' : '🚛 Almost There!';

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--border)', background: '#fff' }}>
      {/* Top bar */}
      <div style={{
        background: done ? 'linear-gradient(135deg, #2E7D32, #43A047)' : 'linear-gradient(135deg, #1565C0, #1976D2)',
        color: '#fff', padding: '.8rem 1.2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span style={{ fontSize: '1.4rem' }}>{done ? '✅' : '🚛'}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '.95rem' }}>{pickupCity} → {dropCity}</div>
            <div style={{ fontSize: '.72rem', opacity: .85 }}>{distKm} km · {speed} km/h</div>
          </div>
        </div>
        <div style={{
          background: done ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.2)',
          padding: '.3rem .8rem', borderRadius: '20px', fontWeight: 800, fontSize: '.78rem',
          animation: done ? 'none' : 'pulse 1.5s infinite',
        }}>
          {done ? '✅ DELIVERED' : '🔴 LIVE'}
        </div>
      </div>

      {/* Route visualization */}
      <div style={{ background: 'linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 30%, #E8F5E9 100%)', padding: '1rem', position: 'relative' }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto' }}>
          {/* Dashed route line (full path) */}
          <path d={pathD} fill="none" stroke="#90CAF9" strokeWidth="4" strokeDasharray="10 6" />

          {/* Solid traveled line */}
          <path d={pathD} fill="none" stroke="#1565C0" strokeWidth="5"
            strokeDasharray={`${t * 800} 800`} strokeLinecap="round" />

          {/* Pickup marker */}
          <circle cx={startX} cy={startY} r="18" fill="#4CAF50" stroke="#fff" strokeWidth="3" />
          <text x={startX} y={startY + 5} textAnchor="middle" fontSize="14">🌾</text>
          <text x={startX} y={startY + 38} textAnchor="middle" fontSize="11" fontWeight="800" fill="#2E7D32">{pickupCity}</text>

          {/* Drop marker */}
          <circle cx={endX} cy={endY} r="18" fill={done ? '#2E7D32' : '#E53935'} stroke="#fff" strokeWidth="3" />
          <text x={endX} y={endY + 5} textAnchor="middle" fontSize="14">{done ? '✅' : '📍'}</text>
          <text x={endX} y={endY - 26} textAnchor="middle" fontSize="11" fontWeight="800" fill="#C62828">{dropCity}</text>

          {/* Waypoint dots */}
          {waypoints.map((wp, i) => (
            <g key={i}>
              <circle cx={wp.x} cy={wp.y} r="6" fill={wp.passed ? '#1565C0' : '#B0BEC5'} stroke="#fff" strokeWidth="2" />
              <text x={wp.x} y={wp.y + 20} textAnchor="middle" fontSize="9" fill="#78909C" fontWeight="600">{wp.km} km</text>
            </g>
          ))}

          {/* Truck */}
          {!done && (
            <g style={{ transition: 'all 0.9s ease' }}>
              <circle cx={truckX} cy={truckY} r="22" fill="rgba(21,101,192,0.15)" />
              <circle cx={truckX} cy={truckY} r="14" fill="#fff" stroke="#1565C0" strokeWidth="2" />
              <text x={truckX} y={truckY + 5} textAnchor="middle" fontSize="15">🚛</text>
            </g>
          )}
        </svg>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        borderTop: '2px solid var(--border)',
      }}>
        <div style={{ padding: '.8rem', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
          <div style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 600 }}>STATUS</div>
          <div style={{ fontSize: '.85rem', fontWeight: 800, color: done ? '#2E7D32' : '#E65100', marginTop: '.2rem' }}>{statusText}</div>
        </div>
        <div style={{ padding: '.8rem', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
          <div style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 600 }}>DISTANCE LEFT</div>
          <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#1565C0', marginTop: '.2rem' }}>🚛 {kmLeft} km</div>
        </div>
        <div style={{ padding: '.8rem', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
          <div style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 600 }}>ETA</div>
          <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#7B1FA2', marginTop: '.2rem' }}>⏱️ {done ? '—' : etaStr}</div>
        </div>
        <div style={{ padding: '.8rem', textAlign: 'center' }}>
          <div style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 600 }}>PROGRESS</div>
          <div style={{ fontSize: '.85rem', fontWeight: 800, color: done ? '#2E7D32' : 'var(--primary)', marginTop: '.2rem' }}>{progress}%</div>
        </div>
      </div>
    </div>
  );
}
