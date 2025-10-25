var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

var indexRouter = require('./app_server/routes/index');
var usersRouter = require('./app_server/routes/users');
var apiRouter = require('./app_server/routes/api');

var app = express();

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://aksh:aksh123@cluster1.zhb0w2z.mongodb.net/Project0';
mongoose.connect(mongoURI)
.then(async () => {
  console.log('Connected to MongoDB successfully');
  // Initialize default data
  try {
    const apiRoutes = require('./app_server/routes/api');
    if (typeof apiRoutes.initializeDefaultData === 'function') {
      await apiRoutes.initializeDefaultData();
    }
  } catch (error) {
    console.error('Error initializing default data:', error.message);
  }
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public/images/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// view engine setup
app.set('views', path.join(__dirname,'app_server', 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Apply rate limiting to API routes
app.use('/api/', limiter);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.locals.title = 'Error';

  // render the error page
  res.status(err.status || 500);
  res.render('error', {
    title: 'Error - ' + (err.status || 500),
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;
