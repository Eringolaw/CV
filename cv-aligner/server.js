/**
 * CV Aligner Server
 * Express server for the Noviam CV Alignment Tool
 */

require('dotenv').config();

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { extractText } = require('./lib/extractor');
const { alignCV } = require('./lib/aligner');
const { generateCV, cleanupOldFiles } = require('./lib/generator');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'output');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowedTypes.join(', ')}`));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow embedding in Teams (iframe)
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'ALLOW-FROM https://teams.microsoft.com');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://teams.microsoft.com https://*.teams.microsoft.com");
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Serve generated files for download
app.use('/download', express.static(OUTPUT_DIR));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY
  });
});

// Main alignment endpoint
app.post('/api/align',
  upload.fields([
    { name: 'jobDescription', maxCount: 1 },
    { name: 'cv', maxCount: 1 }
  ]),
  async (req, res) => {
    const uploadedFiles = [];

    try {
      // Check API key
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({
          error: 'Server configuration error',
          message: 'ANTHROPIC_API_KEY is not configured'
        });
      }

      // Extract job description text
      let jobDescriptionText = req.body.jobDescriptionText || '';

      if (req.files && req.files.jobDescription && req.files.jobDescription[0]) {
        const jdFile = req.files.jobDescription[0];
        uploadedFiles.push(jdFile.path);
        jobDescriptionText = await extractText(jdFile.path);
      }

      if (!jobDescriptionText.trim()) {
        return res.status(400).json({
          error: 'Missing job description',
          message: 'Please provide a job description file or paste the text'
        });
      }

      // Extract CV text
      if (!req.files || !req.files.cv || !req.files.cv[0]) {
        return res.status(400).json({
          error: 'Missing CV',
          message: 'Please upload a CV file (PDF or DOCX)'
        });
      }

      const cvFile = req.files.cv[0];
      uploadedFiles.push(cvFile.path);
      const cvText = await extractText(cvFile.path);

      if (!cvText.trim()) {
        return res.status(400).json({
          error: 'Empty CV',
          message: 'Could not extract text from the CV file'
        });
      }

      console.log('Processing alignment request...');
      console.log('Job description length:', jobDescriptionText.length);
      console.log('CV text length:', cvText.length);

      // Call Claude to align the CV
      const alignedData = await alignCV(jobDescriptionText, cvText);
      console.log('Alignment complete for:', alignedData.name);

      // Generate the document
      const outputPath = await generateCV(alignedData, alignedData.name);
      const filename = path.basename(outputPath);

      console.log('Document generated:', filename);

      // Return success with download link
      res.json({
        success: true,
        candidateName: alignedData.name,
        downloadUrl: `/download/${filename}`,
        filename
      });

    } catch (error) {
      console.error('Alignment error:', error);
      res.status(500).json({
        error: 'Processing failed',
        message: error.message
      });
    } finally {
      // Clean up uploaded files
      for (const filePath of uploadedFiles) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Failed to clean up:', filePath);
        }
      }
    }
  }
);

// Error handler for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'Upload error',
      message: error.message
    });
  }
  if (error) {
    return res.status(400).json({
      error: 'Error',
      message: error.message
    });
  }
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           Noviam CV Alignment Tool                        ║
║                                                           ║
║   Server running at http://localhost:${PORT}                 ║
║                                                           ║
║   API Key: ${process.env.ANTHROPIC_API_KEY ? 'Configured ✓' : 'NOT CONFIGURED ✗'}                          ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Run cleanup every hour
  setInterval(cleanupOldFiles, 60 * 60 * 1000);
});
