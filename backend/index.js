// backend/index.js
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './connection/conn.js';
import users from './routes/users.js';
import messages from './routes/message.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = createServer(app);

const onlineUsers = new Map();

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
});

connectDB();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/auth', users);
app.use('/messages', messages);

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  socket.on("send-message", ({ to, message, from }, callback) => {
    const sendToSocket = onlineUsers.get(to);
    if (sendToSocket) {
      io.to(sendToSocket).emit("receive-message", { message, from });
      console.log(`📤 Message from ${from} to ${to}: ${message}`);
      callback("ok");
    } else {
      console.log(`⚠️ User ${to} not online`);
      callback("user-offline");
    }
  });
  /*
  socket.on("call-user", ({ to, offer, from }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", {
        from, // send userId of caller
        offer,
      });
    }
  });

  socket.on("answer-call", ({ to, answer, from }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("call-answered", {
        from,
        answer,
      });
    }
  });

  socket.on("ice-candidate", ({ to, candidate, from }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("ice-candidate", { from, candidate });
    }
  });
  */
  socket.on("disconnect", () => {
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
