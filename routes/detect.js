// coco-detector-backend/routes/detect.js
const express = require('express');
const multer = require('multer');
const { InferenceSession, Tensor } = require('onnxruntime-node');
const path = require('path');
const jwt = require('jsonwebtoken'); 
const { preprocessImage, INPUT_SIZE } = require('../utils/preprocess');
const { COCO_CLASSES } = require('../utils/labels'); // New Import

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); 

// --- Auth Middleware (Requires JWT_SECRET in .env) ---
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

// --- Model Setup (Load Once Asynchronously) ---
const modelPath = path.join(__dirname, '../models/yolov8n.onnx');
let session;

(async () => {
    try {
        session = await InferenceSession.create(modelPath);
        console.log("YOLOv8 ONNX model ready for inference.");
    } catch (e) {
        console.error("CRITICAL: Failed to load ONNX model:", e);
    }
})();


// --- DETECTION ROUTE ---
router.post('/', auth, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded.' });
    }
    if (!session) {
        return res.status(503).json({ message: 'Model service temporarily unavailable.' });
    }

    try {
        // 1. Preprocess the image buffer
        const modelInput = await preprocessImage(req.file.buffer);

        // 2. Create ONNX Tensor [1, 3, 640, 640]
        const inputTensor = new Tensor('float32', modelInput, [1, 3, INPUT_SIZE, INPUT_SIZE]);
        const inputFeed = { 'images': inputTensor }; 
        
        // 3. Run Inference
        const outputMap = await session.run(inputFeed);
        const outputTensor = outputMap.output0; 
        const outputData = outputTensor.data; 

        // --- DECODING LOGIC (Identify best single object) ---
        const NUM_CLASSES = COCO_CLASSES.length; // 80 classes
        const NUM_PROPOSALS = outputTensor.dims[2]; // e.g., 8400
        let maxScore = 0;
        let detectedClassId = -1;

        // Iterate through all 8400 potential prediction boxes
        for (let i = 0; i < NUM_PROPOSALS; i++) {
            // Check the confidence scores for this proposal
            // The scores start at index 4 (0-3 are box coords)
            for (let c = 0; c < NUM_CLASSES; c++) {
                // Flattened array index: ClassScoresStart * NUM_PROPOSALS + ProposalIndex
                const scoreIndex = (4 + c) * NUM_PROPOSALS + i; 
                const score = outputData[scoreIndex];

                if (score > maxScore) {
                    maxScore = score;
                    detectedClassId = c;
                }
            }
        }

        let topClassName = 'No Clear Object Detected (< 50% Confidence)';
        if (maxScore > 0.5) { // Use a minimum threshold of 50%
            topClassName = COCO_CLASSES[detectedClassId];
        }

        // 4. Return the decoded class name and confidence
        res.json({ 
            message: 'YOLO Detection Complete', 
            top_class_name: topClassName,
            confidence: maxScore.toFixed(2),
            raw_output_dims: outputTensor.dims
        });

    } catch (err) {
        console.error("FULL DETECTION ERROR during preprocessing or inference:", err); 
        res.status(500).json({ message: 'Server failed to process image with YOLO.' });
    }
});

module.exports = router;