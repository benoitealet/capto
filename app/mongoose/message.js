'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseFS = require('mongoose-fs');
var _ = require('lodash');
var attachmentSchema = mongoose.Schema({
  checksum: String,
  name: String,
  size: Number,
  contentId: String,
  contentType: String
});

attachmentSchema.plugin(mongooseFS, {keys: ['content'], mongoose: mongoose});

var messageSchema = new Schema({
  subject: {
    type: String
  },
  from: {
    name: String,
    address: String
  },
  recipients: [
    {
      name: String,
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
    defaultValue: new Date
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
  attachments: [
    attachmentSchema
  ],
  size: {
    type: Number
  }
});


module.exports = messageSchema;
