var express = require('express');
var router = express.Router();
var mysql      = require('mysql');

var connection = mysql.createConnection({
    host     : process.env.MYSQL_HOST,
    user     : process.env.MYSQL_USER,
    password : process.env.MYSQL_PW,
    database : process.env.MYSQL_DB
});


/* GET home page. */
router.get('/', function(req, res, next) {
    var mysql_connected = false;
    connection.connect();

    connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
	if (err) throw err;

	console.log('The solution is: ', rows[0].solution);
	mysql_connected = rows[0].solution;
    });

    connection.end();

    res.render('index', { title: 'AppFactory',
			  mysql_connected: mysql_connected });
});

module.exports = router;
