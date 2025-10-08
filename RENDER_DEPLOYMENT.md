# Deploy to Render

This guide explains how to deploy the PManager scraper to Render as a Cron Job.

## Prerequisites

1. A [Render account](https://render.com) (free tier works)
2. Your code in a Git repository (GitHub, GitLab, or Bitbucket)
3. Google Service Account credentials
4. PManager login credentials

## Step 1: Prepare Your Repository

### Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### Push to GitHub/GitLab
```bash
# For GitHub
git remote add origin https://github.com/YOUR_USERNAME/pmanager-scraper.git
git branch -M main
git push -u origin main
```

**Important:** Make sure `.gitignore` is in place so sensitive files aren't committed!

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your Git repository
4. Render will automatically detect `render.yaml`
5. Click **"Apply"**

### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Cron Job"**
3. Connect your Git repository
4. Configure:
   - **Name:** `pmanager-scraper`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx playwright install --with-deps chromium`
   - **Command:** `node scrape-all-with-details.js`
   - **Schedule:** `0 */6 * * *` (every 6 hours)

## Step 3: Set Environment Variables

In your Render service settings, add these environment variables:

### Required Variables

| Variable | Value | Where to Find |
|----------|-------|---------------|
| `TEST_USERNAME` | Your PManager username | Your .env file |
| `TEST_PASSWORD` | Your PManager password | Your .env file |
| `GOOGLE_SPREADSHEET_ID` | Your Google Sheet ID | Your .env file |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email | service-account.json |
| `GOOGLE_PRIVATE_KEY` | Service account private key | service-account.json |

### How to Add Variables

1. Go to your service in Render Dashboard
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add each variable above

**Important for GOOGLE_PRIVATE_KEY:**
- Copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the line breaks (Render handles this automatically)

## Step 4: Verify Deployment

1. After deployment, go to **"Logs"** tab
2. Wait for the first scheduled run or click **"Trigger Run"** to test
3. Check logs for successful execution
4. Verify data appears in your Google Sheet

## Schedule

The cron job runs every 6 hours at:
- 00:00 UTC
- 06:00 UTC
- 12:00 UTC
- 18:00 UTC

To change the schedule, modify the `schedule` in `render.yaml`:
```yaml
schedule: "0 */6 * * *"  # Every 6 hours
schedule: "0 */4 * * *"  # Every 4 hours
schedule: "0 0 * * *"    # Daily at midnight
```

## Troubleshooting

### Playwright Installation Fails
If you see errors about missing dependencies, the build command should handle it:
```bash
npx playwright install --with-deps chromium
```

### Environment Variables Not Loading
- Make sure all variables are set in Render Dashboard
- Check for typos in variable names
- For `GOOGLE_PRIVATE_KEY`, ensure the entire key is copied including headers

### Scraper Times Out
Render free tier has a 15-minute timeout for cron jobs. If scraping all 38 pages takes longer:
1. Upgrade to paid tier (no timeout)
2. Or reduce the number of pages scraped

### Google Sheets Authentication Fails
- Verify `GOOGLE_SERVICE_ACCOUNT_EMAIL` is correct
- Verify `GOOGLE_PRIVATE_KEY` includes the full key with headers
- Make sure the service account has access to your Google Sheet

## Monitoring

### View Logs
1. Go to your service in Render Dashboard
2. Click **"Logs"** tab
3. View real-time logs of each run

### Manual Trigger
1. Go to your service in Render Dashboard
2. Click **"Trigger Run"** to run immediately

### Check Google Sheet
View your data at:
```
https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID
```

## Cost

- **Free Tier:** 400 build hours/month (sufficient for this use case)
- **Paid Tier:** $7/month for unlimited build hours and no timeout

## Updating the Scraper

1. Make changes to your code locally
2. Commit and push to your repository:
   ```bash
   git add .
   git commit -m "Update scraper"
   git push
   ```
3. Render will automatically redeploy

## Alternative: Run as Web Service with Manual Trigger

If you prefer to trigger the scraper manually via HTTP:

1. Create a simple Express server
2. Add an endpoint to trigger the scraper
3. Deploy as a Web Service instead of Cron Job
4. Call the endpoint when you want to run the scraper

Let me know if you need help setting this up!
