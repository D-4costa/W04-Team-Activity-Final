const express = require("express");

const {
  createUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/usersController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", createUser);
router.post("/login", loginUser);
router.get("/", authenticateToken, getUsers);
router.get("/:userId", authenticateToken, getUserById);
router.put("/:userId", authenticateToken, updateUser);
router.delete("/:userId", authenticateToken, deleteUser);

module.exports = router;
