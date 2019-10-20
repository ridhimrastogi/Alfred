const Client = require('./mattermost-client/client');
const fs = require('fs')
const drive = require("./drive.js");
const data = require("./mock.json")
const nock = require('nock')

// Scope for listing files
const scope1 = nock('https://www.googleapis.com/drive/v3/files')
  .persist()
  .get('/')
  .reply(200, JSON.stringify(data.fileList));

// Scope for creating a file
const scope2 = nock('https://www.googleapis.com/drive/v3/files')
  .persist()
  .post('/')
  .reply(200, JSON.stringify(data.file));

// Scope for fetching a file
const scope3 = nock('https://www.googleapis.com/drive/v3/files')
  .persist()
  .get('/^[a-z0-9]+$/')
  .reply(200, JSON.stringify(data.file));

// Scope for deleting a file
const scope4 = nock('https://www.googleapis.com/drive/v3/files')
  .persist()
  .delete('/^[a-z0-9]+$/')
  .reply(200, JSON.stringify(data.file));

// Scope for downloading a file
const scope5 = nock('https://www.googleapis.com/drive/v3/files')
  .persist()
  .get('/^[a-z0-9]+?alt=media$/')
  .reply(200, JSON.stringify(data.file));

let host = "alfred-filebot.herokuapp.com"
let group = "alfred"
let bot_name = "alfred";
let client = new Client(host, group, {});

async function main() {
    let request = await client.tokenLogin(process.env.BOTTOKEN);

    client.on('message', function (msg) {
        if (hears(msg, "design")) {
            parseMessage(msg);
        }
        else if(hears(msg,"create")){
            createFile(msg);
        }
        else if(hears(msg,"delete")){
            deleteFile(msg);
        }
        else if(hears(msg,"list")){
            listFiles(msg);
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

//stub for listing drive files
async function listFiles(msg){
    let res = await drive.getFiles();
    let files = res.files;
    let fileNames = new Array();
    for(n in files){
        fileNames.push(files[n].name + "\n");
    }
    let channel = msg.broadcast.channel_id;
    client.postMessage("Following are the files present in your drive: \n" + fileNames.join(''),channel);
}

//stub for creating a file 
async function createFile(msg){
    let post = JSON.parse(msg.data.post);
    let fileName = post.message.split(" ").filter(x => x.includes('.'))[0]
    let fileExtension = fileName.split(".")[1]
    let createFileObj = {
        "originalFilename" : fileName,
        "mimeType" : getMIMEType(fileExtension)
    }
    let res = await drive.createFile(createFileObj);
    let channel = msg.broadcast.channel_id;
    client.postMessage("Created file " + fileName + " successfully\n" + "Here is the link for the same: " + res.webViewLink ,channel);
}

//function to get the MIME type of a particular file
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

//stub to delete a file
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