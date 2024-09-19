const crypto = require('crypto');
const { promisify } = require('util'); // promsify method
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync.js');
const appError = require('./../utils/appError.js');
const sendEmail = require('./../utils/email.js');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // secure: true,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  //Remove the password from Output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfrim: req.body.passwordConfrim,
    passwordChangeAt: req.body.passwordChangeAt,
    role: req.body.role,
    passwordResetToken: req.body.passwordResetToken,
    passwordResetExpires: req.body.passwordResetExpires,
  });
  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting the Token and check if it's there:
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // console.log(token);

  if (!token) {
    return next(
      new appError('You are not logged in! Please log in to get access'),
      401,
    );
  }

  //2)We need to verifiction the Token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3) Check if user still exisits
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new appError(
        'The User that belongs to the token does not longer exisit ',
        401,
      ),
    );
  }
  //4) Check if user changed password after the JWT was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new appError('User recently changed password! please log-in again'),
      401,
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser; // לאחסן כאן את הדאטה של המשתמש היה מאוד חיוני לצעד הבא של הפונקציה של ה restrictTo
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on Posted Email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new appError('There is no user with  email address', 400));
  }
  //2)Generate the random reset Token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}.\nIf you didn't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      text: message,
      html: `<p>${message}</p>`,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new appError('There was an error sending the email, try again later'),
      500,
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) if Token has not exipred, and there is user, set the new password
  if (!user) {
    return next(new appError('Token is invalid or has expierd', 400));
  }
  user.password = req.body.password;
  user.passwordConfrim = req.body.passwordConfrim;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3)Update ChangePasswordAt proprety for the user

  //4)Log the user in, send JWT
  createSendToken(user, 200, res);

  // const token = signToken(user._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) get the user from the collection
  const user = await User.findById(req.user.id).select('+password');
  //2)Check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    //----
    return next(new appError('Your currect Password is wrong', 401));
  }
  //3)if so, update password
  user.password = req.body.password;
  user.passwordConfrim = req.body.passwordConfrim;
  await user.save();
  //User.findByIdAndUpdate will NOT work as intended!
  //4)Log user in, send JWT
  createSendToken(user, 200, res);
});
