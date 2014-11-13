var express = require('express'),
  router = express.Router(),
  controllers = require('../controllers');

router.get('/', function (req, res) {
  res.render('index');
});

router.get('/messages', controllers.messages.all);
router.get('/messages/unread', controllers.messages.allUnread);
router.post('/messages', controllers.messages.create);
router.get('/messages/:id', controllers.messages.get);
router.delete('/messages/:id', controllers.messages.delete);
router.get('/messages/:id/source', controllers.messages.getSource);
router.get('/messages/:id/plain', controllers.messages.getPlain);
router.get('/messages/:id/html', controllers.messages.getHtml);

router.get('/messages/:id/headers', controllers.messages.getHeaders);
router.put('/messages/:id', controllers.messages.update);
router.delete('/messages', controllers.messages.deleteAll);
router.get('/messages/:id/source.eml', controllers.messages.downloadSource);
router.get('/messages/:id/attachments/:attachmentId', controllers.messages.getAttachment);

module.exports = router;