var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var handlebars = require('express-handlebars');

var app = express();


app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static(process.cwd() + '/public'));

app.engine('handlebars', handlebars({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

mongoose.connect('mongodb://heroku_8k7nh22p:9ijfvvsjua1kv3jhh5l147bbdg@ds229732.mlab.com:29732/heroku_8k7nh22p');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to Mongo!')
});

var routes = require('./controller/controller.js');
app.use('/', routes);

var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log('Listening on PORT ' + port);
});