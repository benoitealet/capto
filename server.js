function Server(httpPort, httpIp, smtpPort, smtpIp, maxMessageSize) {
  var express = require('express.io'),
      path = require('path'),
      routes = require('./app/config/routes'),
      logger = require('./app/services/logger'),
      smtp = require('smtp-protocol'),
      settings = require('./app/config/settings'),
      request = require('request'),
      util = require('util'),
      favicon = require('serve-favicon'),
      mongoose = require('mongoose');

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

  /** Setup mongoose **/

  mongoose.set('debug', settings.database.debug);

// Connect to mongodb
  var connect = function () {
    mongoose.connect(settings.database.url, settings.database.options);
  };
  connect();

  mongoose.connection.on('error', logger.http.error);
  mongoose.connection.on('disconnected', connect);


  // view engine setup
  app.set('views', path.join(__dirname, '/app/views'));
  app.set('view engine', 'jade');
  app.use(express.static(path.join(__dirname, 'public')));


  app.use(function (req, res, next) {
    req.models = {
      message: mongoose.model('message', require(path.join(__dirname, '/app/models/message'))),
      attachment: mongoose.model('attachment', require(path.join(__dirname, '/app/models/attachment')))
    };
    req.settings = settings;
    next();
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
    var MailParser = require("mailparser").MailParser;
    var MessageBuilder = require('./app/services/message-builder');
    var models = {
      message: mongoose.model('message', require(path.join(__dirname, '/app/models/message'))),
      attachment: mongoose.model('attachment', require(path.join(__dirname, '/app/models/attachment')))
    };
    var messageService = require('./app/services/message')(models);
    var mp = new MailParser({ debug: false, streamAttachments: false });

    req.on('message', function (stream, ack) {
      ack.accept();
      process.nextTick(function () {
        var data = '';
        stream.on('data', function (d) {
          data += d;
        });

        stream.on('end', function () {
          mp.on('end', function (mail) {
            /**
             * safe to assume if we don't have a recipient address then the email is invalid.
             * Unfortunately mailparser does not emit errors :-(
             */
            if (mail.to === undefined) {
              logger.http.error('Invalid email sent');
              return;
            }
            var builder = new MessageBuilder(mail, data);
            messageService.create(builder, function (err, message) {
              if (err) {
                logger.http.error('Error persisting message from %s to database', message.from.address);
                return;
              }
              logger.http.info('Persisted message from %s to database', message.from.address);

              models.message.findById(message._id, 'subject from received read size recipients ccs attachments html')
                .populate('attachments', 'name contentType size contentId').lean().exec(function (err, message) {
                  if (message.html) {
                    message.hasHtml = true;
                    delete message.html;
                  }
                  app.io.broadcast('new message', { data: message });
                });
            });
          });

          mp.write(data);
          mp.end();
        });
      });

//      logger.smtp.info('Received message from: %s', req.from);
//      stream.pipe(request.post(util.format('http://%s:%d/messages', httpIp, httpPort))
//        .on('response', function (response) {
//          if (response.statusCode !== 201) {
//            logger.http.error('Error persisting message to database from: %s', req.from);
//          } else {
//            logger.http.info('Persisted messages to database from: %s', req.from);
//          }
//        })
//        .on('error', function (err) {
//          logger.http.error('Error creating message from: %s with error', req.from, err);
//        }), { end: true });
//      ack.accept();
    });
  });

  smtpServer.listen(smtpPort, smtpIp, function () {
    logger.smtp.info('SMTP server listening on port %d and address %s', smtpServer.address().port, smtpServer.address().address);
  });
}

module.exports = Server;
