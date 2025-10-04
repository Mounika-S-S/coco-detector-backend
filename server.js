// server.js
require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- 1. CORS CONFIGURATION FIX (Final Attempt for Universal Access) ---

const allowedOrigins = [
    // Live Vercel Frontend URL (Required for all browsers/mobile access)
    'https://yolo-detector-frontend.vercel.app', 
    // Render Backend URL (Health checks)
    'https://yolo-detector-backend.onrender.com', 
    // Localhost (for local development)
    'http://localhost:5000', 
    'http://localhost:5173'
];

app.use(express.json()); 

app.use(cors({ 
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Send a specific error message if the origin is blocked
        callback(new Error(`CORS Policy Blocked Origin: ${origin}`));
      }
    },
    // Crucial: Allow the Authorization header (for JWT) and common methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true 
})); 

// ------------------------------------

// 2. DATABASE CONNECTION (Rest of the file remains the same)
(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
})();

// 3. API ROUTES
app.use('/api/auth', require('./routes/auth')); 
app.use('/api/detect', require('./routes/detect')); 

// 4. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));