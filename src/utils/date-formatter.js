class DateFormatter {
	/**
	 * Format date to human-readable string
	 * @param {Date} date - Date object to format
	 * @returns {string} Formatted date string (MM/DD/YYYY, HH:MM:SS)
	 */
	static toHumanReadable(date = new Date()) {
		return date.toLocaleString("en-US", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		});
	}

	/**
	 * Format value from "60.017.450 baht" to "60,017,450"
	 * @param {string} value - Value string to format
	 * @returns {string} Formatted value
	 */
	static formatValue(value) {
		if (!value) return "";
		return value.replace(" baht", "").replace(/\./g, ",");
	}
}

module.exports = DateFormatter;
