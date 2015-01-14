'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseFS = require('mongoose-fs');
var _ = require('lodash');
var pretty = require('prettysize');

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
  attachments: [
    attachmentSchema
  ],
  size: {
    type: Number
  }
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true }
});

messageSchema.virtual('humanSize').get(function () {
  return pretty(this.size)
});
messageSchema.virtual('hasHtml').get(function () {
  return this.html ? true : false;
});

module.exports = messageSchema;
