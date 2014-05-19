

const {Cc,Ci,CC,Cr,Cu,components} = require("chrome");
const setInterval = require('sdk/timers').setInterval;

Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");
var osString = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS; 
console.log(osString);


var { ActionButton } = require("sdk/ui/button/action");


var button = ActionButton({
  id: "my-button",
  label: "XTTP - Configure in Addons",
  icon: {
    "16": "./xttp-dis-16.png",
    "32": "./xttp-dis-32.png",
    "64": "./xttp-dis-64.png"
  },
  onClick: handleChange
});


function handleChange(state) {
  console.log("clicked");
  console.log(require("sdk/simple-prefs").prefs.apiserver);
  isBTSyncRunning();

}



var prefs = require("sdk/simple-prefs").prefs;

function initBTSyncRunning(){
  const XMLHttpRequest = CC("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");
  console.log(prefs.apiserver);
  var oReq = new XMLHttpRequest();
  oReq.open("GET", prefs.apiserver, false);
  //oReq.open('GET', 'http://localhost:8888/', false);
  oReq.onload = LoadCBK;
  oReq.onerror= ErrorCBK2;
  try{
    oReq.send();
  }catch(err){
    console.log(err);
  }

}


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
      button.icon={
        "16": "./xttp-en-16.png",
        "32": "./xttp-en-32.png",
        "64": "./xttp-en-64.png"
      };
  }else{
    console.log("weird");
    
  }
}

function ErrorCBK(){
  if(prefs.storagepath == "" || prefs.apiserver == "" || prefs.uname=="" || prefs.passwd == "" || prefs.apikey == ""){
    button.icon={
        "16": "./xttp-dis-16.png",
        "32": "./xttp-dis-32.png",
        "64": "./xttp-dis-64.png"
      };
    return;
  }
  createBTSyncConfig();
  if(osString == "WINNT")
    startBTSyncWin();
  else
    startBTSyncNix();

  button.icon={
    "16": "./xttp-en-16.png",
    "32": "./xttp-en-32.png",
    "64": "./xttp-en-64.png"
  };


}

function ErrorCBK2(){
  button.icon={
    "16": "./xttp-dis-16.png",
    "32": "./xttp-dis-32.png",
    "64": "./xttp-dis-64.png"
  };


}


function createBTSyncConfig(){
  json='{ \
        "storage_path" : "' +prefs.storagepath.replace(/\\/g,"/")+ '", \
        "use_gui" : true, \
        "webui" : { \
        "listen" : "'+prefs.apiserver.replace("http://","").replace(/\//g,"").replace("localhost","127.0.0.1")+'", \
        "login": "'+prefs.uname+'", \
        "password" : "'+prefs.passwd+'", \
        "api_key" : "'+ prefs.apikey+'" \
        } \
        }';

        var data = require('sdk/self').data;
        var url = data.url("bt.conf");
        var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
        var fold=prefs.btsitesFolder;
        //fold=fold.replace("\\","/");
        console.log(fold);
        var myURI = ios.newURI("file:///" + fold +"/bt.conf", null, null);
        file = myURI.QueryInterface(Ci.nsIFileURL).file;
        if(!file.exists()){
          file.create(0,0777);
        }
        writeFile(file,json,true,function (status){console.log(status)});
        readFile(file,function (data,status){console.log(data)});



}

function writeFile(nsiFile, data, overwrite, callback) {
          if (!(nsiFile instanceof Ci.nsIFile)) {
        Cu.reportError('ERROR: must supply nsIFile ie: "FileUtils.getFile(\'Desk\', [\'rawr.txt\']" OR "FileUtils.File(\'C:\\\\\')"');
        return;
    }
    if (overwrite) {
        var openFlags = FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE;
    } else {
        var openFlags = FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_APPEND;
    }
          var ostream = FileUtils.openFileOutputStream(nsiFile, openFlags)
    var converter = Cc['@mozilla.org/intl/scriptableunicodeconverter'].createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = 'UTF-8';
    var istream = converter.convertToInputStream(data);
       NetUtil.asyncCopy(istream, ostream, function (status) {
        if (!components.isSuccessCode(status)) {
                       Cu.reportError('error on write isSuccessCode = ' + status);
            callback(status);
            return;
        }
               callback(status)
    });
}

function readFile(file, callback) {
                NetUtil.asyncFetch(file, function (inputStream, status) {
               if (!components.isSuccessCode(status)) {
            Cu.reportError('error on file read isSuccessCode = ' + status);
            callback(null, status)
            return;
        }
        var data = NetUtil.readInputStreamToString(inputStream, inputStream.available());
        callback(data, status);
    });
}
//Funtion to start the BtSync application for windows
function startBTSyncWin(){
  var file = Cc["@mozilla.org/file/local;1"]
                       .createInstance(Ci.nsIFile);
  
  file.initWithPath(prefs.btSyncEXE);
  var process = Cc["@mozilla.org/process/util;1"]
                          .createInstance(Ci.nsIProcess);
  process.init(file);
  
  var args = ['/config', prefs.btsitesFolder + "\\bt.conf"];
  process.run(false, args, 2);


}

function startBTSyncNix(){
  var file = Cc["@mozilla.org/file/local;1"]
                       .createInstance(Ci.nsIFile);
  
  file.initWithPath(prefs.btSyncEXE);
  var process = Cc["@mozilla.org/process/util;1"]
                          .createInstance(Ci.nsIProcess);
  process.init(file);
  
  var args = ['--config', prefs.btsitesFolder + "/bt.conf"];
  process.run(false, args, 2);


}
var i=0;
function checkIfActive(){
  console.log("Check Active" + i++);
  initBTSyncRunning();
  //setTimeout(checkIfActive(),50000);
}

setInterval(checkIfActive, 5000);



require("./proto.js");
