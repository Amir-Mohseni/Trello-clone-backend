const express = require("express");
const listHandlers = require("../Handlers/listHandlers");
const validate = require("../middlewares/validate");
const authorize = require("../middlewares/checkAuth");

const router = express.Router();

router.get(
  "/:id",
  [authorize.mustBeAuthenticated, authorize.canAccessBoardLists],
  listHandlers.getBoardLists
);
router.post(
  "/",
  [
    authorize.mustBeAuthenticated,
    validate.validateCreateList,
    authorize.canAccessBoardLists,
  ],
  listHandlers.createList
);
router.put(
  "/",
  [
    authorize.mustBeAuthenticated,
    validate.validateUpdateList,
    authorize.canChangeList,
    authorize.canAccessBoardLists,
  ],
  listHandlers.updateList
);
router.delete(
  "/",
  [
    authorize.mustBeAuthenticated,
    authorize.canAccessBoardLists,
    authorize.canChangeList,
  ],
  listHandlers.deleteList
);

module.exports = router;
