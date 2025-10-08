# Quick Start Guide

## What This Does

Automatically scrapes PManager player data every 6 hours and saves it to Google Sheets.

## Files You Need

✅ **Already created:**
- `scrape-all-with-details.js` - Main scraper
- `google-sheets.js` - Google Sheets integration
- `render.yaml` - Render configuration
- `.env` - Your credentials (local only)
- `service-account.json` - Google credentials

## Deploy to Render (Recommended)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/pmanager-scraper.git
git push -u origin main
```

### 2. Deploy on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Click **"Apply"**

### 3. Add Environment Variables

Run this to see your variables:
```bash
./get-render-env-vars.sh
```

Then add them in Render Dashboard → Environment tab.

### 4. Done!

Your scraper will run every 6 hours automatically.

📖 **Full guide:** See `DEPLOYMENT_CHECKLIST.md`

## Run Locally

### One-time setup:
```bash
npm install
npx playwright install chromium
```

### Run scraper:
```bash
node scrape-all-with-details.js
```

### Run tests:
```bash
npm test
```

## Schedule Locally (macOS)

### Using Launchd (Recommended):
```bash
./setup-launchd.sh
```

### Using Cron:
```bash
./setup-cron.sh
```

📖 **Full guide:** See `CRON_SETUP.md`

## Project Structure

```
.
├── scrape-all-with-details.js  # Main scraper
├── google-sheets.js            # Google Sheets API
├── render.yaml                 # Render config
├── .env                        # Local credentials
├── service-account.json        # Google credentials
├── package.json                # Dependencies
└── tests/                      # Playwright tests
```

## Support

- **Render Deployment:** `DEPLOYMENT_CHECKLIST.md`
- **Local Scheduling:** `CRON_SETUP.md`
- **Full Documentation:** `README.md`

## Troubleshooting

### Scraper not working?
1. Check logs in Render Dashboard
2. Verify environment variables are set
3. Test locally first: `node scrape-all-with-details.js`

### Google Sheets not updating?
1. Verify service account has access to the sheet
2. Check `GOOGLE_SPREADSHEET_ID` is correct
3. Ensure `GOOGLE_PRIVATE_KEY` includes full key

### Need help?
Check the detailed guides in the documentation files.
