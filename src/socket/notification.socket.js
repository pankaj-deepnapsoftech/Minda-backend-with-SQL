import { io } from "../server.js"




export const sendNotification  = (notification) => {
    io.emit("notification",notification);
}



