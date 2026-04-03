const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const feeRoutes = require("./routes/feeRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const siteRoutes = require("./routes/siteRoutes");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "secretKey",
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use(authRoutes);
app.use(feeRoutes);
app.use(admissionRoutes);
app.use(siteRoutes);
app.use((req,res,next)=>{
    if(req.headers['x-forwarded-proto'] !== 'https'){
         return res.redirect('https://'+req.headers.host+req.url);
    }
    next();
});

async function connectDB() {
  try {
    
       const mongodbURL = `mongodb+srv://${DB_USER}:${DB_PASS}@cluster0.iwaylz8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
      //const mongodbURL = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gyanbhoomi";
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

app.get("*", (req, res) => {
  res.status(404).send("Page Not Found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
