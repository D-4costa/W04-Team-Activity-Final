const { ObjectId } = require("mongodb");

const serializeEntity = (entity) => {
  if (!entity) {
    return entity;
  }

  const output = { ...entity };

  Object.keys(output).forEach((key) => {
    if (output[key] instanceof ObjectId) {
      output[key] = output[key].toString();
    }
  });

  if (output._id && typeof output._id !== "string") {
    output._id = output._id.toString();
  }

  return output;
};

module.exports = {
  serializeEntity,
};
