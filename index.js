const path = require('path');
const compression = require('compression');
const express = require('express');
const bodyParser = require('body-parser');
const Pusher = require('pusher');
const uuidv4 = require('uuid/v4');

const PUSHER = require(path.join(__dirname, 'pusher.json'));
const pusher = new Pusher(PUSHER);
const min = require('fs')
              .readFileSync(path.join(__dirname, 'www', 'dist', 'min.js'))
              .toString()
              .replace('PUSHER.key', JSON.stringify(PUSHER.key))
              .replace('PUSHER.cluster', JSON.stringify(PUSHER.cluster))
              .replace('PUSHER.encrypted', JSON.stringify(PUSHER.encrypted));

const app = express();
app.use(compression());
app.get('/dist/min.js', (req, res) => {
  res.writeHead(200, {'content-type': 'application/javascript'});
  res.end(min);
});
app.use(express.static(path.join(__dirname, 'www')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.post('/pusher/auth', (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  const auth = pusher.authenticate(socketId, channel, {user_id: uuidv4()});
  res.send(auth);
});
app.listen(process.env.PORT || 5000);
