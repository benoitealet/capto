'use strict';

var logger = require('winston');

logger.addColors({
  debug: 'green',
  info: 'cyan',
  warn: 'yellow',
  error: 'red'
});

logger.remove(logger.transports.Console);

logger.loggers.add('smtp', {
  console: {
    level: 'debug',
    colorize: 'true',
    label: 'smtp'
  }
});

logger.loggers.add('http', {
  console: {
    level: 'debug',
    colorize: 'true',
    label: 'http'
  }
});
// expose our two different loggers
module.exports = {
  smtp: logger.loggers.get('smtp'),
  http: logger.loggers.get('http')
};