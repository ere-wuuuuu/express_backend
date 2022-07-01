let nodemailer = require('nodemailer');

const sendEmail = async (from, to, subject, text) => {
    var mailOptions = {
        from,
        to,
        subject,
        text
    };

    var transporter = nodemailer.createTransport({
        host: process.env.HOST_URL,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT === 465 ? true : false,
        tls: {
            secure: false,
            ignoreTLS: true,
            rejectUnauthorized: false
        },
        auth: {
            user: process.env.SYSTEM_EMAIL,
            pass: process.env.SYSTEM_EMAIL_PASSWORD
        }

    });

    console.log("sending");
    await transporter.sendMail(mailOptions, function (error, info) {
        console.log("process");
        if (error) {
            console.log(error);
            return false;
        } else {
            console.log('Email sent: ' + info.response);
            return true;
        }
    });
}


module.exports = sendEmail;