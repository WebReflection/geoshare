import settings from './settings.js';
import messaging from './messaging.js';
import leaflet from './map.js';
import pusher from './pusher.js';
import {storage} from './utils.js';
import {HASH, IS_GUEST} from './constants.js';

document.addEventListener(
  'DOMContentLoaded',
  event => {

    // add the div map to the body
    hyperHTML(document.body)`<div id="map"></div>`;

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
            tooltip: me.tooltip && me.tooltip.info,
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
                isHost: user.isHost,
                tooltip: user.tooltip
              });
            }
          }
          channel.trigger('client-update-' + member.id, broadcast);
          if (splugin)
            splugin.update();
          if (me.tooltip)
            channel.trigger('client-show-tooltip', me.tooltip.info);
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
            if (IS_GUEST && client.tooltip)
              showTooltip(client.tooltip);
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
          if (me.tooltip) {
            const {lat, lng} = me.tooltip.getLatLng();
            bounds.push([lat, lng]);
          }
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

        // whenever is necessary ...
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
              Following what you can do as __${IS_GUEST ? 'guest' : 'host'}__:<br>
              <ul>
                <li> **enable** geo **location** or find yourself in the map by clicking 🌐 </li>
                <li> **change** your **name** by clicking 👤 </li>
                <li> **see** all **people** on the map ${
                  IS_GUEST ? '' : ' and **copy** your URL to share '
                } by clicking 👥 </li>
                <li> send **messages** to others (bottom left)</li>
              </ul>`,
                true
              );
            }, 1000);
          }
        });

        // if the user is host for the first time
        // show the welcome message right away
        if (!IS_GUEST && !storage.get('location'))
          dispatchEvent(new CustomEvent('geoshare:location'));

        // share a reverse geo-location tooltip
        // to point at a specific place to your friends
        const showTooltip = info => {
          dropTooltip();
          me.tooltip = new L.marker(info.latlng, {opacity: 0});
          me.tooltip.bindTooltip(
            info.display_name,
            {
              permanent: true,
              direction: 'top',
              offset: [0, 30],
              className: 'reverse-geo'
            }
          );
          me.tooltip.info = info;
          me.tooltip.addTo(map);
        };
        const dropTooltip = () => {
          if (me.tooltip) {
            me.tooltip.removeFrom(map);
            me.tooltip = null;
          }
        };

        if (IS_GUEST) {
          channel.bind('client-show-tooltip', showTooltip);
          channel.bind('client-drop-tooltip', dropTooltip);
        } else {
          map.on('contextmenu', event => {
            const script = document.createElement('script');
            const uid = '_' + String(Date.now() + Math.random()).replace(/\D/g, '_');
            const url = ['https://nominatim.openstreetmap.org/reverse?format=json'];
            url.push(
              'addressdetails=0',
              `lat=${event.latlng.lat}`,
              `lon=${event.latlng.lng}`,
              `zoom=${map.getZoom()}`,
              `json_callback=${uid}`
            );
            window[uid] = result => {
              delete window[uid];
              document.documentElement.removeChild(script);
              const info = {
                latlng: event.latlng,
                display_name: result.display_name
              };
              showTooltip(info);
              me.tooltip.on('click', () => {
                dropTooltip();
                channel.trigger('client-drop-tooltip', info);
              });
              channel.trigger('client-show-tooltip', info);
            };
            document.documentElement.appendChild(script).src = url.join('&');
          });
        }
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
