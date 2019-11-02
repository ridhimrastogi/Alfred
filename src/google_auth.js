const fs = require('fs');
const { google } = require('googleapis');
const async = require('async');
const express = require('express');


const app = express()
const port = 3000

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive',
	'https://www.googleapis.com/auth/drive.file'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
//const TOKEN_PATH = '../token.json';

var usertoken = {};
var oAuth2Client = null;

app.get('/tokenurl',  (req,res) => {
  let code = req.query.code;
  let userID = req.query.state;
  console.log("CODE\n",code);
  console.log("STATE\n",userID);
  res.redirect(	'https://mattermost-csc510-9.herokuapp.com/alfred/channels/town-square/');
  (async() => {
    let token = await oAuth2Client.getToken(code);
    usertoken[userID] = JSON.stringify(token.res.data);
    console.log("TOKEN\n",token);
    console.log("USERTOKEN\n",usertoken);
    return ;
  }) ()
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

async function authorize(userID, mattermost_client) {
  //Read Client Secret, Client Id, Redirect Urls from credentials.json stored locally
  let content = fs.readFileSync('../credentials.json', 'utf8');
  let credentials = JSON.parse(content);
  const {client_secret, client_id, redirect_uris} = credentials.web;

  oAuth2Client = new google.auth.OAuth2(
  client_id, client_secret, redirect_uris[0]);

  getAccessToken(oAuth2Client, userID, mattermost_client);
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */

async function getAccessToken(oAuth2Client, userID, mattermost_client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: userID
  });
  let user_channel  = mattermost_client.getUserDirectMessageChannel(userID).id;
  mattermost_client.postMessage(`Please Authorize this app first by visiting this url: ${authUrl}`, user_channel);
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listFiles(userID,mattermost_client) {
  if(typeof usertoken[userID] === "undefined" || usertoken[userID] == null)
  {
      authorize(userID,mattermost_client);
      return null;
  }
  oAuth2Client.setCredentials(JSON.parse(usertoken[userID]));
  console.log("oAuth2Client\n",oAuth2Client);
  let drives = google.drive({version: 'v3', oAuth2Client});
  await drives.files.list({
    pageSize: 100,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    let files = res.data.files;
    console.log(files);
    return files;
  });
}

/**
 * Creates a file using meta data.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function createFile(auth) {
	const drive = google.drive({ version: 'v3', auth });
	var fileMetadata = {
		'name': 'Alfred-Architecture.png'
	};
	var media = {
		mimeType: 'image/png',
		body: fs.createReadStream('../img/Alfred Architecture.png')
	};
	drive.files.create({
		resource: fileMetadata,
		media: media,
		fields: 'id'
	}, function (err, file) {
		if (err) {
			// Handle error
			console.error(err);
		} else {
			console.log('File Id: ', file.id);
		}
	});
}

function getFileByFilename(filename) {
  let drive = google.drive({ version: 'v3', oAuth2Client }),
      files;

	drive.files.list({
    q: "name=" + filename,
    spaces: 'drive',
  }, (err, res) => {
		// return undefined if (err)
		return files;
  });
}

function addCollaborators(params) {
  const drive = google.drive({version: 'v3', oAuth2Client});

  async.eachSeries(params.permissions, function (permission, permissionCallback) {
    drive.permissions.create({
      resource: permission,
      fileId: params.fileId,
      fields: 'id',
    }, function (err, res) {
      if (err) {
        console.error(err);
        permissionCallback(err);
      } else {
        console.log('Permission ID: ', res)
        permissionCallback();
      }
    });
  }, function (err) {
    let status = false;
    if (err) {
      console.error(err);
    } else {
      status = true;
      console.error("Access rights for collaborators updated successfully");
    }

    return status;
  });
}


exports.authorize = authorize;
exports.getAccessToken = getAccessToken;
exports.listFiles = listFiles;
exports.addCollaborators = addCollaborators
exports.getFileByFilename = getFileByFilename