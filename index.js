const PManagerScraper = require("./src/scraper");

async function main() {
	const scraper = new PManagerScraper();
	await scraper.run();
}

// Run if called directly
if (require.main === module) {
	main().catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
}

module.exports = main;
