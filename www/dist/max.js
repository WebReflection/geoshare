'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _templateObject = _taggedTemplateLiteral(['\n      <button class=name onclick=', '>\n        ', '\n      </button>\n      <button class=invite onclick=', '>\n        ', '\n      </button>\n      <button class=location onclick=', '>geo</button>\n    '], ['\n      <button class=name onclick=', '>\n        ', '\n      </button>\n      <button class=invite onclick=', '>\n        ', '\n      </button>\n      <button class=location onclick=', '>geo</button>\n    ']),
    _templateObject2 = _taggedTemplateLiteral(['<div class="popup"><div></div></div>'], ['<div class="popup"><div></div></div>']),
    _templateObject3 = _taggedTemplateLiteral(['\n      <input\n        onclick=', '\n        placeholder="say something"\n        maxlength=160\n        name=message\n        autocomplete=off\n        autocorrect=off\n        autocapitalize=off\n      />\n      <input type=submit />\n    '], ['\n      <input\n        onclick=', '\n        placeholder="say something"\n        maxlength=160\n        name=message\n        autocomplete=off\n        autocorrect=off\n        autocapitalize=off\n      />\n      <input type=submit />\n    ']);

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

(function (cache, modules) {
  function require(i) {
    return cache[i] || get(i);
  }
  function get(i) {
    var exports = {},
        module = { exports: exports };
    modules[i].call(exports, window, require, module, exports);
    return cache[i] = module.exports;
  }
  require.E = function (exports) {
    return Object.defineProperty(exports, '__esModule', { value: true });
  };
  require.I = function (m) {
    return m.__esModule ? m.default : m;
  };
  return require.I(require(0));
})([], [function (global, require, module, exports) {
  // main.js
  'use strict';

  var settings = require.I(require(1));
  var messaging = require.I(require(4));
  var leaflet = require.I(require(5));
  var pusher = require.I(require(6));

  var _require = require(3),
      storage = _require.storage;

  var _require2 = require(2),
      HASH = _require2.HASH,
      IS_GUEST = _require2.IS_GUEST;

  document.addEventListener('DOMContentLoaded', function (event) {
    // both leaflet and pusher might have
    // some asynchronous initialization
    // wait for both of them, then kickstart the App
    Promise.all([leaflet.init('map'), pusher.init()]).then(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          map = _ref2[0],
          channel = _ref2[1];

      // settings and messaging
      // are two Leflet plugins
      var splugin = void 0,
          mplugin = void 0;
      var me = channel.members.me;
      // the list of users on the map
      var users = Object.create(null);
      // each user/member has an id, a name,
      // a marker on the map, an isHost info,
      // and a reference to the channel.
      var addMember = function addMember(member) {
        users[member.id] = {
          id: member.id,
          name: member.id === me.id ? storage.get('name', IS_GUEST ? 'guest' : 'host') : 'guest',
          marker: null,
          isHost: !IS_GUEST && member.id === me.id,
          channel: channel
        };
        // first time a new user is added
        // and connected, it surely wants
        // to know about all other users
        // already available on the map.
        // This loop collects all known users
        // that shared location and have a marker
        // and it send it back to the member
        // that has been just added.
        var broadcast = [];
        for (var id in users) {
          var user = users[id];
          if (user.marker) {
            // basic info to show a user on the map
            broadcast.push({
              id: user.id,
              name: user.name,
              coords: user.marker.getLatLng(),
              isHost: user.isHost
            });
          }
        }
        channel.trigger('client-update-' + member.id, broadcast);
        if (splugin) splugin.update();
      };

      // handle new members and also those removed
      channel.bind('pusher:member_added', addMember);
      channel.bind('pusher:member_removed', function (member) {
        var marker = users[member.id].marker;

        delete users[member.id];
        if (marker) {
          marker.unbindTooltip();
          marker.removeFrom(map);
        }
        if (splugin) splugin.update();
      });

      // update a user on the map via settings plugin
      // it also fly on users if the user is new
      var updateClient = function updateClient(client) {
        if (splugin) splugin.updateUser(users[client.id], client);
        if (client.firstTime) setTimeout(dispatchEvent, 500, new CustomEvent('client-bounds'));
      };
      channel.bind('client-update', updateClient);
      channel.bind('client-update-' + me.id, function (clients) {
        clients.forEach(updateClient);
      });

      // per each member of the channel,
      // create all related users
      channel.members.each(addMember);

      // initialize the two leaflet plugins
      splugin = settings(users[me.id]).addTo(map);
      mplugin = messaging(users[me.id]).addTo(map);

      // also show messages as these come
      channel.bind('client-message', function (message) {
        mplugin.showMessage(message);
      });

      // fly to all known users when client-bounds
      // event is triggered
      addEventListener('client-bounds', function () {
        var bounds = [];
        channel.members.each(function (member) {
          var user = users[member.id];
          if (user.marker) {
            var _user$marker$getLatLn = user.marker.getLatLng(),
                lat = _user$marker$getLatLn.lat,
                lng = _user$marker$getLatLn.lng;

            bounds.push([lat, lng]);
          }
        });
        if (bounds.length > 1) map.flyToBounds(bounds);
        if (!IS_GUEST && mplugin) mplugin.showMessage(['Your **URL** has been copied to your device clipboard.', 'You can share it with friends by simply pasting it.'].join('<br>'), true);
      });

      // store map state to have right back next time
      // a user visit/use the Web App.
      var setMapState = function setMapState() {
        storage.set('map-state', JSON.stringify({
          center: map.getCenter(),
          zoom: map.getZoom()
        }));
      };
      // no need to be greedy on localStorage
      // defer as much as needed the save operation
      var updateTimer = 0;
      var updateMapState = function updateMapState() {
        clearInterval(updateTimer);
        updateTimer = setTimeout(setMapState, 1000);
      };

      // update the state on each moveend and/or zoomend
      map.on('moveend', updateMapState);
      map.on('zoomend', updateMapState);
      // also try to do the same if the user closes the browser
      addEventListener('beforeunload', setMapState);

      // show an introductory message.
      // it's numbered so next time I update something
      // I can simply use introduction-X if introduction-Y
      // was already there, or use previous introduction
      // and show next one the next time.
      if (!storage.get('introduction-1')) {
        setTimeout(function () {
          storage.set('introduction-1', 1);
          mplugin.showMessage('**Welcome** to Geo Share, a **P**rogressive **W**eb **A**pplication\n            to share your location with friends.\n            <hr>\n            Following a list of what you can do as __' + (IS_GUEST ? 'guest' : 'host') + '__:<br>\n            <ul>\n              <li> change your name by clicking \uD83D\uDC64 </li>\n              <li> see all people on the map ' + (IS_GUEST ? '' : ' and **copy** your URL to share ') + ' by clicking \uD83D\uDC65 </li>\n              <li> enable geo location or find yourself in the map by clicking \uD83C\uDF10 </li>\n              <li> send messages to others (bottom left)</li>\n            </ul>', true);
        }, 1000);
      }
    }, console.error);
  }, { once: true });

  // if there is a ServiceWorker capability
  // try to use it, but ignore exceptions.
  if ('serviceWorker' in navigator) {
    try {
      navigator.serviceWorker.register(
      // the registered SW should be able to save
      // the current page either as host or as guest
      // this is one hacky way to pass current location
      // with its query string / earch to the SW
      // You can ignore the warning message in Chrome
      // since that's a Chrome bug indeed.
      '/sw.js?' + encodeURIComponent(location.pathname + location.search));
    } catch (o_O) {
      // either on local network or something ignore-able
    }
  }
}, function (global, require, module, exports) {
  // settings.js
  'use strict';

  var _require3 = require(2),
      CHANNEL = _require3.CHANNEL,
      HASH = _require3.HASH,
      IS_GUEST = _require3.IS_GUEST,
      IS_SECURE = _require3.IS_SECURE;

  var _require4 = require(3),
      copyToClipboard = _require4.copyToClipboard,
      storage = _require4.storage;

  var Settings = L.Control.extend({

    options: { position: 'topright' },

    // settings are per user
    // providing coordinates,
    // updates for the user or other users
    // and map handling, once added.
    initialize: function initialize(user) {
      this._user = user;
      this._timestamp = 0;
      this._coords = null;
      this._watcher = null;
      this._persistent = false;
      this._noSleeping = true;
      this._nosleep = new NoSleep();
      this._noSleep = noSleep.bind(this);
    },
    onAdd: function onAdd(map) {
      this._map = map;
      this._el = L.DomUtil.create('div', 'settings');
      this.update();
      if (IS_GUEST || storage.get('location')) this.handleEvent({
        type: 'click',
        currentTarget: this._el.querySelector('.location')
      });
      document.addEventListener('touchstart', this._noSleep, true);
      document.addEventListener('pointerdown', this._noSleep, true);
      return this._el;
    },
    update: function update() {
      hyperHTML(this._el)(_templateObject, this, this._user.name, this, this._user.channel.members.count, this);
    },
    updateUser: function updateUser(user, info) {
      if (info.name) {
        user.name = info.name;
        if (user.marker) user.marker.getTooltip().setContent(user.name);
      }
      if (user.isHost) document.title = '\uD83C\uDF10 ' + user.name;
      if (info.coords) {
        if (!user.marker) {
          user.marker = L.marker(info.coords);
          user.marker.bindTooltip(user.name, { permanent: true, direction: 'top' });
          user.marker.addTo(this._map);
          if (info.isHost) user.marker._icon.src = user.marker._icon.src.replace('marker', 'host');
        }
        user.marker.setLatLng(info.coords);
      }
    },
    handleEvent: function handleEvent(event) {
      var _this = this;

      this['on' + event.type + event.currentTarget.className](event);
      // try to persist data on any user action
      if (!this._persistent && navigator.storage && navigator.storage.persist) {
        navigator.storage.persist().then(function (granted) {
          _this._persistent = granted;
        });
      }
    },
    onclickname: function onclickname(event) {
      var name = askname(this._user.name);
      // if the user name changed, update it for the next time
      if (name !== this._user.name) {
        this._user.name = storage.set('name', name);
        this.update();
        var info = { id: this._user.id, isHost: this._user.isHost, name: name };
        this.updateUser(this._user, info);
        this._user.channel.trigger('client-update', info);
      }
      // try to ask the user, since interested in changing the name
      // if it would also like to install the app, in case the
      // prompt event ever fired
      dispatchEvent(new CustomEvent('geoshare:install'));
    },


    // fly over all connected users/markers
    // and for HOST also copy the URL to share
    onclickinvite: function onclickinvite(event) {
      if (this._coords) {
        if (!IS_GUEST) {
          var url = ''.concat(location.protocol, '//', location.host, '/?', HASH);
          copyToClipboard(url);
        }
        dispatchEvent(new CustomEvent('client-bounds'));
      }
    },


    // ask for the location permission if never clicked
    // or simply move the map to the current user location
    onclicklocation: function onclicklocation(event) {
      var _this2 = this;

      if (this._coords) {
        this._map.panTo({
          lat: this._coords.latitude,
          lng: this._coords.longitude
        });
      } else {
        var button = event.currentTarget;
        button.disabled = true;
        if (this._watcher) navigator.geolocation.clearWatch(this._watcher);
        this._watcher = navigator.geolocation.watchPosition(function (pos) {
          button.disabled = false;
          var firstTime = !_this2._coords;
          if (firstTime) {
            storage.set('location', 1);
            _this2._map.setView(latlng(pos.coords), Math.max(16, _this2._map.getZoom()));
          }
          _this2._coords = pos.coords;
          _this2.update();
          // to avoid too greedy usage of Pusher API
          // updates are sent each second, never less than that
          if (Date.now() - _this2._timestamp > 999) {
            _this2._timestamp = Date.now();
            var info = {
              id: _this2._user.id,
              name: _this2._user.name,
              isHost: _this2._user.isHost,
              coords: latlng(pos.coords),
              firstTime: firstTime
            };
            _this2.updateUser(_this2._user, info);
            _this2._user.channel.trigger('client-update', info);
          }
        }, function () {
          button.disabled = false;
          var watcher = _this2._watcher;
          _this2._coords = null;
          _this2._watcher = null;
          if (watcher) navigator.geolocation.clearWatch(watcher);
        }, {
          enableHighAccuracy: IS_SECURE,
          maximumAge: IS_SECURE ? 0 : Infinity
        });
      }
    }
  });

  require.E(exports).default = function (options) {
    return new Settings(options);
  };

  function askname(name) {
    return (prompt('your name on the map?', name) || '').replace(/^\s+|\s+$/g, '') || name;
  }

  function latlng(coords) {
    return {
      lat: coords.latitude,
      lng: coords.longitude
    };
  }

  function noSleep(event) {
    var _this3 = this;

    if (event.isTrusted) {
      var currentTarget = event.currentTarget,
          type = event.type;

      var capture = event.eventPhase === event.CAPTURING_PHASE;
      if (this._noSleeping) {
        this._nosleep.enable();
        this._noSleeping = false;
        var vc = function vc(e) {
          if (document.hidden) {
            if (!_this3._noSleeping) {
              _this3._noSleeping = true;
              _this3._nosleep.disable();
            }
          } else {
            document.removeEventListener(e.type, vc);
            currentTarget.addEventListener(type, _this3._noSleep, capture);
          }
        };
        document.addEventListener('visibilitychange', vc);
      }
      currentTarget.removeEventListener(type, this._noSleep, capture);
    }
  }
}, function (global, require, module, exports) {
  // constants.js
  'use strict';

  var _require5 = require(3),
      randomValue = _require5.randomValue,
      storage = _require5.storage;

  // the PWA has mode host and guest.
  // a user can be guest of many host and be a host itself
  // the difference is in the URL where valid hashes are guests
  // while no hashes at all are host


  var IS_GUEST = /^\?[a-z0-9]{16,}$/i.test(location.search);
  exports.IS_GUEST = IS_GUEST;

  // if not over https few things might not work at all
  // like GPS high accuracy or maximum age
  var IS_SECURE = location.protocol === 'https:';
  exports.IS_SECURE = IS_SECURE;

  // a user has a unique hash generated once
  var HASH = storage.get('hash', randomValue(40));
  exports.HASH = HASH;

  // the communication channel is different if host or guest
  var CHANNEL = 'presence-geo-'.concat(IS_GUEST ? location.search.slice(1) : HASH);
  exports.CHANNEL = CHANNEL;
}, function (global, require, module, exports) {
  // utils.js
  'use strict';
  // if a hoster clicks on 👥 it flies to users
  // but it will also copy to clipboard
  // the host personal URL to share for being found

  var copyToClipboard = function copyToClipboard(str) {
    var el = document.body.appendChild(document.createElement('input'));
    el.value = str;
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };
  exports.copyToClipboard = copyToClipboard;

  // the storage offers a simple way to retrieve defaults
  // and save those while getting them, if not already found,
  // and it self-cleans itself dropping all entries
  // but the most important one: the user unique HASH
  var storage = {
    get: function get(name, defaultValue) {
      var value = localStorage.getItem('presence-' + name);
      return value == null && defaultValue != value ? storage.set(name, defaultValue) : value;
    },
    set: function set(name, value) {
      try {
        localStorage.setItem('presence-' + name, value);
      } catch (e) {
        // this should never happen, but if it does
        // it means something went terribly wrong.
        // remove all items but the hash
        var keys = [];
        var length = localStorage.length;
        for (var i = 0; i < length; i++) {
          var key = localStorage.key(i);
          if (key !== 'presence-hash') keys.push(key);
        }
        keys.forEach(function (key) {
          return localStorage.removeItem(key);
        });
        alert('Warning: reloading due corrupted storage');
        location.reload();
      }
      return value;
    }
  };
  exports.storage = storage;

  // simply generates a unique ID/HASH
  var randomValue = function randomValue(n) {
    return escape(String.fromCharCode.apply(String, _toConsumableArray(crypto.getRandomValues(new Uint8Array(n))))).replace(/[^a-zAZ0-9]/g, '');
  };
  exports.randomValue = randomValue;
}, function (global, require, module, exports) {
  // messaging.js
  'use strict';

  var Messaging = L.Control.extend({

    options: { position: 'bottomleft' },

    // user name, the channel,
    // and a place to show messages,
    // that's all this component need to work
    initialize: function initialize(user) {
      this._user = user;
      this._messages = [];
      this._showing = false;
      this._popup = document.body.appendChild(hyperHTML.wire()(_templateObject2));
      this._message = this._popup.firstElementChild;
    },
    onAdd: function onAdd(map) {
      this._map = map;
      this._el = L.DomUtil.create('form', 'messaging');
      this._el.addEventListener('submit', this);
      hyperHTML(this._el)(_templateObject3, function (e) {
        return e.currentTarget.focus();
      });
      return this._el;
    },


    // messages are queued and shown one per time
    // through lightdown, which enables
    // some lightweight Markdown exchange
    showMessage: function showMessage(message, insecure) {
      var _this4 = this;

      this._messages.push(lightdown(insecure ? message : message.replace(/[<>]/g, function (m) {
        return { '<': '&lt;', '>': '&gt;' }[m];
      })));
      if (this._showing) return;
      // if the page is not visible
      // delay the showing of the message
      // otherwise show it right away
      if (document.hidden || document.msHidden || document.webkitHidden) {
        setTimeout(function () {
          return _this4._showMessage();
        }, 5000);
      } else this._showMessage();
    },
    handleEvent: function handleEvent(event) {
      var _this5 = this;

      event.preventDefault();

      var _Array$from = Array.from(event.currentTarget.children),
          _Array$from2 = _slicedToArray(_Array$from, 2),
          input = _Array$from2[0],
          submit = _Array$from2[1];

      var text = input.value.trim();
      if (text.length) {
        if (text.length > 160) text = text.slice(0, 159) + '…';
        input.blur();
        input.value = '';
        submit.disabled = true;
        setTimeout(function () {
          return submit.disabled = false;
        }, 1000);
        var message = '**' + this._user.name + '**: ' + text;
        // broadcast the message and also
        // show to current user the message itself
        // faking a slightly delay to let keyboard go back
        // in one of "those" phones
        this._user.channel.trigger('client-message', message);
        setTimeout(function () {
          return _this5.showMessage(message);
        }, 250);
      }
    },
    _showMessage: function _showMessage() {
      var _this6 = this;

      var message = this._messages.shift();
      this._showing = true;
      this._message.innerHTML = message;
      this._popup.classList.add('show');
      setTimeout(function () {
        _this6._popup.classList.remove('show');
        setTimeout(function () {
          if (_this6._messages.length) _this6._showMessage();else _this6._showing = false;
        }, 600);
      }, 600 + Math.min(8000, message.length * 30));
    }
  });

  require.E(exports).default = function (options) {
    return new Messaging(options);
  };
}, function (global, require, module, exports) {
  // map.js
  'use strict';

  var _require6 = require(3),
      storage = _require6.storage;

  // dictionary of maps, by unique ID


  var maps = Object.create(null);

  require.E(exports).default = {
    // theoretically you could use this module
    // to initialize N maps but for this PWA
    // there will be only one map for the user.id
    init: function init(id) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : JSON.parse(
      // options are retrieved by localStorage
      // if these are available
      // otherwise defaults are used (and stored)
      storage.get('map-state', JSON.stringify({
        center: [40, 0],
        zoom: 3
      })));

      // return a Promise that will resolve through a map
      return maps[id] || (maps[id] = new Promise(function (res) {
        var map = L.map(id, options);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
        res(map);
      }));
    }
  };
}, function (global, require, module, exports) {
  // pusher.js
  'use strict';

  var _require7 = require(2),
      CHANNEL = _require7.CHANNEL;

  // Pusher channel initialization is asynchronous
  // This module returns a single promise
  // that will eventually resolve with the channel


  var promise = void 0;

  require.E(exports).default = {
    init: function init() {

      if (promise) return promise;

      promise = new Promise(function (res, rej) {
        // debug all messages on localhost
        Pusher.logToConsole = location.hostname === 'localhost';

        // create a new Pusher.
        // credentials here are personal
        // so I've used placeholders that throws error
        // if not pre-computed via NodeJS.
        // The file with my own credentials is also
        // not part of this repository.
        var pusher = new Pusher(PUSHER.key, {
          cluster: PUSHER.cluster,
          encrypted: PUSHER.encrypted
        });
        // craete a channel through the unique HASH
        // every user has or gets from a hoster
        var channel = pusher.subscribe(CHANNEL);
        // whenever the subscription succeeds
        // unbind the handler and resolve the promise.
        channel.bind('pusher:subscription_succeeded', function $() {
          channel.unbind('pusher:subscription_succeeded', $);
          res(channel);
        });
      });

      return promise;
    }
  };
}]);

