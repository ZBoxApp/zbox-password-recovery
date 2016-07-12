"use strict";

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var favicon = require('serve-favicon');
var fs = require('fs');
var logger = require('morgan');
var parseServer = require('parse-server').ParseServer;
var parseDashboard = require('parse-dashboard');
var path = require('path');

var routes = require(path.join(__dirname, "src/routes/index"));

var app = express();

var dashboard = new parseDashboard({
    "allowInsecureHTTP": true,
	"apps": [
		{
			"serverURL": process.env.PARSE_SERVER_URL,
			"appId": process.env.PARSE_REST_API_KEY,
			"masterKey": process.env.PARSE_MASTER_KEY,
			"appName": 'APPRESET'
		}
	],
	"users": [
    {
      "user": process.env.DASHBOARD_USER,
      "pass": process.env.DASHBOARD_PASS
    }]
}, true);


app.use(process.env.PARSE_ENDPOINT_API, new parseServer({
    appId: 'APPRESET',
    databaseURI: process.env.PARSE_DATABASE,
    cloud: path.join(__dirname, 'src/cloud/main.js'),
    masterKey: process.env.PARSE_MASTER_KEY,
    restAPIKey: process.env.PARSE_REST_API_KEY,
    serverURL: process.env.PARSE_SERVER_URL
}));

app.use('/dashboard', dashboard);

// view engine setup
app.set('views', path.join(__dirname, "src", "views"));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

if (app.get('env') === 'development') {
    app.use(require('node-sass-middleware')({
        src: path.join(__dirname, 'src', 'assets'),
        dest: path.join(__dirname, 'dist', 'assets'),
        indentedSyntax: true,
        sourceMap: true,
        force: true,
        outputStyle: 'expanded'
    }));
}

app.use(express.static(path.join(__dirname, 'dist', 'assets')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
