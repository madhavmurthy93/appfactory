var express = require('express');
var router = express.Router();
var sql = require('../util/sql');


/* GET home page. */
router.get('/', function(req, res, next) {
    var ideas;
    var filter = req.query.filter;
    var sortBy = req.query.sortyBy || 'latest';

    // Get the list of ideas and names of owners.  The query and parameters
    // need to change based on whether we're filtering the results by category
    // or not.
    var queryFilter = ''
    var queryParams = []
    console.log('Filter is:', filter);
    if (filter) {
	queryFilter = 'AND idea.category=? ';
	queryParams = [filter];
    }
    var query =
	'SELECT idea.id as id, idea.name as name, ' 
    	+ 'idea.description as description, idea.category as category, '
    	+ 'idea.owner_id as owner_id, user.name as ownername '
    	+ 'FROM ideas idea, users user '
    	+ 'WHERE idea.owner_id = user.id '
        + queryFilter
    	+ 'ORDER BY id DESC'
    sql.SimpleQueryPromise(query, queryParams).then(function(rows) {
	ideas = rows;

	// Count the number of positive votes, grouped by idea.
    	return sql.SimpleQueryPromise(
    			  'SELECT idea, SUM(amount) AS total ' 
    			+ 'FROM user_votes ' 
    			+ 'WHERE amount >= 1 '
    			+ 'GROUP BY idea '
    			+ 'ORDER BY idea DESC');
    }).then(function(votedIdeas) {
	var votedIdeaIter = 0;
	var ideaIter = 0;

	// Merge the list of votes with the list of ideas.
	while (ideaIter < ideas.length && votedIdeaIter < votedIdeas.length) {
	    if (ideas[ideaIter].id > votedIdeas[votedIdeaIter].idea) {
		ideas[ideaIter].dollarVotes = 0;
		++ideaIter;
		continue;
	    }
	    
	    ideas[ideaIter].dollarVotes = votedIdeas[votedIdeaIter].total;
	    ++ideaIter;
	    ++votedIdeaIter;
	}
	
	while (ideaIter < ideas.length) {
	    ideas[ideaIter].dollarVotes = 0;
	    ++ideaIter;
	}		

	// Grab the list of all categories.
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
