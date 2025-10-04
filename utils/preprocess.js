// coco-detector-backend/utils/preprocess.js
const { loadImage, createCanvas } = require('canvas');

// YOLOv8 requires a 640x640 input image
const INPUT_SIZE = 640;

/**
 * Reads image buffer, resizes, and extracts normalized pixel data.
 * @param {Buffer} buffer The image file buffer from Multer.
 * @returns {Float32Array} The normalized 1D tensor data in CHW format.
 */
async function preprocessImage(buffer) {
    try {
        // 1. Load the image buffer using node-canvas's loadImage
        const image = await loadImage(buffer);

        // 2. Create a canvas element to perform resizing
        const canvas = createCanvas(INPUT_SIZE, INPUT_SIZE);
        const ctx = canvas.getContext('2d');
        
        // Draw the image onto the 640x640 canvas
        ctx.drawImage(image, 0, 0, INPUT_SIZE, INPUT_SIZE);

        // Get pixel data from the canvas
        const imageData = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
        const data = imageData.data; // This is the HWC format (R,G,B,A...)

        const modelInput = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
        const size = INPUT_SIZE * INPUT_SIZE;
        
        // 3. Normalize (0-255 -> 0-1) and convert HWC -> CHW
        for (let i = 0; i < size; i++) {
            // R, G, B channels (skipping the Alpha channel every 4th byte)
            modelInput[i] = data[i * 4] / 255.0;         // Red channel
            modelInput[i + size] = data[i * 4 + 1] / 255.0; // Green channel
            modelInput[i + 2 * size] = data[i * 4 + 2] / 255.0; // Blue channel
        }

        return modelInput;
        
    } catch (error) {
        // Log the exact error to the backend console
        console.error("CANVAS PREPROCESSING ERROR:", error); 
        throw new Error(`Preprocessing failed: ${error.message}. Ensure the canvas library installed correctly.`);
    }
}

module.exports = { preprocessImage, INPUT_SIZE };