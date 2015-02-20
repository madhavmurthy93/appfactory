var express = require('express');
var fs = require('fs');
var gm = require('gm');
var multer = require('multer');
var sql = require('../util/sql');
var router = express.Router();
var Promise = require('promise');


var THUMBNAIL_SIZE = {
    width: 350,
    height: 300
};

var SCREENSHOT_SIZE = {
    width: 1024,
    height: 768
};


// Create an idea page. This is where users enter info for a new idea.
router.get('/', function(req, res) {
    res.render('idea');
});


// Find an unused ID from the given table and return it.  This returns
// a promise that will provide the next available ID.
var GetNextAvailableId = function(table) {
    return sql.SimpleQueryPromise(
	'SELECT id FROM ' + table + ' ORDER BY id DESC LIMIT 1')
	.then(function(rows) {
	    return new Promise(function(resolve, reject) {
		var nextId = 0;
		if (rows.length > 0) {
		    nextId = rows[0].id + 1;
		}
		resolve(nextId);
	    })
	});
}

var GetImage = function(req, propertyName, size) {
    return new Promise(function(resolve, reject) {
	var image = '';
	if (req.files && req.files[propertyName] &&
	    req.files[propertyName].buffer) {
	    var buffer = req.files[propertyName].buffer;

	    // Resize the image to thumbnail size.
	    console.log('Processing image...');
	    gm(buffer, 'tmpImage.jpg')
		.resize(size.width, size.height)
		.toBuffer('JPG', function(err, buf) {
		    if (err) {
			console.log('Rejecting image:', err);
			reject(err);
		    } else {
			resolve(buf);
		    }
		});
	} else {
	    resolve(image);
	}
    });
};


var InsertIntoDb = function(req, ideaId, image, ownerId) {
    data = {id: ideaId,
	    name: req.body.name.trim(),
	    summary: req.body.summary.trim(),
	    thumbnail: image,
	    description: req.body.description.trim(),
	    owner_id: ownerId}
    return sql.SimpleQueryPromise('INSERT INTO ideas SET ?', data);
};


var HasNonWhitespaceContent = function(stringValue) {
    // Allow undefined values and change them to ''.
    // Trim any outer whitespace.
    var trimmed = (stringValue || '').trim();
    return trimmed.length > 0;
}


// Validates the input when creating an idea.  Verify that all
// required fields are filled in and the information looks good.
var ValidateIdeaInput = function(req) {
    // Make sure the user supplied a name.
    if (!HasNonWhitespaceContent(req.body.name)) {
	throw new Error('Name not provided.');
    }

    // TODO: Check if the name already exists.

    // Make sure the user supplied a summary.
    if (!HasNonWhitespaceContent(req.body.summary)) {
	throw new Error('Brief description not provided.');
    }

    // Make sure the user supplied a description.
    if (!HasNonWhitespaceContent(req.body.description)) {
	throw new Error('Full description not provided.');
    }
};


// Supply data to the server for a new idea.  This will create an
// entry for the idea and redirect to the idea page.
router.post('/',
	    multer({dest: './idea_images/',
		    limits:{fileSize: 10 * 1024*1024,
			    files: 1},
		    inMemory: true}),
	    function(req, res, next) {
		var ownerId;
		var ideaId;
		var image;
		
		if (res.locals.user) {
		    ownerId = res.locals.user.id;
		} else {
		    throw new Error('Must be logged in to add an idea.');
		}

		ValidateIdeaInput(req);
		GetNextAvailableId('ideas')
		    .then(function(ideaIdIn) {
			ideaId = ideaIdIn;
			console.log('Set ideaId to', ideaId);
			return GetImage(req, 'displayImage', THUMBNAIL_SIZE);
		    }).then(function(imageIn) {
			image = imageIn;
			return InsertIntoDb(req, ideaId, image, ownerId);
		    }).then(function() {
			res.redirect('/idea/' + ideaId);
		    }).catch(function(err) {
			console.log('Create idea error:', err);
		    });
	    });


// Return thumbnail images.
router.get('/thumbs/:ideaId', function(req, res) {
    var ideaId = req.params.ideaId;
    sql.SimpleQueryPromise('SELECT thumbnail FROM ideas WHERE id=?', [ideaId])
	.then(function(rows) {
	    if (rows.length == 1 && rows[0].thumbnail.length > 0) {
		res.writeHead(200, {'Content-Type': 'image/jpg'});
		res.end(rows[0].thumbnail, 'binary');
	    } else {
		console.log('No thumbnail for', ideaId);
		var readStream = fs.createReadStream(
		    './public/images/no_image.gif');
		readStream.pipe(res);
	    }
	});
});


// The idea detail page.
router.get('/:ideaId', function(req, res) {
    var ideaId = req.params.ideaId;
    var idea;
    var comments;
    var screenshotIds;
    var isDeveloper = false;
    var userId=-1;
    var vote = undefined;
    if (res.locals.user) {
	userId = res.locals.user.id;
    }

    sql.SimpleQueryPromise('SELECT id, name, summary, description, owner_id '
			   + 'FROM ideas WHERE id=?', [ideaId])
	.then(function(rows) {
	    if (rows.length == 0) {
		var err = new Error('Idea ' + ideaId + ' not found');
		err.status = 404;
		throw err;
	    }
	    if (rows.length > 1) {
		console.log('Idea ' + ideaId + ' has too many entries:',
			    rows.length);
	    }
	    idea = rows[0];

	    // Check for comments associated with this idea.
	    return sql.SimpleQueryPromise('SELECT comment.votes, user.name as username, comment.contents, DATE_FORMAT(comment.created_at, GET_FORMAT(TIMESTAMP, \'USA\')) as date '
	    			  + 'FROM comments comment, users user '
					  + 'WHERE idea = ? AND comment.user = user.id', [ideaId]);
	}).then(function(rows) {
	    comments = rows;

		    // Check for any screenshots associated with this idea.
		    return sql.SimpleQueryPromise('SELECT id FROM idea_images '
						  + 'WHERE idea = ?', [ideaId]);
	}).then(function(screenshotRows) {
	    // Convert SQL rows to an array of just the ID values.
	    screenshotIds = screenshotRows.map(function(item) {
		return item.id;
	    });
	    // Check if this user has voted on this item.
	    return sql.SimpleQueryPromise(
		'SELECT amount FROM user_votes WHERE idea=? AND user=?',
		[ideaId, userId]);
	}).then(function(rows) {
	    if (rows.length == 1) {
		vote = rows[0].amount;
	    }

	    return sql.SimpleQueryPromise(
		'SELECT is_developer FROM users WHERE id=?', [userId || -1]);
	}).then(function(usersRows) {
	    if (usersRows.length == 1) {
		isDeveloper = usersRows[0].is_developer;
	    }
	    res.render('comments', {
		idea: idea,
		comments: comments,
		isOwner: idea.owner_id == userId,
		isLoggedIn: userId != undefined,
		screenshotIds: screenshotIds,
		userInfo: {id: userId, isDeveloper: isDeveloper},
		userVote: vote
	    });
	}).catch(function(err) {
	    console.log(err);
	    throw err;
	});
});


var HandlePostScreen = function(req, res, next) {
    var ideaId = req.params.ideaId;
    var image;

    // Make sure the user owns this idea.
    if (!res.locals.user) {
	throw new Error('Must be logged in to add a screenshot.');
    }
    var userId = res.locals.user.id;
    sql.SimpleQueryPromise('SELECT owner_id FROM ideas WHERE id = ?',
			   [ideaId])
	.then(function(rows) {
	    if (rows.length != 1 || rows[0].owner_id != userId) {
		res.status(403);
		res.render('error', {
		    message: 'Only the idea owner can add screenshots.',
		    error: {}
		});
		return;
	    }
	    // Don't allow too many images.
	    return sql.SimpleQueryPromise('SELECT count(*) AS count '
					  + 'FROM idea_images '
					  + 'WHERE idea = ?', [ideaId]);
	}).then(function(rows) {
 	    if (rows[0].count >= 8) {
		throw Error('Too many screenshots.');
	    }

	    // Get and process the image in the request.
	    return GetImage(req, 'screenshot', SCREENSHOT_SIZE);
	}).then(function(gotImage) {
	    image = gotImage;

	    // Find the next available ID.
	    return GetNextAvailableId('idea_images');
	}).then(function(imageId) {
	    // Add the screenshot to the database.
	    return sql.SimpleQueryPromise('INSERT INTO idea_images '
					  + '(id, idea, image) '
					  + 'VALUES (?,?,?)',
					  [imageId, ideaId, image]);
	}).then(function() {
	    res.redirect('/idea/' + ideaId);
	}).catch(function(err) {
	    console.log('HandlePostScreen error:', err);
	    res.send('');
	});
}


// Add a screenshot to an idea.
router.post('/:ideaId/screens',
	    multer({limits:{fileSize: 10 * 1024*1024,
			    files: 4},
		    inMemory: true}),
	    HandlePostScreen);


var GetScreenshot = function(ideaId, screenId) {
    return sql.SimpleQueryPromise('SELECT image FROM idea_images '
				  + 'WHERE id=? AND idea=?', [screenId, ideaId])
	.then(function(rows) {
	    // There should only be one row.
	    if (rows.length == 0) {
		var err = new Error('Screenshot not found.');
		err.status = 404;
		next(err);
	    }
	    if (rows.length > 1) {
		console.log('Found multiple screenshots for idea('
			    + ideaId + '), screenId(' + screenId + ')');
	    }
	    return new Promise(function(resolve) {
		resolve(rows[0].image);
	    });
	});
};



// Retrieve a screenshot.
router.get('/:ideaId/screens/:screenId.jpg', function(req, res, next) {
    var ideaId = req.params.ideaId;
    var screenId = req.params.screenId;
    GetScreenshot(ideaId, screenId)
	.then(function(image) {
	    res.writeHead(200, {'Content-Type': 'image/jpg'});
	    res.end(image, 'binary');
	});
});


// Retrieve a screenshot thumbnail
router.get('/:ideaId/screenthumbs/:screenId.jpg', function(req, res, next) {
    var ideaId = req.params.ideaId;
    var screenId = req.params.screenId;
    GetScreenshot(ideaId, screenId)
	.then(function(image) {
	    gm(image, 'tmpImage.jpg')
		.resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height)
		.toBuffer('JPG', function(err, resized) {
		    if (err) throw err;
		    res.writeHead(200, {'Content-Type': 'image/jpg'});
		    res.end(resized, 'binary');
		})

	});
});

// Comment on an idea
router.post('/:ideaId/comment', function(req, res, next) {
    var ideaId = req.params.ideaId;
    var comment = req.body.comment;
    
    if (!HasNonWhitespaceContent(comment)) {
    	throw new Error('Comment cannot be blank.');
        }
    
    if (!res.locals.user) {
    	throw new Error('Must be logged in to comment.');
        }
    
    sql.SimpleQueryPromise('INSERT INTO comments (user, idea, contents) VALUES (?, ?, ?)',
    		[res.locals.user.id, ideaId, comment])
	.then(function() {
    	    res.redirect('/idea/' + ideaId);
	}).catch(function(err) {
    	    console.log(err);
    	});
});


// Vote on an idea.
router.post('/:ideaId/vote', function(req, res, next) {
    var ideaId = req.params.ideaId;
    var vote = req.body.vote;
    if (Array.isArray(req.body.vote)) {
	// The form returns all buttons and inputs named 'vote', and we have
	// to decide which one to choose.  The immediate action buttons come
	// after the DollarVotes entry, so find which values are filled in
	// and choose the last one.
	var filledVotes = req.body.vote.filter(
	    function(val) {return val != '';});
	vote = filledVotes[filledVotes.length - 1];
    }

    if (!res.locals.user) {
	throw new Error('Must be logged in to vote.');
    }

    var query;
    if (vote == 0) {
	// Remove the vote.
	query = sql.SimpleQueryPromise(
	    'DELETE FROM user_votes WHERE user=? AND idea=?',
	    [res.locals.user.id, ideaId]);
    } else {
	data = [res.locals.user.id, ideaId, vote];
	query = sql.SimpleQueryPromise(
	    'INSERT INTO user_votes (user, idea, amount) VALUES (?, ?, ?) '
		+ 'ON DUPLICATE KEY UPDATE '
		+ 'user=VALUES(user), idea=VALUES(idea), '
		+ 'amount=VALUES(amount)', data);
    }
    query.then(function() {
	res.redirect('/idea/' + ideaId);
    }).catch(function(err) {
	console.log(err);
    });
});


module.exports = router;
