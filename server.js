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

mongoose.connect('mongodb://heroku_59rv29xp:lqtqcc0guqrr83e0c4i5iq77f4@ds157742.mlab.com:57742/heroku_59rv29xp');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB!')
});

var routes = require('./controller/controller.js');
app.use('/', routes);

var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log('Listening on PORT ' + port);
});