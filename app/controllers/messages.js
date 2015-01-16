'use strict';
var _ = require('lodash'),
    MailParser = require("mailparser").MailParser,
    util = require('util'),
    MessageBuilder = require('../services/message-builder'),
    logger = require('../services/logger');

module.exports = {
  create: function (req, res) {
    var messageService = require('../services/message')(req.models);
    var data = req.body;
    if (data.length === 0) {
      return res.status(400).send('Error: No email body sent');
    }
    var mp = new MailParser({ debug: false, streamAttachments: false });
    mp.on('end', function (mail) {
      /**
       * safe to assume if we don't have a recipient address then the email is invalid.
       * Unfortunately mailparser does not emit errors :-(
       */
      if (mail.to === undefined) {
        logger.http.error('Invalid email sent');
        return res.status(400).send('Error: Invalid email sent');
      }
      var builder = new MessageBuilder(mail, data);
      messageService.create(builder, function (err, message) {
        if (err) {
          logger.http.error('Error persisting message from %s to database', message.from.address);
          return res.status(500).send(err);
        }
        req.io.broadcast('new message', { subject: message.subject, from: message.from.address});
        logger.http.info('Persisted message from %s to database', message.from.address);
        return res.status(201).send({ data: message });
      });
    });

    mp.write(data);
    mp.end();
  },
  all: function (req, res) {
    var q = req.query.q;
    if (req.query.q) {
      req.models.message.find({ $text: { $search: q } })
        .select('subject from received read size recipients ccs attachments html')
        .populate('attachments', 'name contentType size contentId').lean()
        .exec(function (err, messages) {
          if (err) {
            logger.http.error('Error querying messages with query of %s and error %s', q, err);
            return res.status(400).send('Error');
          }
          if (messages.length === 0) {
            logger.http.info('Fetched no messages matching query %s', q);
            return res.json({ data: []});
          }
          logger.http.info('Fetched %d messages matching query %s', messages.length, q);
          return res.status(200).json({ data: _.map(messages, function (message) {
            if (message.html) {
              message.hasHtml = true;
            }
            delete message.html;
            return message;
          }), totalCount: messages.length });
        });
    } else {
      req.models.message.find({}, 'subject from received read size recipients ccs attachments html')
        .populate('attachments', 'name contentType size contentId').lean().sort('-received').exec(function (err, messages) {
          if (err) {
            logger.http.error('Error fetching messages', err);
            return res.status(400).json(err);
          }
          req.models.message.count({}, function (err, count) {
            logger.http.info('Fetched %d messages out of a total of %d', messages.length, count);
            return res.status(200).json({ data: _.map(messages, function (message) {
              if (message.html) {
                message.hasHtml = true;
              }
              delete message.html;
              return message;
            }), totalCount: count });
          });
        });
    }
  },
  allUnread: function (req, res) {
    req.models.message.count({ read: false }, function (err, count) {
      if (err) {
        logger.http.error('Failed to fetch unread message count', err);
        return res.status(500).json(err);
      }
      logger.http.info('Fetched %d unread message count', count);
      return res.status(200).json({ totalCount: count });
    });
  },
  get: function (req, res) {
    var id = req.params.id;
    req.models.message.findById(id, 'subject from received read size recipients ccs attachments html')
      .populate('attachments', 'name contentType size contentId').lean().exec(function (err, message) {
        if (err || !message) {
          return res.status(404).json('Message not found');
        }
        if (message.html) {
          message.hasHtml = true;
          delete message.html;
        }
        return res.status(200).json(message);
      });
  },
  getSource: function (req, res) {
    var id = req.params.id;
    req.models.message.findById(id, function (err, message) {
      if (err || !message) {
        logger.http.error('Message not found for id: %s', id);
        return res.status(404).send('Message not found');
      }
      logger.http.info('Fetched source for message with id: %s', id);
      res.setHeader('Content-Type', 'text/plain;charset=utf-8');
      return res.status(200).end(message.source);
    });
  },
  getPlain: function (req, res) {
    var id = req.params.id;
    req.models.message.findById(id, 'plain', function (err, message) {
      if (err || !message) {
        logger.http.error('Message not found for id: %s', id);
        return res.status(404).send('Message not found');
      }
      logger.http.info('Fetched plain text for message with id: %s', id);
      res.setHeader('Content-Type', 'text/plain;charset=utf-8');
      return res.status(200).end(message.plain);
    });
  },
  getHtml: function (req, res) {
    var id = req.params.id;
    req.models.message.findById(id, 'html', function (err, message) {
      if (err || !message) {
        logger.http.error('Message not found for id: %s', id);
        return res.status(404).send('Message not found');
      }
      var html = null;
      if (message.html !== null) {
        logger.http.info('Fetched html for message with id: %s', id);
        html = message.html;
        _.forEach(message.attachments, function (attachment) {
          html = html.replace("cid:" + attachment.contentId,
            util.format('/messages/%d/attachments/%d?download', message.id, attachment.id));
        });
      } else {
        logger.http.info('Html does not exist for message with id: %s', id);
      }
      return res.status(200).send(html);
    });
  },
  downloadSource: function (req, res) {
    var id = req.params.id;
    req.models.message.findById(id, 'source', function (err, message) {
      if (err || !message) {
        logger.http.error('Message not found for id: %s', id);
        return res.status(404).send('Message not found');
      }
      logger.http.info('Downloaded source for message with id: %s', id);
      res.setHeader('Content-Type', 'message/rfc822');
      res.setHeader('Content-disposition', 'attachment; filename=message_' + message.id + '.eml');
      return res.status(200).end(message.source);
    });
  },
  getAttachment: function (req, res) {
    var id = req.params.id,
        attachmentId = req.params.attachmentId,
        download = req.query.download;
    req.models.message.findById(id, function (err, message) {
      if (err || !message) {
        logger.http.error('Message not found for id: %s', id);
        return res.status(404).send('Message not found');
      }
      req.models.attachment.findById(attachmentId, function (err, attachment) {
        if (!attachment) {
          logger.http.error('Attachment not found for id: %s for message id: %s', attachmentId, id);
          return res.status(404).send('Attachment not found');
        }
        logger.http.info('Fetched attachment for id: %s for message id: %s', attachmentId, id);
        if (download === undefined) {
          return res.status(200).json({ data: attachment });
        }

        res.setHeader('Content-Type', attachment.contentType);
        res.setHeader('Content-disposition', 'attachment; filename=' + attachment.name);
        return res.status(200).send(attachment.content);
      });
    });
  },
  update: function (req, res) {
    var id = req.params.id;
    req.models.message.findById(id, function (err, message) {
      if (err || !message) {
        logger.http.error('Message not found for id: %s', id);
        return res.status(404).json('Message not found');
      }
      message.read = true;
      message.save(function (err, message) {
        if (err) {
          logger.http.error('Failed to mark message as read for message with id: %s', id);
          return res.status(500).send('Error updating message');
        }
        logger.http.info('Marked message as read for message with id: %s', id);
        return res.status(200).json({
          data: message
        });
      });
    });
  },
  deleteAll: function (req, res) {
    req.models.message.remove({}, function (err) {
      if (err) {
        logger.http.error('Failed to delete all messages');
        return res.status(500).json(err);
      }
      req.models.attachment.remove({}, function (err) {
        if (err) {
          logger.http.error('Failed to remove all attachments');
          return res.status(500).json(err);
        }
        logger.http.info('Removed all messages and attachments');
        return res.status(204).end();
      });
    });
  },
  delete: function (req, res) {
    var id = req.params.id;
    req.models.message.findById(id, function (err, message) {
      if (err || !message) {
        logger.http.error('Message not found for id: %s', id);
        return res.status(404).json('Message not found');
      }
      message.remove(function (err) {
        if (err) {
          logger.http.error('Failed to delete message for id: %s', id);
          return res.status(500).json('Error deleting message');
        }
        logger.http.info('Deleted message for id: %s', id);
        return res.status(204).end();
      });
    });
  },
  getHeaders: function (req, res) {
    var id = req.params.id,
        html = req.query.html;
    req.models.message.findById(id, 'headers', function (err, message) {
      if (err || !message) {
        logger.http.error('Message not found for id: %s', id);
        return res.status(404).send('Message not found');
      }
      logger.http.info('Fetched headers for message with id: %s', id);
      if (html === undefined) {
        return res.status(200).json({ data: message.headers });
      }
      return res.render('headers', { headers: message.headers });
    });
  }
};
