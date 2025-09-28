import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Logo from "../assets/logo.svg";
import axios from "axios";
import "./container.css";

export default function Contacts({ changeChat }) {
  const [currentUserName, setCurrentUserName] = useState(undefined);
  const [currentSelected, setCurrentSelected] = useState(undefined);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/auth/user`, {
          withCredentials: true,
        });
        if (res.data.success) {
          setCurrentUserName(res.data.user.userId);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/auth/fetch-user`, {
          withCredentials: true,
        });
        setContacts(res.data);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };
    fetchContacts();
  }, []);

  // Change selected contact
  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };

  // Filter contacts based on search
  const filteredContacts = contacts
    .filter(contact => contact._id !== currentUserName)
    .filter(contact =>
      contact.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Container>
      {/* Brand / Title */}
      <div className="brand">
        <img src={Logo} alt="logo" />
        <h3>Chats</h3>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Contacts List */}
      <div className="contacts">
        {filteredContacts.map((contact, index) => (
          <div
            key={contact._id}
            className={`contact ${index === currentSelected ? "selected" : ""}`}
            onClick={() => changeCurrentChat(index, contact)}
          >
            <div className="avatar">
              <img
                src={`data:image/svg+xml;base64,${contact.avatarImage}`}
                alt="avatar"
              />
            </div>
            <div className="username">
              <h3>{contact.userName}</h3>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}

// Styled-component container
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  .contacts {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
    margin-top: 1rem;
    
    .selected {
      background-color: #4e0eff;
    }
  }
`;
