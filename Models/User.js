const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");
const log = require("../helpers/logger");

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    admin: {
      type: Boolean,
      required: true,
    },
    refreshToken: {
      type: String,
      required: false,
      default: "",
    },
    pic: {
      type: String,
      required: false,
      default: "",
    },
    sex: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  log(`A user with id ${this._id} was created.`);
  // hash the password
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
userSchema.pre("updateOne", async function (next) {
  log(`User with name ${this._id} was updated.`);
  next();
});
userSchema.pre("remove", async function (next) {
  log(`User with id ${this._id} was removed.`);
  next();
});

userSchema.statics.login = async function (username, password) {
  const user = await this.findOne({ username });

  if (user) {
    const auth = await bcrypt.compare(password, user.password);

    if (auth) {
      return user;
    } else {
      return "pass";
    }
  }

  return "username";
};

const User = mongoose.model("User", userSchema);

module.exports = User;
