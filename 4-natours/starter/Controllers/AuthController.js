const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync.js');
const appError = require('./../utils/appError.js');
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfrim: req.body.passwordConfrim,
  });
  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) check if email and password exisit
  if (!email || !password) {
    return next(new appError('Please provide email and password', 400));
  }

  //2)check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password'); // style es6 for email: email(email ===email)

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new appError('incorrect email or password', 401));
  }

  //3)if everything ok, send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});
