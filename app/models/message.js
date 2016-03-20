'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('lodash');

var message = new Schema({
  subject: {
    type: String
  },
  from: {
    name: String,
    address: String
  },
  recipients: [
    {
      name: {
        type: String
      },
      address: String
    }
  ],
  headers: [
    {
      name: String,
      value: String
    }
  ],
  ccs: [
    {
      name: String,
      address: String
    }
  ],
  received: {
    type: Date,
    index: true,
    default: Date.now
  },
  html: {
    type: String
  },
  plain: {
    type: String
  },
  source: {
    type: String
  },
  read: {
    type: Boolean,
    default: false
  },
  deliveryDate: {
    type: Date,
    
  },
  attachments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'attachment'
    }

  ],
  size: {
    type: Number
  }
}, {
  toObject: {virtuals: true},
  toJSON: {virtuals: true}
});

message.index({source: 'text'});

message.methods.addAttachment = function (attachment, cb) {
  var _this = this;
  this.model('attachment').create(attachment, function (err, attachment) {
    if (err) {
      return cb('Error creating attachment');
    }
    _this.attachments.push(attachment);
    _this.save(cb);
  });
};

message.pre('remove', function (next) {
  this.model('attachment').remove({_id: {$in: this.attachments}}, function (err) {
    if (err) {
      return next(err);
    }
    return next();
  })
});

module.exports = message;
