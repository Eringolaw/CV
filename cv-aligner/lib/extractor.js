/**
 * Text Extraction Library
 * Extracts text content from PDF, DOCX, and TXT files
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text.trim();
}

/**
 * Extract text from a DOCX file
 * @param {string} filePath - Path to the DOCX file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value.trim();
}

/**
 * Extract text from a TXT file
 * @param {string} filePath - Path to the TXT file
 * @returns {Promise<string>} - File content
 */
async function extractFromTXT(filePath) {
  return fs.readFileSync(filePath, 'utf-8').trim();
}

/**
 * Extract text from any supported file type
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.pdf':
      return extractFromPDF(filePath);
    case '.docx':
      return extractFromDOCX(filePath);
    case '.txt':
      return extractFromTXT(filePath);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

module.exports = {
  extractFromPDF,
  extractFromDOCX,
  extractFromTXT,
  extractText
};
