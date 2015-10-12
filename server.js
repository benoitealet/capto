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
      mongoose = require('mongoose'),
      through2 = require('through2'),
      async = require('async');

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

  mongoose.set('debug', settings.database.debug);

  var connect = function() {
    mongoose.connect(settings.database.url, settings.database.options, function(err) {
      if (err) throw err;
    });
  }
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
  app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });

  app.set('port', process.env.PORT || 9024);

  var smtpServer = smtp.createServer(function (req) {
    var MailParser = require("mailparser").MailParser;
    var MessageBuilder = require('./app/services/message-builder');
    var models = {
      message: mongoose.model('message', require(path.join(__dirname, '/app/models/message'))),
      attachment: mongoose.model('attachment', require(path.join(__dirname, '/app/models/attachment')))
    };
    var messageService = require('./app/services/message')(models);
    var mp = new MailParser({ debug: false, streamAttachments: false });

    /**
     * Reject a message if it is larger than the specified max message length
     * @param length - bytes
     */
    var limit = function (length) {
      var streamLength = 0;
      return through2(function (chunk, enc, callback) {
        streamLength += chunk.length;
        if (streamLength > length) {
          callback({ code: 552, message: 'Requested mail action aborted: exceeded storage allocation' });
        } else {
          callback(null, chunk);
        }
      });
    };

    req.on('message', function (stream, ack) {
      logger.smtp.info('Received message from %s', req.from);
      ack.accept();
      var data = '';

      stream.pipe(limit(maxMessageSize)
        .on('data', function (d) {
          data += d;
        }))
        .on('error', function (err) {
          if (err.code === 552) {
            logger.smtp.error('Rejected message: %s', err.message);
            ack.reject(err.code, err.message);
          } else {
            logger.smtp.error('Error processing message', err);
          }
        })
        .on('end', function () {
          mp.on('end', function (mail) {
            /**
             * safe to assume if we don't have a recipient address then the email is invalid.
             * Unfortunately mailparser does not emit errors :-(
             */
            if (mail.to === undefined) {
              logger.smtp.error('Invalid email sent');
              return;
            }
            var builder = new MessageBuilder(mail, data);
            messageService.create(builder, function (err, message) {
              if (err) {
                logger.smtp.error('Error persisting message from %s to database', message.from.address);
                return;
              }
              logger.smtp.info('Persisted message from %s to database', message.from.address);
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
  });
  return {
    run: function (done) {
      async.series([ function (callback) {
        var server = app.listen(httpPort, httpIp, function () {
          logger.http.info('HTTP server listening on port %d and address %s', server.address().port, server.address().address);
          callback();
        }).on('error', function (err) {
          logger.http.error('Error starting HTTP server', err);
          callback(err);
        });
      }, function (callback) {
        smtpServer.listen(smtpPort, smtpIp, function () {
          var port = smtpServer.address().port,
              address = smtpServer.address().address;
          logger.smtp.info('SMTP server listening on port %d and address %s', port, address);
          callback();
        }).on('error', function (err) {
          logger.smtp.error('Error starting SMTP server', err);
          callback(err);
        });
      }], function (err) {
        if (err) {
          done(err);
        }
        done(null);
      });
    }
  }
}

module.exports = Server;
