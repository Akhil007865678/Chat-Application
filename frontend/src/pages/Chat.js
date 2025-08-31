import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { BsEmojiSmileFill } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";
import Picker from "emoji-picker-react";
import { v4 as uuidv4 } from "uuid";
import Contacts from "../components/Contacts";
import "../components/container.css";
import Peer from "simple-peer";


export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const scrollRef = useRef();
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/auth/user`, {
          withCredentials: true,
        });
        if (res.data.success) {
          setCurrentUser(res.data.user);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  // Initialize socket only once
  useEffect(() => {
    socket.current = io(`${process.env.REACT_APP_API}`);
    return () => {
      socket.current.disconnect();
    };
  }, []);

  // Join socket room once currentUser is available
  useEffect(() => {
    if (currentUser && socket.current) {
      socket.current.emit("add-user", currentUser?.userId);
    }
  }, [currentUser]);

  // Fetch all contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUser) {
        const response = await axios.get(`${process.env.REACT_APP_API}/auth/fetch-user`, {
          withCredentials: true,
        });
        setContacts(response.data.filter((u) => u._id !== currentUser?.userId));
      }
    };
    fetchContacts();
  }, [currentUser]);

  // Listen for incoming messages
  useEffect(() => {
    const handleReceiveMessage = ({ message, from }) => {
      if (currentUser?.userId) {
        setMessages((prev) => [...prev, { from: currentUser.userId, message, fromSelf: true }]);
      }
      setMessages((prev) => [...prev, { from, message, fromSelf: false }]);
    };
    if (socket.current) {
      socket.current.on("receive-message", handleReceiveMessage);
    }
    return () => {
      if (socket.current) {
        socket.current.off("receive-message", handleReceiveMessage);
      }
    };
  }, []);
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser?.userId || !currentChat?._id) return;
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_API}/messages/getmsg`,{
            params: {
              from: currentUser.userId,
              to: currentChat._id,
            }
          }
        );
        console.log("data: ",data);
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
  }, [currentChat, currentUser]);

  // Handle sending message
  const handleSendMsg = async(message) => {
    if (!currentChat?._id || !message) return;
    if (currentUser?.userId) {
      setMessages((prev) => [...prev, { from: currentUser.userId, message, fromSelf: true }]);
    }
    try {
      await axios.post(`${process.env.REACT_APP_API}/messages/addmsg`, {
        from: currentUser.userId,
        to: currentChat._id,
        message,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
    // Emit to server
    if (socket.current) {
      socket.current.emit(
        "send-message",
        { to: currentChat._id, message, from: currentUser.userId },
        (status) => {
          if (status !== "ok") {
            console.error("Failed to send message");
          }
        }
      );
    }
    setMsg("");
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (msg.trim().length > 0) {
      handleSendMsg(msg);
    }
  };

  const toggleEmojiPicker = () => setShowEmojiPicker(!showEmojiPicker);

  const handleEmojiClick = (emojiObject) => {
    setMsg((prev) => prev + emojiObject.emoji);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
    setMessages([]);
  };

  return (
    <Container>
      <div className="container">
        <Contacts contacts={contacts} changeChat={handleChatChange} />
        {currentChat === undefined ? (
          <div style={{ color: "white", textAlign: "center", paddingTop: "20%" }}>
            Select a user to start chatting
          </div>
        ) : (
          <div className="chat-wrapper">
            <div className="chat-container">
              <div className="chat-messages">
                {messages.map((message) => (
                  <div ref={scrollRef} key={uuidv4()}>
                    <div className={`message ${message.fromSelf ? "sended" : "recieved"}`}>
                      <div className="content">
                        <p>{message.content || message.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
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
                    placeholder="Type your message here"
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                  />
                  <button type="submit">
                    <IoMdSend />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;