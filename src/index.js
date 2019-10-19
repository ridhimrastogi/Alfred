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
        //console.log(msg.data.post);
        if (hears(msg, "design")) {
            parseMessage(msg);
        }
        else if(hears(msg,"create")){
            createFile(msg);
        }
        else if(hears(msg,"delete")){
            deleteFile(msg);
        }
    });

}

function hears(msg, text) {
    if (msg.data.sender_name == bot_name) return false;
    if (msg.data.post) {
        let post = JSON.parse(msg.data.post);
        if (post.message.indexOf(text) >= 0) {  //keyword checking if more than one instance of text
            return true;
        }
    }
    return false;
}

function createFile(msg){
    let post = JSON.parse(msg.data.post);
    let fileName = post.message.split(" ").filter(x => x.includes('.'))[0]
    let fileExtension = fileName.split(".")[1]

    let createFileObj = {
        "originalFilename" : fileName,
        "mimeType" : getMIMEType(fileExtension)
    }

    let channel = msg.broadcast.channel_id;
    client.postMessage("Creating file with object " + JSON.stringify(createFileObj,null,2),channel);
}

function getMIMEType(fileExtension){
    if(fileExtension == "doc"){
        return "application/msword"
    }
    else if(fileExtension == "docx"){
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }
    else if(fileExtension == "ppt"){
        return "application/vnd.ms-powerpoint"
    }
    else if(fileExtension == "pptx"){
        return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    }
    else if(fileExtension == "xls"){
        return "application/vnd.ms-excel"
    }
    else if(fileExtension == "xlsx"){
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
    else if(fileExtension == "pdf"){
        return "application/pdf"
    }
}

function deleteFile(msg){
    let post = JSON.parse(msg.data.post);
    let fileName = post.message.split(" ").filter(x => x.includes('.'))[0]
    let fileExtension = fileName.split(".")[1]
    
    let createFileObj = {
        "originalFilename" : fileName,
        "mimeType" : getMIMEType(fileExtension)
    }

    let channel = msg.broadcast.channel_id;
    client.postMessage("Deleting file with object " + JSON.stringify(createFileObj,null,2),channel);

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