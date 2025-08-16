const fetch = require('node-fetch');
require('dotenv').config();

async function testMagisteriumAPI() {
    const apiKey = process.env.MAGISTERIUM_API_KEY;
    if (!apiKey) {
        console.error('MAGISTERIUM_API_KEY environment variable is not set');
        return;
    }

    try {
        const response = await fetch('https://www.magisterium.com/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'magisterium-1',
                messages: [
                    {
                        role: 'user',
                        content: 'How did Jesus propose to his bride?',
                    }
                ],
                return_related_questions: true,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error (${response.status}): ${errorText}`);
            return;
        }

        const results = await response.json();
        console.log('Magisterium API Response:');
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('Error calling Magisterium API:', error);
    }
}

testMagisteriumAPI();

