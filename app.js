var url = require('url');
var fs = require('fs');
var http = require('http');
var phantom = require('phantom');

module.exports = {
	handleRequest: function (request, response) {
		response.writeHead(200, {'Content-Type': 'text/html'});

		var path = url.parse(request.url).pathname;
		var pdfData = request;
		
		switch (path) {
			//Web Routes
			case '/web/index':
				renderHTML('./views/index.html', response);
				break;

			//API call to print PDF
			case '/printPdf':
				console.log("Going to print pdf");

				var htmlStrings = [];
				var htmlstring = `
					<html>
					<head>
						<meta charset="UTF-8">
						<title>Print tab</title>
						<style>
						</style>
					</head>
					<body>` + pdfData + `</body>
					</html>`;

				htmlStrings.push(encodeURIComponent(htmlstring));

				for (var i=0; i<htmlStrings.length; i++)
					htmlStrings[i] = decodeURIComponent(htmlStrings[i]);

				var printCount = 0;
				var errors = '';

				var dir = 'printjobs';
				if (!fs.existsSync(dir)) fs.mkdirSync(dir);

				var jobCount = 0;
				convertPDF(jobCount);

				function convertPDF(jobCount) {
					var uuid = "Folder1";
					console.log("Printing job: " + uuid);
					var htmlFile = dir + '/printslip_'+ uuid +'.html';
					var pdfFile = dir + '/printslip_'+ uuid +'.pdf';

					// Write htmlString to an HTML file
					fs.writeFile(htmlFile, htmlStrings[jobCount], function(err) {
					if(err) return console.log("Unable to write file: " + err);
					});

					// Use Phantom to convert HTML to PDF
					var _ph, _page, _outObj;
					phantom.create().then(ph => {
					_ph = ph;
					return _ph.createPage();
					}).then(page => {
					_page = page;
					return _page.open(htmlFile);
					}).then(status => {
					return _page.property('content')
					}).then(content => {
					// _page.paperSize = { width: pageWidth, height: pageHeight, margin: '0' };
					// _page.property('viewportSize', { width: pageWidth, height: pageHeight });
					_page.property('paperSize', { width: 595, height: 842 });
					_page.render(pdfFile).then();    //creates 'pdf'

					_page.close();
					_ph.exit();

					}).catch(e => console.log(e));

				}

				response.end(JSON.stringify({name: "Printed PDF"}));
				break;			
			default:
				//renderHTML('./views/index.html', response);
				response.writeHead(404);
				response.write('Route not found..!');
				response.end();
				break;
		}
	}
}

function renderHTML(path, response) {
	fs.readFile(path, null, function(error, data) {
		if (error) {
			response.writeHead(404);
			response.write('File not found..!');
		} else {
			response.write(data);
		}
		response.end();
	});
}
