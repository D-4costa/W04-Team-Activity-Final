const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const apiRoutes = require("./routes");
const swaggerDocument = require("../swagger/swagger.json");

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Habit Tracker API is running.",
    docs: "/api-docs",
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

module.exports = app;
