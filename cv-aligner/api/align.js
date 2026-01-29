const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Inline the necessary functionality for serverless

/**
 * Call Claude API
 */
function callClaudeAPI(requestBody) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      reject(new Error('ANTHROPIC_API_KEY environment variable is not set'));
      return;
    }

    const data = JSON.stringify(requestBody);

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 400) {
            reject(new Error(response.error?.message || `API error: ${res.statusCode}`));
          } else {
            resolve(response);
          }
        } catch (e) {
          reject(new Error(`Failed to parse API response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`API request failed: ${e.message}`)));
    req.write(data);
    req.end();
  });
}

const JSON_SCHEMA = `{
  "name": "Candidate Name",
  "professionalSummary": "2-4 sentences tailored to the role...",
  "coreCompetencies": ["Skill 1", "Skill 2", "..."],
  "professionalExperience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "dates": "Month Year – Month Year",
      "achievements": ["Achievement with metrics...", "..."]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University",
      "location": "City, State",
      "date": "Month Year",
      "details": "GPA, honors, relevant coursework (optional)"
    }
  ],
  "certifications": [
    {"name": "Certification Name", "details": "Grade/Date (optional)"}
  ],
  "leadership": [
    {
      "role": "Position",
      "organization": "Organization",
      "dates": "Dates",
      "achievements": ["Achievement..."]
    }
  ],
  "technicalSkills": {
    "technical": "Tool 1, Tool 2 (Level), ... (must be a string, not array)",
    "languages": "English (Native), Spanish (Intermediate), ... (must be a string, not array)"
  }
}`;

const SYSTEM_PROMPT = `You are a CV alignment specialist for Noviam, an executive recruiting firm. Your job is to analyze job descriptions and candidate CVs, then create aligned CV content that emphasizes the candidate's most relevant experience for the target role.

CRITICAL JSON FIELD REQUIREMENTS:
- Use "role" for job titles (NOT "position", "title", or "jobTitle")
- Use "dates" for time periods (NOT "duration", "startDate/endDate", or "period")
- Use "achievements" for bullet points (NOT "highlights", "bullets", or "responsibilities")
- Use "date" for education dates (NOT "graduationDate" or "completionDate")
- "technical" and "languages" in technicalSkills MUST be strings, NOT arrays
- Every job and education entry MUST have a "location" field

ALIGNMENT RULES:
1. Rewrite the professional summary to directly address the role requirements
2. Reorder core competencies to prioritize skills mentioned in the job description
3. Emphasize and reframe achievements to match job responsibilities
4. Quantify achievements where possible (%, $, time saved, scale)
5. Mirror language and keywords from the job description naturally
6. Do NOT include any contact information (email, phone, address)
7. Keep all factual information accurate - only reframe presentation

Output ONLY valid JSON matching the required schema. No explanations or markdown.`;

/**
 * Align CV using Claude
 */
async function alignCV(jobDescription, cvText) {
  const userPrompt = `JOB DESCRIPTION:
${jobDescription}

---

CANDIDATE CV:
${cvText}

---

Analyze this job description and CV, then output ONLY the aligned CV content as valid JSON matching this exact schema:

${JSON_SCHEMA}

Remember:
- Use exact field names as specified (role, dates, achievements, etc.)
- technicalSkills.technical and technicalSkills.languages must be strings
- Include location for all jobs and education entries
- Do NOT include contact information
- Quantify achievements where possible`;

  const response = await callClaudeAPI({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const textContent = response.content?.find(block => block.type === 'text');
  if (!textContent) throw new Error('No text content in Claude response');

  let jsonText = textContent.text.trim();
  if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7);
  else if (jsonText.startsWith('```')) jsonText = jsonText.slice(3);
  if (jsonText.endsWith('```')) jsonText = jsonText.slice(0, -3);
  jsonText = jsonText.trim();

  const cvData = JSON.parse(jsonText);
  if (!cvData.name || !cvData.professionalSummary) {
    throw new Error('Missing required fields: name or professionalSummary');
  }
  return cvData;
}

/**
 * Parse multipart form data manually (simplified)
 */
function parseMultipart(body, boundary) {
  const parts = {};
  const segments = body.split(`--${boundary}`);

  for (const segment of segments) {
    if (segment.includes('Content-Disposition')) {
      const nameMatch = segment.match(/name="([^"]+)"/);
      const filenameMatch = segment.match(/filename="([^"]+)"/);

      if (nameMatch) {
        const name = nameMatch[1];
        const contentStart = segment.indexOf('\r\n\r\n') + 4;
        let content = segment.slice(contentStart);
        if (content.endsWith('\r\n')) content = content.slice(0, -2);

        parts[name] = {
          filename: filenameMatch ? filenameMatch[1] : null,
          content: content
        };
      }
    }
  }
  return parts;
}

/**
 * Extract text from file content based on type
 */
function extractText(content, filename) {
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.txt') {
    return content;
  }

  if (ext === '.docx') {
    // Simple DOCX text extraction (looks for text in the XML)
    const textMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    return textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
  }

  if (ext === '.pdf') {
    // Basic PDF text extraction (works for simple text-based PDFs)
    const textMatches = content.match(/\(([^)]+)\)/g) || [];
    let text = textMatches.map(m => m.slice(1, -1)).join(' ');
    // Also try to find text streams
    const streamMatch = content.match(/stream\s*([\s\S]*?)\s*endstream/g) || [];
    for (const stream of streamMatch) {
      const readable = stream.replace(/stream|endstream/g, '').replace(/[^\x20-\x7E\s]/g, ' ');
      if (readable.trim().length > 50) text += ' ' + readable;
    }
    return text.replace(/\s+/g, ' ').trim();
  }

  return content;
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'ANTHROPIC_API_KEY is not configured'
      });
    }

    // Parse the multipart form data
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)/);

    if (!boundaryMatch) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const boundary = boundaryMatch[1];

    // Get raw body
    let rawBody = '';
    if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('latin1');
    } else {
      // Collect body chunks
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      rawBody = Buffer.concat(chunks).toString('latin1');
    }

    const parts = parseMultipart(rawBody, boundary);

    // Get job description
    let jobDescriptionText = '';
    if (parts.jobDescriptionText?.content) {
      jobDescriptionText = parts.jobDescriptionText.content;
    } else if (parts.jobDescription?.content && parts.jobDescription?.filename) {
      jobDescriptionText = extractText(parts.jobDescription.content, parts.jobDescription.filename);
    }

    if (!jobDescriptionText.trim()) {
      return res.status(400).json({
        error: 'Missing job description',
        message: 'Please provide a job description'
      });
    }

    // Get CV
    if (!parts.cv?.content || !parts.cv?.filename) {
      return res.status(400).json({
        error: 'Missing CV',
        message: 'Please upload a CV file'
      });
    }

    const cvText = extractText(parts.cv.content, parts.cv.filename);

    if (!cvText.trim()) {
      return res.status(400).json({
        error: 'Empty CV',
        message: 'Could not extract text from the CV file'
      });
    }

    console.log('Processing alignment...');
    console.log('JD length:', jobDescriptionText.length);
    console.log('CV length:', cvText.length);

    // Call Claude to align
    const alignedData = await alignCV(jobDescriptionText, cvText);

    // Return the aligned JSON (client will need to handle document generation)
    return res.status(200).json({
      success: true,
      candidateName: alignedData.name,
      alignedCV: alignedData
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Processing failed',
      message: error.message
    });
  }
};
