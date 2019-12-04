const fs = require('fs');
const util = require('util');
const helper = require("./utils/helpers");
const drive = require("./drive");
const stream = require('stream');
const constants = require('./utils/app_constants');

// Only for developer testing, change to "" if user not jaymindesai
const fileSeparator = "|";
const fileFilter = "";

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
                let msg = "Here are the files I found on your google drive::\n"
                msg = files.length ? msg + files.join('\n') : "No files found";
                this.client.postMessage(msg, channel);
            })
            .catch(error => this.sendGenericErrorMsg(error, "Failed to list files", channel));
    }

    async createFile(msg) {
        let channel = msg.broadcast.channel_id;
        let post = JSON.parse(msg.data.post);
        let user = msg.data.sender_name.split('@')[1];
        let fileName = post.message.split("\"")[1];

        if (!this.validateUser(user, channel)) return;

        this._validateFile(fileName, channel);

        let fileExtension = fileName.split(".")[1];

        let usernames = post.message.split(" ").filter(x => x.includes('@') && x !== "@alfred").map(uh => uh.replace('@', ''))
        let invalidUsernames = this._checkInvalidUsernames(usernames, this.client)

        if (invalidUsernames.length) {
            if (invalidUsernames.length == 1) {
                invalidUsernames = invalidUsernames.join(', ')
                return this.client.postMessage(`${invalidUsernames} is an invalid username, Please try again with valid a username`, channel)
            } else {
                return this.client.postMessage(`${invalidUsernames} are invalid usernames, Please try again with valid usernames`, channel)
            }
        }

        let fileParams = {
            "name": fileName.split(".")[0],
            "mimeType": helper.getMIMEType(fileExtension)
        }

        console.log("File params are: " + JSON.stringify(fileParams))
        let response = await drive.createFile(fileParams),
            fileLink = response.data.webViewLink;

        if (usernames.length > 0) {
            this.updateCollaboratorsInFile(msg, "add");
        }
        //this._sendDirecMessageToUsers(usernames, fileName, fileLink);
        this.client.postMessage("Created file " + fileName + " successfully\n" + "Here is the link for the same: " + fileLink, channel);
    }

    // Sample query: @alfred add @ridhim @shubham as collaborators with read and edit access in file.doc
    // Sample query: @alfred change/update @ridhim access to edit access in file.doc
    async updateCollaboratorsInFile(msg, command) {
        let miscParams = this._getParamsforUpdateFile(msg);

        if (miscParams.collaboatorList.length !== miscParams.permissionList.length)
            return this.client.postMessage("Invalid request!", miscParams.channel);

        let post = JSON.parse(msg.data.post);
        let fileName = post.message.split("\"")[1];
        let usernames = miscParams.collaboatorList.map(uh => uh.replace('@', ''));

        if (!this.validateUser(miscParams.sender, miscParams.channel)) return;

        this._validateFile(fileName, miscParams.channel);

        let res = await drive.getFileByFilter("name=" + "'" + fileName.split(".")[0] + "'"),
            files = res.data.files;

        if (files === undefined || !files.length)
            return this.client.postMessage("No such file found!", miscParams.channel);

        let file = files[0],
            fileLink = file.webViewLink,
            response;

        if (command === "update") {
            let permission_res = await drive.listPermission(file.id);
            if (permission_res !== undefined || !permission_res.data.permissions.length) {
                response = await drive.updateCollaborators(
                    this._getPermissionParamsForUpdateCollab(file, usernames, permission_res.data.permissions,
                        miscParams.permissionList));
                if (response)
                    this.client.postMessage("Updated collaborators to file " + fileName + " successfully\n" +
                        "Here is the link for the same: " + fileLink, miscParams.channel);
                else
                    return this.client.postMessage("Error occurred while adding collaborators.!! :(", miscParams.channel);
            } else {
                response = await drive.addCollaborators(
                    this._getPermissionParamsForAddCollab(file, miscParams.permissionList, usernames));

                if (response) {
                    this._sendDirecMessageToUsers(usernames, fileName, fileLink);
                    this.client.postMessage("Updated collaborators to file " + fileName + " successfully\n" +
                        "Here is the link for the same: " + fileLink, miscParams.channel);
                } else
                    return this.client.postMessage("Error occurred while adding collaborators.!! :(", miscParams.channel);
            }
        }

        if (command === "add") {
            response = await drive.addCollaborators(
                this._getPermissionParamsForAddCollab(file, miscParams.permissionList, usernames));

            if (response) {
                this._sendDirecMessageToUsers(usernames, fileName, fileLink);
                this.client.postMessage("Updated collaborators to file " + fileName + " successfully\n" +
                    "Here is the link for the same: " + fileLink, miscParams.channel);
            } else
                return this.client.postMessage("Error occurred while adding collaborators.!! :(", miscParams.channel);
        }
    }

    _getParamsforUpdateFile(msg) {
        let params = {}
        params.channel = msg.broadcast.channel_id,
            params.sender = msg.data.sender_name.split('@')[1],
            params.senderUserID = this.client.getUserIDByUsername(params.sender),
            params.splittedMessageBySpace = JSON.parse(msg.data.post).message.split(" "),
            params.collaboatorList = params.splittedMessageBySpace.filter(x => x.includes('@') && x !== "@alfred"),
            params.permissionList = params.splittedMessageBySpace.filter(x => ["read", "edit", "comment"]
                .includes(x.toLowerCase()))
                .map(x => x.toLowerCase())
        return params;
    }

    _getPermissionParamsForUpdateCollab(file, usernames, permission_res, permissionList) {
        let updateParams = {},
            perm = [];
        updateParams.fileId = file.id;
        let mclient = this.client;
        usernames.forEach(function (username, index) {
            let role = 'reader';
            let element = permissionList[index];
            let permission = permission_res.filter(p =>
                p.emailAddress == mclient.getUserEmailByUsername(username))[0];
            if (element === 'comment') role = 'commenter';
            else if (element === 'edit') role = 'writer';
            perm.push({
                permissionId: permission.id,
                role: role
            });
        });
        updateParams.permissions = perm;

        return updateParams;
    }

    _getPermissionParamsForAddCollab(file, permissionList, usernames) {
        let params = {};

        params.fileId = file.id;
        let permissions = [];

        let mclient = this.client;

        permissionList.forEach(function (element, index) {
            let role, permission = {
                'type': 'user'
            };

            if (element === 'comment') role = 'commenter';
            else if (element === 'edit') role = 'writer';
            else role = 'reader';
            permission.role = role;
            permission.emailAddress = mclient.getUserEmailByUsername(usernames[index]);

            permissions.push(permission);
        });

        params.permissions = permissions;

        return params;
    }

    async downloadFile(msg) {
        let channel = msg.broadcast.channel_id;
        let user = msg.data.sender_name.split('@')[1];

        if (!this.validateUser(user, channel)) return;

        let post = JSON.parse(msg.data.post);
        let fileName = post.message.split("\"")[1];

        this._validateFile(fileName, channel, false);

        let files = await this._listFiles();
        
        let fileNameDriveFile = fileName.split(".")[0];
        if (files.get(fileNameDriveFile) && files.get(fileNameDriveFile).split(fileSeparator)[2] === "drive#file") {
            fileName = fileNameDriveFile
        }

        if (!files.has(fileName)) {
            return this.client.postMessage("No such file found!", channel);
        } else if (fileName.split(".")[1] === undefined) {
            let mimeType = files.get(fileName).split(fileSeparator)[1];
            let meta = helper.getExtensionFromMIMEType(mimeType).split(fileSeparator);
            let ephemeralPath = `${constants.EPHEMERAL_FILES}/${fileName}.${meta[0]}`;
            drive.downloadGFile(files.get(fileName).split(fileSeparator)[0], meta[1])
                .then(result => createEphemeralFile(result.data, ephemeralPath))
                .then(() => this.uploadFileToMattermost(ephemeralPath, channel))
                .catch(error => this.sendGenericErrorMsg(error, "Failed to download file", channel))
                .finally(() => unlinkFile(ephemeralPath));
        } else {
            let ephemeralPath = `${constants.EPHEMERAL_FILES}/${fileName}`;
            drive.downloadFile(files.get(fileName).split(fileSeparator)[0])
                .then(result => createEphemeralFile(result.data, ephemeralPath))
                .then(() => this.uploadFileToMattermost(ephemeralPath, channel))
                .catch(error => this.sendGenericErrorMsg(error, "Failed to download file", channel))
                .finally(() => unlinkFile(ephemeralPath));
        }
    }

    async fetchCommentsInFile(msg) {
        let channel = msg.broadcast.channel_id;
        let user = msg.data.sender_name.split('@')[1];

        if (!this.validateUser(user, channel)) return;

        let post = JSON.parse(msg.data.post);
        let fileName = post.message.split("\"")[1];

        this._validateFile(fileName, channel);

        let files = await this._listFiles(channel);

        if (!files.has(fileName.split(".")[0])) {
            return this.client.postMessage("No such file found!", channel);
        } else {
            drive.fetchComments(files.get(fileName.split(".")[0]).split(fileSeparator)[0])
                .then(result => _prepareComments(result.data.comments))
                .then(comments => {
                    let msg = `${comments.length} comment(s) found on file ${fileName}`
                        + "\n"
                        + `${comments.slice(0, 5).reverse().join('\r\n')}`;
                    this.client.postMessage(msg, channel);
                })
                .catch(error => this.sendGenericErrorMsg(error, "No comments found", channel))
        }
    }

    async _listFiles(channel) {
        return drive.listFiles()
            .then(result => _extractFileInfo(result.data.files))
            .catch(error => {
                this.sendGenericErrorMsg(error, "Failed to retrive file IDs", channel);
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

    sendGenericErrorMsg(error, text, channel) {
        console.error(text, error);
        this.client.postMessage(text, channel);
    }

    _validateFile(fileName, channel, checkExtension = true) {
        if (!helper.checkValidFile(fileName)) {
            return this.client.postMessage("Please Enter a valid file name", channel);
        }

        if (checkExtension) {
            let fileExtension = fileName.split(".")[1];
            if (!helper.checkValidFileExtension(fileExtension))
                return this.client.postMessage("Please enter a supported file extension.\n" +
                    "Supported file extenstions: doc, docx, ppt, pptx, xls, xlsx", channel);
        }
    }

    //function to check invalid users
    _checkInvalidUsernames(usernames) {
        let invalidUsernames = []
        usernames.map((uname) => {
            let id = this.client.getUserIDByUsername(uname);
            if (!id.length) {
                invalidUsernames.push(uname);
            }
        });
        return invalidUsernames
    }

    _sendDirecMessageToUsers(usernames, fileName, fileLink) {
        let userIDS = usernames.map(username => this.client.getUserIDByUsername(username));
        for (let userID in userIDS) {
            let user_channel = this.client.getUserDirectMessageChannel(userIDS[userID]).id;
            this.client.postMessage("You have been added as a collaborator for " + fileName + "\n" +
                "Here is the link for the same: " + fileLink, user_channel);
        }
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

function _extractFileInfo(files, filter = fileFilter) {
    let names = new Map();
    if (files.length) {
        files.filter((file) => file.name.startsWith(filter))
            .map((file) => names.set(`${file.name}`, `${file.id}${fileSeparator}${file.mimeType}${fileSeparator}${file.kind}`));
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