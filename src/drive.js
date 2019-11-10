const fs = require('fs');
const base64 = require('base64url');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive',
	'https://www.googleapis.com/auth/drive.file',
	'https://www.googleapis.com/auth/drive.appfolder',
	'https://www.googleapis.com/auth/drive.metadata']

let drive = google.drive('v3');
var oAuth2Client = null;

var tokenStore = new Map();

// Load client secrets from a local file.
fs.readFile('../credentials.json', (err, content) => {
	if (err) return console.log('Error loading client secret file:', err);
	const { client_secret, client_id, redirect_uris } = JSON.parse(content).web;
	oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
});

// Token Server
const tokenServer = require('express')()
const port = 3000

const _getTokenFromCode = (req, res) => {
	console.log(`Received code: ${req.query.code}`);
	code = req.query.code;
	state = extractState(req.query.state);
	oAuth2Client.getToken(code, (err, token) => {
		if (err) return console.log(`Error retrieving access token: ${err}`);
		tokenStore.set(state.userId, token);
		console.log('Token created');
		res.redirect('https://mattermost-csc510-9.herokuapp.com/alfred/channels/' + state.msgChannel);
	});
}

tokenServer.listen(port, () => console.log(`Token server listening on port ${port}!`))
tokenServer.get('/tokenurl', _getTokenFromCode);

// Drive Handlers
const checkForToken = (userId) => {
	try {
		if (tokenStore.has(userId)) {
			return true;
		}
	}
	catch (error) {
		console.log(`No token found for User Id: ${userId}`);
		return false;
	}
	return false;
};

const authorize = (userId) => {
	try {
		oAuth2Client.setCredentials(tokenStore.get(userId));
	}
	catch (error) {
		console.log(`Failed to authorize user, error: ${error}`);
		return false;
	}
	return true;
};

const getAuthUrl = (userId, msgChannel) => oAuth2Client.generateAuthUrl({
	access_type: 'offline',
	scope: SCOPES,
	prompt: 'consent',
	state: generateStateString(userId, msgChannel)
});

function generateStateString(userId, msgChannel) {
	state = {
		userId: userId,
		msgChannel: msgChannel
	};
	return base64.encode(JSON.stringify(state));
}

function extractState(stateString) {
	state = base64.decode(stateString);
	return JSON.parse(state);
}

async function listFiles() {
	params = {
		auth: oAuth2Client,
		pageSize: 100,
		fields: 'nextPageToken, files(id, name)',
	};
	return drive.files.list(params);
}

async function downloadFile(fileId) {
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

async function fetchComments(fileID) {
	params = {
		auth: oAuth2Client,
		fileId: fileID,
		fields: '*'
	};
	return drive.comments.list(params)
}

exports.getAuthUrl = getAuthUrl;
exports.checkForToken = checkForToken;
exports.authorize = authorize;
exports.listFiles = listFiles;
exports.downloadFile = downloadFile;
exports.fetchComments = fetchComments;