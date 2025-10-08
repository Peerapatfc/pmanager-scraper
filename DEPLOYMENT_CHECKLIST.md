# Render Deployment Checklist

Follow these steps to deploy your PManager scraper to Render.

## ✅ Pre-Deployment Checklist

- [ ] Code is working locally (`node scrape-all-with-details.js`)
- [ ] `.gitignore` file exists (protects sensitive files)
- [ ] `render.yaml` file exists
- [ ] Git repository is initialized
- [ ] Code is pushed to GitHub/GitLab/Bitbucket

## 📝 Information You'll Need

Gather these before starting deployment:

### From your `.env` file:
- [ ] `TEST_USERNAME`
- [ ] `TEST_PASSWORD`
- [ ] `GOOGLE_SPREADSHEET_ID`

### From your `service-account.json`:
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` (the "client_email" field)
- [ ] `GOOGLE_PRIVATE_KEY` (the entire "private_key" field)

## 🚀 Deployment Steps

### 1. Push to Git Repository

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/pmanager-scraper.git

# Push
git branch -M main
git push -u origin main
```

### 2. Create Render Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Click **"Connect account"** for your Git provider
4. Select your repository
5. Click **"Apply"**

### 3. Add Environment Variables

In Render Dashboard → Your Service → Environment tab:

```
TEST_USERNAME = your_pmanager_username
TEST_PASSWORD = your_pmanager_password
GOOGLE_SPREADSHEET_ID = your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL = your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n
```

**Important:** For `GOOGLE_PRIVATE_KEY`, copy the entire value from `service-account.json` including the `-----BEGIN` and `-----END` lines.

### 4. Verify Deployment

- [ ] Check **"Logs"** tab for build success
- [ ] Click **"Trigger Run"** to test immediately
- [ ] Verify data appears in Google Sheet
- [ ] Check logs for any errors

## 🔧 Post-Deployment

### Test the Scraper
1. Go to your service in Render
2. Click **"Trigger Run"**
3. Watch the logs
4. Check your Google Sheet for new data

### Monitor Runs
- Logs are available in the **"Logs"** tab
- Each run shows start time, duration, and status
- Errors will appear in red

### Update Schedule (Optional)
Edit `render.yaml` to change the schedule:
```yaml
schedule: "0 */6 * * *"  # Every 6 hours (current)
schedule: "0 */4 * * *"  # Every 4 hours
schedule: "0 0 * * *"    # Daily at midnight
schedule: "0 0,12 * * *" # Twice daily (midnight and noon)
```

Then commit and push:
```bash
git add render.yaml
git commit -m "Update schedule"
git push
```

## 🐛 Troubleshooting

### Build Fails
- Check logs for specific error
- Verify `package.json` has all dependencies
- Ensure Node version is compatible

### Authentication Fails
- Verify all environment variables are set correctly
- Check `GOOGLE_PRIVATE_KEY` includes full key with headers
- Ensure service account has access to the Google Sheet

### Timeout Issues
- Free tier has 15-minute timeout
- Consider upgrading to paid tier ($7/month)
- Or reduce the number of pages scraped

### Need Help?
Check the full guide in `RENDER_DEPLOYMENT.md`

## 📊 Expected Results

After successful deployment:
- ✅ Scraper runs every 6 hours automatically
- ✅ Data is updated in Google Sheet
- ✅ Logs show successful runs
- ✅ No manual intervention needed

## 💰 Cost

**Free Tier:**
- 400 build hours/month
- 15-minute timeout per job
- Sufficient for this use case

**Paid Tier ($7/month):**
- Unlimited build hours
- No timeout
- Priority support
