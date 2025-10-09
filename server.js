const express = require("express");
const PManagerScraper = require("./src/scraper");
const DealFinder = require("./src/deal-finder");
const { config } = require("./src/config");
const Logger = require("./src/utils/logger");

const app = express();
const PORT = config.server.port;
const SECRET_KEY = config.server.secretKey;

let lastRun = null;
let isRunning = false;

// Middleware
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
	res.json({
		status: "ok",
		service: "PManager Scraper",
		version: "2.0.0",
		node_version: process.version,
		test_mode: config.scraper.testMode,
		endpoints: {
			"/": "Health check",
			"/trigger?key=SECRET": "Trigger scraper",
			"/find-deals?key=SECRET": "Find best deals",
			"/status": "Check status",
		},
	});
});

// Trigger everything endpoint (scraper + deal finder)
app.get("/trigger", async (req, res) => {
	const providedKey = req.query.key;

	if (providedKey !== SECRET_KEY) {
		return res.status(403).json({ error: "Unauthorized" });
	}

	if (isRunning) {
		return res.status(429).json({ error: "Task is already running" });
	}

	// Set headers for streaming response
	res.setHeader("Content-Type", "text/plain");
	res.setHeader("Transfer-Encoding", "chunked");

	res.write("🚀 Starting complete analysis (scraper + deal finder)...\n\n");

	isRunning = true;
	const startTime = new Date();
	let browserService = null;

	try {
		// Capture console output
		const originalLog = console.log;
		const originalError = console.error;

		console.log = (...args) => {
			const message = `${args.join(" ")}\n`;
			res.write(message);
			originalLog(...args);
		};

		console.error = (...args) => {
			const message = `${args.join(" ")}\n`;
			res.write(message);
			originalError(...args);
		};

		// Step 1: Run scraper (keep browser open)
		res.write("📊 STEP 1: Scraping all player data...\n\n");
		const scraper = new PManagerScraper();
		const { players, browserService: browser } = await scraper.run(true);
		browserService = browser;

		res.write(`\n${"=".repeat(80)}\n\n`);

		// Step 2: Run deal finder (reuse data and browser)
		res.write("🎯 STEP 2: Finding best transfer deals...\n");
		res.write(
			"♻️  Reusing scraped player data (no need to scrape again)...\n\n",
		);
		const dealFinder = new DealFinder();
		await dealFinder.run(players, browserService);

		// Close browser
		if (browserService) {
			await browserService.close();
		}

		console.log = originalLog;
		console.error = originalError;

		const endTime = new Date();
		const duration = Math.round((endTime - startTime) / 1000);
		const minutes = Math.floor(duration / 60);

		res.write(`\n${"=".repeat(80)}\n`);
		res.write(`✅ All tasks completed successfully in ${minutes} minutes!\n`);
		res.write(`${"=".repeat(80)}\n\n`);
		res.write("📋 Summary:\n");
		res.write("  ✅ Player data uploaded to Google Sheets\n");
		res.write("  ✅ Top 20 deals identified\n");
		res.write("  ✅ Results sent to Telegram (if configured)\n");
		res.write("  ⚡ Optimized: Scraped player list only once!\n");

		lastRun = {
			timestamp: new Date().toISOString(),
			status: "success",
			duration: `${minutes}m`,
		};
	} catch (error) {
		res.write(`\n❌ Error: ${error.message}\n`);

		lastRun = {
			timestamp: new Date().toISOString(),
			status: "error",
			error: error.message,
		};
	} finally {
		// Make sure browser is closed
		if (browserService) {
			try {
				await browserService.close();
			} catch (e) {
				// Ignore close errors
			}
		}
		isRunning = false;
		res.end();
	}
});

// Deal finder endpoint
app.get("/find-deals", async (req, res) => {
	// Check secret key
	if (req.query.key !== config.server.secretKey) {
		Logger.warning("Unauthorized deal finder attempt");
		return res.status(401).json({ error: "Unauthorized" });
	}

	// Check if already running
	if (isRunning) {
		return res.status(429).json({
			error: "Task already running",
			message: "Please wait for current run to complete",
		});
	}

	try {
		isRunning = true;
		const startTime = new Date();

		// Stream response
		res.writeHead(200, {
			"Content-Type": "text/plain; charset=utf-8",
			"Transfer-Encoding": "chunked",
		});

		res.write("🎯 Starting deal finder...\n\n");

		// Capture console output
		const originalLog = console.log;
		const originalError = console.error;

		console.log = (...args) => {
			const message = `${args.join(" ")}\n`;
			res.write(message);
			originalLog(...args);
		};

		console.error = (...args) => {
			const message = `${args.join(" ")}\n`;
			res.write(message);
			originalError(...args);
		};

		const DealFinder = require("./src/deal-finder");
		const finder = new DealFinder();
		const deals = await finder.run();

		console.log = originalLog;
		console.error = originalError;

		const endTime = new Date();
		const duration = Math.round((endTime - startTime) / 1000);

		res.write(`\n✅ Completed successfully in ${duration} seconds!\n`);
		res.write(`📊 Found ${deals.length} deals\n`);

		lastRun = {
			timestamp: new Date().toISOString(),
			status: "success",
			duration: `${duration}s`,
			deals: deals.length,
		};
	} catch (error) {
		res.write(`\n❌ Error: ${error.message}\n`);

		lastRun = {
			timestamp: new Date().toISOString(),
			status: "error",
			error: error.message,
		};
	} finally {
		isRunning = false;
		res.end();
	}
});

// Status endpoint
app.get("/status", (req, res) => {
	res.json({
		last_run: lastRun,
		is_running: isRunning,
		test_mode: config.scraper.testMode,
		server_time: new Date().toISOString(),
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
	Logger.error("Server error", err);
	res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
	Logger.success(`Server running on port ${PORT}`);
	Logger.info("Endpoints:");
	Logger.info("  GET  /              - Health check");
	Logger.info("  GET  /trigger       - Trigger scraper (requires ?key=SECRET)");
	Logger.info("  GET  /find-deals    - Find best deals (requires ?key=SECRET)");
	Logger.info("  GET  /status        - Check last run status");
	Logger.info("");
	Logger.info(`Test mode: ${config.scraper.testMode ? "ENABLED" : "DISABLED"}`);
});
