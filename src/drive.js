const fs = require('fs');
const base64 = require('base64url');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive',
	'https://www.googleapis.com/auth/drive.file',
	'https://www.googleapis.com/auth/drive.appfolder',
	'https://www.googleapis.com/auth/drive.metadata']

let drive = google.drive('v3');
var oAuth2Client = null;

// Alfred Google Drive Credentials (Client Secret)
fs.readFile('../credentials.json', (err, content) => {
	if (err) return console.log('Error loading client secret file:', err);
	const { client_secret, client_id, redirect_uris } = JSON.parse(content).web;
	oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
});

// Token Server
var tokenStore = new Map();

const tokenServer = require('express')()
const port = 3000

const _getTokenFromCode = (req, res) => {
	console.log(`Received code: ${req.query.code}`);
	code = req.query.code;
	state = _extractState(req.query.state);
	oAuth2Client.getToken(code, (err, token) => {
		if (err) return console.log(`Error retrieving access token: ${err}`);
		tokenStore.set(state.userId, token);
		console.log('Token created');
		res.redirect('https://mattermost-csc510-9.herokuapp.com/alfred/channels/' + state.msgChannel);
	});
}

tokenServer.listen(port, () => console.log(`Token server listening on port ${port}!`))
tokenServer.get('/tokenurl', _getTokenFromCode);

// OAuth2 Handlers
const authUrl = (userId, msgChannel) => oAuth2Client.generateAuthUrl({
	access_type: 'offline',
	scope: SCOPES,
	prompt: 'consent',
	state: _encodeState(userId, msgChannel)
});

function tokenExists(userId) {
	if (tokenStore.has(userId)) {
		return true;
	}
	console.log(`No token found for User Id: ${userId}`);
	return false;
};

function authorize(userId) {
	try {
		oAuth2Client.setCredentials(tokenStore.get(userId));
	}
	catch (error) {
		console.log(`Failed to authorize user, error: ${error}`);
		return false;
	}
	return true;
};

//Drive Handlers
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

// Drive Helpers
function _encodeState(userId, msgChannel) {
	state = {
		userId: userId,
		msgChannel: msgChannel
	};
	return base64.encode(JSON.stringify(state));
}

function _extractState(stateString) {
	state = base64.decode(stateString);
	return JSON.parse(state);
}

module.exports = {
	authUrl,
	tokenExists,
	authorize,
	listFiles,
	downloadFile,
	fetchComments
};