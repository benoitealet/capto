'use strict';
var _ = require('lodash'),
  logger = require('../services/logger'),
  MailParser = require("mailparser").MailParser,
  util = require('util'),
  MessageBuilder = require('../services/message-builder');

module.exports = {
  create: function (req, res) {
    var messageService = require('../services/message')(req.db.models);
    var data = req.body;
    var mp = new MailParser({ debug: false, streamAttachments: false });
    mp.on("end", function (mail) {
      var builder = new MessageBuilder(mail, data);
      messageService.create(builder, function (err, message) {
        if (err) {
          return res.status(500).send(err);
        }
        req.io.broadcast('new message', { subject: message.subject, from: message.fromAddress });
        return res.status(201).send({ data: message.serialize() });
      });
    });
    mp.write(data);
    mp.end();
  },
  all: function (req, res) {
    var limit = /^\d+$/.test(req.query.limit) ? req.query.limit : 50;
    var offset = /^\d+$/.test(req.query.offset) ? req.query.offset : 0;

    if (req.query.q) {
      req.models.message.match('source').against(req.query.q)
        .limit(parseInt(limit)).offset(parseInt(offset))
        .run(function (err, messages) {
          if (err) {
            return res.json(err);
          }
          req.models.message.match('source').against(req.query.q).run(function (err, count) {
            var data = messages.map(function (message) {
              return message.serialize();
            });
            return res.json({ data: data, totalCount: count.length });
          });
        });
    } else {
      req.models.message.find({}).limit(parseInt(limit)).offset(parseInt(offset))
        .order("-received").only('id', 'subject', 'fromName', 'fromAddress', 'received', 'read', 'size', 'html', 'plain')
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
  allUnread: function (req, res) {
    req.models.message.find({ read: false }).count(function (err, count) {
      if (err) {
        return res.status(500).json(err);
      }
      return res.status(200).json({ totalCount: count });
    });
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
      var html = null;
      if (message.html !== null) {
        html = message.html;
        _.forEach(message.attachments, function (attachment) {
          html = html.replace("cid:" + attachment.contentId,
            util.format('/messages/%d/attachments/%d?download', message.id, attachment.id));
        });
        if (err) {
          return res.status(404).send('Message not found');
        }
      }
      return res.status(200).send(html);
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
  },
  getHeaders: function (req, res) {
    var id = req.params.id,
      html = req.query.html;
    req.models.message_header.find({ message_id: id}, function (err, headers) {
      if (err) {
        return res.status(404).send('Message not found');
      }
      var data = headers.map(function (header) {
        return header.serialize();
      });

      if (html === undefined) {
        return res.status(200).json(data);
      }
      return res.render('headers', { headers: data });
    });
  },
};
