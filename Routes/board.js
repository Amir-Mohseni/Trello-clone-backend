const express = require("express");
const boardHandlers = require("../Handlers/boardHandlers");
const validate = require("../middlewares/validate");
const authorize = require("../middlewares/checkAuth");

const router = express.Router();

router.get(
  "/getusers",
  authorize.mustBeAuthenticated,
  boardHandlers.getUserBoards
);

router.post(
  "/",
  [authorize.mustBeAuthenticated, validate.validateCreateBoard],
  boardHandlers.createBoard
);

router.put(
  "/",
  [
    authorize.mustBeAuthenticated,
    validate.validateUpdateBoard,
    authorize.canChangeBoard,
  ],
  boardHandlers.updateBoard
);

router.delete(
  "/",
  [authorize.mustBeAuthenticated, authorize.canChangeBoard],
  boardHandlers.deleteBoard
);

router.post(
  "/add",
  [authorize.mustBeAuthenticated, authorize.canChangeBoard],
  boardHandlers.addMemberToBoard
);

router.delete(
  "/remove",
  [authorize.mustBeAuthenticated, authorize.canChangeBoard],
  boardHandlers.removeMemberFromBoard
);

module.exports = router;
