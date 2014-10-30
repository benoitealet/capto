'use strict';

var orm = require('orm'), connection = null;
var fts = require("../services/orm-mysql-fts");

function setup(db, cb) {
  require('./message')(orm, db);
  require('./message-recipient')(orm, db);
  require('./message-cc')(orm, db);
  require('./message-attachment')(orm, db);

  return cb(null, db);
}

module.exports = function (settings, cb) {
  if (connection) {
    return cb(null, connection);
  }
  orm.connect(settings.database, function (err, db) {
    if (err) {
      return cb(err);
    }

    connection = db;
    db.use(fts);
    db.settings.set('instance.returnAllErrors', true);
    db.settings.set('instance.cache', false);
    db.settings.set('instance.cacheSaveCheck', true);

    setup(db, cb);
  });
};
