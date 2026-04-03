const { getDb } = require("../config/db");

const getUsersCollection = () => getDb().collection("users");

module.exports = {
  getUsersCollection,
};
