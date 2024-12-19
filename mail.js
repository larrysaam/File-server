const nodemailer = require("nodemailer");
require('dotenv').config()

const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


exports.sendEmail = async ({receipients, subject, message})=>{
    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: receipients,
        subject,
        text: message
    })
}




