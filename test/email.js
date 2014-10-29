var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var path = require('path');
var transporter = nodemailer.createTransport(smtpTransport({
  host: 'localhost',
  port: 9025,
  ignoreTLS: true
}));
for (i = 0; i <= 100; i++) {
  transporter.sendMail({
    from: 'Joe Bloggs <bloggs@example.com>',
    to: 'Jamie Hall <jamie.hall@example.com>',
    subject: 'Test email subject',
    text: 'Test email plain text',
    cc: ['joe@example.com'],
    html: '<h1>Jamie</h1>',
    attachments: [
      {
        path: path.resolve(__dirname, 'resources/attachments/1.jpg')
      }
    ]
  }, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Message sent: ' + info.response);
    }
  });
}


