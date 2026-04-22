const nodemailer = require('nodemailer');
require('dotenv').config({ path: './.env' });

async function test() {
    console.log('Testing SMTP with:');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('Secure:', process.env.SMTP_SECURE);
    console.log('User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        },
        timeout: 10000
    });

    try {
        console.log('Attempting to verify...');
        await transporter.verify();
        console.log('Success!');
    } catch (err) {
        console.error('Failed!');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        if (err.response) console.error('Response:', err.response);
    }
}

test();
