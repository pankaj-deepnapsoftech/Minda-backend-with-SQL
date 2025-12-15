import { fileURLToPath } from "url";
import path from "path";
import ejs from "ejs";

// -------------------------- local import -----------------------
import { transport } from "../config/MailTransporter.js";
import { logger } from "../utils/logger.js";

// recreate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SendMail = async (templateName, templateData, ReceiverInfo) => {
  try {
    const templatePath = path.join(__dirname,"../templates",`${templateName}.ejs`);

    // Render EJS template
    const html = await ejs.renderFile(templatePath, templateData);

    // Send mail
    await transport.sendMail({
      from: "noreply@email.com",
      to: ReceiverInfo.email,
      subject: ReceiverInfo.subject,
      html,
    });

    logger.log("Email sent successfully");
  } catch (error) {
    logger.error("SendMail error:", error);
  }
};
