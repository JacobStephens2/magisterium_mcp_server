"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMagisteriumAnswer = getMagisteriumAnswer;
// Direct API call using fetch
const dotenv = __importStar(require("dotenv"));
// Load environment variables from .env file
dotenv.config();
async function getMagisteriumAnswer() {
    const apiKey = process.env.MAGISTERIUM_API_KEY;
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
                if (done)
                    break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6); // Remove 'data: ' prefix
                        if (jsonStr.trim() === '[DONE]') {
                            break;
                        }
                        try {
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.choices?.[0]?.delta?.content) {
                                fullContent += parsed.choices[0].delta.content;
                                process.stdout.write(parsed.choices[0].delta.content);
                            }
                        }
                        catch (parseError) {
                            // Skip invalid JSON chunks
                            continue;
                        }
                    }
                }
            }
        }
        console.log('\n\nFull response:', fullContent);
    }
    catch (error) {
        console.error('Error calling Magisterium API:', error);
    }
}
// Call the function
getMagisteriumAnswer().catch(console.error);
