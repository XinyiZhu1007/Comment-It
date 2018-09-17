var express = require('express');
var router = express.Router();
var path = require('path');

var request = require('request');
var cheerio = require('cheerio');

var Comments = require('../models/Comments.js');
var Articles = require('../models/Articles.js');

router.get('/', function(req, res) {
    res.render('./index');
});

router.get('/scrape', function(req, res) {
    request('http://www.sciencemag.org/news/latest-news', function(error, response, html) {
        var $ = cheerio.load(html);
        var titlesArray = [];
        $('.media__headline').each(function(i, element) {
            var result = {};

            result.title = $(this).children('a').text();
            result.link = $(this).children('a').attr('href');

            if(result.title !== "" && result.link !== ""){
              if(titlesArray.indexOf(result.title) == -1){

                titlesArray.push(result.title);

                Articles.countDocuments({ title: result.title }, function (err, test){
                    if(test == 0){

                        var entry = new Articles (result);

                        entry.save(function(err, doc) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(doc);
                            }
                        });

                        // res.redirect('/articles');
                    }
                });
              }
              else{
                console.log('Article exists.');
              }
            }
            else{
                console.log('Not saved to database, missing data');
            }
        });
        res.redirect('/articles');
    });
});

router.get('/articles', function(req, res) {
    Articles.find().sort()
    //{_id: -1}
        .exec(function(err, doc) {
            if(err){
                console.log(err);
            } else{
                console.log(doc);
                var artcl = {article: doc};
                res.render('./index', artcl);
            }
        });
});

router.get('/readArticle/:id', function(req, res){
  
//   console.log(req);
//   var article = {
//     id: req.params.id,
//     body: [],
//     title: "",
//     author: ""
//   };

    Articles.findOne({ _id: req.params.id })
      .populate('comments')
      .exec(function(err, doc){
      if(err){
        console.log('Error: ' + err);
      } 
      else {
        console.log(doc);
        var link2 = 'http://www.sciencemag.org' + doc.link;
        console.log(link2);
        request(link2, function(error, response, html) {
            var article = {
                body: [],
                info: doc,
                author: ""
            };
          
            var $ = cheerio.load(html);

            article.author = $('p.byline.byline--article').children('a').text();
            $('div.article__body').children('p').each(function(i, element){
                var text = $(this).text();
                article.body.push(text);
            });

            console.log("article:  \n" + JSON.stringify(article));
            res.render('./article', article);
        })
        
        
      }

    });
    
});

router.post('/comments/:id', function(req, res) {

  var articleId = req.params.id;

//   var user = req.body.name;
//   var content = req.body.comments;
  

//   var commentObj = {
//     name: user,
//     body: content
//   };
 
console.log(req.body.name + " " + req.body.comments);

  var newComment = new Comments({
      name: req.body.name,
      body: req.body.comment
  });

  newComment.save(function(err, doc) {
      console.log(doc);
      console.log(req.body);
      
      if (err) {
          console.log(doc);
          console.log(err);
      } else {
          console.log(doc._id)
          console.log(articleId)
          Articles.findOneAndUpdate({ "_id": req.params.id }, {$push: {'comments':doc._id}}, {new: true})
            .exec(function(err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/readArticle/' + articleId);
                }
            });
        }
  });
});

module.exports = router;
