const nodemailer = require("nodemailer");

const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for 587/25
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendImageEmail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required (field name: image)" });
    }

    const to = req.body.to || process.env.MAIL_TO;
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    if (!to || !from) {
      return res.status(400).json({ message: "Missing recipient or sender email (configure MAIL_TO and MAIL_FROM)" });
    }

    const subject = req.body.subject || "New image upload";
    const text = req.body.text || "An image was uploaded from the SocialAge backend.";

    const mailOptions = {
      from,
      to,
      subject,
      text,
      attachments: [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Email send failed:", error);
    res.status(500).json({ message: "Failed to send email", error: error.message });
  }
};

module.exports = { sendImageEmail };
