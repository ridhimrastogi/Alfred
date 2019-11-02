const fs = require('fs');
const drive = require("./drive.js");
const helper = require("./utils/helpers.js");
const google_auth = require("./google_auth.js");

async function validateuser(msg, client)
{
    console.log(msg);
    let sender = msg.data.sender_name.split('@')[1];
    let userID = client.getUserIDByUsername(sender);
    let user_channel  = client.getUserDirectMessageChannel(userID);
    console.log(`I am ${sender}`);
    console.log(user_channel);
    let content = fs.readFileSync('../credentials.json', 'utf8');
    console.log("content",content);
    google_auth.authorize(JSON.parse(content), user_channel.id, client);
}

//stub for listing drive files
async function listFiles(msg, client) {
    let channel = msg.broadcast.channel_id;
    await validateuser(msg, client);
    console.log("Authenticated\n");
    let files = google_auth.listFiles();
    if(typeof files === "undefined" || files.length == 0)
        client.postMessage('No files found.');
    else {
        client.postMessage('Files:',channel);
        files.map((file) => {
            client.postMessage(`${file.name} (${file.id})`,channel);
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

    if (files === undefined || ! files.length())
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
        let role, permission = {'type': 'user'};

        if (element === 'comment') role = 'commenter';
        else if (element === 'read') role = 'writer';
        else role = 'reader';
        permission.role = role;
        permission.emailAddess = userIds[index];

        params.permissions.append(permission);
    });

    return params;
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
    sendDirecMessageToUsers
};