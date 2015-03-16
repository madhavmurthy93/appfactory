var express = require('express');
var router = express.Router();
var sql = require('../util/sql');


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('walkthrough', header='');
});


/* POST home page. */
router.post('/interested', function(req, res, next) {
    var entry = {name: req.body.name,
		 email: req.body.email,
		 comment: req.body.comment};
    sql.SimpleQueryPromise('INSERT INTO contact_us_emails SET ?', entry)
	.then(function() {
	    res.render('walkthrough', header="Thanks!  We'll be in touch.");
	}).catch(next);  // Pass errors to the error handler.
});


module.exports = router;
