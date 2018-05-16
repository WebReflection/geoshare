import {CHANNEL} from './constants.js';

// Pusher channel initialization is asynchronous
// This module returns a single promise
// that will eventually resolve with the channel
let promise;

export default {

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
