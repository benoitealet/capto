module.exports = function (models) {
  var logger = require('./logger').http,
      async = require('async'),
      _ = require('lodash');

  return {
    create: function (builder, done) {
      var message = new models.message(builder.getMessage());
      _.forEach(builder.getRecipients(), function (recipient) {
        message.recipients.push(recipient);
      });
      _.forEach(builder.getCCs(), function (cc) {
        message.ccs.push(cc);
      });

      _.forEach(builder.getHeaders(), function (header) {
        message.headers.push(header);
      });

      _.forEach(builder.getAttachments(), function (attachment) {
        message.attachments.push(attachment);
      });


      message.save(function (err, savedMessage) {
        if (err) {
          logger.error('Error creating message', err);
          return done(err);
        }
        return done(null, savedMessage);
      });
    }
  };
};
