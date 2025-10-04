// coco-detector-backend/utils/preprocess.js
const Jimp = require('jimp');

// YOLOv8 requires a 640x640 input image
const INPUT_SIZE = 640;

/**
 * Resizes and transforms the image buffer for YOLOv8 model input.
 * @param {Buffer} buffer The image file buffer.
 * @returns {Float32Array} The normalized 1D tensor data (CHW format).
 */
async function preprocessImage(buffer) {
    const img = await Jimp.read(buffer);

    // 1. Resize to 640x640
    img.resize(INPUT_SIZE, INPUT_SIZE);

    const imageBuffer = img.bitmap.data;
    const modelInput = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
    
    // 2. Normalize (0-255 -> 0-1) and convert HWC -> CHW
    // HWC (Height, Width, Channels) is Jimp's format
    // CHW (Channels, Height, Width) is the model's required format
    for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
        // Red channel
        modelInput[i] = imageBuffer[i * 4] / 255.0; 
        // Green channel
        modelInput[i + INPUT_SIZE * INPUT_SIZE] = imageBuffer[i * 4 + 1] / 255.0;
        // Blue channel
        modelInput[i + 2 * INPUT_SIZE * INPUT_SIZE] = imageBuffer[i * 4 + 2] / 255.0;
    }

    return modelInput;
}

module.exports = { preprocessImage, INPUT_SIZE };