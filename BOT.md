
### Puppeteer Testing

We are using puppeteer to verify the bot is returning correct response based on a input message. For each use case we define what tests have been covered below.

## Create a File

# Main Flow

1. We access the server URL and log in using puppeteer.
2. We send a message to create a file using valid filename.
3. The bot returns with a success message, "Created file".

# Alternative Flow 1

1. We access the server URL and log in using puppeteer.
2. We send a message to create a file using invalid filename.
3. The bot returns with a failure message, "Please enter a valid file name".

# Alternative Flow 2

1. We access the server URL and log in using puppeteer.
2. We send a message to create a file using invalid file extension.
3. The bot returns with a failure message, "Please enter a supported file extension".

## Download a file

# Main Flow

1. We access the server URL and log in using puppeteer.
2. We send a message to download an existing file.
3. The bot returns with a link to download the file.

# Alternative Flow 1

1. We access the server URL and log in using puppeteer.
2. We send amessage to download a file which does not exist on the user's google drive.
3. The bot returns with a failure message, "No such file found!".

## Edit file permissions

# Main Flow

1. We access the server URL and log in using puppeteer.
2. We send message to update collaborators for a file.
3. The bot returns with a success message, "Updated collaborators".

# Alternative Flow 1

1. We access the server URL and log in using puppeteer.
2. We send message to update collaborators for a file where file name is invalid
3. The bot returns with a failure message, "Please enter a valid file name".

# Alternative Flow 2

1. We access the server URL and log in using puppeteer.
2. We send message to update collaborators for a file where file extension is invalid
3. The bot returns with a failure message, "Please enter a supported file extension".
