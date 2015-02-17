var express = require('express');
var router = express.Router();
var sql = require('../util/sql');


// Profile page
router.get('/', function(req, res, next) {
    if (!res.locals.user) {
	throw new Error('You must be logged in to access your profile.');
    }
    var userId = res.locals.user.id;

    sql.SimpleQueryPromise('SELECT id, name, description, is_Developer '
			   + 'FROM users WHERE id=?', [userId])
	.then(function(rows) {
	    if (rows.length != 1) {
		throw new Error("Couldn't find user data.");
	    }

	    user = rows[0];
	    res.render('profile', {user: user});
	    data = { title: 'AppFactory',
		     mysql_connected: true,
		     users: rows}
	}).catch(function(err) {
	    console.log('Profile error: ', err);
	    res.status(500);
	    res.render('error', {
		message: err.message,
		error: {}
	    });
	});
});

module.exports = router;
