const express = require("express");

const {
  createStreak,
  getStreaks,
  getStreakById,
  updateStreak,
  deleteStreak,
} = require("../controllers/streaksController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.post("/", createStreak);
router.get("/", getStreaks);
router.get("/:streakId", getStreakById);
router.put("/:streakId", updateStreak);
router.delete("/:streakId", deleteStreak);

module.exports = router;
