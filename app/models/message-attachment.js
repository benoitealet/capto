'use strict';

module.exports = function (orm, db) {
  var MessageAttachment = db.define('message_attachment', {
    name: {
      type: 'text',
      required: true,
      size: 250
    },
    size: {
      type: 'number',
      required: true
    },
    contentType: {
      type: 'text',
      required: true,
      mapsTo: 'content_type',
      size: 250
    },
    checksum: {
      type: 'text',
      required: true,
      size: 32
    },
    contentId: {
      type: 'text',
      required: true,
      size: 255,
      mapsTo: 'content_id'
    },
    content: {
      type: 'binary',
      big: true,
      required: true
    }
  }, {
    methods: {
      serialize: function () {
        return {
          id: this.id,
          name: this.name,
          size: this.size,
          contentType: this.contentType,
          checksum: this.checksum,
          contentId: this.contentId
        };
      }
    }
  });
  MessageAttachment.hasOne('message', db.models.message, { reverse: 'attachments', autoFetch: true });
};