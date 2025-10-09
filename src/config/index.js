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
			betweenPages: 300,
			betweenPlayers: 200,
			afterPageLoad: 500,
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
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
