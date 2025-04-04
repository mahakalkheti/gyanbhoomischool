const express = require("express");
const { students10, students12 } = require("./student");
const app = express();

const path = require("path");
app.set("views engine", "ejs");
app.use(express.static(__dirname + '/public')); 
app.set("views", path.join(__dirname, "views"));


app.get('/', (req, res) => {
    res.render("main.ejs", { students10, students12});
});

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

app.use(express.urlencoded({extended:true}));
app.use(express.json());


app.get('*', (req, res) => {
    res.send("this page not available RAJKRITI.....");
});

const port = process.env.PORT || '3000';
app.listen(port, () => {
    console.log('Server is running on port : ');
});