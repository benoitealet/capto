#!/usr/bin/env node

var pkg = require('../package.json'),
    version = pkg.version,
    program = require('commander');

program
  .version('0.0.1', '--version')
  .usage('[options]')
  .option('--ip [address]', 'Set the ip address for both servers', '127.0.0.1')
  .option('--smtp-port [port]', 'Set the port of the smtp server', 9025)
  .option('--http-port [port]', 'Set the port of the http server', 9024)
  .option('--max-message-size [size]', 'Set the max message size the smtp server will accept in bytes', 20000000)
  .parse(process.argv);

