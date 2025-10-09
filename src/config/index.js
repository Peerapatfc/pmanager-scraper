require("dotenv").config();

const config = {
	// PManager credentials
	pmanager: {
		username: process.env.TEST_USERNAME,
		password: process.env.TEST_PASSWORD,
		baseUrl: "https://www.pmanager.org",
	},

	// Google Sheets configuration
	googleSheets: {
		serviceAccountPath:
			process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "service-account.json",
		spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
	},

	// Scraper configuration
	scraper: {
		testMode: process.env.TEST_MODE === "true",
		excludeColumns: ["Wage", "Ask. Price", "Deadline", ""],
		delays: {
			betweenPages: 100, // Reduced from 300ms
			betweenPlayers: 50, // Reduced from 200ms
			afterPageLoad: 200, // Reduced from 500ms
		},
	},

	// Telegram configuration
	telegram: {
		botToken: process.env.TELEGRAM_BOT_TOKEN,
		chatId: process.env.TELEGRAM_CHAT_ID,
		enabled: process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID,
	},

	// Web server configuration
	server: {
		port: process.env.PORT || 8080,
		secretKey: process.env.CRON_SECRET_KEY || "change-this-secret-key",
	},

	// Browser configuration
	browser: {
		headless: true,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage", // Overcome limited resource problems
			"--disable-gpu",
			"--disable-software-rasterizer",
			"--disable-extensions",
			"--disable-background-networking",
			"--disable-background-timer-throttling",
			"--disable-backgrounding-occluded-windows",
			"--disable-breakpad",
			"--disable-component-extensions-with-background-pages",
			"--disable-features=TranslateUI,BlinkGenPropertyTrees",
			"--disable-ipc-flooding-protection",
			"--disable-renderer-backgrounding",
			"--enable-features=NetworkService,NetworkServiceInProcess",
			"--force-color-profile=srgb",
			"--hide-scrollbars",
			"--metrics-recording-only",
			"--mute-audio",
			"--no-first-run",
			"--disable-blink-features=AutomationControlled",
			"--single-process", // Run in single process to save memory
		],
	},
};

// Validate required configuration
function validateConfig() {
	const errors = [];

	if (!config.pmanager.username) {
		errors.push("TEST_USERNAME is required");
	}
	if (!config.pmanager.password) {
		errors.push("TEST_PASSWORD is required");
	}

	if (errors.length > 0) {
		throw new Error(`Configuration errors:\n${errors.join("\n")}`);
	}
}

module.exports = { config, validateConfig };
