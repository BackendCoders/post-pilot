import dotenv from 'dotenv';
import path from 'path';

// Load .env from the backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


import { mailService } from '../services/mailService';
import { logger } from '../utils/logger';


async function runEmailTest() {
  console.log('--- SMTP Connection Test ---');
  const result = await mailService.verifyConnection();

  if (result.success) {
    console.log('✅ SUCCESS: ' + result.message);

    // Optional: Try sending a real test email

    try {
      console.log('Sending test email...');
      await mailService.sendMail(
        process.env.ADMIN_EMAIL || 'test@example.com',
        'Test Email from SEO Rocket',
        '<h1>Connection Working!</h1><p>This is a test email to verify SMTP settings.</p>'
      );
      console.log('✅ Test email sent successfully');
    } catch (err) {
      console.log('❌ Failed to send test email');
    }

  } else {
    console.log('❌ FAILED: ' + result.message);
    console.log('Error Details:', result.error);
    console.log('\nTip: Check if your SMTP_HOST and SMTP_PORT in .env are correct.');
  }
}

runEmailTest().catch(console.error);
