var express = require('express');
var router = express.Router();
var sql = require('../util/sql');


// Profile page
router.get('/', function(req, res, next) {
    if (!res.locals.user) {
	throw new Error('You must be logged in to access your profile.');
    }
    res.render('profile');
});

router.get('/demo', function(req, res, next) {
	res.render('profiledemo');
});

// Set whether the user is a developer or not.
router.post('/setDeveloper', function(req, res, next) {
    if (!res.locals.user) {
	throw new Error('You must be logged in to modify your profile.');
    }

    var userId = res.locals.user.id;

    sql.SimpleQueryPromise('UPDATE users SET is_developer=? WHERE id=?',
			   [req.body.isDeveloper, userId])
	.then(function() {
	    // Also update the cached user object, in the session.
	    res.locals.user.is_developer = parseInt(req.body.isDeveloper);
	    res.send('');
	}).catch(next);  // Pass errors to the error handler.
});

module.exports = router;
