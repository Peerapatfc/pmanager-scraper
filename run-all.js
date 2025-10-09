#!/usr/bin/env node

/**
 * Run All - Combined Scraper and Deal Finder
 *
 * Runs both:
 * 1. Player scraper (uploads to Google Sheets)
 * 2. Deal finder (finds best deals and sends to Telegram)
 *
 * Usage:
 *   node run-all.js
 *   npm run all
 */

const PManagerScraper = require("./src/scraper");
const DealFinder = require("./src/deal-finder");
const Logger = require("./src/utils/logger");

async function main() {
	try {
		console.log(`\n${"=".repeat(80)}`);
		console.log("🚀 RUNNING COMPLETE PMANAGER ANALYSIS");
		console.log(`${"=".repeat(80)}\n`);

		// Step 1: Run player scraper
		console.log("📊 STEP 1: Scraping all player data...\n");
		const scraper = new PManagerScraper();
		await scraper.run();

		console.log(`\n${"=".repeat(80)}\n`);

		// Step 2: Run deal finder
		console.log("🎯 STEP 2: Finding best transfer deals...\n");
		const dealFinder = new DealFinder();
		await dealFinder.run();

		console.log(`\n${"=".repeat(80)}`);
		console.log("✅ ALL TASKS COMPLETED SUCCESSFULLY!");
		console.log(`${"=".repeat(80)}\n`);

		console.log("📋 Summary:");
		console.log("  ✅ Player data uploaded to Google Sheets");
		console.log("  ✅ Top 20 deals identified");
		console.log("  ✅ Results sent to Telegram (if configured)\n");

		process.exit(0);
	} catch (error) {
		Logger.error("Fatal error", error);
		process.exit(1);
	}
}

main();
