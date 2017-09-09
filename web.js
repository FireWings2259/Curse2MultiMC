/* web.js
The Web server for my Curse/Twitch to MultiMC instance converter.
FireWings
*/

//Load Libs
const conv = require("./convert.js");
const fireLib = require("./fireLib.js");
const reload = require('require-reload')(require);
const fs = require('fs-extra');
const express = require('express');
var serveIndex = require('serve-index');

const wget = fireLib.wget;
const getPackInfo = conv.getPackInfo;
const buildinst = conv.buildinstance;

if (!fs.existsSync("./config.json")){
    console.log("Woh! No Config File!\nRunning with defaults until fixed!");
    let conf = {
        "url":"0.0.0.0",
        "port": 80
    };
    fs.writeFileSync("./config.json", JSON.stringify(conf,null,2));
}
const config = require("./config.json");

var app = express();

app.use("/", express.static('client')); //Show the web client
app.use('/packs', serveIndex("./mmc-packs")); //Show the explorer
app.use('/packs', express.static("./mmc-packs")); // serve the actual files


app.listen(config.port,function(){
  console.log("Web Server Started at http://" + config.url + ":" + config.port);
});