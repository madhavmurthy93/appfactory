var express = require('express');
var router = express.Router();
var sql = require('../util/sql');


/* TestDB page. */
router.get('/', function(req, res, next) {
    sql.SimpleQueryPromise('SELECT id, name FROM users')
	.then(function(rows) {
	    data = { title: 'AppFactory',
		     mysql_connected: true,
		     users: rows}
	    res.render('testdb', data);
	}, function(err) {
	    // Error handler.  If this isn't provided, the error
	    // will be propagated to the caller, or to later promises
	    // in the chain.
	    data = { title: 'AppFactory',
		     mysql_connected: 'Nope',
		     users: []}
	    console.log('MySql error: ', err);
	    res.render('testdb', data);
	});
});

module.exports = router;
