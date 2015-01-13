function Server(httpPort, httpIp, smtpPort, smtpIp, maxMessageSize) {
  var express = require('express.io'),
      path = require('path'),
      routes = require('./app/config/routes'),
      logger = require('./app/services/logger'),
      smtp = require('smtp-protocol'),
      models = require('./app/models/'),
      settings = require('./app/config/settings'),
      request = require('request'),
      util = require('util'),
      favicon = require('serve-favicon');

  var app = express();
  app.http().io();

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

  app.use(favicon(__dirname + '/public/favicon.ico'));
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

  var server = app.listen(httpPort, httpIp, function () {
    logger.http.info('Express server listening on port %d and address %s', server.address().port, server.address().address);
  });

  var smtpServer = smtp.createServer(function (req) {
    req.on('message', function (stream, ack) {
      var emailData = '';
      ack.accept();
      stream.on('data', function (chunk) {
        emailData += chunk;
      });

      stream.on('end', function () {
        logger.smtp.info('Received message from: %s (%d)', req.from, emailData.length);
        if (emailData.length > maxMessageSize) {
          logger.smtp.error('Rejected message from: %s (%d) because it exceeds the maximum size of %d', req.from, emailData.length, maxMessageSize);
          return;
        }
        request.post({
          url: util.format('http://%s:%d/messages', httpIp, httpPort),
          body: emailData
        }, function optionalCallback(err, httpResponse, body) {
          if (err || httpResponse.statusCode !== 201) {
            logger.http.error('Error posting message from: %s to HTTP server', req.from);
          }
        });
      });
    });
  });

  smtpServer.listen(smtpPort, smtpIp, function () {
    logger.smtp.info('SMTP server listening on port %d and address %s', smtpServer.address().port, smtpServer.address().address);
  });
}

module.exports = Server;
