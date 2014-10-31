'use strict';

module.exports = function (orm, db) {
  var MessageHeader = db.define('message_header', {
    name: {
      type: 'text',
      required: true,
      big: true
    },
    value: {
      type: 'text',
      required: true,
      big: true
    }
  }, {
    methods: {
      serialize: function () {
        return {
          name: this.name,
          value: this.value
        };
      }
    }
  });
  MessageHeader.hasOne('message', db.models.message, { reverse: 'headers', autoFetch: true });
};
