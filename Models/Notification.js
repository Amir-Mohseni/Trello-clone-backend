const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const log = require("../helpers/logger");

const notificationSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
    },
    user_id: {
      type: String,
      required: false,
    },
    board_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

notificationSchema.pre("save", async function (next) {
  log(`A notification with id ${this._id} was created.`);
  next();
});
notificationSchema.pre("update", async function (next) {
  log(`Notification with id ${this._id} was updated.`);
  next();
});
notificationSchema.pre("remove", async function (next) {
  log(`Notification with id ${this._id} was removed.`);
  next();
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
