/*Convert.js
This program will take a curse instance and create a MultiMC instance.
Made by FireWings.
*/

//Requirements
const fireLib = require("./fireLib.js");
const fs = require('fs-extra');
const reload = require('require-reload')(require);
const AdmZip = require('adm-zip');
const churl = require('valid-url').isUri;
const request = require('sync-request');
const cheerio = require('cheerio');

var getExt = fireLib.getExt;
var wget = fireLib.wget; //Might use http.get process yet... not sure
var rurl = fireLib.rurl; //My check URL function
var getTZDate = fireLib.getTZDate; //My TZ-Date Function
var mkdir = fs.ensureDirSync; //Make directory
var rm = fs.removeSync; //delete file/folder

//Vars
var curseZipURL = "url"; //The curse zip url
var fireOpt = false; //Do I put in my default configs?

//First Run
if (!fs.existsSync("./tmp/")){
    console.log("First Run!");
    console.log("Creating Folders/Files");
    fs.ensureDirSync("./tmp");
    fs.ensureDirSync("./mmc-packs");
}

function buildinstance(czipPath, tz, user){
    //Setup workspace
    let zipName= czipPath.split('\\').pop().split('/').pop(); //Get the zips file name.
    let wpath = "./tmp/" + zipName; //Set the workspace
    let ppath = wpath + "/MMC-" + zipName; //Build the path for the MMC Instance (This will be zipped)
    let mpath = ppath + "/minecraft/mods"; //The mods folder
    mkdir(ppath); //Create pack path
    
    //Get Configs \ Other MC Base Files From Curse Instance
    let czip = new AdmZip(czipPath); //load zip
    let zipEntries = czip.getEntries(); //get the file array
    zipEntries.forEach(function(zipEntry) { //for ech file
        if (zipEntry.entryName.toString().indexOf("overrides/") >= 0 && !zipEntry.isDirectory) { //Where the file is in the overrides folder and the file is not a folder
             czip.extractEntryTo(zipEntry.entryName, ppath, true, true); //Extractit it to the tmp
        }
    });
    
    //Build Minecraft/Pack folder, grab the pack info and create required files.
    fs.renameSync(ppath + "/overrides", ppath + "/minecraft");
    mkdir(mpath); //Make mods folder for later
    mkdir(ppath + "/patches"); //make the Patches Folder
    let icon = "Nope"; // Set/get the Icon File from curse
    let nicon = "Name"; // Get name of icon file
    czip.extractEntryTo("manifest.json", wpath, false, true); //Get Manfest File
    fs.appendFileSync(ppath + "/.packignore", "\n"); //Make the .packignore file
    let pinfo = reload(wpath + "/manifest.json"); //useing reload just in case things get derpy, if they dont then it will be removed... [TODO] Test That...[/TODO]
    
    //Build the instance.cfg file
    let incfg = "InstanceType=OneSix"; //Set Header Stuff
    incfg += "\nIntendedVersion=" + pinfo.minecraft.version; //Set MC Version
    incfg += "\niconKey=" + nicon; //Set Pack Icon
    incfg += "\nname=" + pinfo.name; //Set Pack Name
    incfg += "\nnotes=" + pinfo.name + " Version: " + pinfo.version + " Author :" + pinfo.author + "\\n\\nThis pack was created on " + getTZDate(tz) + "\\nusing FireWings, Curse2MultiMC Converter."; //Add Info
    if (user !== undefined){incfg += "\\nThe instance was created by the user: " + user} //If a user was supplied add that
    incfg += "\n"; //Close with the new line
    
    fs.appendFileSync(ppath + "/instance.cfg", incfg); //Write the file to the disk
    
}

function getPackInfo(pinfo, type){ //Curse Web Scrapper
    if (type != "icon" || type != "desc"){type = "icon"}
    var $ = cheerio.load(request("GET","https://minecraft.curseforge.com/search?search=" + pinfo.name ).body.toString());
    let i; //Find the pack
    for (i = 0; i < $("td.results-owner").length; i++) { //For Each Pack Owner
     let unt = $("td.results-owner")[i]; //Get the highest Pack Owner tag
     let username = unt.children[0].next.children[0].data.toString(); //Get the actual owner.
      if (username == pinfo.author){ //Check to see if they made the pack
        let atag = unt.prev.prev.children[0].next.children[0].next; //The a link to the project page
        let pname = atag.children[0].data; //The name of the pack
        if (pinfo.name == pname){ //Check the the pack is th right one.
         if (type == "desc"){
              //Get Desciption
              let pblurb = unt.prev.prev.children[0].next.next.next.children[0].data.toString(); //results-summery div, is the last next
              pblurb = pblurb.slice(13, pblurb.length - 9); // cut the weird stuff out
              //console.log(pblurb);
              return pblurb;//Send Back the pack description.
            } else {
                //let pID = atag.attribs.href.split("projectID=")[1]; //The project ID
                let link = "https://minecraft.curseforge.com"+atag.attribs.href; //Get the Project Page
                let $2 =  cheerio.load(request("GET", link).body.toString()); //Get the project Page
                let img = $2("a.e-avatar64")[0].attribs.href; //Get the full url
                let icon = getExt(img, true).fileExt; //Get the icons file exstention
                icon = "icon" + icon; //Set the file exstention
                
                //console.log(wget(img, "./", false, icon).fpath);
                return wget(img, "./", true, icon).fpath; //Get the file and send back the path.
            }
        }
      }
    }
}


//Check URL
if (!churl(curseZipURL)){ //Check URL
    console.warn("Woah there buddy...");
    console.warn("The URL for the Curse Pack (" + curseZipURL + ") is not valid!");
    console.warn("Check the URL and try again.");
    process.exit(1); //Quit
}

//Download and extract the pack

//fget(rurl("https://minecraft.curseforge.com/projects/261519/files/2405939/download"), "./"); //Get the actutal, URL of the file and download it.

