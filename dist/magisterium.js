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
        const results = await response.json();
        // Display the response content
        console.log(results.choices[0].message.content);
        console.log('\n\n--- Full JSON Response ---');
        console.log(JSON.stringify(results, null, 2));
        return results;
    }
    catch (error) {
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
