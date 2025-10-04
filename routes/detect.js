// coco-detector-backend/routes/detect.js
const express = require('express');
const multer = require('multer');
const { InferenceSession, Tensor } = require('onnxruntime-node');
const path = require('path');
const jwt = require('jsonwebtoken'); // Still needed for the 'auth' middleware
const { preprocessImage, INPUT_SIZE } = require('../utils/preprocess');

const router = express.Router();
// Multer setup (same as before)
const upload = multer({ storage: multer.memoryStorage() }); 

// --- Auth Middleware (Use your existing, complete code for this) ---
const auth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// --- Model Setup (Load Once) ---
const modelPath = path.join(__dirname, '../models/yolov8n.onnx');
let session;

// Load the session asynchronously
InferenceSession.create(modelPath).then(s => {
    session = s;
    console.log("YOLOv8 ONNX model loaded successfully.");
}).catch(e => {
    console.error("Failed to load ONNX model. Check if yolov8n.onnx is in the models/ folder:", e);
    // You can choose to exit the process here: process.exit(1); 
});


// DETECTION ROUTE
router.post('/', auth, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded.' });
    }
    if (!session) {
        return res.status(503).json({ message: 'Model not yet loaded or failed to load.' });
    }

    try {
        // 1. Preprocess the image buffer
        const modelInput = await preprocessImage(req.file.buffer);

        // 2. Create ONNX Tensor [1, 3, 640, 640]
        const inputTensor = new Tensor('float32', modelInput, [1, 3, INPUT_SIZE, INPUT_SIZE]);
        
        // Input name for YOLOv8 ONNX models is typically 'images'
        const inputFeed = { 'images': inputTensor }; 
        
        // 3. Run Inference
        const outputMap = await session.run(inputFeed);
        
        // Output name is typically 'output0'
        const outputTensor = outputMap.output0; 
        
        // --- Return RAW output for confirmation (No NMS implemented) ---
        res.json({ 
            message: 'YOLOv8 Inference successful (Raw Output Received)', 
            detections_raw_length: outputTensor.data.length,
            detections_raw_dims: outputTensor.dims
        });

    } catch (err) {
        console.error("YOLO Detection Error:", err);
        res.status(500).json({ message: 'Server failed to process image with YOLO.' });
    }
});

module.exports = router;