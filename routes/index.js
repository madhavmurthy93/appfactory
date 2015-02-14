var express = require('express');
var router = express.Router();
var mysql = require('mysql');


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {title: 'AppFactory'});
});

router.get('/about', function(req, res, next) {
	res.render('about');
});

router.post('/about', function(req, res, next) {
	// connect to the mysql database
	connection_config = {
	host     : process.env.MYSQL_HOST,
	user     : process.env.MYSQL_USER,
	password : process.env.MYSQL_PW,
	database : process.env.MYSQL_DB
    }

    /* insert user comment into the mysql database and redirect
   	 * to the home page.
   	 */
    var connection = mysql.createConnection(connection_config);
    connection.connect();
    var entry = {name: req.body.name, email: req.body.email, comment: req.body.comment};
    connection.query('INSERT INTO contact_us_emails SET ?', entry, function(err, result) {
    	connection.end();
    	if (err) {
    		console.log(err);
    	}
    	res.redirect('/about');
    });
});

module.exports = router;
