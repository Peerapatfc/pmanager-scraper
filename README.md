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

```bash
# Edit crontab
crontab -e

# Add this line (runs at 8 AM and 8 PM)
0 8,20 * * * cd /path/to/pmanager-scraper && node find-deals.js >> logs/cron.log 2>&1
```

### Option 2: Render.com + cron-job.org (Recommended)

1. Deploy to Render (see below)
2. Sign up at https://cron-job.org (free)
3. Create cron job:
   - URL: `https://your-app.onrender.com/find-deals?key=YOUR_SECRET`
   - Schedule: `0 */12 * * *` (every 12 hours)

### Option 3: Windows Task Scheduler

1. Open Task Scheduler
2. Create two triggers: 8 AM and 8 PM daily
3. Action: Run `node.exe find-deals.js`

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

### Trigger Scraper

```bash
GET /trigger?key=YOUR_SECRET_KEY
```

Starts the player scraper (uploads to Google Sheets).

### Find Deals

```bash
GET /find-deals?key=YOUR_SECRET_KEY
```

Starts the deal finder (sends to Telegram).

### Check Status

```bash
GET /status
```

Returns last run information and current status.

**Security:** All trigger endpoints require the secret key from `CRON_SECRET_KEY`.

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

### Memory Issues

Increase Node.js memory:
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
# Run everything (scraper + deal finder)
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

| Task | Players | Time |
|------|---------|------|
| Test Mode | 1 | ~10 sec |
| Scraper | ~1,118 | ~38 min |
| Deal Finder | ~1,118 | ~40 min |
| Both | ~1,118 | ~80 min |

---

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

Made with ❤️ for PManager enthusiasts
