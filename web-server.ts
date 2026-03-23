#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3458;

app.use(cors());
app.use(express.json());

interface MagisteriumRequest {
  query: string;
  model?: string;
  return_related_questions?: boolean;
}

app.post('/api/query', async (req: express.Request, res: express.Response) => {
  const { query, model = 'magisterium-1', return_related_questions = true } = req.body as MagisteriumRequest;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'query parameter is required' });
    return;
  }

  const apiKey = process.env.MAGISTERIUM_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfigured: missing API key' });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch('https://www.magisterium.com/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: query }],
        return_related_questions,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: `Magisterium API error: ${errorText}` });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(504).json({ error: 'Request to Magisterium API timed out' });
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(PORT, () => {
  console.log(`Magisterium web API listening on port ${PORT}`);
});
