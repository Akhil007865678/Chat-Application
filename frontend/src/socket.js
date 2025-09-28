import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_API, {
  withCredentials: true
});

export default socket;
