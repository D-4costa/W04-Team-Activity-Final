const { getDb } = require("../config/db");

const getStreaksCollection = () => getDb().collection("streaks");

module.exports = {
  getStreaksCollection,
};
