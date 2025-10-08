#!/bin/bash

# Setup cron job for PManager scraper to run every 6 hours on Linux server
# This script will add a cron job to run the scraper at: 00:00, 06:00, 12:00, 18:00

# Get the current directory (where the script is located)
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Find PHP path
PHP_PATH=$(which php)
if [ -z "$PHP_PATH" ]; then
    echo "❌ PHP not found in PATH. Please install PHP first."
    exit 1
fi

echo "📍 Project directory: $PROJECT_DIR"
echo "🐘 PHP path: $PHP_PATH"
echo ""

# Create the cron job entry
CRON_JOB="0 */6 * * * cd $PROJECT_DIR && $PHP_PATH scrape-all-with-details.php >> $LOG_DIR/scraper.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "scrape-all-with-details.php"; then
    echo "⚠️  Cron job already exists. Removing old one..."
    crontab -l 2>/dev/null | grep -v "scrape-all-with-details.php" | crontab -
fi

# Add the new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job added successfully!"
echo ""
echo "📋 Schedule: Every 6 hours (00:00, 06:00, 12:00, 18:00)"
echo "📁 Logs: $LOG_DIR/scraper.log"
echo "📁 Error logs: $LOG_DIR/scraper-error.log"
echo ""
echo "Cron entry added:"
echo "  $CRON_JOB"
echo ""
echo "To view current cron jobs:"
echo "  crontab -l"
echo ""
echo "To view logs:"
echo "  tail -f $LOG_DIR/scraper.log"
echo ""
echo "To remove the cron job:"
echo "  crontab -l | grep -v 'scrape-all-with-details.php' | crontab -"
