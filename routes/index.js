var express = require('express');
var router = express.Router();
var sql = require('../util/sql');


/* GET home page. */
router.get('/', function(req, res, next) {
    var ideas;

    sql.SimpleQueryPromise('SELECT id, name, description, owner_id FROM ideas')
	.then(function(rows) {
	    ideas = rows;

	    return sql.SimpleQueryPromise(
		'SELECT category FROM categories ORDER BY category ASC');
	}).then(function(rows) {
	    var categories = rows.map(function(row) { return row.category; });
	    console.log('Categories:', categories);
	    res.render('index',
		       { ideas: ideas,
			 categories: categories });
	}).catch(function(err) {
	    console.log(err);
	    res.send('');
	});
});

module.exports = router;
