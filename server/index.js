import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.ANTHROPIC_API_KEY;

app.post('/api/claude', async (req, res) => {
  const input = (req.body && req.body.input) || '';
  if (!API_KEY) {
    return res.status(500).json({ error: 'Anthropic API key not configured on server.' });
  }
  try {
    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: `You are a poetic aura reader. Respond ONLY with valid JSON, no markdown fences, no extra text:\n{"auraName":"2-4 evocative words (e.g. The Quiet Storm)","auraType":"one of: Seeker Dreamer Warrior Sage Healer Creator Guardian Wanderer","element":"one of: Fire Water Earth Air Aether Storm Void Light","description":"Two rich poetic sentences addressing person with 'you'","colors":["#hex1","#hex2","#hex3"],"wordForToday":"one word","activity":"specific activity in 8-12 words","soundscape":"6-8 words describing the music/sound"}\nMake colors vivid, emotionally expressive, and harmonious with each other.`,
      messages: [{ role: 'user', content: input }],
    };

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(502).json({ error: 'Anthropic API error', status: resp.status, data });
    }
    return res.json(data);
  } catch (err) {
    console.error('Claude proxy error:', err);
    return res.status(500).json({ error: err.message || 'unknown' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Claude proxy listening on http://localhost:${port}`));
