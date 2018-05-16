import {storage} from './utils.js';

// dictionary of maps, by unique ID
const maps = Object.create(null);

export default {
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
