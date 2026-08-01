# 🌾 KrishiMitra (Direct-Farm-Marketplace)
> Bridging the gap between farmers, consumers, and agricultural resources using interactive location tracking, forecasting, and a direct-to-consumer digital marketplace.

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Status-Completed-success?style=for-the-badge" alt="Status" />
</p>

---

## 📷 Demo & Screenshots
*(Insert high-quality app GIF or screenshot here)*
![KrishiMitra Dashboard Screenshot](https://via.placeholder.com/800x450.png?text=KrishiMitra+Marketplace+Dashboard)

---

## 🔗 Live Demo
🚀 **Explore the Live App**: [Live Deployment Link Placeholder (e.g. Vercel / Netlify)]

---

## 🎯 Problem Statement
In traditional agriculture systems, farmers face severe economic exploitation from intermediate middlemen who squeeze their margins. Additionally, small-scale farmers lack real-time local weather forecasts and interactive maps displaying nearby seed banks, soil clinics, and markets. KrishiMitra removes the middlemen by offering a direct-to-consumer listing platform with geo-mapped agricultural resources.

---

## 🌟 Key Features
- 🛒 **Direct Peer-to-Peer Marketplace**: Farmers can list their crops and set target pricing directly, allowing consumers to buy fresh harvest without middle-man markups.
- 🌦️ **Micro-Location Weather Alerts**: Integrated location-based forecasting providing actionable recommendations on when to irrigate, spray, or harvest.
- 🗺️ **Geo-Visualization Map**: Visualizes agricultural hubs, cold storages, government loan offices, and seed distributors on an interactive map using Leaflet.js.
- 💰 **Welfare & Loan Portal**: Structured, easy-to-read database of active government subsidies, schemes, and low-interest crop loans.

---

## 🛠 Tech Stack
- **Frontend Framework**: React.js (built on Vite for lightning-fast loads)
- **Routing**: React Router DOM (v6)
- **Map Services**: Leaflet.js & React-Leaflet
- **APIs**: OpenWeatherMap API (or local metrics endpoint) via Axios
- **Styling**: CSS3 (Modular Layouts, Flexbox/Grid)

---

## 🏗 System Design & Architecture
```text
 ┌───────────────────────────────┐
 │       React.js Client         │
 │  (Components & Routing)       │
 └──────┬─────────────────┬──────┘
        │                 │
        │ HTTP GET        │ HTTP GET
        ▼                 ▼
 ┌──────────────┐  ┌──────────────┐
 │ OpenWeather  │  │ Leaflet Maps │
 │  Map API     │  │  Tile Server │
 │ (Forecasting)│  │ (OSM Tiles)  │
 └──────────────┘  └──────────────┘
```
1. **React State** stores user location coordinates (retrieved via HTML5 Geolocation API).
2. **Axios** polls weather API endpoint for real-time local parameters.
3. **Leaflet Container** renders maps using OpenStreetMap tiles, placing custom map markers indicating available crop resources.

---

## ⚙ Installation & Setup
Follow these steps to run KrishiMitra on your local machine:

### 1. Clone the Repo
```bash
git clone https://github.com/chaudhariyash24/KrishiMitra-Direct-Farm-Marketplace.git
cd KrishiMitra-Direct-Farm-Marketplace
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` in the root folder:
```env
VITE_WEATHER_API_KEY=your_openweathermap_api_key
VITE_MAP_TILE_PROVIDER=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### 4. Boot up local Dev Server
```bash
npm run dev
```
Open `http://localhost:5173` inside your browser.

---

## 💻 Code Snippet: Interactive Map Rendering (Leaflet)
Below is a code snippet from the mapping module that displays resources on KrishiMitra:

```javascript
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const customMarkerIcon = new L.Icon({
  iconUrl: '/assets/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function FarmMap({ resources, userLocation }) {
  return (
    <MapContainer center={userLocation} zoom={13} style={{ height: "450px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      {resources.map(res => (
        <Marker key={res.id} position={[res.lat, res.lng]} icon={customMarkerIcon}>
          <Popup>
            <strong>{res.name}</strong> <br />
            Type: {res.type} <br />
            Distance: {res.distance} km
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

---

## 📂 Folder Structure
```text
KrishiMitra/
├── public/                  # Static assets and map icons
├── src/
│   ├── assets/              # Icons and local image constants
│   ├── components/          # Reusable Navbar, Footer, and Map elements
│   ├── pages/               # Marketplace, Weather, Schemes, and Map dashboards
│   ├── services/            # Axios API endpoints for weather data
│   ├── routes/              # Routing setup (Vite routes)
│   ├── App.jsx              # Main App wrapper
│   └── main.jsx             # React DOM entry point
├── package.json
└── vite.config.js
```

---

## 🗺 Roadmap
- [ ] **SMS Integration**: Integrate Twilio SMS API to send market updates to farmers using simple feature phones.
- [ ] **AI Crop Advisory**: Leverage Gemini Vision to detect plant diseases from uploaded leaf images.
- [ ] **Payment Gateways**: Integrate Razorpay/UPI sandbox for secure product purchasing directly in the marketplace.

---

## 🤝 Contributing
1. Fork it!
2. Create feature branch (`git checkout -b feature/CoolNewFeature`)
3. Commit (`git commit -m 'Adds cool new feature'`)
4. Push (`git push origin feature/CoolNewFeature`)
5. Open a Pull Request

---

## 📄 License
Under MIT License.

---

## ✉ Contact
**Yash Chaudhari** - [LinkedIn Profile](https://www.linkedin.com/in/yash-chaudhari-17762332b)  
Project Link: [https://github.com/chaudhariyash24/KrishiMitra-Direct-Farm-Marketplace](https://github.com/chaudhariyash24/KrishiMitra-Direct-Farm-Marketplace)
