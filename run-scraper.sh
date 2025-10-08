#!/bin/bash

# Navigate to the script directory
cd "$(dirname "$0")"

# Log file with timestamp
LOG_FILE="logs/scraper-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

# Run the scraper and log output
echo "=== Starting scraper at $(date) ===" >> "$LOG_FILE"
node scrape-all-with-details.js >> "$LOG_FILE" 2>&1
EXIT_CODE=$?
echo "=== Finished at $(date) with exit code $EXIT_CODE ===" >> "$LOG_FILE"

# Keep only last 30 log files
cd logs
ls -t scraper-*.log | tail -n +31 | xargs -r rm --

exit $EXIT_CODE
