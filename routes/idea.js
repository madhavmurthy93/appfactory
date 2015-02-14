var express = require('express');
var fs = require('fs');
var multer = require('multer');
var router = express.Router();
var mysql = require('mysql');


/* GET idea page. */
router.get('/', function(req, res) {
    res.render('idea');
});


// Find an unused Idea ID from the SQL database, and return it.
var GetNextAvailableIdeaId = function(callback) {
    connection_config = {
	host     : process.env.MYSQL_HOST,
	user     : process.env.MYSQL_USER,
	password : process.env.MYSQL_PW,
	database : process.env.MYSQL_DB
    }
    var connection = mysql.createConnection(connection_config);
    connection.connect();

    connection.query(
	'SELECT id FROM ideas ORDER BY id DESC LIMIT 1',
	function(err, rows) {
	    connection.end();
	    if (err) {
		console.log('MySql error:', err);
		throw err;
	    }
	    var nextId = 0;
	    if (rows.length > 0) {
		nextId = rows[0].id + 1;
	    }
	    
	    callback(nextId);
	});
};


// This route receives the posted form.
// As explained above, usage of 'body-parser' means
// that `req.body` will be filled in with the form elements
router.post('/',
	    multer({dest: './idea_images/',
		    limits:{fileSize: 1024*1024,
			    files: 1},
		    inMemory: true,
		    onFileUploadComplete: function (file) {
			console.log(file.fieldname + ' uploaded to  '
				    + file.path);
		    }}),
	    function(req, res, next){
		// Read the image contents and save them to the database.
		//var readStream = fs.createReadStream(
		//    req.files.displayImage.buffer);
		GetNextAvailableIdeaId(function(ideaId) {
		    console.log('Set ideaId to', ideaId);

		    connection_config = {
			host     : process.env.MYSQL_HOST,
			user     : process.env.MYSQL_USER,
			password : process.env.MYSQL_PW,
			database : process.env.MYSQL_DB
		    }
		    console.log('Creating connection...');
		    var connection = mysql.createConnection(connection_config);
		    console.log('Connecting...');
		    connection.connect();

		    console.log('Request body:', req.body);
		    connection.query(
			'INSERT INTO ideas '
			+ '(id, name, summary, thumbnail, description) '
			+ 'VALUES (?,?,?,?,?)',
			[ideaId, req.body.name, req.body.summary,
			 req.files.displayImage.buffer, req.body.description],
			function(err) {
			    connection.end();
			    console.log('Insert done:', err);
			    if (err) {
				console.log('MySql error: ', err);
				var err = new Error('Database error: ' + err);
				err.status = 500;
				next(err);
			    } else {
				var imagePath = req.files.displayImage.path;
				var imageName = req.files.displayImage.name;

				console.log('Post handler.', req.files)
				var html = 'Hello ' + req.body.name + '.<br>' +
				    '<img src="/idea/thumbs/' + ideaId + '"><br>' +
				    '<a href="/idea">Try again.</a>';
				res.send(html);
			    }
			});
		});
	    });


router.get('/thumbs/*', function(req, res) {
    var imageName = req.path.split('/')[2];
    console.log('Thumbs image:', imageName);

    connection_config = {
	host     : process.env.MYSQL_HOST,
	user     : process.env.MYSQL_USER,
	password : process.env.MYSQL_PW,
	database : process.env.MYSQL_DB
    }
    console.log('Creating connection...');
    var connection = mysql.createConnection(connection_config);
    console.log('Connecting...');
    connection.connect();

    console.log('Querying DB...');
    connection.query('SELECT thumbnail FROM ideas WHERE id=?', [imageName],
		     function(err, rows, fields) {
			 console.log('Results:', err, rows, fields);
			 connection.end();
			 console.log('Row length:', rows.length);
			 if (rows.length == 1) {
			     res.send(rows[0].thumbnail);
			 }
		     });
});

module.exports = router;
