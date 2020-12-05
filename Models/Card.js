const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const log = require("../helpers/logger");

const cardSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    tags: {
      type: Array,
      required: false,
    },
    color: {
      type: String,
      required: false,
    },
    attachments: {
      type: Array,
      required: false,
    },
    todos: {
      type: Array,
      required: false,
    },
    list_id: {
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

cardSchema.pre("save", async function (next) {
  log(`A card with id ${this._id} was created.`);
  next();
});
cardSchema.pre("update", async function (next) {
  log(`card with id ${this._id} was updated.`);
  next();
});
cardSchema.pre("remove", async function (next) {
  log(`card with id ${this._id} was removed.`);
  next();
});

const card = mongoose.model("card", cardSchema);

module.exports = card;
