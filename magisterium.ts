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

interface StreamChunk {
  choices: Array<{
    delta: {
      content?: string;
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
        ],
        "stream": true,
        "return_related_questions": true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}): ${errorText}`);
      return;
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            if (jsonStr.trim() === '[DONE]') {
              break;
            }
            
            try {
              const parsed = JSON.parse(jsonStr) as StreamChunk;
              if (parsed.choices?.[0]?.delta?.content) {
                fullContent += parsed.choices[0].delta.content;
                process.stdout.write(parsed.choices[0].delta.content);
              }
            } catch (parseError) {
              // Skip invalid JSON chunks
              continue;
            }
          }
        }
      }
    }

    console.log('\n\nFull response:', fullContent);
  } catch (error) {
    console.error('Error calling Magisterium API:', error);
  }
}

// Call the function
getMagisteriumAnswer().catch(console.error);
