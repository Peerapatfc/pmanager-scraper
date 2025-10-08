# Automated Scraper Setup

This guide explains how to set up the PManager scraper to run automatically every 6 hours.

## Option 1: Using Cron (Simpler)

### Setup
```bash
chmod +x setup-cron.sh
./setup-cron.sh
```

### Schedule
Runs at: 00:00, 06:00, 12:00, 18:00 daily

### Manage
```bash
# View cron jobs
crontab -l

# Edit cron jobs
crontab -e

# Remove all cron jobs
crontab -r
```

## Option 2: Using Launchd (macOS Recommended)

### Setup
```bash
chmod +x setup-launchd.sh
./setup-launchd.sh
```

### Schedule
Runs every 6 hours (21600 seconds) starting from when the job is loaded

### Manage
```bash
# Check if running
launchctl list | grep pmanager

# Stop the job
launchctl unload ~/Library/LaunchAgents/com.pmanager.scraper.plist

# Start the job
launchctl load ~/Library/LaunchAgents/com.pmanager.scraper.plist

# Remove completely
launchctl unload ~/Library/LaunchAgents/com.pmanager.scraper.plist
rm ~/Library/LaunchAgents/com.pmanager.scraper.plist
```

## Manual Run

You can always run the scraper manually:
```bash
./run-scraper.sh
```

Or directly:
```bash
node scrape-all-with-details.js
```

## Logs

All automated runs are logged to the `logs/` directory:
- `scraper-YYYYMMDD-HHMMSS.log` - Individual run logs
- `launchd-stdout.log` - Launchd standard output (if using launchd)
- `launchd-stderr.log` - Launchd error output (if using launchd)

Only the last 30 log files are kept automatically.

## Troubleshooting

### Cron not working?
1. Check if cron has Full Disk Access in System Preferences > Security & Privacy > Privacy
2. Check logs: `grep CRON /var/log/system.log`

### Launchd not working?
1. Check status: `launchctl list | grep pmanager`
2. Check logs in `logs/launchd-stderr.log`
3. Verify plist syntax: `plutil -lint ~/Library/LaunchAgents/com.pmanager.scraper.plist`

### Environment variables not loading?
Make sure your `.env` file is in the project directory and readable by the script.

## Notes

- The scraper takes approximately 38-40 minutes to complete
- Make sure your computer is on and not sleeping when the job runs
- For 24/7 operation, consider disabling sleep mode or running on a server
