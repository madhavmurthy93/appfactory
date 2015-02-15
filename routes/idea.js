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


// Create an idea page. This is where users enter info for a new idea.
router.get('/', function(req, res) {
    res.render('idea');
});


// Find an unused Idea ID from the SQL database, and return it.
var GetNextAvailableIdeaId = function() {
    return sql.SimpleQueryPromise(
	'SELECT id FROM ideas ORDER BY id DESC LIMIT 1')
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


var GetImage = function(req) {
    return new Promise(function(resolve, reject) {
	var image = '';
	console.log('Starting GetImage, files:', req.files);
	if (req.files && req.files.displayImage &&
	    req.files.displayImage.buffer) {
	    var buffer = req.files.displayImage.buffer;

	    // Resize the image to thumbnail size.
	    console.log('Processing image...');
	    gm(buffer, 'tmpImage.jpg')
		.resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height)
		.toBuffer('JPG', function(err, buf) {
		    if (err) {
			console.log('Rejecting image:', err);
			reject(err);
		    } else {
			console.log('Resolved.');
			resolve(buf);
		    }
		});
	} else {
	    resolve(image);
	}
    });
};


var InsertIntoDb = function(req, ideaId, image) {
    return new Promise(function(resolve, reject) {
	console.log('Creating connection...');
	var connection = sql.OpenConnection();

	console.log('Request body:', req.body);
	console.log('Img: ', image);
	console.log('Inserting into DB...');
	connection.query(
	    'INSERT INTO ideas '
		+ '(id, name, summary, thumbnail, description) '
		+ 'VALUES (?,?,?,?,?)',
	    [ideaId, req.body.name, req.body.summary,
	     image, req.body.description],
	    function(err) {
		connection.end();
		console.log('Insert done:', err);
		if (err) {
		    console.log('MySql error: ', err);
		    var err = new Error('Database error: ' + err);
		    err.status = 500;
		    throw err;
		} else {
		    resolve();
		}
	    });
    })
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
		ValidateIdeaInput(req);
		GetNextAvailableIdeaId()
		    .then(function(ideaId) {
			GetImage(req).then(function(image) {
			    console.log('Set ideaId to', ideaId);
			    console.log('Image:', image);
			    InsertIntoDb(req, ideaId, image).then(function() {
				res.redirect('/idea/' + ideaId);
			    });
			});
		    });
	    });


// Return thumbnail images.
router.get('/thumbs/:ideaId', function(req, res) {
    var ideaId = req.params.ideaId;
    console.log('Thumb:', ideaId);
    sql.SimpleQueryPromise('SELECT thumbnail FROM ideas WHERE id=?', [ideaId])
	.then(function(rows) {
	    if (rows.length == 1 && rows[0].thumbnail.length > 0) {
		console.log('Returning thumbnail for', ideaId);
		res.send(rows[0].thumbnail);
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
    sql.SimpleQueryPromise('SELECT id, name, summary, description '
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
	    res.render('ideaDetail', {
		idea: rows[0]
	    });
	});
});


module.exports = router;
