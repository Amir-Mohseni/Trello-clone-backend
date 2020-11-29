const List = require("../Models/List");
const Event = require("../Events/Event");

const getBoardLists = async (req, res) => {
  try {
    const lists = await List.find({ board_id: req.params.id }).select({
      name: 1,
      owner: 1,
      board_id: 1,
    });

    res.status(200).json({ success: true, lists });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, err });
  }
};

const createList = async (req, res) => {
  let { ...createStuff } = req.body;

  try {
    const list = await List.create({
      ...createStuff,
      owner: req.user._id,
    });

    const listCreatedData = {
      board_id: createStuff.board_id,
      name: list.name,
      user_id: req.user._id,
      username: req.user.username,
    };

    Event.Emit("ListCreated", listCreatedData);

    const returnList = {
      _id: list._id,
      name: list.name,
      owner: list.owner,
      board_id: list.board_id,
    };
    res.status(200).json({ success: true, list: returnList });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err });
  }
};

const updateList = async (req, res) => {
  let { id, ...updateStuff } = req.body;

  try {
    const list = await List.updateOne(
      { _id: id },
      { $set: { ...updateStuff } }
    );

    if (list.nModified) {
      res.status(200).json({ success: true, ok: list.ok });
      return;
    }
    res
      .status(200)
      .json({ success: false, message: "List couldnt be updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err });
  }
};

const deleteList = async (req, res) => {
  let { id, board_id } = req.body;

  try {
    const listName = await List.findById(id).select("name");

    const list = await List.deleteOne({ _id: id });

    if (list.deletedCount) {
      const listDeletedData = {
        name: listName.name,
        list_id: id,
        user_id: req.user._id,
        board_id,
      };
      Event.Emit("ListDeleted", listDeletedData);

      res.status(200).json({ success: true, ok: list.ok });
      return;
    }
    res
      .status(200)
      .json({ success: false, message: "List couldnt be deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err });
  }
};

module.exports = {
  getBoardLists,
  createList,
  updateList,
  deleteList,
};
