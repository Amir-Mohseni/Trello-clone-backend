const Board_Member = require("../Models/BoardMember");
const CardMember = require("../Models/CardMember");
const List = require("../Models/List");
const Card = require("../Models/Card");
const Notif = require("../Models/Notification");
const User_Notification = require("../Models/UserNotif");
const User = require("../Models/User");
const log = require("../helpers/logger");
const fs = require("fs");
const app = require("express")();
const io = require("../server");
const Board = require("../Models/Board");
// const Board = require("../Models/Board");

const userDeleted = async (data) => {
  const { user_id } = data;

  try {
    const delete_card_member_row = await CardMember.deleteMany({ user_id });
    const delete_board_member_row = await Board_Member.deleteMany({ user_id });

    const usersBoards = await Board.find({ owner: user_id });
    if (usersBoards) {
      for (board of usersBoards) {
        await Board_Member.create({
          board_id: board._id,
          user_id: process.env.ADMIN_ID,
        });
      }
      await Board.update(
        { owner: user_id },
        { $set: { owner: process.env.ADMIN_ID } }
      );
    }

    const usersCards = await Card.find({ owner: user_id });
    if (usersCards) {
      for (card of usersCards) {
        await CardMember.create({
          card_id: card._id,
          user_id: process.env.ADMIN_ID,
        });
      }
      await Card.update(
        { owner: user_id },
        { $set: { owner: process.env.ADMIN_ID } }
      );
    }

    const card_id = delete_card_member_row._id;
    const board_id = delete_board_member_row._id;

    if (delete_board_member_row && delete_card_member_row)
      log(
        `CardMember rows with card_id:${card_id} & Board_Member rows with board_id:${board_id} deleted.`
      );
    else
      log(
        `CardMember rows with card_id:${card_id} & Board_Member rows with board_id:${board_id} couldnt be deleted.`,
        __filename,
        "error"
      );
  } catch (err) {
    console.log(err);
    log(
      `CardMember rows with card_id:${card_id} & Board_Member rows with board_id:${board_id} couldnt be deleted. Error:${err}`,
      __filename,
      "error"
    );
  }
};

const boardCreated = async (data) => {
  const { board_id, name, user_id, username } = data;

  try {
    const board_member = await Board_Member.create({ board_id, user_id });

    const notif = await Notif.create({
      board_id,
      user_id,
      description: `بورد جدیدی به نام <b class="text-primary-100">${name}</b> توسط <b class="text-secondary-100">${username}</b> ایجاد شد.`,
    });

    if (board_member) {
      log(
        `Board_Members row with user_id:${user_id} & board_id:${board_id} created.`
      );

      Notify(board_id, notif._id);
    } else
      log(
        `Board_Members row with user_id:${user_id} & board_id:${board_id} couldnt be created.`
      );
  } catch (err) {
    console.log(err);
    log(
      `Board_Member row with user_id:${user_id} & board_id:${board_id} couldnt be created.`,
      __filename,
      "error"
    );
  }
};

const boardDeleted = async (data) => {
  const { board_id, user_id, name } = data;

  try {
    const boardLists = await List.find({ board_id });
    listIds = boardLists.map((list) => list._id);
    const boardCards = await Card.find({
      list_id: { $in: listIds },
    }).select({ attachments: 1 });
    console.log(boardCards);

    const notif = await Notif.create({
      description: `بورد <b class="text-primary-100">${name}</b> به همراه لیست ها و کارت های برد حذف شد.`,
      user_id,
      board_id,
    });

    Notify(board_id, notif._id);

    const cards = boardCards.map((card) => card._id);

    await CardMember.deleteMany({ card_id: { $in: cards } });

    const deletedCards = await Card.deleteMany({ board_id });
    const deletedLists = await List.deleteMany({ board_id });
    await Board_Member.deleteMany({ board_id });

    if (deletedLists && deletedCards) {
      for (card of boardCards) {
        if (card.attachments.length) {
          for (attach of card.attachments) {
            fs.unlinkSync(`uploads${attach}`);
          }
        }
      }
      log(`Board_Member rows with board_id:${board_id} deleted.`);
    } else
      log(
        `Board_Member rows with board_id:${board_id} couldnt be deleted.`,
        __filename,
        "error"
      );
  } catch (err) {
    console.log(err);
    log(
      `Board_Member rows with board_id:${board_id} couldnt be deleted.`,
      __filename,
      "error"
    );
  }
};

const AddMemberToBoard = async (data) => {
  const { board_id, user_id, name } = data;

  try {
    const user = await User.findById(user_id).select({ username: 1 });

    if (user) {
      const board_members = await Board_Member.create({ board_id, user_id });

      console.log(user_id);
      console.log(user);
      const notif = await Notif.create({
        board_id,
        description: `<b class="text-secondary-100">${user.username}</b> به بورد <b class="text-primary-100">${name}</b> اضافه شد.`,
      });

      Notify(board_id, notif._id);

      if (board_members)
        log(
          `Board_Member row with user_id:${user_id} & board_id:${board_id} created.`
        );
      else
        log(
          `Board_Members row with user_id:${user_id} & board_id:${board_id} couldnt be created.`,
          __filename,
          "error"
        );
    }
  } catch (err) {
    console.log(err);
    log(
      `Board_Member row with user_id:${user_id} & board_id:${board_id} couldnt be created.`,
      __filename,
      "error"
    );
  }
};

const RemoveMemberFromBoard = async (data) => {
  const { board_id, user_id, name } = data;

  try {
    const user = await User.findById(user_id).select({ username: 1 });

    if (user) {
      const board_members = await Board_Member.deleteOne({ board_id, user_id });
      await CardMember.deleteMany({ user_id });
      const notif = await Notif.create({
        board_id,
        description: `<b class="text-secondary-100">${user.usename}</b> از بورد <b class="text-primary-100">${name}</b> حذف شد.`,
      });

      Notify(board_id, notif._id);

      if (board_members) {
        log(
          `Board_Member row with user_id:${user_id} & board_id:${board_id} deleted.`
        );

        return true;
      } else
        log(
          `Board_Members row with user_id:${user_id} & board_id:${board_id} couldnt be deleted.`,
          __filename,
          "error"
        );
    }
  } catch (err) {
    console.log(err);
    log(
      `Board_Member row with user_id:${user_id} & board_id:${board_id} couldnt be deleted.`,
      __filename,
      "error"
    );
  }
};

const ListCreated = async (data) => {
  const { board_id, name, user_id, username } = data;

  try {
    const notif = await Notif.create({
      board_id,
      user_id,
      description: `لیست جدیدی به نام <b class="text-primary-100">${name}</b> توسط <b class="text-secondary-100">${username}</b> ایجاد شد.`,
    });

    Notify(board_id, notif._id);

    if (notif) log(`List with name:${name} has been created.`);
    else
      log(`List with name:${name} could not be created.`, __filename, "error");
  } catch (err) {
    console.log(err);
    log(`List with name:${name} could not be created.`, __filename, "error");
  }
};

const ListDeleted = async (data) => {
  const { name, list_id, user_id, board_id } = data;

  try {
    const boardCards = await Card.find({ list_id }).select({ attachments: 1 });

    const cards = boardCards.map((card) => card._id);

    await CardMember.deleteMany({ card_id: { $in: cards } });

    const deleted_cards = await Card.deleteMany({ list_id });

    if (deleted_cards) {
      for (card of boardCards) {
        if (card.attachments.length) {
          for (attach of card.attachments) {
            fs.unlinkSync(`uploads${attach}`);
          }
        }
      }

      const notif = await Notif.create({
        description: `لیست <b class="text-primary-100">${name}</b> به همراه کارت های لیست حذف شد.`,
        user_id,
        board_id,
      });

      Notify(board_id, notif._id);

      log(`List wit id:${list_id} and it\'s cards have been deleted`);
    } else
      log(
        `List wit id:${list_id} and it\'s cards have\'nt been deleted`,
        __filename,
        "error"
      );
  } catch (err) {
    console.log(err);
    log(
      `List wit id:${list_id} and it\'s cards have been deleted`,
      __filename,
      "error"
    );
  }
};

const cardCreated = async (data) => {
  const { board_id, card_name, card_id, user_id, username } = data;

  try {
    const card_member = await CardMember.create({ card_id, user_id });

    const notif = await Notif.create({
      board_id,
      user_id,
      description: `کارت جدیدی با نام <b class="text-primary-100">${card_name}</b> توسط <b class="text-secondary-100">${username}</b> ایجاد شد.`,
    });

    Notify(board_id, notif._id);

    if (card_member)
      log(
        `CardMembers row with user_id:${user_id} & board_id:${card_id} created.`
      );
    else
      log(
        `CardMembers row with user_id:${user_id} & card_id:${card_id} couldnt be created.`
      );
  } catch (err) {
    console.log(err);
    log(
      `Board_Member row with user_id:${user_id} & board_id:${board_id} couldnt be created.`,
      __filename,
      "error"
    );
  }
};

const cardDeleted = async (data) => {
  const { card_id, card_name, board_id, username, user_id } = data;

  try {
    const delete_card_member_row = await CardMember.deleteMany({ card_id });

    const notif = await Notif.create({
      board_id,
      user_id,
      description: `کارت <b class="text-primary-100">${card_name}</b> توسط <b class="text-secondary-100">${username}</b> حذف شد.`,
    });

    Notify(board_id, notif._id);

    if (delete_card_member_row)
      log(`CardMember rows with card_id:${card_id} deleted.`);
    else
      log(
        `CardMember rows with card_id:${board_id} couldnt be deleted.`,
        __filename,
        "error"
      );
  } catch (err) {
    console.log(err);
    log(
      `CardMember rows with card_id:${board_id} couldnt be deleted. Error:${err}`,
      __filename,
      "error"
    );
  }
};

const MemberAddedToCard = async (data) => {
  const { board_id, user_id, card_name } = data;

  try {
    const user = await User.findById(user_id).select({ username: 1 });

    if (user) {
      const notif = await Notif.create({
        board_id,
        description: `<b class="text-secondary-100">${user.username}</b> به کارت <b class="text-primary-100">${card_name}</b> اضافه شد.`,
      });

      Notify(board_id, notif._id);

      if (notif)
        log(
          `CardMembers row with user_id:${user_id} & card_name:${card_name} created.`
        );
      else
        log(
          `CardMembers row with user_id:${user_id} & card_name:${card_name} couldnt be created.`,
          __filename,
          "error"
        );
    }
  } catch (err) {
    console.log(err);
    log(
      `Board_Member row with user_id:${user_ids} & card_name:${card_name} couldnt be created.`,
      __filename,
      "error"
    );
  }
};

const MemberRemovedFromCard = async (data) => {
  const { board_id, user_id, card_name } = data;

  try {
    const user = await User.findById(user_id).select({ username: 1 });

    if (user) {
      const notif = await Notif.create({
        board_id,
        description: `<b class="text-secondary-100">${user.username}</b> از کارت <b class="text-primary-100">${card_name}</b> حذف شد.`,
      });

      Notify(board_id, notif._id);

      if (notif)
        log(
          `CardMembers row with user_id:${user_id} & card_name:${card_name} deleted.`
        );
      else
        log(
          `CardMembers row with user_id:${user_id} & card_name:${card_name} couldnt be deleted.`,
          __filename,
          "error"
        );
    }
  } catch (err) {
    console.log(err);
    log(
      `Board_Member row with user_id:${user_ids} & card_name:${card_name} couldnt be deleted.`,
      __filename,
      "error"
    );
  }
};

const CardTodoChecked = async (data) => {
  const { card_name, todo_name, board_id, user_id } = data;

  try {
    const user = await User.findById(user_id).select({ username: 1 });

    if (user) {
      const notif = await Notif.create({
        board_id,
        description: `<b class="text-secondary-100">${user.username}</b> تسک <b class="text-primary-100">${todo_name}</b> از کارت <b class="text-primary-100">${card_name}</b> را کامل کرد.`,
      });

      Notify(board_id, notif._id);
    }
  } catch (err) {
    console.log(err);
  }
};

const CardTodoUnChecked = async (data) => {
  const { card_name, todo_name, board_id, user_id } = data;

  try {
    const user = await User.findById(user_id).select({ username: 1 });

    if (user) {
      const notif = await Notif.create({
        board_id,
        description: `<b class="text-secondary-100">${user.username}</b> تسک <b class="text-primary-100">${todo_name}</b> از کارت <b class="text-primary-100">${card_name}</b> را انجام نشده کرد.`,
      });

      Notify(board_id, notif._id);
    }
  } catch (err) {}
};

const CardTodoAdded = async (data) => {
  const { card_name, todo_name, board_id, user_id } = data;

  try {
    const user = await User.findById(user_id).select({ username: 1 });

    if (user) {
      const notif = await Notif.create({
        board_id,
        description: `<b class="text-secondary-100">${user.username}</b> تسک <b class="text-primary-100">${todo_name}</b> از کارت <b class="text-primary-100">${card_name}</b> را حذف کرد.`,
      });

      Notify(board_id, notif._id);
    }
  } catch (err) {
    console.log(err);
  }
};

const CardTodoRemoved = async (data) => {
  const { card_name, todo_name, board_id, user_id } = data;

  try {
    const user = await User.findById(user_id).select({ username: 1 });

    if (user) {
      const notif = await Notif.create({
        board_id,
        description: `<b class="text-secondary-100">${user.username}</b> تسک <b class="text-primary-100">${todo_name}</b> را به کارت <b class="text-primary-100">${card_name}</b> اضافه کرد.`,
      });

      Notify(board_id, notif._id);
    }
  } catch (err) {
    console.log(err);
  }
};

async function Notify(board_id, notification_id) {
  console.log(" creating notification ");
  try {
    const users = await Board_Member.find({ board_id }).select({ user_id: 1 });

    for (user of users) {
      await User_Notification.create({
        user_id: user.user_id,
        notification_id,
      });
    }

    if (
      users.findIndex((user) => user.user_id === process.env.ADMIN_ID) === -1
    ) {
      await User_Notification.create({
        user_id: process.env.ADMIN_ID,
        notification_id,
      });
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  userDeleted,
  boardCreated,
  boardDeleted,
  AddMemberToBoard,
  RemoveMemberFromBoard,
  ListCreated,
  ListDeleted,
  cardCreated,
  cardDeleted,
  MemberAddedToCard,
  MemberRemovedFromCard,
  CardTodoChecked,
  CardTodoUnChecked,
  CardTodoAdded,
  CardTodoRemoved,
};
