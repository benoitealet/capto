'use strict';

module.exports = function (orm, db) {
  var MessageRecipient = db.define('message_header', {
    name: {
      type: 'text',
      required: false,
      size: 250
    },
    value: {
      type: 'text',
      required: true,
      size: 500
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
  MessageRecipient.hasOne('message', db.models.message, { reverse: 'headers', autoFetch: true });
};
