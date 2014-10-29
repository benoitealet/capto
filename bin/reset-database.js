var models = require('../app/models/'),
    settings = require('../app/config/settings');

models(settings, function (err, db) {
  if (err) throw err;

  db.drop(function (err) {
    if (err) throw err;

    db.sync(function (err) {
      if (err) throw err;
      db.close();
      console.log('done!');
    });
  });
});