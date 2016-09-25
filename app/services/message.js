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

      message.save(function (err, savedMessage) {
        if (err) {
          logger.error('Error creating message', err);
          return done(err);
        }
        var attachments = builder.getAttachments();
        if (attachments !== null) {
          async.forEach(builder.getAttachments(), function (attachment, callback) {
            savedMessage.addAttachment(attachment, function (err) {
              if (err) {
                return callback(err);
              }
              return callback(null);
            });
          }, function (err) {
            if (err) {
              logger.error('Error creating attachments for message', err);
              return done(err);
            }
            savedMessage.save(function() {
                done(null, savedMessage);
            });
            
          });
        } else {
          return done(null, savedMessage);
        }
      });
    },
    relay: function (message, to, settings) {
      
      
      var mail = {
        from: message.from,
        to: [],
        subject: message.subject,
        text: message.plain,
        html: message.html,
        cc: message.ccs,
        headers: message.headers,
        attachments: []
      };
      
      
      
      if(to) {
        mail.to = to;
      } else {
        message.recipients.forEach(function(e) {
          if(e.name) {
            mail.to.push(e.name + ' <'+e.address+'>');
          } else {
            mail.to.push(e.address);
          }
        });
      }
      message.attachments.forEach(function(a) {
        mail.attachments.push({
          filename: a.name,
          content: a.content,
          contentType: a.contentType,
        })
      });
      
      console.info('Relaying message '+ message._id + ' to ', mail.to);
      settings.smtpRelay.transporter.sendMail(mail);
    }
  };


};
