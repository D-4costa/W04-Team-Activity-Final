const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const handleControllerError = (res, error) => {
  if (error && error.statusCode === 400) {
    return res.status(400).json({ message: error.message });
  }

  if (error && error.statusCode === 401) {
    return res.status(401).json({ message: error.message });
  }

  if (error && error.statusCode === 404) {
    return res.status(404).json({ message: error.message });
  }

  if (error && error.code === 11000) {
    return res.status(400).json({ message: "Duplicate key error. This value already exists." });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error." });
};

module.exports = {
  createHttpError,
  handleControllerError,
};
