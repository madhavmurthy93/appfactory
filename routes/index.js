var express = require('express');
var router = express.Router();
var mysql = require('mysql');


/* GET home page. */
router.get('/', function(req, res, next) {
	console.log(req.user);
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

module.exports = router;
