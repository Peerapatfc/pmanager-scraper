const { chromium } = require("playwright");
const { config } = require("../config");
const Logger = require("../utils/logger");

class BrowserService {
	constructor() {
		this.browser = null;
		this.page = null;
	}

	async launch() {
		this.browser = await chromium.launch(config.browser);
		this.page = await this.browser.newPage();
		return this.page;
	}

	async close() {
		if (this.browser) {
			await this.browser.close();
		}
	}

	async login() {
		const { username, password, baseUrl } = config.pmanager;

		Logger.info("Logging in to PManager...");
		await this.page.goto(`${baseUrl}/default.asp`);

		await this.page.fill("#loginForm #utilizador", username);
		await this.page.fill("#loginForm #password", password);
		await this.page.click('button.btn-login[type="submit"]');
		await this.page.waitForLoadState("networkidle");

		if (this.page.url().includes("erro=logout")) {
			throw new Error("Login failed - invalid credentials");
		}

		Logger.success("Login successful");
	}

	async navigateToSearchPage(pageNumber = 1) {
		const baseSearchUrl =
			"/procurar.asp?action=proc_jog&nome=&pos=0&nacional=-1&lado=-1&idd_op=%3C&idd=Any&temp_op=%3C&temp=Any&expe_op=%3E=&expe=Any&con_op=%3C&con=Any&pro_op=%3E&pro=Any&vel_op=%3E&vel=Any&forma_op=%3E&forma=Any&cab_op=%3E&cab=Any&ord_op=%3C=&ord=Any&cul_op=%3E&cul=Any&pre_op=%3C=&pre=Any&forca_op=%3E&forca=Any&lesionado=Any&prog_op=%3E&prog=Any&tack_op=%3E&tack=Any&internacional=Any&passe_op=%3E&passe=Any&pais=-1&rem_op=%3E&rem=Any&tec_op=%3E&tec=Any&jmaos_op=%3E&jmaos=Any&saidas_op=%3E&saidas=Any&reflexos_op=%3E&reflexos=Any&agilidade_op=%3E&agilidade=Any&B1=Pesquisar&field=&sort=0&pv=1&qual_op=%3E&qual=7&talento=Any";

		await this.page.goto(
			`${config.pmanager.baseUrl}${baseSearchUrl}&pid=${pageNumber}`,
		);
		await this.page.waitForLoadState("networkidle");
		await this.page.waitForSelector("table", { timeout: 10000 });
	}

	async navigateToPlayerPage(playerId) {
		await this.page.goto(
			`${config.pmanager.baseUrl}/ver_jogador.asp?jog_id=${playerId}#info`,
		);
		await this.page.waitForLoadState("networkidle");
		await this.page.waitForTimeout(config.scraper.delays.afterPageLoad);
	}

	async getTotalPages() {
		const paginationCell = await this.page
			.locator('td.team_players:has-text("Number of pages")')
			.textContent()
			.catch(() => null);

		if (paginationCell) {
			const match = paginationCell.match(/Number of pages:\s*(\d+)/);
			if (match) {
				return Number.parseInt(match[1]);
			}
		}
		return 1;
	}
}

module.exports = BrowserService;
