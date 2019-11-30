// Directories
const APP_ROOT = require('app-root-path');
const CLIENT_SECRETS = APP_ROOT + '/credentials.json';
const EPHEMERAL_FILES = APP_ROOT + '/ephemeral-files';

// Mattermost Server
const MM_HOST = 'mattermost-csc510-9.herokuapp.com';
const MM_GROUP = 'alfred';
const BOT_HANDLE = '@alfred';

// Google Drive
const DRIVE_VERSION = 'v3';
const SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appfolder',
    'https://www.googleapis.com/auth/drive.metadata'
];

// Token Server
const TS_PORT = 3000;
const TS_REDIRECT_URI = 'https://mattermost-csc510-9.herokuapp.com/alfred/channels/';

module.exports = {
    APP_ROOT,
    CLIENT_SECRETS,
    EPHEMERAL_FILES,
    MM_HOST,
    MM_GROUP,
    BOT_HANDLE,
    SCOPES,
    DRIVE_VERSION,
    TS_PORT,
    TS_REDIRECT_URI
}