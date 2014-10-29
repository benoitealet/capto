'use strict';

module.exports = function (orm, db) {
  var MessageRecipient = db.define('message_recipient', {
    name: {
      type: 'text',
      required: false,
      size: 250
    },
    address: {
      type: 'text',
      required: true,
      size: 250
    }
  }, {
    methods: {
      serialize: function () {
        return {
          name: this.name,
          address: this.address
        };
      }
    }
  });
  MessageRecipient.hasOne('message', db.models.message, { reverse: 'recipients', autoFetch: true });
};
