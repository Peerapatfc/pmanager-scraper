# PManager Scraper - PHP Version

PHP web scraper for PManager player data with Google Sheets integration.

## Requirements

- PHP 8.1 or higher
- Composer
- Chrome/Chromium browser
- ChromeDriver (automatically managed by Symfony Panther)

## Setup

1. Install dependencies:
   ```bash
   composer install
   ```

2. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

3. Add your credentials to `.env`:
   ```
   TEST_USERNAME=your_username
   TEST_PASSWORD=your_password
   GOOGLE_SERVICE_ACCOUNT_PATH=service-account.json
   ```

4. Set up Google Sheets API:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google Sheets API
   - Create a Service Account
   - Download the JSON key file and save as `service-account.json`
   - Share your Google Sheet with the service account email

## Usage

Run the scraper:
```bash
php scrape-all-with-details.php
```

Or use Composer:
```bash
composer scrape
```

## Features

- **Multi-phase scraping**: 
  - Phase 1: Scrapes player list from all search result pages
  - Phase 2: Fetches detailed information for each player
  - Phase 3: Uploads to Google Sheets with upsert logic

- **Google Sheets Integration**:
  - Automatic spreadsheet creation
  - Upsert functionality (updates existing, adds new)
  - Formatted headers with colors
  - Auto-resized columns

- **Robust scraping**:
  - Headless Chrome automation
  - Automatic retry logic
  - Progress tracking
  - Error handling

## Cron Setup

To run automatically, add to crontab:

```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/project && php scrape-all-with-details.php >> logs/scraper.log 2>&1
```

## Project Structure

```
.
├── composer.json              # PHP dependencies
├── .env                       # Environment configuration
├── scrape-all-with-details.php # Main scraper script
├── src/
│   └── GoogleSheetsManager.php # Google Sheets integration
└── service-account.json       # Google service account credentials
```

## Differences from Node.js Version

- Uses **Symfony Panther** instead of Playwright
- Uses **Google API PHP Client** instead of googleapis npm package
- Native PHP instead of JavaScript
- Same functionality and features

## Troubleshooting

**ChromeDriver issues:**
```bash
# Panther will auto-download ChromeDriver, but if issues occur:
composer require --dev dbrekelmans/bdi
vendor/bin/bdi detect drivers
```

**Memory issues:**
```bash
php -d memory_limit=512M scrape-all-with-details.php
```

**Permission errors:**
```bash
chmod +x scrape-all-with-details.php
```
