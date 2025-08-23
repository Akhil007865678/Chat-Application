import express from "express";
import userController from '../controllers/user.js';
const { signUp, signIn, logout, fetchUser, verify, user } = userController;

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', signIn);
router.post('/logout', logout);
router.get('/fetch-user',fetchUser);
router.get('/verify', verify);
router.get('/user', user);

export default router;