# Alfred - Your Very Own File Butler!


## Problems Statement

Today software development happens across multiple applications. The developer has to toggle between applications like IDE’s, text editors, web browsers, CLI and what not! Also, at the same time, the developer needs to keep context of all these applications. Switching between these applications often leads to losing context of what needs to be done and where. What is common to all these applications is that they interact with files in one way or another. Keeping track of all of these files results in a lot of mental overhead for the developer which results in loss of productivity.


## Bot Description

To address this problem, we are proposing a bot that hooks to the collaboration tool like Slack or Mattermost and provides functionalities to reduce overhead for “context-switching”. The bot acts as a central hub for multiple file operations that include sharing, searching, renaming, relocating, copying and diffing. The bot also eliminates the need of adding boilerplate statements in the configuration files and in turn, saves time.

To generate the configuration file the bot uses the question-answer format to get details from the user. It also listens for keywords on the slack application and triggers action (unix file commands) associated with the keyword. 

To uncover some under-the-hood details on how our bot will work...
 
 - **File Operations**: We are planning to write a rule based verb-to-unix command matcher. 

 - **File Sharing**: We are planning to use either file.io (for ephemeral sharing), a cloud object store for simple persistence based sharing and google docs api for collab invites (the idea here is to ask the bot to create a file on google docs and add collaborators) We haven’t finalized yet but plan to provide at least two out of three file sharing use cases.

 - **Generating Config Files**: We will use a question answer style bot-user interaction and the bot will generate the config file accordingly (for instance let’s consider a docker file; the bot will ask the questions related to the basic attributes that the conf file contains and based on the answers from user, bot will generate the file).
