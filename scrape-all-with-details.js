const { chromium } = require("playwright");
const GoogleSheetsManager = require("./google-sheets");
require("dotenv").config();

async function scrapeAllWithDetails() {
	const browser = await chromium.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});
	const page = await browser.newPage();
	const sheetsManager = new GoogleSheetsManager();

	try {
		console.log(
			"🚀 Starting complete player data scraping (list + details)...",
		);

		// Authenticate with Google Sheets
		const authSuccess = await sheetsManager.authenticate();
		if (!authSuccess) {
			throw new Error("Google Sheets authentication failed");
		}

		// Login to PManager
		await page.goto("https://www.pmanager.org/default.asp");
		const username = process.env.TEST_USERNAME;
		const password = process.env.TEST_PASSWORD;

		if (!username || !password) {
			throw new Error(
				"Please set TEST_USERNAME and TEST_PASSWORD in .env file",
			);
		}

		console.log("🔐 Logging in to PManager...");
		await page.fill("#loginForm #utilizador", username);
		await page.fill("#loginForm #password", password);
		await page.click('button.btn-login[type="submit"]');
		await page.waitForLoadState("networkidle");

		if (page.url().includes("erro=logout")) {
			throw new Error("Login failed - invalid credentials");
		}

		console.log("✅ Login successful\n");

		// ========== PHASE 1: Scrape player list from all pages ==========
		console.log("📋 PHASE 1: Scraping player list from all pages...");

		const baseSearchUrl =
			"/procurar.asp?action=proc_jog&nome=&pos=0&nacional=-1&lado=-1&idd_op=%3C&idd=Any&temp_op=%3C&temp=Any&expe_op=%3E=&expe=Any&con_op=%3C&con=Any&pro_op=%3E&pro=Any&vel_op=%3E&vel=Any&forma_op=%3E&forma=Any&cab_op=%3E&cab=Any&ord_op=%3C=&ord=Any&cul_op=%3E&cul=Any&pre_op=%3C=&pre=Any&forca_op=%3E&forca=Any&lesionado=Any&prog_op=%3E&prog=Any&tack_op=%3E&tack=Any&internacional=Any&passe_op=%3E&passe=Any&pais=-1&rem_op=%3E&rem=Any&tec_op=%3E&tec=Any&jmaos_op=%3E&jmaos=Any&saidas_op=%3E&saidas=Any&reflexos_op=%3E&reflexos=Any&agilidade_op=%3E&agilidade=Any&B1=Pesquisar&field=&sort=0&pv=1&qual_op=%3E&qual=7&talento=Any";

		await page.goto(`https://www.pmanager.org${baseSearchUrl}&pid=1`);
		await page.waitForLoadState("networkidle");
		await page.waitForSelector("table", { timeout: 10000 });

		// Get total pages
		let totalPages = 1;
		const paginationCell = await page
			.locator('td.team_players:has-text("Number of pages")')
			.textContent()
			.catch(() => null);
		if (paginationCell) {
			const match = paginationCell.match(/Number of pages:\s*(\d+)/);
			if (match) {
				totalPages = Number.parseInt(match[1]);
			}
		}

		console.log(`   Found ${totalPages} pages to scrape`);

		const pagesToScrape = totalPages;

		const allPlayers = new Map();
		const excludeColumns = ["Wage", "Ask. Price", "Deadline", ""];
		let headers = null;
		let enhancedHeaders = null;
		let columnMapping = null;

		// Scrape all pages
		for (let pageNum = 1; pageNum <= pagesToScrape; pageNum++) {
			console.log(`   📄 Page ${pageNum}/${pagesToScrape}...`);

			await page.goto(
				`https://www.pmanager.org${baseSearchUrl}&pid=${pageNum}`,
			);
			await page.waitForLoadState("networkidle");
			await page.waitForSelector("table", { timeout: 10000 });

			const tables = await page.locator("table").count();

			for (let tableIndex = 0; tableIndex < tables; tableIndex++) {
				const table = page.locator("table").nth(tableIndex);
				const rows = await table.locator("tr").count();

				if (rows > 5) {
					if (!headers) {
						headers = await table
							.locator("tr")
							.first()
							.locator("th, td")
							.allTextContents();
						enhancedHeaders = [];
						columnMapping = [];

						for (let j = 0; j < headers.length; j++) {
							if (excludeColumns.includes(headers[j])) continue;
							columnMapping.push(j);
							enhancedHeaders.push(headers[j]);
						}

						const nameIndex = headers.indexOf("Name");
						if (nameIndex !== -1 && !excludeColumns.includes("Name")) {
							enhancedHeaders.splice(
								enhancedHeaders.indexOf("Name") + 1,
								0,
								"Name_PlayerID",
							);
						}

						// Add detail columns
						enhancedHeaders.push(
							"Team",
							"Quality",
							"Affected Quality",
							"Potential",
							"Penalties",
							"Last Updated",
						);
					}

					for (let i = 1; i < rows; i++) {
						const row = table.locator("tr").nth(i);
						const cells = await row.locator("td").count();
						if (cells === 0) continue;

						const rowData = [];
						let playerId = null;

						for (let j = 0; j < cells; j++) {
							const cell = row.locator("td").nth(j);
							const cellText = await cell.textContent();
							const playerLink = cell.locator(
								'a[href*="ver_jogador.asp?jog_id="]',
							);
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

							// Add placeholders for detail columns (will be filled in phase 2)
							finalRow.push("", "", "", "", "", new Date().toISOString());

							allPlayers.set(playerId, finalRow);
						}
					}

					break;
				}
			}

			await page.waitForTimeout(300);
		}

		console.log(
			`   ✅ Phase 1 complete: ${allPlayers.size} unique players found\n`,
		);

		// ========== PHASE 2: Get player details ==========
		console.log("📋 PHASE 2: Scraping player details...");
		console.log(
			`   ⏱️  Estimated time: ${Math.ceil((allPlayers.size * 2) / 60)} minutes\n`,
		);

		const playerIds = Array.from(allPlayers.keys());
		const detailColumnIndices = {
			team: enhancedHeaders.indexOf("Team"),
			quality: enhancedHeaders.indexOf("Quality"),
			affected_quality: enhancedHeaders.indexOf("Affected Quality"),
			potential: enhancedHeaders.indexOf("Potential"),
			penalties: enhancedHeaders.indexOf("Penalties"),
			last_updated: enhancedHeaders.indexOf("Last Updated"),
		};

		const playersToProcess = playerIds;

		let successCount = 0;
		let errorCount = 0;

		for (let i = 0; i < playersToProcess.length; i++) {
			const playerId = playersToProcess[i];

			console.log(
				`   📄 Player ${i + 1}/${playersToProcess.length} (ID: ${playerId})...`,
			);

			try {
				await page.goto(
					`https://www.pmanager.org/ver_jogador.asp?jog_id=${playerId}`,
				);
				await page.waitForLoadState("networkidle");
				await page.waitForTimeout(300);

				const playerRow = allPlayers.get(playerId);

				// Team
				const teamLink = await page
					.locator('a[href*="ver_equipa"]')
					.first()
					.textContent()
					.catch(() => "");
				playerRow[detailColumnIndices.team] = teamLink.trim() || "Free Agent";

				// Quality - simpler selector and extraction
				const qualityText = await page
					.locator('td:has-text("Quality") + td')
					.first()
					.textContent()
					.catch(() => "");
				playerRow[detailColumnIndices.quality] = qualityText.trim();

				// Affected Quality
				const affectedText = await page
					.locator('td:has-text("Affected Quality") + td')
					.first()
					.textContent()
					.catch(() => "");
				playerRow[detailColumnIndices.affected_quality] = affectedText.trim();

				// Potential (not "Next Season")
				const potentialText = await page
					.locator(
						'tr:has-text("Potential"):not(:has-text("Next Season")) td:last-child',
					)
					.first()
					.textContent()
					.catch(() => "");
				playerRow[detailColumnIndices.potential] = potentialText.trim();

				// Penalties
				const penaltiesText = await page
					.locator('td:has-text("Penalties") + td')
					.first()
					.textContent()
					.catch(() => "");
				playerRow[detailColumnIndices.penalties] = penaltiesText.trim();

				// Update timestamp
				playerRow[detailColumnIndices.last_updated] = new Date().toISOString();

				successCount++;
				console.log(
					`      ✅ Success - Team: ${playerRow[detailColumnIndices.team]}, Quality: ${playerRow[detailColumnIndices.quality]}`,
				);
			} catch (error) {
				errorCount++;
				console.log(`      ❌ Error: ${error.message}`);
			}

			await page.waitForTimeout(200);
		}

		console.log(
			`\n   ✅ Phase 2 complete: ${successCount} success, ${errorCount} errors\n`,
		);

		// ========== PHASE 3: Upload to Google Sheets ==========
		console.log("📤 PHASE 3: Uploading to Google Sheets...");

		const spreadsheetTitle = `PManager Players - ${new Date().toISOString().split("T")[0]}`;
		let spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

		if (!spreadsheetId) {
			spreadsheetId = await sheetsManager.createSpreadsheet(spreadsheetTitle);
			console.log(`💡 Add to .env: GOOGLE_SPREADSHEET_ID=${spreadsheetId}`);
		}

		const sheetName = "Current_Very_Good_Players";
		const allPlayerRows = Array.from(allPlayers.values());
		const playerIdColumnIndex = enhancedHeaders.findIndex((h) =>
			h.includes("_PlayerID"),
		);

		await sheetsManager.upsertToSheet(
			spreadsheetId,
			sheetName,
			enhancedHeaders,
			allPlayerRows,
			playerIdColumnIndex,
		);
		await sheetsManager.formatSheet(spreadsheetId, 0);

		console.log(
			`\n🎉 Complete! ${allPlayers.size} players with full details uploaded`,
		);
		console.log(
			`🔗 View: https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
		);
	} catch (error) {
		console.error("❌ Error:", error.message);
	} finally {
		await browser.close();
	}
}

scrapeAllWithDetails();
