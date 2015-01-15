'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var attachment = mongoose.Schema({
  checksum: String,
  name: String,
  size: Number,
  content: Buffer,
  contentId: String,
  contentType: String
});

module.exports = attachment;
