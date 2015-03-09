var express = require('express');
var router = express.Router();
var sql = require('../util/sql');

router.get('/', function(req, res, next) {
	res.render('inviteMockup');
});

router.get('/inviteSent', function(req, res, next) {
	res.render('inviteSent');
});

module.exports = router;