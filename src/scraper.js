const { config, validateConfig } = require("./config");
const Logger = require("./utils/logger");
const BrowserService = require("./services/browser.service");
const ScraperService = require("./services/scraper.service");
const SheetsService = require("./services/sheets.service");

class PManagerScraper {
	constructor() {
		this.browserService = new BrowserService();
		this.scraperService = null;
		this.sheetsService = new SheetsService();
	}

	async run(skipBrowserClose = false) {
		try {
			Logger.info("Starting PManager scraper...");
			validateConfig();

			// Initialize browser
			const page = await this.browserService.launch();
			this.scraperService = new ScraperService(page);

			// Authenticate with Google Sheets
			await this.sheetsService.authenticate();

			// Login to PManager
			await this.browserService.login();

			// Phase 1: Scrape player list
			const { players, enhancedHeaders } = await this.scrapePlayerList();

			// Phase 2: Scrape player details
			await this.scrapePlayerDetails(players, enhancedHeaders);

			// Phase 3: Upload to Google Sheets
			await this.uploadToSheets(players, enhancedHeaders);

			Logger.success("Scraping completed successfully!");

			// Return data for potential reuse
			return {
				players,
				enhancedHeaders,
				browserService: this.browserService,
			};
		} catch (error) {
			Logger.error("Scraping failed", error);
			throw error;
		} finally {
			// Only close browser if not skipping (for reuse)
			if (!skipBrowserClose) {
				await this.browserService.close();
			}
		}
	}

	async scrapePlayerList() {
		Logger.phase(1, "Scraping player list from all pages...");

		await this.browserService.navigateToSearchPage(1);
		const totalPages = await this.browserService.getTotalPages();

		Logger.info(`Found ${totalPages} pages to scrape`);

		const pagesToScrape = config.scraper.testMode ? 1 : totalPages;
		if (config.scraper.testMode) {
			Logger.warning("TEST MODE: Scraping only 1 page");
		}

		const allPlayers = new Map();
		let enhancedHeaders = null;

		for (let pageNum = 1; pageNum <= pagesToScrape; pageNum++) {
			Logger.progress(
				pageNum,
				pagesToScrape,
				`Page ${pageNum}/${pagesToScrape}`,
			);

			await this.browserService.navigateToSearchPage(pageNum);
			const { players, enhancedHeaders: headers } =
				await this.scraperService.scrapePlayerList();

			if (!enhancedHeaders) {
				enhancedHeaders = headers;
			}

			players.forEach((row, id) => allPlayers.set(id, row));

			await this.browserService.page.waitForTimeout(
				config.scraper.delays.betweenPages,
			);
		}

		Logger.success(`Phase 1 complete: ${allPlayers.size} unique players found`);

		return { players: allPlayers, enhancedHeaders };
	}

	async scrapePlayerDetails(players, enhancedHeaders) {
		Logger.phase(2, "Scraping player details...");

		const playerIds = Array.from(players.keys());
		const estimatedTime = Math.ceil((playerIds.length * 2) / 60);
		Logger.info(`Estimated time: ${estimatedTime} minutes`);

		const playerIdsToProcess = config.scraper.testMode
			? playerIds.slice(0, 1)
			: playerIds;

		if (config.scraper.testMode) {
			Logger.warning("TEST MODE: Processing only 1 player");
		}

		const detailColumnIndices = {
			team: enhancedHeaders.indexOf("Team"),
			quality: enhancedHeaders.indexOf("Quality"),
			affected_quality: enhancedHeaders.indexOf("Affected Quality"),
			potential: enhancedHeaders.indexOf("Potential"),
			penalties: enhancedHeaders.indexOf("Penalties"),
			value: enhancedHeaders.indexOf("Value"),
			last_updated: enhancedHeaders.indexOf("Last Updated"),
		};

		let successCount = 0;
		let errorCount = 0;

		// Process in batches to reduce memory usage
		const batchSize = 50;
		for (let i = 0; i < playerIdsToProcess.length; i++) {
			const playerId = playerIdsToProcess[i];
			Logger.progress(
				i + 1,
				playerIdsToProcess.length,
				`Player ${i + 1}/${playerIdsToProcess.length} (ID: ${playerId})`,
			);

			try {
				await this.browserService.navigateToPlayerPage(playerId);
				const details = await this.scraperService.scrapePlayerDetails(playerId);

				const playerRow = players.get(playerId);
				playerRow[detailColumnIndices.team] = details.team;
				playerRow[detailColumnIndices.quality] = details.quality;
				playerRow[detailColumnIndices.affected_quality] =
					details.affectedQuality;
				playerRow[detailColumnIndices.potential] = details.potential;
				playerRow[detailColumnIndices.penalties] = details.penalties;
				playerRow[detailColumnIndices.value] = details.value;
				playerRow[detailColumnIndices.last_updated] = details.lastUpdated;

				successCount++;
				Logger.detail(
					`✅ Success - Team: ${details.team}, Quality: ${details.quality}`,
				);
			} catch (error) {
				errorCount++;
				Logger.detail(`❌ Error: ${error.message}`);
			}

			await this.browserService.page.waitForTimeout(
				config.scraper.delays.betweenPlayers,
			);

			// Force garbage collection every batch
			if ((i + 1) % batchSize === 0 && global.gc) {
				global.gc();
			}
		}

		Logger.success(
			`Phase 2 complete: ${successCount} success, ${errorCount} errors`,
		);
	}

	async uploadToSheets(players, enhancedHeaders) {
		Logger.phase(3, "Uploading to Google Sheets...");

		const spreadsheetTitle = `PManager Players - ${new Date().toISOString().split("T")[0]}`;
		const spreadsheetId = await this.sheetsService.ensureSpreadsheet(
			config.googleSheets.spreadsheetId,
			spreadsheetTitle,
		);

		const sheetName = "All_Transfer_Players";
		const allPlayerRows = Array.from(players.values());
		const playerIdColumnIndex = enhancedHeaders.findIndex(
			(h) => h === "PlayerID",
		);

		await this.sheetsService.uploadData(
			spreadsheetId,
			sheetName,
			enhancedHeaders,
			allPlayerRows,
			playerIdColumnIndex,
		);

		Logger.success(
			`Complete! ${players.size} players with full details uploaded`,
		);
		Logger.info(
			`View: https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
		);
	}
}

module.exports = PManagerScraper;
