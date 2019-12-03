## Deployment

### Deployment Scripts and CI using Jenkins

We are using Ansible on top of Jenkins for the CI process. We maintain three separete environments for Mattermost and Alfred, configurations can be found [here](https://github.ncsu.edu/csc510-fall2019/CSC510-9/tree/master/config).

There are mainly two Jenkins Jobs:

* **Setup Job:** This Jenkins job runs an ansible playbook [setup.yml](https://github.ncsu.edu/csc510-fall2019/CSC510-9/blob/master/alfred-scripts/setup.yml) to prepare the deployment environment.

* **Deploy Job:** This Jenkins job runs an ansible playbook [deploy.yml](https://github.ncsu.edu/csc510-fall2019/CSC510-9/blob/master/alfred-scripts/deploy.yml) to deploy bot on Test and Prod environments.

Apart from these two jobs, every two minutes, Jenkins polls the master branch on GitHub repository for changes. If a change is encountered, the existing bots are brought down and changes are automatically deployed.

While we have made the scripts available, we made sure to keep secrets like BOTTOKENS and GitHub credentials within the VCL image that we are using to deploy the bot or within the Jenkins vault. Only the admin has access to these secrets. More about it can be found in the screencast.

Link to [`Screencast`](https://drive.google.com/file/d/1dMQIJ_WIPiX-oXSVt5A9f7ofmdo5z3DH/view?usp=sharing)

## Acceptance tests

### Login Credentials:

**How authentication and authorization works?** <br> 

The user must be registered on our Mattermost Server with a gmail id, in this case with **ncsu.edu**. Since the primary concern of this project is to enable easy file sharing within an organization, the users must be part of same private organization. <br>

In order for the instructors to test our bot in real time, they must signup on the server using this [link](https://mattermost-csc510-9-test.herokuapp.com/signup_user_complete/?id=ykxytjtzjbr8uqkze3us8pagfh) with their NCSU email address.

**NOTE: While performing the accepatance tests, please create a private channel or use Alfred's DM to post messages/commands as shown below. This way, tester can make sure the bot works fine in all settings and there is no way developers can have access to the interactions between Alfred and the tester.**

![](https://github.ncsu.edu/csc510-fall2019/CSC510-9/blob/master/img/uat.png)

### Acceptance Test Instructions:

* **Pre-requisites:**
   * User must be configured in the mattermost server.
   * User must also give consent to alfred so that it can access the user's google drive when asked for by Alfred while running the tests.
   * Supported file extensions for our usecases are .doc, .docx, .ppt, .pptx, .xls, .xlsx for all usecases and for download files usecase, we support all common file extensions like .jpeg, .png, .pdf etc.
   * NOTE: For all the tests, we have mentioned generic format for testing but in case if you want to test quickly avoiding other hastle, use commands mentioned as QUICKTEST and you shall see the changes reflected on YOUR drive.

* **Create file:**
   * **As** a workspace user in mattermost</br>
     **I want** to create a file on google drive<br>
     **So that** I can use it to save information on the drive<br>
     **Scenario:** User creates a file on google drive<br><br>
     *“Given that I’m in a role of registered mattermost user and alfred has consent to access my google drive<br>
     When I send a message ```@alfred create file "<filename>.<file extension>"```<br>
     Then on successful creation, alfred responds with the web link to access the file."*<br>
     
     **QUICKTEST: ```@alfred create file "uat-test-1.docx"```<br><br>**
     
   * **As** a workspace user in mattermost</br>
     **I want** to create a file on google drive and share it with my team member<br>
     **So that** I and my team member can share information and work in a collaborative information space<br>
     **Scenario:** User creates a file on google drive with a team member as collaborator<br><br>
     *“Given that I’m in a role of registered mattermost user and alfred has consent to access my google drive<br>
     When I send a message ```@alfred create file "<filename>.<file extension>" and add @<member_1> as collaborator with edit access```<br>
     Then on successful creation, alfred responds with a direct message to me as well as the collaborator with the web link to      access the file."*<br>
     
     **QUICKTEST: ```@alfred create file "uat-test-2.docx" and add @testuser with read access```<br><br>**
     
* **Download file:**
   * **As** a workspace user in mattermost</br>
     **I want** to download a file from my google drive<br>
     **So that** I can access the file offline<br>
     **Scenario:** User downloads a file from google drive<br><br>
     *“Given that I’m in a role of registered mattermost user and alfred has consent to access my google drive<br>
     When I send a message ```@alfred download file "<filename>.<file extension>"```<br>
     Then on successful download, alfred responds with the requested file in the requesting channel."*<br>
     
     **QUICKTEST: ```@alfred download file "uat-test-2.docx"```<br><br>**
     
* **Fetch comments:**
   * **As** a user in mattermost workspace</br>
   **I want** to fetch comments of an existing file on google drive</br>
   **So that** I can review the comments from the team<br>
   **Scenario:** User fetches comments present for a file on google drive<br></br>
   *“Given that I’m a registered mattermost user and alfred has consent to access my google drive, **when** I put up a      message ```@alfred fetch comments "<filename>.<file extension>"```, **then** on successful retrieval, alfred responds with the first 5 comments present on the requested file."*<br>
     
     **QUICKTEST: ```@alfred fetch comments "uat-test-2.docx"```<br><br>** (you will see 0 comments at this time; if you go to the file, add comments and run again, you shall see those comments)
     
* **Update file:**
   * **As** a user in mattermost workspace</br>
   **I want** to add collaborators to an existing file on google drive</br>
   **So that** I can share the document within the team<br>
   **Scenario:** User adds one collaborator to a file on google drive</br></br>
   *“Given that I’m a registered mattermost user and alfred has consent to access my google drive, **when** I put up a      message ```@alfred add @<member_1> as collaborator with read access in "<filename>.<file extension>"```, **then** on                successful updation, alfred responds with the web link to access the file to the user and pings the collaborator with the file web link having appropriate access rights."*<br>
     
     **QUICKTEST: ```@alfred add @testuser as collaborator with read access in "uat-test-1.docx"```<br><br>**
     
    * **As** a user in mattermost workspace</br>
    **I want** to update permissions of certain collaborators</br>
    **So that** I can change the access rights of the associated collaborators in the document<br>
    **Scenario:** User updates the permission of the collaborators in a file on google drive<br><br>
    *“Given** that I’m a registered mattermost user and alfred has consent to access my google drive, **when** I put up a      message ```@alfred change/update @<member_1> access to edit access in "<filename>.<file extension>"```, **then** on                successful updation, alfred responds with the web link to access the file to the invoker user, with the updated access rights."*<br>
     
      **QUICKTEST: ```@alfred update @testuser access to edit access in "uat-test-1.docx"```<br><br>**
