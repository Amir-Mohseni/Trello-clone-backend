const Joi = require("joi");

// User
const UserAuthSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),

  password: Joi.string()
    .pattern(new RegExp("^[a-zA-Z0-9 !]{4,30}$"))
    .required(),
});

const updateUserSchema = Joi.object({
  id: Joi.string().length(24).required(),

  username: Joi.string().alphanum().min(3).max(30),

  refreshToken: Joi.string(),

  sex: Joi.boolean(),
});

const changeUserPass = Joi.object({
  id: Joi.string().length(24).required(),

  oldPassword: Joi.string().pattern(new RegExp("^[a-zA-Z0-9 !]{4,30}$")),

  newPassword: Joi.string().pattern(new RegExp("^[a-zA-Z0-9 !]{4,30}$")),
});

// Board
const createBoardSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),

  color: Joi.string().required(),

  icon: Joi.string().required(),

  members: Joi.array(),
});
const updateBoardSchema = Joi.object({
  id: Joi.string().length(24).required(),

  name: Joi.string().min(3).max(30),

  color: Joi.string(),

  icon: Joi.string(),
});

// List
const createListSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),

  board_id: Joi.string().length(24).required(),
});
const updateListSchema = Joi.object({
  id: Joi.string().length(24).required(),

  name: Joi.string().min(3).max(30),

  board_id: Joi.string().length(24).required(),
});

// Task
const createCardSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),

  list_id: Joi.string().length(24).required(),

  board_id: Joi.string().length(24).required(),

  tags: Joi.array(),

  color: Joi.string(),

  attachments: Joi.array(),

  todos: Joi.array(),

  members: Joi.array().items(Joi.string().length(24)),
});
const updateCardSchema = Joi.object({
  id: Joi.string().length(24).required(),

  name: Joi.string().min(3).max(30),

  list_id: Joi.string().length(24),

  board_id: Joi.string().length(24),

  tags: Joi.array(),

  color: Joi.string(),

  attachments: Joi.array(),

  todos: Joi.array(),

  members: Joi.array().items(Joi.string().length(24)),
});

// Notification
const createNotifSchema = Joi.object({
  description: Joi.string().alphanum().min(3).max(60).required(),

  user_id: Joi.string().length(24).required(),

  board_id: Joi.string().length(24).required(),
});
const updateNotifSchema = Joi.object({
  description: Joi.string().alphanum().min(3).max(60),

  user_id: Joi.string().length(24),

  board_id: Joi.string().length(24),
});

module.exports = {
  UserAuthSchema,
  updateUserSchema,
  changeUserPass,
  createBoardSchema,
  updateBoardSchema,
  createListSchema,
  updateListSchema,
  createCardSchema,
  updateCardSchema,
  createNotifSchema,
  updateNotifSchema,
};
