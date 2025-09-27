import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { BsEmojiSmileFill } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import Picker from "emoji-picker-react";
import { v4 as uuidv4 } from "uuid";
import Contacts from "../components/Contacts";
import "./Chat.css";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);

  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showContacts, setShowContacts] = useState(true);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/auth/user`, {
          withCredentials: true,
        });
        if (res.data.success) setCurrentUser(res.data.user);
        else navigate("/login");
      } catch {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  // Socket connection
  useEffect(() => {
    socket.current = io(`${process.env.REACT_APP_API}`);
    return () => socket.current.disconnect();
  }, []);

  useEffect(() => {
    if (currentUser && socket.current)
      socket.current.emit("add-user", currentUser.userId);
  }, [currentUser]);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUser) {
        const response = await axios.get(`${process.env.REACT_APP_API}/auth/fetch-user`, {
          withCredentials: true,
        });
        setContacts(response.data.filter(u => u._id !== currentUser.userId));
      }
    };
    fetchContacts();
  }, [currentUser]);

  // Handle receiving messages
  useEffect(() => {
    const handleReceiveMessage = ({ message, from }) => {
      setMessages(prev => [...prev, { from, message, fromSelf: false }]);
    };
    socket.current?.on("receive-message", handleReceiveMessage);
    return () => socket.current?.off("receive-message", handleReceiveMessage);
  }, []);

  // Fetch messages with current chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser?.userId || !currentChat?._id) return;
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API}/messages/getmsg`, {
          params: { from: currentUser.userId, to: currentChat._id },
        });
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
  }, [currentChat, currentUser]);

  // Send message
  const handleSendMsg = async (message) => {
    if (!currentChat?._id || !message) return;
    if (currentUser?.userId)
      setMessages(prev => [...prev, { from: currentUser.userId, message, fromSelf: true }]);

    try {
      await axios.post(`${process.env.REACT_APP_API}/messages/addmsg`, {
        from: currentUser.userId,
        to: currentChat._id,
        message,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }

    socket.current?.emit("send-message", {
      to: currentChat._id,
      message,
      from: currentUser.userId,
    });

    setMsg("");
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (msg.trim()) handleSendMsg(msg);
  };

  const toggleEmojiPicker = () => setShowEmojiPicker(!showEmojiPicker);
  const handleEmojiClick = (emojiObject) => setMsg(prev => prev + emojiObject.emoji);

  // Auto-scroll only if user near bottom
  useEffect(() => {
    const chatMessages = chatMessagesRef.current;
    if (!chatMessages) return;
    const isNearBottom =
      chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 50;
    if (isNearBottom) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
    setMessages([]);
    setShowContacts(false);
  };

  const handleBackToContacts = () => {
    setCurrentChat(undefined);
    setShowContacts(true);
  };

  return (
    <div className="parent-box">
      <div className="container">
        {/* Contacts */}
        <div className={`contacts-panel ${showContacts ? "show" : "hide"}`}>
          <Contacts contacts={contacts} changeChat={handleChatChange} />
        </div>

        {/* Chat section */}
        {!showContacts && currentChat && (
          <div className="chat-wrapper">
            <div className="chat-container">
              <div className="chat-header">
                <button className="back-btn" onClick={handleBackToContacts}>
                  ←
                </button>
                <h3>{currentChat.username || currentChat.name}</h3>
              </div>
              <div className="chat-messages" ref={chatMessagesRef}>
                {messages.map((message) => (
                  <div key={uuidv4()} className={`message ${message.fromSelf ? "sended" : "recieved"}`}>
                    <div className="content">
                      <p>{message.content || message.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-container">
                <div className="button-container">
                  <div className="emoji">
                    <BsEmojiSmileFill onClick={toggleEmojiPicker} />
                    {showEmojiPicker && (
                      <div className="emoji-picker">
                        <Picker onEmojiClick={handleEmojiClick} />
                      </div>
                    )}
                  </div>
                </div>
                <form className="input-container" onSubmit={sendChat}>
                  <input
                    type="text"
                    placeholder="Type a message"
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                  />
                  <button type="submit"><IoMdSend /></button>
                </form>
              </div>
            </div>
          </div>
        )}

        {!showContacts && !currentChat && (
          <div style={{ color: "white", textAlign: "center", paddingTop: "20%" }}>
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
