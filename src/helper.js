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
  .reply(200, JSON.stringify(data.file));

// Scope for fetching a file
const scope3 = nock('https://www.googleapis.com/drive/v3/files')
  .persist()
  .get('/^[a-z0-9]+$/')
  .reply(200, JSON.stringify(data.file));

// Scope for deleting a file
const scope4 = nock('https://www.googleapis.com/drive/v3/files')
  .persist()
  .delete('/^[a-z0-9]+$/')
  .reply(200, JSON.stringify(data.file));

// Scope for downloading a file
const scope5 = nock('https://www.googleapis.com/drive/v3/files')
  .persist()
  .get(uri => uri.includes('?alt=media'))
  .reply(200, JSON.stringify(data.file));


//function to get the MIME type of a particular file
function getMIMEType(fileExtension){

    let type = null;

    switch (fileExtension) {
        case "doc":
            type = "application/msword";
            break;

        case "docx":
            type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            break;

        case "ppt":
            type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            break;

        case "ppt":
            type = "application/vnd.ms-powerpoint";
            break;

        case "pptx":
            type = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            break;

        case "xls":
            type = "application/vnd.ms-excel";
            break;

        case "xlsx":
            type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            break;

        case "pdf":
            type = "application/pdf";
            break;
    }
    
    return type;
}

function checkValidFile(fileName) {

    return ! ( fileName === undefined || fileName.split(".")[0].length == 0 );
}

function checkValidFileExtension(fileExtension) {

    return ! ( fileExtension === undefined || getMIMEType(fileExtension) == null )
}


exports.getMIMEType = getMIMEType;
exports.checkValidFile = checkValidFile;
exports.checkValidFileExtension = checkValidFileExtension;
