## Problem Statement

Sharing is difficult. Everytime you share a file with one of your teammates, it involves a cat and mouse game of hunting for all email ids, managing permissions and keeping track of the changes done to the file. Working on shared documents often leads to dependencies between team members as they have to manually check for comments and updates to the documents. This leads to time delays and introduces overheads in the development lifecycle. 

## Bot Description

### Alfred, your very own file butler!

We are proposing Alfred, a bot that hooks to a collaboration tool (Mattermost) and provides functionalities to reduce overhead for file sharing. Alfred allows users to create a file using the collaboration tool on a file sharing platform (Google Drive) or share an existing file with other team members by their mattermost username. In addition, it enables additional features such as downloading and deleting an existing file, accessing the comment history for a particular file, etc. Conseuently, Alfred eliminates the pain points associated with working on the shared files by reducing the number of steps involved in different operations.

Alfred is a conversational agent which activates when the user tags it via _@alfred_ in a team chat/channel or pings it privately. It responds back to user commands by listening for pre-defined keywords and performing related actions.
 

### Use Cases

 #### 1A. Create different types of files on google drive without any collaborators
 
  - **Preconditions**:
  
    User must provide necessary authentication details to Alfred
    
  - **Main Flow**:
  
    User asks Alfred to create a file (a file can be of any format for example: a spreadsheet, doc file or a presentation file). Alfred creates the file on google drive corresponding to that user. It shares the file link in chat once the file is successfully created or informs the user in case of failure.
     
  - **Subflows**:
  
    - User pings Alfred using its handle _@alfred_ with some expected natural language phrase to create a file that contains words **create** and **file**.
    - Alfred will figure out the type of file based on the extension.
    - Alfred will create the file on user's google drive with default options.
    - Alfred will then DM back the user with its link.
    
  - **Alternative Flows**:
    
    - Alfred, being a dialog system, asks user for the file name if the user did not specify it in the first instruction.
    - If the user is not correctly configured, Alfred will prompt user to do so.
  
 #### 1B. Create a file on google drive and share it with other users
 
  - **Preconditions**:
  
    User must have necessary authentication details in place and other users (i.e. collaborators) should be part of the same team as creator.
    
  - **Main Flow**:
    
    User asks Alfred to create a file and to provide mattermost handles (_@username_) of other users (with whom user wants this file to be shared) along with their respective access rights. Alfred creates the file on respective google drive and shares the link back in creator's chat thread. Simultaneously, Alfred also DMs sharable link to all the collaborator users with appropriate access rights to this file.
    
  - **Subflows**:
  
     - User will ping Alfred to create a new file along with some phrase that contains word **share**. User will provide the usernames and access rights of the collaborators with this message.
     - Alfred will create the file on users drive.
     - Alfred will then DM user the link to that file.
     - Alfred will provide access rights to collaborators on this file and will DM them the link to this newly created file.
     
  - **Alternative Flows**:
    
     - If the user is not correctly configured, Alfred will prompt user to do so.
     - If one or more collaborators do not have their google email id's linked to their mattermost account, Alfred pings the collaboator
for the information.
     - If the collaborators are not part of the same team, Alfred will inform the same.
     - If creator does not specify access rights for the collaborators, then Alfred would create and share the file with default read access to the collaborators.

#### 1C. Create a file on google drive and share it with other users using the channel

  - **Main Flow**: This use case is same as 1B, but in this case, user pings Alfred on the channel to create the new file. Alfred, in turn, provides requested permissions to all other users on the channel.
  
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
    
     - If the user is not correctly configured, Alfred will prompt user to do so.
     - If one or more collaborators do not have their google email id's linked to their mattermost account, Alfred pings the collaboator
for the information.
     - If the collaborators are not part of the same team, Alfred will inform the same.
     - If user provides unexpected input, Alfred will ask user to provide the correct options again.

#### 3. Download an existing file

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
  
     - If the user is not correctly configured, Alfred will prompt user to do so.
     - If the file to be downloaded is not present, then Alfred will prompt the user with the same.     
     - If user provides unexpected input, Alfred will ask user to provide the correct options again.
 
 #### 4. Fetching comments on a shared file
 
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

## Storyboard

### Create file

![Create file](img/StroyBoardCreateFile.png)

### Edit file permissions

![Edit file permissions](img/StoryBoardEditPermissions.png)

## WireFrame 1

### Create a file using Alfred. Share it with all members on the channel.

![Wireframe1](img/wireframe_1.png)

## Wireframe 2

### Fetch comments on an existing file. 

![Wireframe2](img/wireframe_2.png)

# Architecture Design

## Components Overview

![Alfred Coponents](img/Alfred%20Architecture.png)

## Architecture Components

### 1. Deployment Platform:

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

## Architectural Flow

![Architectural Flow](img/Alfred_Architercural_Flow.png)

0. User provides necessary authentication details and sets up Alfred.
1. User pings Alfred to get a task done.
2. Listener receives the message and passes relevant messages to the Parser.
3. Parser differentiates between command and data, figures out the task and asks API Client to make the necessary call.
4. API Client prepares the request body and uses Google Drive API to make the required call.
5. Google API Server will make the corresponding changes on the drive after performing auth checks.
6. Google API Server will respond to the client with some response payload.
7. API Client will forward this data to Postprocessor along with other user data.
8. Postprocessor will analyze the user data to check if there is any processing required. For example: in case of a _share_ request, other collaborators mentioned by user with _@username_ identifier will be DMed the link to this file.
9. Users can access the documents on Drive from Mattermost itself.


## Software Constraints

- Command must follow defined grammar guideline while requesting file operations. 
```
  Create file Design.docx    (Valid request)
  Make file Design.docx      (Valid request)
  Go file Design.docx        (Invalid request)
```
- Users as well as the collborators must be part of the same Mattermost workspace.
- Mattermost users must be registred with thier Google account.

## Design Patterns

The storage and platform that we are primarily considering for this project are **Google Drive** and **Mattermost** respectively. But we are planning to build up the codebase in a way that it becomes easy for Alfred, to integrate other storages like **OneDrive** and platforms like **Slack** in future.

We are going to use a mix of some commonly used design patterns to achieve this:
 
 - **Command Pattern**: In a setting where Mattermost Client acting as a Invoker while Google Drive as Receiver, Command pattern can be used to encapsulate a request as an object by binding together a set of actions on a Google Drive. This would allow us to parameterize other objects with different requests, make multiple requests by maintaining them in queue, and support their corresponding reverse operations.
 
 - **Facade Pattern**: In our case, a facade can be an interface that provides an abstraction for hiding implementation details. Facade classes will have different implementations based on the platforms.
 
 - **Gateway Pattern**: Different platforms will have their own API, each with its own API gateway implementation.
 
Two main facade candidates can be as follows:

- WebHookFacade: This can have different implementation based on whether it is Slack or Mattermost or some other platform for Bot. 

- FileOpsFacade: This can have different file operations defined and the implementation will take care of which API Gateway to use based on user data.
