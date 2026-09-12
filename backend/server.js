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
  console.log('Client connected:', socket.id);

  socket.on('driver_connect', ({ driverId }) => {
    if (driverId) {
      socket.join(driverId);
      console.log(`Driver joined room: ${driverId}`);
    }
  });

  socket.on('police_connect', () => {
    socket.join('police_dispatch');
    console.log('Police dispatch joined room');
  });

  socket.on('update_location', async ({ driverId, lat, lng }) => {
    if (!driverId || !lat || !lng) return;
    
    try {
      await redisClient.geoAdd('active_drivers', {
        longitude: lng,
        latitude: lat,
        member: driverId
      });
      console.log(`Updated location for ${driverId}: [${lat}, ${lng}]`);
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
  const { alertId, childData } = req.body;

  console.log('FORCE BROADCASTING TO ALL SOCKETS (Test Mode)');
  io.emit('missing_alert', { alertId, childData });

  res.status(200).json({ 
    success: true, 
    message: 'Forced broadcast sent to all sockets' 
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});