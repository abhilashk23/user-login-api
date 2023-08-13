const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  password: String,
  profileImage: String, // Store the image filename
});

const User = mongoose.model('User', userSchema);

module.exports = User;
