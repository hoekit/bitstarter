#!/usr/bin/env node
/*
   Automatically grade files for the presence of specified HTML tags/attributes.
   Uses commander.js and cheerio. Teaches command line application development
   and basic DOM parsing.

References:

+ cheerio
- https://github.com/MatthewMueller/cheerio
- http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
- http://maxogden.com/scraping-with-node.html

+ commander.js
- https://github.com/visionmedia/commander.js
- http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

+ JSON
- http://en.wikipedia.org/wiki/JSON
- https://developer.mozilla.org/en-US/docs/JSON
- https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
 */

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";


// Filename -> Filename      if file does exists
// Filename -> process.exit  if file does not exist
var assertFileExists = function(infile) {
	var instr = infile.toString();
	if(!fs.existsSync(instr)) {
		exitWithMessage( util.format("%s does not exist. Exiting.", instr));
	}
	return instr;
};


// HTMLFilename -> Function
var cheerioHtmlFile = function(htmlfile) {
	return cheerio.load(fs.readFileSync(htmlfile));
};


// ChecksFileName -> List
var loadChecks = function(checksfile) {
	return JSON.parse(fs.readFileSync(checksfile));
};


// HTMLFileName ChecksFileName -> MapOfBoolean
// produce a of map {tag:boolean} showing 
//   whether the tags in file ChecksFileName
//   are present in html text in file HTMLFilename
var checkHtmlFile = function(htmlfile, checksfile) {
	$ = cheerioHtmlFile(htmlfile);
	var checks = loadChecks(checksfile).sort();
	var out = {};
	for(var ii in checks) {
		var present = $(checks[ii]).length > 0;
		out[checks[ii]] = present;
	}
	return out;
};


var assertURLExistsAndChecks = function(inurl, checksFile) {
	var tmpHtmlFile = "/tmp/gentle-cove-9308.herokuapp.com-index.html";
	rest.get(inurl).on('complete', function(result) {
		if (result instanceof Error) {
			exitWithMessage( util.format("Can't get %s. Exiting.", inurl, 1 ));
		} else {
			fs.writeFileSync(tmpHtmlFile, result);
			//console.log("Written to: %s", tmpHtmlFile);
			runChecks(tmpHtmlFile, checksFile);
		}
	});
}


var exitWithMessage = function(msg, rc) {
	console.log(msg);
	process.exit(rc); // http://nodejs.org/api/process.html#process_process_exit_code
}


var runChecks = function(htmlfile, checksfile) {
	var checkJson = checkHtmlFile(htmlfile, checksfile);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
}


var clone = function(fn) {
	// Workaround for commander.js issue.
	// http://stackoverflow.com/a/6772648
	return fn.bind({});
};


if(require.main == module) {
	program
		.option('-c, --checks <check_file>', 'Path to checks.json', 
					clone(assertFileExists), CHECKSFILE_DEFAULT)
		.option('-f, --file <html_file>', 'Path to index.html', 
					clone(assertFileExists), HTMLFILE_DEFAULT)
		.option('-u, --url <URL>', 'URL of an HTML file')
		.parse(process.argv);

	if(program.url != undefined) {
		//console.log("URL defined. Checking url: %s", program.url);
		assertURLExistsAndChecks(program.url, program.checks);
	} else {
		//console.log("URL not defined. Checking file: %s", program.file);
		runChecks(program.file, program.checks);
	}
} else {
	exports.checkHtmlFile = checkHtmlFile;
}
