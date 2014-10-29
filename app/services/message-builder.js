var _ = require('lodash');
function MessageBuilder(mail, source) {

  return {
    getMessage: function () {
      var message = {};
      if (mail.from[0].name !== '') {
        message.fromName = mail.from[0].name;
      }
      message.fromAddress = mail.from[0].address;
      message.subject = mail.subject;

      if (mail.html !== '') {
        message.html = mail.html;
      }
      if (mail.text !== '') {
        message.plain = mail.text;
      }
      message.source = source;
      message.size = source.length;
      return message;
    },
    getAttachments: function () {
      if (mail.attachments !== undefined) {
        if (mail.attachments.length > 0) {
          return _.map(mail.attachments, function (attachment) {
            return {
              contentType: (attachment.contentType === undefined) ? 'text/plain' : attachment.contentType,
              checksum: attachment.checksum,
              size: attachment.length,
              content: attachment.content,
              name: (attachment.fileName === undefined) ? attachment.generatedFileName : attachment.fileName,
              contentId: attachment.contentId
            };
          });
        }
      }
      return null;
    },
    getRecipients: function () {
      if (mail.to !== undefined) {
        if (mail.to.length > 0) {
          return _.map(mail.to, function (to) {
            if (to.name === '') {
              return {
                address: to.address
              }
            }
            return to;
          });
        }
      }
      return null;
    },
    getCCs: function () {
      if (mail.cc !== undefined) {
        if (mail.cc.length > 0) {
          return _.map(mail.cc, function (cc) {
            if (cc.name === '') {
              return {
                address: cc.address
              }
            }
            return cc;
          });
        }
      }
      return null;
    }
  };
}
module.exports = MessageBuilder;