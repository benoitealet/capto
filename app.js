var express = require('express'),
  path = require('path'),
  routes = require('./app/config/routes'),
  logger = require('./app/services/logger'),
  smtp = require('smtp-protocol'),
  models = require('./app/models/'),
  settings = require('./app/config/settings'),
  request = require('request');

var app = express();
app.use(function (req, res, next) {
  var data = '';
  req.setEncoding('utf8');
  req.on('data', function (chunk) {
    data += chunk;
  });

  req.on('end', function () {
    req.body = data;
    next();
  });
});

// view engine setup
app.set('views', path.join(__dirname, '/app/views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res, next) {
  models(settings, function (err, db) {
    if (err) return next(err);

    req.models = db.models;
    req.db = db;

    return next();
  });
});
app.use(routes);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

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

/**
 * production error handler
 * no stacktraces leaked to user
 */
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.set('port', process.env.PORT || 9024);

var server = app.listen(app.get('port'), function () {
  logger.info('Express server listening on', server.address().port);
});

var smtpServer = smtp.createServer(function (req) {
  var emailData = '';
  req.on('message', function (stream, ack) {
    ack.accept();
    stream.on('data', function (chunk) {
      emailData += chunk;
    });

    stream.on('end', function () {
      logger.info('[SMTP] Receieved message from: %s (%d)', req.from, emailData.length);
      request.post({
        url: 'http://localhost:9024/messages',
        body: emailData
      });
    });
  });
});

smtpServer.listen(9025, function () {
  logger.info('SMTP server listening on', smtpServer.address().port);
});
