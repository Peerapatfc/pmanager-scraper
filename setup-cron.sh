#!/bin/bash

# Get the absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_PATH="$PROJECT_DIR/run-scraper.sh"

echo "Setting up cron job for PManager scraper..."
echo "Project directory: $PROJECT_DIR"

# Make the run script executable
chmod +x "$SCRIPT_PATH"

# Create cron entry (runs every 6 hours at :00)
CRON_ENTRY="0 */6 * * * $SCRIPT_PATH"

# Check if cron entry already exists
if crontab -l 2>/dev/null | grep -q "$SCRIPT_PATH"; then
    echo "Cron job already exists. Updating..."
    # Remove old entry and add new one
    (crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH"; echo "$CRON_ENTRY") | crontab -
else
    echo "Adding new cron job..."
    # Add new entry
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
fi

echo ""
echo "✅ Cron job installed successfully!"
echo ""
echo "Schedule: Every 6 hours (at 00:00, 06:00, 12:00, 18:00)"
echo "Script: $SCRIPT_PATH"
echo ""
echo "To view your cron jobs: crontab -l"
echo "To remove this cron job: crontab -e (then delete the line)"
echo ""
echo "Logs will be saved to: $PROJECT_DIR/logs/"
