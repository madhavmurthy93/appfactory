var express = require('express');
var router = express.Router();
var sql = require('../util/sql');


/* GET home page. */
router.get('/', function(req, res, next) {
    sql.SimpleQueryPromise('SELECT id, name, description, owner_id FROM ideas')
	.then(function(rows) {
	    data = { 
		mysql_connected: 'Yes',
		ideas: rows
	    };
	    res.render('index', data);
	}).catch(function(err) {
	    console.log(err);
	});
});

module.exports = router;
