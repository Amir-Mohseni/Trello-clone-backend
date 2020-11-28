const Board = require("../Models/Board");
const BoardMember = require("../Models/BoardMember");
const Event = require("../Events/Event");
// const Worker = require("../Workers/Main");
const User = require("../Models/User");

const getUserBoards = async (req, res) => {
  try {
    if (req.user.admin) {
      let boards = await Board.find()
        .select({
          name: 1,
          color: 1,
          icon: 1,
          _id: 1,
          owner: 1,
          createdAt: 1,
        })
        .lean();

      for (const board of boards) {
        const members = await BoardMember.find({
          board_id: board._id,
        }).select({ user_id: 1 });

        board.members = [];
        for (const member of members) {
          const boardMembers = await User.findById(member.user_id).select({
            username: 1,
            pic: 1,
            sex: 1,
          });
          board.members.push(boardMembers);
        }
      }

      res.status(200).json({ success: true, boards });
      return;
    }

    const userBoards = await BoardMember.find({
      user_id: req.user._id,
    });

    const board_ids = userBoards.map((board) => board.board_id);

    if (!board_ids.length) {
      res.status(200).json({
        success: true,
        code: 5,
        message: "Found no board for this user.",
      });
      return;
    }

    let boards = await Board.find({ _id: { $in: board_ids } })
      .select({
        name: 1,
        color: 1,
        icon: 1,
        owner: 1,
        createdAt: 1,
      })
      .lean();

    for (const board of boards) {
      const members = await BoardMember.find({
        board_id: board._id,
      }).select({ user_id: 1 });

      board.members = [];
      for (const member of members) {
        const boardMembers = await User.findById(member.user_id).select({
          username: 1,
          pic: 1,
          sex: 1,
        });
        board.members.push(boardMembers);
      }
    }

    if (!boards.length) {
      res.status(200).json({
        success: true,
        code: 6,
        message: "Found no board for this user.",
      });
      return;
    }

    res.status(200).json({ success: true, boards });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      success: false,
      code: 6,
      message: "Found no board for this user.",
    });
  }
};

const createBoard = async (req, res) => {
  let { ...createStuff } = req.body;

  try {
    const board = await Board.create({
      ...createStuff,
      owner: req.user._id,
    });
    if (board) {
      const boardCreatedData = {
        board_id: board._id,
        name: board.name,
        user_id: req.user._id,
        username: req.user.username,
      };

      // Event approach
      Event.Emit("BoardCreated", boardCreatedData);

      if (req.AddMember) {
        const addMemberToBoardData = {
          board_id: board._id,
          name: board.name,
        };

        for (member of createStuff.members) {
          addMemberToBoardData.user_id = member._id;

          Event.Emit("AddMemberToBoard", addMemberToBoardData);
        }

        // createStuff.members.forEach((member) => {
        //   addMemberToBoardData.user_id = member;

        //   Event.Emit("AddMemberToBoard", addMemberToBoardData);
        // });
      }

      // Worker approach
      // Worker("BoardCreated", { board_id: board._id, user_id: req.user._id });
      // if (req.AddMember)
      //   Worker("AddMemberToBoard", {
      //     board_id: board._id,
      //     members: createStuff.members,
      //   });
      const currentUser = {
        _id: req.user._id,
        username: req.user.username,
        pic: req.user.pic,
        sex: req.user.sex,
      };

      const returnBoard = JSON.parse(JSON.stringify(board));
      returnBoard.members = [...createStuff.members, currentUser];

      res.status(200).json({
        success: true,
        board: returnBoard,
      });
      return;
    } else {
      throw Error("Board couldnt be created.");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err });
  }
};

const updateBoard = async (req, res) => {
  let { id, ...updateStuff } = req.body;

  try {
    const board = await Board.updateOne(
      { _id: id },
      { $set: { ...updateStuff } }
    );

    if (board.nModified) {
      res.status(200).json({ success: true, ok: board.ok });
      return;
    }
    res
      .status(400)
      .json({ success: false, message: "Board couldnt be updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err });
  }
};

const deleteBoard = async (req, res) => {
  let { id } = req.body;

  try {
    const boardName = await Board.findById(id).select("name");

    const board = await Board.deleteOne({ _id: id });

    console.log(board);

    if (board.deletedCount) {
      const boardDeletedData = {
        board_id: id,
        name: boardName.name,
        user_id: req.user._id,
      };

      // Event approach
      Event.Emit("BoardDeleted", boardDeletedData);

      // Worker approach
      // Worker("BoardDeleted", { board_id: id });

      res.status(200).json({ success: true, ok: board.ok });
      return;
    }
    res
      .status(200)
      .json({ success: false, message: "Board couldnt be deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err });
  }
};

const addMemberToBoard = async (req, res) => {
  if (!req.body.id || !req.body.user_id) {
    res.status(400).json({
      success: false,
      message: "Id and user_id is required to add member to board",
    });
  }

  const { id, user_id } = req.body;

  try {
    const board = await Board.findById(id);

    const addMemberToBoardData = {
      board_id: id,
      name: board.name,
      user_id,
    };

    await Event.Emit("AddMemberToBoard", addMemberToBoardData);

    res
      .status(201)
      .json({ success: true, message: "User added to the board." });
    return;
  } catch (err) {
    console.log(err);
    res.status(400), json({ success: false, message: err });
  }
};

const removeMemberFromBoard = async (req, res) => {
  if (!req.body.id || !req.body.user_id) {
    res.status(400).json({
      success: false,
      message: "Id and user_id is required to remove member from board",
    });
  }

  const { id, user_id } = req.body;

  try {
    const board = await Board.findById(id);

    const removeMemberFromBoardData = {
      board_id: id,
      name: board.name,
      user_id,
    };

    Event.Emit("RemoveMemberFromBoard", removeMemberFromBoardData);

    res
      .status(201)
      .json({ success: true, message: "User removed from the board." });
    return;
  } catch (err) {
    console.log(err);
    res.status(400), json({ success: false, message: err });
  }
};

module.exports = {
  createBoard,
  updateBoard,
  deleteBoard,
  getUserBoards,
  addMemberToBoard,
  removeMemberFromBoard,
};
