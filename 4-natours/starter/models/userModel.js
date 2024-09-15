const mongoose = require('mongoose');
const { default: isEmail } = require('validator/lib/isEmail');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
    validate: {
      //This only works CREATE() OR SAVE()
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
});

userSchema.pre('save', async function (next) {
  //Only run this function if password was actully motified
  if (!this.isModified('password')) return next();

  //Hash the password with const of 12
  this.password = await bcrypt.hash(this.password, 12);
  //Delete the passwordConfrim Field
  this.passwordConfrim = undefined;
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
