# Cron Job Setup - Run Scraper Every 6 Hours

## Quick Setup (Automated)

Run the setup script on your server:

```bash
chmod +x setup-cron.sh
./setup-cron.sh
```

This will automatically:
- Detect your PHP path
- Create logs directory
- Add cron job to run every 6 hours (00:00, 06:00, 12:00, 18:00)

## Manual Setup

If you prefer to set it up manually:

### 1. Edit crontab

```bash
crontab -e
```

### 2. Add this line

Replace `/path/to/project` with your actual project path:

```bash
0 */6 * * * cd /path/to/project && /usr/bin/php scrape-all-with-details.php >> /path/to/project/logs/scraper.log 2>&1
```

**Cron schedule explained:**
- `0 */6 * * *` = Every 6 hours at minute 0
- Runs at: 00:00, 06:00, 12:00, 18:00 daily

### 3. Save and exit

- For `nano`: Press `Ctrl+X`, then `Y`, then `Enter`
- For `vi`: Press `Esc`, type `:wq`, press `Enter`

## Alternative Schedules

### Every 4 hours
```bash
0 */4 * * * cd /path/to/project && php scrape-all-with-details.php >> logs/scraper.log 2>&1
```

### Every 12 hours (twice daily)
```bash
0 */12 * * * cd /path/to/project && php scrape-all-with-details.php >> logs/scraper.log 2>&1
```

### Daily at 2 AM
```bash
0 2 * * * cd /path/to/project && php scrape-all-with-details.php >> logs/scraper.log 2>&1
```

### Specific times (e.g., 6 AM and 6 PM)
```bash
0 6,18 * * * cd /path/to/project && php scrape-all-with-details.php >> logs/scraper.log 2>&1
```

## Verify Cron Job

Check if cron job is installed:

```bash
crontab -l
```

## View Logs

```bash
# View latest logs
tail -f logs/scraper.log

# View last 100 lines
tail -n 100 logs/scraper.log

# Search for errors
grep "Error" logs/scraper.log
```

## Remove Cron Job

```bash
crontab -l | grep -v 'scrape-all-with-details.php' | crontab -
```

## Troubleshooting

### Cron not running?

1. **Check cron service is running:**
   ```bash
   sudo service cron status
   # or
   sudo systemctl status cron
   ```

2. **Check PHP path:**
   ```bash
   which php
   ```
   Update cron job with the correct PHP path.

3. **Check permissions:**
   ```bash
   chmod +x scrape-all-with-details.php
   ```

4. **Test manually:**
   ```bash
   cd /path/to/project
   php scrape-all-with-details.php
   ```

5. **Check cron logs:**
   ```bash
   # Ubuntu/Debian
   grep CRON /var/log/syslog
   
   # CentOS/RHEL
   grep CRON /var/log/cron
   ```

### Environment variables not loading?

Cron doesn't load your shell environment. Make sure `.env` file exists in the project directory.

### ChromeDriver issues?

Make sure ChromeDriver is installed:
```bash
cd /path/to/project
php -r "require 'vendor/autoload.php'; echo 'Dependencies OK';"
```

## Server Requirements

- PHP 8.1+
- Composer dependencies installed
- Chrome/Chromium browser
- ChromeDriver (auto-installed by Panther)
- Sufficient memory (512MB+ recommended)
- `.env` file with credentials
- `service-account.json` for Google Sheets

## Production Tips

1. **Use absolute paths** in cron jobs
2. **Redirect output** to log files for debugging
3. **Monitor logs** regularly
4. **Set up log rotation** to prevent disk space issues:
   ```bash
   # Create logrotate config
   sudo nano /etc/logrotate.d/pmanager-scraper
   ```
   
   Add:
   ```
   /path/to/project/logs/*.log {
       daily
       rotate 7
       compress
       missingok
       notifempty
   }
   ```

5. **Add monitoring** (optional):
   - Set up email notifications on cron failures
   - Use monitoring tools like Cronitor or Healthchecks.io
