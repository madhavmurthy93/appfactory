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
router.get('/', function(req, res, next) {
    if (!res.locals.user) {
	// The user isn't logged in.  Redirect to the login page.
	res.redirect('/demo/auth/facebook');
	return;
    }

    sql.SimpleQueryPromise(
	'SELECT category FROM categories ORDER BY category ASC')
	.then(function(rows) {
	    var categories = rows.map(function(row) { return row.category; });
	    res.render('idea', { categories: categories });
	}).catch(next);  // Pass errors to the default error handler.
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
	    thumbnail: image,
	    description: req.body.description.trim(),
	    category: req.body.category,
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
		    res.redirect('/demo/auth/facebook');
		    return;
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
			res.redirect('/demo/idea/' + ideaId);
		    }).catch(next);  // Pass errors to the error handler.
	    });


// Return thumbnail images.
router.get('/thumbs/:ideaId', function(req, res, next) {
    var ideaId = req.params.ideaId;
    sql.SimpleQueryPromise('SELECT thumbnail FROM ideas WHERE id=?', [ideaId])
	.then(function(rows) {
	    if (rows.length == 1 && rows[0].thumbnail.length > 0) {
		res.writeHead(200, {'Content-Type': 'image/jpg'});
		res.end(rows[0].thumbnail, 'binary');
	    } else {
		var readStream = fs.createReadStream(
		    './public/images/no_image.gif');
		readStream.pipe(res);
	    }
	}).catch(next);  // Pass errors to the error handler.
});


// The idea detail page.
router.get('/:ideaId', function(req, res, next) {
    var ideaId = req.params.ideaId;
    var idea;
    var categories;
    var comments;
    var screenshotIds;
    var isDeveloper = false;
    var userId=-1;
    var vote = undefined;
    var devVote = {};
    var estimatedmo = 0;
    var commitedmo = 0;
    var totalDollarVotes = 0;
    var commitedDevs = undefined;
    var rejectionVotes;
    if (res.locals.user) {
	userId = res.locals.user.id;
    }

    sql.SimpleQueryPromise(
    			 'SELECT idea.id as id, idea.name as name, '
    		   + 'DATE_FORMAT(idea.created_at, GET_FORMAT(DATE, \'JIS\')) as created_at, '
    		   +   'idea.description as description, idea.category as category, '
    		   +   'idea.owner_id as owner_id, user.name as ownername, user.profile_pic_url as userPic '
			   + 'FROM ideas idea, users user '
			   + 'WHERE idea.id=? AND idea.owner_id = user.id', [ideaId])
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
	    return sql.SimpleQueryPromise(
	    				'SELECT comment.votes, user.name as username, comment.contents, ' 
	    			  +   'DATE_FORMAT(comment.created_at, GET_FORMAT(DATE, \'JIS\')) as date '
	    			  + 'FROM comments comment, users user '
					  + 'WHERE idea = ? AND comment.user = user.id '
					  + 'ORDER BY created_at DESC', [ideaId]);
	}).then(function(rows) {
	    comments = rows;

	    // Get the list of categories.
	    return sql.SimpleQueryPromise(
		'SELECT category FROM categories ORDER BY category ASC');
	}).then(function(rows) {
	    categories = rows.map(function(row) { return row.category; });

	    // Check for any screenshots associated with this idea.
	    return sql.SimpleQueryPromise(
		'SELECT id FROM idea_images WHERE idea = ? '
		    + 'ORDER BY id', [ideaId]);
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

	    // Count the sum of DollarVotes.
	    return sql.SimpleQueryPromise(
		'SELECT SUM(amount) AS total FROM user_votes WHERE idea=? '
		+ 'AND amount >= 1', [ideaId]);
	}).then(function(rows) {
	    if (rows.length == 1 && rows[0].total) {
		totalDollarVotes = rows[0].total;
	    }

	    // Count sums for each of the rejection categories.
	    return sql.SimpleQueryPromise(
		'SELECT amount, count(*) AS votes FROM user_votes '
		    + 'WHERE amount < 0 AND idea=? GROUP BY amount', [ideaId]);
	}).then(function(rows) {
	    // Process each of the rows and turn the result into a
	    // more convenient map that the UI can use.  Map from
	    // vote type (the negative value of the vote) to vote count.
	    if (rows.length > 0) {
		rejectionVotes = {}
		for (i = 0; i < rows.length; i++) {
		    rejectionVotes[rows[i].amount] = rows[i].votes;
		}
	    }
	    return sql.SimpleQueryPromise(
	    	'SELECT AVG(time_estimate_days) AS totalmo FROM developer_votes WHERE idea=?',
	    	[ideaId]);
	}).then(function(rows) {
		if (rows.length == 1 && rows[0].totalmo) {
			estimatedmo = (rows[0].totalmo * 4 * 40);
		} 
		return sql.SimpleQueryPromise(
			'SELECT time_estimate_days, available_time_per_week, available_duration_weeks '
			+ 'FROM developer_votes WHERE idea=? AND user=?', [ideaId, userId]);
	}).then(function(rows) {
		if(rows.length == 1) {
			devVote = {devmo: rows[0].time_estimate_days, devweekly: rows[0].available_time_per_week, devweeks: rows[0].available_duration_weeks};
		} 
		return sql.SimpleQueryPromise(
			'SELECT SUM(available_duration_weeks * available_time_per_week) AS commitedmo FROM '
			+ 'developer_votes WHERE idea=?', [ideaId]);
	}).then(function(rows) {
		if (rows.length == 1) {
			commitedmo = rows[0].commitedmo;
		}

		return sql.SimpleQueryPromise(
			'SELECT users.name, users.profile_pic_url FROM '
			+ 'users, developer_votes '
			+ 'WHERE users.id = developer_votes.user AND developer_votes.idea=? '
			+ 'AND developer_votes.available_time_per_week > 0', [ideaId]);
	}).then(function(rows) {
		if (rows.length > 0) {
			commitedDevs = rows;
		}
	    // Check if the current user is a developer.
	    return sql.SimpleQueryPromise(
		'SELECT is_developer FROM users WHERE id=?', [userId || -1]);
	}).then(function(usersRows) {
	    if (usersRows.length == 1) {
		isDeveloper = usersRows[0].is_developer;
	    }
	    res.render('comments', {
		idea: idea,
		categories: categories,
		comments: comments,
		isOwner: idea.owner_id == userId,
		isLoggedIn: userId != -1,
		rejectionVotes: rejectionVotes,
		screenshotIds: screenshotIds,
		userInfo: {id: userId, isDeveloper: isDeveloper},
		userVote: vote,
		totalDollarVotes: totalDollarVotes,
		devVote: devVote,
		estimatedmo: estimatedmo,
		commitedmo: commitedmo,
		commitedDevs: commitedDevs
	    });
	}).catch(next);  // Pass errors to the error handler.
});


router.put('/:ideaId', function(req, res, next) {
    var ideaId = req.params.ideaId;
    var patch = {};
    if (req.body.category) {
	patch.category = req.body.category;
    }
    if (req.body.description) {
	patch.description = req.body.description;
    }

    VerifyOwnerPromise(res.locals.user, ideaId, res).then(function(userId) {
	return sql.SimpleQueryPromise(
	    'UPDATE ideas SET ? WHERE id=?', [patch, ideaId]);
    }).then(function() {
	// Success.  Return an empty HTTP 200.
	res.send('');
    }).catch(next);  // Pass errors to the error handler.
});


router.delete('/:ideaId', function(req, res, next) {
    var ideaId = req.params.ideaId;

    VerifyOwnerPromise(res.locals.user, ideaId, res).then(function(userId) {
	return sql.SimpleQueryPromise('DELETE FROM ideas WHERE id=?', [ideaId]);
    }).then(function() {
	// Success.  Return an empty HTTP 200.
	res.send('');
    }).catch(next);  // Pass errors to the error handler.
});


var VerifyOwnerPromise = function(user, ideaId, res) {
    return new Promise(function(resolve, reject) {
	if (!user) {
	    console.log('User is not logged in.');
	    res.status(403);
	    res.render('error', {
		message: 'Must be logged in.',
		error: {}
	    });
	    reject('Must be logged in.');
	}
	var userId = res.locals.user.id;

	sql.SimpleQueryPromise('SELECT owner_id FROM ideas WHERE id = ?',
			       [ideaId])
	    .then(function(rows) {
		if (rows.length != 1 || rows[0].owner_id != userId) {
		    reject(new Error('Must be the owner of this idea.'));
		}
		resolve(userId);
	    });
    });
};


var HandlePostScreen = function(req, res, next) {
    var ideaId = req.params.ideaId;
    var image;
    var userId;

    // Make sure the user owns this idea.
    VerifyOwnerPromise(res.locals.user, ideaId, res).then(function(userIdIn) {
	userId = userIdIn;

	// If this idea doesn't have a thumbnail, store this image as the
	// thumbnail.
	return sql.SimpleQueryPromise(
	    'SELECT thumbnail FROM ideas WHERE id=?', [ideaId])
    }).then(function(rows) {
	if (rows.length != 1) {
	    throw new Error("Can't find current idea.");
	}
	if (rows[0].thumbnail == null || rows[0].thumbnail.length == 0) {
	    // Set the thumbnail instead of adding a screenshot.
	    // Get and process the image in the request.
	    GetImage(req, 'screenshot', SCREENSHOT_SIZE)
		.then(function(gotImage) {
		    image = gotImage;
		    return sql.SimpleQueryPromise(
			'UPDATE ideas SET thumbnail=? WHERE id=?',
			[image, ideaId]).then(function() {
			    res.redirect('/demo/idea/' + ideaId);
			});
		});
	} else {
	    // Don't allow too many images.
	    sql.SimpleQueryPromise(
		'SELECT count(*) AS count '
		    + 'FROM idea_images '
		    + 'WHERE idea = ?', [ideaId])
		.then(function(rows) {
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
		    res.redirect('/demo/idea/' + ideaId);
		}).catch(next);  // Pass errors to the error handler.
	}
    });
};


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
	}).catch(next);  // Pass errors to the error handler.
});


// Delete one of the images.
router.delete('/:ideaId/screens/:screenIndex', function(req, res, next) {
    var ideaId = req.params.ideaId;

    // Make sure the user owns this idea.
    VerifyOwnerPromise(res.locals.user, ideaId, res)
	.then(function(userId) {
	    // Subtract 1 from the screen index, because index 0 indicates the
	    // thumbnail.  After subtracting, remaining screens will then start
	    // at index 0.
	    var screenIndex = req.params.screenIndex - 1;

	    if (screenIndex < -1) {
		throw new Error('Invalid screen index.');
	    } else if (screenIndex == -1) {
		// Delete the thumbnail.
		sql.SimpleQueryPromise(
		    'UPDATE ideas SET thumbnail="" WHERE id=?',
		    [ideaId])
		    .then(function() {
			// Success.  Send an empty HTTP 200 response.
			res.send('');
		    }).catch(next);  // Pass errors to the error handler.
	    } else {
		// Delete one of the screenshots.  First, map from screen index
		// to screen ID.
		sql.SimpleQueryPromise(
		    'SELECT id FROM idea_images WHERE idea = ? ORDER BY id',
		    [ideaId])
		    .then(function(rows) {
			if (rows.length > screenIndex) {
			    var screenId = rows[screenIndex].id;
			    return sql.SimpleQueryPromise(
				'DELETE FROM idea_images WHERE idea=? AND id=?',
				[ideaId, rows[screenIndex].id]);
			}
			throw new Error('Invalid screen index.');
		    }).then(function() {
			// Success.  Send an empty HTTP 200 response.
			res.send('');
		    }).catch(next);  // Pass errors to the error handler.
	    }
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
	}).catch(next);  // Pass errors to the error handler.
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
    	    res.redirect('/demo/idea/' + ideaId);
	}).catch(next);  // Pass errors to the error handler.
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
	res.redirect('/demo/idea/' + ideaId);
    }).catch(next);  // Pass errors to the error handler.
});

router.post('/:ideaId/devvote', function(req, res, next) {
	var ideaId = req.params.ideaId;
	var manmo = req.body.manmo;
	var weekly = req.body.weekly;
	var weeks = req.body.weeks;
	var interested = req.body.interested;
	if (!res.locals.user) {
		throw new Error('Must be logged in to vote.');
	}
	if (interested) {
		data = [res.locals.user.id, ideaId, manmo, weekly, weeks];
	} else {
		data = [res.locals.user.id, ideaId, manmo, 0, 0];
	}
	sql.SimpleQueryPromise(
		'INSERT INTO developer_votes (user, idea, time_estimate_days, available_time_per_week, available_duration_weeks) '
			+ 'VALUES (?, ?, ?, ?, ?) '
			+ 'ON DUPLICATE KEY UPDATE '
			+ 'user=VALUES(user), idea=VALUES(idea), '
			+ 'time_estimate_days=VALUES(time_estimate_days), '
			+ 'available_time_per_week=VALUES(available_time_per_week), '
			+ 'available_duration_weeks=VALUES(available_duration_weeks)', data)
	.then(function() {
		res.redirect('/demo/idea/' + ideaId);
	}).catch(next);  // Pass errors to the error handler.
});


module.exports = router;
