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
var exec = require('child_process').execSync;
var exec_as = require('child_process').exec;

var spawn = require('child_process').spawn; //Dont Need, I think [TODO] DELETE [/TODO]


module.exports = {fget, wget_as, wget, rurl, getTZDate, getExt};

//Function to download a file using wget (sync)
function wget(file_url, DOWNLOAD_DIR, overide, file_name){
    //Set Bool to false if not given...
    if (typeof(overide) !== Boolean){
        overide = false;
    }
    //Extract the file name from url if not given
    if (arguments.length < 4){ file_name = url.parse(file_url).pathname.split('/').pop(); }
    //Set the full file path of the downloaded file
    let ffpath;
    if (DOWNLOAD_DIR.slice(-1) != "/"){ //[TPDO] MAKE FOR WINDOWS!! [/TODO]
        ffpath = DOWNLOAD_DIR + "/" + file_name; //Add slash
    } else {
        ffpath = DOWNLOAD_DIR + file_name; //Already there
    }
    
    if (!overide && fs.existsSync(ffpath)) { //Check for File
        console.log(file_name + ' in folder ' + DOWNLOAD_DIR + " Already Exists!");
        console.log("Not Downloading anything! Set overide to true to delete file and redownload!");
        return {fileName: file_name, dDir: DOWNLOAD_DIR, fpath: ffpath, url: file_url}; //Give the details back
    } else if (overide && fs.existsSync(ffpath)){
       fs.unlinkSync();
       console.log(file_name + " is now gone");
    }
    
     // compose the wget command
    var wget = "wget -q --content-disposition -O" + ffpath + " " + file_url;
    
    //Run the command
    try {
        exec(wget); //Run
    } catch(e){ //If Fail
        console.log("Yeh about that....");
        console.log(e);
        return false;
    } finally { //If Yes
        console.log(file_name + ' downloaded to ' + DOWNLOAD_DIR);
        return {fileName: file_name, dDir: DOWNLOAD_DIR, fpath: ffpath, url: file_url};
    }
}

//Function to download a file using wget (Async)
function wget_as(file_url, DOWNLOAD_DIR, file_name){
    // extract the file name
    if (arguments.length < 3){
    file_name = url.parse(file_url).pathname.split('/').pop();
    }
    
    // compose the wget command
    var wget = 'wget --content-disposition -P ' + DOWNLOAD_DIR + ' ' + file_url;
    // excute wget using child_process' exec function

    var child = exec_as(wget, function(err, stdout, stderr) {
        if (err) throw err;
        else console.log(file_name + ' downloaded to ' + DOWNLOAD_DIR);
    });
}

// Function to download a file using HTTP.get (Async)
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

//Funciton to get the last .exstention of a file
function getExt(filename, urlB) {
    if (urlB != false){
        let uFileName = url.parse(filename).pathname.split('/').pop();
        //console.log(uFileName);
        
        let fExt = uFileName.lastIndexOf('.');
        fExt = (fExt < 0) ? '' : uFileName.substr(fExt);
        return {fileName: uFileName, fileExt: fExt};
    } else {
        var i = filename.lastIndexOf('.');
        return (i < 0) ? '' : filename.substr(i);
    }
}

