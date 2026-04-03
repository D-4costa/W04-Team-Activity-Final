const express = require("express");

const {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} = require("../controllers/recordsController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.post("/", createRecord);
router.get("/", getRecords);
router.get("/:recordId", getRecordById);
router.put("/:recordId", updateRecord);
router.delete("/:recordId", deleteRecord);

module.exports = router;
