const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  amount: { type: Number, required: true },
  screenshot: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const Fee = mongoose.model('Fee', feeSchema);
module.exports = Fee;
