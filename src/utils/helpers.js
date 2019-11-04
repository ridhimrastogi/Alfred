//function to get the MIME type of a particular file
function getMIMEType(fileExtension) {
    let type = null;

    switch (fileExtension) {
        case "doc":
            type = "application/msword";
            break;

        case "docx":
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
    return !(fileName === undefined || fileName.split(".")[0].length == 0);
}

function checkValidFileExtension(fileExtension) {
    return !(fileExtension === undefined || getMIMEType(fileExtension) == null)
}


exports.getMIMEType = getMIMEType;
exports.checkValidFile = checkValidFile;
exports.checkValidFileExtension = checkValidFileExtension;
