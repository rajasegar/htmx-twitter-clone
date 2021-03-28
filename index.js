const express = require('express');
const bodyParser = require('body-parser');
const pug = require('pug');
const { v4 } = require('uuid');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const Chance = require('chance');

const app = express();
const expressWs = require('express-ws')(app);
const PORT = process.env.PORT || 3000;

const tweetChannel  = expressWs.getWss('/tweet');

const tweets = [];

const chance = new Chance();
let username = '';

dayjs.extend(relativeTime);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine','pug');

app.use(express.static(__dirname + '/assets'));

app.get('/', (req, res) => {
  username = chance.name();
  res.render('index', { name: username });
});


app.ws('/tweet', function(ws, req) {
  ws.on('message', function(msg) {
    const { message, username } = JSON.parse(msg);

    const _tweet = {
        id: v4(),
        message,
        username,
        retweets: 0,
        likes: 0,
      time: new Date().toString(),
      avatar : 'https://ui-avatars.com/api/?background=random&rounded=true&name=' + username
    };

    tweets.push(_tweet);

    const posts  = pug.compileFile('views/components/post.pug', { globals: ['global'] });

    // Format time 
     _tweet.time = dayjs().to(dayjs(_tweet.time));
    const markup = posts({ t: _tweet });

    tweetChannel.clients.forEach(function (client) {
      client.send(markup);
    });
  });
});

app.post('/like/:id', (req, res) => {
const { id } = req.params;
    const tweet = tweets.find(t => t.id === id);
    tweet.likes += 1;

    const likes  = pug.compileFile('views/components/likes.pug');
    const markup = likes({ t: tweet });
    tweetChannel.clients.forEach(function (client) {
      client.send(markup);
    });

  res.send(markup);
});

app.post('/retweet/:id', (req, res) => {
    const { id } = req.params;
    const tweet = tweets.find(t => t.id === id);
    tweet.retweets += 1;

    const retweets  = pug.compileFile('views/components/retweets.pug');
    const markup = retweets({ t: tweet });
    tweetChannel.clients.forEach(function (client) {
      client.send(markup);
    });
  res.send(markup);
});

app.listen(PORT);
console.log('root app listening on port: 3000');
