const puppeteer = require('puppeteer')
const { expect } = require('chai')


const loginEmail = process.env.MATTERMOST_EMAIL;
const loginPassword = process.env.MATTERMOST_PWD;
const mattermostUrl = 'https://alfred-filebot.herokuapp.com/alfred/channels/town-square';
const PROCESSING = 2000;

async function login(browser, url) {
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle0' });

    // Login
    await page.type('input[id=loginId]', loginEmail);
    await page.type('input[id=loginPassword]', loginPassword);
    await page.click('button[id=loginButton]');

    // Wait for redirect
    await page.waitForNavigation();
    return page;
}

async function postMessage(page, msg) {
    // Waiting for page to load
    await page.waitForSelector('#post_textbox');

    // Focus on post textbox and press enter.
    await page.focus('#post_textbox')
    await page.keyboard.type(msg);
    await page.keyboard.press('Enter');
}

describe('Test file download usecase', function () {
    var browser;
    var page;

    this.timeout(5000000);

    beforeEach(async () => {
        browser = await puppeteer.launch({ headless: false, args: ["--no-sandbox", "--disable-web-security"] });
        page = await login(browser, `${mattermostUrl}/login`);
    });

    afterEach(async () => {
        await page.waitFor(PROCESSING);
        await browser.close();
    });


    it('should provide download link to an existing file', async () => {
        let filename = 'Resource.pdf';
        let msg = "@alfred download " + filename;
        await postMessage(page, msg);

        await page.waitFor(PROCESSING);
        await page.waitForSelector('button[aria-label="alfred"]');

        const botResponse = await page.evaluate(() => {
            // fetches latest response from the bot
            return Array.from(document.querySelectorAll('div[class=post-message__text]')).pop().children[0].textContent;
        });

        expect(botResponse).to.contain("Download link:");
    });

});