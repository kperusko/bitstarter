#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code 
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var cheerioHtmlString = function(htmlString) {
    return cheerio.load(htmlString);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function(html, checksfile) {
    if ( fs.existsSync(html) ){
	$ = cheerioHtmlFile(html);
    }else{
	$ = cheerioHtmlString(html);
    }

    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var checkHtmlFromUrl = function(url, checks){
    restler.get(url).on('complete', function(result, response){
	if (result instanceof Error) {
	    console.error('Error: ' + util.format(response.message));
        } else {
	    var checkJson = checkHtml(result, checks);
	    printFormattedJSON(checkJson);
        }
    });
};

var printFormattedJSON = function(json){
    var outJson = JSON.stringify(json, null, 4);
    console.log(outJson);
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'URL to index.html')
        .parse(process.argv);

    if ( program.url ){
	checkHtmlFromUrl(program.url, program.checks);
    }else{
	var checkJson = checkHtml(program.file, program.checks);
	printFormattedJSON(checkJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
