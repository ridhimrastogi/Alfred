const fs = require('fs');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
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
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  try {
    token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
  }
  catch(error) {
    console.log("\nTILL HERE\n");
    if (token == null){
      token = getAccessToken(oAuth2Client, user_channel, mattermost_client);
    }
    else
      console.log(token);
  }
  console.log("inside outside",oAuth2Client);
}

function getAuthorizationCode(msg, user_channel, mattermost_client)
{
  let code = null;
  let sender = msg.data.sender_name.split('@')[1];
  if (msg.broadcast.channel_id == user_channel && msg.data.sender_name != "@alfred"){
    console.log(msg);
    let post = JSON.parse(msg.data.post);
    code = post.message;
    console.log("code\n",code);
    mattermost_client.off('message',getAuthorizationCode);
    console.log("\n\nClient removed\n\n");
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return mattermost_client.postMessage(`Error retrieving access token: ${err}`,user_channel);
        oAuth2Client.setCredentials(token);
        console.log("GAC\n",oAuth2Client);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        mattermost_client.postMessage('Token created', user_channel);
      });
    });
  }
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
  mattermost_client.postMessage(`Authorize this app by visiting this url: ${authUrl}`, user_channel);
  mattermost_client.postMessage("Enter the code from that page here:", user_channel);
  mattermost_client.on('message',  (msg) => getAuthorizationCode(msg, user_channel, mattermost_client));
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles() {
  console.log("Inside deep dive")
  let drive = google.drive({version: 'v3', oAuth2Client});
  drive.files.list({
    pageSize: 100,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    let files = res.data.files;
    console.log(files);
    return files;
  });
}

exports.authorize = authorize;
exports.getAccessToken = getAccessToken;
exports.listFiles = listFiles;