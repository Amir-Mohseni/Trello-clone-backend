const Card = require("../Models/Card");
const User = require("../Models/User");
const Card_Members = require("../Models/CardMember");
const Event = require("../Events/Event");
const fs = require("fs");
const path = require("path");

const getUserCards = async (req, res) => {
  try {
    if (req.user.admin) {
      const cards = await Card.find()
        .select({
          name: 1,
          tags: 1,
          todos: 1,
          color: 1,
          attachments: 1,
          list_id: 1,
        })
        .lean();
      for (const card of cards) {
        const members = await Card_Members.find({
          card_id: card._id,
        }).select({ user_id: 1 });

        card.members = [];
        for (const member of members) {
          const cardMembers = await User.findById(member.user_id).select({
            username: 1,
            pic: 1,
            sex: 1,
          });
          card.members.push(cardMembers);
        }
        console.log(card);
      }
      res.status(200).json({ success: true, cards });
      return;
    }

    const cards = await Card.find({ board_id: req.board_id })
      .select({
        name: 1,
        tags: 1,
        todos: 1,
        color: 1,
        attachments: 1,
        list_id: 1,
      })
      .lean();

    for (const card of cards) {
      const members = await Card_Members.find({
        card_id: card._id,
      }).select({ user_id: 1 });

      card.members = [];
      for (const member of members) {
        const cardMembers = await User.findById(member.user_id).select({
          username: 1,
        });
        card.members.push(cardMembers);
      }
      console.log(card);
    }

    if (!cards.length) {
      res.status(400).json({
        success: false,
        code: 6,
        message: "Found no card for this user.",
      });
      return;
    }

    res.status(200).json({ success: true, cards });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      success: false,
      code: 6,
      message: "Found no card for this user.",
    });
  }
};

const createCard = async (req, res) => {
  let { ...createStuff } = req.body;

  try {
    const card = await Card.create({
      ...createStuff,
      owner: req.user.id,
    });
    if (card) {
      const cardCreated = {
        board_id: createStuff.board_id,
        card_name: card.name,
        card_id: card._id,
        user_id: req.user._id,
        username: req.user.username,
      };

      Event.Emit("CardCreated", cardCreated);

      const addMemberToCard = {
        board_id: createStuff.board_id,
        card_name: card.name,
      };

      if (req.AddMember) {
        createStuff.members.forEach((member) => {
          addMemberToCard.user_id = member;

          if (req.AddMember) Event.Emit("MemberAddedToCard", addMemberToCard);
        });
      }

      const currentUser = {
        _id: req.user._id,
        username: req.user.username,
        pic: req.user.pic,
        sex: req.user.sex,
      };

      const returnCard = JSON.parse(JSON.stringify(card));
      returnCard.members = [...createStuff.members, currentUser];

      res.status(200).json({
        success: true,
        card: returnCard,
      });
    } else {
      throw Error("card couldnt be created.");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err });
  }
};

const updateCard = async (req, res) => {
  let { id, ...updateStuff } = req.body;

  try {
    const card = await Card.updateOne(
      { _id: id },
      { $set: { ...updateStuff } }
    );

    if (card.nModified) {
      res.status(200).json({ success: true, ok: card.ok });
      return;
    }
    res
      .status(200)
      .json({ success: false, message: "Card couldnt be updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err });
  }
};

const deleteCard = async (req, res) => {
  let { id, board_id } = req.body;

  try {
    const card = await Card.findById(id).select({ name: 1, attachments: 1 });
    if (card.attachments.length) {
      for (attach of card.attachments) {
        fs.unlinkSync(`uploads${attach}`);
      }
    }

    const deletedCard = await Card.deleteOne({ _id: id });

    if (deletedCard.deletedCount) {
      const cardDeleted = {
        card_id: id,
        card_name: card.name,
        board_id,
        username: req.user.username,
        user_id: req.user._id,
      };
      Event.Emit("CardDeleted", cardDeleted);
      res.status(200).json({ success: true, ok: deletedCard.ok });
      return;
    }
    res
      .status(200)
      .json({ success: false, message: "card couldnt be deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err });
  }
};

const addMemberToCard = async (req, res) => {
  if (!req.body.id || !req.body.user_id) {
    res.status(400).json({
      success: false,
      message: "Id and user_id is required to add member to card",
    });
  }

  const { id, user_id, board_id } = req.body;

  try {
    const card = await Card.findById(id);

    const addMember = await Card_Members.create({ card_id: id, user_id });

    if (addMember) {
      const data = {
        board_id,
        user_id,
        card_name: card.name,
      };

      Event.Emit("MemberAddedToCard", data);

      res
        .status(201)
        .json({ success: true, message: "User added to the card." });
      return;
    }

    res.status(400).json({ success: false });
  } catch (err) {
    console.log(err);
    res.status(400), json({ success: false, message: err });
  }
};

const removeMemberFromCard = async (req, res) => {
  if (!req.body.id || !req.body.user_id) {
    res.status(400).json({
      success: false,
      message: "Id and user_id is required to remove member from card",
    });
  }

  const { id, user_id, board_id } = req.body;

  try {
    const card = await Card.findById(id);

    const removeMember = await Card_Members.deleteOne({ card_id: id, user_id });

    if (removeMember) {
      const data = {
        board_id,
        user_id,
        card_name: card.name,
      };

      Event.Emit("MemberRemovedFromCard", data);

      res
        .status(201)
        .json({ success: true, message: "User removed from the card." });
      return;
    }

    res.status(400).json({ success: false });
  } catch (err) {
    console.log(err);
    res.status(400), json({ success: false, message: err });
  }
};

const checkCardTodo = async (req, res) => {
  if (
    !req.body.id ||
    req.body.index === undefined ||
    req.body.id.length != 24 ||
    typeof req.body.id !== "string" ||
    typeof req.body.index !== "number"
  ) {
    res
      .status(400)
      .json({ success: false, message: "Id and index are invalid." });
    return;
  }

  const { id, index, board_id } = req.body;
  try {
    const card = await Card.findById(id).lean();

    if (!card) {
      res
        .status(404)
        .json({ success: false, message: "No card found for the given id." });
      return;
    }

    card.todos[index].checked = true;
    const savedCard = await Card.findByIdAndUpdate(id, {
      $set: { todos: card.todos },
    });

    if (savedCard) {
      const data = {
        todo_name: card.todos[index].name,
        card_name: card.name,
        board_id,
        user_id: req.user._id,
      };

      Event.Emit("CardTodoChecked", data);

      res
        .status(201)
        .json({ success: true, message: "Card todo checked successfuly." });
      return;
    }

    throw Error("Card todo cant be checked.");
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};

const unCheckCardTodo = async (req, res) => {
  if (
    !req.body.id ||
    req.body.index === undefined ||
    req.body.id.length !== 24 ||
    typeof req.body.id !== "string" ||
    typeof req.body.index !== "number"
  ) {
    res
      .status(400)
      .json({ success: false, message: "Id and index are invalid." });
    return;
  }

  const { id, index, board_id } = req.body;
  try {
    const card = await Card.findById(id).lean();

    if (!card) {
      res
        .status(404)
        .json({ success: false, message: "No card found for the given id." });
      return;
    }

    card.todos[index].checked = false;
    const savedCard = await Card.findByIdAndUpdate(id, {
      $set: { todos: card.todos },
    });

    if (savedCard) {
      const data = {
        todo_name: card.todos[index].name,
        card_name: card.name,
        board_id,
        user_id: req.user._id,
      };

      Event.Emit("CardTodoUnChecked", data);

      res
        .status(201)
        .json({ success: true, message: "Card todo unchecked successfuly." });
      return;
    }

    throw Error("Card todo cant be unchecked.");
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};

const removeTodo = async (req, res) => {
  if (
    !req.body.id ||
    req.body.index === undefined ||
    req.body.id.length !== 24 ||
    typeof req.body.id !== "string" ||
    typeof req.body.index !== "number"
  ) {
    res
      .status(400)
      .json({ success: false, message: "Id and index are invalid." });
    return;
  }

  const { id, index, board_id } = req.body;
  try {
    const card = await Card.findById(id).lean();

    if (!card) {
      res
        .status(404)
        .json({ success: false, message: "No card found for the given id." });
      return;
    }

    const todo_name = card.todos[index];
    card.todos.splice(index, 1);
    const savedCard = await Card.findByIdAndUpdate(id, {
      $set: { todos: card.todos },
    });

    if (savedCard) {
      const data = {
        todo_name,
        card_name: card.name,
        board_id,
        user_id: req.user._id,
      };

      Event.Emit("CardTodoRemoved", data);

      res
        .status(201)
        .json({ success: true, message: "Card todo removed successfuly." });
      return;
    }

    throw Error("Card todo cant be removed.");
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};

const editTodo = async (req, res) => {
  if (
    !req.body.id ||
    req.body.index === undefined ||
    req.body.name === undefined ||
    req.body.id.length !== 24 ||
    typeof req.body.id !== "string" ||
    typeof req.body.index !== "number" ||
    typeof req.body.name !== "string"
  ) {
    res
      .status(400)
      .json({ success: false, message: "Id, index and name are invalid." });
    return;
  }

  const { id, index, name } = req.body;
  try {
    const card = await Card.findById(id).lean();

    if (!card) {
      res
        .status(404)
        .json({ success: false, message: "No card found for the given id." });
      return;
    }

    card.todos[index].name = name;
    const savedCard = await Card.findByIdAndUpdate(id, {
      $set: { todos: card.todos },
    });

    if (savedCard) {
      res
        .status(201)
        .json({ success: true, message: "Card todo edited successfuly." });
      return;
    }

    throw Error("Card todo cant be edited.");
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};

const addTodo = async (req, res) => {
  if (
    !req.body.id ||
    req.body.name === undefined ||
    req.body.id.length !== 24 ||
    typeof req.body.id !== "string" ||
    typeof req.body.name !== "string"
  ) {
    res
      .status(400)
      .json({ success: false, message: "Id, index and name are invalid." });
    return;
  }

  const { id, name, board_id } = req.body;
  try {
    const card = await Card.findById(id).lean();

    if (!card) {
      res
        .status(404)
        .json({ success: false, message: "No card found for the given id." });
      return;
    }

    card.todos.push({ name, checked: false });
    const savedCard = await Card.findByIdAndUpdate(id, {
      $set: { todos: card.todos },
    });

    if (savedCard) {
      const data = {
        todo_name: name,
        card_name: card.name,
        board_id,
        user_id: req.user._id,
      };

      Event.Emit("CardTodoAdded", data);
      res
        .status(201)
        .json({ success: true, message: "Card todo added successfuly." });
      return;
    }

    throw Error("Card todo cant be added.");
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
};

const uploadAttachment = async (req, res) => {
  const { id } = req.headers;

  try {
    const photoUrl = path.normalize(req.file.path.replace("views", "files"));

    let card = await Card.findById(id).select({ attachments: 1 }).lean();

    card.attachments.push(photoUrl);

    const uploadCardAttachment = await Card.findByIdAndUpdate(id, {
      $set: { attachments: card.attachments },
    }).select({
      attachments: 1,
    });

    if (uploadCardAttachment) {
      res.status(201).json({
        success: true,
        message: "Card photo uploaded successfuly.",
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

const removeAttachment = async (req, res) => {
  if (
    !req.body.id ||
    req.body.index === undefined ||
    req.body.id.length !== 24 ||
    typeof req.body.id !== "string" ||
    typeof req.body.index !== "number"
  ) {
    res
      .status(400)
      .json({ success: false, message: "Id and index are invalid." });
    return;
  }

  const { id, index } = req.body;

  try {
    const card = await Card.findById(id).select({ attachments: 1 }).lean();

    console.log(card.attachments);
    if (
      card.attachments[index] &&
      fs.existsSync(
        __dirname.replace("Handlers", "") +
          `views${user.pic.replace("files", "")}`
      )
    ) {
      fs.unlinkSync(`views${card.attachments[index].replace("files", "")}`);
      card.attachments.splice([index], 1);
    }
    console.log(card.attachments);

    const updatedCard = await Card.findByIdAndUpdate(id, {
      $set: { attachments: card.attachments },
    });

    if (updatedCard) {
      res.status(201).json({
        success: true,
        message: "Card attachment removed successfuly.",
      });
      return;
    }

    throw new Error("Photo didnt delete");
  } catch (err) {
    console.log(err.message);
    res.status(400).json({
      success: false,
      message: "There was a problem in removing the attachment.",
    });
  }
};

module.exports = {
  getUserCards,
  createCard,
  updateCard,
  deleteCard,
  addMemberToCard,
  removeMemberFromCard,
  checkCardTodo,
  unCheckCardTodo,
  addTodo,
  editTodo,
  removeTodo,
  uploadAttachment,
  removeAttachment,
};
