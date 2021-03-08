const express = require('express');
const bodyParser = require('body-parser');
const pug = require('pug');
const { v4 } = require('uuid');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);

const app = express();
const expressWs = require('express-ws')(app);
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine','pug');

app.use(express.static(__dirname + '/assets'));

app.get('/', (req, res) => {
  res.render('index');
});

const tweetChannel  = expressWs.getWss('/tweet');
const likeChannel  = expressWs.getWss('/like');
const retweetChannel  = expressWs.getWss('/retweet');

const tweets = [];

app.ws('/tweet', function(ws, req) {
  ws.on('message', function(msg) {
    //console.log(msg);
    const { message } = JSON.parse(msg);

    tweets.push({
        id: v4(),
        message,
        username: 'Raja',
        retweets: 0,
        likes: 0,
        time: new Date().toString()
      });

    const posts  = pug.compileFile('views/components/post.pug', { globals: ['global'] });

    // Format time 
    const _tweets = tweets.map(t => {
      t.time = dayjs().to(t.time);
      return t;
    });
    const markup = posts({ tweets: _tweets });

    tweetChannel.clients.forEach(function (client) {
      client.send(markup);
    });
  });
});

app.ws('/like/:id', (ws, req) => {
  ws.on('message', (msg) => {
    const { id } = req.params;
    const tweet = tweets.find(t => t.id === id);
    tweet.likes += 1;

    const likes  = pug.compileFile('views/components/likes.pug');
    const markup = likes({ id, likes: tweet.likes });
    likeChannel.clients.forEach(function (client) {
      client.send(markup);
    });
  });
});

app.ws('/retweet/:id', (ws, req) => {
  ws.on('message', (msg) => {
    const { id } = req.params;
    const tweet = tweets.find(t => t.id === id);
    tweet.retweets += 1;

    const retweets  = pug.compileFile('views/components/retweets.pug');
    const markup = retweets({ id, retweets: tweet.retweets });
    retweetChannel.clients.forEach(function (client) {
      client.send(markup);
    });
  });
});

app.listen(PORT);
console.log('root app listening on port: 3000');
