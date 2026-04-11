const jwt = require("jsonwebtoken");
const passport = require("passport");

const { isGithubEnabled } = require("../config/passport");
const { getUsersCollection } = require("../models/userModel");
const { sanitizeUser } = require("../utils/sanitizeUser");

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email || null,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

const clearSessionCookie = (res) => {
  res.clearCookie("connect.sid", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
};

const githubAuth = (req, res, next) => {
  if (!isGithubEnabled()) {
    return res.status(400).json({
      message: "GitHub OAuth is not configured in environment variables.",
    });
  }

  return passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
};

const githubCallback = (req, res, next) => {
  if (!isGithubEnabled()) {
    return res.status(400).json({
      message: "GitHub OAuth is not configured in environment variables.",
    });
  }

  return passport.authenticate("github", { session: true }, async (error, githubProfile) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "GitHub authentication failed." });
    }

    if (!githubProfile) {
      return res.status(400).json({ message: "GitHub profile data was not received." });
    }

    try {
      const usersCollection = getUsersCollection();
      const normalizedEmail = githubProfile.email ? githubProfile.email.trim().toLowerCase() : null;

      let user = await usersCollection.findOne({ githubId: githubProfile.githubId });
      if (!user && normalizedEmail) {
        user = await usersCollection.findOne({ email: normalizedEmail });
      }

      const now = new Date();

      if (!user) {
        const newUser = {
          name: githubProfile.displayName || githubProfile.username || "GitHub User",
          githubId: githubProfile.githubId,
          createdAt: now,
          updatedAt: now,
        };

        if (normalizedEmail) {
          newUser.email = normalizedEmail;
        }

        const insertResult = await usersCollection.insertOne(newUser);
        user = { _id: insertResult.insertedId, ...newUser };
      } else {
        const updates = {
          githubId: githubProfile.githubId,
          updatedAt: now,
        };

        if (!user.name && (githubProfile.displayName || githubProfile.username)) {
          updates.name = githubProfile.displayName || githubProfile.username;
        }

        if (!user.email && normalizedEmail) {
          updates.email = normalizedEmail;
        }

        await usersCollection.updateOne({ _id: user._id }, { $set: updates });
        user = { ...user, ...updates };
      }

      const sessionUser = {
        _id: user._id.toString(),
        name: user.name || null,
        email: user.email || null,
        githubId: user.githubId || null,
      };

      req.login(sessionUser, { session: true }, (loginError) => {
        if (loginError) {
          console.error(loginError);
          return res.status(500).json({ message: "Session login failed." });
        }

        const token = createToken(user);
        req.oauthResult = {
          message: "GitHub authentication successful.",
          token,
          user: sanitizeUser(user),
        };

        if (req.session) {
          req.session.jwtToken = token;
        }

        if (typeof next === "function") {
          return next();
        }

        return res.status(200).json(req.oauthResult);
      });
    } catch (callbackError) {
      console.error(callbackError);
      return res.status(500).json({ message: "Internal server error." });
    }
  })(req, res, next);
};

const logout = (req, res, next) => {
  req.logout((logoutError) => {
    if (logoutError) {
      console.error(logoutError);
      return res.status(500).json({ message: "Logout failed." });
    }

    if (req.session) {
      req.session.destroy((sessionError) => {
        if (sessionError) {
          console.error(sessionError);
          return res.status(500).json({ message: "Logout failed." });
        }

        clearSessionCookie(res);

        if (typeof next === "function") {
          return next();
        }
        return res.status(200).json({ message: "Logout successful." });
      });
      return;
    }

    clearSessionCookie(res);

    if (typeof next === "function") {
      return next();
    }

    return res.status(200).json({ message: "Logout successful." });
  });
};

module.exports = {
  githubAuth,
  githubCallback,
  logout,
};
