const Client = require('./mattermost-client/client');
const drive = require("./drive.js");
const helper = require("./helper.js");

let host = "mattermost-csc510-9.herokuapp.com", 
    group = "alfred",
    bot_name = "@alfred",
    client = new Client(host, group, {});

async function main() {

    let request = await client.tokenLogin(process.env.BOTTOKEN);

    client.on('message', function (msg) {
        if (hears(msg, bot_name)) {
            parseMessage(msg);
        }
    });
}

function hears(msg, text) {

    if (msg.data.sender_name == bot_name) return false;

    if (msg.data.post) {

        let post = JSON.parse(msg.data.post);
        if (post.message.indexOf(text) >= 0) {
            return true;
        }
    }

    return false;
}

//stub for listing drive files
async function listFiles(msg) {

    let res = await drive.getFiles(),
        files = res.files,
        fileNames = new Array();

    for (n in files) {
        fileNames.push(files[n].name + "\n");
    }

    let channel = msg.broadcast.channel_id;
    client.postMessage("Following are the files present in your drive: \n" + fileNames.join(''),channel);
}
    
//stub for creating a file 
async function createFile(msg) {
    
    let channel = msg.broadcast.channel_id,
        post = JSON.parse(msg.data.post),
        fileName = post.message.split(" ").filter(x => x.includes('.'))[0];

    // TODO: Common stub. Needs to be extracted.
    if ( ! helper.checkValidFile(fileName) )
        return client.postMessage("Please Enter a valid file name",channel);

    let fileExtension = fileName.split(".")[1];

    if ( ! helper.checkValidFileExtension(fileExtension) )
        return client.postMessage("Please enter a supported file extension.\n" + 
                                    "Supported file extenstion: doc, docx, ppt, pptx, xls, xlsx, pdf", channel);    

    let res = await drive.createFile({
            "originalFilename" : fileName,
            "mimeType" : helper.getMIMEType(fileExtension)
        }),
        fileLink = res.webViewLink,
        usernames = post.message.split(" ").filter( x => x.includes('@') && x !== "@alfred" ).map(uh => uh.replace('@',''));

    sendDirecMessageToUsers(usernames, fileName, fileLink, channel);
    client.postMessage("Created file " + fileName + " successfully\n" + "Here is the link for the same: " + fileLink,channel);
}

//function to download file
async function downloadFile(msg){
    let channel = msg.broadcast.channel_id;
    let post = JSON.parse(msg.data.post);

    let fileName = post.message.split(" ").filter(x => x.includes('.'))[0];

    // TODO: Common stub. Needs to be extracted.
    if ( ! helper.checkValidFile(fileName) )
        return client.postMessage("Please Enter a valid file name",channel);

    let fileExtension = fileName.split(".")[1];

    if ( ! helper.checkValidFileExtension(fileExtension) )
        return client.postMessage("Please enter a supported file extension.\n" + 
                                    "Supported file extenstion: doc, docx, ppt, pptx, xls, xlsx, pdf", channel);        
    
    let res = await drive.getFiles();
    let files = res.files;
    let file = files.find(function(element) {
        return element.name == fileName;
    });
                                    
    if(typeof file === 'undefined'){
        return client.postMessage("No such file found!",channel);
    }
                                    
    let result = await drive.downloadAFile(file.name)
    return client.postMessage("Download link: " + result.webViewLink ,channel);
}

/*
    Sample query: @alfred add @ridhim @shubham as collaborators with read and edit access in file.doc
    Sample query: @alfred change/update @ridhim access to read access in file.doc
*/
async function updateCollaboratorsInFile(msg) {

    let channel = msg.broadcast.channel_id,
        message = JSON.parse(msg.data.post).message,
        splittedMessageBySpace = message.split( " " );
    
    let fileName = splittedMessageBySpace.filter( x => x.includes('.') )[0],
        collaboatorList = splittedMessageBySpace.filter( x => x.includes('@') && x !== "@alfred" );
        permissionList = splittedMessageBySpace
                            .filter(x => ["read", "edit", "comment"].includes(x.toLowerCase()))
                            .map(x => x.toLowerCase());

    if ( collaboatorList.length !== permissionList.length )         
        return client.postMessage("Invalid request!", channel);

    // TODO: Common stub. Needs to be extracted.
    if ( ! helper.checkValidFile(fileName) )
        return client.postMessage("Please Enter a valid file name",channel);

    if ( ! helper.checkValidFileExtension(fileName.split(".")[1]) )
        return client.postMessage("Please enter a supported file extension.\n" + 
                                    "Supported file extenstion: doc, docx, ppt, pptx, xls, xlsx, pdf", channel);

    let file = await drive.getAFile(fileName),
        usernames = collaboatorList.map(uh => uh.replace('@',''));
        
    if (file === undefined)
        return client.postMessage("No such file found!", channel);

    file.sharingUser = collaboatorList;
    file.permissions = permissionList;

    let res = await drive.updateFile(file),
        fileLink = res.webViewLink;

    if (fileLink !== undefined) {

        sendDirecMessageToUsers(usernames, fileName, fileLink, channel);
        client.postMessage("Updated collaborators to file " + fileName + " successfully\n" + "Here is the link for the same: " + fileLink, channel);

    } else {
        return client.postMessage("Error occurred while adding collaborators.!! :(", channel);
    }
}

//function to DM users
function sendDirecMessageToUsers(usernames, fileName, fileLink){

    userIDS = usernames.map(username => client.getUserIDByUsername(username));  
    for (userID in userIDS) {
        client.getUserDirectMessageChannel(
            userIDS[userID], 
            fileName, 
            fileLink, 
            (fileName, fileLink, channel) => { 
                client.postMessage("You have been added as a collaborator for " + fileName + "\n" + "Here is the link for the same: " + fileLink, channel.id) 
            }
        );
    } 
}

async function parseMessage(msg) {

    if(hears(msg,"create")){

        createFile(msg);

    } else if (hears(msg,"list")) {

        listFiles(msg);

    } else if (hears(msg,"download")) {

        downloadFile(msg);

    } else if (hears(msg,"add") || hears(msg,"change") || hears(msg,"update")) {
        
        updateCollaboratorsInFile(msg);
    }
}

(async () => {
    await main();
})()