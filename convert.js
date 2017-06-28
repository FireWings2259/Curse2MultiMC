/*Convert.js
This program will take a curse instance and create a MultiMC instance.
Made by FireWings.
*/

//Requirements
const fireLib = require("./fireLib.js");
const fs = require('fs-extra');
const reload = require('require-reload')(require);
const AdmZip = require('adm-zip');
const fZipC = require("zip-folder");
const churl = require('valid-url').isUri;
const request = require('sync-request');
const cheerio = require('cheerio');

const getExt = fireLib.getExt;
const wget = fireLib.wget; //My wget function
const rurl = fireLib.rurl; //My check URL function
const getTZDate = fireLib.getTZDate; //My TZ-Date Function
const mkdir = fs.ensureDirSync; //Make directory
const rm = fs.removeSync; //delete file/folder

//fZipC to Promise
function fZip (path, zip) {
  return new Promise(function (resolve, reject) {
    fZipC(path, zip, function (err, zip) {
      if (err) return reject(err); // rejects the promise with "err" as the reason
      resolve(zip); //fulfills the promise with the zip file path as the value
    });
  });
}

//Vars
var curseZipURL = "url"; //The curse zip url
//var fireOpt = false; //Do I put in my default configs? //Nope

//First Run
if (!fs.existsSync("./tmp/")){
    console.log("First Run!");
    console.log("Creating Folders/Files");
    fs.ensureDirSync("./tmp");
    fs.ensureDirSync("./mmc-packs");
}

function buildinstance(czipPath, tmp, mmc_packs, tz, user, dvc){
    //Setup workspace
    if (typeof(tmp) !== String){tmp = "./tmp/"} //Set tmp if not given
    if (typeof(mmc_packs) !== String){mmc_packs = "./mmc-packs"} //Set mmc_packs if not given
    if (dvc !== true){dvc = false}//Sets dvc (Disable Version Check) to false.
    let zipName = czipPath.split('\\').pop().split('/').pop().split(".zip")[0]; //Get the zips file name (without the .zip)
    let wpath = tmp + zipName; //Set the workspace
    let ppath = wpath + "/MMC-" + zipName; //Build the path for the MMC Instance (This will be zipped)
    let mpath = ppath + "/minecraft/mods"; //The mods folder
    mkdir(ppath); //Create pack path
    
    //Do some checks
    let czip = new AdmZip(czipPath); //load zip
    czip.extractEntryTo("manifest.json", wpath, false, true); //Get Manfest File
    let pinfo = reload(wpath + "/manifest.json"); //useing reload just in case things get derpy, if they dont then it will be removed... [TODO] Test That...[/TODO]
    if (pinfo.manifestType != "minecraftModpack"){ //Check if modpack
        console.log("Ah Wat\?");
        console.log("This zip, " + zipName + ", is not a curse modpack!");
        console.log("I can\'t do anything with this. \:\(");
        return new Error("Not Valid Pack");
    }
    if (pinfo.minecraft.modLoaders[0].id.split("-")[0] != "forge"){ //check if forge
        console.log("The cake is a lie...");
        console.log("Sorry to tell you but I can only convert Forge based packs");
        rm(czipPath);
        rm(wpath);
        return new Error("Not Forge Pack");
    }
        if (Number(pinfo.minecraft.version.split(".")[1]) <= 11 || dvc){ //check if below mc ver 1.12.*
        console.log("Han Shot First!");
        console.log("So this file is for MC " + pinfo.minecraft.version + ", I can\'t do anything with that.");
        console.log("Packs have to be for MC 1.11.2 or lower.");
        rm(czipPath);
        rm(wpath);
        return new Error("Pack Too New");
    }
    
    
    //Get Configs \ Other MC Base Files From Curse Instance
    let overrides = pinfo.overrides;
    let zipEntries = czip.getEntries(); //get the file array
    zipEntries.forEach(function(zipEntry) { //for ech file
        if (zipEntry.entryName.toString().indexOf(overrides + "/") >= 0 && !zipEntry.isDirectory) { //Where the file is in the overrides folder and the file is not a folder
             czip.extractEntryTo(zipEntry.entryName, ppath, true, true); //Extractit it to the tmp
        }
    });
    
    //Build Minecraft/Pack folder, grab the pack info and create required files.
    fs.renameSync(ppath + "/" + overrides, ppath + "/minecraft");
    mkdir(mpath); //Make mods folder for later
    mkdir(ppath + "/patches"); //make the Patches Folder
    let icon = getPackInfo(pinfo, "icon", ppath); // Set/get the Icon File from curse
    let nicon = icon.fileName; // Get name of icon file
    fs.appendFileSync(ppath + "/.packignore", "\n"); //Make the .packignore file
   
    
    //Build the instance.cfg file
    let incfg = "InstanceType=OneSix"; //Set Header Stuff
    incfg += "\nIntendedVersion=" + pinfo.minecraft.version; //Set MC Version
    incfg += "\niconKey=" + nicon; //Set Pack Icon
    incfg += "\nname=" + pinfo.name; //Set Pack Name
    incfg += "\nnotes=" + pinfo.name + " Version: " + pinfo.version + " Author :" + pinfo.author + "\\n\\n " + getPackInfo(pinfo, "desc") + "\\n\\nThis pack was created on " + getTZDate(tz) + "\\nusing FireWings, Curse2MultiMC Converter."; //Add Info
    if (user !== undefined){incfg += "\\nThe instance was created by the user: " + user} //If a user was supplied add that
    incfg += "\n"; //Close with the new line
    fs.appendFileSync(ppath + "/instance.cfg", incfg); //Write the file to the disk
    
    //Build the net.minecraftforge.json file
    mkdir(ppath + "/patches"); //Make the Patches Folder
    //Build a the file (I know its not set out right...)
    //NOTE: This JSON was made 28/6/17, It may break later on in the future.
    let tfjson = {"+libraries":[
            {"name":"net.minecraftforge:forge:"+ pinfo.minecraft.version + "-" + pinfo.minecraft.modLoaders[0].id.split("forge-")[1] + ":universal",
            "url":"http://files.minecraftforge.net/maven/"},{"name":"net.minecraft:launchwrapper:1.12"},
            {"name":"org.ow2.asm:asm-all:5.0.3"},
            {"name":"jline:jline:2.13","url":"http://files.minecraftforge.net/maven/"},
            {"MMC-hint":"forge-pack-xz","name":"com.typesafe.akka:akka-actor_2.11:2.3.3",
            "url":"http://files.minecraftforge.net/maven/"},
            {"MMC-hint":"forge-pack-xz","name":"com.typesafe:config:1.2.1",
            "url":"http://files.minecraftforge.net/maven/"},
            {"MMC-hint":"forge-pack-xz","name":"org.scala-lang:scala-actors-migration_2.11:1.1.0",
            "url":"http://files.minecraftforge.net/maven/"},{"MMC-hint":"forge-pack-xz",
            "name":"org.scala-lang:scala-compiler:2.11.1","url":"http://files.minecraftforge.net/maven/"},
            {"MMC-hint":"forge-pack-xz","name":"org.scala-lang.plugins:scala-continuations-library_2.11:1.0.2",
            "url":"http://files.minecraftforge.net/maven/"},{"MMC-hint":"forge-pack-xz",
            "name":"org.scala-lang.plugins:scala-continuations-plugin_2.11.1:1.0.2",
            "url":"http://files.minecraftforge.net/maven/"},{"MMC-hint":"forge-pack-xz",
            "name":"org.scala-lang:scala-library:2.11.1","url":"http://files.minecraftforge.net/maven/"},
            {"MMC-hint":"forge-pack-xz","name":"org.scala-lang:scala-parser-combinators_2.11:1.0.1",
            "url":"http://files.minecraftforge.net/maven/"},{"MMC-hint":"forge-pack-xz",
            "name":"org.scala-lang:scala-reflect:2.11.1","url":"http://files.minecraftforge.net/maven/"},
            {"MMC-hint":"forge-pack-xz","name":"org.scala-lang:scala-swing_2.11:1.0.1",
            "url":"http://files.minecraftforge.net/maven/"},{"MMC-hint":"forge-pack-xz",
            "name":"org.scala-lang:scala-xml_2.11:1.0.2","url":"http://files.minecraftforge.net/maven/"},
            {"name":"lzma:lzma:0.0.1"},{"name":"net.sf.jopt-simple:jopt-simple:4.6"},
            {"name":"java3d:vecmath:1.5.2"},{"name":"net.sf.trove4j:trove4j:3.0.3"}],
            "+tweakers":["net.minecraftforge.fml.common.launcher.FMLTweaker"],"fileId":"net.minecraftforge",
            "mainClass":"net.minecraft.launchwrapper.Launch","mcVersion":pinfo.minecraft.version,
            "name":"Forge","order":5,"version": pinfo.minecraft.version + "-" + pinfo.minecraft.modLoaders[0].id.split("forge-")[1]
            };
    tfjson = JSON.stringify(tfjson);
    fs.appendFileSync(ppath + "/patches/net.minecraftforge.json", tfjson);
        
    //Download all the files needed....
    let i;
    let pfilesp = [];
    for (i=0; i >= pinfo.files.length; i++){
        pfilesp.push(new Promise(function(complete, fail){ //Put Each File in a Promise
            try{
                wget(rurl("https://minecraft.curseforge.com/projects/" + pinfo.files[i].projectID + "/files/" + pinfo.files[i].fileID + "/download", mpath)); //Get the File
            } catch(e){
                //console.log("He did it!");
                //console.log(e);
                fail(e);
            }
        }));
    }
    
    let dProm = Promise.all(pfilesp); //Run Them All together
    dProm.then(makePack(ppath, wpath, zipName, mmc_packs, czipPath), console.error); //Then run clean up
}

//Get Pack info
function getPackInfo(pinfo, type, path){ //Curse Web Scrapper
    if (type != "icon" || type != "desc"){type = "desc"}
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
                //let pID = atag.attribs.href.split("projectID=")[1]; //The project ID, Not required
                let link = "https://minecraft.curseforge.com"+atag.attribs.href; //Get the Project Page
                let $2 =  cheerio.load(request("GET", link).body.toString()); //Get the project Page
                let img = $2("a.e-avatar64")[0].attribs.href; //Get the full url
                let icon = getExt(img, true).fileExt; //Get the icons file exstention
                icon = "icon" + icon; //Set the file exstention
                
                //console.log(wget(img, "./", false, icon).fpath);
                return wget(img, path, true, icon); //Get the icon and store the file
            }
        }
      }
    }
}

//Make Instance and clean up
function makePack(ppath, wpath, zipName, mmc_packs, czipPath){
    mkdir(wpath + "/ZIP"); //Make the zip path
    fs.renameSync(ppath, wpath + "/ZIP/MMC-" + zipName); //Move the zip path
    fZip(wpath + "/ZIP/MMC-" + zipName + "/", mmc_packs + "/MMC-" + zipName + ".zip") //Compress the Folder
    .then(function(){
        rm(wpath); //Delete the workspace
        rm(czipPath); //Delete the CurseZip
        console.log("Workspace Gone!");
        console.log("Pack Made!");
    });
    
}



//Check URL
if (!churl(curseZipURL)){ //Check URL
    console.warn("Woah there buddy...");
    console.warn("The URL for the Curse Pack (" + curseZipURL + ") is not valid!");
    console.warn("Check the URL and try again.");
    return new Error("Not Valid URL");
}

//Download and extract the pack

//fget(rurl("https://minecraft.curseforge.com/projects/261519/files/2405939/download"), "./"); //Get the actutal, URL of the file and download it.

