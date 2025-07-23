curl -X POST https://www.magisterium.com/api/v1/chat/completions \
    -H "Authorization: Bearer $MAGISTERIUM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
    "model": "magisterium-1",
    "messages": [
        {
        "role": "user",
        "content": "What is the Magisterium?"
        }
    ]
    }'
