const fs = require('fs');
const util = require('util');
const helper = require("./utils/helpers.js");
const drive = require("./drive.js");
const stream = require('stream')

// Only for developer testing, change to "" if user not jaymindesai
const fileFilter = "00atf"

class Handler {
    constructor(client) {
        this.client = client;
    }

    async listFiles(msg) {
        let channel = msg.broadcast.channel_id;
        let user = msg.data.sender_name.split('@')[1];

        if (!this.validateUser(user, channel)) return;

        drive.listFiles()
            .then(result => _extractFileInfo(result.data.files))
            .then(files => Array.from(files.keys()))
            .then(files => {
                let msg = files.length ? files.join('\n') : "No files found";
                this.client.postMessage(msg, channel);
            })
            .catch(error => this.sendGenericErrorMsg(error, "Failed to list files"));
    }

    async downloadFile(msg) {
        let channel = msg.broadcast.channel_id;
        let user = msg.data.sender_name.split('@')[1];

        if (!this.validateUser(user, channel)) return;

        let post = JSON.parse(msg.data.post);
        let fileName = post.message.split(" ").filter(x => x.includes('.'))[0];

        _validateFile(fileName);

        let files = await this._listFiles();

        if (!files.has(fileName)) {
            return this.client.postMessage("No such file found!", channel);
        } else {
            let ephemeralPath = `./ephemeral-files/${fileName}`;
            drive.downloadFile(files.get(fileName))
                .then(result => createEphemeralFile(result.data, ephemeralPath))
                .then(() => this.uploadFileToMattermost(ephemeralPath, channel))
                .catch(error => this.sendGenericErrorMsg(error, "Failed to download file"))
                .finally(() => unlinkFile(ephemeralPath));
        }
    }

    async fetchCommentsInFile(msg) {
        let channel = msg.broadcast.channel_id;
        let user = msg.data.sender_name.split('@')[1];

        if (!this.validateUser(user, channel)) return;

        let post = JSON.parse(msg.data.post);
        let fileName = post.message.split(" ").filter(x => x.includes('.'))[0];
        let fileExtension = fileName.split(".")[1];

        _validateFile(fileName);

        if (fileExtension == "doc")
            fileName = fileName.split(".")[0];

        let files = await this._listFiles();

        if (!files.has(fileName)) {
            return this.client.postMessage("No such file found!", channel);
        } else {
            drive.fetchComments(files.get(fileName))
                .then(result => _prepareComments(result.data.comments))
                .then(comments => {
                    let msg = `${comments.length} comment(s) found on file ${fileName}` + "\n" + `${comments.slice(0, 5).join('\r\n')}`;
                    this.client.postMessage(msg, channel);
                })
                .catch(error => this.sendGenericErrorMsg(error, "Failed to fetch comments"))
        }
    }



    // ADD NEW USECASE HANDLERS HERE...



    async _listFiles() {
        return drive.listFiles()
            .then(result => _extractFileInfo(result.data.files, "00atf"))
            .catch(error => {
                this.sendGenericErrorMsg(error, "Failed to retrive file IDs");
                return new Map();
            });
    }

    validateUser(user, msgChannel) {
        console.log(`Validating ${user}`);
        let userId = this.client.getUserIDByUsername(user);
        let userChannel = this.client.getUserDirectMessageChannel(userId).id;
        console.log(`User Channel: ${userChannel}`);

        if (!drive.tokenExists(userId)) {
            let directMsg = `Authorize this app by visiting this url: ${drive.authUrl(userId, msgChannel)} and try again!`;
            let channelNotification = "Authorize this app! Please check you DM for more details"
            this.client.postMessage(directMsg, userChannel);
            this.client.postMessage(channelNotification, msgChannel);
            return false;
        } else if (!drive.authorize(userId)) {
            console.error("Failed to validate user");
            return false;
        } else {
            console.log("User validated");
            return true;
        }
    }

    uploadFileToMattermost(filePath, channel) {
        let fileStream = fs.createReadStream(filePath)
        this.client.uploadFile(channel, fileStream, (response) => {
            let files = response.file_infos.map(f => f.id);
            let msg = {
                message: "Here is the file you requested!",
                file_ids: files,
            }
            this.client.postMessage(msg, channel);
        })
    }

    sendGenericErrorMsg(error, text) {
        console.error(text, error);
        this.client.postMessage(text, channel);
    }
}

async function createEphemeralFile(readStream, filePath) {
    const pipeline = util.promisify(stream.pipeline)
    const writeStream = fs.createWriteStream(filePath);
    await pipeline(readStream, writeStream);
}

function unlinkFile(filePath) {
    return fs.unlink(filePath, err => {
        if (err) console.error(err);
    })
}

function _validateFile(fileName) {
    if (!helper.checkValidFile(fileName))
        return this.client.postMessage("Please Enter a valid file name", channel);

    let fileExtension = fileName.split(".")[1];

    if (!helper.checkValidFileExtension(fileExtension))
        return this.client.postMessage("Please enter a supported file extension.\n" +
            "Supported file extenstion: doc, docx, ppt, pptx, xls, xlsx, pdf, jpeg", channel);
}

function _extractFileInfo(files, filter = fileFilter) {
    let names = new Map();
    if (files.length) {
        files.filter((file) => file.name.startsWith(filter))
            .map((file) => names.set(`${file.name}`, `${file.id}`));
    } else {
        console.log('No files found');
    }
    return names;
}

function _prepareComments(comments) {
    let _comments = [];
    if (!comments.length) {
        throw new Error('No comments found');
    } else {
        comments.map(x => _comments.push(`${x.author.displayName}: ${x.content}`));
    }
    return _comments;
}

module.exports = Handler;