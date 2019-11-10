const fs = require('fs');
const util = require('util');
const helper = require("./utils/helpers.js");
const drive = require("./drive.js");
const stream = require('stream')


function validateUser(user, client, msg_channel) {
    console.log(`Validating ${user}`);
    let userID = client.getUserIDByUsername(user);
    let user_channel = client.getUserDirectMessageChannel(userID).id;
    console.log(`User Channel: ${user_channel}`);

    if (!drive.checkForToken(userID)) {
        direct_msg = `Authorize this app by visiting this url: ${drive.getAuthUrl(userID, msg_channel)} and try again!`;
        channel_notification = "Authorize this app! Please check you DM for more details"
        client.postMessage(direct_msg, user_channel);
        client.postMessage(channel_notification, msg_channel);
        return false;
    } else if (drive.authorize(userID)) {
        console.log("User Validated");
        return true;
    } else {
        console.error("Failed to validate user");
        return false;
    }
}

async function _listFiles() {
    return drive.listFiles()
        .then(result => _extractFileInfo(result.data.files, "00atf"))
        .catch(error => {
            msg = "Failed to retrive file IDs";
            console.error(msg, error);
            client.postMessage(msg, channel)
            return new Map();
        });
}

async function listFiles(msg, client) {
    let channel = msg.broadcast.channel_id;
    let user = msg.data.sender_name.split('@')[1];

    if (!validateUser(user, client, channel)) return;

    drive.listFiles()
        .then(result => _extractFileInfo(result.data.files, "00atf"))
        .then(files => Array.from(files.keys()))
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

const createEphemeralFile = async (read, fileName) => {
    const filePath = `./ephemeral-files/${fileName}`;
    const pipeline = util.promisify(stream.pipeline)
    const write = fs.createWriteStream(filePath);
    await pipeline(read, write);
    return filePath;
}

const uploadFileToMattermost = (filePath, channel, client) => {
    fileStream = fs.createReadStream(filePath)
    client.uploadFile(channel, fileStream, (response) => {
        files = response.file_infos.map(f => f.id);
        msg = {
            message: "Here is the file you requested!",
            file_ids: files,
        }
        client.postMessage(msg, channel);
    })
}

const unlinkFile = (filePath) => {
    return fs.unlink(filePath, err => {
        if (err) console.error(err);
    })
}

async function downloadFile(msg, client) {
    let channel = msg.broadcast.channel_id;
    let user = msg.data.sender_name.split('@')[1];

    if (!validateUser(user, client, channel)) return;

    let post = JSON.parse(msg.data.post);
    let fileName = post.message.split(" ").filter(x => x.includes('.'))[0];

    _validateFile(fileName, client);

    let files = await _listFiles();

    if (!files.has(fileName)) {
        return client.postMessage("No such file found!", channel);
    } else {
        drive.downloadFile(files.get(fileName))
            .then(result => createEphemeralFile(result.data, fileName))
            .then(filePath => uploadFileToMattermost(filePath, channel, client))
            .catch(error => {
                msg = "Failed to download file";
                console.error(msg, error);
                client.postMessage(msg, channel);
            })
            .finally(() => unlinkFile(`./ephemeral-files/${fileName}`));
    }
}

async function fetchCommentsInFile(msg, client) {
    let channel = msg.broadcast.channel_id;
    let user = msg.data.sender_name.split('@')[1];

    if (!validateUser(user, client, channel)) return;

    let post = JSON.parse(msg.data.post);
    let fileName = post.message.split(" ").filter(x => x.includes('.'))[0];
    let fileExtension = fileName.split(".")[1];

    _validateFile(fileName, client);

    if (fileExtension == "doc")
        fileName = fileName.split(".")[0];

    let files = await _listFiles();

    if (!files.has(fileName)) {
        return client.postMessage("No such file found!", channel);
    } else {
        drive.fetchComments(files.get(fileName))
            .then(result => _prepareComments(result.data.comments))
            .then(comments => {
                if (comments.length > 5) {
                    client.postMessage(`${comments.length} comments on the file ${fileName}`, channel)
                    comments = comments.slice(0, 5);
                }
                client.postMessage(comments.join('\r\n'), channel);
            })
            .catch(error => {
                msg = "Failed to fetch comments";
                console.error(msg, error);
                client.postMessage(msg, channel);
            })
    }
}

function _validateFile(fileName, client) {
    if (!helper.checkValidFile(fileName))
        return client.postMessage("Please Enter a valid file name", channel);

    let fileExtension = fileName.split(".")[1];

    if (!helper.checkValidFileExtension(fileExtension))
        return client.postMessage("Please enter a supported file extension.\n" +
            "Supported file extenstion: doc, docx, ppt, pptx, xls, xlsx, pdf, jpeg", channel);
}

const _extractFileInfo = (files, filter = "") => {
    let names = new Map();
    if (files.length) {
        files.filter((file) => file.name.startsWith(filter))
            .map((file) => names.set(`${file.name}`, `${file.id}`));
    } else {
        console.log('No files found');
    }
    return names;
}

const _prepareComments = (comments) => {
    let _comments = [];
    if (!comments.length) {
        throw new Error('No comments found');
    } else {
        comments.map(x => _comments.push(`${x.author.displayName}: ${x.content}`));
    }
    return _comments;
}

module.exports = {
    downloadFile,
    listFiles,
    fetchCommentsInFile
};