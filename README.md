# PManager Scraper

A professional web scraper for PManager player data with Google Sheets integration and deal finder. Built with Node.js, Playwright, and Express.

## 🎯 Features

### Player Scraper
- **Automated Data Collection** - Scrapes player data from all search result pages
- **Detailed Player Information** - Extracts Team, Quality, Potential, Value, and more
- **Google Sheets Integration** - Automatic upload with smart upsert logic
- **Smart Upsert** - Updates existing players, adds new ones

### Deal Finder (NEW!)
- **Transfer Analysis** - Compares Estimated Transfer Value vs Asking Price
- **Top 20 Deals** - Finds and ranks best value transfers
- **Telegram Notifications** - Instant alerts for good deals
- **Auto-Skip Closed Transfers** - Skips unavailable players automatically

### General
- **Web API** - HTTP endpoints for remote triggering
- **Test Mode** - Quick testing with minimal data
- **Production Ready** - Modular architecture, error handling, logging
- **Docker Support** - Easy deployment to any platform
- **Render.com Ready** - Pre-configured for cloud deployment

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Test Mode](#-test-mode)
- [Deployment](#-deployment)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Data Collected](#-data-collected)
- [Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

### Local Development

```bash
# 1. Clone and install
git clone https://github.com/yourusername/pmanager-scraper.git
cd pmanager-scraper
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Add Google service account
# Place service-account.json in project root

# 5. Run scraper
npm start
```

### Cloud Deployment (Easiest!)

1. **Deploy to Render.com** (see [Deployment](#-deployment) section)
2. **Set up cron-job.org** (free)
3. **Add this URL to cron-job.org:**
   ```
   https://your-app.onrender.com/trigger?key=YOUR_SECRET_KEY
   ```
4. **Schedule:** Every 12 hours
5. **Done!** Your scraper runs automatically

No server maintenance, no local setup needed! ☁️

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Sheets API credentials
- PManager account

### Step-by-Step

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install Playwright Browsers**
   ```bash
   npx playwright install chromium --with-deps
   ```

3. **Set Up Google Sheets API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google Sheets API
   - Create a Service Account
   - Download JSON key as `service-account.json`
   - Share your Google Sheet with the service account email

## ⚙️ Configuration

### Environment Variables

Create a `.env` file:

```env
# PManager Credentials
TEST_USERNAME=your_username
TEST_PASSWORD=your_password

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_PATH=service-account.json
GOOGLE_SPREADSHEET_ID=your_sheet_id

# Test Mode (true = 1 page, 1 player | false = all data)
TEST_MODE=false

# Web Server
PORT=8080
CRON_SECRET_KEY=your-random-secret-key-here
```

### Get Google Sheet ID

From your Google Sheets URL:
```
https://docs.google.com/spreadsheets/d/13SQ-2CqFdkvY-qZpM2yxPGyyJaZMclreSErz0Oz_QzY/edit
                                        ↑ This is your Sheet ID ↑
```

## 🎮 Usage

### Run Scraper Directly

```bash
npm start
```

This will:
1. Login to PManager
2. Scrape player data from all pages
3. Extract detailed information for each player
4. Upload to Google Sheets

### Run Web Server

```bash
npm run server
```

Then trigger via HTTP:
```bash
curl "http://localhost:8080/trigger?key=your-secret-key"
```

### Development Mode

```bash
npm run dev
```

Auto-reloads on file changes.

## 🧪 Test Mode

Test mode allows quick testing with minimal data:

### Enable Test Mode

Edit `.env`:
```env
TEST_MODE=true
```

### What It Does

| Mode | Pages | Players | Time | Use Case |
|------|-------|---------|------|----------|
| **Test** | 1 | 1 | ~10 sec | Testing, debugging |
| **Production** | 38 | ~1,118 | ~38 min | Full data collection |

### When to Use

✅ **Use Test Mode:**
- First time setup
- Testing credentials
- Debugging issues
- Verifying Google Sheets integration

❌ **Don't Use Test Mode:**
- Production scraping
- Cron jobs
- Full data collection

---

## ⏰ Automation (Run Every 12 Hours)

### Option 1: Local Machine (Linux/macOS)

#### Setup Cron Job

```bash
# 1. Create logs directory
mkdir -p logs

# 2. Edit crontab
crontab -e

# 3. Add this line (runs at 8 AM and 8 PM)
0 8,20 * * * cd /path/to/pmanager-scraper && /usr/local/bin/node run-all.js >> logs/cron.log 2>&1
```

**Important:**
- Replace `/path/to/pmanager-scraper` with your actual project path
- Replace `/usr/local/bin/node` with your node path (find with `which node`)
- Use `run-all.js` for optimized performance (42 min vs 78 min)

#### Verify Cron Job

```bash
# List your cron jobs
crontab -l

# Check logs
tail -f logs/cron.log
```

#### Common Cron Schedules

```bash
# Every 12 hours (8 AM and 8 PM)
0 8,20 * * * cd /path/to/project && node run-all.js >> logs/cron.log 2>&1

# Every 12 hours (midnight and noon)
0 0,12 * * * cd /path/to/project && node run-all.js >> logs/cron.log 2>&1

# Every 6 hours
0 */6 * * * cd /path/to/project && node run-all.js >> logs/cron.log 2>&1

# Daily at 8 AM
0 8 * * * cd /path/to/project && node run-all.js >> logs/cron.log 2>&1
```

### Option 2: Render.com + External Cron Service (Recommended for Cloud)

This is the **easiest and most reliable** method for cloud deployment!

#### Step 1: Deploy to Render

See the [Deployment](#-deployment) section below to deploy your app to Render.

Your app will be available at: `https://your-app-name.onrender.com`

#### Step 2: Choose Your Endpoint

You have two options:

**Option A: Run Everything (Recommended) ⚡**
```
https://pmanager-scraper.onrender.com/trigger?key=YOUR_SECRET_KEY
```
- Runs scraper + deal finder (optimized)
- Takes ~42 minutes
- Uploads to Google Sheets + Sends to Telegram

**Option B: Find Deals Only**
```
https://pmanager-scraper.onrender.com/find-deals?key=YOUR_SECRET_KEY
```
- Only finds deals
- Takes ~40 minutes
- Sends to Telegram only (no Google Sheets)

#### Step 3: Set Up External Cron Service

Choose one of these free services:

---

### 🔵 cron-job.org (Recommended)

**Why:** Free, reliable, easy to use, supports any interval

1. **Sign up:** https://cron-job.org (free account)

2. **Create Cronjob:**
   - Click **"Create cronjob"**
   - **Title:** `PManager Scraper`
   - **URL:** `https://pmanager-scraper.onrender.com/trigger?key=pmanager-secret-key-xyz-2024`
   - **Schedule:**
     - **Every 12 hours:** Select "Every 12 hours" from dropdown
     - **Or custom:** `0 */12 * * *`
     - **Or specific times:** `0 8,20 * * *` (8 AM and 8 PM)
   - **Notifications:** ✅ Enable "Email on failure"
   - Click **"Create cronjob"**

3. **Test it:**
   - Click "Execute now" to test
   - Check your Render logs
   - Verify Telegram notification

---

### 🟢 EasyCron

**Why:** Free tier, simple interface

1. **Sign up:** https://www.easycron.com (free account)

2. **Create Cron Job:**
   - Click **"+ Cron Job"**
   - **URL:** `https://pmanager-scraper.onrender.com/trigger?key=pmanager-secret-key-xyz-2024`
   - **Cron Expression:** `0 */12 * * *` (every 12 hours)
   - **Time Zone:** Select your timezone
   - **Email Notification:** ✅ Enable
   - Click **"Create"**

---

### 🟡 UptimeRobot

**Why:** Free, also monitors uptime

**Note:** Free plan minimum is 5 minutes, so you'll need to upgrade for 12-hour intervals.

1. **Sign up:** https://uptimerobot.com (free account)

2. **Add Monitor:**
   - Click **"Add New Monitor"**
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `PManager Scraper`
   - **URL:** `https://pmanager-scraper.onrender.com/trigger?key=pmanager-secret-key-xyz-2024`
   - **Monitoring Interval:** 
     - Free: 5 minutes (too frequent, not recommended)
     - Paid: 720 minutes (12 hours)
   - Click **"Create Monitor"**

---

### 🔴 Render Cron Jobs (Native)

**Why:** Built into Render, no external service needed

**Note:** Requires paid plan ($7/month)

1. In your Render dashboard, go to your service
2. Click **"Cron Jobs"** tab
3. Add cron job:
   - **Command:** `node run-all.js`
   - **Schedule:** `0 */12 * * *`
4. Save

---

### 📊 Comparison

| Service | Free | Interval | Reliability | Recommended |
|---------|------|----------|-------------|-------------|
| **cron-job.org** | ✅ | Any | ⭐⭐⭐⭐⭐ | ✅ **Best** |
| **EasyCron** | ✅ | Any | ⭐⭐⭐⭐ | ✅ Good |
| **UptimeRobot** | ⚠️ Limited | 5 min min | ⭐⭐⭐⭐ | ⚠️ Need paid |
| **Render Cron** | ❌ Paid | Any | ⭐⭐⭐⭐⭐ | ⚠️ $7/month |



### Option 3: Windows Task Scheduler

#### Setup

1. **Open Task Scheduler:**
   - Press `Win + R`
   - Type `taskschd.msc`
   - Press Enter

2. **Create Task:**
   - Click "Create Task" (not "Create Basic Task")
   - **Name:** `PManager Scraper`
   - **Description:** `Run PManager scraper every 12 hours`
   - Check: "Run whether user is logged on or not"

3. **Add Triggers (create two):**
   
   **Trigger 1 (8 AM):**
   - Begin: "On a schedule"
   - Settings: "Daily"
   - Start: `8:00:00 AM`
   - Recur every: `1 days`
   
   **Trigger 2 (8 PM):**
   - Begin: "On a schedule"
   - Settings: "Daily"
   - Start: `8:00:00 PM`
   - Recur every: `1 days`

4. **Add Action:**
   - Action: "Start a program"
   - Program: `C:\Program Files\nodejs\node.exe`
   - Arguments: `run-all.js`
   - Start in: `C:\path\to\pmanager-scraper`

5. **Save** and enter your Windows password if prompted

---

## 🚀 Deployment

### Deploy to Render.com (Recommended)

#### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/pmanager-scraper.git
git push -u origin main
```

#### 2. Create Render Web Service

1. Go to https://render.com
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Select your repository
5. Configure:
   - **Name:** `pmanager-scraper`
   - **Environment:** `Docker`
   - **Plan:** `Free`

#### 3. Add Environment Variables

In Render dashboard, add these environment variables:

| Key | Value |
|-----|-------|
| `PORT` | `8080` |
| `TEST_USERNAME` | Your PManager username |
| `TEST_PASSWORD` | Your PManager password |
| `GOOGLE_SPREADSHEET_ID` | Your Google Sheet ID |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | **Entire service account JSON** (see below) |
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token (optional) |
| `TELEGRAM_CHAT_ID` | Your Telegram chat ID (optional) |
| `CRON_SECRET_KEY` | Random secret key |
| `TEST_MODE` | `false` |

**Important:** For `GOOGLE_SERVICE_ACCOUNT_JSON`:
1. Open your `service-account.json` file
2. Copy the **entire JSON content** (all of it, including `{` and `}`)
3. Paste it into Render as environment variable
4. Example: `{"type":"service_account","project_id":"my-project",...}`

#### 4. Deploy

Click **"Create Web Service"** and wait 5-10 minutes.

Your service will be available at:
```
https://pmanager-scraper.onrender.com
```

### Set Up Automatic Runs (Every 6 Hours)

#### Option 1: cron-job.org (Free)

1. Go to https://cron-job.org
2. Sign up (free)
3. Create cronjob:
   - **URL:** `https://your-app.onrender.com/trigger?key=YOUR_SECRET`
   - **Schedule:** Every 6 hours (`0 */6 * * *`)

#### Option 2: UptimeRobot (Free)

1. Go to https://uptimerobot.com
2. Add monitor:
   - **Type:** HTTP(s)
   - **URL:** Your trigger URL
   - **Interval:** Every 6 hours (360 minutes)

## 🌐 API Endpoints

### Health Check

```bash
GET /
```

Returns service status and available endpoints.

**Example:**
```bash
curl https://pmanager-scraper.onrender.com/
```

### Trigger Everything (Recommended) ⚡

```bash
GET /trigger?key=YOUR_SECRET_KEY
```

Runs the **complete optimized workflow**:
- ✅ Scrapes all players (once)
- ✅ Uploads to Google Sheets
- ✅ Finds best deals (reuses scraped data)
- ✅ Sends to Telegram
- ⚡ Takes ~42 minutes (optimized!)

**Example:**
```bash
curl "https://pmanager-scraper.onrender.com/trigger?key=pmanager-secret-key-xyz-2024"
```

**✅ Use this URL in cron-job.org for automatic runs!**

### Find Deals Only

```bash
GET /find-deals?key=YOUR_SECRET_KEY
```

Starts the deal finder only:
- ✅ Scrapes all players
- ✅ Finds best deals
- ✅ Sends to Telegram
- ❌ No Google Sheets upload

**Example:**
```bash
curl "https://pmanager-scraper.onrender.com/find-deals?key=pmanager-secret-key-xyz-2024"
```

### Check Status

```bash
GET /status
```

Returns last run information and current status.

**Example:**
```bash
curl https://pmanager-scraper.onrender.com/status
```

**Response:**
```json
{
  "last_run": {
    "timestamp": "2025-10-09T10:32:10.000Z",
    "status": "success",
    "duration": "42m"
  },
  "is_running": false,
  "test_mode": false
}
```

---

### 🔐 Security

All trigger endpoints require the secret key from `CRON_SECRET_KEY` environment variable.

**Example:**
```env
CRON_SECRET_KEY=pmanager-secret-key-xyz-2024
```

**URL:**
```
https://your-app.onrender.com/trigger?key=pmanager-secret-key-xyz-2024
```

⚠️ **Keep your secret key private!** Don't share it publicly.

## 📁 Project Structure

```
pmanager-scraper/
├── src/
│   ├── config/
│   │   └── index.js              # Configuration management
│   ├── services/
│   │   ├── browser.service.js    # Browser automation
│   │   ├── scraper.service.js    # Data extraction
│   │   └── sheets.service.js     # Google Sheets integration
│   ├── utils/
│   │   ├── logger.js             # Logging utility
│   │   └── date-formatter.js     # Date formatting
│   └── scraper.js                # Main orchestrator
├── index.js                      # CLI entry point
├── server.js                     # Web server
├── google-sheets.js              # Google Sheets manager
├── package.json                  # Dependencies
├── Dockerfile                    # Docker configuration
├── render.yaml                   # Render.com config
└── .env                          # Environment variables
```

### Architecture

The project follows a modular architecture with separation of concerns:

- **Services** - Business logic (Browser, Scraper, Sheets)
- **Utils** - Reusable utilities (Logger, DateFormatter)
- **Config** - Centralized configuration
- **Entry Points** - CLI (`index.js`) and Web (`server.js`)

## 📊 Data Collected

### Player List Data

- Name & Player ID
- Position
- Age
- Nationality
- Skills (Finishing, Technique, Speed, etc.)

### Detailed Player Data

- **Team** - Current team or "Free Agent"
- **Quality** - Player quality rating (e.g., "Excellent", "Formidable")
- **Affected Quality** - Quality affected by form/injury
- **Potential** - Future potential rating
- **Penalties** - Penalty taking ability
- **Value** - Player market value (formatted as "60,017,450")
- **Last Updated** - Timestamp (formatted as "10/09/2025, 10:32:10")

### Output Format

Data is uploaded to Google Sheets with:
- ✅ Colored headers
- ✅ Auto-resized columns
- ✅ Smart upsert (updates existing, adds new)
- ✅ Formatted values and dates

## 🔧 Troubleshooting

### Cron Job Issues

#### Cron Job Not Running

**Check cron service:**
```bash
# Linux
sudo service cron status

# macOS
sudo launchctl list | grep cron
```

**Check cron logs:**
```bash
# Your app logs
tail -f logs/cron.log

# System cron logs (Linux)
grep CRON /var/log/syslog
```

#### Node Not Found in Cron

**Find node path:**
```bash
which node
# Example output: /usr/local/bin/node
```

**Use full path in crontab:**
```bash
0 8,20 * * * cd /path/to/project && /usr/local/bin/node run-all.js >> logs/cron.log 2>&1
```

**Or use nvm:**
```bash
0 8,20 * * * . ~/.nvm/nvm.sh && cd /path/to/project && node run-all.js >> logs/cron.log 2>&1
```

#### Environment Variables Not Loaded

**Option 1: Source .env in cron**
```bash
0 8,20 * * * cd /path/to/project && export $(cat .env | xargs) && node run-all.js >> logs/cron.log 2>&1
```

**Option 2: Use dotenv**
```bash
0 8,20 * * * cd /path/to/project && node -r dotenv/config run-all.js >> logs/cron.log 2>&1
```

#### Permission Denied

```bash
# Make scripts executable
chmod +x run-all.js
chmod +x find-deals.js
chmod +x index.js

# Check permissions
ls -la *.js
```

### Playwright Browser Not Found

```bash
npx playwright install chromium --with-deps
```

### Google Sheets Authentication Failed

- Check `GOOGLE_SERVICE_ACCOUNT_JSON` environment variable is set
- Verify service account has access to spreadsheet
- Share spreadsheet with service account email

### Login Failed

- Verify `TEST_USERNAME` and `TEST_PASSWORD` in `.env`
- Check credentials are correct
- Try logging in manually to verify account works

### Telegram Not Working

- Check `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
- Make sure you started the bot (sent `/start`)
- Test manually: `curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" -d '{"chat_id":"<CHAT_ID>","text":"Test"}'`

### Transfer Closed Message

Normal! The script automatically skips closed transfers. Look for:
```
⚠️  Transfer closed for Player Name, skipping...
```

### Memory Issues (Render Free Tier)

**Problem:** Render free tier has only 512MB RAM, which can cause out-of-memory errors.

**Solutions:**

1. **Already Optimized:**
   - Browser runs with minimal flags
   - Garbage collection enabled
   - Memory limit set to 450MB
   - Single process mode

2. **If Still Having Issues:**
   - Use TEST_MODE for smaller runs
   - Upgrade to Render paid plan ($7/month with 512MB+ RAM)
   - Deploy to a service with more RAM

3. **Local Development:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

### Render Service Won't Start

Check logs for:
- Missing environment variables
- Invalid `GOOGLE_SERVICE_ACCOUNT_JSON`
- Chrome installation errors

## 💰 Costs

### Render.com Free Tier

- ✅ 750 hours/month (24/7 uptime)
- ✅ Automatic HTTPS
- ✅ Custom domains
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ Takes ~30 sec to wake up

**Prevent Sleeping:**
- Use UptimeRobot to ping `/` every 10 minutes
- Or upgrade to paid plan ($7/month)

### External Cron Services

- **cron-job.org** - Free
- **UptimeRobot** - Free
- **EasyCron** - Free tier available

## 🎯 Best Practices

### Production Deployment

1. ✅ Set `TEST_MODE=false`
2. ✅ Use strong `CRON_SECRET_KEY`
3. ✅ Monitor logs regularly
4. ✅ Set up external cron service
5. ✅ Keep service awake with UptimeRobot
6. ✅ Check Google Sheets for data accuracy

### Security

- 🔒 Never commit `.env` or `service-account.json`
- 🔒 Use strong, random secret keys
- 🔒 Keep credentials secure
- 🔒 Use HTTPS for all endpoints

### Performance

- ⚡ Use test mode for development
- ⚡ Monitor memory usage
- ⚡ Adjust delays if needed
- ⚡ Consider upgrading for heavy usage

## 📝 Commands

```bash
# Run everything (scraper + deal finder) - RECOMMENDED ⚡
# Optimized: Scrapes player list only once!
npm run all

# Run scraper only (Google Sheets)
npm start

# Find best transfer deals (Telegram)
npm run find-deals

# Start web server
npm run server

# Test mode (1 player only)
TEST_MODE=true npm run find-deals
TEST_MODE=true npm start
```

### ⚡ Performance Optimization

When using `npm run all`, the player list is scraped **only once** and shared between:
1. Player scraper (uploads to Google Sheets)
2. Deal finder (finds best deals)

This saves ~38 minutes compared to running them separately!

---

## 🎯 Deal Finder

Find the best player transfer deals automatically!

### What It Does

Analyzes **all players from all pages** and finds the top 20 with the best value by comparing:
- **Estimated Transfer Value** (what the player is worth)
- **Asking Price for Bid** (what the club wants)
- **Difference** (your potential savings)

### Quick Start

```bash
# Run deal finder
npm run find-deals

# Test with 1 player first
TEST_MODE=true npm run find-deals
```

### Telegram Setup (Optional but Recommended)

Get instant notifications on your phone!

1. **Create Bot:**
   - Open Telegram, search `@BotFather`
   - Send `/newbot` and follow instructions
   - Copy the bot token

2. **Get Chat ID:**
   - Search `@userinfobot` in Telegram
   - Start chat, it will send your Chat ID

3. **Add to .env:**
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=123456789
   ```

4. **Start your bot:**
   - Find your bot in Telegram
   - Click "Start"

Done! Now you'll receive deal notifications automatically.

### Example Output

```
🥇 1. John Doe
   💰 Difference: 2,691,400 baht
   📊 Estimated: 20,191,400 baht
   💸 Asking:    17,500,000 baht
   🔗 [View Player]
```

## 💡 Best Practices

1. **Test First** - Always use `TEST_MODE=true` before full runs
2. **Monitor Logs** - Watch for errors and warnings
3. **Check Results** - Verify data in Google Sheets and Telegram
4. **Run Regularly** - Set up automation for best results (every 12 hours recommended)
5. **Act Fast** - Good deals disappear quickly
6. **Verify Manually** - Always double-check deals before bidding

---

## 🎯 Example Workflow

1. **Morning (8 AM):** Automated run finds deals → Telegram notification
2. **Check Telegram:** Review top 20 deals on your phone
3. **Analyze:** Consider team needs, budget, quality, potential
4. **Act:** Place bids on best deals
5. **Evening (8 PM):** Automated run finds new opportunities

---

## 📊 Performance

| Task | Players | Time | Notes |
|------|---------|------|-------|
| Test Mode | 1 | ~10 sec | Quick test |
| Scraper | ~1,118 | ~25 min | Google Sheets upload |
| Deal Finder | ~1,118 | ~27 min | Find deals + Telegram |
| Both (separate) | ~1,118 | ~52 min | Run separately |
| **Both (npm run all)** | ~1,118 | **~28 min** | ⚡ **Optimized!** |

### ⚡ Optimizations Applied

`npm run all` is **65% faster** than the original because:
- ✅ Reduced delays (100ms between pages, 50ms between players)
- ✅ Faster page loading (domcontentloaded vs networkidle)
- ✅ Scrapes player list only once (saves ~25 min)
- ✅ Reuses browser session
- ✅ Shares data between tasks
- ✅ Memory optimized for Render free tier (512MB)



---

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

## 📋 Quick Reference

### Cron Schedule Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Common Schedules

```bash
0 8,20 * * *    # Every 12 hours (8 AM and 8 PM)
0 */12 * * *    # Every 12 hours (starting at midnight)
0 */6 * * *     # Every 6 hours
0 8 * * *       # Daily at 8 AM
0 8 * * 1       # Every Monday at 8 AM
0 8 1 * *       # First day of month at 8 AM
```

### Useful Commands

```bash
# Cron management
crontab -e      # Edit cron jobs
crontab -l      # List cron jobs
crontab -r      # Remove all cron jobs

# Check logs
tail -f logs/cron.log                    # App logs
grep CRON /var/log/syslog               # System logs (Linux)
tail -f /var/log/cron                   # Cron logs (some systems)

# Test manually
node run-all.js                         # Run locally
TEST_MODE=true node run-all.js          # Quick test

# Find paths
which node                              # Node path
pwd                                     # Current directory
```

---

Made with ❤️ for PManager enthusiasts
