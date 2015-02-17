var express = require('express');
var router = express.Router();
var passport = require('passport')
	, FacebookStrategy = require('passport-facebook').Strategy;
var sql = require('../util/sql');

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
    sql.SimpleQueryPromise('SELECT * FROM users WHERE id = ?', [user.id])
	.then(function(rows) {
	    done(null, rows[0]);
	}, function(err) {
	    done(err, null);
	});
});


passport.use(new FacebookStrategy({
	clientID: process.env.FB_CLIENTID,
	clientSecret: process.env.FB_CLIENT_SECRET,
	callbackURL: process.env.FB_CALLBACK_URL
	},
	function(accessToken, refreshToken, profile, done) {
	    sql.SimpleQueryPromise('SELECT * FROM users WHERE id = ?',
				   [profile._json.id])
		.then(function(rows) {
	    	    if (rows.length != 0) {
	    		connection.end();
	    		done(null, rows[0]);
	    	    } else {
	    		var user = {id: profile._json.id,
				    name: profile._json.name, description: ''};
			sql.SimpleQueryPromise('INSERT INTO users SET ?', user)
			    .then(function() {
				done(null, user);
			    }, function(err) {
				console.log(err);
			    });
		    }
		});
	}
));

router.get('/facebook', passport.authenticate('facebook'));

router.get('/facebook/callback',
	   passport.authenticate('facebook',
				 {successRedirect: '/',
				  failureRedirect: '/about'}));

module.exports = router;
