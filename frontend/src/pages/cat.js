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

  const [stream, setStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const myVideo = useRef();
  const userVideo = useRef();

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:4000/auth/user", {
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

  // Initialize socket
  useEffect(() => {
    socket.current = io("http://localhost:4000");
    return () => {
      socket.current.disconnect();
    };
  }, []);

  // Join room once currentUser is available
  useEffect(() => {
    if (currentUser && socket.current) {
      socket.current.emit("add-user", currentUser.userId);
    }
  }, [currentUser]);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUser) {
        const response = await axios.get("http://localhost:4000/auth/fetch-user", {
          withCredentials: true,
        });
        setContacts(response.data.filter((u) => u._id !== currentUser.userId));
      }
    };
    fetchContacts();
  }, [currentUser]);

  // Handle receiving messages
  useEffect(() => {
    const handleReceiveMessage = ({ message, from }) => {
      setMessages((prev) => [...prev, { from, message, fromSelf: false }]);
    };
    if (socket.current) {
      socket.current.on("receive-message", handleReceiveMessage);
    }
    return () => {
      socket.current?.off("receive-message", handleReceiveMessage);
    };
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Chat change handler
  const handleChatChange = (chat) => {
    setCurrentChat(chat);
    setMessages([]);
  };

  // Send message
  const handleSendMsg = (message) => {
    if (!currentChat._id || !message) return;
    setMessages((prev) => [...prev, { from: currentUser.userId, message, fromSelf: true }]);
    socket.current.emit(
      "send-message",
      { to: currentChat._id, message, from: currentUser.userId },
      (status) => {
        if (status !== "ok") console.error("Failed to send message");
      }
    );
    setMsg("");
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (msg.trim().length > 0) handleSendMsg(msg);
  };

  const toggleEmojiPicker = () => setShowEmojiPicker(!showEmojiPicker);
  const handleEmojiClick = (emojiObject) => setMsg((prev) => prev + emojiObject.emoji);

  // Handle video call setup
  useEffect(() => {
    // Get media stream once
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
      setStream(mediaStream);
      if (myVideo.current) myVideo.current.srcObject = mediaStream;
    });

    // Incoming call
    socket.current.on("incoming-call", ({ from, offer }) => {
      const incomingPeer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
      });

      incomingPeer.on("signal", (answer) => {
        socket.current.emit("answer-call", {
          to: from,
          answer,
          from: currentUser.userId,
        });
      });

      incomingPeer.on("stream", (remoteStream) => {
        if (userVideo.current) userVideo.current.srcObject = remoteStream;
      });

      incomingPeer.signal(offer);
      setPeer(incomingPeer);
    });

    // Answer received
    socket.current.on("call-answered", ({ answer }) => {
      if (peer) peer.signal(answer);
    });

    // ICE candidates (optional)
    socket.current.on("ice-candidate", ({ candidate }) => {
      if (peer) peer.signal(candidate);
    });
  }, [stream, peer, currentUser]);

  const startVideoCall = () => {
    if (!currentChat || !stream) return;

    const newPeer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    newPeer.on("signal", (offer) => {
      socket.current.emit("call-user", {
        to: currentChat._id,
        offer,
        from: currentUser.userId,
      });
    });

    newPeer.on("stream", (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
    });

    setPeer(newPeer);
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
              {/* VIDEO CALL BUTTON */}
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <button
                  onClick={startVideoCall}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#4e0eff",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                  }}
                >
                  Start Video Call
                </button>
              </div>

              <div className="chat-messages">
                {messages.map((message) => (
                  <div ref={scrollRef} key={uuidv4()}>
                    <div className={`message ${message.fromSelf ? "sended" : "recieved"}`}>
                      <div className="content">
                        <p>{message.message}</p>
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

              {/* VIDEO ELEMENTS */}
              <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
                <video
                  ref={myVideo}
                  muted
                  autoPlay
                  playsInline
                  style={{ width: "300px", borderRadius: "10px", backgroundColor: "#000" }}
                />
                <video
                  ref={userVideo}
                  autoPlay
                  playsInline
                  style={{ width: "300px", borderRadius: "10px", backgroundColor: "#000" }}
                />
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
    height: 100%;
    width: 100%;
    display: grid;
    grid-template-columns: 25% 75%;
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }
  }
`;