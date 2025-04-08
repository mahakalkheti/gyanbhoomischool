const express = require("express");
const { students10, students12 } = require("./student");
const app = express();
const compression = require("compression");
app.use(compression());

app.use((req,res,next)=>{
    if(req.headers['x-forwarded-proto'] !== 'https'){
         return res.redirect('https://'+req.headers.host+req.url);
    }
    next();
});

const path = require("path");
app.set("views engine", "ejs");
app.use(express.static(__dirname + '/public')); 
app.set("views", path.join(__dirname, "views"));


app.get('/', (req, res) => {
    res.render("main.ejs", { students10, students12});
});

app.get('/admission',(req,res)=>{
  res.render("admission.ejs");
})
app.get("/toppers", (req, res) => {
    res.render("p-topper.ejs", { students10, students12 });
});


  app.get("/test", (req, res) => {
    res.render("test.ejs");
  });

app.get("/study-metrial", (req, res) => {
    res.render("study-metrial.ejs");
});

app.get("/Teacher", (req, res) => {
    res.render("staff.ejs");
  });
  app.get("/gallery",(req,res)=>{
    res.render("gallery.ejs");
  });

  app.get("/fees",(req,res)=>{
    res.render("fees.ejs");
  });

  app.get("/about",(req,res)=>{
    res.render("p-three.ejs");
  });

  app.get("/sitemap.xml", (req, res) => {
    res.sendFile(path.join(__dirname,"sitemap.xml"));
});


app.get('*', (req, res) => {
    res.send("this page not available RAJKRITI.....");
});

const port = process.env.PORT || '3000';
app.listen(port, () => {
    console.log('Server is running on port : ');
});