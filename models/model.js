const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  father: {
    type: String,
    required: true
  },
  mother: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  mobile1: {
    type: String,
    required: true
  },
  mobile2: {
    type: String
  },
  dob: {
    type: Date
  },
  samagra: {
    type: String
  },
  aadhar: {
    type: String
  },
  class: {
    type: String
  }
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;