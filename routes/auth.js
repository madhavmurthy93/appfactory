var express = require('express');
var router = express.Router();
var passport = require('passport')
	, FacebookStrategy = require('passport-facebook').Strategy;
var mysql = require('mysql');

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(id, done) {
	// connect to the mysql database
	connection_config = {
	host     : process.env.MYSQL_HOST,
	user     : process.env.MYSQL_USER,
	password : process.env.MYSQL_PW,
	database : process.env.MYSQL_DB
    }

    var connection = mysql.createConnection(connection_config);
    connection.connect();
    connection.query('SELECT * FROM users WHERE id = ?', [id], function(err, rows) {
    	connection.end();
    	if (!err) {
    		done(null, rows[0]);
    	} else {
    		done(err, null);
    	}
    });
});

passport.use(new FacebookStrategy({
	clientID: '857739407615807',
	clientSecret: '188e497c70b716dfed42e5d680a4ec41',
	callbackURL: 'https://uw-app-factory.herokuapp.com/auth/facebook/callback'
	},
	function(accessToken, refreshToken, profile, done) {
		// connect to the mysql database
		connection_config = {
		host     : process.env.MYSQL_HOST,
		user     : process.env.MYSQL_USER,
		password : process.env.MYSQL_PW,
		database : process.env.MYSQL_DB
	    }

	    var connection = mysql.createConnection(connection_config);
	    connection.connect();
	    connection.query('SELECT * FROM users WHERE id = ?', [profile._json.id], function(err, rows) {
	    	if (err) {
	    		console.log(err);
	    	}
	    	if (!err && rows.length != 0) {
	    		connection.end();
	    		done(null, rows[0]);
	    	} else {
	    		var user = {id: profile._json.id, name: profile._json.name, description: ''};
	    		connection.query('INSERT INTO users SET ?', user, function(err) {
	    			connection.end();
	    			if (err) {
	    				console.log(err);
	    			} else {
	    				done(null, user);
	    			}
	    		});
	    	}

	    });
	}
));

router.get('/facebook', passport.authenticate('facebook'));

router.get('/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/about'}), function(req, res) {
	res.redirect('/');
});

module.exports = router;
