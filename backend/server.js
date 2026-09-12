require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const redisClient = require('./redisClient');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  socket.on('driver_connect', ({ driverId }) => {
    if (driverId) {
      socket.join(driverId);
    }
  });

  socket.on('police_connect', () => {
    socket.join('police_dispatch');
  });

  socket.on('update_location', async ({ driverId, lat, lng }) => {
    if (!driverId || !lat || !lng) return;
    
    try {
      await redisClient.geoAdd('active_drivers', {
        longitude: lng,
        latitude: lat,
        member: driverId
      });
    } catch (error) {
      console.error('GeoAdd error:', error);
    }
  });

  socket.on('target_spotted', ({ driverId, lat, lng, alertId }) => {
    io.to('police_dispatch').emit('target_spotted', { 
      driverId, 
      lat, 
      lng, 
      alertId 
    });
  });
});

app.post('/api/broadcast-alert', async (req, res) => {
  const { alertId, lat, lng, radiusKm, childData } = req.body;

  if (!lat || !lng || !radiusKm) {
    return res.status(400).json({ error: 'Missing location parameters' });
  }

  try {
    const driversInRadius = await redisClient.geoSearch(
      'active_drivers',
      { longitude: lng, latitude: lat },
      { radius: radiusKm, unit: 'km' }
    );

    driversInRadius.forEach(driverId => {
      io.to(driverId).emit('missing_alert', { alertId, childData });
    });

    res.status(200).json({ 
      success: true, 
      alertedCount: driversInRadius.length 
    });
  } catch (error) {
    console.error('GeoSearch error:', error);
    res.status(500).json({ error: 'Server error processing geospatial query' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});