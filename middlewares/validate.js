const { returnError } = require("./utils");
const schemas = require("./joiSchemas");

const validateUserAuth = (req, res, next) => {
  const validated = schemas.UserAuthSchema.validate(req.body);

  if (validated.error) returnError(res, validated.error);
  else next();
};

const validateUserUpdate = (req, res, next) => {
  const validated = schemas.updateUserSchema.validate(req.body);

  if (validated.error) returnError(res, validated.error);
  else next();
};

const validateUserChangePass = (req, res, next) => {
  const validated = schemas.changeUserPass.validate(req.body);

  if (validated.error) returnError(res, validated.error);
  else next();
};

const validateCreateBoard = (req, res, next) => {
  const validated = schemas.createBoardSchema.validate(req.body);

  if (req.body.members && req.body.members.length) req.AddMember = true;

  if (validated.error) returnError(res, validated.error);
  else next();
};

const validateUpdateBoard = (req, res, next) => {
  const validated = schemas.updateBoardSchema.validate(req.body);

  if (validated.error) returnError(res, validated.error);
  else next();
};

const validateCreateList = (req, res, next) => {
  const validated = schemas.createListSchema.validate(req.body);

  if (validated.error) returnError(res, validated.error);
  else next();
};

const validateUpdateList = (req, res, next) => {
  const validated = schemas.updateListSchema.validate(req.body);

  if (validated.error) returnError(res, validated.error);
  else next();
};

const validateCreateCard = (req, res, next) => {
  const validated = schemas.createCardSchema.validate(req.body);

  if (req.body.members.length) req.AddMember = true;

  if (validated.error) returnError(res, validated.error);
  else next();
};

const validateUpdateCard = (req, res, next) => {
  const validated = schemas.updateCardSchema.validate(req.body);

  if (validated.error) returnError(res, validated.error);
  else next();
};

const validateCreateNotif = (req, res, next) => {
  const validated = schemas.createNotifSchema.validate(req.body);

  if (validated.error) returnError(res, validated.error);
  else next();
};

const validateUpdateNotif = (req, res, next) => {
  const validated = schemas.updateNotifSchema.validate(req.body);

  if (validated.error) returnError(res, validated.error);
  else next();
};

module.exports = {
  validateUserAuth,
  validateUserUpdate,
  validateUserChangePass,
  validateCreateBoard,
  validateUpdateBoard,
  validateCreateList,
  validateUpdateList,
  validateCreateCard,
  validateUpdateCard,
  validateCreateNotif,
  validateUpdateNotif,
};
