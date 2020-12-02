const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const log = require("../helpers/logger");

const boardSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    icon: {
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

boardSchema.pre("save", async function (next) {
  log(`A board with id ${this._id} was created.`);
  next();
});
boardSchema.pre("update", async function (next) {
  log(`Board with id ${this._id} was updated.`);
  next();
});
boardSchema.pre("remove", async function (next) {
  log(`Board with id ${this._id} was removed.`);
  next();
});

const Board = mongoose.model("Board", boardSchema);

module.exports = Board;
