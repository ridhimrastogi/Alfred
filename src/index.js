const Client = require('./mattermost-client/client');
const Handler = require('./handler');
//const scopes = require('../test/utils/scopes.js');

let host = "mattermost-csc510-9.herokuapp.com",
    group = "alfred",
    bot_name = "@alfred";

let client = new Client(host, group, {});
let handler = new Handler(client);

async function main() {
    // bot login
    client.tokenLogin(process.env.BOTTOKEN);

    client.on('message', function (msg) {
        // hears
        if (hears(msg, bot_name)) {
            // process-send
            parseMessage(msg);
        }
    });
}

function hears(msg, text) {
    if (msg.data.sender_name == bot_name) return false;

    if (msg.data.post) {
        let post = JSON.parse(msg.data.post);
        if (post.message.indexOf(text) >= 0) {
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
    } else if (hears(msg, "add") || hears(msg, "change") || hears(msg, "update")) {
        handler.updateCollaboratorsInFile(msg);
    } else if (hears(msg, "comment") || hears(msg, "comments")) {
        handler.fetchCommentsInFile(msg);
    }
}

(async () => {
    await main();
})()