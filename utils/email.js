const nodemailer = require("nodemailer");
const mg = require("nodemailer-mailgun-transport");

// Auth for mailgun
const auth = {
  auth: {
    api_key: process.env.MAIL_GUN_API,
    domain: process.env.MAIL_GUN_DOMAIN,
  },
};

// Email output for verify user.
function verifyEmail(user) {
  return `
    <h1>Verification.</h1>
    <p>Hello ${user.username}, <br>Your user account has been successfully created, please click the link below to verify your account and login.</p>
    <p><a href=http://localhost:3000/verifyEmail/${user.email}/${user.verification_token}>Confirm Email</a></p>
    <p>Thank you. <br> <br> Regards <br> Admin</p>
    <p>This is an auto-generated Email, please do not reply.!</p>
  `;
}

// Setup email.
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true, // Use `true` for port 465, `false` for all other ports
//   auth: {
//     user: `${process.env.EMAIL_USER}`,
//     pass: `${process.env.EMAIL_PASS}`,
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// });

const transporter = nodemailer.createTransport(mg(auth));

// Send emails.
async function sendEmail(subject, text, user) {
  const info = await transporter.sendMail({
    from: '"Admin gigUp" <' + process.env.EMAIL_USER + ">", // sender address
    to: `${user.email}`, // list of receivers
    subject: `${subject}`, // Subject line
    text: `${text}`, // plain text body
    html: `${verifyEmail(user)}`, // html body
  });
}

module.exports = sendEmail;
