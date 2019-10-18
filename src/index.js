const Client = require('./mattermost-client/client');
const fs = require('fs')
const drive = require("./drive.js");
const data = require("./mock.json")
const nock = require('nock')
 
const scope1 = nock('https://www.googleapis.com/drive/v3/files')
  .persist()
  .get('/')
  .reply(200, JSON.stringify(data.fileList));

let host = "alfred-filebot.herokuapp.com"
let group = "alfred"
let bot_name = "alfred";
let client = new Client(host, group, {});

async function main() {
    let request = await client.tokenLogin(process.env.BOTTOKEN);

    client.on('message', function (msg) {
        console.log(msg);
        if (hears(msg, "design")) {
            parseMessage(msg);
        }
    });

}

function hears(msg, text) {
    if (msg.data.sender_name == bot_name) return false;
    if (msg.data.post) {
        let post = JSON.parse(msg.data.post);
        if (post.message.indexOf(text) > 0) {
            return true;
        }
    }
    return false;
}

async function parseMessage(msg) {
    let channel = msg.broadcast.channel_id;
    client.postMessage("Uploading DESIGN.md", channel);
    data = fs.createReadStream('../DESIGN.md');
    client.uploadFile(channel, data, (res) => {
        files = res.file_infos.map(x => x.id);
        msg = {
            message: "PFA, my internals!",
            file_ids: files,
        }
        client.postMessage(msg, channel);
    });
}

(async () => {
    await main();
})()