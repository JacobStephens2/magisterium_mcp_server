# Magisterium API Client

A TypeScript client for interfacing with the Magisterium API.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your API key:**
   Create a `.env` file in the project root and add your API key:
   ```
   MAGISTERIUM_API_KEY=your-actual-api-key-here
   ```

## Compiling TypeScript

You have several options to compile the TypeScript code:

### Method 1: Using tsconfig.json (Recommended)
```bash
npx tsc
```
This compiles the TypeScript files and outputs them to the `dist/` directory.

### Method 2: Direct compilation with options
```bash
npx tsc --target es2020 --module commonjs magisterium.ts
```
This creates `magisterium.js` in the current directory.

### Method 3: Simple compilation
```bash
npx tsc magisterium.ts
```
Uses default TypeScript settings and creates `magisterium.js` in the current directory.

## Running the Code

After compilation, you can run the code:

```bash
# If compiled with tsconfig.json (Method 1)
node dist/magisterium.js

# If compiled with Method 2 or 3
node magisterium.js
```

## API Usage

The code makes a direct API call to the Magisterium API:

```bash
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
    ],
    "stream": True
    }'
```
