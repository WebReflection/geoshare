"use strict";var _slicedToArray=function(e,t){if(Array.isArray(e))return e;if(Symbol.iterator in Object(e))return function(e,t){var n=[],o=!0,i=!1,r=void 0;try{for(var a,s=e[Symbol.iterator]();!(o=(a=s.next()).done)&&(n.push(a.value),!t||n.length!==t);o=!0);}catch(e){i=!0,r=e}finally{try{!o&&s.return&&s.return()}finally{if(i)throw r}}return n}(e,t);throw new TypeError("Invalid attempt to destructure non-iterable instance")},_templateObject=_taggedTemplateLiteral(['<div id="map"></div>'],['<div id="map"></div>']),_templateObject2=_taggedTemplateLiteral(["\n      <button class=name onclick=",">\n        ","\n      </button>\n      <button class=invite onclick=",">\n        ","\n      </button>\n      <button class=location onclick=",">geo</button>\n    "],["\n      <button class=name onclick=",">\n        ","\n      </button>\n      <button class=invite onclick=",">\n        ","\n      </button>\n      <button class=location onclick=",">geo</button>\n    "]),_templateObject3=_taggedTemplateLiteral(['<div class="popup"><div></div></div>'],['<div class="popup"><div></div></div>']),_templateObject4=_taggedTemplateLiteral(["\n      <input\n        onclick=",'\n        placeholder="say something"\n        maxlength=160\n        name=message\n        autocomplete=off\n        autocorrect=off\n        autocapitalize=off\n      />\n      <input type=submit />\n    '],["\n      <input\n        onclick=",'\n        placeholder="say something"\n        maxlength=160\n        name=message\n        autocomplete=off\n        autocorrect=off\n        autocapitalize=off\n      />\n      <input type=submit />\n    ']);function _toConsumableArray(e){if(Array.isArray(e)){for(var t=0,n=Array(e.length);t<e.length;t++)n[t]=e[t];return n}return Array.from(e)}function _taggedTemplateLiteral(e,t){return Object.freeze(Object.defineProperties(e,{raw:{value:Object.freeze(t)}}))}!function(i,r){function a(e){return i[e]||(o={exports:n={}},r[t=e].call(n,window,a,o,n),i[t]=o.exports);var t,n,o}a.E=function(e){return Object.defineProperty(e,"__esModule",{value:!0})},a.I=function(e){return e.__esModule?e.default:e},a.I(a(0))}([],[function(e,t,n,o){var m=t.I(t(1)),p=t.I(t(4)),i=t.I(t(5)),r=t.I(t(6)),g=t(3).storage,a=t(2),f=(a.HASH,a.IS_GUEST);if(document.addEventListener("DOMContentLoaded",function(e){hyperHTML(document.body)(_templateObject),Promise.all([i.init("map"),r.init()]).then(function(e){var t=_slicedToArray(e,2),n=t[0],i=t[1],r=void 0,o=void 0,a=i.members.me,s=Object.create(null),c=function(e){s[e.id]={id:e.id,name:e.id===a.id?g.get("name",f?"guest":"host"):"guest",marker:null,isHost:!f&&e.id===a.id,channel:i};var t=[];for(var n in s){var o=s[n];o.marker&&t.push({id:o.id,name:o.name,coords:o.marker.getLatLng(),isHost:o.isHost})}i.trigger("client-update-"+e.id,t),r&&r.update()};i.bind("pusher:member_added",c),i.bind("pusher:member_removed",function(e){var t=s[e.id].marker;delete s[e.id],t&&(t.unbindTooltip(),t.removeFrom(n)),r&&r.update()});var l=function(e){e.id in s&&(r&&r.updateUser(s[e.id],e),e.firstTime&&setTimeout(dispatchEvent,500,new CustomEvent("client-bounds")))};i.bind("client-update",l),i.bind("client-update-"+a.id,function(e){e.forEach(l)}),i.members.each(c),r=m(s[a.id]).addTo(n),o=p(s[a.id]).addTo(n),i.bind("client-message",function(e){o.showMessage(e)}),addEventListener("client-bounds",function(){var r=[];i.members.each(function(e){var t=s[e.id];if(t.marker){var n=t.marker.getLatLng(),o=n.lat,i=n.lng;r.push([o,i])}}),1<r.length&&n.flyToBounds(r),f||!o||g.get("clipboard-message")||(g.set("clipboard-message",1),setTimeout(function(){o.showMessage(["Your **URL** has been copied to your device clipboard.","You can share it with friends by simply pasting it."].join("<br>"),!0)},500))});var u=function(){g.set("map-state",JSON.stringify({center:n.getCenter(),zoom:n.getZoom()}))},d=0,h=function(){clearInterval(d),d=setTimeout(u,1e3)};n.on("moveend",h),n.on("zoomend",h),addEventListener("beforeunload",u),addEventListener("geoshare:location",function(){g.get("introduction-1")||setTimeout(function(){g.set("introduction-1",1),o.showMessage("**Welcome** to Geo Share, a **P**rogressive **W**eb **A**pplication\n              to share your location with friends.\n              <hr>\n              Following what you can do as __"+(f?"guest":"host")+"__:<br>\n              <ul>\n                <li> **enable** geo **location** or find yourself in the map by clicking 🌐 </li>\n                <li> **change** your **name** by clicking 👤 </li>\n                <li> **see** all **people** on the map "+(f?"":" and **copy** your URL to share ")+" by clicking 👥 </li>\n                <li> send **messages** to others (bottom left)</li>\n              </ul>",!0)},1e3)}),f||g.get("location")||dispatchEvent(new CustomEvent("geoshare:location"))},console.error)},{once:!0}),"serviceWorker"in navigator)try{navigator.serviceWorker.register("/sw.js?"+encodeURIComponent(location.pathname+location.search))}catch(e){}},function(e,t,n,o){var i=t(2),r=(i.CHANNEL,i.HASH),a=i.IS_GUEST,s=i.IS_SECURE,c=t(3),l=c.copyToClipboard,u=c.storage,d=L.Control.extend({options:{position:"topright"},initialize:function(e){this._user=e,this._timestamp=0,this._coords=null,this._watcher=null,this._persistent=!1,this._noSleeping=!0,this._nosleep=new NoSleep,this._noSleep=function(e){var n=this;if(e.isTrusted){var o=e.currentTarget,i=e.type,r=e.eventPhase===e.CAPTURING_PHASE;if(this._noSleeping){this._nosleep.enable(),this._noSleeping=!1;document.addEventListener("visibilitychange",function e(t){document.hidden?n._noSleeping||(n._noSleeping=!0,n._nosleep.disable()):(document.removeEventListener(t.type,e),o.addEventListener(i,n._noSleep,r))})}o.removeEventListener(i,this._noSleep,r)}}.bind(this)},onAdd:function(e){return this._map=e,this._el=L.DomUtil.create("div","settings"),this.update(),(a||u.get("location"))&&this.handleEvent({type:"click",currentTarget:this._el.querySelector(".location")}),document.addEventListener("touchstart",this._noSleep,!0),document.addEventListener("pointerdown",this._noSleep,!0),this._el},update:function(){hyperHTML(this._el)(_templateObject2,this,this._user.name,this,this._user.channel.members.count,this)},updateUser:function(e,t){t.name&&(e.name=t.name,e.marker&&e.marker.getTooltip().setContent(e.name)),e.isHost&&(document.title="🌐 "+e.name),t.coords&&(e.marker||(e.marker=L.marker(t.coords),e.marker.bindTooltip(e.name,{permanent:!0,direction:"top"}),e.marker.addTo(this._map),t.isHost&&(e.marker._icon.src=e.marker._icon.src.replace("marker","host"))),e.marker.setLatLng(t.coords))},handleEvent:function(e){var t=this;this["on"+e.type+e.currentTarget.className](e),!this._persistent&&navigator.storage&&navigator.storage.persist&&navigator.storage.persist().then(function(e){t._persistent=e})},onclickname:function(e){var t,n=(t=this._user.name,(prompt("your name on the map?",t)||"").replace(/^\s+|\s+$/g,"")||t);if(n!==this._user.name){this._user.name=u.set("name",n),this.update();var o={id:this._user.id,isHost:this._user.isHost,name:n};this.updateUser(this._user,o),this._user.channel.trigger("client-update",o)}dispatchEvent(new CustomEvent("geoshare:install"))},onclickinvite:function(e){if(this._coords){if(!a){var t="".concat(location.protocol,"//",location.host,"/?",r);l(t)}dispatchEvent(new CustomEvent("client-bounds"))}},onclicklocation:function(e){var o=this;if(this._coords)this._map.panTo({lat:this._coords.latitude,lng:this._coords.longitude});else{var i=e.currentTarget;i.disabled=!0,this._watcher&&navigator.geolocation.clearWatch(this._watcher),this._watcher=navigator.geolocation.watchPosition(function(e){i.disabled=!1;var t=!o._coords;if(t&&(u.set("location",1),o._map.setView(h(e.coords),Math.max(16,o._map.getZoom())),dispatchEvent(new CustomEvent("geoshare:location"))),o._coords=e.coords,o.update(),999<Date.now()-o._timestamp){o._timestamp=Date.now();var n={id:o._user.id,name:o._user.name,isHost:o._user.isHost,coords:h(e.coords),firstTime:t};o.updateUser(o._user,n),o._user.channel.trigger("client-update",n)}},function(){i.disabled=!1;var e=o._watcher;o._coords=null,o._watcher=null,e&&navigator.geolocation.clearWatch(e)},{enableHighAccuracy:s,maximumAge:s?0:1/0})}}});function h(e){return{lat:e.latitude,lng:e.longitude}}t.E(o).default=function(e){return new d(e)}},function(e,t,n,o){var i=t(3),r=i.randomValue,a=i.storage,s=/^\?[a-z0-9]{16,}$/i.test(location.search);o.IS_GUEST=s;var c="https:"===location.protocol;o.IS_SECURE=c;var l=a.get("hash",r(40));o.HASH=l;var u="presence-geo-".concat(s?location.search.slice(1):l);o.CHANNEL=u},function(e,t,n,o){o.copyToClipboard=function(e){var t=document.body.appendChild(document.createElement("input"));t.value=e,t.select(),document.execCommand("copy"),document.body.removeChild(t)};var i={get:function(e,t){var n=localStorage.getItem("presence-"+e);return null==n&&t!=n?i.set(e,t):n},set:function(e,t){try{localStorage.setItem("presence-"+e,t)}catch(e){for(var n=[],o=localStorage.length,i=0;i<o;i++){var r=localStorage.key(i);"presence-hash"!==r&&n.push(r)}n.forEach(function(e){return localStorage.removeItem(e)}),alert("Warning: reloading due corrupted storage"),location.reload()}return t}};o.storage=i;o.randomValue=function(e){return escape(String.fromCharCode.apply(String,_toConsumableArray(crypto.getRandomValues(new Uint8Array(e))))).replace(/[^a-zAZ0-9]/g,"")}},function(e,t,n,o){var i=L.Control.extend({options:{position:"bottomleft"},initialize:function(e){this._user=e,this._messages=[],this._showing=!1,this._popup=document.body.appendChild(hyperHTML.wire()(_templateObject3)),this._message=this._popup.firstElementChild},onAdd:function(e){return this._map=e,this._el=L.DomUtil.create("form","messaging"),this._el.addEventListener("submit",this),hyperHTML(this._el)(_templateObject4,function(e){return e.currentTarget.focus()}),this._el},showMessage:function(e,t){var n=this;this._messages.push(lightdown(t?e:e.replace(/[<>]/g,function(e){return{"<":"&lt;",">":"&gt;"}[e]}))),this._showing||(document.hidden||document.msHidden||document.webkitHidden?setTimeout(function(){return n._showMessage()},5e3):this._showMessage())},handleEvent:function(e){var t=this;e.preventDefault();var n=Array.from(e.currentTarget.children),o=_slicedToArray(n,2),i=o[0],r=o[1],a=i.value.trim();if(a.length){160<a.length&&(a=a.slice(0,159)+"…"),i.blur(),i.value="",r.disabled=!0,setTimeout(function(){return r.disabled=!1},1e3);var s="**"+this._user.name+"**: "+a;this._user.channel.trigger("client-message",s),setTimeout(function(){return t.showMessage(s)},250)}},_showMessage:function(){var e=this,t=this._messages.shift();this._showing=!0,this._message.innerHTML=t,this._popup.classList.add("show"),setTimeout(function(){e._popup.classList.remove("show"),setTimeout(function(){e._messages.length?e._showMessage():e._showing=!1},600)},600+Math.min(8e3,30*t.length))}});t.E(o).default=function(e){return new i(e)}},function(e,t,n,o){var i=t(3).storage,r=Object.create(null);t.E(o).default={init:function(n){var o=1<arguments.length&&void 0!==arguments[1]?arguments[1]:JSON.parse(i.get("map-state",JSON.stringify({center:[40,0],zoom:3})));return r[n]||(r[n]=new Promise(function(e){var t=L.map(n,o);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(t),e(t)}))}}},function(e,t,n,o){var i=t(2).CHANNEL,r=void 0;t.E(o).default={init:function(){return r||(r=new Promise(function(t,e){Pusher.logToConsole="localhost"===location.hostname;var n=new Pusher(PUSHER.key,{cluster:PUSHER.cluster,encrypted:PUSHER.encrypted}).subscribe(i);n.bind("pusher:subscription_succeeded",function e(){n.unbind("pusher:subscription_succeeded",e),t(n)})}))}}}]);