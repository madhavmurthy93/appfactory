var express = require('express');
var router = express.Router();
var sql = require('../util/sql');


/* GET home page. */
router.get('/', function(req, res, next) {
    var ideas;
    var filter = req.query.filter;
    var sortBy = req.query.sortBy || 'latest';
    
    // Get the list of ideas and names of owners.  The query and parameters
    // need to change based on whether we're filtering the results by category
    // or not.
    var queryFilter = ''
    var queryParams = []
    if (filter) {
	queryFilter = 'AND idea.category=? ';
	queryParams = [filter];
    }
    var query =
	'SELECT idea.id as id, idea.name as name, ' 
    	+ 'idea.description as description, idea.category as category, '
    	+ 'idea.owner_id as owner_id, user.name as ownername, idea.created_at as created_at '
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

	return sql.SimpleQueryPromise(
		'SELECT idea, COUNT(user) AS devs '
		+ 'FROM developer_votes '
		+ 'WHERE available_time_per_week > 0 '
		+ 'GROUP BY idea '
		+ 'ORDER BY idea DESC');
	}).then(function(rows) {
		var devsIter = 0;
		var ideaIter = 0;
		while (ideaIter < ideas.length && devsIter < rows.length) {
			if (ideas[ideaIter].id > rows[devsIter].idea) {
				ideas[ideaIter].devs = 0;
				ideaIter += 1;
				continue;
			}
			ideas[ideaIter].devs = rows[devsIter].devs;
			ideaIter += 1;
			devsIter += 1;
		}
		while(ideaIter < ideas.length) {
			ideas[ideaIter].devs = 0;
			ideaIter += 1;
		}

	    //console.log('Ideas before sorting:',
	    //	    ideas.map(function(entry) {
	    //		return { id: entry.id, dollarVotes: entry.dollarVotes,
	    //			 created_at: entry.created_at} }));

	    // Sort the idea list.
	    if (sortBy == 'popular')
	    {
		ideas.sort(function(a, b) {
		    return b.dollarVotes - a.dollarVotes;
		});
	    }
	    else if (sortBy == 'latest')
	    {
		ideas.sort(function(a, b) {
		    if (a.created_at < b.created_at)
			return 1;
		    if (a.created_at > b.created_at)
			return -1;
		    return 0;
		});
	    }

	    //console.log('Ideas after sorting:',
	    //	    ideas.map(function(entry) {
	    //		return { id: entry.id, dollarVotes: entry.dollarVotes,
	    //			 created_at: entry.created_at} }));

	// Grab the list of all categories.  Also count how many ideas there
	// are in each category.  The left outer join here ensures that we
	// list all categories even if there are no items in the category.
	// Categories with no items will have NULL as their count.
	return sql.SimpleQueryPromise(
	    'SELECT categories.category, count AS count '
		+ 'FROM categories LEFT OUTER JOIN ('
		+ '        SELECT category, COUNT(*) AS count '
		+ '          FROM ideas '
		+ '          GROUP BY category) AS counts '
		+ '  ON counts.category=categories.category '
		+ 'GROUP BY categories.category '
		+ 'ORDER BY category ASC');
    }).then(function(rows) {
	res.render('index',
		   { ideas: ideas,
		     categories: rows,
		     filter: filter,
		     sortBy: sortBy});
    }).catch(next);  // Pass errors to next, so they go to the error handler.
});


// Fake screenshot pages.
router.get('/fake:fakeId', function(req, res, next) {
    var fakeId = parseInt(req.params.fakeId);
    var fakeIdMap = {
	0: 'WelcomeToProject.png',
	1: 'roadmap_mock.jpg',
	2: 'FakeSourceRepository.png',
	3: 'AppTogetherSlide.jpg'
    };
    var imageName = fakeIdMap[fakeId] || 'AppTogetherSlide.jpg'

    res.send('<html><body><a href="fake' + (fakeId + 1)
	     + '"><img src="images/' + imageName + '"></a>'
	     + '</body></html>');
});


module.exports = router;
