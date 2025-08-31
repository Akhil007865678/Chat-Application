import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js";

const fetchMessages = async (req, res) => {
  try {
    const { from, to } = req.body || req.query;
    const messages = await Message.find({
      users: {
        $all: [from, to],
      },
    }).sort({ updatedAt: 1 });

    const projectedMessages = messages.map((msg) => {
      return {
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
      };
    });
    console.log("messsages: ",projectedMessages);
    res.json(projectedMessages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const addMessage = async (req, res) => {
  try {
    const { from, to, message } = req.body;
    const data = await Message.create({
      message: { text: message },
      users: [from, to],
      sender: from,
    });
    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (error) {
    console.error("Error in addMessage:", error);
    return res.status(500).json({ status: false, msg: "Server error" });
  }
};

export default {
  fetchMessages, addMessage
};