const validator = require("validator");
// const schemas = require("./joiSchemas");

const returnError = (res, error) => {
  res.json({
    success: false,
    invalid: error.details[0].path,
    code: 2,
  });
  return;
};

const validateId = (req, res, type = "") => {
  let id;

  if (type === "headers") id = req.headers.id;
  else if (type === "list") id = req.body.board_id;
  else id = req.body.id || req.params.id;

  if (!id || typeof id !== "string" || id.length != 24) {
    res.status(300).json({
      success: false,
      message:
        "Id must be valid and passed with the " +
        (type === "headers" ? "headers" : "body"),
      code: 1,
    });
    return false;
  }
  return true;
};

module.exports = {
  returnError,
  validateId,
};
