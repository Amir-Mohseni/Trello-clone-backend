const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const log = require("../helpers/logger");

const userNotificationSchema = new Schema(
  {
    removed: {
      type: Boolean,
      required: true,
      default: false,
    },
    user_id: {
      type: String,
      required: true,
    },
    notification_id: {
      type: String,
      required: true,
    },
    seen: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  { timestamps: true }
);

userNotificationSchema.pre("save", async function (next) {
  log(`A user notification with id ${this._id} was created.`);
  next();
});
userNotificationSchema.pre("update", async function (next) {
  log(`User notification with id ${this._id} was updated.`);
  next();
});
userNotificationSchema.pre("remove", async function (next) {
  log(`User Notification with id ${this._id} was removed.`);
  next();
});

const User_Notification = mongoose.model(
  "User_Notification",
  userNotificationSchema
);

module.exports = User_Notification;
