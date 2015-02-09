var express = require('express');
var router = express.Router();
var mysql      = require('mysql');


/* GET home page. */
router.get('/', function(req, res, next) {
    var connection = mysql.createConnection({
	host     : process.env.MYSQL_HOST,
	user     : process.env.MYSQL_USER,
	password : process.env.MYSQL_PW,
	database : process.env.MYSQL_DB
    });
    connection.connect();

    connection.query('SELECT id, name FROM users', function(err, rows, fields) {
	connection.end()
	data = { title: 'AppFactory',
		 mysql_connected: false,
		 users: []}
	if (err) {
	    console.log('MySql error: ', err);
	    data.mysql_connected = 'Nope'
	} else {
	    data.users = rows;
	}
	res.render('index', data);
    });
});

module.exports = router;
