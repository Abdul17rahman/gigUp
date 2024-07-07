const nodemailer = require("nodemailer");
const mg = require("nodemailer-mailgun-transport");

// Auth for mailgun
const auth = {
  auth: {
    api_key: process.env.MAIL_GUN_API,
    domain: process.env.MAIL_GUN_DOMAIN,
  },
};

const transporter = nodemailer.createTransport(mg(auth));

// Email output for verify user.
function verifyEmail(user, type) {
  return `
    <h1>Verification.</h1>
    <p>Hello ${user.username}, <br>Your user account has been successfully created, please click the link below to verify your account and login.</p>
    <p><a href=http://localhost:3000/verifyEmail/${user.email}/${user.verification_token}/${type}>Verify Account</a></p>
    <p>Thank you. <br> <br> Regards <br> Admin</p>
    <p>This is an auto-generated Email, please do not reply.!</p>
  `;
}

// Send emails.
async function sendEmail(subject, type, text, user) {
  const info = await transporter.sendMail({
    from: '"Admin gigUp" <' + process.env.EMAIL_USER + ">", // sender address
    to: `${user.email}`, // list of receivers
    subject: `${subject}`, // Subject line
    text: `${text}`, // plain text body
    html: `${verifyEmail(user, type)}`, // html body
  });
}

// Email output for .
function proposalText(user, job, emp, proposal) {
  return `
    <h2>Recieved Proposal.</h2>
    <p>Hello ${emp.username}, <br>You have recieved a new job application proposal from ${user.username}, Please visit your account to review it.</p>
    <h4>Application details:</h4>
    <p><strong>Title:</strong> ${job.title}.</p>
    <p><strong>Price: $</strong>${proposal.price}-${proposal.period}.</p>
    <p><strong>Cover letter:</strong> ${proposal.cover}.</p>
    <p>Thank you. <br> <br> Regards <br> Admin</p>
    <p>This is an auto-generated Email, please do not reply.!</p>
  `;
}

async function sendProposal(user, job, emp, proposal) {
  const info = await transporter.sendMail({
    from: '"Admin gigUp" <' + process.env.EMAIL_USER + ">", // sender address
    to: `${emp.email}`, // list of receivers
    subject: `Proposal`, // Subject line
    text: `New Proposal`, // plain text body
    html: `${proposalText(user, job, emp, proposal)}`, // html body
  });
}

function responseText(user, job, proposal, text) {
  return `
    <h2>Proposal Response.</h2>
    <p>Hello ${user.username}, <br><p> Your proposal has been ${text}, Please visit your account to review it.</p>
    <h4>Application details:</h4>
    <p><strong>Title:</strong> ${job.title}.</p>
    <p><strong>Price: $</strong>${proposal.price}-${proposal.period}.</p>
    <p>Thank you. <br> <br> Regards <br> Admin</p>
    <p>This is an auto-generated Email, please do not reply.!</p>
  `;
}

async function proposalRes(user, job, proposal, text) {
  const info = await transporter.sendMail({
    from: '"Admin gigUp" <' + process.env.EMAIL_USER + ">", // sender address
    to: `${user.email}`, // list of receivers
    subject: `Proposal Response`, // Subject line
    text: `${text}`, // plain text body
    html: `${responseText(user, job, proposal, text)}`, // html body
  });
}

module.exports = { sendEmail, sendProposal, proposalRes };
