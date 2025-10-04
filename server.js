// server.js
require('dotenv').config(); // Load environment variables first
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// 1. MIDDLEWARE
app.use(express.json()); 
// Allow frontend to access API (change '*' to your Vercel domain later)
app.use(cors({ origin: '*' })); 

// 2. DATABASE CONNECTION
// We put this in an async IIFE to prevent server exit on failure, 
// allowing the YOLO model load to run in the background.
(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
})();

// 3. API ROUTES
// We require the detect router here, which handles its own async model loading.
app.use('/api/auth', require('./routes/auth')); 
app.use('/api/detect', require('./routes/detect')); 

// 4. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));