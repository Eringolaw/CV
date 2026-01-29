/**
 * Document Generator Wrapper
 * Wraps the generate_cv.js script to create Noviam-branded CV documents
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCRIPTS_DIR = path.join(__dirname, '..', 'scripts');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

/**
 * Generate a Noviam-branded CV document from aligned CV data
 * @param {object} cvData - The aligned CV data object
 * @param {string} candidateName - Name for the output file
 * @returns {Promise<string>} - Path to the generated document
 */
async function generateCV(cvData, candidateName = 'Candidate') {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Create unique filenames
  const timestamp = Date.now();
  const hash = crypto.randomBytes(4).toString('hex');
  const safeName = candidateName.replace(/[^a-zA-Z0-9]/g, '_');

  const jsonPath = path.join(OUTPUT_DIR, `cv_data_${hash}.json`);
  const outputPath = path.join(OUTPUT_DIR, `${safeName}_CV_Aligned_${timestamp}.docx`);

  // Write JSON data to temp file
  fs.writeFileSync(jsonPath, JSON.stringify(cvData, null, 2));

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(SCRIPTS_DIR, 'generate_cv.js');

    const child = spawn('node', [scriptPath, outputPath, jsonPath], {
      cwd: SCRIPTS_DIR
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      // Clean up temp JSON file
      try {
        fs.unlinkSync(jsonPath);
      } catch (e) {
        // Ignore cleanup errors
      }

      if (code === 0) {
        console.log('CV generated:', outputPath);
        resolve(outputPath);
      } else {
        console.error('Generation failed:', stderr);
        reject(new Error(`CV generation failed with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (error) => {
      // Clean up temp JSON file
      try {
        fs.unlinkSync(jsonPath);
      } catch (e) {
        // Ignore cleanup errors
      }
      reject(new Error(`Failed to spawn generator: ${error.message}`));
    });
  });
}

/**
 * Clean up old output files (older than 1 hour)
 */
function cleanupOldFiles() {
  if (!fs.existsSync(OUTPUT_DIR)) return;

  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const files = fs.readdirSync(OUTPUT_DIR);

  for (const file of files) {
    const filePath = path.join(OUTPUT_DIR, file);
    const stats = fs.statSync(filePath);

    if (stats.mtimeMs < oneHourAgo) {
      try {
        fs.unlinkSync(filePath);
        console.log('Cleaned up:', file);
      } catch (e) {
        console.error('Cleanup failed:', file, e.message);
      }
    }
  }
}

module.exports = {
  generateCV,
  cleanupOldFiles
};
