// Utilities for working with our MySql database.
//
var mysql = require('mysql');
var Promise = require('promise');


var connection_config = {
    host     : process.env.MYSQL_HOST,
    user     : process.env.MYSQL_USER,
    password : process.env.MYSQL_PW,
    database : process.env.MYSQL_DB
};


var OpenConnection = function() {
    var connection = mysql.createConnection(connection_config);
    connection.connect();

    return connection;
};


// Return a Promise after sending a simple query.  If the query is
// successful, you can use Promise.then to receive the result of the
// query.  For example:
//   var query = SimpleQueryPromise('SELECT * FROM users');
//   query.then(function(rows) {
//     console.log('Received data:', rows);
//   }
var SimpleQueryPromise = function(query, params) {
    return new Promise(function(resolve, reject) {
	var connection = OpenConnection();
	
	// print the query for debugging purposes
	// console.log('Running query: ', query);
	// console.log('query params: ', params);
	
	connection.query(query, params, function(err, rows) {
	    connection.end();
	    if (err) {
		console.log('SQL error:', err);
		reject(err);
	    }
	    resolve(rows);
	});
    });
}


module.exports = {
    OpenConnection: OpenConnection,
    SimpleQueryPromise: SimpleQueryPromise
};
