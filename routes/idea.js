var express = require('express');
var fs = require('fs');
var multer = require('multer');
var router = express.Router();
var mysql = require('mysql');


/* GET idea page. */
router.get('/', function(req, res) {
    res.render('idea');
});


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
		var ideaId = 1;

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

		connection.query(
		    'INSERT INTO ideas (id, thumbnail) ' +
			'VALUES (?,?)', [ideaId, req.files.displayImage.buffer],
		    function(err) {
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
    connection.query('SELECT thumbnail FROM ideas',
		     function(err, rows, fields) {
			 console.log('Results:', err, rows, fields);
			 connection.end()
			 console.log('Row length:', rows.length);
			 if (rows.length == 1) {
			     res.send(rows[0].thumbnail);
			 }
		     });

    /*
    var imagePath = './idea_images/' + imageName;

    var readStream = fs.createReadStream(imagePath);
    readStream.pipe(res);
    */
});

module.exports = router;
