const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { getUsersCollection } = require("../models/userModel");
const { createHttpError, handleControllerError } = require("../utils/httpError");
const { toObjectId } = require("../utils/objectId");
const { sanitizeUser } = require("../utils/sanitizeUser");

const SALT_ROUNDS = 10;

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw createHttpError(500, "JWT_SECRET is not configured.");
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

const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw createHttpError(400, "name, email and password are required.");
    }

    if (String(password).length < 6) {
      throw createHttpError(400, "password must be at least 6 characters.");
    }

    const normalizedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      throw createHttpError(400, "name and email cannot be empty.");
    }

    const usersCollection = getUsersCollection();
    const existingUser = await usersCollection.findOne({ email: normalizedEmail });

    if (existingUser) {
      throw createHttpError(400, "A user with this email already exists.");
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
    const newUser = {
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    const result = await usersCollection.insertOne(newUser);
    const createdUser = { _id: result.insertedId, ...newUser };
    const token = createToken(createdUser);

    return res.status(201).json({
      message: "User created successfully.",
      token,
      user: sanitizeUser(createdUser),
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createHttpError(400, "email and password are required.");
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedEmail) {
      throw createHttpError(400, "email cannot be empty.");
    }

    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne({ email: normalizedEmail });

    if (!user || !user.passwordHash) {
      throw createHttpError(400, "Invalid email or password.");
    }

    const isValid = await bcrypt.compare(String(password), user.passwordHash);

    if (!isValid) {
      throw createHttpError(400, "Invalid email or password.");
    }

    const token = createToken(user);
    return res.status(200).json({
      message: "Login successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getUsers = async (req, res) => {
  try {
    const usersCollection = getUsersCollection();
    const users = await usersCollection.find({}).toArray();
    const safeUsers = users.map((user) => sanitizeUser(user));

    return res.status(200).json(safeUsers);
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = toObjectId(req.params.userId);

    if (!userId) {
      throw createHttpError(400, "Invalid userId.");
    }

    const usersCollection = getUsersCollection();
    const user = await usersCollection.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json(sanitizeUser(user));
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = toObjectId(req.params.userId);

    if (!userId) {
      throw createHttpError(400, "Invalid userId.");
    }

    const { name, email, password } = req.body;
    const updates = {};
    const usersCollection = getUsersCollection();

    if (name !== undefined) {
      const normalizedName = String(name).trim();
      if (!normalizedName) {
        throw createHttpError(400, "name cannot be empty.");
      }
      updates.name = normalizedName;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail) {
        throw createHttpError(400, "email cannot be empty.");
      }

      const existingUser = await usersCollection.findOne({
        email: normalizedEmail,
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw createHttpError(400, "A user with this email already exists.");
      }

      updates.email = normalizedEmail;
    }

    if (password !== undefined) {
      if (String(password).length < 6) {
        throw createHttpError(400, "password must be at least 6 characters.");
      }

      updates.passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);
    }

    if (Object.keys(updates).length === 0) {
      throw createHttpError(400, "At least one field is required to update.");
    }

    updates.updatedAt = new Date();

    const updateResult = await usersCollection.updateOne(
      { _id: userId },
      {
        $set: updates,
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const updatedUser = await usersCollection.findOne({ _id: userId });
    return res.status(200).json({
      message: "User updated successfully.",
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = toObjectId(req.params.userId);

    if (!userId) {
      throw createHttpError(400, "Invalid userId.");
    }

    const usersCollection = getUsersCollection();
    const deleteResult = await usersCollection.deleteOne({ _id: userId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

module.exports = {
  createUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
