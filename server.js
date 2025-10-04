// server.js
require('dotenv').config(); // Load environment variables first
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// 1. MIDDLEWARE
// Allows us to read JSON data from the client
app.use(express.json()); 
// Allows the frontend on Vercel to access this API
// When deploying, replace '*' with your actual Vercel domain!
app.use(cors({ origin: '*' })); 

// 2. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// 3. BASIC ROUTE
app.get('/', (req, res) => {
  res.send('API is running.');
});

// 4. API ROUTES (We will add these files later)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/detect', require('./routes/detect'));

// 5. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));