# Architecture Design

## Architecture Components

### 1. Deployment platform:
- We are using Heroku cloud platform for our project deployment.
- The bot will reside on a server instance running on this platform.

### 2. Mattermost
- This is the component where the major interaction between the user and the bot will take place.
- The user will ask the bot to perform operations via textual commands containing operation specific phrases.
- These user requests will be caught by the bot's webhook and sent directly to the bot instance residing on the heroku cloud  platform for further processing. 

### 3. Google APIs
- We are using Google Drive REST API for processing the file specific operation requests received from the bot.
- Once the user request are caught by the bot's webhook, they will be further cascaded to the Google API server for processing.
- The API server will accept the bot requests, validate the parameters received, will perform the corresponding file sharing operation and return a response.  

### 4. Google Drive
- This is the user's storage wherein all the files will reside.

### 5. User
- The user is the agent who will interact with the bot and submit specific file sharing requests to it.
