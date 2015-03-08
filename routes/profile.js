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


// Browse developers page.
router.get('/browse', function(req, res, next) {
    devs = [];
    sql.SimpleQueryPromise('SELECT id, name, description, '
			   + '  profile_pic_url, avg_rating '
			   + 'FROM users WHERE is_developer=true')
	.then(function(rows) {
	    devs = rows;
	    return sql.SimpleQueryPromise(
		'SELECT id, specialty, experience FROM developer_specialties '
		    + 'ORDER BY experience DESC');
	}).then(function(rows) {
	    // Merge specialities...
	    rows.forEach(function(specialty) {
		// Find the user...
		devs.forEach(function(devEntry) {
		    if (specialty.id == devEntry.id) {
			if (!devEntry.specialties) {
			    devEntry.specialties = [];
			}
			devEntry.specialties.push(specialty);
		    }
		});
	    });
		
	    res.render('profilebrowse', {devs: devs});
	}).catch(next);
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
