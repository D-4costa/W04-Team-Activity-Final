const { getDb } = require("../config/db");

const getRecordsCollection = () => getDb().collection("records");

module.exports = {
  getRecordsCollection,
};
