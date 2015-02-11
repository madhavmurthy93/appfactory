var express = require('express');
var router = express.Router();
var mysql = require('mysql');


/* TestDB page. */
router.get('/', function(req, res, next) {
    console.log('Creating connection...');
    var connection = mysql.createConnection({
	host     : process.env.MYSQL_HOST,
	user     : process.env.MYSQL_USER,
	password : process.env.MYSQL_PW,
	database : process.env.MYSQL_DB
    });
    console.log('Connecting...');
    connection.connect();

    console.log('Querying DB...');
    connection.query('SELECT id, name FROM users', function(err, rows, fields) {
	console.log('Results:', err, rows, fields);
	connection.end()
	data = { title: 'AppFactory',
		 mysql_connected: false,
		 users: []}
	if (err) {
	    console.log('MySql error: ', err);
	    data.mysql_connected = 'Nope'
	} else {
	    data.mysql_connected = true
	    data.users = rows;
	}
	console.log('Rendering...');
	res.render('testdb', data);
	console.log('Done.');
    });
});

module.exports = router;
