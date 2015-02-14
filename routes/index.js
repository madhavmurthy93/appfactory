var express = require('express');
var router = express.Router();
var mysql = require('mysql');


/* GET home page. */
router.get('/', function(req, res, next) {
    connection_config = {
    host     : process.env.MYSQL_HOST,
    user     : process.env.MYSQL_USER,
    password : process.env.MYSQL_PW,
    database : process.env.MYSQL_DB
    }
    console.log('Creating connection...');
    var connection = mysql.createConnection(connection_config);
    console.log('Connecting...');
    connection.connect();
    
    console.log('Querying DB...');
    connection.query('SELECT * FROM ideas', function(err, rows, fields) {
	console.log('Results:', err, rows, fields);
	connection.end()
	data = { 
		mysql_connected: false,
		ideas: []}
	if (err) {
	    console.log('MySql error: ', err);
	    data.mysql_connected = 'Nope'
	} else {
	    data.mysql_connected = 'Yes'
	    data.ideas = rows;
	}
	console.log('Rendering...');
	res.render('index', data);
	console.log('Done.');
    });
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
