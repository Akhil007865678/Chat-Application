import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';


const cookieOptions = {
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',  
    maxAge: 60 * 60 * 1000 
};


const signUp = async (req, res) => {
  try {
    const {userName, password} = req.body;
    const isExist = await User.findOne({ userName });
    if (isExist) {
      return res.status(400).json({ error: 'Username already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      userName,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully', data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

const signIn = async (req, res) => {
  try {
      const { userName, password } = req.body;
      const user = await User.findOne({ userName });

      if (user && await bcrypt.compare(password, user.password)) {
          const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
          res.cookie('token', token, cookieOptions);
          return res.json({ message: "Logged in successfully", success: "true", token });
      } else {
          return res.status(400).json({ error: 'Invalid Credentials' });
      }
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Server error, please try again later.' });
  }
};

const logout = (req, res) => {
    res.clearCookie('token', cookieOptions).json({message: 'Logged out successfully'});
};

const fetchUser = async (req, res) => {
  try{
    const users = await User.find();
    return res.status(200).json(users);
  } catch(error){
    console.error(error);
    return res.status(500).json({error: 'Server error'})
  }
}

const verify = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ authenticated: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ authenticated: true });
  } catch (err) {
    return res.json({ authenticated: false });
  }
};

const user = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json({ success: false, message: "Token not found" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.json({ success: false, message: "Invalid token" });
  }
};



export default {
  signUp, signIn, logout, fetchUser, verify, user
};