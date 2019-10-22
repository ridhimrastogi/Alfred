const puppeteer = require('puppeteer');
const { expect }  = require('chai');


describe('Test create file usecase', function () {

    let browser;
    let page;

    this.timeout(5000000);

    beforeEach(async () => {
        browser = await puppeteer.launch({headless:true});
        page = await browser.newPage();

        await page.goto('https://alfred-filebot.herokuapp.com', {waitUntil: 'networkidle0'});
    });

    afterEach(async () => {
        await browser.close();
    });

    // TODO: Add test cases here.

});