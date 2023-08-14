const express = require('express');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cors = require('cors');

const router = express.Router();
router.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,POST',
  credentials: true,
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });


/* Register Path */
router.post('/register', upload.single('profileImage'), async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      profileImage: req.file ? req.file.filename : null,
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
  const profileImage = req.file ? req.file.filename : null;
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
router.post('/updateBg', upload.single('bgImage'), async (req, res) => {
  const token = req.body.token;
  const bgImage = req.file ? req.file.filename : null;
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.userId).select('-password');
    user.bgImage = bgImage;
    await user.save();
    res.status(200).json({ message: 'Profile image updated successfully' });
  }
  catch (error) {
    res.status(401).json({ message: 'Token verification failed' });
  }
});

module.exports = router;
