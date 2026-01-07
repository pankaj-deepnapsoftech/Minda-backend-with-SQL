import { io } from "../server"




export const sendNotification  = (notification) => {
    io.emit("notification",notification);
}



