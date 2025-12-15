import {fileURLToPath} from "url";
import path from path;

// -------------------------- locl import -----------------------
import { transport } from "../config/MailTransporter.js"

const __dirname = 




export const SendMail = async (templateName,templateData,ReceiverInfo) =>{


    transport.sendMail({
        from:"@norply.email.com",
        to:ReceiverInfo.email,
        subject:ReceiverInfo.subject,
        html:html
    })

}