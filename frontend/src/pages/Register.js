import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../assets/logo.svg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Register() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [profileImage, setProfileImage] = useState(null); // New state for image
  const [message, setMessage] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      // Use FormData to send file + other fields
      const formData = new FormData();
      formData.append("userName", userName);
      formData.append("password", password);
      if (profileImage) formData.append("profileImage", profileImage);

      const response = await axios.post(`${process.env.REACT_APP_API}/auth/signup`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setMessage(response.data.message);
      toast.success(response.data.message);
    } catch (error) {
      const errMsg = error.response?.data?.error || "Error in SignUp";
      setMessage(errMsg);
      toast.error(errMsg);
    }
  };

  return (
    <>
      <FormContainer>
        <form onSubmit={handleSignUp}>
          <div className="brand">
            <img src={Logo} alt="logo" />
            <h1>Chats</h1>
          </div>
          <input
            type="text"
            className="signUp_Inputs_inp"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="User Name"
          />
          <input
            type="password"
            className="signUp_Inputs_inp"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfileImage(e.target.files[0])} // Save selected file
          />
          <button type="submit">Create User</button>
          <span>
            Already have an account? <Link to="/login">Login.</Link>
          </span>
        </form>
      </FormContainer>
      <ToastContainer />
    </>
  );
}

const FormContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 5rem;
    }
    h1 {
      color: white;
      text-transform: uppercase;
    }
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    background-color: #00000076;
    border-radius: 2rem;
    padding: 3rem 5rem;
  }
  input {
    background-color: transparent;
    padding: 1rem;
    border: 0.1rem solid #4e0eff;
    border-radius: 0.4rem;
    color: white;
    width: 100%;
    font-size: 1rem;
    &:focus {
      border: 0.1rem solid #997af0;
      outline: none;
    }
  }
  button {
    background-color: #4e0eff;
    color: white;
    padding: 1rem 2rem;
    border: none;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0.4rem;
    font-size: 1rem;
    text-transform: uppercase;
    &:hover {
      background-color: #4e0eff;
    }
  }
  span {
    color: white;
    text-transform: uppercase;
    a {
      color: #4e0eff;
      text-decoration: none;
      font-weight: bold;
    }
  }
`;
