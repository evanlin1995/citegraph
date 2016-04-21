// Load the http module to create an http server.
var http = require('http');
var fs = require('fs');
var express = require('express');
var app = express();

// app.get('/', function (req, res) {
//   res.render("index.html");
// });

app.use(express.static(__dirname + '/public'));

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

// fs.readFile('./index.html', function (err, html) {
// 	if (err) {
// 		throw err;
// 	}
// 	startServer(html);
// })

// function startServer(html) {
// 	// Configure our HTTP server to respond with Hello World to all requests.
// 	var server = http.createServer(function (request, response) {
// 	  response.writeHead(200, {"Content-Type": "text/html"});
// 	  response.write(html);
// 	  response.end();
// 	});

// 	// Listen on port 8000, IP defaults to 127.0.0.1
// 	server.listen(8000);

// 	// Put a friendly message on the terminal
// 	console.log("Server running at http://127.0.0.1:8000/");


// }
