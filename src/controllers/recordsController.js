const { getHabitsCollection } = require("../models/habitModel");
const { getRecordsCollection } = require("../models/recordModel");
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

const normalizeBoolean = (value, fieldName) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw createHttpError(400, `${fieldName} must be true or false.`);
};

const createRecord = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);
    const { habitId, date, completed, value, note } = req.body;

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

    const normalizedDate = date ? normalizeDate(date) : normalizeDate(new Date());

    if (!normalizedDate) {
      throw createHttpError(400, "Invalid date value.");
    }

    const parsedValue = value === undefined ? null : Number(value);

    if (value !== undefined && Number.isNaN(parsedValue)) {
      throw createHttpError(400, "value must be numeric.");
    }

    const now = new Date();
    const record = {
      userId,
      habitId: habitObjectId,
      date: normalizedDate,
      completed: completed === undefined ? false : normalizeBoolean(completed, "completed"),
      value: parsedValue,
      note: note ? String(note).trim() : "",
      createdAt: now,
      updatedAt: now,
    };

    const recordsCollection = getRecordsCollection();
    const result = await recordsCollection.insertOne(record);

    return res.status(201).json({
      message: "Record created successfully.",
      record: serializeEntity({ _id: result.insertedId, ...record }),
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getRecords = async (req, res) => {
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

    if (req.query.date) {
      const normalizedDate = normalizeDate(req.query.date);
      if (!normalizedDate) {
        throw createHttpError(400, "Invalid date query parameter.");
      }
      query.date = normalizedDate;
    }

    const recordsCollection = getRecordsCollection();
    const records = await recordsCollection.find(query).sort({ date: -1, createdAt: -1 }).toArray();

    return res.status(200).json(records.map((record) => serializeEntity(record)));
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getRecordById = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);
    const recordId = toObjectId(req.params.recordId);

    if (!userId || !recordId) {
      throw createHttpError(400, "Invalid userId or recordId.");
    }

    const recordsCollection = getRecordsCollection();
    const record = await recordsCollection.findOne({ _id: recordId, userId });

    if (!record) {
      return res.status(404).json({ message: "Record not found." });
    }

    return res.status(200).json(serializeEntity(record));
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const updateRecord = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);
    const recordId = toObjectId(req.params.recordId);

    if (!userId || !recordId) {
      throw createHttpError(400, "Invalid userId or recordId.");
    }

    const { habitId, date, completed, value, note } = req.body;
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

    if (date !== undefined) {
      const normalizedDate = normalizeDate(date);
      if (!normalizedDate) {
        throw createHttpError(400, "Invalid date value.");
      }
      updates.date = normalizedDate;
    }

    if (completed !== undefined) {
      updates.completed = normalizeBoolean(completed, "completed");
    }

    if (value !== undefined) {
      const parsedValue = Number(value);
      if (Number.isNaN(parsedValue)) {
        throw createHttpError(400, "value must be numeric.");
      }
      updates.value = parsedValue;
    }

    if (note !== undefined) {
      updates.note = String(note).trim();
    }

    if (Object.keys(updates).length === 0) {
      throw createHttpError(400, "At least one field is required to update.");
    }

    updates.updatedAt = new Date();

    const recordsCollection = getRecordsCollection();
    const updateResult = await recordsCollection.updateOne(
      { _id: recordId, userId },
      { $set: updates }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: "Record not found." });
    }

    const updatedRecord = await recordsCollection.findOne({ _id: recordId, userId });

    return res.status(200).json({
      message: "Record updated successfully.",
      record: serializeEntity(updatedRecord),
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const deleteRecord = async (req, res) => {
  try {
    const userId = toObjectId(req.auth.userId);
    const recordId = toObjectId(req.params.recordId);

    if (!userId || !recordId) {
      throw createHttpError(400, "Invalid userId or recordId.");
    }

    const recordsCollection = getRecordsCollection();
    const deleteResult = await recordsCollection.deleteOne({ _id: recordId, userId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ message: "Record not found." });
    }

    return res.status(200).json({ message: "Record deleted successfully." });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

module.exports = {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};
