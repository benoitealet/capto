'use strict';

var logger = require('winston');
logger.addColors({
  debug: 'green',
  info: 'cyan',
  warn: 'yellow',
  error: 'red'
});

logger.remove(logger.transports.Console);

logger.add(logger.transports.Console, {
  level: 'debug',
  colorize: true
});

module.exports = logger;