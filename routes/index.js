var express = require('express');
var router = express.Router();

/* GET home page. */
var home = function(req, res, next) {
  res.render('index', { title: 'YouTube Playlist Manager' });
}
router.get('/', home);

module.exports = router;
