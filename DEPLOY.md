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
     **I want** to create a file named notes.docx on google drive<br>
     **So that** I can use it to save information on the drive<br>
     **Scenario:** User creates a file on google drive<br>
     *“Given that I’m in a role of registered mattermost user and alfred has consent to access my google drive<br>
     When I send a message ```@alfred Create file "<filename>.<file extension>"```<br>
     Then on successful creation, alfred responds with the web link to access the file.*<br>
     
* **Download file:**
* **Fetch comments:**
* **Update file:**

