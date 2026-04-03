const { getHabitsCollection } = require("../models/habitModel");
const { createHttpError, handleControllerError } = require("../utils/httpError");
const { toObjectId } = require("../utils/objectId");
const { serializeEntity } = require("../utils/serializeEntity");

const createHabit = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);
    const { title, description, goalType, targetValue } = req.body;

    if (!userId) {
      throw createHttpError(400, "Invalid authenticated user.");
    }

    if (!title) {
      throw createHttpError(400, "title is required.");
    }

    const parsedTargetValue = targetValue === undefined ? 1 : Number(targetValue);

    if (Number.isNaN(parsedTargetValue) || parsedTargetValue <= 0) {
      throw createHttpError(400, "targetValue must be a positive number.");
    }

    const now = new Date();
    const habit = {
      userId,
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      goalType: goalType ? String(goalType).trim() : "daily",
      targetValue: parsedTargetValue,
      createdAt: now,
      updatedAt: now,
    };

    const habitsCollection = getHabitsCollection();
    const result = await habitsCollection.insertOne(habit);

    return res.status(201).json({
      message: "Habit created successfully.",
      habit: serializeEntity({ _id: result.insertedId, ...habit }),
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getHabits = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);

    if (!userId) {
      throw createHttpError(400, "Invalid authenticated user.");
    }

    const habitsCollection = getHabitsCollection();
    const habits = await habitsCollection.find({ userId }).toArray();

    return res.status(200).json(habits.map((habit) => serializeEntity(habit)));
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getHabitById = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);
    const habitId = toObjectId(req.params.habitId);

    if (!userId || !habitId) {
      throw createHttpError(400, "Invalid userId or habitId.");
    }

    const habitsCollection = getHabitsCollection();
    const habit = await habitsCollection.findOne({ _id: habitId, userId });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found." });
    }

    return res.status(200).json(serializeEntity(habit));
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const updateHabit = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);
    const habitId = toObjectId(req.params.habitId);

    if (!userId || !habitId) {
      throw createHttpError(400, "Invalid userId or habitId.");
    }

    const { title, description, goalType, targetValue } = req.body;
    const updates = {};

    if (title !== undefined) {
      const normalizedTitle = String(title).trim();
      if (!normalizedTitle) {
        throw createHttpError(400, "title cannot be empty.");
      }
      updates.title = normalizedTitle;
    }

    if (description !== undefined) {
      updates.description = String(description).trim();
    }

    if (goalType !== undefined) {
      const normalizedGoalType = String(goalType).trim();
      if (!normalizedGoalType) {
        throw createHttpError(400, "goalType cannot be empty.");
      }
      updates.goalType = normalizedGoalType;
    }

    if (targetValue !== undefined) {
      const parsedTargetValue = Number(targetValue);
      if (Number.isNaN(parsedTargetValue) || parsedTargetValue <= 0) {
        throw createHttpError(400, "targetValue must be a positive number.");
      }
      updates.targetValue = parsedTargetValue;
    }

    if (Object.keys(updates).length === 0) {
      throw createHttpError(400, "At least one field is required to update.");
    }

    updates.updatedAt = new Date();

    const habitsCollection = getHabitsCollection();
    const updateResult = await habitsCollection.updateOne(
      { _id: habitId, userId },
      { $set: updates }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: "Habit not found." });
    }

    const updatedHabit = await habitsCollection.findOne({ _id: habitId, userId });

    return res.status(200).json({
      message: "Habit updated successfully.",
      habit: serializeEntity(updatedHabit),
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const deleteHabit = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);
    const habitId = toObjectId(req.params.habitId);

    if (!userId || !habitId) {
      throw createHttpError(400, "Invalid userId or habitId.");
    }

    const habitsCollection = getHabitsCollection();
    const deleteResult = await habitsCollection.deleteOne({ _id: habitId, userId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "Habit not found." });
    }

    return res.status(200).json({ message: "Habit deleted successfully." });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

module.exports = {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
};
