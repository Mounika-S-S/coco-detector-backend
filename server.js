// server.js
require('dotenv').config(); // Load environment variables first
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- 1. CORS CONFIGURATION FIX ---

// 🚨 DEFINITIVE FIX: Allow requests from the live Vercel frontend and the Render backend itself.
const allowedOrigins = [
    // 1. Live Vercel Frontend URL (Required for browser/mobile access)
    'https://yolo-detector-frontend.vercel.app/', 
    // 2. Render Backend URL (Useful for Render internal health checks or testing)
    'https://yolo-detector-backend.onrender.com', 
    // 3. Localhost (Keep for local development)
    'http://localhost:5000', 
    'http://localhost:5173'
];

app.use(express.json()); 

app.use(cors({ 
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps/Postman) or if the origin is in our allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS policy: ${origin}`));
      }
    },
    credentials: true // Allow cookies/auth headers to be sent
})); 

// ------------------------------------

// 2. DATABASE CONNECTION
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