const Client = require('./mattermost-client/client');
const fs = require('fs')
const drive = require("./drive.js");
const helper = require("./helper.js")

var count = 0;

let host = "alfred-filebot.herokuapp.com"
let group = "alfred"
let bot_name = "@alfred";
let client = new Client(host, group, {});

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
    let channel = msg.broadcast.channel_id;
    let post = JSON.parse(msg.data.post);

    let fileName = post.message.split(" ").filter(x => x.includes('.'))[0];

    // TODO: Common stub. Needs to be extracted.
    if ( ! helper.checkValidFile(fileName) )
        return client.postMessage("Please Enter a valid file name",channel);

    let fileExtension = fileName.split(".")[1];

    if ( ! helper.checkValidFileExtension(fileExtension) )
        return client.postMessage("Please enter a supported file extension. Supported file extenstion: ",channel);
    
    let userhandles = post.message.split(" ").filter(x => x.includes('@'))
    let usernames = userhandles.map(uh => uh.replace('@',''));
    let userIDS = new Array();
    for(u in usernames){
        userIDS.push(client.getUserIDByUsername(usernames[u]));
    }
    let createFileObj = {
        "originalFilename" : fileName,
        "mimeType" : helper.getMIMEType(fileExtension)
    }

    let res = await drive.createFile(createFileObj);
    let fileLink = res.webViewLink;

    if(post.message.indexOf("collaborators") >= 0){
        for(userID in userIDS){
            //DM to users function called per userID
            client.getUserDirectMessageChannel(userIDS[userID],fileName,fileLink,sendDirecMessageToUsers);
        }
    }

    client.postMessage("Created file " + fileName + " successfully\n" + "Here is the link for the same: " + fileLink,channel);
}

//function to DM users
function sendDirecMessageToUsers(fileName,fileLink,channel){
    client.postMessage("You are being added as a collaborator for " + fileName + "\n" + "Here is the link for the same: " + fileLink,channel.id);
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
        return client.postMessage("Please enter a supported file extension. Supported file extenstion: ",channel);
        
        
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
2. Edit file permissions
Preconditions:

a) The file should be present on user's drive. 
b) Other users to be granted/edited permissions should be a part of the same team.

Main Flow:

User will ask Alfred to add other users as collaborators. 
User can also change the access level (view, edit) of existing collaborators. 
User will ping Alfred with some phrase that contains word edit and Alfred will ask whether user wants to edit permissions or add collaborators to a file. 
User provides either of the two inputs along with necessary data (filename and @username(s) for adding collaborators; permission, either 'view' or 'edit' for changing access)

Subflows:

User will ping Alfred with edit as a part of the phrase.
Alfred will ask user to provide, one of the two inputs from share or change permissions and corresponding data.
Alfred will share file in a similar way as mentioned in 1B with others if user asked for share option.
Alfred will edit file permissions if user asked for change option accordingly.
Alternative Flows:

If the user is not correctly configured, Alfred will prompt user to do so.
If one or more collaborators do not have their google email id's linked to their mattermost account, Alfred pings the collaboator for the information.
If the collaborators are not part of the same team, Alfred will inform the same.
If user provides unexpected input, Alfred will ask user to provide the correct options again. 

*/

/*
    Sample query: @alfred add @ridhim @shubham as collaborators with Read and Edit access in file.doc
*/
async function addNewCollaborators(msg) {

    let channel = msg.broadcast.channel_id,
        message = JSON.parse(msg.data.post).message,
        splittedMessageBySpace = message.split( " " );
    
    let fileName = splittedMessageBySpace.filter( x => x.includes('.') )[0],
        collaboatorList = splittedMessageBySpace.filter( x => x.includes('@') && x !== "@alfred");
        permissionList = splittedMessageBySpace.filter ( x  => x.toLowerCase().includes( ["read", "edit", "comment"] ) )

    if ( collaboatorList.length !== permissionList.length )         
        return client.postMessage("Invalid request!", channel);

    // TODO: Common stub. Needs to be extracted.
    if ( ! helper.checkValidFile(fileName) )
        return client.postMessage("Please Enter a valid file name",channel);

    let fileExtension = fileName.split(".")[1];

    if ( ! helper.checkValidFileExtension(fileExtension) )
        return client.postMessage("Please enter a supported file extension. Supported file extenstion: ",channel);
        
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


async function parseMessage(msg) {
    if(hears(msg,"create")){
        createFile(msg);
    }
    else if(hears(msg,"list")){
        listFiles(msg);
    }
    else if(hears(msg,"download")){
        downloadFile(msg);
    }
    else if(hears(msg,"add")){
        addNewCollaborators(msg);
    }
}

(async () => {
    await main();
})()