# PManager Scraper

A professional web scraper for PManager player data with Google Sheets integration. Built with Node.js, Playwright, and Express.

## 🎯 Features

- **Automated Data Collection** - Scrapes player data from all search result pages
- **Detailed Player Information** - Extracts Team, Quality, Potential, Value, and more
- **Google Sheets Integration** - Automatic upload with smart upsert logic
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

| Key | Value |
|-----|-------|
| `PORT` | `8080` |
| `TEST_USERNAME` | Your PManager username |
| `TEST_PASSWORD` | Your PManager password |
| `GOOGLE_SPREADSHEET_ID` | Your Google Sheet ID |
| `CRON_SECRET_KEY` | Random secret key |
| `TEST_MODE` | `false` |

#### 4. Add Secret File

- Click **"Secret Files"**
- Add `service-account.json` with your Google credentials

#### 5. Deploy

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

Response:
```json
{
  "status": "ok",
  "service": "PManager Scraper",
  "version": "2.0.0",
  "test_mode": false
}
```

### Trigger Scraper

```bash
GET /trigger?key=YOUR_SECRET_KEY
```

Starts the scraper and streams output in real-time.

**Security:** Requires secret key from `CRON_SECRET_KEY` environment variable.

### Check Status

```bash
GET /status
```

Response:
```json
{
  "last_run": {
    "timestamp": "2025-10-09T10:32:10.000Z",
    "status": "success",
    "duration": "45s"
  },
  "is_running": false,
  "test_mode": false
}
```

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

- Check `service-account.json` exists
- Verify service account has access to spreadsheet
- Share spreadsheet with service account email

### Login Failed

- Verify `TEST_USERNAME` and `TEST_PASSWORD` in `.env`
- Check credentials are correct
- Try logging in manually to verify account works

### Memory Issues

Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Render Service Won't Start

Check logs for:
- Missing environment variables
- Invalid `service-account.json`
- Chrome installation errors

### Scraper Times Out

- Enable `TEST_MODE=true` for faster runs
- Upgrade to paid Render plan for more resources
- Reduce number of pages to scrape

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

## 📝 Scripts

```bash
npm start          # Run scraper once
npm run server     # Start web server
npm run dev        # Development mode with auto-reload
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/pmanager-scraper/issues)
- **Render Docs:** https://render.com/docs
- **Playwright Docs:** https://playwright.dev

## 🎉 Acknowledgments

- Built with [Playwright](https://playwright.dev)
- Powered by [Google Sheets API](https://developers.google.com/sheets/api)
- Deployed on [Render.com](https://render.com)

---

Made with ❤️ for PManager enthusiasts
