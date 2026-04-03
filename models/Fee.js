const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  fatherName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  class: { type: String, required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  monthlyFee: { type: Number, default: 0 },
  additionalPayment: { type: Number, default: 0 },
  totalFees: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, required: true },
  transactionId: { type: String, required: true, unique: true },
  screenshotPath: { type: String, default: "" },
  contactNumber: { type: String, required: true },
  address: { type: String, required: true },
  status: {
    type: String,
    enum: ["Pending", "Verified", "Rejected"],
    default: "Pending",
  },
});

module.exports = mongoose.model("Fee", feeSchema);
