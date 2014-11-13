#!/usr/bin/env node

var pkg = require('../package.json'),
  version = pkg.version,
  program = require('commander'),
  path = require('path'),
  settings = require(path.resolve(__dirname, '../app/config/settings')),
  Server = require(path.resolve(__dirname, '../server.js')),
  async = require('async'),
  versionCompare = require(path.resolve(__dirname, '../app/services/version-compare')),
  util = require('util');

program.version(version, '--version');
program.command('run')
  .option('--smtp-ip [address]', 'Set the ip address for the http server', settings.smtp.ip)
  .option('--http-ip [address]', 'Set the ip address for the smtp server', settings.http.ip)
  .option('--smtp-port [port]', 'Set the port of the smtp server', settings.smtp.port)
  .option('--http-port [port]', 'Set the port of the http server', settings.http.port)
  .option('--max-message-size [size]', 'Set the max message size the smtp server will accept in bytes', settings.smtp.maxMessageSize)
  .action(function (cmd) {
    var smtpPort = cmd.smtpPort,
      httpPort = cmd.httpPort,
      httpIp = cmd.httpIp,
      smtpIp = cmd.smtpIp,
      maxMessageSize = cmd.maxMessageSize;
    if (smtpPort === httpPort) {
      console.error('SMTP and HTTP ports cannot be the same');
      return;
    }
    /**
     * Instantiate new server instance
     */
    new Server(httpPort, httpIp, smtpPort, smtpIp, maxMessageSize);
  });
program.command('db:setup')
  .action(function (cmd) {
    var models = require('../app/models/');
    models(settings, function (err, db) {
      if (err) {
        return console.error('Error creating database', err);
      }
      async.series([
        function (callback) {
          db.drop(function (err) {
            return callback(err);
          });
        }, function (callback) {
          db.sync(function (err) {
            return callback(err);
          });
        }, function (callback) {
          db.driver.execQuery('SELECT @@innodb_version as version;', function (err, data) {
            if (err) {
              return callback(err);
            }
            var version = data[0].version;
            if (versionCompare(version, '5.6') < 0) {
              console.log(util.format('Your MySQL version %s is lower than 5.6. Falling back to MyISAM for full text searching', version));
              db.driver.execQuery('ALTER TABLE message ENGINE = MYISAM;', function (err) {
                return callback(err);
              });
            } else {
              return callback();
            }
          });
        }, function (callback) {
          db.driver.execQuery('ALTER TABLE message ADD FULLTEXT(source);', function (err) {
            return callback(err);
          });
        }, function (callback) {
          /**
           * Convert message table to UTF8
           */
          db.driver.execQuery('ALTER TABLE message CONVERT TO CHARACTER SET utf8 COLLATE utf8_unicode_ci;', function (err) {
            return callback(err);
          });
        }
      ], function (err) {
        if (err) {
          console.error('Error creating message', err);
        } else {
          console.log('Created database successfully');
        }
        db.close();
      });
    });
  });
program.parse(process.argv);



