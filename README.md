# Playwright Login Tests

This project contains Playwright tests for the login functionality of https://www.pmanager.org/default.asp

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npm run install:browsers
   ```

3. Copy `.env.example` to `.env` and update with your test credentials:
   ```bash
   cp .env.example .env
   ```

## Running Tests

- Run all tests: `npm test`
- Run tests in headed mode: `npm run test:headed`
- Run tests with UI: `npm run test:ui`
- Run player data scraper: `npm run scrape`

## Important Notes

⚠️ **Before running the tests, you need to:**

1. **Inspect the actual login form** on https://www.pmanager.org/default.asp to get the correct selectors for:
   - Username field
   - Password field
   - Submit button

2. **Update the test selectors** in `tests/login.spec.js` with the actual element selectors from the website

3. **Add valid test credentials** to verify successful login scenarios

4. **Update success/error assertions** based on how the website behaves after login attempts

## Test Structure

- `tests/login.spec.js` - Main login test suite with:
  - Form display validation
  - Valid login test (redirects to player search page)
  - Invalid credentials test
  - Required field validation
  - Post-login redirect verification

## Expected Login Flow

After successful login, the application redirects to:
`https://www.pmanager.org/procurar.asp?action=proc_jog&...` (player search page)

The tests verify this redirect behavior to ensure login is working correctly.

## Data Scraping

The project includes functionality to scrape player data from the search results table:

### Quick Commands:
```bash
npm run scrape              # Scrape single page (30 players)
npm run scrape-to-sheets    # Scrape single page to Google Sheets
npm run scrape-all-pages    # Scrape ALL 38 pages (~1,140 players) to Google Sheets
```

### Using the Test Suite:
The test `should scrape player data from search results table` will extract table data during test execution.

### Using the Standalone Scraper:
```bash
npm run scrape
```

This will:
1. Login to the website
2. Navigate to the player search page
3. Extract all table data
4. Save results to JSON and CSV files
5. Display progress in the console

**Output Files:**
- `scraped-players-YYYY-MM-DD.json` - Complete data with metadata
- `scraped-players-YYYY-MM-DD.csv` - Spreadsheet-friendly format

The scraper handles multiple tables on the page and extracts up to 20 rows from each table for analysis.

## Google Sheets Integration

Automatically upload scraped data to Google Sheets for easy sharing and analysis.

### Setup Google Sheets Access:

**Option 1: Service Account (Recommended for automation)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create a Service Account
5. Download the JSON key file and save as `service-account.json`
6. Share your Google Sheet with the service account email

**Option 2: OAuth2 (For personal use)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 Client ID credentials
3. Add credentials to `.env` file
4. Run setup: `npm run setup-google-auth`

### Usage:

```bash
# Setup authentication (OAuth2 only)
npm run setup-google-auth

# Scrape data directly to Google Sheets
npm run scrape-to-sheets
```

**Features:**
- Creates new spreadsheet or uses existing one
- Separate sheets for each data table
- Automatic formatting (colored headers, auto-resize)
- Includes player IDs in separate columns
- Local JSON backup included

**Environment Variables:**
```bash
# Add to .env file
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_SPREADSHEET_ID=optional_existing_sheet_id
```