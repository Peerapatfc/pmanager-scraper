const { google } = require("googleapis");
const fs = require("fs");

class GoogleSheetsManager {
	constructor() {
		this.sheets = null;
		this.auth = null;
	}

	async authenticate() {
		try {
			// Check if we have service account credentials
			const serviceAccountPath =
				process.env.GOOGLE_SERVICE_ACCOUNT_PATH || "service-account.json";

			if (fs.existsSync(serviceAccountPath)) {
				const credentialsFile = JSON.parse(
					fs.readFileSync(serviceAccountPath, "utf8"),
				);

				// Check if it's a service account key (has client_email) or OAuth2 credentials
				if (credentialsFile.client_email) {
					console.log("🔐 Authenticating with service account...");
					this.auth = new google.auth.GoogleAuth({
						credentials: credentialsFile,
						scopes: ["https://www.googleapis.com/auth/spreadsheets"],
					});
				} else if (credentialsFile.web) {
					console.log("🔐 Using OAuth2 credentials from file...");
					// Extract OAuth2 credentials from the file
					const oauthCreds = credentialsFile.web;

					this.auth = new google.auth.OAuth2(
						oauthCreds.client_id,
						oauthCreds.client_secret,
						oauthCreds.redirect_uris
							? oauthCreds.redirect_uris[0]
							: "http://localhost",
					);

					// Check if we have a saved token
					const tokenPath = "google-token.json";
					if (fs.existsSync(tokenPath)) {
						const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
						this.auth.setCredentials(token);
					} else {
						throw new Error(
							"No saved token found. Please run: npm run setup-google-auth",
						);
					}
				} else {
					throw new Error("Invalid credentials file format");
				}
			} else {
				console.log("🔐 Using OAuth2 from environment variables...");
				// For OAuth2, you'll need to set up credentials
				const credentials = {
					client_id: process.env.GOOGLE_CLIENT_ID,
					client_secret: process.env.GOOGLE_CLIENT_SECRET,
					redirect_uri:
						process.env.GOOGLE_REDIRECT_URI || "urn:ietf:wg:oauth:2.0:oob",
				};

				if (!credentials.client_id || !credentials.client_secret) {
					throw new Error(
						"Google credentials not found. Please set up authentication.",
					);
				}

				this.auth = new google.auth.OAuth2(
					credentials.client_id,
					credentials.client_secret,
					credentials.redirect_uri,
				);

				// Check if we have a saved token
				const tokenPath = "google-token.json";
				if (fs.existsSync(tokenPath)) {
					const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
					this.auth.setCredentials(token);
				} else {
					throw new Error(
						"No saved token found. Please run: npm run setup-google-auth",
					);
				}
			}

			this.sheets = google.sheets({ version: "v4", auth: this.auth });
			console.log("✅ Google Sheets authentication successful");
			return true;
		} catch (error) {
			console.error("❌ Google Sheets authentication failed:", error.message);
			return false;
		}
	}

	async createSpreadsheet(title) {
		try {
			const response = await this.sheets.spreadsheets.create({
				resource: {
					properties: {
						title: title,
					},
				},
			});

			const spreadsheetId = response.data.spreadsheetId;
			console.log(`📊 Created new spreadsheet: ${title}`);
			console.log(
				`🔗 URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
			);

			return spreadsheetId;
		} catch (error) {
			console.error("❌ Failed to create spreadsheet:", error.message);
			throw error;
		}
	}

	async createSheetTab(spreadsheetId, sheetName) {
		try {
			// Check if sheet already exists
			const spreadsheet = await this.sheets.spreadsheets.get({
				spreadsheetId: spreadsheetId,
			});

			const sheetExists = spreadsheet.data.sheets.some(
				(sheet) => sheet.properties.title === sheetName,
			);

			if (!sheetExists) {
				// Create new sheet tab
				await this.sheets.spreadsheets.batchUpdate({
					spreadsheetId: spreadsheetId,
					resource: {
						requests: [
							{
								addSheet: {
									properties: {
										title: sheetName,
									},
								},
							},
						],
					},
				});
				console.log(`📄 Created new sheet tab: ${sheetName}`);
			}
		} catch (error) {
			console.error(`❌ Failed to create sheet tab: ${error.message}`);
		}
	}

	async getExistingData(spreadsheetId, sheetName) {
		try {
			const response = await this.sheets.spreadsheets.values.get({
				spreadsheetId: spreadsheetId,
				range: `${sheetName}!A:Z`,
			});
			return response.data.values || [];
		} catch (error) {
			// Sheet doesn't exist or is empty
			return [];
		}
	}

	async writeToSheet(spreadsheetId, sheetName, headers, data) {
		try {
			// First, ensure the sheet tab exists
			await this.createSheetTab(spreadsheetId, sheetName);

			// Try to clear existing data
			try {
				await this.sheets.spreadsheets.values.clear({
					spreadsheetId: spreadsheetId,
					range: `${sheetName}!A:Z`,
				});
			} catch (clearError) {
				// Ignore clear errors, sheet might be empty
			}

			// Prepare the data with headers
			const values = [headers, ...data];

			// Write the data
			const response = await this.sheets.spreadsheets.values.update({
				spreadsheetId: spreadsheetId,
				range: `${sheetName}!A1`,
				valueInputOption: "RAW",
				resource: {
					values: values,
				},
			});

			console.log(`✅ Successfully wrote ${data.length} rows to ${sheetName}`);
			return response.data;
		} catch (error) {
			console.error("❌ Failed to write to sheet:", error.message);
			throw error;
		}
	}

	async upsertToSheet(
		spreadsheetId,
		sheetName,
		headers,
		newData,
		playerIdColumnIndex,
	) {
		try {
			// First, ensure the sheet tab exists
			await this.createSheetTab(spreadsheetId, sheetName);

			// Get existing data
			const existingData = await this.getExistingData(spreadsheetId, sheetName);

			if (existingData.length === 0) {
				// No existing data, just write everything
				console.log(
					`📝 No existing data, writing ${newData.length} new rows...`,
				);
				return await this.writeToSheet(
					spreadsheetId,
					sheetName,
					headers,
					newData,
				);
			}

			// Build a map of existing player IDs to row indices
			const existingPlayerIds = new Map();
			const existingHeaders = existingData[0];

			// Find the player ID column index in existing data
			let existingPlayerIdCol = playerIdColumnIndex;
			if (existingPlayerIdCol === -1) {
				// Try to find it by header name
				existingPlayerIdCol = existingHeaders.findIndex((h) =>
					h.includes("_PlayerID"),
				);
			}

			if (existingPlayerIdCol !== -1) {
				for (let i = 1; i < existingData.length; i++) {
					const playerId = existingData[i][existingPlayerIdCol];
					if (playerId) {
						existingPlayerIds.set(playerId, i);
					}
				}
			}

			console.log(
				`📊 Found ${existingPlayerIds.size} existing players in sheet`,
			);

			// Merge data: update existing rows, add new ones
			const mergedData = [...existingData.slice(1)]; // Copy existing data (without header)
			let updatedCount = 0;
			let addedCount = 0;

			for (const newRow of newData) {
				const playerId = newRow[playerIdColumnIndex];

				if (playerId && existingPlayerIds.has(playerId)) {
					// Update existing row
					const rowIndex = existingPlayerIds.get(playerId) - 1; // Adjust for header
					mergedData[rowIndex] = newRow;
					updatedCount++;
				} else {
					// Add new row
					mergedData.push(newRow);
					addedCount++;
				}
			}

			console.log(`🔄 Updated ${updatedCount} existing players`);
			console.log(`➕ Added ${addedCount} new players`);

			// Write merged data back to sheet
			return await this.writeToSheet(
				spreadsheetId,
				sheetName,
				headers,
				mergedData,
			);
		} catch (error) {
			console.error("❌ Failed to upsert to sheet:", error.message);
			throw error;
		}
	}

	async appendToSheet(spreadsheetId, sheetName, data) {
		try {
			const response = await this.sheets.spreadsheets.values.append({
				spreadsheetId: spreadsheetId,
				range: `${sheetName}!A:Z`,
				valueInputOption: "RAW",
				resource: {
					values: data,
				},
			});

			console.log(
				`✅ Successfully appended ${data.length} rows to ${sheetName}`,
			);
			return response.data;
		} catch (error) {
			console.error("❌ Failed to append to sheet:", error.message);
			throw error;
		}
	}

	async formatSheet(spreadsheetId, sheetId) {
		try {
			// Format the header row
			await this.sheets.spreadsheets.batchUpdate({
				spreadsheetId: spreadsheetId,
				resource: {
					requests: [
						{
							repeatCell: {
								range: {
									sheetId: sheetId,
									startRowIndex: 0,
									endRowIndex: 1,
								},
								cell: {
									userEnteredFormat: {
										backgroundColor: {
											red: 0.2,
											green: 0.6,
											blue: 0.9,
										},
										textFormat: {
											foregroundColor: {
												red: 1.0,
												green: 1.0,
												blue: 1.0,
											},
											bold: true,
										},
									},
								},
								fields: "userEnteredFormat(backgroundColor,textFormat)",
							},
						},
						{
							autoResizeDimensions: {
								dimensions: {
									sheetId: sheetId,
									dimension: "COLUMNS",
									startIndex: 0,
									endIndex: 25,
								},
							},
						},
					],
				},
			});

			console.log("✅ Sheet formatting applied");
		} catch (error) {
			console.error("❌ Failed to format sheet:", error.message);
		}
	}
}

module.exports = GoogleSheetsManager;
