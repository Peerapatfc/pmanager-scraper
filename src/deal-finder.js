const BrowserService = require("./services/browser.service");
const ScraperService = require("./services/scraper.service");
const TelegramService = require("./services/telegram.service");
const Logger = require("./utils/logger");
const { config } = require("./config");

class DealFinder {
	constructor() {
		this.browserService = new BrowserService();
		this.telegramService = config.telegram.enabled
			? new TelegramService(config.telegram.botToken, config.telegram.chatId)
			: null;
	}

	async run() {
		try {
			Logger.info("Starting deal finder...");

			// Launch browser and login
			await this.browserService.launch();
			await this.browserService.login();

			// Navigate to player search and get total pages
			Logger.info("Navigating to player search...");
			await this.browserService.navigateToSearchPage(1);
			const totalPages = await this.browserService.getTotalPages();

			Logger.info(`Found ${totalPages} pages to analyze`);

			const pagesToScrape = config.scraper.testMode ? 1 : totalPages;
			if (config.scraper.testMode) {
				Logger.warning("TEST MODE: Analyzing only page 1");
			}

			// Get all players from all pages
			Logger.info("Scraping player list from all pages...");
			const scraperService = new ScraperService(this.browserService.page);
			const allPlayers = new Map();

			for (let pageNum = 1; pageNum <= pagesToScrape; pageNum++) {
				Logger.info(`Scraping page ${pageNum}/${pagesToScrape}...`);

				await this.browserService.navigateToSearchPage(pageNum);
				const { players } = await scraperService.scrapePlayerList();

				players.forEach((row, id) => allPlayers.set(id, row));

				await this.browserService.page.waitForTimeout(
					config.scraper.delays.betweenPages,
				);
			}

			Logger.info(`Found ${allPlayers.size} total players across all pages`);

			// Analyze deals for each player
			const deals = [];
			let processedCount = 0;
			const playersToCheck = config.scraper.testMode ? 1 : allPlayers.size;

			if (config.scraper.testMode) {
				Logger.warning("TEST MODE: Checking only 1 player");
			}

			for (const [playerId, playerData] of allPlayers) {
				processedCount++;
				const playerName = playerData[0]; // First column is name

				Logger.info(
					`[${processedCount}/${playersToCheck}] Analyzing ${playerName} (ID: ${playerId})`,
				);

				try {
					// Navigate to negotiation page
					const negotiationUrl = `${config.pmanager.baseUrl}/comprar_jog_lista.asp?jg_id=${playerId}`;
					await this.browserService.page.goto(negotiationUrl, {
						timeout: 10000,
					});
					await this.browserService.page.waitForLoadState("networkidle");

					// Scrape negotiation values
					const values = await scraperService.scrapeNegotiationValues(playerId);

					// Skip if transfer is closed
					if (values.closed) {
						Logger.warning(`Transfer closed for ${playerName}, skipping...`);
						continue;
					}

					if (values.difference && values.difference > 0) {
						deals.push({
							playerId,
							name: playerName,
							estimated: values.estimatedTransferValue,
							asking: values.askingPrice,
							difference: values.difference,
							estimatedFormatted: scraperService.formatValue(
								values.estimatedTransferValue,
							),
							askingFormatted: scraperService.formatValue(values.askingPrice),
							differenceFormatted: scraperService.formatValue(
								values.difference,
							),
							url: negotiationUrl,
						});

						Logger.success(
							`Found deal: ${playerName} - Difference: ${scraperService.formatValue(values.difference)} baht`,
						);
					}

					// Delay between requests
					await this.browserService.page.waitForTimeout(
						config.scraper.delays.betweenPlayers,
					);

					// Test mode: only check first player
					if (config.scraper.testMode) {
						Logger.warning("Test mode: stopping after first player");
						break;
					}
				} catch (error) {
					Logger.error(`Failed to analyze player ${playerName}`, error);
				}
			}

			// Sort by difference (highest first)
			deals.sort((a, b) => b.difference - a.difference);

			// Get top 20
			const top20 = deals.slice(0, 20);

			Logger.success(`Found ${deals.length} deals, showing top 20`);

			// Display results
			this.displayResults(top20);

			// Send to Telegram
			if (this.telegramService && top20.length > 0) {
				Logger.info("Sending results to Telegram...");
				await this.telegramService.sendTopDeals(top20);
			} else if (!this.telegramService) {
				Logger.warning(
					"Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID",
				);
			}

			return top20;
		} catch (error) {
			Logger.error("Deal finder failed", error);
			throw error;
		} finally {
			await this.browserService.close();
		}
	}

	displayResults(deals) {
		console.log(`\n${"=".repeat(80)}`);
		console.log("🎯 TOP 20 PLAYER DEALS");
		console.log(`${"=".repeat(80)}\n`);

		if (deals.length === 0) {
			console.log("❌ No deals found\n");
			return;
		}

		deals.forEach((deal, index) => {
			const rank = index + 1;
			const emoji =
				rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "  ";

			console.log(`${emoji} ${rank}. ${deal.name}`);
			console.log(`   💰 Difference: ${deal.differenceFormatted} baht`);
			console.log(`   📊 Estimated: ${deal.estimatedFormatted} baht`);
			console.log(`   💸 Asking:    ${deal.askingFormatted} baht`);
			console.log(`   🔗 ${deal.url}`);
			console.log("");
		});

		console.log(`${"=".repeat(80)}\n`);
	}
}

module.exports = DealFinder;
