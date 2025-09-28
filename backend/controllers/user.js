import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cloudinary from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

const cookieOptions = {
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',  
    maxAge: 60 * 60 * 1000 
};


dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Cloudinary storage for profile image
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'profile_images',
    resource_type: 'image',
    format: async () => 'jpg',
  },
});

const uploadImage = multer({ storage: imageStorage });

// Signup controller with image
export const signUp = (req, res) => {
  uploadImage.single('profileImage')(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error uploading image' });
    }

    try {
      const { userName, password } = req.body;

      const isExist = await User.findOne({ userName });
      if (isExist) {
        return res.status(400).json({ error: 'Username already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        userName,
        password: hashedPassword,
        profileImage: req.file ? req.file.path : null, // Save Cloudinary URL
      });

      await user.save();
      res.status(201).json({ message: 'User registered successfully', data: user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error.' });
    }
  });
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