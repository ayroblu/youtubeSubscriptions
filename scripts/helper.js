function geid(id) {
  return document.getElementById(id);
}
function qget(id) {
  return document.querySelector(id);
}
function qgeta(id) {
  return document.querySelectorAll(id);
}
function ce(id) {
  return document.createElement(id);
}
Element.prototype.qget = function(id){
  return this.querySelector(id);
};
Element.prototype.qgeta = function(id){
  return this.querySelectorAll(id);
};
function objToParams(obj){
  var url = Object.keys(obj).map(function(k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent((typeof obj[k] === 'object') ? JSON.stringify(obj[k]) : obj[k]);
  }).join('&');
  if (url)
    url = "?" + url;

  return url;
}
function clone(objectToBeCloned) {
  // Basis.
  if (!(objectToBeCloned instanceof Object)) {
    return objectToBeCloned;
  }

  var objectClone;
  
  // Filter out special objects.
  var Constructor = objectToBeCloned.constructor;
  switch (Constructor) {
    // Implement other special objects here.
    case RegExp:
      objectClone = new Constructor(objectToBeCloned);
      break;
    case Date:
      objectClone = new Constructor(objectToBeCloned.getTime());
      break;
    default:
      objectClone = new Constructor();
  }
  
  // Clone each property.
  for (var prop in objectToBeCloned) {
    objectClone[prop] = clone(objectToBeCloned[prop]);
  }
  
  return objectClone;
}

/**
 * This method performs a get request on the provided url
 *
 * @method ajaxGet
 * @param {String} url is the url to push
 * @param {Function} The callback function that takes a string
 */
function ajaxGet(url,onFinish, onError, onProgress) {
  var currentPage = location.pathname;
  var xmlhttp;
  if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp=new XMLHttpRequest();
  } else {// code for IE6, IE5
    xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.onreadystatechange=function(){
    if (xmlhttp.readyState==4 && xmlhttp.status==200){
      onFinish(xmlhttp.responseText);
    } else if (xmlhttp.readyState == 4 && onError) {
      console.log("Status code: " + xmlhttp.status);
      onError();
    }
  }
  xmlhttp.onprogress=onProgress
  // if (oEvent.lengthComputable)
  //   var percentComplete = oEvent.loaded / oEvent.total;
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}
function ajaxPost(url, jsonData, onFinish, onError, onProgress) {
  var currentPage = location.pathname;
  var xmlhttp;
  if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp=new XMLHttpRequest();
  } else {// code for IE6, IE5
    xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
  xmlhttp.onreadystatechange=function(){
    if (sameUrl && currentPage != location.pathname && currentPage != url){
      console.log('Old Page: ' + currentPage + ', currentPage: ' + location.pathname + ', url: ' + url);
      this.abort();
      if (lb)
        updateLoadingBar(4);
      return;
    }

    if (xmlhttp.readyState==4 && xmlhttp.status==200){
      if (lb)
        updateLoadingBar(xmlhttp.readyState);
      onFinish(xmlhttp.responseText);
      if (lb)
        updateLoadingBar(-1);
    } else if (xmlhttp.readyState == 4 && onError) {
      if (lb)
        updateLoadingBar(xmlhttp.readyState);
      console.log("Status code: " + xmlhttp.status);
      if (onError)
        onError();
      if (lb)
        updateLoadingBar(-1);
    } else {
      if (lb)
        updateLoadingBar(xmlhttp.readyState);
    }
  }
  xmlhttp.open("POST", url, true);
  xmlhttp.setRequestHeader("Content-type","application/json");
  //xmlhttp.setRequestHeader("Authorization", "key=AIzaSyAUL00gJPrDZ-zCUm0Y__lm8G-Slt_Yh4s");
  if (typeof jsonData != "string")
    jsonData = JSON.stringify(jsonData);

  xmlhttp.send(jsonData);
}
function getDt() {
  var d = new Date();
  return d.toJSON().slice(0,10) + " " + d.toJSON().slice(11,19)
}
function addOnClickListener(item, func) {
  if (item.addEventListener) {   // For all major browsers, except IE 8 and earlier
    item.addEventListener("click", func);
  } else if (item.attachEvent) { // For IE 8 and earlier versions
    item.attachEvent("onclick", func);
  }
}
/* {
  'innerHTML': "..."
  ,'innerText': "..."
  ,'attributes': {
    'id': "idnum"
    , 'type': "sometype"
  }
} */
function createLi(params) {
  var li = document.createElement("li");
  if (params.innerHTML)
    li.innerHTML = params.innerHTML;
  else
    li.innerText = params.innerText;
  for(var key in params.attributes) {
    if (params.attributes.hasOwnProperty(key)) {
      li.setAttribute(key,params.attributes[key]);
    }
  }
  return li
}

function updateLoadingBar(state) {
  lb = qget('.loadingbar');
  lb.classList.remove('notinit')
  lb.classList.remove('connest')
  lb.classList.remove('reqrec')
  lb.classList.remove('procreq')
  lb.classList.remove('reqfin')
  if (state == 0) {
    lb.classList.add('notinit')
  } else if (state == 1) {
    lb.classList.add('connest')
  } else if (state == 2) {
    lb.classList.add('reqrec')
  } else if (state == 3) {
    lb.classList.add('procreq')
  } else if (state == 4) {
    lb.classList.add('reqfin')
  }
}
function numberWithCommas(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
