module.exports = function (models) {
  var logger = require('./logger').http,
      async = require('async'),
      _ = require('lodash');

  var createAttachments = function (message, attachments, done) {
    if (attachments === null) {
      return done(null, message);
    }
    async.forEach(attachments, function (attachment, callback) {
      attachment.message_id = message.id;
      models.message_attachment.create(attachment, function (err) {
        if (err) {
          return callback(err);
        }
        return callback(null);
      });
    }, function (err) {
      if (err) {
        logger.error('Error creating attachments', err);
        return done(err);
      }
      return done(null);
    });
  };

  var createRecipients = function (message, recipients, done) {
    async.forEach(recipients, function (recipient, callback) {
      recipient.message_id = message.id;
      models.message_recipient.create(recipient, function (err) {
        if (err) {
          return callback(err);
        }
        return callback(null);
      });
    }, function (err) {
      if (err) {
        logger.error('Error creating recipients', err);
        return done(err);
      }
      return done(null);
    });
  };

  var createCCs = function (message, ccs, done) {
    if (ccs === null) {
      return done(null);
    }
    async.forEach(ccs, function (cc, callback) {
      cc.message_id = message.id;
      models.message_cc.create(cc, function (err) {
        if (err) {
          return callback(err);
        }
        return callback(null);
      });
    }, function (err) {
      if (err) {
        logger.error('Error creating CCs', err);
        return done(err);
      }
      return done(null);
    });
  };

  var createHeaders = function (message, headers, done) {
    async.forEach(headers, function (header, callback) {
      header.message_id = message.id;
      models.message_header.create(header, function (err) {
        if (err) {
          return callback(err);
        }
        return callback(null);
      });
    }, function (err) {
      if (err) {
        logger.error('Error creating headers', err);
        return done(err);
      }
      return done(null);
    });
  };

  return {
    create: function (builder, done) {
      models.message.create(builder.getMessage(), function (err, message) {
        if (err) {
          logger.error('Create message error', err);
          return done(err);
        }
        async.parallel([
          function (callback) {
            createHeaders(message, builder.getHeaders(), function (err) {
              callback(err);
            });
          },
          function (callback) {
            createRecipients(message, builder.getRecipients(), function (err) {
              callback(err);
            });
          },
          function (callback) {
            createCCs(message, builder.getCCs(), function (err) {
              callback(err);
            });
          },
          function (callback) {
            createAttachments(message, builder.getAttachments(), function (err) {
              callback(err);
            });
          }
        ], function (err) {
          if (err) {
            logger.error('Error creating message', err);
            return done(err, message);
          }
          logger.info('Persisted message into database with id: ', message.id);
          return done(null, message);
        });
      });
    }
  };
};
