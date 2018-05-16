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
    }, 600 + Math.min(8000, message.length * 60));
  }

});

export default options => new Messaging(options);
