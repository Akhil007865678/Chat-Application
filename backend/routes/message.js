import express from "express";
import auth from "../middleware/authMiddleware.js";
import userMessages from '../controllers/messages.js';
const { fetchMessages, addMessage } = userMessages;

const router = express.Router();

router.get('/getmsg', fetchMessages);
router.post("/addmsg", addMessage); 

export default router;