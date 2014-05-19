

function xmlhttpget(url, callback) {
    //log("get");

    var oReq = new XMLHttpRequest();
    oReq.open("GET", url, false);
    oReq.onload = callback;
    oReq.onerror = function (data) {
        console.log("error in xmlhttpget");
    };
    oReq.async = false;
    oReq.send();
}
function getBtSyncFolders(){
	document.getElementById('table').innerHTML(this.responseText);
}
xmlhttpget( "http://127.0.0.1:8888/api?method=get_folders", getBtSyncFolders);


