'use strict';
var mongoose = require('mongoose');
var textSearch = require('mongoose-text-search');
var Schema = mongoose.Schema;
var _ = require('lodash');
var pretty = require('prettysize');

var attachmentSchema = mongoose.Schema({
  checksum: String,
  name: String,
  size: Number,
  content: Buffer,
  contentId: String,
  contentType: String
});


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

messageSchema.plugin(textSearch);


module.exports = messageSchema;
