const { test, expect } = require("@playwright/test");

test.describe("Login Tests", () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the login page
		await page.goto("/default.asp");
	});

	test("should display login form", async ({ page }) => {
		// Check if the page loads correctly
		await expect(page).toHaveTitle(/.*Planetarium Manager.*/i);

		// Check for the login form elements
		const usernameField = page.locator("#loginForm #utilizador");
		const passwordField = page.locator("#loginForm #password");
		const loginButton = page.locator('button.btn-login[type="submit"]');

		await expect(usernameField).toBeVisible();
		await expect(passwordField).toBeVisible();
		await expect(loginButton).toBeVisible();

		// Verify placeholders
		await expect(usernameField).toHaveAttribute("placeholder", "Username");
		await expect(passwordField).toHaveAttribute("placeholder", "Password");
	});

	test("should login with valid credentials", async ({ page }) => {
		// This test requires real credentials to pass
		const username = process.env.TEST_USERNAME;
		const password = process.env.TEST_PASSWORD;

		// Skip test if no real credentials provided
		if (!username || !password) {
			test.skip(
				"Skipping login test - no valid credentials provided in .env file",
			);
		}

		// Fill in the login form
		await page.fill("#loginForm #utilizador", username);
		await page.fill("#loginForm #password", password);

		// Submit the form
		await page.click('button.btn-login[type="submit"]');

		// Wait for navigation
		await page.waitForLoadState("networkidle");

		// Verify successful login - check if redirected to the player search page
		await expect(page).toHaveURL(/.*procurar\.asp.*action=proc_jog.*/);

		// Alternative: check if we're no longer on the login page
		await expect(page).not.toHaveURL(/.*default\.asp$/);
	});

	test("should show error for invalid credentials", async ({ page }) => {
		const invalidUsername = "invaliduser";
		const invalidPassword = "wrongpassword";

		// Fill in the login form with invalid credentials
		await page.fill("#loginForm #utilizador", invalidUsername);
		await page.fill("#loginForm #password", invalidPassword);

		// Submit the form
		await page.click('button.btn-login[type="submit"]');

		// Wait for response
		await page.waitForLoadState("networkidle");

		// Check that we get an error response (either back to login or error page)
		const currentUrl = page.url();
		const isOnLoginPage = /.*default\.asp/.test(currentUrl);
		const isErrorPage = /.*erro=logout/.test(currentUrl);

		// Should be either on login page or error page, but not on the success page
		expect(isOnLoginPage || isErrorPage).toBe(true);
		await expect(page).not.toHaveURL(/.*procurar\.asp.*action=proc_jog.*/);
	});

	test("should validate empty fields", async ({ page }) => {
		// Try to submit without filling any fields
		await page.click('button.btn-login[type="submit"]');

		// Should stay on login page
		await expect(page).toHaveURL(/.*default\.asp.*/);
		await expect(page.locator("#loginForm")).toBeVisible();
	});

	test("should redirect to player search page after successful login", async ({
		page,
	}) => {
		// This test requires valid credentials
		const username = process.env.TEST_USERNAME;
		const password = process.env.TEST_PASSWORD;

		// Skip test if no credentials provided
		if (!username || !password) {
			test.skip("Skipping login test - no credentials provided");
		}

		// Fill in the login form
		await page.fill("#loginForm #utilizador", username);
		await page.fill("#loginForm #password", password);

		// Submit the form
		await page.click('button.btn-login[type="submit"]');

		// Wait for navigation
		await page.waitForLoadState("networkidle");

		// Verify we're on the player search page
		await expect(page).toHaveURL(/.*procurar\.asp.*action=proc_jog.*/);

		// Check for elements that should be present on the player search page
		// (You can add more specific checks based on the actual page content)
		await expect(page.locator('input[name="nome"]')).toBeVisible(); // Player name search field
		await expect(page.locator('input[value="Pesquisar"]')).toBeVisible(); // Search button
	});

	test("should scrape player data from search results table", async ({
		page,
	}) => {
		// This test requires valid credentials
		const username = process.env.TEST_USERNAME;
		const password = process.env.TEST_PASSWORD;

		// Skip test if no credentials provided
		if (!username || !password) {
			test.skip("Skipping scraping test - no credentials provided");
		}

		// Login first
		await page.fill("#loginForm #utilizador", username);
		await page.fill("#loginForm #password", password);
		await page.click('button.btn-login[type="submit"]');
		await page.waitForLoadState("networkidle");

		// Navigate to the specific search URL with parameters
		await page.goto(
			"/procurar.asp?action=proc_jog&nome=&pos=0&nacional=-1&lado=-1&idd_op=%3C&idd=Any&temp_op=%3C&temp=Any&expe_op=%3E=&expe=Any&con_op=%3C&con=Any&pro_op=%3E&pro=Any&vel_op=%3E&vel=Any&forma_op=%3E&forma=Any&cab_op=%3E&cab=Any&ord_op=%3C=&ord=Any&cul_op=%3E&cul=Any&pre_op=%3C=&pre=Any&forca_op=%3E&forca=Any&lesionado=Any&prog_op=%3E&prog=Any&tack_op=%3E&tack=Any&internacional=Any&passe_op=%3E&passe=Any&pais=-1&rem_op=%3E&rem=Any&tec_op=%3E&tec=Any&jmaos_op=%3E&jmaos=Any&saidas_op=%3E&saidas=Any&reflexos_op=%3E&reflexos=Any&agilidade_op=%3E&agilidade=Any&B1=Pesquisar&field=&pid=1&sort=0&pv=1&qual_op=%3E&qual=6&talento=Any",
		);

		await page.waitForLoadState("networkidle");

		// Look for the results table
		const table = page.locator("table").first();
		await expect(table).toBeVisible();

		// Extract table headers
		const headers = await page
			.locator("table tr:first-child th, table tr:first-child td")
			.allTextContents();
		console.log("Table Headers:", headers);

		// Extract all table rows data
		const rows = await page.locator("table tr").count();
		console.log(`Found ${rows} rows in the table`);

		const tableData = [];

		// Skip header row, start from index 1
		for (let i = 1; i < Math.min(rows, 11); i++) {
			// Limit to first 10 data rows
			const row = page.locator(`table tr:nth-child(${i + 1})`);
			const cells = await row.locator("td").count();

			const rowData = [];
			const playerIds = [];

			// Process each cell to extract both text and player IDs
			for (let j = 0; j < cells; j++) {
				const cell = row.locator("td").nth(j);
				const cellText = await cell.textContent();

				// Check if cell contains a player link
				const playerLink = cell.locator('a[href*="ver_jogador.asp?jog_id="]');
				const linkCount = await playerLink.count();

				if (linkCount > 0) {
					// Extract player ID from the link
					const href = await playerLink.getAttribute("href");
					const playerIdMatch = href.match(/jog_id=(\d+)/);
					const playerId = playerIdMatch ? playerIdMatch[1] : null;

					rowData.push(cellText?.trim() || "");
					playerIds.push(playerId);
				} else {
					rowData.push(cellText?.trim() || "");
					playerIds.push(null);
				}
			}

			if (rowData.length > 0) {
				tableData.push({
					data: rowData,
					playerIds: playerIds,
				});
				console.log(`Row ${i}:`, rowData);
				console.log(
					`Player IDs:`,
					playerIds.filter((id) => id !== null),
				);
			}
		}

		// Verify we got some data
		expect(tableData.length).toBeGreaterThan(0);

		// Save scraped data to a file for inspection
		const fs = require("fs");

		// Create enhanced headers with player ID columns
		const enhancedHeaders = [...headers];
		const playerIdHeaders = [];

		// Add player ID headers for columns that contain player links
		for (let j = 0; j < headers.length; j++) {
			if (tableData.some((row) => row.playerIds[j] !== null)) {
				playerIdHeaders.push(`${headers[j]}_PlayerID`);
			}
		}

		enhancedHeaders.push(...playerIdHeaders);

		const scrapedData = {
			headers: headers,
			enhancedHeaders: enhancedHeaders,
			rows: tableData,
			timestamp: new Date().toISOString(),
			totalRows: rows,
		};

		fs.writeFileSync(
			"scraped-player-data.json",
			JSON.stringify(scrapedData, null, 2),
		);
		console.log("Enhanced scraped data saved to scraped-player-data.json");
		console.log(
			`📋 Extracted player IDs from ${playerIdHeaders.length} columns`,
		);
	});
});
