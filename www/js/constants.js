import {randomValue, storage} from './utils.js';

// the PWA has mode host and guest.
// a user can be guest of many host and be a host itself
// the difference is in the URL where valid hashes are guests
// while no hashes at all are host
export const IS_GUEST = /^\?[a-z0-9]{16,}$/i.test(location.search);

// if not over https few things might not work at all
// like GPS high accuracy or maximum age
export const IS_SECURE = location.protocol === 'https:';

// a user has a unique hash generated once
export const HASH = storage.get('hash', randomValue(40));

// the communication channel is different if host or guest
export const CHANNEL = 'presence-geo-'.concat(
  IS_GUEST ? location.search.slice(1) : HASH
);
