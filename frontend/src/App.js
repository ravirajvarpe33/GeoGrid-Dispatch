import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Setup Map Icons
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const socket = io('https://geogrid-backend-pjk3.onrender.com');

function App() {
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [spottedLocations, setSpottedLocations] = useState([]);
  
  // Interactive State Variables
  const [incidentLocation, setIncidentLocation] = useState({ lat: 19.0760, lng: 72.8777 });
  const [radiusKm, setRadiusKm] = useState(3);
  const [childDescription, setChildDescription] = useState('');
  
  // NEW: State to hold the uploaded photo
  const [photoBase64, setPhotoBase64] = useState('');

  useEffect(() => {
    socket.emit('police_connect');
    socket.on('target_spotted', (data) => {
      setSpottedLocations((prev) => [...prev, data]);
    });
    return () => socket.off('target_spotted');
  }, []);

  // NEW: Function to handle image upload and convert to text
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBroadcast = async () => {
    if (!childDescription.trim()) {
      alert("Please enter the child's details before broadcasting.");
      return;
    }
    
    setBroadcastActive(true);
    
    try {
      await fetch('https://geogrid-backend-pjk3.onrender.com/api/broadcast-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: `ALERT-${Math.floor(Math.random() * 10000)}`,
          lat: incidentLocation.lat,
          lng: incidentLocation.lng,
          radiusKm: Number(radiusKm),
          // NEW: Added the photo to the broadcast payload
          childData: { 
            description: childDescription,
            photo: photoBase64
          }
        })
      });
      alert(`Alert broadcasted successfully in a ${radiusKm}km radius!`);
    } catch (err) {
      console.error('Failed to broadcast:', err);
    }
  };

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        setIncidentLocation(e.latlng);
        setBroadcastActive(false); 
      },
    });
    return null;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Sidebar Command Center */}
      <div style={{ 
        width: '350px', backgroundColor: '#1a1a1a', color: 'white', 
        padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px',
        boxShadow: '5px 0 15px rgba(0,0,0,0.5)', zIndex: 1000, overflowY: 'auto'
      }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', color: '#ff4444' }}>GeoGrid Dispatch</h2>
          <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>Dispatch Command Module</p>
        </div>

        <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#ccc' }}>1. Set Location</label>
          <p style={{ fontSize: '13px', margin: '5px 0 0 0' }}>Click map to set exact coordinates.</p>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#00ffcc' }}>
            Lat: {incidentLocation.lat.toFixed(4)} <br/>
            Lng: {incidentLocation.lng.toFixed(4)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#ccc' }}>2. Child Details & Photo</label>
          
          {/* NEW: Upload Button and Preview */}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            style={{ fontSize: '12px', color: '#ccc', marginBottom: '5px' }} 
          />
          {photoBase64 && (
            <img src={photoBase64} alt="Preview" style={{ width: '100%', borderRadius: '5px', marginBottom: '10px' }} />
          )}

          <textarea 
            rows="3"
            placeholder="e.g., 7-year-old boy, red shirt..."
            value={childDescription}
            onChange={(e) => setChildDescription(e.target.value)}
            style={{ padding: '10px', borderRadius: '5px', border: 'none', resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#ccc' }}>3. Alert Radius ({radiusKm} km)</label>
          <input 
            type="range" 
            min="1" max="15" step="1"
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        <button 
          onClick={handleBroadcast}
          style={{ 
            padding: '15px', backgroundColor: '#ff4444', color: 'white', 
            border: 'none', borderRadius: '5px', fontSize: '16px', 
            fontWeight: 'bold', cursor: 'pointer', marginTop: 'auto',
            boxShadow: '0 4px 10px rgba(255, 68, 68, 0.4)'
          }}
        >
          🚨 BROADCAST ALERT
        </button>
      </div>

      {/* The Live Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[19.0760, 72.8777]} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <MapClickHandler />
          <Marker position={[incidentLocation.lat, incidentLocation.lng]} icon={defaultIcon}>
            <Popup>Dispatch Origin Point</Popup>
          </Marker>
          {broadcastActive && (
            <Circle 
              center={[incidentLocation.lat, incidentLocation.lng]} 
              radius={radiusKm * 1000} 
              pathOptions={{ color: 'red', fillColor: '#ff4444', fillOpacity: 0.2 }}
            />
          )}
          {spottedLocations.map((spot, idx) => (
            <Marker key={idx} position={[spot.lat, spot.lng]} icon={redIcon}>
              <Popup>
                <b>🚨 SPOTTED HERE</b><br/>
                Driver ID: {spot.driverId}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;