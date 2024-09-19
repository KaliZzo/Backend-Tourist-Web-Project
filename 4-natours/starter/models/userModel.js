const crypto = require('crypto');
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
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
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
  passwordChangeAt: {
    type: Date,
    default: Date.now,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
    default: Date.now,
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

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangeAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangeAt) {
    const changeTimeStamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10,
    );

    console.log(changeTimeStamp, JWTTimestamp);
    return JWTTimestamp < changeTimeStamp;
  }
  //Flase means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
