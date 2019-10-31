const data = require("./mock.json")
const nock = require('nock')

// Scope for listing files
const scope1 = nock('https://www.googleapis.com/drive/v3/files')
    .persist()
    .get('/')
    .reply(200, JSON.stringify(data.fileList));

// Scope for creating a file
const scope2 = nock('https://www.googleapis.com/drive/v3/files')
    .persist()
    .post('/')
    .reply(201, JSON.stringify(data.file));

// Scope for fetching a file
const scope3 = nock('https://www.googleapis.com/drive/v3/files')
    .persist()
    .get(/[a-z0-9]+$/)
    .reply(200, JSON.stringify(data.file));

// Scope for downloading a file
const scope4 = nock('https://www.googleapis.com/drive/v3/files')
    .persist()
    .get(uri => uri.includes('?alt=media'))
    .reply(200, JSON.stringify(data.file));

// Scope for updating a file
const scope5 = nock('https://www.googleapis.com/drive/v3/files')
    .persist()
    .patch(/[a-z0-9]+$/)
    .reply(200, JSON.stringify(data.file));
