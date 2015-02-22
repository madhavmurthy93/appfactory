var express = require('express');
var router = express.Router();
var sql = require('../util/sql');


/* GET home page. */
router.get('/', function(req, res, next) {
    var ideas;

    sql.SimpleQueryPromise(
    		  'SELECT idea.id as id, idea.name as name, ' 
    		+   'idea.description as description, idea.category as category, '
    		+   'idea.owner_id as owner_id, user.name as ownername '
    		+ 'FROM ideas idea, users user '
    		+ 'WHERE idea.owner_id = user.id')
	.then(function(rows) {
	    ideas = rows;

	    return sql.SimpleQueryPromise(
		'SELECT category FROM categories ORDER BY category ASC');
	}).then(function(rows) {
	    var categories = rows.map(function(row) { return row.category; });
	    res.render('index',
		       { ideas: ideas,
			 categories: categories });
	}).catch(function(err) {
	    console.log(err);
	    res.send('');
	});
});

module.exports = router;
