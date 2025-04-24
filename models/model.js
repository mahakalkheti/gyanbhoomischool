const mongoose = require('mongoose');
const { Schema } = mongoose;
const blogSchema = new Schema({
    name: String, 
    father: String,
    mother: String,
    address: String,
    number:Number
  
  });

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;