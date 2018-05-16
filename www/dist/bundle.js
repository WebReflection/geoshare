(function (cache, modules) {
  function require(i) { return cache[i] || get(i); }
  function get(i) {
    var exports = {}, module = {exports: exports};
    modules[i].call(exports, window, require, module, exports);
    return (cache[i] = module.exports);
  }
  require.E = function (exports) { return Object.defineProperty(exports, '__esModule', {value: true}); };
  require.I = function (m) { return m.__esModule ? m.default : m; };
  return require.I(require(0));
}([],[function (global, require, module, exports) {
// main.js
'use strict';
const settings = require.I(require(1));
const messaging = require.I(require(4));
const leaflet = require.I(require(5));
const pusher = require.I(require(6));
const {storage} = require(3);
const {HASH, IS_GUEST} = require(2);

document.addEventListener(
  'DOMContentLoaded',
  event => {
    // both leaflet and pusher might have
    // some asynchronous initialization
    // wait for both of them, then kickstart the App
    Promise.all([
      leaflet.init('map'),
      pusher.init()
    ]).then(
      ([map, channel]) => {
        // settings and messaging
        // are two Leflet plugins
        let splugin, mplugin;
        const me = channel.members.me;
        // the list of users on the map
        const users = Object.create(null);
        // each user/member has an id, a name,
        // a marker on the map, an isHost info,
        // and a reference to the channel.
        const addMember = member => {
          users[member.id] = {
            id: member.id,
            name: member.id === me.id ?
                    storage.get('name', IS_GUEST ? 'guest' : 'host') : 'guest',
            marker: null,
            isHost: !IS_GUEST && member.id === me.id,
            channel
          };
          // first time a new user is added
          // and connected, it surely wants
          // to know about all other users
          // already available on the map.
          // This loop collects all known users
          // that shared location and have a marker
          // and it send it back to the member
          // that has been just added.
          const broadcast = [];
          for (const id in users) {
            const user = users[id];
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
          if (splugin)
            splugin.update();
        };

        // handle new members and also those removed
        channel.bind('pusher:member_added', addMember);
        channel.bind('pusher:member_removed', member => {
          const {marker} = users[member.id];
          delete users[member.id];
          if (marker) {
            marker.unbindTooltip();
            marker.removeFrom(map);
          }
          if (splugin)
            splugin.update();
        });

        // update a user on the map via settings plugin
        // it also fly on users if the user is new
        const updateClient = client => {
          if (client.id in users) {
            if (splugin)
              splugin.updateUser(users[client.id], client);
            if (client.firstTime)
              setTimeout(dispatchEvent, 500, new CustomEvent('client-bounds'));
          }
        };
        channel.bind('client-update', updateClient);
        channel.bind('client-update-' + me.id, clients => {
          clients.forEach(updateClient);
        });

        // per each member of the channel,
        // create all related users
        channel.members.each(addMember);

        // initialize the two leaflet plugins
        splugin = settings(users[me.id]).addTo(map);
        mplugin = messaging(users[me.id]).addTo(map);

        // also show messages as these come
        channel.bind('client-message', message => {
          mplugin.showMessage(message);
        });

        // fly to all known users when client-bounds
        // event is triggered
        addEventListener('client-bounds', () => {
          const bounds = [];
          channel.members.each(member => {
            const user = users[member.id];
            if (user.marker) {
              const {lat, lng} = user.marker.getLatLng();
              bounds.push([lat, lng]);
            }
          });
          if (bounds.length > 1)
            map.flyToBounds(bounds);
          // host that for the first time clicks the icon
          // should see the message about the hidden action
          // that happened (the copy to clipboard part)
          if (!IS_GUEST && mplugin && !storage.get('clipboard-message')) {
            storage.set('clipboard-message', 1);
            setTimeout(() => {
              mplugin.showMessage(
                [
                  'Your **URL** has been copied to your device clipboard.',
                  'You can share it with friends by simply pasting it.'
                ].join('<br>'),
                true
              );
            }, 500);
          }
        });

        // store map state to have right back next time
        // a user visit/use the Web App.
        const setMapState = () => {
          storage.set('map-state', JSON.stringify({
            center: map.getCenter(),
            zoom: map.getZoom()
          }));
        };
        // no need to be greedy on localStorage
        // defer as much as needed the save operation
        let updateTimer = 0;
        const updateMapState = () => {
          clearInterval(updateTimer);
          updateTimer = setTimeout(setMapState, 1000);
        };

        // update the state on each moveend and/or zoomend
        map.on('moveend', updateMapState);
        map.on('zoomend', updateMapState);
        // also try to do the same if the user closes the browser
        addEventListener('beforeunload', setMapState);

        addEventListener('geoshare:location', () => {
          // show an introductory message.
          // it's numbered so next time I update something
          // I can simply use introduction-X if introduction-Y
          // was already there, or use previous introduction
          // and show next one the next time.
          if (!storage.get('introduction-1')) {
            setTimeout(() => {
              storage.set('introduction-1', 1);
              mplugin.showMessage(
              `**Welcome** to Geo Share, a **P**rogressive **W**eb **A**pplication
              to share your location with friends.
              <hr>
              Following a list of what you can do as __${IS_GUEST ? 'guest' : 'host'}__:<br>
              <ul>
                <li> change your name by clicking 👤 </li>
                <li> see all people on the map ${
                  IS_GUEST ? '' : ' and **copy** your URL to share '
                } by clicking 👥 </li>
                <li> enable geo location or find yourself in the map by clicking 🌐 </li>
                <li> send messages to others (bottom left)</li>
              </ul>`,
                true
              );
            }, 1000);
          }
        });
      },
      console.error
    );
  },
  {once: true}
);

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
      '/sw.js?' + encodeURIComponent(location.pathname + location.search)
    );
  } catch(o_O) {
    // either on local network or something ignore-able
  }
}

},function (global, require, module, exports) {
// settings.js
'use strict';
const {CHANNEL, HASH, IS_GUEST, IS_SECURE} = require(2);
const {copyToClipboard, storage} = require(3);

const Settings = L.Control.extend({

  options: {position: 'topright'},

  // settings are per user
  // providing coordinates,
  // updates for the user or other users
  // and map handling, once added.
  initialize(user) {
    this._user = user;
    this._timestamp = 0;
    this._coords = null;
    this._watcher = null;
    this._persistent = false;
    this._noSleeping = true;
    this._nosleep = new NoSleep;
    this._noSleep = noSleep.bind(this);
  },

  onAdd(map) {
    this._map = map;
    this._el = L.DomUtil.create('div', 'settings');
    this.update();
    if (IS_GUEST || storage.get('location'))
      this.handleEvent({
        type: 'click',
        currentTarget: this._el.querySelector('.location')
      });
    document.addEventListener('touchstart', this._noSleep, true);
    document.addEventListener('pointerdown', this._noSleep, true);
    return this._el;
  },

  update() {
    hyperHTML(this._el)`
      <button class=name onclick=${this}>
        ${this._user.name}
      </button>
      <button class=invite onclick=${this}>
        ${this._user.channel.members.count}
      </button>
      <button class=location onclick=${this}>geo</button>
    `;
  },

  updateUser(user, info) {
    if (info.name) {
      user.name = info.name;
      if (user.marker)
          user.marker.getTooltip().setContent(user.name);
    }
    if (user.isHost) document.title = `🌐 ${user.name}`;
    if (info.coords) {
      if (!user.marker) {
        user.marker = L.marker(info.coords);
        user.marker.bindTooltip(
          user.name,
          {permanent: true, direction: 'top'}
        );
        user.marker.addTo(this._map);
        if (info.isHost)
          user.marker._icon.src = user.marker._icon.src.replace('marker', 'host');
      }
      user.marker.setLatLng(info.coords);
    }
  },

  handleEvent(event) {
    this[`on${event.type}${event.currentTarget.className}`](event);
    // try to persist data on any user action
    if (!this._persistent && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(
        granted => { this._persistent = granted; }
      );
    }
  },

  onclickname(event) {
    const name = askname(this._user.name);
    // if the user name changed, update it for the next time
    if (name !== this._user.name) {
      this._user.name = storage.set('name', name);
      this.update();
      const info = {id: this._user.id, isHost: this._user.isHost, name};
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
  onclickinvite(event) {
    if (this._coords) {
      if (!IS_GUEST) {
        const url = ''.concat(
          location.protocol,
          '//', location.host,
          '/?', HASH
        );
        copyToClipboard(url);
      }
      dispatchEvent(new CustomEvent('client-bounds'));
    }
  },

  // ask for the location permission if never clicked
  // or simply move the map to the current user location
  onclicklocation(event) {
    if (this._coords) {
      this._map.panTo(
        {
          lat: this._coords.latitude,
          lng: this._coords.longitude
        }
      );
    } else {
      const button = event.currentTarget;
      button.disabled = true;
      if (this._watcher)
        navigator.geolocation.clearWatch(this._watcher);
      this._watcher = navigator.geolocation.watchPosition(
        pos => {
          button.disabled = false;
          const firstTime = !this._coords;
          if (firstTime) {
            storage.set('location', 1);
            this._map.setView(
              latlng(pos.coords),
              Math.max(16, this._map.getZoom())
            );
            dispatchEvent(new CustomEvent('geoshare:location'));
          }
          this._coords = pos.coords;
          this.update();
          // to avoid too greedy usage of Pusher API
          // updates are sent each second, never less than that
          if (Date.now() - this._timestamp > 999) {
            this._timestamp = Date.now();
            const info = {
              id: this._user.id,
              name: this._user.name,
              isHost: this._user.isHost,
              coords: latlng(pos.coords),
              firstTime
            };
            this.updateUser(this._user, info);
            this._user.channel.trigger('client-update', info);
          }
        },
        () => {
          button.disabled = false;
          const watcher = this._watcher;
          this._coords = null;
          this._watcher = null;
          if (watcher)
            navigator.geolocation.clearWatch(watcher);
        },
        {
          enableHighAccuracy: IS_SECURE,
          maximumAge: IS_SECURE ? 0 : Infinity
        }
      );
    }
  }
});

require.E(exports).default = options => new Settings(options);

function askname(name) {
  return (prompt(`your name on the map?`, name) || '')
          .replace(/^\s+|\s+$/g, '') || name;
}

function latlng(coords) {
  return {
    lat: coords.latitude,
    lng: coords.longitude
  };
}

function noSleep(event) {
  if (event.isTrusted) {
    const {currentTarget, type} = event;
    const capture = event.eventPhase === event.CAPTURING_PHASE;
    if (this._noSleeping) {
      this._nosleep.enable();
      this._noSleeping = false;
      const vc = e => {
        if (document.hidden) {
          if (!this._noSleeping) {
            this._noSleeping = true;
            this._nosleep.disable();
          }
        } else {
          document.removeEventListener(e.type, vc);
          currentTarget.addEventListener(type, this._noSleep, capture);
        }
      };
      document.addEventListener('visibilitychange', vc);
    }
    currentTarget.removeEventListener(type, this._noSleep, capture);
  }
}

},function (global, require, module, exports) {
// constants.js
'use strict';
const {randomValue, storage} = require(3);

// the PWA has mode host and guest.
// a user can be guest of many host and be a host itself
// the difference is in the URL where valid hashes are guests
// while no hashes at all are host
const IS_GUEST = /^\?[a-z0-9]{16,}$/i.test(location.search);
exports.IS_GUEST = IS_GUEST;

// if not over https few things might not work at all
// like GPS high accuracy or maximum age
const IS_SECURE = location.protocol === 'https:';
exports.IS_SECURE = IS_SECURE;

// a user has a unique hash generated once
const HASH = storage.get('hash', randomValue(40));
exports.HASH = HASH;

// the communication channel is different if host or guest
const CHANNEL = 'presence-geo-'.concat(
  IS_GUEST ? location.search.slice(1) : HASH
);
exports.CHANNEL = CHANNEL;

},function (global, require, module, exports) {
// utils.js
'use strict';
// if a hoster clicks on 👥 it flies to users
// but it will also copy to clipboard
// the host personal URL to share for being found
const copyToClipboard = str => {
  const el = document.body.appendChild(document.createElement('input'));
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
const storage = {
  get(name, defaultValue) {
    const value = localStorage.getItem('presence-' + name);
    return value == null && defaultValue != value ?
            storage.set(name, defaultValue) : value;
  },
  set(name, value) {
    try {
      localStorage.setItem('presence-' + name, value);
    } catch(e) {
      // this should never happen, but if it does
      // it means something went terribly wrong.
      // remove all items but the hash
      const keys = [];
      const length = localStorage.length;
      for (let i = 0; i < length; i++) {
        const key = localStorage.key(i);
        if (key !== 'presence-hash')
          keys.push(key);
      }
      keys.forEach(key => localStorage.removeItem(key));
      alert('Warning: reloading due corrupted storage');
      location.reload();
    }
    return value;
  }
};
exports.storage = storage;

// simply generates a unique ID/HASH
const randomValue = n => escape(
  String.fromCharCode(
    ...crypto.getRandomValues(new Uint8Array(n))
  )
).replace(/[^a-zAZ0-9]/g, '');
exports.randomValue = randomValue;

},function (global, require, module, exports) {
// messaging.js
'use strict';
const Messaging = L.Control.extend({

  options: {position: 'bottomleft'},

  // user name, the channel,
  // and a place to show messages,
  // that's all this component need to work
  initialize(user) {
    this._user = user;
    this._messages = [];
    this._showing = false;
    this._popup = document.body.appendChild(
      hyperHTML.wire()`<div class="popup"><div></div></div>`
    );
    this._message = this._popup.firstElementChild;
  },

  onAdd(map) {
    this._map = map;
    this._el = L.DomUtil.create('form', 'messaging');
    this._el.addEventListener('submit', this);
    hyperHTML(this._el)`
      <input
        onclick=${e => e.currentTarget.focus()}
        placeholder="say something"
        maxlength=160
        name=message
        autocomplete=off
        autocorrect=off
        autocapitalize=off
      />
      <input type=submit />
    `;
    return this._el;
  },

  // messages are queued and shown one per time
  // through lightdown, which enables
  // some lightweight Markdown exchange
  showMessage(message, insecure) {
    this._messages.push(
      lightdown(
        insecure ?
          message :
          message.replace(
            /[<>]/g,
            m => ({'<':'&lt;', '>':'&gt;'}[m])
          )
      )
    );
    if (this._showing) return;
    // if the page is not visible
    // delay the showing of the message
    // otherwise show it right away
    if (
      document.hidden ||
      document.msHidden ||
      document.webkitHidden
    ) {
      setTimeout(() => this._showMessage(), 5000);
    } else
      this._showMessage();
  },

  handleEvent(event) {
    event.preventDefault();
    const [input, submit] = Array.from(event.currentTarget.children);
    let text = input.value.trim();
    if (text.length) {
      if (text.length > 160)
        text = text.slice(0, 159) + '…';
      input.blur();
      input.value = '';
      submit.disabled = true;
      setTimeout(() => submit.disabled = false, 1000);
      const message = `**${this._user.name}**: ${text}`;
      // broadcast the message and also
      // show to current user the message itself
      // faking a slightly delay to let keyboard go back
      // in one of "those" phones
      this._user.channel.trigger('client-message', message);
      setTimeout(() => this.showMessage(message), 250);
    }
  },

  _showMessage() {
    const message = this._messages.shift();
    this._showing = true;
    this._message.innerHTML = message;
    this._popup.classList.add('show');
    setTimeout(() => {
      this._popup.classList.remove('show');
      setTimeout(() => {
        if (this._messages.length)
          this._showMessage();
        else
          this._showing = false;
      }, 600);
    }, 600 + Math.min(8000, message.length * 30));
  }

});

require.E(exports).default = options => new Messaging(options);

},function (global, require, module, exports) {
// map.js
'use strict';
const {storage} = require(3);

// dictionary of maps, by unique ID
const maps = Object.create(null);

require.E(exports).default = {
  // theoretically you could use this module
  // to initialize N maps but for this PWA
  // there will be only one map for the user.id
  init(id, options = JSON.parse(
    // options are retrieved by localStorage
    // if these are available
    // otherwise defaults are used (and stored)
    storage.get('map-state', JSON.stringify({
      center: [40, 0],
      zoom: 3
    })
  ))) {
    // return a Promise that will resolve through a map
    return maps[id] || (maps[id] = new Promise(res => {
      const map = L.map(id, options);
      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
      ).addTo(map);
      res(map);
    }));
  }
};

},function (global, require, module, exports) {
// pusher.js
'use strict';
const {CHANNEL} = require(2);

// Pusher channel initialization is asynchronous
// This module returns a single promise
// that will eventually resolve with the channel
let promise;

require.E(exports).default = {

  init() {

    if (promise) return promise;

    promise = new Promise((res, rej) => {
      // debug all messages on localhost
      Pusher.logToConsole = location.hostname === 'localhost';

      // create a new Pusher.
      // credentials here are personal
      // so I've used placeholders that throws error
      // if not pre-computed via NodeJS.
      // The file with my own credentials is also
      // not part of this repository.
      const pusher = new Pusher(PUSHER.key, {
        cluster: PUSHER.cluster,
        encrypted: PUSHER.encrypted
      });
      // craete a channel through the unique HASH
      // every user has or gets from a hoster
      const channel = pusher.subscribe(CHANNEL);
      // whenever the subscription succeeds
      // unbind the handler and resolve the promise.
      channel.bind(
        'pusher:subscription_succeeded',
        function $() {
          channel.unbind('pusher:subscription_succeeded', $);
          res(channel);
        }
      );
    });

    return promise;

  }
};

}]));