const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const globalErrorHandler = require('./Controllers/errorController');
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const AppError = require('./utils/appError');

const app = express();

//1)Global Middleware

//Set Security HTTPS headers
app.use(helmet());

//Development Login
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit Request from the same API
const limiter = rateLimit({
  max: 3,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again in an hour!',
});
app.use('/api', limiter);

//Body Parser. reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());
//Data sanitization against XXS
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);
//serving static Files
app.use(express.static(`${__dirname}/public`));

//Test middleware
app.use((req, res, next) => {
  console.log('Hello from the Middleware😀');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
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
