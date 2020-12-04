const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const log = require("../helpers/logger");

const boardMembersSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  board_id: {
    type: String,
    required: true,
  },
});

boardMembersSchema.pre("save", async function (next) {
  log(`A boardMember with id ${this._id} was craeted.`);
  next();
});
boardMembersSchema.pre("update", async function (next) {
  log(`BoardMember with id ${this._id} was updated.`);
  next();
});
boardMembersSchema.pre("remove", async function (next) {
  log(`BoardMember with id ${this._id} was removed.`);
  next();
});

const Board_Member = mongoose.model("Board_Member", boardMembersSchema);

module.exports = Board_Member;
