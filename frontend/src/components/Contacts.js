import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Logo from "../assets/logo.svg";
import axios from "axios";
import "./container.css";

export default function Contacts({ changeChat }) {
  const [currentUserName, setCurrentUserName] = useState(undefined);
  const [currentSelected, setCurrentSelected] = useState(undefined);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/auth/user`, {
          withCredentials: true,
        });
        console.log("user : ", res)
        if (res.data.success) {
          setCurrentUserName(res.data.user.userId);
        }
        console.log(currentUserName);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchData();
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API}/auth/fetch-user`, {
          withCredentials: true
        });
        setContacts(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchContacts();
  }, []);

  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };

  return (
    <>
      {true && (
        <Container>
          <div className="brand">
            <img src={Logo} alt="logo" />
            <h3>Chats</h3>
          </div>
          <div className="contacts">
            {contacts.filter(contact => contact._id !== currentUserName).map((contact, index) => {
              return (
                <div
                  key={contact._id}
                  className={`contact ${
                    index === currentSelected ? "selected" : ""
                  }`}
                  onClick={() => changeCurrentChat(index, contact)}
                >
                  <div className="avatar">
                    <img
                      src={`data:image/svg+xml;base64,${contact.avatarImage}`}
                      alt=""
                    />
                  </div>
                  <div className="username">
                    <h3>{contact.userName}</h3>
                  </div>
                </div>
              );
            })}
          </div>
          
        </Container>
      )}
    </>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 75% 15%;
  overflow: hidden;
  background-color: #080420;
`;