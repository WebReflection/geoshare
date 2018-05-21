# 🌐 Geo Share

A Geo Location PWA based on the Pusher Channels real-time API.

# What I built

Imagine you'd like to meet up with your friends, but you are
in an open and maybe crowded space, so that beside sharing your own location,
you'd love to also see where is everyone else, to eventually converge into
a single place on a map without needing to install any native app.

This is Geo Share, a PWA where you can either be the host,
or simply a guest of any other person that shared a unique URL with you.

## Demo Link

You can become a host simply visiting [geoshare.now.sh](https://geoshare.now.sh/).

Once you've found yourself on the map, and clicked on top right 👥 icon,
you'll have in your device clipboard a unique URL you can paste to your friends.

That's it, anyone using that link will see everyone else aware of such link and,
as long as you are using the app, also see you as host of the group (dark icon).

# How I built it

  * [Zeit now-cli](https://zeit.co/now) for the easiest deployment ever!
  * [Leaflet](https://leafletjs.com) library for the map on top of [OpenStreetmap](https://www.openstreetmap.org/) tiles
  * [Nominatim](https://nominatim.openstreetmap.org) for reverse geocoding on longpress (to share a tooltip from the host)
  * [Pusher Channels API](https://pusher.com/channels?utm_source=dev.to&utm_medium=referral&utm_campaign=Devtocontest) for real-time updates and communications
  * [NoSleep](https://github.com/richtr/NoSleep.js?utm_source=recordnotfound.com#nosleepjs) utility to (hopefully) prevent device from sleeping
  * [hyperHTML](https://github.com/WebReflection/hyperHTML#hyperhtml) for layout render and updates
  * [lightdown](https://github.com/WebReflection/lightdown#lightdown) to bring a fast, safe, and useful Markdown flavour to each message

# Additional Resources/Info

The rest of the code is written by me and based on [ES Modules](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/), bundled through [asbundle](https://github.com/WebReflection/asbundle#asbundle), sanitized via [Babel](https://babeljs.io), and minified via [UglifyJS](https://github.com/mishoo/UglifyJS#uglifyjs--a-javascript-parsercompressorbeautifier).

Common PWA techniques such [ServiceWorker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) and a `manifest.json` are in place too.
