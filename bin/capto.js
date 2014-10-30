#!/usr/bin/env node

var pkg = require('../package.json'),
  version = pkg.version,
  program = require('commander');
path = require('path'),
  settings = require(path.resolve(__dirname, '../app/config/settings')),
  Server = require(path.resolve(__dirname, '../server.js'));
program
  .version('0.0.1', '--version')
  .usage('[options]')
  .option('--smtp-ip [address]', 'Set the ip address for the http server', settings.smtp.ip)
  .option('--http-ip [address]', 'Set the ip address for the smtp server', settings.http.ip)
  .option('--smtp-port [port]', 'Set the port of the smtp server', settings.smtp.port)
  .option('--http-port [port]', 'Set the port of the http server', settings.http.port)
  .option('--max-message-size [size]', 'Set the max message size the smtp server will accept in bytes', settings.smtp.maxMessageSize)
  .parse(process.argv);


var smtpPort = program.smtpPort,
  httpPort = program.httpPort,
  httpIp = program.httpIp,
  smtpIp = program.smtpIp,
  maxMessageSize = program.maxMessageSize;

if (smtpPort === httpPort) {
  console.error('SMTP and HTTP ports cannot be the same');
  return;
}
/**
 * Instantiate new server instance
 */
new Server(httpPort, httpIp, smtpPort, smtpIp, maxMessageSize);
