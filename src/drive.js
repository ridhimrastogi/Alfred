const fs = require('fs');
const base64 = require('base64url');
const { google } = require('googleapis');
const constants = require('./utils/app_constants')

let drive = google.drive(constants.DRIVE_VERSION);
var oAuth2Client = null;

// Alfred's Google Drive Credentials (Client Secret)
fs.readFile(constants.CLIENT_SECRETS, (err, content) => {
	if (err) return console.log('Error loading client secret file:', err);
	const { client_secret, client_id, redirect_uris } = JSON.parse(content).web;
	oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
});

// Token Server
var tokenStore = new Map();

const tokenServer = require('express')();
const port = constants.TS_PORT;

const _getTokenFromCode = (req, res) => {
	console.log(`Received code: ${req.query.code}`);
	code = req.query.code;
	state = _extractState(req.query.state);
	oAuth2Client.getToken(code, (err, token) => {
		if (err) return console.log(`Error retrieving access token: ${err}`);
		tokenStore.set(state.userId, token);
		console.log('Token created');
		res.redirect(constants.TS_REDIRECT_URI + state.msgChannel);
	});
}

tokenServer.listen(port, () => console.log(`Token server listening on port ${port}`))
tokenServer.get('/tokenurl', _getTokenFromCode);

// OAuth2 Handlers
const authUrl = (userId, msgChannel) => oAuth2Client.generateAuthUrl({
	access_type: 'offline',
	scope: constants.SCOPES,
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