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

var fget = fireLib.wget; //Might use http.get process yet... not sure
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
    let incfg = "InstanceType=OneSix"; 
    incfg += "\nIntendedVersion=" + pinfo.minecraft.version;
    incfg += "\niconKey=" + nicon;
    incfg += "\nname=" + pinfo.name;
    incfg += "\nnotes=" + pinfo.name + " Version: " + pinfo.version + "\\n\\nThis pack was created on " + getTZDate(tz) + "\\nusing FireWings, Curse2MultiMC Converter.";
    if (user !== undefined){incfg += "\\nThe instance was created by the user: " + user}
    incfg += "\n";
    
    fs.appendFileSync(ppath + "/instance.cfg", incfg); 
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

