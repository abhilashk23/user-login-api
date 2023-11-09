# API for Link Storing website

This repository contains code for REST API created for my project that allows user to create their profile, store their inmportant links, 
update profile photo, update background image on their profile page.

I am using the following stack for backend: 
- **Node JS**
- **ExpressJS**
- **MongoDB**

#### The API is hosted on Render. 

## To run the API on local machine

- Git clone to your machine
  ``` console
  git clone https://github.com/abhilashk23/user-login-api.git
  ```
- Then install the libraries using npm
  ``` console
  npm install
  ```
- Install nodejs, nodemon to run the app.js file
  ```console
  npm install nodejs nodemon
  ```
- Create .env file to store environment variables

- To run the app.js file
  ```console
  nodemon app.js
  ```


## Storage For API
The API uses AWS S3 for storing image files.
