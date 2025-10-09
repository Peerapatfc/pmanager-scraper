#!/usr/bin/env node

/**
 * Find Best Player Deals
 *
 * Analyzes all players and finds the top 20 with the best value
 * (Estimated Transfer Value - Asking Price)
 *
 * Usage:
 *   node find-deals.js
 *   npm run find-deals
 */

const DealFinder = require("./src/deal-finder");
const Logger = require("./src/utils/logger");

async function main() {
	try {
		const finder = new DealFinder();
		await finder.run();
		process.exit(0);
	} catch (error) {
		Logger.error("Fatal error", error);
		process.exit(1);
	}
}

main();
