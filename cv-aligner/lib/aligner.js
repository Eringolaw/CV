/**
 * Claude API Integration for CV Alignment
 * Analyzes job descriptions and CVs to create aligned content
 */

const https = require('https');

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
 * Make a request to the Claude API
 * @param {object} requestBody - The API request body
 * @returns {Promise<object>} - The API response
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

/**
 * Align a CV to a job description using Claude API
 * @param {string} jobDescription - The target job description text
 * @param {string} cvText - The candidate's current CV text
 * @returns {Promise<object>} - Aligned CV data as JSON object
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
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ]
  });

  // Extract the text content from the response
  const textContent = response.content?.find(block => block.type === 'text');
  if (!textContent) {
    throw new Error('No text content in Claude response');
  }

  // Parse and validate JSON
  let jsonText = textContent.text.trim();

  // Remove markdown code blocks if present
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.slice(7);
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.slice(3);
  }
  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, -3);
  }
  jsonText = jsonText.trim();

  try {
    const cvData = JSON.parse(jsonText);

    // Basic validation
    if (!cvData.name || !cvData.professionalSummary) {
      throw new Error('Missing required fields: name or professionalSummary');
    }

    return cvData;
  } catch (parseError) {
    console.error('JSON Parse Error:', parseError.message);
    console.error('Raw response:', jsonText.substring(0, 500));
    throw new Error(`Failed to parse Claude response as JSON: ${parseError.message}`);
  }
}

module.exports = {
  alignCV
};
