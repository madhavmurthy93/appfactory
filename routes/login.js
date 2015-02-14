var express = require('express');
var router = express.Router();
var passport = require('passport')
	, FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
	clientID: '857739407615807',
	clientSecret: '188e497c70b716dfed42e5d680a4ec41',
	callbackURL: 'http://127.0.0.1:3000/auth/facebook/callback'
	},
	function(accessToken, refreshToken, profile, done) {
		console.log(profile);
		if (err) {
			return done(err);
		}
		done(null, user);
	}
));

router.get('/facebook', passport.authenticate('facebook'));

router.get('/facebook/callback', passport.authenticate('facebook', {successRedirect:'/', failureRedirect: '/login'}));

module.exports = router;
