const GoogleSheetsService = require("./google-sheets.service");
const Logger = require("../utils/logger");

class SheetsService {
	constructor() {
		this.manager = new GoogleSheetsService();
	}

	async authenticate() {
		const success = await this.manager.authenticate();
		if (!success) {
			throw new Error("Google Sheets authentication failed");
		}
		return true;
	}

	async uploadData(
		spreadsheetId,
		sheetName,
		headers,
		data,
		playerIdColumnIndex,
	) {
		Logger.info("Uploading to Google Sheets...");

		await this.manager.upsertToSheet(
			spreadsheetId,
			sheetName,
			headers,
			data,
			playerIdColumnIndex,
		);

		// Get the correct sheet ID for formatting
		const sheetId = await this.manager.getSheetId(spreadsheetId, sheetName);
		if (sheetId !== null) {
			await this.manager.formatSheet(spreadsheetId, sheetId);
		}

		Logger.success(`${data.length} players uploaded to Google Sheets`);
	}

	async ensureSpreadsheet(spreadsheetId, title) {
		let finalSpreadsheetId = spreadsheetId;

		if (!finalSpreadsheetId) {
			finalSpreadsheetId = await this.manager.createSpreadsheet(title);
			Logger.warning(
				`Add to .env: GOOGLE_SPREADSHEET_ID=${finalSpreadsheetId}`,
			);
		}

		return finalSpreadsheetId;
	}
}

module.exports = SheetsService;
