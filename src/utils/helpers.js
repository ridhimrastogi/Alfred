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

        case "pdf":
            type = "application/pdf";
            break;
        
        case "jpeg":    
            type = "image/jpeg";
            break;
        
        case "jpg":
            type = "image/jpeg";
            break;
    }
    return type;
}

function checkValidFile(fileName) {
    return (fileName != undefined && fileName.length != 0);
}

function checkValidFileExtension(fileExtension) {
    if(fileExtension === undefined)
        return true;
    else {
        if(getMIMEType(fileExtension) == null)
            return false;
    }
}

function getFileName(msg){
    let fileName = null;
    try{
        fileName = msg.message.match(/"(.*?)"/)[1];
   }
   catch {
       return null;
    }

   if (!checkValidFile(fileName))
       return fileName;

    return fileName;
}

exports.getMIMEType = getMIMEType;
exports.checkValidFile = checkValidFile;
exports.checkValidFileExtension = checkValidFileExtension;
exports.getFileName = getFileName;
