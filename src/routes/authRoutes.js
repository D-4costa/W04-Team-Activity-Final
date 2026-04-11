const express = require("express");

const { githubAuth, githubCallback, logout } = require("../controllers/authController");

const router = express.Router();

router.get("/login", githubAuth);
router.get("/github", githubAuth);
router.get("/callback", githubCallback, (req, res) => {
  return res.redirect("/api-docs");
});
router.get("/github/callback", githubCallback, (req, res) => {
  return res.redirect("/api-docs");
});
router.get("/logout", logout, (req, res) => {
  return res.redirect("/");
});
router.post("/logout", logout);

module.exports = router;
