# Noviam CV Alignment Tool

A web application that aligns candidate CVs to job descriptions using AI, generating Noviam-branded Word documents.

## Features

- Upload job descriptions (PDF, DOCX, or TXT) or paste text directly
- Upload candidate CVs (PDF or DOCX)
- AI-powered analysis and alignment using Claude
- Generates professionally formatted Noviam-branded documents
- Clean, responsive web interface

## Prerequisites

- Node.js 18 or higher
- An Anthropic API key ([get one here](https://console.anthropic.com/))

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure your API key:**
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Add Job Description:** Either upload a file or paste the job description text
2. **Upload CV:** Select the candidate's current resume (PDF or DOCX)
3. **Click "Align CV":** Wait 30-60 seconds for processing
4. **Download:** Click the download button to get the aligned, Noviam-branded CV

## Project Structure

```
cv-aligner/
├── server.js           # Express server
├── package.json        # Dependencies
├── .env                # Configuration (create from .env.example)
├── public/             # Frontend files
│   ├── index.html      # Main page
│   ├── styles.css      # Styling
│   └── app.js          # Frontend logic
├── lib/                # Backend libraries
│   ├── extractor.js    # PDF/DOCX text extraction
│   ├── aligner.js      # Claude API integration
│   └── generator.js    # Document generation
├── scripts/
│   └── generate_cv.js  # CV document generator
├── assets/
│   └── noviam_logo.png # Noviam logo
├── uploads/            # Temporary uploads (auto-cleaned)
└── output/             # Generated documents (auto-cleaned)
```

## API Endpoints

- `GET /` - Serves the web interface
- `GET /api/health` - Health check endpoint
- `POST /api/align` - Main alignment endpoint
  - `jobDescription` (file) or `jobDescriptionText` (string): The target job description
  - `cv` (file, required): The candidate's CV

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Yes |
| `PORT` | Server port (default: 3000) | No |

## Troubleshooting

**"ANTHROPIC_API_KEY is not configured"**
- Make sure you've created a `.env` file with your API key

**"Unsupported file type"**
- Only PDF, DOCX, and TXT files are supported

**"Could not extract text from the CV file"**
- The PDF might be image-based; try a text-based PDF or DOCX

## Deploying to Vercel (Cloud)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd cv-aligner
   vercel
   ```

4. **Set Environment Variable:**
   ```bash
   vercel env add ANTHROPIC_API_KEY
   # Paste your API key when prompted
   ```

5. **Redeploy with the env variable:**
   ```bash
   vercel --prod
   ```

You'll get a URL like `https://cv-aligner-xxxxx.vercel.app`

---

## Adding to Microsoft Teams

### Option A: Teams Tab (Recommended)

1. **In Teams**, go to the channel where you want to add the tool
2. Click the **+** button next to the channel tabs
3. Select **Website**
4. Enter:
   - **Tab name:** CV Aligner
   - **URL:** Your Vercel URL (e.g., `https://cv-aligner-xxxxx.vercel.app`)
5. Click **Save**

Your team can now access the CV Aligner directly from that channel tab!

### Option B: Teams App Package (For Organization-Wide Deployment)

Create a Teams app manifest for IT to deploy across the organization:

**1. Create `teams-manifest/manifest.json`:**
```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
  "manifestVersion": "1.16",
  "version": "1.0.0",
  "id": "YOUR-UNIQUE-GUID-HERE",
  "packageName": "com.noviam.cvaligner",
  "developer": {
    "name": "Noviam",
    "websiteUrl": "https://noviam.com",
    "privacyUrl": "https://noviam.com/privacy",
    "termsOfUseUrl": "https://noviam.com/terms"
  },
  "name": {
    "short": "CV Aligner",
    "full": "Noviam CV Alignment Tool"
  },
  "description": {
    "short": "Align CVs to job descriptions",
    "full": "AI-powered tool to align candidate CVs to job descriptions and generate Noviam-branded documents."
  },
  "icons": {
    "outline": "icon-outline.png",
    "color": "icon-color.png"
  },
  "accentColor": "#004796",
  "staticTabs": [
    {
      "entityId": "cvaligner",
      "name": "CV Aligner",
      "contentUrl": "https://YOUR-VERCEL-URL.vercel.app",
      "websiteUrl": "https://YOUR-VERCEL-URL.vercel.app",
      "scopes": ["personal"]
    }
  ],
  "permissions": ["identity", "messageTeamMembers"],
  "validDomains": ["YOUR-VERCEL-URL.vercel.app"]
}
```

**2. Create 32x32 and 192x192 PNG icons**

**3. Zip the manifest folder and upload to Teams Admin Center**

---

## License

Proprietary - Noviam Inc. All Rights Reserved.
