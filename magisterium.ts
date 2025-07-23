// Direct API call using fetch
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface MagisteriumResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function getMagisteriumAnswer() {
  const apiKey = (process as any).env.MAGISTERIUM_API_KEY;
  
  if (!apiKey) {
    console.error('Error: MAGISTERIUM_API_KEY environment variable is not set');
    console.log('Please set your API key in a .env file: MAGISTERIUM_API_KEY="your-api-key-here"');
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
            content: 'What is the Magisterium?'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      return;
    }

    const results = await response.json() as MagisteriumResponse;
    console.log(results.choices[0].message);
  } catch (error) {
    console.error('Error calling Magisterium API:', error);
  }
}

// Call the function
getMagisteriumAnswer().catch(console.error);
