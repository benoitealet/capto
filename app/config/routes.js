var express = require('express'),
    router = express.Router(),
    controllers = require('../controllers');

router.get('/', function (req, res) {
  res.render('index');
});

router.get('/messages', controllers.messages.all);
router.get('/messages/unread', controllers.messages.allUnread);
router.post('/messages', controllers.messages.create);
router.get('/messages/:id([0-9a-f]{24})', controllers.messages.get);
router.delete('/messages/:id([0-9a-f]{24})', controllers.messages.delete);
router.get('/messages/:id([0-9a-f]{24})/source', controllers.messages.getSource);
router.get('/messages/:id([0-9a-f]{24})/plain', controllers.messages.getPlain);
router.get('/messages/:id([0-9a-f]{24})/html', controllers.messages.getHtml);

router.get('/origines', controllers.messages.findOrigins);

router.get('/messages/:id([0-9a-f]{24})/headers', controllers.messages.getHeaders);
router.delete('/messages', controllers.messages.deleteAll);
router.get('/messages/:id([0-9a-f]{24})/source.eml', controllers.messages.downloadSource);
router.get('/messages/:id([0-9a-f]{24})/attachments/:attachmentId([0-9a-f]{24})', controllers.messages.getAttachment);

router.post('/message', controllers.messages.update);

module.exports = router;