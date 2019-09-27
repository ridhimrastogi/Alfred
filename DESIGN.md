## Problem Statement

Sharing is difficult. Everytime you share a file with one of your teammates, it involves a cat and mouse game of hunting for all email ids, managing permissions and keeping track of changes done to the file. Working on shared documents often leads to dependencies between team members  as they have to check for comments and updates to the documents manually. This leads to time delays in the development lifecycle. 

## Bot Description

### Alfred, your very own file butler!

We are proposing Alfred, a bot that hooks to a collaboration tool (Mattermost) and provides functionalities to reduce overhead for file sharing. Alfred allows users to create a file using the collaboration tool on a file sharing platform (Google Drive) or share an existing file with other team members by their mattermost username. It also allows additional functionalities including downloading the file, deleting and accessing the comment history for the file. It reduces the hassle associated with working on shared files by reducing the number of steps involved in different operations.

Alfred is a conversational bot which activates when the user tags it via _@alfred_ in the team chat or messages it privately. It responds to user commands by listening for pre-defined keywords and taking related actions.
 

### Use Cases

 #### 1A. Create a file on google drive without sharing it with other users
 
  - **Preconditions**:
  
    User should have provided necessary authentication details to the bot (referred to as Alfred from now on)
    
  - **Main Flow**:
  
    User will ask Alfred to create a file. Alfred will create the file on users google drive and share the link in chat.
     
  - **Subflows**:
  
    - User will ping Alfred using its handle _@alfred_ with some command/phrase to create a file that contains words    **create** and **file**.
    - Alfred will create the file on users drive with default options.
    - Alfred will then DM user the link to that file.
    
  - **Alternative Flows**:
    
    - Alfred being a conversational bot will ask user for the file name if user didn't specify it in the first call.
    - If the user is not correctly configured, Alfred will ask him to do so.
  
 #### 1B. Create a file on google drive and share it with other users
 
  - **Preconditions**:
  
    User should have necessary authentication details in place and other users (collaborators with whom this file will be shared) should be a part of the same team.
    
  - **Main Flow**:
    
    User will ask Alfred to create a file and also provide mattermost handles (_@username_) of other users with whom this file will be shared. Alfred will create the file on users google drive and share the link in chat. At the same time, it will also DM all other users, the sharable link for this file.
    
  - **Subflows**:
  
     - User will ping Alfred to create a new file along with some phrase that contains word **share**. User will provide the usernames of collaborators with this message.
     - Alfred will create the file on users drive.
     - Alfred will then DM user the link to that file.
     - Alfred will provide edit permissions (by default) to collaborators on this file and will DM them the link to this newly created file.
     
  - **Alternative Flows**:
    
     - If the user is not correctly configured, Alfred will ask him to do so.
     - If the collaborators are not part of the same team, Alfred will inform the same.

#### 1C. Create a file on google drive and share it with other users using the channel

  - **Main Flow**: This use case is same as 1B, but this time user will ping Alfred on the channel to create the new file and Alfred will provide necessary permissions to all other users on the channel.
  
#### 2. Edit file permissions

  - **Preconditions**:
  
    User should have necessary authentication details in place. The file should be present on user's drive. Other users to be granted/edited permissions should be a part of the same team.
    
  - **Main Flow**:
    
    User will ask Alfred to add other users as collaborators. User can also change the access level (view, edit) of existing collaborators. User will ping Alfred with some phrase that contains word **edit** and Alfred will ask whether user wants to edit permissions or add collaborators to a file. User provides either of the two inputs along with necessary data (filename and @username(s) for adding collaborators; permission, either 'view' or 'edit' for changing access)
    
  - **Subflows**:
  
     - User will ping Alfred with **edit** as a part of the phrase.
     - Alfred will ask user to provide, one of the two inputs from **share** or **change** permissions and corresponding data.
     - Alfred will share file in a similar way as mentioned in 1B with others if user asked for share option.
     - Alfred will edit file permissions if user asked for change option accordingly.
     
  - **Alternative Flows**:
    
     - If the user is not correctly configured, Alfred will ask him to do so.
     - If the collaborators are not part of the same team, Alfred will inform the same.
     - If user provides unexpected input, Alfred will ask user to provide the correct options again.
     
     
#### 3.  Delete an existing file

  - **Preconditions**: 
  
    File must exist on Google Docs and user must have owner rights.
    
  - **Main Flow**: 
  
    User provides Alfred, filename of the file to be deleted. If the file exists and the user has owner rights, the file gets deleted while notifying all the associated collaborators.

  - **Subflows**:
  
     - User asks Alfred to delete a file with query something like “Delete abc.docx”. To double check, Alfred confirms the operation with the user.
     - If params valid, Alfred, behind the scene, deletes the given file and moves it to trash.
     - Alfred fetches all the associated collaborators and sends them a DM that the file owner has deleted the file shared.
     
  - **Alternative Flows**:
  
     - User provides incomplete commands  like “Delete file”, then Alfred will ask the user to provide the filename or any other relevant info, in order to complete the task.
     - If the user does not have owner rights or the file does not exist, Alfred responds back with an appropriate message.

  - **Future Scope**:

    Prompts collaborators with a confirmation if they want to keep the copy of the deleted file.
    

#### 4. Download an existing file

  - **Preconditions**:
  
    User should have necessary authentication details in place. The file to be downloaded must exist on Google Drive and the user must either be the owner or must be one of the collaborators of the file.
    
  - **Main Flow**:
  
    User will ask Alfred to download a file. Alfred will respond with the link(file download thumbnail), through which the user can download the file.
    
  - **Subflows**:
  
     - User will ping Alfred with **download** as a part of the phrase.
     - Alfred will check whether the file exists on the user's Google drive.
     - Further, Alfred will validate whether the user is the owner of the file or is one of the collaborators.
     - Post successful validation of the user, Alfred will ping the user with a link, enabling the user to download the file.
  
  - **Alternative Flows**:
  
     - If the user is not correctly configured, Alfred will ask him to do so.
     - If the file to be downloaded is not present, then Alfred will prompt the user with the same.     
     - If user provides unexpected input, Alfred will ask user to provide the correct options again.
 
 #### 5. Fetching comments on a shared file
 
  - **Preconditions**:
  
 The file to be downloaded must exist on Google Drive and the user must either be the owner or must be one of the collaborators of the file.

  - **Main Flow**:
  
    User will ask Alfred to fetch comments for a particular file. Alfred will list all comments if number of comments are less than 5, else it will list the total number of comments and list the last 5 comments.
     
  - **Subflows**:
  
    - User will ping Alfred using its handle _@alfred_ with a command that includes the keywords **fetch/get** and **comments**..
    - Alfred will check if such a file exists on the users Google Drive.
    - Alfred will list comments on that file.
    
  - **Alternative Flows**:
      
    - If there are no comments, Alfred returns with “No comments found” message.  
    - Alfred being a conversational bot will ask user for the file name if user didn't specify it in the first call.
    - If the user is not correctly configured, Alfred will ask him to do so.

# Design Sketches

## WireFrame 1

### Create a file using Alfred. Share it with all members on the channel.

![Wireframe1](wireframe_1.png)

## Wireframe 2

### Fetch comments on an existing file. 

![Wireframe2](wireframe_2.png)

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
 
 

