const Client = require('./mattermost-client/client');
const handler = require('./handlers.js');
//const scopes = require('../test/utils/scopes.js');


let host = "mattermost-csc510-9.herokuapp.com",
    group = "alfred",
    bot_name = "@alfred",
    client = new Client(host, group, {});

async function main() {

    // bot login
    let request = await client.tokenLogin(process.env.BOTTOKEN);

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

async function parseMessage(msg) {

    if (hears(msg, "create")) {
        handler.createFile(msg, client);
    }
    else if (hears(msg, "list")) {
        handler._justListFiles(msg, client);
    }
    else if (hears(msg, "download")) {
        handler._downloadFile(msg, client);
    }
    else if (hears(msg, "add") || hears(msg, "change") || hears(msg, "update")) {
        handler.updateCollaboratorsInFile(msg, client);
    }
    else if (hears(msg, "comment") || hears(msg, "comments")) {
        handler._fetchCommentsInFile(msg, client);
    }
}

(async () => {
    await main();
})()