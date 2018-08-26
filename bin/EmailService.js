// Электронная почта от RU-CENTER
// www.mail.nic.ru

'use strict';

const nodemailer = require('nodemailer');

nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error('Failed to create a testing account');
        console.error(err);
        return process.exit(1);
    }
});

// Generate SMTP service account from ethereal.email
module.exports.sendMail =  function (message) {
    let transporter = nodemailer.createTransport(
        {
            host: "mail.nic.ru",
            port: 587,
            secure: false,
            auth: {
                user: "support@sit45.ru",
                pass: "F2$mN36_",
            },
            logger: false,
            debug: false // include SMTP traffic in the logs
        },
        {
            from: 'support@sit45.ru',
        }
    );

    transporter.sendMail(message, (error, info) => {
        if (error) {
            console.log('Error occurred');
            console.log(error.message);
            return process.exit(1);
        }

        console.log('Message sent successfully!');
        console.log(info);

        // only needed when using pooled connections
        transporter.close();
    });
};
