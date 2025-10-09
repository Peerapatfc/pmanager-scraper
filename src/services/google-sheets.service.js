const { google } = require("googleapis");
const fs = require("fs");
const Logger = require("../utils/logger");
const { config } = require("../config");

class GoogleSheetsService {
	constructor() {
		this.sheets = null;
		this.auth = null;
	}

	/**
	 * Authenticate with Google Sheets API using service account
	 * @returns {Promise<boolean>} Success status
	 */
	async authenticate() {
		try {
			const serviceAccountPath = config.googleSheets.serviceAccountPath;

			if (!fs.existsSync(serviceAccountPath)) {
				Logger.error(`Service account file not found: ${serviceAccountPath}`);
				return false;
			}

			Logger.info("Authenticating with Google Sheets...");
			const credentialsFile = JSON.parse(
				fs.readFileSync(serviceAccountPath, "utf8"),
			);

			this.auth = new google.auth.GoogleAuth({
				credentials: credentialsFile,
				scopes: ["https://www.googleapis.com/auth/spreadsheets"],
			});

			this.sheets = google.sheets({ version: "v4", auth: this.auth });
			Logger.success("Google Sheets authentication successful");
			return true;
		} catch (error) {
			Logger.error("Google Sheets authentication failed", error);
			return false;
		}
	}

	/**
	 * Create a new spreadsheet
	 * @param {string} title - Spreadsheet title
	 * @returns {Promise<string>} Spreadsheet ID
	 */
	async createSpreadsheet(title) {
		try {
			const response = await this.sheets.spreadsheets.create({
				resource: {
					properties: { title },
				},
			});

			const spreadsheetId = response.data.spreadsheetId;
			Logger.success(`Created new spreadsheet: ${title}`);
			Logger.info(
				`URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
			);

			return spreadsheetId;
		} catch (error) {
			Logger.error("Failed to create spreadsheet", error);
			throw error;
		}
	}

	/**
	 * Create a new sheet tab if it doesn't exist
	 * @param {string} spreadsheetId - Spreadsheet ID
	 * @param {string} sheetName - Sheet name
	 */
	async createSheetTab(spreadsheetId, sheetName) {
		try {
			const spreadsheet = await this.sheets.spreadsheets.get({ spreadsheetId });
			const sheetExists = spreadsheet.data.sheets.some(
				(sheet) => sheet.properties.title === sheetName,
			);

			if (!sheetExists) {
				await this.sheets.spreadsheets.batchUpdate({
					spreadsheetId,
					resource: {
						requests: [
							{
								addSheet: {
									properties: { title: sheetName },
								},
							},
						],
					},
				});
				Logger.info(`Created new sheet tab: ${sheetName}`);
			}
		} catch (error) {
			Logger.error(`Failed to create sheet tab: ${sheetName}`, error);
		}
	}

	/**
	 * Get existing data from a sheet
	 * @param {string} spreadsheetId - Spreadsheet ID
	 * @param {string} sheetName - Sheet name
	 * @returns {Promise<Array>} Existing data
	 */
	async getExistingData(spreadsheetId, sheetName) {
		try {
			const response = await this.sheets.spreadsheets.values.get({
				spreadsheetId,
				range: `${sheetName}!A:Z`,
			});
			return response.data.values || [];
		} catch (error) {
			return [];
		}
	}

	/**
	 * Write data to sheet (overwrites existing data)
	 * @param {string} spreadsheetId - Spreadsheet ID
	 * @param {string} sheetName - Sheet name
	 * @param {Array} headers - Column headers
	 * @param {Array} data - Data rows
	 */
	async writeToSheet(spreadsheetId, sheetName, headers, data) {
		try {
			await this.createSheetTab(spreadsheetId, sheetName);

			// Clear existing data
			try {
				await this.sheets.spreadsheets.values.clear({
					spreadsheetId,
					range: `${sheetName}!A:Z`,
				});
			} catch (clearError) {
				// Ignore clear errors
			}

			const values = [headers, ...data];

			await this.sheets.spreadsheets.values.update({
				spreadsheetId,
				range: `${sheetName}!A1`,
				valueInputOption: "RAW",
				resource: { values },
			});

			Logger.success(`Wrote ${data.length} rows to ${sheetName}`);
		} catch (error) {
			Logger.error("Failed to write to sheet", error);
			throw error;
		}
	}

	/**
	 * Upsert data to sheet (update existing, add new)
	 * @param {string} spreadsheetId - Spreadsheet ID
	 * @param {string} sheetName - Sheet name
	 * @param {Array} headers - Column headers
	 * @param {Array} newData - New data rows
	 * @param {number} playerIdColumnIndex - Index of PlayerID column
	 */
	async upsertToSheet(
		spreadsheetId,
		sheetName,
		headers,
		newData,
		playerIdColumnIndex,
	) {
		try {
			await this.createSheetTab(spreadsheetId, sheetName);

			const existingData = await this.getExistingData(spreadsheetId, sheetName);

			if (existingData.length === 0) {
				Logger.info(`No existing data, writing ${newData.length} new rows...`);
				return await this.writeToSheet(
					spreadsheetId,
					sheetName,
					headers,
					newData,
				);
			}

			// Build map of existing player IDs
			const existingPlayerIds = new Map();
			const existingHeaders = existingData[0];

			let existingPlayerIdCol = playerIdColumnIndex;
			if (existingPlayerIdCol === -1) {
				existingPlayerIdCol = existingHeaders.findIndex(
					(h) => h === "PlayerID",
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

			Logger.info(`Found ${existingPlayerIds.size} existing players in sheet`);

			// Merge data
			const mergedData = [...existingData.slice(1)];
			let updatedCount = 0;
			let addedCount = 0;

			for (const newRow of newData) {
				const playerId = newRow[playerIdColumnIndex];

				if (playerId && existingPlayerIds.has(playerId)) {
					const rowIndex = existingPlayerIds.get(playerId) - 1;
					mergedData[rowIndex] = newRow;
					updatedCount++;
				} else {
					mergedData.push(newRow);
					addedCount++;
				}
			}

			Logger.info(`Updated ${updatedCount} existing players`);
			Logger.info(`Added ${addedCount} new players`);

			return await this.writeToSheet(
				spreadsheetId,
				sheetName,
				headers,
				mergedData,
			);
		} catch (error) {
			Logger.error("Failed to upsert to sheet", error);
			throw error;
		}
	}

	/**
	 * Get sheet ID by name
	 * @param {string} spreadsheetId - Spreadsheet ID
	 * @param {string} sheetName - Sheet name
	 * @returns {Promise<number|null>} Sheet ID or null if not found
	 */
	async getSheetId(spreadsheetId, sheetName) {
		try {
			const spreadsheet = await this.sheets.spreadsheets.get({ spreadsheetId });
			const sheet = spreadsheet.data.sheets.find(
				(s) => s.properties.title === sheetName,
			);
			return sheet ? sheet.properties.sheetId : null;
		} catch (error) {
			Logger.error("Failed to get sheet ID", error);
			return null;
		}
	}

	/**
	 * Format sheet with colored headers and auto-resize columns
	 * @param {string} spreadsheetId - Spreadsheet ID
	 * @param {number} sheetId - Sheet ID (usually 0 for first sheet)
	 */
	async formatSheet(spreadsheetId, sheetId) {
		try {
			await this.sheets.spreadsheets.batchUpdate({
				spreadsheetId,
				resource: {
					requests: [
						// Format header row
						{
							repeatCell: {
								range: {
									sheetId,
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
						// Auto-resize columns
						{
							autoResizeDimensions: {
								dimensions: {
									sheetId,
									dimension: "COLUMNS",
									startIndex: 0,
									endIndex: 25,
								},
							},
						},
					],
				},
			});

			Logger.success("Sheet formatting applied");
		} catch (error) {
			Logger.error("Failed to format sheet", error);
		}
	}
}

module.exports = GoogleSheetsService;
