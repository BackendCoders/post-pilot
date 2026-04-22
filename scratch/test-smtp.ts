import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function testSMTP() {
  console.log('Testing SMTP with following config:');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('Secure:', process.env.SMTP_SECURE);
  console.log('User:', process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    timeout: 10000, // 10 seconds timeout
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('SUCCESS: SMTP connection verified!');
    
    console.log('Sending test email...');
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'SMTP Test Email',
      text: 'If you see this, SMTP is working correctly.',
    });
    console.log('SUCCESS: Test email sent to', process.env.ADMIN_EMAIL);
  } catch (error: any) {
    console.error('FAILURE: SMTP Error:');
    console.error(error.message);
    if (error.code) console.error('Error Code:', error.code);
    if (error.command) console.error('Command:', error.command);
  }
}

testSMTP();
