const express = require("express");
const Blog = require("../models/model");
const { requireAuth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/from", requireAuth, allowRoles("student", "staff"), (req, res) => {
  res.render("from");
});

router.get("/test", requireAuth, allowRoles("student", "staff"), (req, res) => {
  res.render("test.ejs");
});

router.post(
  "/blogs",
  requireAuth,
  allowRoles("student", "staff"),
  async (req, res) => {
    const {
      name,
      father,
      mother,
      address,
      mobile1,
      mobile2,
      dob,
      samagra,
      aadhar,
      class: studentClass,
    } = req.body;

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
        class: studentClass,
      });

      await newBlog.save();
      res.render("saved");
    } catch (err) {
      console.error("Error saving form:", err);
      res.status(500).send("Failed to save form.");
    }
  }
);

router.get("/search", requireAuth, allowRoles("staff"), async (req, res) => {
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
    res.render("search", { results });
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
