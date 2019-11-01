const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const express = require('express')
const app = express()
const port = 3000

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive',
	'https://www.googleapis.com/auth/drive.file'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = '../token.json';

var oAuth2Client = null;
var token = null;

// Load client secrets from a local file.
// fs.readFile('../credentials.json', (err, content) => {
//   if (err) return console.log('Error loading client secret file:', err);
//   // Authorize a client with credentials, then call the Google Drive API.
//   authorize(JSON.parse(content), listFiles);
// });

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, user_channel, mattermost_client) {
	const { client_secret, client_id, redirect_uris } = credentials.web;
	oAuth2Client = new google.auth.OAuth2(
		client_id, client_secret, redirect_uris[0]);

	// Check if we have previously stored a token.
	try {
		token = fs.readFileSync(TOKEN_PATH);
		oAuth2Client.setCredentials(JSON.parse(token));
	}
	catch (error) {
		console.log("\nTILL HERE\n");
		if (token == null) {
			token = getAccessToken(oAuth2Client, user_channel, mattermost_client);
		}
		else
			console.log(token);
	}
	console.log("inside outside", oAuth2Client);
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, user_channel, mattermost_client) {

	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
	});
	let code = null;
	mattermost_client.postMessage(`Authorize this app by visiting this url: ${authUrl}`, user_channel);
	app.get('/tokenurl', (req, res) => {
		console.log(req.query.code);
		code = req.query.code;
		oAuth2Client.getToken(code, (err, token) => {
			if (err) return mattermost_client.postMessage(`Error retrieving access token: ${err}`, user_channel);
			oAuth2Client.setCredentials(token);
			console.log("GAC\n", oAuth2Client);
			// Store the token to disk for later program executions
			fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
				if (err) return console.error(err);
				mattermost_client.postMessage('Token created', user_channel);
			});
			res.redirect('https://mattermost-csc510-9.herokuapp.com/alfred/channels/town-square/');
		});
	});
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listFiles() {
	console.log("Inside deep dive", oAuth2Client);
	let drives = google.drive({ version: 'v3', oAuth2Client });
	await drives.files.list({
		pageSize: 100,
		fields: 'nextPageToken, files(id, name)',
	}, (err, res) => {
		console.log("RS\n", res);
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

exports.authorize = authorize;
exports.getAccessToken = getAccessToken;
exports.listFiles = listFiles;