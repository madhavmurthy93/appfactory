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
    specialties = [];
    // Grab filters from the query string.  If there aren't any, make sure
    // filters has length 0.
    filters = (req.query.filters || '').split(',');
    if (filters.indexOf('') != -1) {
	filters.splice(filters.indexOf(''));
    }

    sql.SimpleQueryPromise('SELECT id, name, description, '
			   + '  profile_pic_url, avg_rating '
			   + 'FROM users WHERE is_developer=true '
			   + 'ORDER BY avg_rating DESC')
	.then(function(rows) {
	    devs = rows;
	    return sql.SimpleQueryPromise(
		'SELECT id, specialty, experience FROM developer_specialties '
		    + 'ORDER BY experience DESC');
	}).then(function(rows) {
	    // Merge specialities...
	    rows.forEach(function(specialty) {
		// And track a list of the names of all specialties, if it
		// isn't already there.
		if (specialties.filter(function(entry) {
		    return entry.name == specialty.specialty;
		}).length == 0) {
		    checked = false;
		    if (filters.indexOf(specialty.specialty) != -1) {
			checked = true;
		    }
		    specialties.push({name: specialty.specialty,
				      checked: checked});
		}

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
	    specialties.sort();

	    // Remove developers who have no skill in the filtered specialties.
	    if (filters.length > 0) {
		devs = devs.filter(function(entry) {
		    if (!entry.specialties) return false;

		    var keep = true;
		    for (i=0; i < filters.length; ++i) {
			var found = false;
			for (j=0; j < entry.specialties.length; ++j) {
			    if (entry.specialties[j].specialty === filters[i]) {
				found = true;
				break;
			    }
			}
			if (!found) {
			    keep = false;
			    break;
			}
		    }
		    return keep;
		});
	    }
		
	    res.render('profilebrowse', {devs: devs, specialties: specialties});
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
