const fs = require('fs');
const drive = require("./drive.js");
const helper = require("./utils/helpers.js");
const google_auth = require("./google_auth.js");
const { google } = require('googleapis');

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
        fileName = post.message.split(" ").filter(x => x.includes('.'))[0],
        sender = msg.data.sender_name.split('@')[1],
        userID = client.getUserIDByUsername(sender)

    // TODO: Common stub. Needs to be extracted.
    if (!helper.checkValidFile(fileName))
        return client.postMessage("Please Enter a valid file name", channel);

    let fileExtension = fileName.split(".")[1];

    if (!helper.checkValidFileExtension(fileExtension))
        return client.postMessage("Please enter a supported file extension.\n" +
            "Supported file extenstion: doc, docx, ppt, pptx, xls, xlsx, pdf", channel);

    let fileParams = {
        "name": fileName,
        "mimeType": helper.getMIMEType(fileExtension)
    }

    let result = await google_auth.createFile(userID, fileParams, client),
        fileLink = result.data.webViewLink,
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

    await validateuser(msg, client);
    let channel = msg.broadcast.channel_id,
        message = JSON.parse(msg.data.post).message,
        splittedMessageBySpace = message.split(" ");

    let fileName = splittedMessageBySpace.filter(x => x.includes('.'))[0],
        collaboatorList = splittedMessageBySpace.filter(x => x.includes('@') && x !== "@alfred");
    permissionList = splittedMessageBySpace.filter(x => ["read", "edit", "comment"]
        .includes(x.toLowerCase()))
        .map(x => x.toLowerCase());

    if (collaboatorList.length !== permissionList.length)
        return client.postMessage("Invalid request!", channel);

    // TODO: Common stub. Needs to be extracted.
    if (!helper.checkValidFile(fileName))
        return client.postMessage("Please Enter a valid file name", channel);

    if (!helper.checkValidFileExtension(fileName.split(".")[1]))
        return client.postMessage("Please enter a supported file extension.\n" +
            "Supported file extenstion: doc, docx, ppt, pptx, xls, xlsx, pdf", channel);

    let files = google_auth.getFileByFilename(fileName),
        usernames = collaboatorList.map(uh => uh.replace('@', '')),
        userIds = usernames.map(username => client.getUserIDByUsername(username));

    if (files === undefined || !files.length())
        return client.postMessage("No such file found!", channel);

    let response = google_auth.addCollaborators(getParamsForUpdateFile(permissionList, userIds));

    if (response) {
        sendDirecMessageToUsers(usernames, fileName, fileLink, client);
        client.postMessage("Updated collaborators to file " + fileName + " successfully\n" + "Here is the link for the same: " + fileLink, channel);

    } else {
        return client.postMessage("Error occurred while adding collaborators.!! :(", channel);
    }
}

function getParamsForUpdateFile(permissionList, userIds) {
    let params = {};

    params.fileId = files[0].id;
    params.permissions = [];
    permissionList.forEach(element, index => {
        let role, permission = { 'type': 'user' };

        if (element === 'comment') role = 'commenter';
        else if (element === 'read') role = 'writer';
        else role = 'reader';
        permission.role = role;
        permission.emailAddess = userIds[index];

        params.permissions.append(permission);
    });

    return params;
}

async function fetchCommentsInFile(msg, client) {

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

    if (fileExtension == "doc")
        fileName = fileName.split(".")[0];

    let sender = msg.data.sender_name.split('@')[1];
    let userID = client.getUserIDByUsername(sender);

    let result1 = await google_auth.listFiles(userID,client);
    let fileobj = result1.data.files;

    let file = fileobj.filter(file => file.name == fileName)[0];

    let result2 = await google_auth.fetchcomments(file.id, userID, client);

    if(result2.data.comments.length == 0){
        client.postMessage("No comments on the file yet.",channel);
    }
    else {
        let temp = [];
        let comments= [];
        console.log(result2.data.comments);
        if(result2.data.comments.length > 5){
            comments = result2.data.comments.slice(0,5);
            client.postMessage(`${result2.data.comments.length} comments on the file ${file.name}`,channel);
        }
        else{
            comments = result2.data.comments;
        }
        comments.map(x => temp.push(x.author.displayName +
            ": " + x.content));
        client.postMessage(temp.join('\r\n'),channel);
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

module.exports = {
    listFiles,
    createFile,
    downloadFile,
    updateCollaboratorsInFile,
    sendDirecMessageToUsers,
    fetchCommentsInFile
};