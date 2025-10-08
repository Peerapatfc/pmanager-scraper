#!/bin/bash

# Get the absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_FILE="com.pmanager.scraper.plist"
PLIST_PATH="$PROJECT_DIR/$PLIST_FILE"
LAUNCHD_DIR="$HOME/Library/LaunchAgents"
LAUNCHD_PLIST="$LAUNCHD_DIR/$PLIST_FILE"

echo "Setting up launchd job for PManager scraper..."
echo "Project directory: $PROJECT_DIR"

# Make the run script executable
chmod +x "$PROJECT_DIR/run-scraper.sh"

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$LAUNCHD_DIR"

# Replace placeholder with actual path in plist
sed "s|REPLACE_WITH_PROJECT_PATH|$PROJECT_DIR|g" "$PLIST_PATH" > "$LAUNCHD_PLIST"

# Unload existing job if it exists
launchctl unload "$LAUNCHD_PLIST" 2>/dev/null

# Load the new job
launchctl load "$LAUNCHD_PLIST"

echo ""
echo "✅ Launchd job installed successfully!"
echo ""
echo "Schedule: Every 6 hours (21600 seconds)"
echo "Plist: $LAUNCHD_PLIST"
echo ""
echo "To check status: launchctl list | grep pmanager"
echo "To stop: launchctl unload $LAUNCHD_PLIST"
echo "To start: launchctl load $LAUNCHD_PLIST"
echo ""
echo "Logs will be saved to: $PROJECT_DIR/logs/"
