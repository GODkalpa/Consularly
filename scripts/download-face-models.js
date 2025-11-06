/**
 * Downloads face-api.js models to public/models directory
 * These are required for face detection and liveness check
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// Models needed for face liveness check
const MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_tiny_model-weights_manifest.json',
  'face_landmark_68_tiny_model-shard1',
];

// Create models directory if it doesn't exist
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log('✓ Created models directory');
}

// Download a single file
function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(MODELS_DIR, filename);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${filename} already exists`);
      resolve();
      return;
    }
    
    const url = `${BASE_URL}/${filename}`;
    const file = fs.createWriteStream(filePath);
    
    console.log(`⬇ Downloading ${filename}...`);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

// Download all models
async function downloadAllModels() {
  console.log('📦 Downloading face-api.js models...\n');
  
  try {
    for (const model of MODELS) {
      await downloadFile(model);
    }
    console.log('\n✅ All models downloaded successfully!');
    console.log(`📁 Models saved to: ${MODELS_DIR}`);
  } catch (err) {
    console.error('\n❌ Error downloading models:', err.message);
    process.exit(1);
  }
}

downloadAllModels();
