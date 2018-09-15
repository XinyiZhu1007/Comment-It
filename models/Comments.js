var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CommentSchema = new Schema({
  name: {
    type: String
  },
  body: {
    type: String,
    required: true
  }
});

var Comments = mongoose.model("Comments", CommentSchema);

module.exports = Comments;