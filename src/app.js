require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");

const apiRoutes = require("./routes");
const { configurePassport } = require("./config/passport");
const { githubAuth, logout } = require("./controllers/authController");
const swaggerDocument = require("../swagger/swagger.json");

configurePassport();

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

app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  return res.redirect("/api-docs");
});

app.get("/login", githubAuth);
app.get("/logout", logout, (req, res) => res.redirect("/"));

app.use("/api-docs", swaggerUi.serveFiles(swaggerDocument), swaggerUi.setup(swaggerDocument));
app.use(apiRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

module.exports = app;
