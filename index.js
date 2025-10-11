const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require("path");
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();
const app = express();

// Fee Schema
const feeSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  fatherName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  class: { type: String, required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  totalFees: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, required: true },
  transactionId: { type: String, required: true, unique: true  },
  screenshotPath: { type: String, required: true },
  contactNumber: { type: String, required: true },
  address: { type: String, required: true },
  status: {
    type: String,
    enum: ["Pending", "Verified", "Rejected"],
    default: "Pending",
  },
});

const Fee = mongoose.model("Fee", feeSchema);


const { students10, students12 } = require("./student");
const Blog = require("./models/model");
const User = require("./models/User");

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");



app.use((req,res,next)=>{
    if(req.headers['x-forwarded-proto'] !== 'https'){
         return res.redirect('https://'+req.headers.host+req.url);
    }
    next();
});



   
app.use("/uploads", express.static("uploads"));

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "payment-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});


app.get("/fees", (req, res) => {
  res.render("index");
});

// Handle fee submission
app.post(
  "/submit-fee",
  upload.single("paymentScreenshot"),
  async (req, res) => {
    try {
      // Check if screenshot is uploaded
      if (!req.file) {
        return res.render("error", {
          message:
            "Payment screenshot is required! Please upload the screenshot.",
        });
      }

      const {
        studentName,
        fatherName,
        rollNumber,
        class: studentClass,
        month,
        year,
        totalFees,
        paidAmount,
        paymentMethod,
        transactionId,
        contactNumber,
        address,
      } = req.body;

      // Validate all required fields
      if (
        !studentName ||
        !fatherName ||
        !rollNumber ||
        !studentClass ||
        !month ||
        !year ||
        !totalFees ||
        !paidAmount ||
        !paymentMethod ||
        !transactionId ||
        !contactNumber ||
        !address
      ) {
        return res.render("error", {
          message: "All fields are required! Please fill all the information.",
        });
      }

      // Validate amounts
      const totalFeesNum = parseFloat(totalFees);
      const paidAmountNum = parseFloat(paidAmount);

      if (
        isNaN(totalFeesNum) ||
        isNaN(paidAmountNum) ||
        totalFeesNum <= 0 ||
        paidAmountNum <= 0
      ) {
        return res.render("error", { message: "Please enter valid amounts!" });
      }

      if (paidAmountNum > totalFeesNum) {
        return res.render("error", {
          message: "Paid amount cannot be greater than total fees!",
        });
      }

      const remainingAmount = totalFeesNum - paidAmountNum;

      const newFee = new Fee({
        studentName: studentName.trim(),
        fatherName: fatherName.trim(),
        rollNumber: rollNumber.trim().toUpperCase(),
        class: studentClass,
        month,
        year: parseInt(year),
        totalFees: totalFeesNum,
        paidAmount: paidAmountNum,
        remainingAmount: remainingAmount,
        paymentMethod,
        transactionId: transactionId.trim(),
        contactNumber: contactNumber.trim(),
        address: address.trim(),
        screenshotPath: req.file.filename,
      });

      const existingTxn = await Fee.findOne({
        transactionId: transactionId.trim(),
      });
      if (existingTxn) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "यह Transaction ID पहले से मौजूद है। कृपया एक वैध और यूनिक Transaction ID डालें।",
          });
      }

      await newFee.save();
      res.json({
        success: true,
        message: "Fee submitted successfully! Your payment is under review.",
      });

      // res.render('success', { message: 'Fee submission successful! Your payment is under review.' });
    } catch (error) {
      console.error(error);
      // Delete uploaded file if save fails
      if (req.file) {
        fs.unlink(path.join("uploads", req.file.filename), (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
      res
        .status(400)
        .json({ success: false, message: "Your error message here" });

      // res.render('error', { message: 'Error submitting fee. Please try again.' });
    }
  }
);

app.get('/receipt/:id', async (req, res) => {
    try {
        const record = await Fee.findById(req.params.id);
        if (!record) return res.send("Record not found");

        res.render('receipt', { record });
    } catch (err) {
        console.error(err);
        res.send("Error loading receipt page");
    }
});


// Show all fee records (Admin view) with search functionality
app.get("/show", async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    let feeRecords;

    if (searchQuery.trim()) {
      // Search by student name (case insensitive)
      feeRecords = await Fee.find({
        studentName: { $regex: searchQuery.trim(), $options: "i" },
      }).sort({ paymentDate: -1 });
    } else {
      // Show all records
      feeRecords = await Fee.find().sort({ paymentDate: -1 });
    }

    // Calculate student-wise totals if searching
    let studentSummary = null;
    if (searchQuery.trim() && feeRecords.length > 0) {
      const totalPaid = feeRecords.reduce(
        (sum, record) => sum + record.paidAmount,
        0
      );
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
    // record: yourRecordObject
    });
  } catch (error) {
    console.error(error);
    res.render("error", { message: "Error fetching fee records." });
  }
});


app.post("/update-status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await FeeRecord.findByIdAndUpdate(id, { status: status });
    res.redirect("/show"); // Show page par wapas bhejo
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).send("Server Error");
  }
}); 

app.post("/delete-fee/:id", async (req, res) => {
  try {
    const feeRecord = await Fee.findById(req.params.id);
    if (!feeRecord) return res.redirect("/show");

    // Delete screenshot from uploads folder
    const imagePath = path.join(__dirname, "uploads", feeRecord.screenshotPath);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Delete record from DB
    await Fee.findByIdAndDelete(req.params.id);
    res.redirect("/show");
  } catch (err) {
    console.error(err);
    res.redirect("/show");
  }
});




app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

async function connectDB() {
    try {
        const DB_PASS = process.env.DB_PASS;
        const DB_USER  = process.env.DB_USER;
        const mongodbURL = `mongodb+srv://${DB_USER}:${DB_PASS}@cluster0.iwaylz8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
        // const mongodbURL = 'mongodb://127.0.0.1:27017/loginSignupDB';
        await mongoose.connect(mongodbURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
connectDB();

app.get('/', (req, res) => {
    res.render("main", { students10, students12 });
});



app.get("/gallery", (req, res) => {
    res.render("gallery");
});



app.get("/sitemap.xml", (req, res) => {
    res.sendFile(path.join(__dirname, "sitemap.xml"));
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.redirect('/login');
    } catch (err) {
        console.error("Signup Error:", err);
        res.send('Error during signupeeeeeeeeeeeeeeee');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                req.session.user = user; 
                res.redirect('/');
            } else {
                res.send('Incorrect Password');
            }
        } else {
            res.send('User not found');
        }
    } catch (err) {
        console.error("Login eeeee Error:", err);
        res.send('Error during login');
    }
});

app.get("/from", (req, res) => {
    res.render("from");
});

app.get("/test", (req, res) => {
    res.render("test.ejs");
});
app.post("/blogs", async (req, res) => {
    const { name, father, mother, address, mobile1, mobile2, dob, samagra, aadhar, class: studentClass } = req.body;

    try {
        const newBlog = new Blog({
            name,
            father,
            mother,
            address,
            mobile1,
            mobile2,
            dob,
            samagra,
            aadhar,
            class: studentClass
        });

        await newBlog.save();
        res.render("saved");
    } catch (err) {
        console.error("Error saving form:", err);
        res.status(500).send("Failed to save form.");
    }
});

app.get("/search", async (req, res) => {
    const { dob, class: studentClass } = req.query;
    const filter = {};

    if (dob) filter.dob = dob;
    if (studentClass) filter.class = studentClass;

    try {
        const results = await Blog.find(filter);
        res.render("search", { results });
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get('*', (req, res) => {
    res.status(404).send("Page Not Found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running at http://localhost:");
});
