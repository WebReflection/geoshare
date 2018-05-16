import {CHANNEL, HASH, IS_GUEST, IS_SECURE} from './constants.js';
import {copyToClipboard, storage} from './utils.js';

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

export default options => new Settings(options);

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
