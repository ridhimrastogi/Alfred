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
	oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[constants.TS_REDIRECT_INDEX]);
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
		fields: 'nextPageToken, files(id, name, mimeType, kind)',
	};
	return drive.files.list(params);
}

async function downloadFile(fileId) {
	params = {
		auth: oAuth2Client,
		fileId: fileId,
		alt: 'media',
	};
	options = {
		responseType: 'stream'
	};
	return drive.files.get(params, options);
}

async function downloadGFile(fileId, mimeType) {
	params = {
		auth: oAuth2Client,
		fileId: fileId,
		mimeType: mimeType
	};
	options = {
		responseType: 'stream'
	};
	return drive.files.export(params, options);
}

async function fetchComments(fileID) {
	params = {
		auth: oAuth2Client,
		fileId: fileID,
		fields: '*'
	};
	return drive.comments.list(params)
}

async function createFile(fileParams) {
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

async function getFileByFilter(filter = "") {
	return drive.files.list({
		auth: oAuth2Client,
		q: filter,
		spaces: 'drive',
		fields: '*',
	});
}

async function addCollaborators(params) {
	let arr = [];
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

async function listPermission(fileId) {
	return drive.permissions.list({
		auth: oAuth2Client,
		fileId: fileId,
		fields: '*',
	});
}

async function updateCollaborators(params) {
	let arr = [];
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
	downloadGFile,
	fetchComments,
	createFile,
	getFileByFilter,
	addCollaborators,
	listPermission,
	updateCollaborators
};