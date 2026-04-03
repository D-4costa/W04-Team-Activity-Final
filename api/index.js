require("dotenv").config();

const app = require("../src/app");
const { connectToDatabase } = require("../src/config/db");

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    console.error("Vercel function startup error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
