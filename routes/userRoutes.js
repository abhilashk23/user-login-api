const express = require('express');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');
require('dotenv').config();

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: 'ap-south-1'
});
const router = express.Router();



const s3 = new AWS.S3();


// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   },
// });

//const upload = multer({ storage: storage });

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'node-api-linkpalace-bucket',
    acl: 'public-read', // Set appropriate ACL
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const folder = 'profileImage'; // Specify your desired folder name
      const filename = Date.now().toString() + '-' + file.originalname;
      const key = folder + '/' + filename; // Include the folder in the key
      cb(null, key);
    },
    contentType : multerS3.AUTO_CONTENT_TYPE
  }),
});

/* BG image upload */
const uploadbg = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'node-api-linkpalace-bucket',
    acl: 'public-read', // Set appropriate ACL
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const folder = 'bgImage'; // Specify your desired folder name
      const filename = Date.now().toString() + '-' + file.originalname;
      const key = folder + '/' + filename; // Include the folder in the key
      cb(null, key);
    },
    contentType : multerS3.AUTO_CONTENT_TYPE
  }),
});



/* Register Path */
router.post('/register', upload.single('profileImage'), async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const existingUser2 = await User.findOne({ username });
    if (existingUser2) {
      return res.status(400).json({ message: 'Username in use!' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      profileImage: req.file ? req.file.location : null,
    });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' });
  }
});

/* Login Path */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const userExists = await User.findOne({ username });
    if (!userExists) {
      return res.status(400).json({ message: 'No user found with that username' });
    }

    const isPasswordMatch = await bcrypt.compare(password, userExists.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Invalid credentails' });
    }

    const token = jwt.sign({ userId: userExists._id }, process.env.SECRET_KEY, { expiresIn: '1h' });
    res.json(token);

  } catch (error) {
    res.status(500).json({ message: error });
  }
})

/* Token verification */
router.post('/verifyToken', async (req, res) => {
  const token = req.body.token;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Token verification failed' });
  }
});

/* Update profile Image */
router.post('/updateProfile', upload.single('profileImage'), async (req, res) => {
  const token = req.body.token;
  const profileImage = req.file ? req.file.location : null;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.userId).select('-password');
    user.profileImage = profileImage;
    await user.save();
    res.status(200).json({ message: 'Profile image updated successfully' });
  } catch (error) {
    res.status(401).json({ message: 'Token verification failed' });
  }
});

/* Add links */
router.post('/addLinks', async (req, res) => {
  const { token, title, url } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.userId).select('-password');

    user.links.push({ title, url });
    await user.save();
    res.status(200).json({ message: 'Link added successfully' });
  }
  catch (error) {
    res.status(401).json({ message: 'Token verification failed' });
  }
});

/* Update backgroud image */
router.post('/updateBg', uploadbg.single('bgImage'), async (req, res) => {
  const token = req.body.token;
  const bgImage = req.file ? req.file.location : null;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.userId).select('-password');
    user.bgImage = bgImage;
    await user.save();
    res.status(200).json({ message: 'Background image updated successfully' });
  }
  catch (error) {
    res.status(401).json({ message: 'Token verification failed' });
  }
});

/* Removing Bg image */
router.post('/removeBg', async (req, res) => {
  const token = req.body.token;
  console.log(token);
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.userId).select('-password');
    user.bgImage = "";
    await user.save();
    res.status(200).json({ message: 'Bg image removed successfully' });
  }
  catch (error) {
    res.status(401).json({ message: 'Token verification failed' });
    console.log(error);
  }
});

/* Removing profile image */
router.post('/removeProfile', async (req, res) => {
  const token = req.body.token;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.userId).select('-password');
    user.profileImage = "";
    await user.save();
    res.status(200).json({ message: 'Profile image removed successfully' });
  }
  catch (error) {
    res.status(401).json({ message: 'Token verification failed' });
    console.log(error);
  }
});

/* Delete link */
router.post('/delLink', async (req, res) => {
  const { token, title } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.userId).select('-password');
    for (let i = 0; i < user.links.length; i++) {
      if (user.links[i].title === title) {
        await user.links.splice(i, 1);
      }
    }
    await user.save();
    res.status(200).json({ message: 'Link removed successfully' });
  }
  catch (error) {
    res.status(401).json({ message: 'Token verification failed' });
    console.log(error);
  }
});

/* Username update */
router.post('/updateUsername', async (req, res) => {
  const { token, newUsername, newEmail } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.userId).select('-password');
    const existingUser3 = await User.findOne({ username: newUsername });
    if (existingUser3) {
      return res.status(400).json({ message: 'Username in use!' });
    }
    user.username = newUsername;
    user.email = newEmail;
    await user.save();

    res.status(200).json({ message: "User updated successfully" });
  }
  catch (error) {
    console.log(error);
  }
});

/* Password update */
router.post('/passwordUpdate', async (req, res) => {
  const { token, oldPass, newPass, confNewPass } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.userId);

    const isPasswordMatch = await bcrypt.compare(oldPass, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Old password not same' });
    }

    if (newPass !== confNewPass) {
      return res.status(400).json({ message: 'Passwords don\'t match' });
    }

    const newPassMatch = await bcrypt.compare(newPass, user.password);
    if (newPassMatch) {
      return res.status(400).json({ message: 'New Password can\'t be same as old' });
    }
    user.password = await bcrypt.hash(newPass, 10);
    await user.save();
    res.status(200).json({ message: 'Password updated' });

  }
  catch (error) {
    console.log(error);
  }
});


/* Allow user to search a user and view its profile */
router.post('/searchUser', async (req, res) => {
  const { username } = req.body;
  try {
    const searchedUser = await User.findOne({ username });
    if(searchedUser){
      const result = {
        'name' : searchedUser.name,
        'email' : searchedUser.email,
        'username' : searchedUser.username,
        'bgImage': searchedUser.bgImage,
        'profileImage': searchedUser.profileImage,
        'links': searchedUser.links
      };
      res.status(200).json(result);
    }
    else{
      res.status(400).json({message: "No user found with that username"});
    }
  }
  catch (error) {
    console.log(error);
  }
});

router.get('/suggestions', async (req, res) => {
  const { query } = req.query;
  try {
    const users = await User.find({ username: { $regex: `^${query}`, $options: 'i' } }).limit(5);
    const suggestions = users.map(user => ({
      'name': user.name,
      'username': user.username,
      'profileImage': user.profileImage,
    }));
    res.status(200).json(suggestions);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});



module.exports = router;
