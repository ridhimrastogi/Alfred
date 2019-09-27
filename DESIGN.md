## WireFrame 1

### Create a file using Alfred. Share it with all members on the channel.


### Fetch comments on an existing file. 


# Architecture Design

## Components Overview

![Alfred Coponents](https://github.ncsu.edu/csc510-fall2019/CSC510-9/blob/master/img/Alfred%20Architecture.png)

## Architecture Components

### 1. Deployment platform:

- The bot will reside on a server instance running on the Heroku cloud platform

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

## Software Constraints

- Command grammar guideline must be followed by the users while requesting file operations. For example, user needs to use a well known delimeter to separate data and command phrase.
- Users as well as the collborators must be part of the same Mattermost workspace.
- Mattermost users must be registred with thier Google account.

## Design Patterns

The drive storage and platform that we are primarily considering for this project are **Google Drive** and **Mattermost** respectively. But we are planning to build up the codebase in a way that it becomes easy for Alfred, to integrate other drive based storages like **OneDrive** and platforms like **Slack** in future.

We are going to use a mix of some commonly used design patterns to achieve this:
 
 - **Facade Pattern**: In our case, a Facade can be an Interface that provides an abstraction for hiding other tedious implimentation details. Facade classes will have different implementations based on the platforms.
 
 - **Gateway Pattern**: Different platforms will have their own API, each with its own API Gateway implimentation.
 
For Example: Two main facada candidates can be as follews; WebHookFacade: This can have different implimentation based on whether it is Slack or Mattermost or some other platform for Bot; FileOpsFacade: This can have different file operations defined and the implimentation will take care of which API Gateway to use based on user data.
 
 

