const express = require("express");
const userHandlers = require("../Handlers/userHandlers");
const validate = require("../middlewares/validate");
const authorize = require("../middlewares/checkAuth");
const upload = require("../multerFuncs");

const router = express.Router();

router.post(
  "/register",
  [authorize.mustNotBeAuthenticated, validate.validateUserAuth],
  userHandlers.register
);
router.post(
  "/login",
  [authorize.mustNotBeAuthenticated, validate.validateUserAuth],
  userHandlers.login
);
router.get(
  "/checkAuth",
  authorize.mustBeAuthenticated,
  userHandlers.checkAuthenticated
);

router.post("/refreshtoken", userHandlers.refreshToken);

router.post(
  "/uploaduserphoto",
  authorize.mustBeAuthenticated,
  upload.uploadForUserPhoto.single("photo"),
  userHandlers.uploadUserPhoto
);

router.get(
  "/getalladmin",
  [authorize.mustBeAuthenticated, authorize.onlyAdmin],
  userHandlers.getUsers
);

router.post(
  "/getall",
  [authorize.mustBeAuthenticated],
  userHandlers.getMembers
);

router.put(
  "/",
  [
    authorize.mustBeAuthenticated,
    validate.validateUserUpdate,
    authorize.onlyOwnerAndAdmin,
  ],
  userHandlers.editUser
);

router.put(
  "/pass",
  [
    authorize.mustBeAuthenticated,
    validate.validateUserChangePass,
    authorize.onlyOwnerAndAdmin,
  ],
  userHandlers.changeUserPass
);

router.delete(
  "/",
  [
    authorize.mustBeAuthenticated,
    authorize.onlyAdmin,
    validate.validateUserUpdate,
  ],
  userHandlers.deleteUser
);

module.exports = router;
