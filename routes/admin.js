var express = require('express');
var router = express.Router();
var sql = require('../util/sql');


// Main admin page
router.get('/', function(req, res, next) {
    // Check if the user is an admin.  If not, pretend this page doesn't exist.
    if (!res.locals.user) {
	console.log('Non-logged-in user going to Admin page.');
	return next();
    }
    sql.SimpleQueryPromise('SELECT is_administrator FROM users WHERE id=?',
			   [res.locals.user.id])
	.then(function(rows) {
	    console.log('Checking admin status for user:', res.locals.user.id);
	    if (rows.length != 1 || !rows[0].is_administrator) {
		console.log('User is not an admin:', res.locals.user.id);
		return next();
	    }

	    return sql.SimpleQueryPromise('SELECT * from contact_us_emails');
	}).then(function(rows) {
	    res.render('admin', { contactUsEmails: rows });
	}).catch(function(err) {
	    console.log('Error loading admin page:', err);
	    return next();
	});
});


module.exports = router;
