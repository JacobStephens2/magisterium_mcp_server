// Direct API call using fetch
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface MagisteriumResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export async function getMagisteriumAnswer(): Promise<any> {
  const apiKey = (process as any).env.MAGISTERIUM_API_KEY;
  
  if (!apiKey) {
    console.error('Error: MAGISTERIUM_API_KEY environment variable is not set');
    console.log('Please set your API key in a .env file: MAGISTERIUM_API_KEY="your-api-key-here"');
    return null;
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
        ],
        "return_related_questions": true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      return null;
    }

    // Handle non-streaming response
    const results = await response.json() as MagisteriumResponse;
    
    // Display the response content
    console.log(results.choices[0].message.content);
    
    console.log('\n\n--- Full JSON Response ---');
    console.log(JSON.stringify(results, null, 2));
    
    return results;
  } catch (error) {
    console.error('Error calling Magisterium API:', error);
    return null;
  }
}

// Call the function and handle the response
getMagisteriumAnswer()
  .then(result => {
    // Function completed - no additional summary needed
  })
  .catch(console.error);
