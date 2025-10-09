const Logger = require("../utils/logger");

class TelegramService {
	constructor(botToken, chatId) {
		this.botToken = botToken;
		this.chatId = chatId;
		this.baseUrl = `https://api.telegram.org/bot${botToken}`;
	}

	/**
	 * Send a message to Telegram
	 * @param {string} message - Message text
	 * @param {object} options - Additional options
	 * @returns {Promise<boolean>} Success status
	 */
	async sendMessage(message, options = {}) {
		try {
			const url = `${this.baseUrl}/sendMessage`;
			const body = {
				chat_id: this.chatId,
				text: message,
				parse_mode: options.parseMode || "HTML",
				disable_web_page_preview: options.disablePreview || true,
				...options,
			};

			const response = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = await response.json();

			if (!data.ok) {
				Logger.error("Telegram API error", data);
				return false;
			}

			Logger.success("Message sent to Telegram");
			return true;
		} catch (error) {
			Logger.error("Failed to send Telegram message", error);
			return false;
		}
	}

	/**
	 * Format and send top player deals
	 * @param {Array} deals - Array of player deals
	 * @returns {Promise<boolean>} Success status
	 */
	async sendTopDeals(deals) {
		if (!deals || deals.length === 0) {
			return await this.sendMessage("❌ No deals found");
		}

		let message = "🎯 <b>Top 20 Player Deals</b>\n\n";
		message += "💰 Best value transfers (Estimated - Asking Price)\n\n";

		deals.forEach((deal, index) => {
			const emoji =
				index === 0
					? "🥇"
					: index === 1
						? "🥈"
						: index === 2
							? "🥉"
							: `${index + 1}.`;

			message += `${emoji} <b>${deal.name}</b>\n`;
			message += `   💵 Difference: <b>${deal.differenceFormatted}</b>\n`;
			message += `   📊 Estimated: ${deal.estimatedFormatted}\n`;
			message += `   💸 Asking: ${deal.askingFormatted}\n`;
			message += `   🔗 <a href="${deal.url}">View Player</a>\n\n`;
		});

		message += `\n⏰ Updated: ${new Date().toLocaleString()}`;

		// Split message if too long (Telegram limit is 4096 characters)
		if (message.length > 4000) {
			const messages = this.splitMessage(message, 4000);
			for (const msg of messages) {
				await this.sendMessage(msg);
				await this.delay(1000); // Avoid rate limiting
			}
			return true;
		}

		return await this.sendMessage(message);
	}

	/**
	 * Split long message into chunks
	 * @param {string} message - Message to split
	 * @param {number} maxLength - Maximum length per chunk
	 * @returns {Array<string>} Array of message chunks
	 */
	splitMessage(message, maxLength) {
		const chunks = [];
		const lines = message.split("\n");
		let currentChunk = "";

		for (const line of lines) {
			if (`${currentChunk}${line}\n`.length > maxLength) {
				chunks.push(currentChunk);
				currentChunk = `${line}\n`;
			} else {
				currentChunk += `${line}\n`;
			}
		}

		if (currentChunk) {
			chunks.push(currentChunk);
		}

		return chunks;
	}

	/**
	 * Delay helper
	 * @param {number} ms - Milliseconds to delay
	 * @returns {Promise<void>}
	 */
	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

module.exports = TelegramService;
