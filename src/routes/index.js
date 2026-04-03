const express = require("express");

const usersRoutes = require("./usersRoutes");
const habitsRoutes = require("./habitsRoutes");
const recordsRoutes = require("./recordsRoutes");
const streaksRoutes = require("./streaksRoutes");

const router = express.Router();

router.use("/users", usersRoutes);
router.use("/habits", habitsRoutes);
router.use("/records", recordsRoutes);
router.use("/streaks", streaksRoutes);

module.exports = router;
