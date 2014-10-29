'use strict';

module.exports = function (orm, db) {
  var MessageCC = db.define('message_cc', {
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
  MessageCC.hasOne('message', db.models.message, { reverse: 'ccs', autoFetch: true });
};
