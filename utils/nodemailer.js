const nodemailer = require("nodemailer");

const sendEmail = (msg, senderEmail, senderPass) => {
  return new Promise((res, rej) => {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: senderEmail,
        pass: senderPass,
      },
    });

    transporter.sendMail(msg, (err, info) => {
      err ? rej(err) : res(info);
    });
  });
};

const sendOtpEmail = (toEmail, text, otp, senderEmail, senderPass) => {
  const message = {
    from: senderEmail || process.env.SENDER_EMAIL,
    to: toEmail,
    subject: "Login Otp",
    html: `
      <h3>Hello ${toEmail} 😊</h3>
      <p>${text}</p>
      <br/>
      <h2>${otp}</h2>
      <p>Ariful's portfolio Application Team</p>
      <p>Thank You</p>
    `,
  };

  const fromEmail = process.env.SENDER_EMAIL;
  const fromPass = process.env.SENDER_EMAIL_PASSWORD;

  return sendEmail(message, fromEmail, fromPass);
};

module.exports = { sendOtpEmail };
