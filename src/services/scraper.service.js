const { config } = require("../config");
const Logger = require("../utils/logger");
const DateFormatter = require("../utils/date-formatter");

class ScraperService {
	constructor(page) {
		this.page = page;
	}

	async scrapePlayerList() {
		const tables = await this.page.locator("table").count();
		const players = new Map();
		let headers = null;
		let enhancedHeaders = null;
		let columnMapping = null;

		for (let tableIndex = 0; tableIndex < tables; tableIndex++) {
			const table = this.page.locator("table").nth(tableIndex);
			const rows = await table.locator("tr").count();

			if (rows > 5) {
				if (!headers) {
					const result = await this.extractHeaders(table);
					headers = result.headers;
					enhancedHeaders = result.enhancedHeaders;
					columnMapping = result.columnMapping;
				}

				const extractedPlayers = await this.extractPlayersFromTable(
					table,
					headers,
					columnMapping,
					rows,
				);
				extractedPlayers.forEach((row, id) => players.set(id, row));

				break;
			}
		}

		return { players, enhancedHeaders };
	}

	async extractHeaders(table) {
		const headers = await table
			.locator("tr")
			.first()
			.locator("th, td")
			.allTextContents();
		const enhancedHeaders = [];
		const columnMapping = [];

		for (let j = 0; j < headers.length; j++) {
			if (config.scraper.excludeColumns.includes(headers[j])) continue;
			columnMapping.push(j);
			enhancedHeaders.push(headers[j]);
		}

		const nameIndex = headers.indexOf("Name");
		if (nameIndex !== -1 && !config.scraper.excludeColumns.includes("Name")) {
			enhancedHeaders.splice(
				enhancedHeaders.indexOf("Name") + 1,
				0,
				"PlayerID",
			);
		}

		// Add detail columns
		enhancedHeaders.push(
			"Team",
			"Quality",
			"Affected Quality",
			"Potential",
			"Penalties",
			"Value",
			"Last Updated",
		);

		return { headers, enhancedHeaders, columnMapping };
	}

	async extractPlayersFromTable(table, headers, columnMapping, rows) {
		const players = new Map();

		for (let i = 1; i < rows; i++) {
			const row = table.locator("tr").nth(i);
			const cells = await row.locator("td").count();
			if (cells === 0) continue;

			const rowData = [];
			let playerId = null;

			for (let j = 0; j < cells; j++) {
				const cell = row.locator("td").nth(j);
				const cellText = await cell.textContent();
				const playerLink = cell.locator('a[href*="ver_jogador.asp?jog_id="]');
				const linkCount = await playerLink.count();

				if (linkCount > 0) {
					const href = await playerLink.getAttribute("href");
					const playerIdMatch = href.match(/jog_id=(\d+)/);
					if (playerIdMatch) playerId = playerIdMatch[1];
				}

				rowData.push(cellText?.trim() || "");
			}

			if (rowData.length > 0 && playerId) {
				const finalRow = [];
				for (const originalIndex of columnMapping) {
					finalRow.push(rowData[originalIndex]);
					if (headers[originalIndex] === "Name") {
						finalRow.push(playerId);
					}
				}

				// Add placeholders for detail columns
				finalRow.push("", "", "", "", "", "", DateFormatter.toHumanReadable());

				players.set(playerId, finalRow);
			}
		}

		return players;
	}

	async scrapePlayerDetails(playerId) {
		const details = {};

		// Team
		const teamLink = await this.page
			.locator('a[href*="ver_equipa"]')
			.first()
			.textContent()
			.catch(() => "");
		details.team = teamLink.trim() || "Free Agent";

		// Quality
		const qualityText = await this.page
			.locator('td:has-text("Quality") + td')
			.first()
			.textContent()
			.catch(() => "");
		details.quality = qualityText.trim();

		// Affected Quality
		const affectedText = await this.page
			.locator('td:has-text("Affected Quality") + td')
			.first()
			.textContent()
			.catch(() => "");
		details.affectedQuality = affectedText.trim();

		// Potential
		const potentialText = await this.page
			.locator(
				'tr:has-text("Potential"):not(:has-text("Next Season")) td:last-child',
			)
			.first()
			.textContent()
			.catch(() => "");
		details.potential = potentialText.trim();

		// Penalties
		const penaltiesText = await this.page
			.locator('td:has-text("Penalties") + td')
			.first()
			.textContent()
			.catch(() => "");
		details.penalties = penaltiesText.trim();

		// Value
		const valueElement = await this.page.evaluate(() => {
			const rows = document.querySelectorAll("tr");
			for (let i = 0; i < rows.length; i++) {
				const cells = rows[i].querySelectorAll("td");
				for (let j = 0; j < cells.length; j++) {
					const cellText = cells[j].textContent.trim();
					if (cellText === "Value") {
						if (j + 2 < cells.length) {
							return cells[j + 2].textContent.trim();
						}
					}
				}
			}
			return "";
		});
		details.value = DateFormatter.formatValue(valueElement);

		// Last updated
		details.lastUpdated = DateFormatter.toHumanReadable();

		return details;
	}

	/**
	 * Scrape negotiation page for transfer values
	 * @param {string} playerId - Player ID
	 * @returns {Promise<object>} Transfer values
	 */
	async scrapeNegotiationValues(playerId) {
		try {
			// Check if transfer is closed (look for the message in font.comentarios)
			const closedMessage = await this.page
				.locator(
					'font.comentarios:has-text("The transfer of this player is already closed")',
				)
				.count();

			if (closedMessage > 0) {
				return { closed: true };
			}

			const values = {};

			// Estimated Transfer Value
			const estimatedText = await this.page
				.locator('td.cabecalhos:has-text("Estimated Transfer Value") + td')
				.first()
				.textContent()
				.catch(() => "");
			values.estimatedTransferValue = this.parseValue(estimatedText);

			// Asking Price for Bid
			const askingText = await this.page
				.locator('td.cabecalhos:has-text("Asking Price for Bid") + td')
				.first()
				.textContent()
				.catch(() => "");
			values.askingPrice = this.parseValue(askingText);

			// Calculate difference
			if (values.estimatedTransferValue && values.askingPrice) {
				values.difference = values.estimatedTransferValue - values.askingPrice;
			}

			return values;
		} catch (error) {
			Logger.error(
				`Failed to scrape negotiation values for player ${playerId}`,
				error,
			);
			return {};
		}
	}

	/**
	 * Parse value string to number
	 * @param {string} text - Text containing value
	 * @returns {number} Parsed value
	 */
	parseValue(text) {
		if (!text) return 0;

		// Extract number from text like "20.191.400 baht"
		const match = text.match(/[\d.]+/);
		if (!match) return 0;

		// Remove dots and parse as integer
		const numberStr = match[0].replace(/\./g, "");
		return Number.parseInt(numberStr, 10) || 0;
	}

	/**
	 * Format number back to readable format
	 * @param {number} value - Number value
	 * @returns {string} Formatted value
	 */
	formatValue(value) {
		if (!value) return "0";
		return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	}
}

module.exports = ScraperService;
