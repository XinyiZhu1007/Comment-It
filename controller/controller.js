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

                Articles.countDocuments({ title: result.title}, function (err, test){
                    if(test == 0){

                        var entry = new Articles (result);

                        entry.save(function(err, doc) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(doc);
                            }
                        });
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
                var artcl = {article: doc};
                res.render('./index', artcl);
            }
    });
});

// router.get('/articles-json', function(req, res) {
//     Articles.find({}, function(err, doc) {
//         if (err) {
//             console.log(err);
//         } else {
//             res.json(doc);
//         }
//     });
// });

// router.get('/clearAll', function(req, res) {
//     Articles.remove({}, function(err, doc) {
//         if (err) {
//             console.log(err);
//         } else {
//             console.log('removed all articles');
//         }

//     });
//     res.redirect('/articles-json');
// });

router.get('/readArticle/:id', function(req, res){
  var articleId = req.params.id;
  var articleObj = {
    article: [],
    author: [],
    body: []
  };

    Articles.findOne({ _id: articleId })
      .populate('comments')
      .exec(function(err, doc){
      if(err){
        console.log('Error: ' + err);
      } 
      else {
        var link = 'http://www.sciencemag.org/' + doc.link;
        request(link, function(error, response, html) {
          var $ = cheerio.load(html);

          articleObj.author = $('p.byline.byline--article').children('a').text();

          $('div.article__body').children('p').each(function(i, element){
            text = $(this).text();
            articleObj.body.push(text);
            res.render('./article', articleObj);
          });
          return false;
        });
      }

    });
});

router.post('/comments/:id', function(req, res) {
  var user = req.body.name;
  var content = req.body.comments;
  var articleId = req.params.id;

  var commentObj = {
    name: user,
    body: content
  };
 
  var newComment = new Comments(commentObj);

  newComment.save(function(err, doc) {
      
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
