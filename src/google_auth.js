const fs = require('fs');
const {
	google
} = require('googleapis');
const async = require('async');
const express = require('express');


const app = express()
const port = 3000

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive',
	'https://www.googleapis.com/auth/drive.file'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
//const TOKEN_PATH = '../token.json';

var usertoken = {};
var oAuth2Client = null;
var drive = google.drive('v3');


app.get('/tokenurl', (req, res) => {
	let code = req.query.code;
	let userID = req.query.state;
	console.log("CODE\n", code);
	console.log("STATE\n", userID);
	res.redirect('https://mattermost-csc510-9.herokuapp.com/alfred/channels/town-square/');
	(async () => {
		let token = await oAuth2Client.getToken(code);
		usertoken[userID] = JSON.stringify(token.res.data);
		console.log("TOKEN\n", token);
		console.log("USERTOKEN\n", usertoken);
		return;
	})()
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
	const {
		client_secret,
		client_id,
		redirect_uris
	} = credentials.web;

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
		state: userID,
		prompt: 'consent'
	});
	let user_channel = mattermost_client.getUserDirectMessageChannel(userID).id;
	mattermost_client.postMessage(`Please Authorize this app first by visiting this url: ${authUrl}`, user_channel);
}

/**
 * Creates a file using meta data.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function createFile(userID, fileParams, mattermost_client) {

	if (typeof usertoken[userID] === "undefined" || usertoken[userID] == null) {
		authorize(userID, mattermost_client);
		return null;
	}
	oAuth2Client.setCredentials(JSON.parse(usertoken[userID]));


	var fileMetadata = {
		'name': fileParams.name,
		'mimeType': fileParams.mimeType
	};

	return drive.files.create({
		auth: oAuth2Client,
		resource: fileMetadata,
		fields: '*'
	})
}

async function getFileByFilter(userID, client, filter = "") {
	if (typeof usertoken[userID] === "undefined" || usertoken[userID] == null) {
		authorize(userID, client);
		return null;
	}

	oAuth2Client.setCredentials(JSON.parse(usertoken[userID]));
	return drive.files.list({
		auth: oAuth2Client,
		q: filter,
		spaces: 'drive',
		fields: '*',
	});
}

async function addCollaborators(userID, params, client) {
	let arr = [];
	if (typeof usertoken[userID] === "undefined" || usertoken[userID] == null) {
		authorize(userID, client);
		return null;
	}
	oAuth2Client.setCredentials(JSON.parse(usertoken[userID]));

	params.permissions.forEach(permission => {
		arr.push(drive.permissions.create({
			auth: oAuth2Client,
			resource: permission,
			fileId: params.fileId,
			fields: '*',
		}, function (err, res) {
			if (err) {
				console.log(err);
			} else {
				console.log('Permission ID: ', res)
			}
		}))
	});

	return arr;
}

async function listPermission(userID, fileId) {
	if (typeof usertoken[userID] === "undefined" || usertoken[userID] == null) {
		authorize(userID, mattermost_client);
		return null;
	}
	oAuth2Client.setCredentials(JSON.parse(usertoken[userID]));
	return drive.permissions.list({
		auth: oAuth2Client,
		fileId: fileId,
		fields: '*',
	});
}

async function updateCollaborators(userID, params, client) {
	let arr = [];
	console.log("\n\n\n\n" + JSON.stringify(params) + "\n\n\n");
	if (typeof usertoken[userID] === "undefined" || usertoken[userID] == null) {
		authorize(userID, client);
		return null;
	}
	oAuth2Client.setCredentials(JSON.parse(usertoken[userID]));

	params.permissions.forEach(permission => {
		arr.push(drive.permissions.update({
			auth: oAuth2Client,
			fileId: params.fileId,
			permissionId: permission.permissionId,
			resource: {
				role: permission.role
			},
			fields: 'id',
		}, function (err, res) {
			if (err) {
				console.log(err);
			} else {
				console.log('Permission ID: ', res)
			}
		}))
	});

	return arr;
}

function fetchcomments(fileID, userID, mattermost_client) {
	if (typeof usertoken[userID] === "undefined" || usertoken[userID] == null) {
		authorize(userID, mattermost_client);
		return null;
	}
	oAuth2Client.setCredentials(JSON.parse(usertoken[userID]));
	console.log("oAuth2Client\n", oAuth2Client);
	options = {
		auth: oAuth2Client,
		fileId: fileID,
		fields: '*'
	};
	return drive.comments.list(options)
}

// -------------------------------------------------------------------

async function _listFiles(userID, mattermost_client) {
	if (typeof usertoken[userID] === "undefined" || usertoken[userID] == null) {
		authorize(userID, mattermost_client);
		return null;
	}
	oAuth2Client.setCredentials(JSON.parse(usertoken[userID]));

	params = {
		auth: oAuth2Client,
		pageSize: 1000,
		fields: 'nextPageToken, files(id, name)',
	};
	return drive.files.list(params);
}

async function _downloadFile(fileId, userID, mattermost_client) {
	if (typeof usertoken[userID] === "undefined" || usertoken[userID] == null) {
		authorize(userID, mattermost_client);
		return null;
	}
	oAuth2Client.setCredentials(JSON.parse(usertoken[userID]));

	params = {
		auth: oAuth2Client,
		fileId: fileId,
		alt: 'media'
	};
	options = {
		responseType: 'stream'
	};
	return drive.files.get(params, options);
}

async function _downloadGDoc(fileId, userID, mattermost_client) {
	if (typeof usertoken[userID] === "undefined" || usertoken[userID] == null) {
		authorize(userID, mattermost_client);
		return null;
	}
	oAuth2Client.setCredentials(JSON.parse(usertoken[userID]));

	params = {
		auth: oAuth2Client,
		fileId: fileId,
		mimeType: 'application/pdf'
	};
	options = {
		responseType: 'stream'
	};
	return drive.files.export(params, options);
}

exports.authorize = authorize;
exports.getAccessToken = getAccessToken;
exports.createFile = createFile;
exports.addCollaborators = addCollaborators
exports.getFileByFilter = getFileByFilter
exports.fetchcomments = fetchcomments
exports.updateCollaborators = updateCollaborators
exports.listPermission = listPermission
exports._listFiles = _listFiles;
exports._downloadFile = _downloadFile;
exports._downloadGDoc = _downloadGDoc;