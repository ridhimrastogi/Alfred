//const scopes = require('../test/utils/scopes.js');
const fs = require('fs');
const constants = require('./utils/app_constants');

const Client = require('./mattermost-client/client');
const Handler = require('./handler');

if (!fs.existsSync(constants.EPHEMERAL_FILES)) fs.mkdirSync(constants.EPHEMERAL_FILES);

let bot = constants.BOT_HANDLE;

let client = new Client(constants.MM_HOST, constants.MM_GROUP, {});
let handler = new Handler(client);

async function main() {
    // Bot Login
    client.tokenLogin(process.env.BOTTOKEN);

    client.on('message', function (msg) {
        // Hears
        if (hears(msg, bot)) {
            // Process - Send
            parseMessage(msg);
        }
    });
}

function hears(msg, text) {
    if (msg.data.sender_name == bot) return false;

    if (msg.data.post) {
        let post = JSON.parse(msg.data.post);
        let message = post.message.split("\"")[0];
        if (message.indexOf(text) >= 0) {
            return true;
        }
    }
    return false;
}

function parseMessage(msg) {
    if (hears(msg, "create")) {
        handler.createFile(msg);
    } else if (hears(msg, "list")) {
        handler.listFiles(msg);
    } else if (hears(msg, "download")) {
        handler.downloadFile(msg);
    } else if (hears(msg, "add")) {
        handler.updateCollaboratorsInFile(msg, "add");
    } else if (hears(msg, "change") || hears(msg, "update")) {
        handler.updateCollaboratorsInFile(msg, "update");
    } else if (hears(msg, "comment") || hears(msg, "comments")) {
        handler.fetchCommentsInFile(msg);
    }
}

(async () => {
    await main();
})()