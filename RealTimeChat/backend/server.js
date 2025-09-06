import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.use(cors({ origin: "*" }));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// username -> socket.id map
const users = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // register a username
  socket.on("register", (username) => {
    socket.data.username = username;
    users.set(username, socket.id);

    // send updated online users list to all clients
    io.emit("online users", Array.from(users.keys()));
    console.log(`${username} registered as ${socket.id}`);
  });

  // broadcast message to everyone
  socket.on("chat message", (msg) => {
    io.emit("chat message", { from: socket.data.username, text: msg });
  });

  // private message
  socket.on("private message", ({ toUsername, text }) => {
    const targetSocketId = users.get(toUsername);
    if (targetSocketId) {
      io.to(targetSocketId).emit("private message", {
        from: socket.data.username,
        text,
      });
    }
  });

  socket.on("disconnect", () => {
    // remove from users map
    if (socket.data.username) {
      users.delete(socket.data.username);
      io.emit("online users", Array.from(users.keys()));
    }
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(8080, () => console.log("Server listening on 8080"));
