var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var path = require('path');
var Chance = require('chance');
var chance = new Chance();
var fs = require('fs');
var _ = require('lodash');
var transporter = nodemailer.createTransport(smtpTransport({
  host: 'localhost',
  port: 9025,
  ignoreTLS: true
}));
/**
 * Generate some random emails
 */
var randomSubjects = ['Order confirmation', 'Please activate your account', 'Your account has been activated!', 'Forgot password', 'Payment received', 'Hey! Don\'t miss out on these deals', 'Introducing our new design', 'New messages from Joe Bloggs'];
for (i = 0; i <= 1; i++) {
  transporter.sendMail({
    from: chance.name({ middle: true }) + '<' + chance.email({domain: "example.com"}) + '>',
    to: chance.name({ middle: true }) + '<' + chance.email({domain: "example.com"}) + '>',
    subject: randomSubjects[Math.floor(Math.random()*randomSubjects.length)],
    bcc: [chance.email({domain: "example.com"})],
    text: chance.paragraph({sentences: 1}),
    cc: _.map([1,3,3,4], function() {
        return chance.name({ middle: true }) + '<' + chance.email({domain: "example.com"}) + '>';
    }),
    html: fs.readFileSync(path.resolve(__dirname, 'resources/templates/go-confirm.html')),
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


