const { getDb } = require("../config/db");

const getHabitsCollection = () => getDb().collection("habits");

module.exports = {
  getHabitsCollection,
};
