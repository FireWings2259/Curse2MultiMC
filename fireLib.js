/*fireLib.js
This is my basic libary for (Node) JS.
FireWings
*/

// Dependencies
var fs = require('fs');
var url = require('url');
var request = require('sync-request');
const moment = require('moment-timezone');

var http = require('http');
var exec = require('child_process').exec;

var spawn = require('child_process').spawn;


module.exports = {fget, wget, rurl, getTZDate};

// Function to download a file using HTTP.get
function fget(file_url, DOWNLOAD_DIR, file_name) {

if (arguments.length < 3){
    file_name = url.parse(file_url).pathname.split('/').pop();
}

var options = {
    host: url.parse(file_url).host,
    port: url.parse(file_url).port,
    path: url.parse(file_url).pathname
};

var file = fs.createWriteStream(DOWNLOAD_DIR + file_name);
    
http.get(options, function(res) {
    res.on('data', function(data) {
            file.write(data);
        }).on('end', function() {
            file.end();
            console.log(file_name + ' downloaded to ' + DOWNLOAD_DIR);
        });
    });
}

//Function to download a file using wget
function wget(file_url, DOWNLOAD_DIR, file_name){
    // extract the file name
    if (arguments.length < 3){
    file_name = url.parse(file_url).pathname.split('/').pop();
    }
    
    // compose the wget command
    var wget = 'wget --content-disposition -P ' + DOWNLOAD_DIR + ' ' + file_url;
    // excute wget using child_process' exec function

    var child = exec(wget, function(err, stdout, stderr) {
        if (err) throw err;
        else console.log(file_name + ' downloaded to ' + DOWNLOAD_DIR);
    });
}

//Function to get the last url of a rediect chain
function rurl(urli){
    let tmp = request('GET', urli, {"followRedirects" : false});
    if (tmp.statusCode < 400 && tmp.statusCode >= 300 ){
        if (url.parse(tmp.headers.location).hostname == null){
            let tmp2 = url.parse(urli);
            let x;
            if (tmp2.protocol !== null) {x = tmp2.protocol + "//";}
            if (tmp2.host !== null) {x += tmp2.host;}
            x += tmp.headers.location;
            return rurl(x);
        }
        return rurl(tmp.headers.location);
    } else {
        return urli;
    }
}

//Function to get the date in a timezone specifyed, or default to mine.
function getTZDate(tz){
 if (tz === undefined) {
  tz = "Australia/Brisbane"; // Set the TimeZone
 }
 return moment.tz(new Date, "DD-MM-YYYY HH:mm:ss", tz).format().replace(/T/, " ").replace(/\..+/, "").split("+")[0];
}

