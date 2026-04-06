const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/signup", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }

  res.render("signup.ejs", { message: req.query.message || "" });
});

router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!name?.trim() || !normalizedEmail || !password?.trim()) {
    return res.render("signup.ejs", {
      message: "Please fill in all required fields.",
    });
  }

  if (!["staff", "student"].includes(role)) {
    return res.render("signup.ejs", {
      message: "Please choose a valid account type.",
    });
  }

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.render("signup.ejs", {
        message: "User already exists. Please login.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    await newUser.save();
    res.redirect("/login?message=Signup successful. Please login.");
  } catch (err) {
    console.error("Signup Error:", err);

    if (err?.code === 11000) {
      return res.render("signup.ejs", {
        message: "User already exists. Please login.",
      });
    }

    res.render("signup.ejs", {
      message: "Signup failed. Please try again later.",
    });
  }
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }

  res.render("login", { message: req.query.message || "" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.render("login", { message: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("login", { message: "Incorrect password." });
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.redirect("/");
  } catch (err) {
    console.error("Login Error:", err);
    res.render("login", { message: "Error during login." });
  }
});

router.get("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login?message=Logged out successfully.");
  });
});

module.exports = router;
