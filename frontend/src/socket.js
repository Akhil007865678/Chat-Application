import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_API || "http://localhost:4000", {
  withCredentials: true
});

export default socket;
