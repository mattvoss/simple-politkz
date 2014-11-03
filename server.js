/*  ==============================================================
    Include required packages
=============================================================== */
var express = require('express'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    errorhandler = require('errorhandler'),
    nconf = require('nconf'),
    path = require('path'),
    morgan   = require('morgan'),
    config, configFile, opts;

/*  ==============================================================
    Configuration
=============================================================== */
if (process.argv[2]) {
  if (fs.lstatSync(process.argv[2])) {
    configFile = require(process.argv[2]);
  } else {
    configFile = process.cwd() + '/config/settings.json';
  }
} else {
    configFile = process.cwd()+'/config/settings.json';
}

config = nconf
  .argv()
  .env("__")
  .file({ file: configFile });

var app = module.exports = express(opts);

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

app.use(express.static(__dirname + '/public'));     // set the static files location /public/img will be /img for users
app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request
app.use(allowCrossDomain);

/*  ==============================================================
    Routes
=============================================================== */
require('./app/routes.js')(app, config);

/*  ==============================================================
    Launch the server
=============================================================== */
var port = (config.get("port")) ? config.get("port") : 3001;
var server = app.listen(port, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
