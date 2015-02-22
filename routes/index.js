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
	    res.render('index',
		       { ideas: ideas,
			 categories: categories });
	}).catch(function(err) {
	    console.log(err);
	    res.send('');
	});
});


// Fake screenshot pages.
router.get('/fake:fakeId', function(req, res, next) {
    var fakeId = parseInt(req.params.fakeId);
    var fakeIdMap = {
	0: 'WelcomeToProject.png',
	1: 'FakeSourceRepository.png',
	2: 'FakeSourceRepository.png'
    };
    var imageName = fakeIdMap[fakeId] || 'FakeSourceRepository.png';

    res.send('<html><body><a href="fake' + (fakeId + 1)
	     + '"><img src="images/' + imageName + '"></a>'
	     + '</body></html>');
});


module.exports = router;
