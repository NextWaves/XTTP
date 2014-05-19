
const protocol = require('./index');
const {
    Cc, Ci, CC, Cr, Cu, components
} = require("chrome");
var data = require('sdk/self').data;

var ConfirmBox = require("sdk/panel").Panel({
    contentURL: data.url("prefs.html")
});


function xmlhttppost(url, data, callback) {
    const XMLHttpRequest = CC("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");

    var oReq = new XMLHttpRequest();
    oReq.open("POST", url, false);
    oReq.onload = callback;
    oReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    oReq.async = false;
    oReq.send(data);
}

function xmlhttpget(url, callback) {
    log("get");
    const XMLHttpRequest = CC("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");
    var oReq = new XMLHttpRequest();
    oReq.open("GET", url, false);
    oReq.onload = callback;
    oReq.onerror = function (data) {
        console.log("error in xmlhttpget");
    };
    oReq.async = false;
    oReq.send();
}

var sites_path = "";
var btsync_URL = "";
var btsync_DNS = "https://www.meshedsites.com/home/aliasService.php";

function updatePrefs() {
    prefs = require("sdk/simple-prefs").prefs;
    //var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.xttp.");
    sites_path = prefs.btsitesFolder;
    btsync_URL = prefs.apiserver;
    if(sites_path == "" || btsync_URL == ""){
        return false;
    }

    //btsync_DNS = prefs.aliasService;

    sites_path = sites_path.replace(/\\/g, "/");
    last = sites_path.substr(sites_path.length - 1);
    if (last != "/")
        sites_path += "/";


    last = btsync_URL.substr(btsync_URL.length - 1);
    if (last != "/")
        btsync_URL += "/";
    return true;


}

function log(message) {
    console.log(">>>>" + message);
}

const nsIProtocolHandler = Ci.nsIProtocolHandler;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");



function BtLookUpService(domain) {
    this.pfDomain = domain;
}
BtLookUpService.prototype.that = this;
BtLookUpService.prototype.Key = "";
BtLookUpService.prototype.Folder = "";
BtLookUpService.prototype.pfSecret = "";
BtLookUpService.prototype.pfDomain = "";
BtLookUpService.prototype.noData = "";
BtLookUpService.prototype.isOwner = "false";
BtLookUpService.prototype.setPfDomain = function (domain) {
    this.pfDomain = domain;
};
BtLookUpService.prototype.setPfSecret = function (secret) {
    this.pfSecret = secret;
};
BtLookUpService.prototype.getPfDomain = function () {
    return this.pfDomain;
};
BtLookUpService.prototype.getPfSecret = function () {
    return this.pfSecret;
};
BtLookUpService.prototype.setKey = function (data) {
    this.Key = data;
};
BtLookUpService.prototype.getKey = function () {
    return this.Key;
};
BtLookUpService.prototype.setFolder = function (data) {
    this.Folder = data
};
BtLookUpService.prototype.getFolder = function () {
    return this.Folder;
};
BtLookUpService.prototype.BTDNSExists = false;
BtLookUpService.prototype.Folders = [];
BtLookUpService.prototype.getBtSyncKey = function () {
    log("getBtSyncKey");
    var data = JSON.parse(this.responseText);
    if (data[0].key == "") {
        myObject.BTDNSExists = false;
    } else {
        var btkey = data[0].key;
        myObject.setPfSecret(btkey);
        myObject.BTDNSExists = true;

    }
};
BtLookUpService.prototype.checkIndex = function () {
    log("check index");
    if (this.getPfDomain().indexOf("$") != 0) {
        //var file = new FileUtils.File(sites_path + "/" +this.getPfDomain() + "/index.html");
        var file;
        try {
            //var file = new FileUtils.File(sites_path + "/" + dm + "/index.html");
            var ios = components.classes["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
            log("file://" + sites_path + this.getPfDomain() + "/index.html");
            var myURI = ios.newURI("file://" + sites_path + this.getPfDomain() + "/index.html", null, null);
            file = myURI.QueryInterface(Ci.nsIFileURL).file;
        } catch (err) {
            log(err);
        }
        log("index::" + this.getPfDomain());

        if (file.exists()) {
            this.Folder = this.getPfDomain();
            return true;
        } else {
            log("INDEX::false");
            return false;
        }
    } else { //Check if it exists by a different name
        xmlhttpget(btsync_URL + "api?method=get_folders", myObject.getBtSyncFolders);
        if (this.FolderExists()) {
            return true;
        } else {
            return false;
        }

    }
};

BtLookUpService.prototype.getBtSyncFolders = function () {
    log("getBtSyncFolders");
    myObject.Folders = JSON.parse(this.responseText);
};
BtLookUpService.prototype.queryBTDNS = function () {

    log("query bts");
    //Call btns lookup service
    xmlhttppost(btsync_DNS, "alias=" + this.pfDomain, this.getBtSyncKey);
    return this.BTDNSExists;
};
BtLookUpService.prototype.isLocalDomain = function () {
    log("is local domain" + sites_path);
    var dm = this.pfDomain;
    var file;
    try {
        //var file = new FileUtils.File(sites_path + "/" + dm + "/index.html");
        var ios = components.classes["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        console.log("Sites path:::file://" + sites_path + dm + "/index.html");
        var myURI = ios.newURI("file://" + sites_path + dm + "/index.html", null, null);
        file = myURI.QueryInterface(Ci.nsIFileURL).file;
    } catch (err) {
        log(err);
    }
    log(sites_path + dm + "/index.html");
    if (file.exists())
        return true;
    else
        return false;
};
BtLookUpService.prototype.FolderExists = function () {
    log("FolderExists");
    var data = this.Folders;
    dm = this.getPfDomain();
    for (var i in data) {
        if (data[i].dir.indexOf(dm) > -1) {
            this.Folder = data[i].dir.replace(sites_path, '');
            return true;
        }
    }
    for (var i in data) {
        if (data[i].secret == dm) {
            this.Folder = data[i].dir.replace(sites_path, '');

            return true;
        }
    }
    return false;
};
BtLookUpService.prototype.checkBTSync = function () {
    log("checkBtSync");


    //Check if we have started downloading the files
    xmlhttpget(btsync_URL + "api?method=get_folders", this.getBtSyncFolders);
    log("what");

    if (this.FolderExists()) {
        log("Folder Exists");
        return;
    } else {

        log("Folder Does not Exists");
        var path = sites_path + this.getPfDomain();
        log(path);
        var file;
        try {
            //var file = new FileUtils.File(sites_path + "/" + dm + "/index.html");
            var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
            var myURI = ios.newURI("file://" + path, null, null);
            file = myURI.QueryInterface(Ci.nsIFileURL).file;
        } catch (err) {
            log(err);
        }


        // var file = new FileUtils.File(path);
        if (!file.exists()) {
            file.create(1, 0777);
        }

        //Add the site to BtSync
        log("secret is " + this.getPfSecret());
        log(btsync_URL + "api?method=add_folder&secret=" + this.getPfSecret() + "&dir=" + path);
        xmlhttpget(btsync_URL + "api?method=add_folder&secret=" + this.getPfSecret() + "&dir=" + path, null);


    }
};



var isAPIRunning=false;
function isBTSyncRunning(){
  const XMLHttpRequest = CC("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");
  var oReq = new XMLHttpRequest();
  oReq.open("GET", prefs.apiserver, false);
  oReq.onload = LoadCBK;
  oReq.onerror= ErrorCBK;
  try{
   oReq.send();
 }catch(err){
  ErrorCBK();
  console.log(err);
 }
}

 function LoadCBK(){
  console.log("Loaded");
  if(this.responseText.indexOf("invalid request") > -1){
    console.log("running");
    isAPIRunning=true;
  }else{
    console.log("weird");
    
  }
}
function ErrorCBK(){
  isAPIRunning=false;
}



exports.handler = protocol.protocol('xttp', {
    onRequest: function (request, response) {
        var data = require('sdk/self').data;
        if(!updatePrefs()){
            response.uri = data.url("Error3.html");
            return;
        }

        isBTSyncRunning();
        var uri = request.uri;
        loc = uri.replace("xttp://", "");
        btdomain = loc.substring(0, loc.indexOf("/"));
        console.log('>>>', btdomain);
        path = loc.replace(btdomain, "");
        path = path.replace(/#.*$/,"");
        if (path == "" || path == "/")
            path = "/index.html";

        // redirect
        myObject = new BtLookUpService(btdomain);
        log("created Object");
        log("domain " + btdomain);

        if (myObject.isLocalDomain()) {
            log("local file found");
            response.uri = 'file://' + sites_path + "/" + btdomain + path;

        } else { //File does not exist locally
            log("Does not exist");
            if(!isAPIRunning){
              
              response.uri = data.url("Error2.html");
            }
            else if (myObject.queryBTDNS()) { //Does it exist on the DNS
                log("BTKEY Exists");
                if (myObject.checkIndex()) { //Check if index file exists... basic identifier that the site is installed
                    response.uri = 'file://' + sites_path + "/" + myObject.Folder + everything_else;

                } else { //Site not installed yet... show a loading screen that refreshes untill the site is loaded

                    myObject.checkBTSync(); //Check BtSync for entry otherwise create it
                    
                    response.uri = data.url("Loading.html");
                }

            } else { //No site exists in DNS... return error
                log("Does not exist anywhere");

                
                response.uri = data.url("Error.html");

            }

        }

    }
});

exports.handler.register() // start listening
// exports.handler.unregister() // stop listening
//require('sdk/tabs').open('xttp://waves.my.blog')

/*exports.handler2 = protocol.protocol('btsync', {
    onRequest: function (request, response) {
        var data = require('sdk/self').data;
        updatePrefs();
        isBTSyncRunning();
        var uri = request.uri;
        console.log(uri);
        if(uri.indexOf("btsync://sites") > -1){
            response.uri = data.url("sites.html");
            require("sdk/tabs").activeTab.attach({
                contentScript: 'document.body.style.border = "5px solid red";'
                });

        }else{
            response.uri = data.url("Error.html");
        }
        

    }
});

exports.handler2.register()*/