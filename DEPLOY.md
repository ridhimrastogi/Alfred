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
  * Get the code changes for CSC510-9
  * Run the Integration test cases
  * Deploy the filebot on Heroku



### Acceptance tests
