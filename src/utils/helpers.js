//function to get the MIME type of a particular file
function getMIMEType(fileExtension) {
    let type = null;

    switch (fileExtension) {
        case "doc":
            type = "application/vnd.google-apps.document";
            break;

        case "docx":
            type = "application/vnd.google-apps.document";
            break;

        case "ppt":
            type = "application/vnd.google-apps.presentation";
            break;

        case "pptx":
            type = "application/vnd.google-apps.presentation";
            break;

        case "xls":
            type = "application/vnd.google-apps.spreadsheet";
            break;

        case "xlsx":
            type = "application/vnd.google-apps.spreadsheet";
            break;
    }
    return type;
}

//function to get the MIME type of a particular file
function getExtensionFromMIMEType(mimeType) {
    let type = null;

    switch (mimeType) {
        case "application/vnd.google-apps.document":
            type = "docx|application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            break;

        case "application/vnd.google-apps.presentation":
            type = "pptx|application/vnd.openxmlformats-officedocument.presentationml.presentation";
            break;

        case "application/vnd.google-apps.spreadsheet":
            type = "xlsx|application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            break;
    }
    return type;
}

function checkValidFile(fileName) {
    return (fileName != undefined && fileName.length != 0);
}

function checkValidFileExtension(fileExtension) {
    if (fileExtension === undefined)
        return false;
    else {
        if (getMIMEType(fileExtension) == null)
            return false;
    }
    return true;
}

// function getFileName(msg) {
//     let fileName = null;
//     try {
//         fileName = msg.message.match(/"(.*?)"/)[1];
//     }
//     catch {
//         return null;
//     }

//     if (!checkValidFile(fileName))
//         return fileName;

//     return fileName;
// }

exports.getMIMEType = getMIMEType;
exports.getExtensionFromMIMEType = getExtensionFromMIMEType;
exports.checkValidFile = checkValidFile;
exports.checkValidFileExtension = checkValidFileExtension;
// exports.getFileName = getFileName;
