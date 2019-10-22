const puppeteer = require('puppeteer');
const { expect }  = require('chai');

describe('Test file update usecase', function () {

    let browser;
    let page;

    this.timeout(5000000);

    beforeEach(async () => {
        browser = await puppeteer.launch({headless:true});
        page = await browser.newPage();

        await page.goto('https://alfred-filebot.herokuapp.com/alfred/channels/town-square', {waitUntil: 'networkidle0'});
    });

    afterEach(async () => {
        await browser.close();
    });
 

    it ('should add collaborators to an existing file with given permission', async () => {

        let filename = 'file.doc';
        await page.waitForSelector('textarea#post_textbox');
        await page.type(
            'textarea[id=post_textbox]', 
            '@alfred add @ridhim @shubham as collaborators with read and edit access in ' + filename
        );
        await page.keyboard.press('Enter');

        await page.waitForSelector('h2 a');
        const botResponse = await page.evaluate(() => {
            // fetches latest response from the bot
            return Array.from(document.querySelectorAll('div.post-message__text')).pop().children[0];
        });

        expect(botResponse).to.be.contain('Updated collaborators to file ' + filename + ' successfully\n' +
                                            'Here is the link for the same:');

        await browser.close();
    });

});