// if a hoster clicks on 👥 it flies to users
// but it will also copy to clipboard
// the host personal URL to share for being found
export const copyToClipboard = str => {
  const el = document.body.appendChild(document.createElement('input'));
  el.value = str;
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

// the storage offers a simple way to retrieve defaults
// and save those while getting them, if not already found,
// and it self-cleans itself dropping all entries
// but the most important one: the user unique HASH
export const storage = {
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

// simply generates a unique ID/HASH
export const randomValue = n => escape(
  String.fromCharCode(
    ...crypto.getRandomValues(new Uint8Array(n))
  )
).replace(/[^a-zAZ0-9]/g, '');
