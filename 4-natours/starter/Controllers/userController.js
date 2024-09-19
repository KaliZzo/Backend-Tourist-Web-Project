const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');

const filterObj = (obj, ...allowFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};
/// 2) ROUTE HANDLARES
(exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
})),
  (exports.updateMe = catchAsync(async (req, res, next) => {
    //1) create Error if user POSTs Password data
    if (req.body.password || req.body.passwordConfrim) {
      return next(
        new AppError(
          'This route is not for password updates, please use /updateMyPassword',
          400,
        ),
      );
    }

    //3)filtered out unwanted fiels names that not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    //3)Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: 'sucesss',
      data: {
        user: updatedUser,
      },
    });
  }));

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};
