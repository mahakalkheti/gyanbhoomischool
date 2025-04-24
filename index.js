const express = require("express");
const { students10, students12 } = require("./student");
const app = express();
app.use((req,res,next)=>{
  if(req.headers['x-forwarded-proto'] !== 'https'){
       return res.redirect('https://'+req.headers.host+req.url);
  }
  next();
});


const mongoose = require("mongoose");
const Blog = require("./models/model.js");

const path = require("path");

// Set the view engine to EJS
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public')); 
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


async function main() {
  try {
    const mongodbURL = `mongodb+srv://tiwaridisha22082205:TqbZH7PgCJ98NUA5@cluster0.iwaylz8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    await mongoose.connect(mongodbURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
}
main();

// Routes
app.get('/', (req, res) => {
    res.render("main.ejs", { students10, students12 });
});

app.get("/from", (req, res) => {
  res.render("from");
});

// POST: Save blog to DB
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
    res.render("saved.ejs");
  } catch (err) {
    console.error("Error saving blog:", err);
    res.status(500).send("Failed to save blog.");
  }
});


app.get("/json", async (req, res) => {
  try {
    const blogs = await Blog.find({});
    res.json(blogs);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).send("Failed to fetch blogs.");
  }
});

app.get("/toppers", (req, res) => {
    res.render("p-topper.ejs", { students10, students12 });
});

app.get("/test", (req, res) => {
    res.render("test.ejs");
});

app.get("/search", async (req, res) => {
  const { dob, class: studentClass } = req.query;
  const filter = {};

  if (dob) {
    filter.dob = dob;
  }

  if (studentClass) {
    filter.class = studentClass;
  }

  try {
    const results = await Blog.find(filter);
    res.render("search.ejs", { results });
  } catch (error) {
    console.error("Search error:sssss", error);
    res.status(500).send("Internal server error");
  }
});


app.get("/gallery", (req, res) => {
    res.render("gallery.ejs");
});

app.get("/fees", (req, res) => {
    res.render("fees.ejs");
});

app.get("/sitemap.xml", (req, res) => {
    res.sendFile(path.join(__dirname, "sitemap.xml"));
});

// Catch-all route for undefined pages
app.get('*', (req, res) => {
    res.send("This page is not available RAJKRITI.....");
});

// Start the server
const port = process.env.PORT || '3000';
app.listen(port, () => {
    console.log('Server is running on port : ');
});
