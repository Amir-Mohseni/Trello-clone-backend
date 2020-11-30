const Notif = require("../Models/Notification");
const Event = require("../Events/Event");
const User_Notification = require("../Models/UserNotif");
const Notification = require("../Models/Notification");
const { getTimePast } = require("./utils");

const getUserNotifs = async (req, res) => {
  try {
    const userNotifIds = await User_Notification.find({
      user_id: req.user._id,
      removed: false,
    })
      .select({ notification_id: 1, seen: 1 })
      .sort({ createdAt: -1 });

    let userNotifications = [];

    if (!userNotifIds) {
      res.status(200).json({
        success: false,
        message: "No notifications found for this user.",
      });
      return;
    }

    for (notification of userNotifIds) {
      const notif = await Notification.findById(notification.notification_id)
        .select({ description: 1, createdAt: 1, user_id: 1 })
        .lean();

      if (!notif) continue;

      notif.time_passed = getTimePast(notif.createdAt);
      notif.seen = notification.seen;
      notif.user_notification = notification._id;

      userNotifications.push(notif);
    }

    res.status(200).json({ success: true, notifications: userNotifications });
  } catch (err) {
    console.log(err);

    res.status(400).json({ success: false });
  }
  return;
};

const seenUserNotif = async (req, res) => {
  try {
    const { id } = req.body;

    const seenNotif = await User_Notification.findByIdAndUpdate(id, {
      $set: { seen: true },
    });

    if (seenNotif) {
      res.status(201).json({ success: true });
      return;
    }

    res.status(201).json({ success: false });
    return;
  } catch (err) {
    console.log(err);

    res.status(400).json({ success: false });
    return;
  }
};

const removeUserNotif = async (req, res) => {
  try {
    const { id } = req.body;

    const removedNotif = await User_Notification.findByIdAndUpdate(id, {
      $set: { removed: true },
    });

    if (removedNotif) {
      res.status(200).json({ success: true });
      return;
    }

    res.status(200).json({ success: false });
    return;
  } catch (err) {
    console.log(err);

    res.status(400).json({ success: false });
    return;
  }
};

module.exports = {
  getUserNotifs,
  seenUserNotif,
  removeUserNotif,
};
