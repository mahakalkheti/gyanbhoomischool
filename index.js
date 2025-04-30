const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require("path");
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const Fee = require('./models/feesModel.js');

const { students10, students12 } = require("./student");
const Blog = require("./models/model");
const User = require("./models/User");

app.use((req,res,next)=>{
    if(req.headers['x-forwarded-proto'] !== 'https'){
         return res.redirect('https://'+req.headers.host+req.url);
    }
    next();
});

const app = express();

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage: storage });
  
  app.get('/pay', (req, res) => {
    res.render('index.ejs');
  });
  
  app.post('/submit-fee', upload.single('screenshot'), (req, res) => {
    const { name, fatherName, amount } = req.body;
    const screenshot = req.file.path;
  
    const newFee = new Fee({ name, fatherName, amount, screenshot });
  
    newFee.save()
      .then(() => {
        res.send("Fee details saved successfully!");
      })
      .catch(err => {
        res.status(500).send("Error saving fee details");
      });
  });
  
  app.get('/show', (req, res) => {
    Fee.find()
      .then(fees => {
        res.render('show.ejs', { fees });
    })
    .catch(err => {
      res.status(500).send("Error fetching fee details");
    });
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
    console.log(`Server running at http://localhost:`);
});
