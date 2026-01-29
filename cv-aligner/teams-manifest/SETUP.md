# Teams App Setup Instructions

## Quick Setup (Personal Use)

If you just want to add the tool to a single channel:

1. Deploy the app to Vercel (see main README)
2. In Teams, click **+** on a channel tab
3. Select **Website** → paste your Vercel URL
4. Done!

---

## Organization-Wide Deployment

For IT admins to deploy across the company:

### Step 1: Prepare the Manifest

1. **Generate a unique GUID** at https://www.guidgenerator.com/
2. **Edit `manifest.json`:**
   - Replace `REPLACE-WITH-NEW-GUID` with your generated GUID
   - Replace all `REPLACE-WITH-YOUR-VERCEL-URL` with your actual Vercel URL (without https://)

### Step 2: Create Icons

Create two PNG icons:
- `icon-color.png` - 192x192 pixels (full color Noviam logo)
- `icon-outline.png` - 32x32 pixels (white outline version)

Place both in this folder.

### Step 3: Create the App Package

Zip the contents of this folder:
```
manifest.json
icon-color.png
icon-outline.png
```

Name it `cv-aligner-teams.zip`

### Step 4: Upload to Teams

**Option A: Sideload (for testing)**
1. In Teams, click **Apps** → **Manage your apps**
2. Click **Upload an app** → **Upload a custom app**
3. Select your zip file

**Option B: Admin Center (organization-wide)**
1. Go to https://admin.teams.microsoft.com
2. Navigate to **Teams apps** → **Manage apps**
3. Click **Upload new app**
4. Upload your zip file
5. Configure permissions and availability

---

## Troubleshooting

**"App didn't load"**
- Ensure your Vercel URL is in the `validDomains` array
- Check that the URL uses HTTPS

**"Content blocked"**
- Your Vercel app may need to set proper CORS headers
- Add `X-Frame-Options: ALLOWALL` if needed

**Users can't find the app**
- Admin needs to approve the app in Teams Admin Center
- Check app permission policies
