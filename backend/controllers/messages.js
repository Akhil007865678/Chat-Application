import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js";

const fetchMessages = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: "Both 'from' and 'to' are required." });
    }

    const messages = await Message.find({
      $or: [
        { sender: from, receiver: to },
        { sender: to, receiver: from },
      ],
    });

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Server error" });
  }
};
const addMessage = async (req, res) => {
  const { from, to, message } = req.body;

  console.log("Received message from frontend:", { from, to, message });
  return res.json({ status: true, msg: "Message received (not stored)." });
};



export default {
  fetchMessages, addMessage
};