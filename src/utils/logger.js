class Logger {
	static info(message) {
		console.log(`ℹ️  ${message}`);
	}

	static success(message) {
		console.log(`✅ ${message}`);
	}

	static error(message, error = null) {
		console.error(`❌ ${message}`);
		if (error) {
			console.error(error);
		}
	}

	static warning(message) {
		console.warn(`⚠️  ${message}`);
	}

	static phase(number, message) {
		console.log(`\n📋 PHASE ${number}: ${message}`);
	}

	static progress(current, total, message) {
		console.log(`   📄 ${message} (${current}/${total})...`);
	}

	static detail(message) {
		console.log(`      ${message}`);
	}
}

module.exports = Logger;
