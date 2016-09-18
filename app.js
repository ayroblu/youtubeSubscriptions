var express = require('express');
var compression = require('compression');
var path = require('path');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var multer = require('multer'); // v1.0.5 // Used for multipart/form-data file uploading
var stylus = require('stylus');
var autoprefixer = require('autoprefixer-stylus');

// routing imports
var routes = require('./routes/index');

// Running a server
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
//app.use(cookieParser());
app.use(stylus.middleware({
  src: path.join(__dirname, 'public')
, compile: function(str, path) {
    console.log('compiling',str,path)
    return stylus(str)
      .use(autoprefixer())   // autoprefixer
      .set('filename', path) // @import
      .set('compress', true) // compress
      .set('include css', true)
  }
}));

app.use(compression());

//var oneDay = 86400000;
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;