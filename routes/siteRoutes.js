const express = require("express");
const path = require("path");
const { students10, students12 } = require("../student");
const { requireAuth, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, allowRoles("student", "staff"), (req, res) => {
  res.render("main", { students10, students12 });
});

router.get(
  "/gallery",
  requireAuth,
  allowRoles("student", "staff"),
  (req, res) => {
    res.render("gallery");
  }
);

router.get("/sitemap.xml", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "sitemap.xml"));
});

module.exports = router;
