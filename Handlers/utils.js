const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const moment = require("moment");

const generateToken = async (userID, refreshed = false) => {
  const accessToken = jwt.sign(
    { id: userID },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: refreshed ? "2d" : "15min" }
  );
  const rToken = jwt.sign({ id: userID }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: refreshed ? "4d" : "2d",
  });

  const ok = await User.updateOne(
    { _id: userID },
    { $set: { refreshToken: rToken } }
  );
  if (!ok) {
    return { success: false };
  }
  return { success: true, access_token: accessToken, refresh_token: rToken };
};

const getTimePast = (time) => {
  if (Math.abs(moment(time).diff(moment(), "seconds")) < 60) {
    return Math.abs(moment(time).diff(moment(), "seconds")) + " ثانیه پیش ";
  } else if (Math.abs(moment(time).diff(moment(), "minutes")) < 60) {
    return Math.abs(moment(time).diff(moment(), "minutes")) + " دقیقه پیش ";
  } else if (Math.abs(moment(time).diff(moment(), "hours")) < 24) {
    return Math.abs(moment(time).diff(moment(), "hours")) + " ساعت پیش ";
  } else if (Math.abs(moment(time).diff(moment(), "days")) < 30) {
    return Math.abs(moment(time).diff(moment(), "days")) + " روز پیش ";
  } else if (Math.abs(moment(time).diff(moment(), "months")) < 12) {
    return Math.abs(moment(time).diff(moment(), "months")) + " ماه پیش ";
  } else {
    return Math.abs(moment(time).diff(moment(), "years")) + " سال پیش ";
  }
};

module.exports = {
  generateToken,
  getTimePast,
};
