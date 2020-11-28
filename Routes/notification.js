const express = require("express");
const notifHandlers = require("../Handlers/notificationHandlers");
const authorize = require("../middlewares/checkAuth");

const router = express.Router();

router.get("/get", authorize.mustBeAuthenticated, notifHandlers.getUserNotifs);

router.put("/seen", authorize.mustBeAuthenticated, notifHandlers.seenUserNotif);

router.delete(
  "/remove",
  authorize.mustBeAuthenticated,
  notifHandlers.removeUserNotif
);

module.exports = router;
