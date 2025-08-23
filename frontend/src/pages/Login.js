import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../assets/logo.svg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const [userName, setuserName] = useState('');
  const [password, setpassword] = useState('');
  const [error, setError] = useState("");
  const navigate = useNavigate();

 const handleLogin = async (event) => {
  event.preventDefault();
  try {
    const data = { userName, password };
    const response = await axios.post(`${process.env.REACT_APP_API}/auth/login`, data,
      { withCredentials: true }
    );

    if (response.data.success) {
      localStorage.setItem(
        process.env.REACT_APP_LOCALHOST_KEY,
        JSON.stringify(response.data.user)
      );

      console.log('done');
      navigate('/');
    } else {
      setError("Invalid Credentials");
    }
  } catch (err) {
    setError("Oops something went wrong, Try again");
    console.log(err);
  }
};


  return (
    <>
      <FormContainer>
        <form action="" onSubmit={(event) => handleLogin(event)}>
          <div className="brand">
            <img src={Logo} alt="logo" />
            <h1>Chats</h1>
          </div>
          <input type='text' value={userName} onChange={(e) => setuserName(e.target.value)} placeholder='User Name' />
          <input type='password' value={password} onChange={(e) => setpassword(e.target.value)} placeholder='Password' />
          <button type="submit">Log In</button>
          <span>
            Don't have an account ? <Link to="/register">Create One.</Link>
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
    padding: 5rem;
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