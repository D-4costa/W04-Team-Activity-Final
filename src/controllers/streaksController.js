const { getHabitsCollection } = require("../models/habitModel");
const { getStreaksCollection } = require("../models/streakModel");
const { createHttpError, handleControllerError } = require("../utils/httpError");
const { toObjectId } = require("../utils/objectId");
const { serializeEntity } = require("../utils/serializeEntity");

const normalizeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().split("T")[0];
};

const validateNonNegativeInteger = (value, fieldName) => {
  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw createHttpError(400, `${fieldName} must be a non-negative integer.`);
  }

  return parsedValue;
};

const createStreak = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);
    const { habitId, currentStreak, longestStreak, lastCompletedDate } = req.body;

    if (!userId) {
      throw createHttpError(400, "Invalid authenticated user.");
    }

    if (!habitId) {
      throw createHttpError(400, "habitId is required.");
    }

    const habitObjectId = toObjectId(habitId);
    if (!habitObjectId) {
      throw createHttpError(400, "Invalid habitId.");
    }

    const habitsCollection = getHabitsCollection();
    const habit = await habitsCollection.findOne({ _id: habitObjectId, userId });
    if (!habit) {
      throw createHttpError(400, "Habit does not exist for this user.");
    }

    const normalizedDate = lastCompletedDate ? normalizeDate(lastCompletedDate) : null;
    if (lastCompletedDate && !normalizedDate) {
      throw createHttpError(400, "Invalid lastCompletedDate.");
    }

    const now = new Date();
    const streak = {
      userId,
      habitId: habitObjectId,
      currentStreak: currentStreak === undefined ? 0 : validateNonNegativeInteger(currentStreak, "currentStreak"),
      longestStreak:
        longestStreak === undefined ? 0 : validateNonNegativeInteger(longestStreak, "longestStreak"),
      lastCompletedDate: normalizedDate,
      createdAt: now,
      updatedAt: now,
    };

    const streaksCollection = getStreaksCollection();
    const existing = await streaksCollection.findOne({ userId, habitId: habitObjectId });
    if (existing) {
      throw createHttpError(400, "A streak already exists for this habit.");
    }

    const result = await streaksCollection.insertOne(streak);

    return res.status(201).json({
      message: "Streak created successfully.",
      streak: serializeEntity({ _id: result.insertedId, ...streak }),
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getStreaks = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);

    if (!userId) {
      throw createHttpError(400, "Invalid authenticated user.");
    }

    const query = { userId };

    if (req.query.habitId) {
      const habitObjectId = toObjectId(req.query.habitId);
      if (!habitObjectId) {
        throw createHttpError(400, "Invalid habitId query parameter.");
      }
      query.habitId = habitObjectId;
    }

    const streaksCollection = getStreaksCollection();
    const streaks = await streaksCollection.find(query).toArray();

    return res.status(200).json(streaks.map((streak) => serializeEntity(streak)));
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getStreakById = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);
    const streakId = toObjectId(req.params.streakId);

    if (!userId || !streakId) {
      throw createHttpError(400, "Invalid userId or streakId.");
    }

    const streaksCollection = getStreaksCollection();
    const streak = await streaksCollection.findOne({ _id: streakId, userId });

    if (!streak) {
      return res.status(404).json({ message: "Streak not found." });
    }

    return res.status(200).json(serializeEntity(streak));
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const updateStreak = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);
    const streakId = toObjectId(req.params.streakId);

    if (!userId || !streakId) {
      throw createHttpError(400, "Invalid userId or streakId.");
    }

    const { habitId, currentStreak, longestStreak, lastCompletedDate } = req.body;
    const updates = {};

    if (habitId !== undefined) {
      const habitObjectId = toObjectId(habitId);
      if (!habitObjectId) {
        throw createHttpError(400, "Invalid habitId.");
      }

      const habitsCollection = getHabitsCollection();
      const habit = await habitsCollection.findOne({ _id: habitObjectId, userId });
      if (!habit) {
        throw createHttpError(400, "Habit does not exist for this user.");
      }

      updates.habitId = habitObjectId;
    }

    if (currentStreak !== undefined) {
      updates.currentStreak = validateNonNegativeInteger(currentStreak, "currentStreak");
    }

    if (longestStreak !== undefined) {
      updates.longestStreak = validateNonNegativeInteger(longestStreak, "longestStreak");
    }

    if (lastCompletedDate !== undefined) {
      if (lastCompletedDate === null || lastCompletedDate === "") {
        updates.lastCompletedDate = null;
      } else {
        const normalizedDate = normalizeDate(lastCompletedDate);
        if (!normalizedDate) {
          throw createHttpError(400, "Invalid lastCompletedDate.");
        }
        updates.lastCompletedDate = normalizedDate;
      }
    }

    if (Object.keys(updates).length === 0) {
      throw createHttpError(400, "At least one field is required to update.");
    }

    updates.updatedAt = new Date();

    const streaksCollection = getStreaksCollection();
    const updateResult = await streaksCollection.updateOne(
      { _id: streakId, userId },
      { $set: updates }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: "Streak not found." });
    }

    const updatedStreak = await streaksCollection.findOne({ _id: streakId, userId });

    return res.status(200).json({
      message: "Streak updated successfully.",
      streak: serializeEntity(updatedStreak),
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const deleteStreak = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);
    const streakId = toObjectId(req.params.streakId);

    if (!userId || !streakId) {
      throw createHttpError(400, "Invalid userId or streakId.");
    }

    const streaksCollection = getStreaksCollection();
    const deleteResult = await streaksCollection.deleteOne({ _id: streakId, userId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "Streak not found." });
    }

    return res.status(200).json({ message: "Streak deleted successfully." });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

module.exports = {
  createStreak,
  getStreaks,
  getStreakById,
  updateStreak,
  deleteStreak,
};
