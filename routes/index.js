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
    		+ 'WHERE idea.owner_id = user.id '
    		+ 'ORDER BY id')
	.then(function(rows) {
	    ideas = rows;
	    
    	return sql.SimpleQueryPromise(
    			  'SELECT idea idea, SUM(amount) AS total ' 
    			+ 'FROM user_votes ' 
    			+ 'WHERE amount >= 1 '
    			+ 'GROUP BY idea '
    			+ 'ORDER BY idea');
	}).then(function(votedIdeas) {
		var votedIdeaIter = 0;
		var ideaIter = 0;
		while (ideaIter < ideas.length && votedIdeaIter < votedIdeas.length) {			
			if (ideas[ideaIter].id < votedIdeas[votedIdeaIter].idea) {
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
