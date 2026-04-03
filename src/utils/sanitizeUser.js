const { serializeEntity } = require("./serializeEntity");

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const safeUser = serializeEntity(user);
  delete safeUser.passwordHash;
  return safeUser;
};

module.exports = {
  sanitizeUser,
};
