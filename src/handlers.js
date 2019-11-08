const fs = require('fs');
const drive = require("./drive.js");
const helper = require("./utils/helpers.js");
const google_auth = require("./google_auth.js");
const util = require('util');
const stream = require('stream');

//stub for listing drive files
async function listFiles(msg, client) {
    let channel = msg.broadcast.channel_id;
    let sender = msg.data.sender_name.split('@')[1];
    let userID = client.getUserIDByUsername(sender);
    let result = await google_auth.listFiles(userID, client);
    if (result == null)
        return;
    if (typeof result === "undefined" || result.data.files.length == 0)
        client.postMessage('No files found.');
    else {
        console.log(result.data.files);
        let temp = [];
        result.data.files.map(file => temp.push((file.name)));
        client.postMessage(temp.join('\r\n'), channel);
    }
}

//stub for creating a file
async function createFile(msg, client) {

    let channel = msg.broadcast.channel_id,
        post = JSON.parse(msg.data.post),
        sender = msg.data.sender_name.split('@')[1],
        userID = client.getUserIDByUsername(sender),
        fileName = helper.getFileName(post);

    if(fileName == null)
        return client.postMessage("Please enter a valid file name.",channel);

    let fileExtension = fileName.split(".")[1];

    if (!helper.checkValidFileExtension(fileExtension))
        return client.postMessage("Please enter a supported file extension.\n" +
            "Supported file extenstion: doc, docx, ppt, pptx, xls, xlsx, pdf", channel);

    let usernames = post.message.split(" ").filter(x => x.includes('@') && x !== "@alfred").map(uh => uh.replace('@', ''))
    let invalidUsernames = checkInvalidUsernames(usernames, client)

    if (invalidUsernames.length) {
        if(invalidUsernames.length == 1){
            invalidUsernames = invalidUsernames.join(', ')
            return client.postMessage(`${invalidUsernames} is an invalid username, Please try again with valid a username`, channel)
        }
        else{
            return client.postMessage(`${invalidUsernames} are invalid usernames, Please try again with valid usernames`, channel)
        }
    }

    let fileParams = {
        "name": fileName,
        "mimeType": helper.getMIMEType(fileExtension)
    }
    console.log("File params are: " + JSON.stringify(fileParams))
    let response = await google_auth.createFile(userID, fileParams, client),
        fileLink = response.data.webViewLink;

    if(usernames.length > 1){
        updateCollaboratorsInFile(msg, client, "add");
    }
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

// Sample query: @alfred add @ridhim @shubham as collaborators with read and edit access in file.doc
// Sample query: @alfred change/update @ridhim access to edit access in file.doc
async function updateCollaboratorsInFile(msg, client, command) {

    let miscParams = getParamsforUpdateFile(msg, client);

    if (miscParams.collaboatorList.length !== miscParams.permissionList.length)
        return client.postMessage("Invalid request!", channel);

    // TODO: Common stub. Needs to be extracted.
    // if (!helper.checkValidFile(fileName))
    //     return client.postMessage("Please Enter a valid file name", channel);

    if (!helper.checkValidFileExtension(miscParams.fileName.split(".")[1]))
        return client.postMessage("Please enter a supported file extension.\n" +
            "Supported file extenstion: doc, docx, ppt, pptx, xls, xlsx, pdf", channel);


    let fileName = helper.getFileName(JSON.parse(msg.data.post)),
        usernames = miscParams.collaboatorList.map(uh => uh.replace('@', ''));
    // let userIds = usernames.map(username => client.getUserIDByUsername(username));
    // let files = google_auth.getFileByFilename(fileName);
    let res = await google_auth.listFiles(miscParams.senderUserID,client);
        files = res.data.files;

    if (files === undefined || !files.length)
        return client.postMessage("No such file found!", channel);

    let file = files.filter(file => file.name == fileName)[0],
        fileLink = file.webViewLink, response;

    if (command === "update") {
        let permission_res = await google_auth.listPermission(miscParams.senderUserID, file.id);
        if (permission_res !== undefined || !permission_res.length) {

            response = await google_auth.updateCollaborators(miscParams.senderUserID,
                getPermissionParamsForUpdateCollab(file, usernames, permission_res.data.permissions,
                     miscParams.permissionList, client), client);
            if (!response)
                return client.postMessage("Error occurred while adding collaborators.!! :(", miscParams.channel);
        }
        else {
            response = await google_auth.addCollaborators(miscParams.senderUserID,
                getPermissionParamsForAddCollab(file, miscParams.permissionList, usernames, client), client);
    
            if (response) {
                sendDirecMessageToUsers(usernames, fileName, fileLink, client);
                client.postMessage("Updated collaborators to file " + fileName + " successfully\n" +
                                    "Here is the link for the same: " + fileLink, miscParams.channel);
            }
            else
                return client.postMessage("Error occurred while adding collaborators.!! :(", miscParams.channel);
        }
    }

    if (command === "add") {
        response = await google_auth.addCollaborators(miscParams.senderUserID,
            getPermissionParamsForAddCollab(file, miscParams.permissionList, usernames, client), client);

        if (response) {
            sendDirecMessageToUsers(usernames, fileName, fileLink, client);
            client.postMessage("Updated collaborators to file " + fileName + " successfully\n" +
                                "Here is the link for the same: " + fileLink, miscParams.channel);
        }
        else
            return client.postMessage("Error occurred while adding collaborators.!! :(", miscParams.channel);
    }
}

function getParamsforUpdateFile(msg, client) {
    params = {}

    params.channel = msg.broadcast.channel_id,
    params.sender = msg.data.sender_name.split('@')[1],
    params.senderUserID =  client.getUserIDByUsername(params.sender),
    params.splittedMessageBySpace = JSON.parse(msg.data.post).message.split(" "),
    params.fileName = params.splittedMessageBySpace.filter(x => x.includes('.'))[0],
    params.collaboatorList = params.splittedMessageBySpace.filter(x => x.includes('@') && x !== "@alfred"),
    params.permissionList =  params.splittedMessageBySpace.filter(x => ["read", "edit", "comment"]
                                            .includes(x.toLowerCase()))
                                            .map(x => x.toLowerCase())
    return params;
}

function getPermissionParamsForUpdateCollab(file, usernames, permission_res, permissionList, client) {
    let updateParams = {}, perm = [];
    updateParams.fileId = file.id;
    usernames.forEach(function(username, index) {
        let role = 'reader', element = permissionList[index],
            permission = permission_res.filter(p =>
                        p.emailAddress == client.getUserEmailByUsername(username))[0];
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

function getPermissionParamsForAddCollab(file, permissionList, usernames, client) {
    let params = {};

    params.fileId = file.id;
    permissions = [];
    permissionList.forEach(function(element, index) {
        let role, permission = { 'type': 'user' };

        if (element === 'comment') role = 'commenter';
        else if (element === 'edit') role = 'writer';
        else role = 'reader';
        permission.role = role;
        permission.emailAddress = client.getUserEmailByUsername(usernames[index]);

        permissions.push(permission);
    });

    params.permissions = permissions;

    return params;
}

async function fetchCommentsInFile(msg, client) {

    let channel = msg.broadcast.channel_id,
        post = JSON.parse(msg.data.post);

    let fileName = helper.getFileName(post);

    if(fileName == null)
       return client.postMessage("Please enter a valid file name.",channel);

    let sender = msg.data.sender_name.split('@')[1];
    let userID = client.getUserIDByUsername(sender);

    let result1 = await google_auth.listFiles(userID, client);
    let fileobj = result1.data.files;

    let file = fileobj.filter(file => file.name == fileName)[0];
    if (file === undefined)
        client.postMessage("No such file found.", channel);

    let result2 = await google_auth.fetchcomments(file.id, userID, client);

    if (result2.data.comments.length == 0) {
        client.postMessage("No comments on the file yet.", channel);
    }
    else {
        let temp = [];
        let comments = [];
        console.log(result2.data.comments);
        if (result2.data.comments.length > 5) {
            comments = result2.data.comments.slice(0, 5);
            client.postMessage(`${result2.data.comments.length} comments on the file ${file.name}`, channel);
        }
        else {
            comments = result2.data.comments;
        }
        comments.map(x => temp.push(x.author.displayName +
            ": " + x.content));
        client.postMessage(temp.join('\r\n'), channel);
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

//function to check invalid users
function checkInvalidUsernames(usernames, client) {
    let invalidUsernames = []
    usernames.map((uname) => {
        id = client.getUserIDByUsername(uname);
        if (!id.length) {
            invalidUsernames.push(uname);            
        }
    });
    return invalidUsernames
}

async function _listFiles(msg, client) {
    let channel = msg.broadcast.channel_id;
    let user = msg.data.sender_name.split('@')[1];
    let userID = client.getUserIDByUsername(user);

    // if (!_validateUser(user, client, channel)) return;

    google_auth._listFiles(userID, client)
        .then(result => extractFileInfo(result.data.files))
        .then(files => Array.from(files.keys()))
        //.then(files => files.filter((file) => file.startsWith("00atf")))
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
    let userID = client.getUserIDByUsername(user);

    //if (!_validateUser(user, client, channel)) return;

    let post = JSON.parse(msg.data.post);
    let fileName = post.message.split(" ").filter(x => x.includes('.'))[0];

    validateFile(fileName);

    let files = await google_auth._listFiles(userID, client)
        .then(result => extractFileInfo(result.data.files))
        .catch(error => {
            msg = "Failed to retrive file IDs";
            console.error(msg, error);
            client.postMessage(msg, channel);
        });

    console.log(files);

    if (!files.has(fileName)) {
        return client.postMessage("No such file found!", channel);
    } else {
        google_auth._downloadFile(files.get(fileName),userID,client)
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
        files//.filter((file) => file.name.startsWith("00atf"))
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
    sendDirecMessageToUsers,
    fetchCommentsInFile
};