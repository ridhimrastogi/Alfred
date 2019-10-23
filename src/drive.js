const got  = require('got');
const _ = require("underscore");

const token = "Bearer " + "OAUTH2_TOKEN";
const urlRoot = "https://www.googleapis.com/drive/v3/files";

async function getFiles() {
	const url = urlRoot + "/";
	const options = {
		method: 'GET',
		headers: {
            "content-type": "application/json",
            "Accept": "application/json",
			"Authorization": token
		},
		json: true
	};

	// Send a http request to url
	let files = (await got(url, options)).body;
	return files;
}

async function createFile(file) {
	const url = urlRoot + "/";
	const options = {
		method: 'POST',
		headers: {
			"content-type": "application/json",
			"Authorization": token
        },
        body: file,
		json: true
	};

	// Send a http request to url
	let createdFile = (await got(url, options)).body;
	return createdFile;
}

async function updateFile(file) {
	const url = urlRoot + "/" + file.id;
	const options = {
		method: 'PATCH',
		headers: {
			"content-type": "application/json",
			"Authorization": token
        },
        body: file,
		json: true
	};

	// Send a http request to url
	let updatedFile = (await got(url, options)).body;
	return updatedFile;
}

async function getFileId(filename) {
    let fileList = getFiles(), fileId = "1u2Mzr75jjH5C40nEWrKohCM4YLczUdfoeqy9hR2xCcc";

    let file = _.findWhere(fileList.files,{name: filename});
    if (file !== undefined && file !== null) {
        fileId = file.id;
    }

    return fileId;
}

async function getAFile(filename) {
    let fileId = await getFileId(filename);

	const url = urlRoot + "/" + fileId;
	const options = {
		method: 'GET',
		headers: {
			"content-type": "application/json",
			"Authorization": token
		},
		json: true
	};

	// Send a http request to url
	let file = (await got(url, options)).body;
	return file;
}

async function downloadAFile(filename) {    
    let fileId = await getFileId(filename);
	const url = urlRoot + "/" + fileId + "?alt=media";
	const options = {
		method: 'GET',
		headers: {
			"content-type": "application/json",
			"Authorization": token
		},
		json: true
	};

	// Send a http request to url
	let downloadedFile = (await got(url, options)).body;
	return downloadedFile;
}

async function deleteAFile(filename) {   
    let fileId = await getFileId(filename);
 
	const url = urlRoot + "/" + fileId;
	const options = {
		method: 'DELETE',
		headers: {
			"content-type": "application/json",
			"Authorization": token
		},
		json: true
	};

	// Send a http request to url
	let file = (await got(url, options)).body;
	return file;
}

// TODO: Edit permission use case.

exports.getFiles = getFiles;
exports.getAFile = getAFile;
exports.createFile = createFile;
exports.downloadAFile = downloadAFile;
exports.deleteAFile = deleteAFile;
exports.updateFile = updateFile;