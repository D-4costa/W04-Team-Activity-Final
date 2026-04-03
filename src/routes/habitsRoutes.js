const express = require("express");

const {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
} = require("../controllers/habitsController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.post("/", createHabit);
router.get("/", getHabits);
router.get("/:habitId", getHabitById);
router.put("/:habitId", updateHabit);
router.delete("/:habitId", deleteHabit);

module.exports = router;
