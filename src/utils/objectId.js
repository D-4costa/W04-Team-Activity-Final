const { ObjectId } = require("mongodb");

const toObjectId = (value) => {
  if (!ObjectId.isValid(value)) {
    return null;
  }

  return new ObjectId(value);
};

module.exports = {
  toObjectId,
};
