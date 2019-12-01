// Directories
const APP_ROOT = require('app-root-path');
const CLIENT_SECRETS = APP_ROOT + '/credentials.json';
const EPHEMERAL_FILES = APP_ROOT + '/ephemeral-files';

var config = require('config')

// Mattermost Server
const MM_HOST = config.get('MM_HOST');
const MM_GROUP = config.get('MM_GROUP');
const BOT_HANDLE = config.get('BOT_HANDLE');

// Google Drive
const DRIVE_VERSION = config.get('DRIVE_VERSION');
const SCOPES = config.get('SCOPES');

// Token Server
const TS_PORT = config.get('TS_PORT');
const TS_REDIRECT_URI = config.get('TS_REDIRECT_URI');
const TS_REDIRECT_INDEX = config.get('TS_REDIRECT_INDEX');

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
    TS_REDIRECT_URI,
    TS_REDIRECT_INDEX
}