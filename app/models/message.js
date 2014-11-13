'use strict';

var pretty = require('prettysize');
module.exports = function (orm, db) {
  var Message = db.define('message', {
    subject: {
      type: 'text',
      required: true,
      size: 255
    },
    fromName: {
      type: 'text',
      required: false,
      size: 255
    },
    fromAddress: {
      type: 'text',
      required: true,
      size: 255
    },
    received: {
      type: 'date',
      required: true,
      time: true
    },
    html: {
      type: 'text',
      required: false,
      big: true
    },
    plain: {
      type: 'text',
      required: false,
      big: true
    },
    source: {
      type: 'text',
      required: false,
      big: true
    },
    read: {
      type: 'boolean',
      defaultValue: false
    },
    size: {
      type: 'number',
      required: true
    }
  }, {
    hooks: {
      beforeValidation: function () {
        if (this.received === null) {
          this.received = new Date();
        }
      }
    },
    methods: {
      serialize: function () {
        var attachments, recipients, ccs, headers;

        if (this.attachments) {
          attachments = this.attachments.map(function (c) {
            return c.serialize();
          });
        } else {
          attachments = [];
        }

        if (this.recipients) {
          recipients = this.recipients.map(function (c) {
            return c.serialize();
          });
        } else {
          recipients = [];
        }

        if (this.ccs) {
          ccs = this.ccs.map(function (c) {
            return c.serialize();
          });
        } else {
          ccs = [];
        }

        return {
          id: this.id,
          subject: this.subject,
          fromName: this.fromName,
          fromAddress: this.fromAddress,
          received: this.received,
          read: this.read,
          size: this.size,
          hasHtml: (this.html) ? true : false,
          hasPlain: (this.plain) ? true : false,
          humanSize: pretty(this.size),
          recipients: recipients,
          ccs: ccs,
          attachments: attachments
        };
      }
    }
  });
};
