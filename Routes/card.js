const express = require("express");
const cardHandlers = require("../Handlers/cardHandlers");
const validate = require("../middlewares/validate");
const authorize = require("../middlewares/checkAuth");
const upload = require("../multerFuncs");

const router = express.Router();

router.get(
  "/:id",
  [authorize.mustBeAuthenticated, authorize.canAccessBoardCard],
  cardHandlers.getUserCards
);
router.post(
  "/",
  [
    authorize.mustBeAuthenticated,
    authorize.canAccessBoardCard,
    validate.validateCreateCard,
  ],
  cardHandlers.createCard
);
router.put(
  "/",
  [
    authorize.mustBeAuthenticated,
    validate.validateUpdateCard,
    authorize.canChangeCard,
  ],
  cardHandlers.updateCard
);
router.delete(
  "/",
  [authorize.mustBeAuthenticated, authorize.canChangeCard],
  cardHandlers.deleteCard
);

router.post(
  "/add",
  [authorize.mustBeAuthenticated, authorize.canChangeCard],
  cardHandlers.addMemberToCard
);

router.delete(
  "/remove",
  [authorize.mustBeAuthenticated, authorize.canChangeCard],
  cardHandlers.removeMemberFromCard
);

router.put(
  "/todo/check",
  [authorize.mustBeAuthenticated, authorize.canChangeCard],
  cardHandlers.checkCardTodo
);

router.put(
  "/todo/uncheck",
  [authorize.mustBeAuthenticated, authorize.canChangeCard],
  cardHandlers.unCheckCardTodo
);

router.post(
  "/todo/add",
  [authorize.mustBeAuthenticated, authorize.canChangeCard],
  cardHandlers.addTodo
);

router.put(
  "/todo/edit",
  [authorize.mustBeAuthenticated, authorize.canChangeCard],
  cardHandlers.editTodo
);

router.delete(
  "/todo/remove",
  [authorize.mustBeAuthenticated, authorize.canChangeCard],
  cardHandlers.removeTodo
);

router.post(
  "/attachments/add",
  [authorize.mustBeAuthenticated, authorize.canChangeCardForUpload],
  upload.uploadForCardAttachment.single("photo"),
  cardHandlers.uploadAttachment
);

router.delete(
  "/attachments/remove",
  [authorize.mustBeAuthenticated, authorize.canChangeCard],
  cardHandlers.removeAttachment
);

module.exports = router;
