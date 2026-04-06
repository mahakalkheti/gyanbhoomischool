const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const feeRoutes = require("./routes/feeRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const siteRoutes = require("./routes/siteRoutes");

const app = express();

/* =======================
   MIDDLEWARE
======================= */

// HTTPS redirect (Render fix)
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Session
app.use(
  session({
    secret: "secretKey",
    resave: false,
    saveUninitialized: false,
  })
);

// Global user variable
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

/* =======================
   ROUTES
======================= */

app.use(authRoutes);
app.use(feeRoutes);
app.use(admissionRoutes);
app.use(siteRoutes);

/* =======================
   DATABASE CONNECTION
======================= */

async function connectDB() {
  try {
    const mongodbURL =
      "mongodb+srv://tiwaridisha22082205:TqbZH7PgCJ98NUA5@cluster0.iwaylz8.mongodb.net/gyanbhoomi?retryWrites=true&w=majority";

    await mongoose.connect(mongodbURL, {
      serverSelectionTimeoutMS: 10000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
  }
}

connectDB();

/* =======================
   ERROR HANDLING
======================= */

app.get("*", (req, res) => {
  res.status(404).send("Page Not Found");
});

/* =======================
   SERVER START
======================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});