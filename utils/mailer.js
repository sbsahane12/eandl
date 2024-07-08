const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

const getBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
        return process.env.RENDER_EXTERNAL_URL;
    } else {
        const port = process.env.PORT || 8000;
        return `http://localhost:${port}`;
    }
};

const sendVerificationEmail = (email, token) => {
    const url = `${getBaseUrl()}/user/verify-email?token=${token}`;
    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject: 'Email Verification',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #cccccc; border-radius: 10px;">
                <h2 style="text-align: center; color: #4CAF50;">Email Verification</h2>
                <p style="font-size: 16px; color: #333333;">
                    Thank you for registering with us. Please click the button below to verify your email address.
                </p>
                <div style="text-align: center; margin: 20px;">
                    <a href="${url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
                </div>
                <p style="font-size: 14px; color: #777777;">
                    If you did not request this verification, please ignore this email.
                </p>
                <p style="font-size: 14px; color: #777777;">
                    Best regards,<br>Earn and Learn Scheme Department
                </p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else console.log(`Email sent: ${info.response}`);
    });
};

const sendPasswordResetEmail = (email, token) => {
    const url = `${getBaseUrl()}/user/resetPassword?token=${token}`;
    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject: 'Password Reset',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #cccccc; border-radius: 10px;">
                <h2 style="text-align: center; color: #ff6347;">Password Reset</h2>
                <p style="font-size: 16px; color: #333333;">
                    We received a request to reset your password. Please click the button below to reset your password.
                </p>
                <div style="text-align: center; margin: 20px;">
                    <a href="${url}" style="background-color: #ff6347; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                </div>
                <p style="font-size: 14px; color: #777777;">
                    If you did not request a password reset, please ignore this email or contact support if you have questions.
                </p>
                <p style="font-size: 14px; color: #777777;">
                    Best regards,<br>Earn and Learn Scheme Department
                </p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else console.log(`Email sent: ${info.response}`);
    });
};



const sendSchemeDeletedEmail = (email, { schemeName, schemeType,date,hoursWorked, year }) => {
    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject:` Scheme ${schemeName} (${schemeType}) Deleted`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #cccccc; border-radius: 10px;">
                <h2 style="text-align: center; color: #ff6347;">Scheme Deleted</h2>
                <p style="font-size: 16px; color: #333333;">
                    The scheme "${schemeName}" (${schemeType}) for year ${year} has been deleted.
                </p>
                <p style="font-size: 16px; color: #333333;">
                    Hours Worked: ${hoursWorked}
                </p>
                <p style="font-size: 16px; color: #333333;">
                    Date: ${date}
                </p>
                <p style="font-size: 16px; color: #333333;">
                    Your Scheme Is Deleted Due By The Earn and Learn Scheme Department.
                </p>
                <p style="font-size: 14px; color: #777777;">
                    If you have any questions, please use the contact support.
                </p>
                <p style="font-size: 14px; color: #777777;">
                    Best regards,<br>Earn and Learn Scheme Department
                </p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else console.log(`Email sent: ${info.response}`);
    });
};


const sendSchemeAddedEmail = (email, { schemeName, schemeType, hoursWorked, date, year }) => {
    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject: 'New Scheme Added',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #cccccc; border-radius: 10px;">
                <h2 style="text-align: center; color: #4CAF50;">New Scheme Added</h2>
                <p style="font-size: 16px; color: #333333;">
                    A new scheme has been added.
                </p>
                <p><strong>Scheme Name:</strong> ${schemeName}</p>
                <p><strong>Scheme Type:</strong> ${schemeType}</p>
                <p><strong>Hours Worked:</strong> ${hoursWorked}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Year:</strong> ${year}</p>
                <p style="font-size: 14px; color: #777777;">
                    Best regards,<br>Earn and Learn Scheme Department
                </p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else console.log(`Email sent: ${info.response}`);
    });
};

const sendSchemeUpdatedEmail = (email, { schemeName, schemeType, hoursWorked, date, year, completed }) => {
    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject: `Scheme ${schemeName} of  this ${date} has been Updated`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #cccccc; border-radius: 10px;">
                <h2 style="text-align: center; color: #ff6347;">Scheme Updated</h2>
                <p style="font-size: 16px; color: #333333;">
                    A scheme ${schemeName} has been updated.
                </p>
                <p><strong>Scheme Name:</strong> ${schemeName}</p>
                <p><strong>Scheme Type:</strong> ${schemeType}</p>
                <p><strong>Hours Worked:</strong> ${hoursWorked}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Year:</strong> ${year}</p>
                <p><strong>Year:</strong> ${completed===true?'Completed':'Not Completed'}</p>
                <p style="font-size: 14px; color: #777777;">
                    Best regards,<br>Earn and Learn Scheme Department
                </p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else console.log(`Email sent: ${info.response}`);
    });
};


const sendQueryHandledEmail = (email, query) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Query Handled',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #cccccc; border-radius: 10px;">
                <h2 style="text-align: center; color: #4CAF50;">Query Handled</h2>
                <p style="font-size: 16px; color: #333333;">
                    Your query has been Solved successfully and we will contact you soon.
                </p>
                
                <p><strong>Query:</strong> ${query}</p>
                <p style="font-size: 14px; color: #777777;">
                    Best regards,<br>Earn and Learn Scheme Department
                </p>
                
            </div>
        `
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                console.log(`Email sent: ${info.response}`);
                resolve(info);
            }
        });
    });
};



module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendSchemeAddedEmail,
    sendSchemeUpdatedEmail,
    sendSchemeDeletedEmail,
    sendQueryHandledEmail,
};



