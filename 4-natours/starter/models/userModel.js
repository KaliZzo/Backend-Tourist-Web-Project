const mongoose = require('mongoose');
const { default: isEmail } = require('validator/lib/isEmail');
const validator = require('validator');

//Name , Email,Photo,password, passwordConfrim.

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your Email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
  },
  passwordConfrim: {
    type: String,
    required: [true, 'Please confrim your passowrd'],
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
