# FileBot 

## Team: CSC510-9

## Team Members

* Ridhim Rastogi (rrastog3)
* Shubham Dilip Pampattiwar (sdpampat)
* Akash Pramod Pateria (apateri)
* Jaymin Desai (jddesai2)

## Problem Statement

## Bot Description

## Use Cases

### 1a. Create a file on google drive without sharing it with other users
 
  - **Preconditions**:
  
    User should have provided necessary authentication details to the bot (referred to as Alfred from now on)
    
  - **Main Flow**:
  
    User will ask Alfred to create a file. Alfred will create the file on users google drive and share the link in chat.
     
  - **Subflows**:
  
    - User will ping Alfred using its handle @alfred with some command to create a file.
    - Alfred will make create the file on users drive with default options.
    - Alfred will then DM user the link to that file.
    
  - **Alternative Flows**:
    
    - Alfred being a conversational bot will ask user for the file name if user didn't specify it in the first call.
    - If the user is not correctly configured, Alfred will ask him to do so.
  
 1b. Create a file on google drive and share it with other users
 
  - Preconditions:
  - Main Flow:
  - Subflows:
  - Alternative Flows:

#### Other details can be found in [DESIGN.md](https://github.ncsu.edu/csc510-fall2019/CSC510-9/blob/master/DESIGN.md)
