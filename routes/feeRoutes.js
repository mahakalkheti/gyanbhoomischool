const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Fee = require("../models/Fee");
const { requireAuth, allowRoles } = require("../middleware/auth");

const router = express.Router();

const CLASS_MONTHLY_FEES = {
  "1st": 1,
  "2nd": 500,
  "3rd": 600,
  "4th": 600,
  "5th": 700,
  "6th": 800,
  "7th": 800,
  "8th": 900,
  "9th": 1000,
  "10th": 1200,
  "11th": 1400,
  "12th": 1500,
};

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "rzp_live_SYiBqGIKQCDusP";
const razorpayKeySecret =
  process.env.RAZORPAY_KEY_SECRET || "7GuJllQPgnoJ6tpqy1NdvsOB";

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "payment-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  "/create-order",
  requireAuth,
  allowRoles("student", "staff"),
  async (req, res) => {
    try {
      const options = {
        amount: req.body.amount * 100,
        currency: "INR",
        receipt: "receipt_order_" + Date.now(),
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (err) {
      res.status(500).send(err);
    }
  }
);

router.post(
  "/verify-payment",
  requireAuth,
  allowRoles("student", "staff"),
  (req, res) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      res.send({ success: true });
    } else {
      res.send({ success: false });
    }
  }
);

router.get(
  "/payment",
  requireAuth,
  allowRoles("student", "staff"),
  (req, res) => {
    res.render("fees.ejs", { razorpayKeyId });
  }
);

router.get("/fees", requireAuth, allowRoles("student", "staff"), (req, res) => {
  res.render("index", {
    razorpayKeyId,
    classMonthlyFees: CLASS_MONTHLY_FEES,
  });
});

router.post(
  "/submit-fee",
  requireAuth,
  allowRoles("student", "staff"),
  upload.single("paymentScreenshot"),
  async (req, res) => {
    try {
      const {
        studentName,
        fatherName,
        rollNumber,
        class: studentClass,
        month,
        year,
        monthlyFee,
        additionalPayment,
        totalFees,
        paidAmount,
        paymentMethod,
        transactionId,
        contactNumber,
        address,
      } = req.body;

      if (
        !studentName ||
        !fatherName ||
        !rollNumber ||
        !studentClass ||
        !month ||
        !year ||
        monthlyFee === undefined ||
        additionalPayment === undefined ||
        !totalFees ||
        !paidAmount ||
        !paymentMethod ||
        !contactNumber ||
        !address
      ) {
        return res.status(400).json({
          success: false,
          message: "All fields are required! Please fill all the information.",
        });
      }

      if (paymentMethod !== "Razorpay") {
        return res.status(400).json({
          success: false,
          message: "Only Razorpay payment is allowed.",
        });
      }

      const monthlyFeeNum = parseFloat(monthlyFee);
      const additionalPaymentNum = parseFloat(additionalPayment) || 0;
      const totalFeesNum = parseFloat(totalFees);
      const paidAmountNum = parseFloat(paidAmount);
      const expectedMonthlyFee = CLASS_MONTHLY_FEES[studentClass];

      if (
        !expectedMonthlyFee ||
        isNaN(monthlyFeeNum) ||
        isNaN(additionalPaymentNum) ||
        isNaN(totalFeesNum) ||
        isNaN(paidAmountNum) ||
        monthlyFeeNum < 0 ||
        additionalPaymentNum < 0 ||
        totalFeesNum <= 0 ||
        paidAmountNum <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Please enter valid amounts!",
        });
      }

      if (monthlyFeeNum !== expectedMonthlyFee) {
        return res.status(400).json({
          success: false,
          message: "Selected class fee does not match fixed monthly fee.",
        });
      }

      const expectedTotal = monthlyFeeNum + additionalPaymentNum;
      if (totalFeesNum !== expectedTotal || paidAmountNum !== expectedTotal) {
        return res.status(400).json({
          success: false,
          message: "Total fee mismatch detected. Please refresh and try again.",
        });
      }

      if (paidAmountNum > totalFeesNum) {
        return res.status(400).json({
          success: false,
          message: "Paid amount cannot be greater than total fees!",
        });
      }

      const remainingAmount = totalFeesNum - paidAmountNum;
      const finalTransactionId =
        transactionId && transactionId.trim()
          ? transactionId.trim()
          : `MANUAL-${Date.now()}-${Math.round(Math.random() * 100000)}`;

      const existingTxn = await Fee.findOne({
        transactionId: finalTransactionId,
      });

      if (existingTxn) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID already exists. Please try again.",
        });
      }

      const newFee = new Fee({
        studentName: studentName.trim(),
        fatherName: fatherName.trim(),
        rollNumber: rollNumber.trim().toUpperCase(),
        class: studentClass,
        month,
        year: parseInt(year, 10),
        monthlyFee: monthlyFeeNum,
        additionalPayment: additionalPaymentNum,
        totalFees: totalFeesNum,
        paidAmount: paidAmountNum,
        remainingAmount,
        paymentMethod,
        transactionId: finalTransactionId,
        contactNumber: contactNumber.trim(),
        address: address.trim(),
        screenshotPath: req.file ? req.file.filename : "",
      });

      await newFee.save();
      res.json({
        success: true,
        message: "Fee submitted successfully! Your payment is under review.",
      });
    } catch (error) {
      console.error(error);
      if (req.file) {
        fs.unlink(path.join("uploads", req.file.filename), (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          }
        });
      }

      res.status(400).json({
        success: false,
        message: "Unable to submit fee. Please try again.",
      });
    }
  }
);

router.get("/receipt/:id", requireAuth, allowRoles("staff"), async (req, res) => {
  try {
    const record = await Fee.findById(req.params.id);
    if (!record) {
      return res.send("Record not found");
    }

    res.render("receipt", { record });
  } catch (err) {
    console.error(err);
    res.send("Error loading receipt page");
  }
});

router.get("/show", requireAuth, allowRoles("staff"), async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    let feeRecords;

    if (searchQuery.trim()) {
      feeRecords = await Fee.find({
        studentName: { $regex: searchQuery.trim(), $options: "i" },
      }).sort({ paymentDate: -1 });
    } else {
      feeRecords = await Fee.find().sort({ paymentDate: -1 });
    }

    let studentSummary = null;
    if (searchQuery.trim() && feeRecords.length > 0) {
      const totalPaid = feeRecords.reduce((sum, record) => sum + record.paidAmount, 0);
      const totalRemaining = feeRecords.reduce(
        (sum, record) => sum + record.remainingAmount,
        0
      );
      const totalPayments = feeRecords.length;

      studentSummary = {
        studentName: feeRecords[0].studentName,
        fatherName: feeRecords[0].fatherName,
        rollNumber: feeRecords[0].rollNumber,
        class: feeRecords[0].class,
        totalPaid,
        totalRemaining,
        totalPayments,
      };
    }

    res.render("show", {
      feeRecords,
      searchQuery,
      studentSummary,
    });
  } catch (error) {
    console.error(error);
    res.render("error", { message: "Error fetching fee records." });
  }
});

router.post(
  "/update-status/:id",
  requireAuth,
  allowRoles("staff"),
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
      await Fee.findByIdAndUpdate(id, { status });
      res.redirect("/show");
    } catch (err) {
      console.error("Status update error:", err);
      res.status(500).send("Server Error");
    }
  }
);

router.post(
  "/delete-fee/:id",
  requireAuth,
  allowRoles("staff"),
  async (req, res) => {
    try {
      const feeRecord = await Fee.findById(req.params.id);
      if (!feeRecord) {
        return res.redirect("/show");
      }

      const imagePath = path.join(__dirname, "..", "uploads", feeRecord.screenshotPath);
      if (feeRecord.screenshotPath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      await Fee.findByIdAndDelete(req.params.id);
      res.redirect("/show");
    } catch (err) {
      console.error(err);
      res.redirect("/show");
    }
  }
);

module.exports = router;
