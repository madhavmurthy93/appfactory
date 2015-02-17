var express = require('express');
var router = express.Router();
var sql = require('../util/sql');


/* GET home page. */
router.get('/', function(req, res, next) {
    sql.SimpleQueryPromise('SELECT id, name, summary, owner_id FROM ideas')
	.then(function(rows) {
	    console.log('Results:', rows);

	    data = { 
		mysql_connected: 'Yes',
		ideas: rows
	    };
	    console.log('Rendering...');
	    res.render('index', data);
	    console.log('Done.');
	}).catch(function(err) {
	    console.log(err);
	});
});

module.exports = router;
