const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const Board = require("../Models/Board");
const List = require("../Models/List");
const Card = require("../Models/Card");
const Board_Member = require("../Models/BoardMember");
const Card_Member = require("../Models/CardMember");
const { validateId } = require("./utils");

const mustNotBeAuthenticated = async (req, res, next) => {
  const token = req.headers.access_token;

  // check jwt exists
  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decodedToken.id);

      if (user) {
        res.status(300).json({
          success: false,
          code: 3,
          message: "You are already logged in.",
        });
        return;
      }
      next();
    } catch (err) {
      if (err === "TokenExpiredError") {
        console.log("token expired statement");

        res.status(300).json({
          success: false,
          code: 1,
          message: "Access token expired.",
        });
        return;
      }
      next();
    }
  } else {
    next();
  }
};

const mustBeAuthenticated = async (req, res, next) => {
  const token = req.headers.access_token;

  // check jwt exists
  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decodedToken.id);

      if (user) {
        req.user = user;
        next();
      } else {
        res
          .status(400)
          .json({ success: false, code: 3, message: "You must be logged in." });
        return;
      }
    } catch (err) {
      // console.log(err);
      if (err.expiredAt) {
        console.log("token expired statement");

        res.status(300).json({
          success: false,
          code: 1,
          message: "Access token expired.",
        });
        return;
      }

      res
        .status(400)
        .json({ success: false, code: 3, message: "You must be logged in." });
      return;
    }
  } else {
    res
      .status(400)
      .json({ success: false, message: "You should be authenticated." });
    return;
  }
};

const onlyAdmin = async (req, res, next) => {
  if (!req.user.admin) {
    res.status(403).json({
      code: 10,
      success: false,
      message: "Only admin can access this route",
    });
    return;
  }
  next();
};

const onlyOwnerAndAdmin = async (req, res, next) => {
  const { id } = req.body;

  if (!req.user.admin && req.user._id !== id) {
    res.status(403).json({
      code: 10,
      success: false,
      message: "Only admin and user itself can access this route",
    });
    return;
  }
  next();
};

const canChangeBoard = async (req, res, next) => {
  if (!validateId(req, res)) return;

  try {
    const board = await Board.findById(req.body.id || req.params.id);

    if (!board) {
      res.status(404).json({
        success: false,
        code: 4,
        message: "There is no board matching with this id.",
      });
      return;
    }

    console.log(board.owner.toString());
    console.log(req.user._id.toString());
    console.log(board.owner.toString() !== req.user._id.toString());

    if (board.owner.toString() !== req.user._id.toString() && !req.user.admin) {
      res.status(403).json({
        success: false,
        code: 5,
        message: "You are not authorized to change this board.",
      });
      return;
    }

    next();
  } catch (err) {
    console.log(err);
    return;
  }
};

const canChangeList = async (req, res, next) => {
  if (!validateId(req, res)) return;

  try {
    const list = await List.findById(req.body.id);

    if (!list) {
      res.status(404).json({
        success: false,
        code: 4,
        message: "There is no list matching with this id.",
      });
      return;
    }

    if (list.owner.toString() !== req.user._id.toString() && !req.user.admin) {
      res.status(404).json({
        success: false,
        code: 5,
        message: "You are not authorized to change this list.",
      });
      return;
    }

    next();
  } catch (err) {
    console.log(err);
    return;
  }
};

const canChangeCard = async (req, res, next) => {
  if (
    !req.body.board_id ||
    typeof req.body.board_id !== "string" ||
    req.body.board_id.length != 24
  ) {
    res.status(300).json({
      success: false,
      message: "Board Id must be valid and passed with the body",
      code: 2,
    });
    return false;
  }
  if (
    !req.body.list_id ||
    typeof req.body.list_id !== "string" ||
    req.body.list_id.length != 24
  ) {
    res.status(300).json({
      success: false,
      message: "List Id must be valid and passed with the body",
      code: 2,
    });
    return false;
  }

  if (!validateId(req, res)) return;

  const { id, board_id, list_id } = req.body;
  try {
    const card = await Card.findById(id);
    const board = await Board.findById(board_id);

    if (!card) {
      res.status(404).json({
        success: false,
        code: 4,
        message: "There is no card matching with this id.",
      });
      return;
    }

    const list = await List.findById(list_id).select({ owner: 1 });

    const isInCardMembers = await Card_Member.find({
      user_id: req.user._id,
      card_id: req.body.id,
    });

    if (
      board.owner.toString() !== req.user._id.toString() &&
      list.owner.toString() !== req.user._id.toString() &&
      card.owner.toString() !== req.user._id.toString() &&
      !req.user.admin &&
      !isInCardMembers
    ) {
      res.status(404).json({
        success: false,
        code: 5,
        message: "You are not authorized to change this card.",
      });
      return;
    }

    next();
  } catch (err) {
    console.log(err);
    return;
  }
};

const canChangeCardForUpload = async (req, res, next) => {
  if (
    !req.headers.board_id ||
    typeof req.headers.board_id !== "string" ||
    req.headers.board_id.length != 24
  ) {
    res.status(300).json({
      success: false,
      message: "Board Id must be valid and passed with the headers",
      code: 2,
    });
    return false;
  }

  if (
    !req.headers.list_id ||
    typeof req.headers.list_id !== "string" ||
    req.headers.list_id.length != 24
  ) {
    res.status(300).json({
      success: false,
      message: "List Id must be valid and passed with the headers",
      code: 2,
    });
    return false;
  }

  if (!validateId(req, res, "headers")) return;

  const { id } = req.headers;
  try {
    const card = await Card.findById(id);

    if (!card) {
      res.status(404).json({
        success: false,
        code: 4,
        message: "There is no card matching with this id.",
      });
      return;
    }

    const list = List.findById(req.headers.list_id).select({ owner: 1 });

    const isInCardMembers = await Card_Member.find({
      user_id: req.user._id,
      card_id: req.headers.id,
    });

    if (
      card.owner !== req.user._id &&
      !req.user.admin &&
      list.owner !== req.user._id &&
      !isInCardMembers
    ) {
      res.status(404).json({
        success: false,
        code: 5,
        message: "You are not authorized to change this card.",
      });
      return;
    }

    next();
  } catch (err) {
    console.log(err);
    return;
  }
};

const canAccessBoardLists = async (req, res, next) => {
  const isInBoardMembers = await Board_Member.find({
    user_id: req.user._id,
    board_id: req.body.board_id,
  });

  if (!isInBoardMembers) {
    req.status(404).json({
      seccess: false,
      code: 4,
      message: "User is not authorized to access this boards lists.",
    });
    return;
  }

  next();
};

const canAccessBoardCard = async (req, res, next) => {
  console.log(req.method);
  let type;
  if (req.method === "GET") type = "";
  else type = "list";
  if (!validateId(req, res, type)) return;

  const isInBoardMembers = await Board_Member.find({
    user_id: req.user._id,
    board_id: req.body.board_id,
  });

  if (!isInBoardMembers) {
    req.status(404).json({
      seccess: false,
      code: 4,
      message: "User is not authorized to access this boards cards.",
    });
    return;
  }

  next();
};

module.exports = {
  mustNotBeAuthenticated,
  mustBeAuthenticated,
  onlyAdmin,
  onlyOwnerAndAdmin,
  canChangeBoard,
  canChangeList,
  canChangeCard,
  canAccessBoardLists,
  canAccessBoardCard,
  canChangeCardForUpload,
};
