const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  //2) Define the email options
  const mailOptions = {
    from: 'Nisim Ohana <nisimohana42@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.text,
    html: options.html, // added ()
  };
  //3)Actully send the email with Nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;

// For Gmail Example:
//Active in gmail "less secure app option"
// const transporter = nodemailer.createTransport({
//   service: 'Gmail',
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD,
//   },
