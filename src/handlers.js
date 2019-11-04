const fs = require('fs');
const util = require('util');
const os = require('os');
const uuid = require('uuid');
const path = require('path');
const drive = require("./drive.js");
const helper = require("./utils/helpers.js");
const google_auth = require("./google_auth.js");
const stream = require('stream')

async function validateuser(msg, client) {
    console.log(msg);
    let sender = msg.data.sender_name.split('@')[1];
    let userID = client.getUserIDByUsername(sender);
    let user_channel = client.getUserDirectMessageChannel(userID);
    console.log(`I am ${sender}`);
    console.log(user_channel);
    let content = fs.readFileSync('../credentials.json', 'utf8');
    console.log("content", content);
    google_auth.authorize(JSON.parse(content), user_channel.id, client);
}

//stub for listing drive files
async function listFiles(msg, client) {
    let channel = msg.broadcast.channel_id;
    await validateuser(msg, client);
    console.log("Authenticated\n");
    let files = google_auth.listFiles();
    if (typeof files === "undefined" || files.length == 0)
        client.postMessage('No files found.');
    else {
        client.postMessage('Files:', channel);
        files.map((file) => {
            client.postMessage(`${file.name} (${file.id})`, channel);
        });
    }
}

//stub for creating a file 
async function createFile(msg, client) {

    let channel = msg.broadcast.channel_id,
        post = JSON.parse(msg.data.post),
        fileName = post.message.split(" ").filter(x => x.includes('.'))[0];

    // TODO: Common stub. Needs to be extracted.
    if (!helper.checkValidFile(fileName))
        return client.postMessage("Please Enter a valid file name", channel);

    let fileExtension = fileName.split(".")[1];

    if (!helper.checkValidFileExtension(fileExtension))
        return client.postMessage("Please enter a supported file extension.\n" +
            "Supported file extenstion: doc, docx, ppt, pptx, xls, xlsx, pdf", channel);

    let res = await drive.createFile({
        "originalFilename": fileName,
        "mimeType": helper.getMIMEType(fileExtension)
    }),
        fileLink = res.webViewLink,
        usernames = post.message.split(" ").filter(x => x.includes('@') && x !== "@alfred").map(uh => uh.replace('@', ''));

    sendDirecMessageToUsers(usernames, fileName, fileLink, client);
    client.postMessage("Created file " + fileName + " successfully\n" + "Here is the link for the same: " + fileLink, channel);
}

//function to download file
async function downloadFile(msg, client) {
    let channel = msg.broadcast.channel_id;
    let post = JSON.parse(msg.data.post);

    let fileName = post.message.split(" ").filter(x => x.includes('.'))[0];

    // TODO: Common stub. Needs to be extracted.
    if (!helper.checkValidFile(fileName))
        return client.postMessage("Please Enter a valid file name", channel);

    let fileExtension = fileName.split(".")[1];

    if (!helper.checkValidFileExtension(fileExtension))
        return client.postMessage("Please enter a supported file extension.\n" +
            "Supported file extenstion: doc, docx, ppt, pptx, xls, xlsx, pdf", channel);

    let res = await drive.getFiles();
    let files = res.files;
    let file = files.find(function (element) {
        return element.name == fileName;
    });

    if (typeof file === 'undefined') {
        return client.postMessage("No such file found!", channel);
    }

    let result = await drive.downloadAFile(file.name)
    return client.postMessage("Download link: " + result.webViewLink, channel);
}

/*
    Sample query: @alfred add @ridhim @shubham as collaborators with read and edit access in file.doc
    Sample query: @alfred change/update @ridhim access to read access in file.doc
*/
async function updateCollaboratorsInFile(msg, client) {

    let channel = msg.broadcast.channel_id,
        message = JSON.parse(msg.data.post).message,
        splittedMessageBySpace = message.split(" ");

    let fileName = splittedMessageBySpace.filter(x => x.includes('.'))[0],
        collaboatorList = splittedMessageBySpace.filter(x => x.includes('@') && x !== "@alfred");
    permissionList = splittedMessageBySpace
        .filter(x => ["read", "edit", "comment"].includes(x.toLowerCase()))
        .map(x => x.toLowerCase());

    if (collaboatorList.length !== permissionList.length)
        return client.postMessage("Invalid request!", channel);

    // TODO: Common stub. Needs to be extracted.
    if (!helper.checkValidFile(fileName))
        return client.postMessage("Please Enter a valid file name", channel);

    if (!helper.checkValidFileExtension(fileName.split(".")[1]))
        return client.postMessage("Please enter a supported file extension.\n" +
            "Supported file extenstion: doc, docx, ppt, pptx, xls, xlsx, pdf", channel);

    let file = await drive.getAFile(fileName),
        usernames = collaboatorList.map(uh => uh.replace('@', ''));

    if (file === undefined)
        return client.postMessage("No such file found!", channel);

    file.sharingUser = collaboatorList;
    file.permissions = permissionList;

    let res = await drive.updateFile(file),
        fileLink = res.webViewLink;

    if (fileLink !== undefined) {

        sendDirecMessageToUsers(usernames, fileName, fileLink, client);
        client.postMessage("Updated collaborators to file " + fileName + " successfully\n" + "Here is the link for the same: " + fileLink, channel);

    } else {
        return client.postMessage("Error occurred while adding collaborators.!! :(", channel);
    }
}

//function to DM users
function sendDirecMessageToUsers(usernames, fileName, fileLink, client) {
    userIDS = usernames.map(username => client.getUserIDByUsername(username));
    for (userID in userIDS) {
        user_channel = client.getUserDirectMessageChannel(
            userIDS[userID]);
        client.postMessage("You have been added as a collaborator for " + fileName + "\n" +
            "Here is the link for the same: " + fileLink, user_channel.id);
    }
}

// -------------------------------------------------------------------

function _validateUser(user, client, msg_channel) {
    console.log(`Validating ${user}`);
    let userID = client.getUserIDByUsername(user);
    let user_channel = client.getUserDirectMessageChannel(userID).id;
    console.log(`User Channel: ${user_channel}`);

    if (!google_auth._checkForToken()) {
        direct_msg = `Authorize this app by visiting this url: ${google_auth._getAuthUrl()} and try again!`;
        channel_notification = "Authorize this app! Please check you DM for more details"
        client.postMessage(direct_msg, user_channel);
        client.postMessage(channel_notification, msg_channel);
        return false;
    } else if (google_auth._authorize()) {
        console.log("User Validated");
        return true;
    } else {
        console.error("Failed to validate user");
        return false;
    }
}

async function _listFiles(msg, client) {
    let channel = msg.broadcast.channel_id;
    let user = msg.data.sender_name.split('@')[1];

    if (!_validateUser(user, client, channel)) return;

    google_auth._listFiles()
        .then(result => extractFileInfo(result.data.files))
        .then(files => Array.from(files.keys()))
        .then(files => files.filter((file) => file.startsWith("00atf")))
        .then(files => {
            if (files.length) {
                client.postMessage(files.join('\n'), channel)
            } else {
                client.postMessage("No files found", channel);
            }
        }).catch(error => {
            msg = "Failed to list files";
            console.error(msg, error);
            client.postMessage(msg, channel);
        });
}

async function _downloadFile(msg, client) {
    let channel = msg.broadcast.channel_id;
    let user = msg.data.sender_name.split('@')[1];

    if (!_validateUser(user, client, channel)) return;

    let post = JSON.parse(msg.data.post);
    let fileName = post.message.split(" ").filter(x => x.includes('.'))[0];

    validateFile(fileName);

    let files = await google_auth._listFiles()
        .then(result => extractFileInfo(result.data.files))
        .catch(error => {
            msg = "Failed to retrive file IDs";
            console.error(msg, error);
            client.postMessage(msg, channel);
        });

    if (!files.has(fileName)) {
        return client.postMessage("No such file found!", channel);
    } else {
        google_auth._downloadFile(files.get(fileName))
            .then(async (result) => {
                const filePath = `./ephemeral-files/${fileName}`;
                const pipeline = util.promisify(stream.pipeline)
                const write = fs.createWriteStream(filePath);
                await pipeline(result.data, write);
                return filePath;
            })
            .then(filePath => client.uploadFile(channel, fs.createReadStream(filePath), (response) => {
                if ('file_infos' in response) {
                    files = response.file_infos.map(f => f.id);
                    msg = {
                        message: "Here is the file you requested!",
                        file_ids: files,
                    }
                    client.postMessage(msg, channel);
                    return fs.unlink(filePath, (err) => {
                        if (err) throw err;
                    });
                } else {
                    throw new Error('Failed to upload the downloaded file to Mattermost!')
                }
            }))
            .catch(error => {
                msg = "Failed to download file";
                console.error(msg, error);
                client.postMessage(msg, channel);
            });
    }
}

function validateFile(fileName, client) {
    if (!helper.checkValidFile(fileName))
        return client.postMessage("Please Enter a valid file name", channel);

    let fileExtension = fileName.split(".")[1];

    if (!helper.checkValidFileExtension(fileExtension))
        return client.postMessage("Please enter a supported file extension.\n" +
            "Supported file extenstion: doc, docx, ppt, pptx, xls, xlsx, pdf, jpeg", channel);
}

const extractFileInfo = (files) => {
    let names = new Map();
    if (files.length) {
        files.filter((file) => file.name.startsWith("00atf"))
            .map((file) => names.set(`${file.name}`, `${file.id}`));
    } else {
        console.log('No files found');
    }
    return names;
}

module.exports = {
    _downloadFile,
    _listFiles,
    listFiles,
    createFile,
    downloadFile,
    updateCollaboratorsInFile,
    sendDirecMessageToUsers
};