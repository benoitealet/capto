'use strict';
var _ = require('lodash'),
  logger = require('../services/logger'),
  MailParser = require("mailparser").MailParser;
module.exports = {
  create: function (req, res) {
    var MessageBuilder = require('../services/message-builder');
    var messageService = require('../services/message')(req.db.models);
    var data = req.body;
    var mp = new MailParser({ debug: false });
    mp.on("end", function (mail) {
      var builder = new MessageBuilder(mail, data);
      messageService.create(builder, function (err, message) {
        if (err) {
          return res.status(500).send('Error :-(');
        }
        return res.status(201).send('created');
      });
    });
    mp.write(data);
    mp.end();
  },
  all: function (req, res) {
    var limit = req.query.limit ? req.query.limit : 50,
      offset = req.query.start ? req.query.start : 0;
    if (req.query.q) {
      req.models.message.match("source").against(req.query.q)
        .limit(parseInt(limit)).offset(parseInt(offset))
        .run(function (err, messages) {
          if (err) {
            return res.json(err);
          }
          req.models.message.match("source").against(req.query.q).run(function (err, count) {
            var data = messages.map(function (message) {
              return message.serialize();
            });
            return res.json({ data: data, totalCount: count.length });
          });

        });
    } else {
      req.models.message.find({}).limit(parseInt(limit)).offset(parseInt(offset))
        .order("-received").only('id', 'subject', 'fromName', 'fromAddress', 'received', 'read', 'size')
        .run(function (err, messages) {
          if (err) {
            return res.json(err);
          }
          req.models.message.count({}, function (err, count) {
            if (err) {
              return res.status(400).json(err);
            }
            var data = messages.map(function (message) {
              return message.serialize();
            });
            return res.json({ data: data, totalCount: count });
          });
        });
    }
  },
  get: function (req, res) {
    var id = req.params.id;
    req.models.message.get(id, function (err, message) {
      if (err) {
        return res.status(404).json('Message not found');
      }
      return res.status(200).json(message);
    });
  },
  getSource: function (req, res) {
    var id = req.params.id;
    req.models.message.get(id, function (err, message) {
      if (err) {
        return res.status(404).send('Message not found');
      }
      res.setHeader('Content-Type', 'text/plain;charset=utf-8');
      return res.status(200).end(message.source);
    });
  },
  getPlain: function (req, res) {
    var id = req.params.id;
    req.models.message.get(id, function (err, message) {
      if (err) {
        return res.status(404).send('Message not found');
      }
      res.setHeader('Content-Type', 'text/plain;charset=utf-8');
      return res.status(200).end(message.plain);
    });
  },
  getHtml: function (req, res) {
    var id = req.params.id;
    req.models.message.get(id, function (err, message) {
      if (err) {
        return res.status(404).send('Message not found');
      }
      return res.status(200).send(message.html);
    });
  },
  downloadSource: function (req, res) {
    var id = req.params.id;
    req.models.message.get(id, function (err, message) {
      if (err) {
        return res.status(404).send('Message not found');
      }
      res.setHeader('Content-Type', 'message/rfc822');
      res.setHeader('Content-disposition', 'attachment; filename=message_' + message.id + '.eml');
      return res.status(200).end(message.source);
    });
  },
  getAttachment: function (req, res) {
    var id = req.params.id,
      attachmentId = req.params.attachmentId,
      download = req.query.download;
    req.models.message_attachment.find({ 'id': attachmentId, 'message_id': id }).first(function (err, attachment) {
      if (err || !attachment) {
        return res.status(404).send('Attachment not found');
      }
      if (download === undefined) {
        return res.status(200).json({ data: attachment.serialize() });
      }
      res.setHeader('Content-Type', attachment.contentType);
      res.setHeader('Content-disposition', 'attachment; filename=' + attachment.name);
      return res.status(200).send(attachment.content);
    });
  },
  update: function (req, res) {
    var id = req.params.id;
    req.models.message.get(id, function (err, message) {
      if (err) {
        return res.status(404).json('Message not found');
      }
      message.save({ read: true}, function (err, message) {
        return res.status(200).json({
          data: message
        });
      });
    });
  },
  deleteAll: function (req, res) {
    req.models.message.find({}).remove(function (err) {
      if (err) {
        return res.status(500).json(err);
      }
      return res.status(204).end();
    });
  },
  delete: function (req, res) {
    var id = req.params.id;
    req.models.message.get(id, function (err, message) {
      if (err) {
        return res.status(404).json('Message not found');
      }
      message.remove(function (err) {
        if (err) {
          return res.status(404).json('Message not found');
        }
        return res.status(204).end();
      });
    });
  }
};
