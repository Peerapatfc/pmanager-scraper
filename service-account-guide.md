# How to Create and Download Google Service Account Key

## Step-by-Step Instructions:

### 1. Go to Google Cloud Console
- Open: https://console.cloud.google.com/
- Make sure you're in project: **pmanager-474416**

### 2. Navigate to Service Accounts
- Click the hamburger menu (☰) in the top-left
- Go to: **IAM & Admin** → **Service Accounts**
- Or direct link: https://console.cloud.google.com/iam-admin/serviceaccounts

### 3. Create a New Service Account
- Click **+ CREATE SERVICE ACCOUNT** button at the top
- Fill in the details:
  - **Service account name**: `pmanager-scraper` (or any name you like)
  - **Service account ID**: Will auto-generate (e.g., `pmanager-scraper@pmanager-474416.iam.gserviceaccount.com`)
  - **Description**: `Service account for scraping PManager data to Google Sheets`
- Click **CREATE AND CONTINUE**

### 4. Grant Permissions (Optional)
- You can skip this step by clicking **CONTINUE**
- Or select **Basic** → **Editor** if you want broader access
- Click **CONTINUE**

### 5. Create and Download the Key
- In the third step, click **+ CREATE KEY**
- Select **JSON** as the key type
- Click **CREATE**
- **The JSON file will automatically download to your computer**
- The file will be named something like: `pmanager-474416-abc123def456.json`

### 6. Replace Your Current File
- Rename the downloaded file to: `service-account.json`
- Move it to your project directory (replace the existing one)
- Or keep the original name and update your `.env` file:
  ```
  GOOGLE_SERVICE_ACCOUNT_PATH=pmanager-474416-abc123def456.json
  ```

### 7. Copy the Service Account Email
- After creating the service account, you'll see an email like:
  `pmanager-scraper@pmanager-474416.iam.gserviceaccount.com`
- **Copy this email** - you'll need it in the next step

### 8. Share Your Google Sheet with the Service Account
- Open your Google Sheet (or create a new one)
- Click the **Share** button
- Paste the service account email
- Give it **Editor** access
- Click **Send** (you can uncheck "Notify people")

### 9. Enable Google Sheets API
- Go to: https://console.cloud.google.com/apis/library
- Search for: **Google Sheets API**
- Click on it and click **ENABLE** (if not already enabled)

### 10. Test Your Setup
Run the scraper:
```bash
npm run scrape-to-sheets
```

---

## Troubleshooting:

### Can't Find "Create Key" Button?
- Make sure you clicked on the service account name (not the checkbox)
- Go to the **KEYS** tab
- Click **ADD KEY** → **Create new key**
- Select **JSON** and click **CREATE**

### Download Didn't Start?
- Check your browser's download folder
- Check if pop-ups are blocked
- Try a different browser (Chrome works best)
- The file should be around 2-3 KB in size

### File Format Check
Your service account JSON should look like this:
```json
{
  "type": "service_account",
  "project_id": "pmanager-474416",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "pmanager-scraper@pmanager-474416.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

**Key indicators it's correct:**
- ✅ Has `"type": "service_account"`
- ✅ Has `"client_email"` field
- ✅ Has `"private_key"` field
- ✅ File size is 2-3 KB

---

## Quick Links:
- Service Accounts: https://console.cloud.google.com/iam-admin/serviceaccounts?project=pmanager-474416
- APIs & Services: https://console.cloud.google.com/apis/dashboard?project=pmanager-474416
- Google Sheets API: https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=pmanager-474416
