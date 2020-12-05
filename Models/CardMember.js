const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cardMembersSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  card_id: {
    type: String,
    required: true,
  },
});

const Card_Member = mongoose.model("Card_Member", cardMembersSchema);

module.exports = Card_Member;
