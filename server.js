const express = require("express");
const runScraper = require("./index");
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
			"/status": "Check status",
		},
	});
});

// Trigger scraper endpoint
app.get("/trigger", async (req, res) => {
	const providedKey = req.query.key;

	if (providedKey !== SECRET_KEY) {
		return res.status(403).json({ error: "Unauthorized" });
	}

	if (isRunning) {
		return res.status(429).json({ error: "Scraper is already running" });
	}

	// Set headers for streaming response
	res.setHeader("Content-Type", "text/plain");
	res.setHeader("Transfer-Encoding", "chunked");

	res.write("🚀 Starting scraper...\n\n");

	isRunning = true;
	const startTime = new Date();

	try {
		// Capture console output
		const originalLog = console.log;
		const originalError = console.error;

		console.log = (...args) => {
			const message = args.join(" ") + "\n";
			res.write(message);
			originalLog(...args);
		};

		console.error = (...args) => {
			const message = args.join(" ") + "\n";
			res.write(message);
			originalError(...args);
		};

		await runScraper();

		console.log = originalLog;
		console.error = originalError;

		const endTime = new Date();
		const duration = Math.round((endTime - startTime) / 1000);

		res.write(`\n✅ Scraper completed successfully in ${duration} seconds!\n`);

		lastRun = {
			timestamp: new Date().toISOString(),
			status: "success",
			duration: `${duration}s`,
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
	Logger.info("  GET  /status        - Check last run status");
	Logger.info("");
	Logger.info(`Test mode: ${config.scraper.testMode ? "ENABLED" : "DISABLED"}`);
});
