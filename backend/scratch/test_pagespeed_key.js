const axios = require('axios');
require('dotenv').config({ path: '.env' });

async function testApiKey() {
    const apiKey = process.env.PAGESPEED_API_KEY;
    const testUrl = 'https://google.com';
    
    console.log('Testing PageSpeed API Key...');
    console.log(`Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'}`);
    
    if (!apiKey) {
        console.error('Error: PAGESPEED_API_KEY is not defined in .env');
        return;
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(testUrl)}&key=${apiKey}&strategy=mobile&category=performance`;
    
    try {
        const response = await axios.get(apiUrl);
        if (response.data.lighthouseResult) {
            console.log('✅ Success! Your API key is working correctly.');
            console.log('Performance Score:', response.data.lighthouseResult.categories.performance.score * 100);
        } else {
            console.log('⚠️ API responded but no Lighthouse results found.');
        }
    } catch (error) {
        console.error('❌ API Key Test Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.error.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testApiKey();
