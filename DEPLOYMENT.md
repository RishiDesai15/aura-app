# Aura App - Deployment Guide

## Frontend (GitHub Pages)
Already deployed to: https://RishiDesai15.github.io/aura-app/

To redeploy after changes:
```bash
npm run build
npm run deploy
```

## Backend (Vercel)

### Prerequisites
- Vercel account (free tier available)
- GitHub repository connected to Vercel
- Anthropic API key

### Deployment Steps

1. Push code to GitHub with `vercel.json` and `server/index.js`

2. Go to [vercel.com](https://vercel.com) and import the repository

3. Set environment variable:
   - In Vercel dashboard: Settings → Environment Variables
   - Add `ANTHROPIC_API_KEY` with your Anthropic API key

4. Deploy (automatic on push to main, or manual from Vercel dashboard)

5. Get your backend URL (e.g., `https://your-username-aura-app.vercel.app`)

6. Update frontend to use the backend:
   ```bash
   VITE_API_URL=https://your-username-aura-app.vercel.app/api/claude npm run build
   npm run deploy
   ```

   Or set in `.env.production`:
   ```
   VITE_API_URL=https://your-username-aura-app.vercel.app/api/claude
   ```

## Features
- ✅ Aura readings (with Claude AI or fallback)
- ✅ History persistence (localStorage)
- ✅ User accounts (local sign-in/out)
- ✅ Multiple themes (dark, light, colorblind)
- ✅ Responsive design
- 🔄 Coming: OAuth integration, database persistence

## Local Development
```bash
# Terminal 1: Backend proxy
npm run server

# Terminal 2: Frontend dev server
npm run dev
```
Both must run for local Claude API access. Frontend falls back to local aura generator if backend unavailable.
