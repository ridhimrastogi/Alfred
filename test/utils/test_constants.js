// Mattermost Server
const MM_URL = "https://mattermost-csc510-9-test.herokuapp.com/alfredtest/channels/town-square";
const TEST_USER = process.env.MM_TEST_USER;
const TEST_PASSWORD = process.env.MM_TEST_PASSWORD;

// Test Config
const PROCESSING = 2000;
const HEADLESS = process.env.HEADLESS || false;
const SLO_MO = 0;

module.exports = {
    MM_URL,
    TEST_USER,
    TEST_PASSWORD,
    PROCESSING,
    HEADLESS,
    SLO_MO
}