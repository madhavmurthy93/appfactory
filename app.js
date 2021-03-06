var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');

var about = require('./routes/about');
var admin = require('./routes/admin');
var auth = require('./routes/auth');
var idea = require('./routes/idea');
var index = require('./routes/index');
var profile = require('./routes/profile');
var testdb = require('./routes/testdb');
var sendInvite = require('./routes/sendInvite');
var walkthrough = require('./routes/walkthrough');

var app = express();

// app.locals is accessible to all rendered templates.  We'll set
// devenv so all our templates know whether we're running in a dev environment
// or the production one.
app.locals.devenv = (app.get('env') === 'development');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/Favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({secret: process.env.SESSION_SECRET,
		 resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());


app.use(function(req, res, next) {
    if (req.session.passport.user) {
        res.locals.user = req.session.passport.user;
    }
    next();
});

// Log information about each request.
app.use(function(req, res, next) {
    console.log('Request referer:', req.headers['referer']);
    console.log('Request user-agent:', req.headers['user-agent']);
    next();
});

app.use('/', walkthrough);
app.use('/demo/', index);
app.use('/demo/about', about);
app.use('/demo/admin', admin);
app.use('/demo/auth', auth);
app.use('/demo/idea', idea);
app.use('/demo/profile', profile);
app.use('/demo/testdb', testdb);
app.use('/demo/sendInvite', sendInvite);

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
