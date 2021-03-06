var express = require('express');
var router = express.Router();
var sql = require('../util/sql');

router.get('/', function(req, res, next) {
	res.render('about');
});

router.post('/', function(req, res, next) {
    var entry = {name: req.body.name,
		 email: req.body.email,
		 comment: req.body.comment};
    sql.SimpleQueryPromise('INSERT INTO contact_us_emails SET ?', entry)
	.then(function() {
    	    res.redirect('/demo/about');
	}).catch(next);  // Pass errors to the error handler.
});

module.exports = router;