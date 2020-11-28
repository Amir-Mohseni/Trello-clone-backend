const User = require("../Models/User");
const jwt = require("jsonwebtoken");
const { generateToken } = require("./utils");
const Event = require("../Events/Event");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const register = async (req, res) => {
  let { username, password } = req.body;

  try {
    const user = await User.create({ username, password, admin: false });

    if (!user) {
      res.status(500).json({
        success: false,
        message: "user coludn/'t be saved into database.",
      });
      return;
    }

    // create tokens and store them in the DB
    const token = await generateToken(user._id);
    if (!token) {
      res.status(500).json({
        success: false,
        message: "tokens couldnt be saved in the database.",
      });
      return;
    }

    res.status(201).json({
      success: true,
      messagee: "User created successfuly",
      user: {
        id: user._id,
        name: user.username,
        admin: user.admin,
        pic: user.pic,
        sex: user.sex,
      },
      ...token,
    });
  } catch (err) {
    let error = {};
    // duplicate error code
    if ((err.code = 11000)) {
      error.success = false;
      error.username = "A user with this username already exists.";
      error.code = 4;
    } else {
      error = err;
    }
    res.json(error);
    return;
  }
};

const login = async (req, res) => {
  let { username, password } = req.body;

  try {
    const user = await User.login(username, password);

    if (user === "username") {
      res.json({ success: false, message: "Incorrect Username", code: 4 });
      return;
    }

    if (user === "pass") {
      res.json({ success: false, message: "Incorrect password", code: 5 });
      return;
    }

    const token = await generateToken(user._id);

    if (!token) {
      res.status(500).json({
        success: false,
        message: "token coludn/'t be saved into database.",
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: "User logged in successfuly.",
      user: {
        id: user._id,
        name: user.username,
        admin: user.admin,
        pic: user.pic,
        sex: user.sex,
      },
      ...token,
    });
  } catch (err) {
    console.log(err);
    res.json({ err: err });
    return;
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select({
      username: 1,
      _id: 1,
      createdAt: 1,
      pic: 1,
      sex: 1,
    });

    res.status(200).json({ users, success: true });
  } catch (err) {
    res.status(500).json({ err, success: true });
  }
};

const getMembers = async (req, res) => {
  if (!req.body.username || typeof req.body.username !== "string") {
    const users = await User.find({}).select({
      username: 1,
      _id: 1,
      pic: 1,
      sex: 1,
    });

    res.status(200).json({ success: true, users });
    return;
  }
  try {
    const users = await User.find({
      username: { $regex: req.body.username, $options: "i" },
    }).select({ username: 1, _id: 1, pic: 1, sex: 1 });

    res.status(200).json({ users, success: true });
  } catch (err) {
    res.status(500).json({ err, success: true });
  }
};

const checkAuthenticated = async (req, res) => {
  const user = {
    id: req.user._id,
    name: req.user.username,
    pic: req.user.pic,
    sex: req.user.sex,
  };

  if (req.user.admin) user.admin = true;

  res.status(200).json({ success: true, user });
};

const refreshToken = async (req, res) => {
  try {
    const token = req.headers.refresh_token;

    if (!token) {
      console.error("token not found");
      res.status(401).json({ success: false });
      return;
    }
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findOne({ _id: decoded.id });

    if (user.refreshToken !== token || !user) {
      res.status(403).json({
        message: "Invalid refresh token",
        success: false,
      });
      return;
    }

    const newTokens = await generateToken(decoded.id, true);

    if (!newTokens) {
      res.status(500).json({ success: false });
      return;
    }

    res.status(201).json({
      success: true,
      message: "User token refreshed successfuly.",
      ...newTokens,
    });
  } catch (err) {
    if (err.expiredAt) {
      console.log("token expired statement");
      res.status(300).json({
        success: false,
        code: 3,
        message: "Invalid refresh token",
      });
      return;
    }
    console.log(err.message);
    res.status(500).json({ success: false, message: "Invalid refresh token" });
  }
};

const editUser = async (req, res) => {
  const { id, ...updateStuff } = req.body;
  console.log(updateStuff);

  try {
    const newUser = await User.updateOne({ _id: id }, { $set: updateStuff });

    console.log("User Updated to: ", newUser);
    console.log("User modified to: ", newUser.nModified);

    if (newUser.nModified) {
      res.status(201).json({ success: true, ok: newUser.ok });
      return;
    }

    res
      .status(400)
      .json({ success: false, message: "User couldnt be updated" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, message: "Cant updated the user" });
  }
};

const changeUserPass = async (req, res) => {
  let { id, oldPassword, newPassword } = req.body;
  console.log(newPassword);

  try {
    const user = await User.findById({ _id: id });

    if (!(await bcrypt.compare(oldPassword, user.password))) {
      res
        .status(403)
        .json({ success: false, message: "Old password is incorrect" });
      return;
    }

    const salt = await bcrypt.genSalt();
    newPassword = await bcrypt.hash(newPassword, salt);
    console.log("hashed pass " + newPassword);

    const updatedUser = await User.findByIdAndUpdate(id, {
      $set: { password: newPassword },
    });

    if (updatedUser) {
      res.status(201).json({ success: true, ok: true });
      return;
    }

    res
      .status(400)
      .json({ success: false, message: "User couldnt be updated" });
  } catch (err) {
    console.log(err);
    res.status(400).json({ success: false, message: "Cant updated the user" });
  }
};

const deleteUser = async (req, res) => {
  let { id } = req.body;

  try {
    const user = await User.deleteOne({ _id: id });

    if (user.deletedCount) {
      const data = {
        user_id: id,
      };
      // Event approach
      Event.Emit("UserDeleted", data);

      // Worker approach
      // Worker("BoardDeleted", { board_id: id });

      res.status(200).json({ success: true, ok: user.ok });
      return;
    }
    res
      .status(200)
      .json({ success: false, message: "User couldnt be deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err });
  }
};

const uploadUserPhoto = async (req, res) => {
  try {
    const photoUrl = path.normalize(req.file.path.replace("views", "files"));
    const user = await User.findById(req.user._id).select({ pic: 1 });

    if (
      user.pic.length &&
      fs.existsSync(
        __dirname.replace("Handlers", "") +
          `views${user.pic.replace("files", "")}`
      )
    ) {
      fs.unlinkSync(`views${user.pic.replace("files", "")}`);
    }

    const uploadUser = await User.findByIdAndUpdate(req.user._id, {
      $set: { pic: photoUrl },
    }).select({
      pic: 1,
    });

    if (uploadUser) {
      res.status(201).json({
        success: true,
        message: "User photo uploaded successfuly.",
        path: photoUrl,
      });
      return;
    }

    throw new Error("Photo didnt upload");
  } catch (err) {
    console.log(err.message);
    res
      .status(400)
      .json({ success: false, message: "Only images with size below 10MB." });
  }
};

module.exports = {
  register,
  login,
  getUsers,
  getMembers,
  checkAuthenticated,
  refreshToken,
  editUser,
  changeUserPass,
  deleteUser,
  uploadUserPhoto,
};
