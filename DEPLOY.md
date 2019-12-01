## Deployment

### Deployment scripts

We are using Ansible playbooks in combination with Jenkins for deployment of our project.
There are mainly two Jenkins Jobs:

* **Setup Job:** This Jenkins job will be executing an ansible playbook which will refer the setup tasks specified in the *setup.yml*. The tasks are as follows:
  * Install nodejs
  * Install forever package
  * Clone repository CSC510-9
  * Install node modules for CSC510-9

* **Deploy Job:** Similarly, as above this Jenkins job will be executing an ansible playbook which refer the tasks specified in the *deploy.yml*. The tasks are as follows:
  * Pull the latest code changes for CSC510-9
  * Prepare test environement
  * Run the Integration test cases
  * Prepare the production environment
  * Deploy the filebot to production environment



## Acceptance tests

### Login Credentials:

### Acceptance test instructions:

* **Pre-requisites:**
   * User must be configured in the mattermost server.
   * User must also give consent to alfred so that it can access the user's google drive.
   * Supported file extensions for our usecases are .doc, .docx, .ppt, .pptx, .xls, .xlsx, .pdf, .jpeg, .jpg

* **Create file:**
   * **As** a workspace user in mattermost</br>
     **I want** to create a file on google drive<br>
     **So that** I can use it to save information on the drive<br>
     **Scenario:** User creates a file on google drive<br><br>
     *“Given that I’m in a role of registered mattermost user and alfred has consent to access my google drive<br>
     When I send a message ```@alfred create file "<filename>.<file extension>"```<br>
     Then on successful creation, alfred responds with the web link to access the file."*<br><br>
     
   * **As** a workspace user in mattermost</br>
     **I want** to create a file on google drive and share it with my team member<br>
     **So that** I and my team member can share information and work in a collaborative information space<br>
     **Scenario:** User creates a file on google drive with a team member as collaborator<br><br>
     *“Given that I’m in a role of registered mattermost user and alfred has consent to access my google drive<br>
     When I send a message ```@alfred create file "<filename>.<file extension> and add @<memeber_1> as collaborator with edit access"```<br>
     Then on successful creation, alfred responds with a direct message to me as well as the collaborator with the web link to      access the file."*<br><br>
     
* **Download file:**
   * **As** a workspace user in mattermost</br>
     **I want** to download a file from my google drive<br>
     **So that** I can access the file offline<br>
     **Scenario:** User downloads a file from google drive<br><br>
     *“Given that I’m in a role of registered mattermost user and alfred has consent to access my google drive<br>
     When I send a message ```@alfred download file "<filename>.<file extension>"```<br>
     Then on successful download, alfred responds with a link to download the file."*<br><br>
     
* **Fetch comments:**
* **Update file:**
   * **As** a user in mattermost workspace, **I want** to add collaborators to an existing file on google drive, **so that** I can share the document within the team<br><br>
     **Scenario 1:** User add one collaborator to a file on google drive<br>
     ***Given** that I’m a registered mattermost user and alfred has consent to access my google drive, **when** I put up a      message ```@alfred Add @john as collaborator with read access in "<filename>.<file extension>"```, **then** on                successful updation, alfred responds with the web link to access the file to the user and pings the collaborator with the file web link having appropriate access rights.*<br><br>
     **Scenario 2:** User add multiple collaborators to an existing file<br>
     ***Given** that I’m a registered mattermost user and alfred has consent to access my google drive, **when** I put up a      message ```@alfred Add @john @mathew as collaborators with read and edit access in "<filename>.<file extension>"```, **then** on successful updation, alfred responds with the web link to access the file to the invoker user and pings the added collaborators with the file web link having appropriate access rights.*<br>
     
    * **As** a user in mattermost workspace, **I want** to update permissions of certain collaborators, **so that** I can change the access rights of the associated collaborators in the document<br><br>
     **Scenario 1:** User update the permission of the collaborators in a file on google drive<br>
     ***Given** that I’m a registered mattermost user and alfred has consent to access my google drive, **when** I put up a      message ```@alfred Change/Update @john access to edit access in "<filename>.<file extension>"```, **then** on                successful updation, alfred responds with the web link to access the file to the invoker user, with the updated access rights.*<br>
