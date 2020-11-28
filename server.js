"use strict";
require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const compression = require("compression");
const path = require("path");
const User = require("./Models/User");

// WebSocket
const WS = require("./WebSocket/main");
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket) => {
  console.log("connection oppened");

  socket.on("Initial", ({ user, allBoards }) => {
    console.log(`User ${user.name} joined the Users room`);
    console.log("Boards received: ", allBoards.length);

    // Adding user
    const data = {
      ...user,
      socket_id: socket.id,
    };
    WS.userJoin(data);
    socket.join("OnlineUsers");

    // Building Board Rooms
    WS.addBoards(socket, allBoards);

    // Updating userRoom for all users
    sendNewUsers();
  });

  socket.on("newBoard", ({ board }) => {
    WS.boardAdded(io, socket, board);
  });

  socket.on("removeBoard", ({ board_id }) => {
    WS.boardRemoved(io, socket, board_id);
  });

  socket.on("addSomeoneToBoard", ({ board_id, member }) => {
    WS.addSomeoneToBoard(io, socket, board_id, member);
  });

  socket.on("removedSomeoneFromBoard", ({ board_id, member }) => {
    WS.removeSomeoneFromBoard(io, socket, board_id, member);
  });

  socket.on("newList", ({ board_id, list }) => {
    WS.listAdded(io, socket, board_id, list);
  });

  socket.on("removeList", ({ board_id, list_id }) => {
    WS.listRemoved(io, socket, board_id, list_id);
  });

  socket.on("editList", ({ board_id, list_id, newName }) => {
    WS.listEditted(io, socket, board_id, list_id, newName);
  });

  socket.on("newCard", ({ board_id, card }) => {
    WS.cardAdded(io, socket, board_id, card);
  });

  socket.on("removeCard", ({ board_id, card_id }) => {
    WS.cardRemoved(io, socket, board_id, card_id);
  });

  socket.on("editCard", ({ board_id, newCard }) => {
    WS.cardEditted(io, socket, board_id, newCard);
  });

  socket.on("addMemberToCard", ({ board_id, card_id, member }) => {
    WS.addSomeoneToCard(io, socket, board_id, card_id, member);
  });

  socket.on("removedMemberFromCard", ({ board_id, card_id, member_id }) => {
    WS.removeSomeoneFromCard(io, socket, board_id, card_id, member_id);
  });
  socket.on("removedMemberFromCard", ({ board_id, card_id, member_id }) => {
    WS.removeSomeoneFromCard(io, socket, board_id, card_id, member_id);
  });
  socket.on("removedMemberFromCard", ({ board_id, card_id, member_id }) => {
    WS.removeSomeoneFromCard(io, socket, board_id, card_id, member_id);
  });

  socket.on("EditTodo", ({ board_id, card_id, index, todo_name }) => {
    WS.editTodo(io, socket, board_id, card_id, index, todo_name);
  });

  socket.on("AddTodo", ({ board_id, card_id, todo }) => {
    WS.addTodo(io, socket, board_id, card_id, todo);
  });

  socket.on("RemoveTodo", ({ board_id, card_id, index }) => {
    WS.removeTodo(io, socket, board_id, card_id, index);
  });

  socket.on("CheckTodo", ({ board_id, card_id, index }) => {
    WS.checkTodo(io, socket, board_id, card_id, index);
  });

  socket.on("UncheckTodo", ({ board_id, card_id, index }) => {
    WS.unCheckTodo(io, socket, board_id, card_id, index);
  });

  socket.on("AddCardAttatchment", ({ board_id, card_id, attach }) => {});

  socket.on("RemoveCardAttatchment", ({ board_id, card_id, index }) => {});

  socket.on("disconnect", () => {
    console.log(`user ${socket.id} disconnected.`);
    WS.userLeave(socket.id);
    sendNewUsers();
  });

  function sendNewUsers() {
    io.in("OnlineUsers").emit("updateUserRoom", { users: WS.getAllUsers() });
  }
});

// Database
mongoose
  .connect(`mongodb://localhost:27017/${process.env.DB_Name}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(async (res) => {
    const isAdminCreated = await User.find({ admin: true });
    if (!isAdminCreated.length) {
      const admin = await User.create({
        username: "admin",
        password: "admin",
        admin: true,
      });
      console.log(
        "An admin user with username:admin,password:admin has been created."
      );
      console.log(`Please insert ${admin._id} in .env file for ADMIN_ID`);
    }
    server.listen(8090);
    console.log("Server listening on localhost:8090");
  })
  .catch((err) => console.log(err));

//Routes
const userRoutes = require("./Routes/user");
const BoardRoutes = require("./Routes/board");
const ListRoutes = require("./Routes/list");
const cardRoutes = require("./Routes/card");
const NotificationRoutes = require("./Routes/notification");

app.use(compression());
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));
app.use("/api/user/", userRoutes);
app.use("/api/board/", BoardRoutes);
app.use("/api/list/", ListRoutes);
app.use("/api/card/", cardRoutes);
app.use("/api/notifications/", NotificationRoutes);

app.use(express.static("views"));
app.use("/files", (req, res) => {
  res.sendFile(__dirname + `/views${req.url.replace("files", "")}`);
});

app.use("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "views/index.html"));
});

app.use((error, req, res, next) => {
  console.log("An Error Happend");
  console.log(error);
  if (error.message === "File too large") {
    res.status(500).json({
      success: false,
      message: "Photo larger than 10MB.",
    });
    return;
  }
  res.status(500).json({
    success: false,
    message: error.message,
  });
  return;
});

process.on("SIGTERM", () => {
  debug("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    debug("HTTP server closed");
  });
});
