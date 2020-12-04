const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const log = require("../helpers/logger");

const listSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    board_id: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

listSchema.pre("save", async function (next) {
  log(`A list with id ${this._id} was created.`);
  next();
});
listSchema.pre("update", async function (next) {
  log(`List with id ${this._id} was updated.`);
  next();
});
listSchema.pre("remove", async function (next) {
  log(`List with id ${this._id} was removed.`);
  next();
});

const List = mongoose.model("List", listSchema);

module.exports = List;
