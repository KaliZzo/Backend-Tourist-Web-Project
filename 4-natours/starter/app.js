const express = require('express');
const morgan = require('morgan');
const globalErrorHandler = require('./Controllers/errorController');
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const AppError = require('./utils/appError');

const app = express();

/// 1) MIDDLEWARES
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  console.log('Hello from the Middleware😀');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// MIddleware that must to be in the end of the routes and probably most of the code becasue if I will add it on the top none of the routes
//will not works

// app.all('*', (req, res, next) => {
//   res.status(404).json({
//     status: 'failed',
//     message: `Cant find ${req.originalUrl} on this Server`,
//   });

//   next();
// });

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this Server!`, 404));
});

app.use(globalErrorHandler);

// 4) START SERVER

module.exports = app;
