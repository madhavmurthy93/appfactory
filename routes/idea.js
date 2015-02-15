var express = require('express');
var fs = require('fs');
var gm = require('gm');
var multer = require('multer');
var mysql = require('mysql');
var router = express.Router();
var Promise = require('promise');


var THUMBNAIL_SIZE = {
    width: 200,
    height: 200
};

var connection_config = {
    host     : process.env.MYSQL_HOST,
    user     : process.env.MYSQL_USER,
    password : process.env.MYSQL_PW,
    database : process.env.MYSQL_DB
};


/* GET idea page. */
router.get('/', function(req, res) {
    res.render('idea');
});


// Find an unused Idea ID from the SQL database, and return it.
var GetNextAvailableIdeaId = function() {
    return new Promise(function(resolve, reject) {
	var connection = mysql.createConnection(connection_config);
	connection.connect();

	connection.query(
	    'SELECT id FROM ideas ORDER BY id DESC LIMIT 1',
	    function(err, rows) {
		connection.end();
		if (err) {
		    reject(err);
		}
		var nextId = 0;
		if (rows.length > 0) {
		    nextId = rows[0].id + 1;
		}
		resolve(nextId);
	    });
    });
};


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
	var connection = mysql.createConnection(connection_config);
	console.log('Connecting...');
	connection.connect();

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


router.post('/',
	    multer({dest: './idea_images/',
		    limits:{fileSize: 10 * 1024*1024,
			    files: 1},
		    inMemory: true}),
	    function(req, res, next) {
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
    var connection = mysql.createConnection(connection_config);
    connection.connect();
    connection.query('SELECT thumbnail FROM ideas WHERE id=?', [ideaId],
		     function(err, rows, fields) {
			 connection.end();
			 console.log('Thumb rows:', rows);
			 console.log('Thumb len:', rows[0].thumbnail.length);
			 if (rows.length == 1 && rows[0].thumbnail.length > 0) {
			     res.send(rows[0].thumbnail);
			 } else {
			     var readStream = fs.createReadStream(
				 './public/images/no_image.gif');
			     readStream.pipe(res);
			 }
		     });
});


// The idea detail page.
router.get('/:ideaId', function(req, res) {
    var ideaId = req.params.ideaId;
    var connection = mysql.createConnection(connection_config);
    connection.connect();
    connection.query('SELECT id, name, summary, description '
		     + 'FROM ideas WHERE id=?',
		     [ideaId],
		     function(err, rows, fields) {
			 connection.end();
			 if (err) throw err;
			 if (rows.length != 1) {
			     var err = new Error('Rows != 1. Rows ='
						 + rows.length);
			     err.status = 500;
			     throw err;
			 }
			 console.log('Rendering row:', rows[0]);
			 res.render('ideaDetail', {
			     idea: rows[0]
			 });
		     });
});


module.exports = router;
