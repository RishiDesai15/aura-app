# Aura - Your Energy, Made Visible

A poetic AI-powered aura reader that interprets your emotional state and generates personalized readings with custom color palettes, recommendations, and soundscapes.

**Live:** https://RishiDesai15.github.io/aura-app/  
**Repo:** https://github.com/RishiDesai15/aura-app

## 🎯 Features

### ✅ Completed
- **AI-Powered Readings** - Generates poetic aura interpretations using Claude AI (with intelligent fallback)
- **History & Persistence** - Save unlimited readings with localStorage persistence
- **User Accounts** - Simple username-based sign-in/out system
- **Multiple Themes** - Dark, Light, and Colorblind-friendly themes
- **Responsive Design** - Beautiful UI with animated orbs, particle effects, and starfield
- **Past Readings Replay** - Click any past reading to view it again
- **OAuth Ready** - GitHub and Google sign-in buttons (frontend complete)

### 🔄 In Development
- OAuth token exchange (backend handlers)
- Database persistence (currently localStorage only)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Local Development

1. **Clone and install**
```bash
git clone https://github.com/RishiDesai15/aura-app.git
cd aura-app
npm install
```

2. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Start backend server** (Terminal 1)
```bash
npm run server
# Runs on http://localhost:3001
```

4. **Start frontend** (Terminal 2)
```bash
npm run dev
# Runs on http://localhost:5173/aura-app/
```

### Build & Deploy

**GitHub Pages:**
```bash
npm run build
npm run deploy
```

**Backend (Vercel):** See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📦 Tech Stack

- **React 18** - UI framework
- **Vite 5** - Lightning-fast build tool
- **Express.js** - Backend API proxy
- **Anthropic Claude** - AI engine
- **localStorage** - Client-side persistence
- **GitHub Pages** - Frontend hosting
- **Vercel** - Backend hosting

## 📁 Project Structure

```
aura-app/
├── src/
│   ├── App.jsx          # Main component (state + UI)
│   ├── main.jsx         # React entry point
│   └── oauth.js         # OAuth configuration
├── server/
│   └── index.js         # Express proxy server
├── aura.jsx             # Legacy/sync'd copy of App.jsx
├── vite.config.js       # Build configuration
├── vercel.json          # Backend deployment config
├── DEPLOYMENT.md        # Detailed deployment guide
└── README.md            # This file
```

## 🎨 Key Components

- **OrbWithReactivity** - Animated center orb tracking mouse
- **ParticleField** - Orbital particle effects
- **StarField** - Twinkling background
- **History View** - Grid of past readings (click to replay)
- **Profile View** - User account + OAuth buttons
- **Theme Switcher** - Dark/Light/Colorblind themes

## 💾 Data Persistence

Readings stored in localStorage with structure:
```javascript
{
  id: timestamp,
  timestamp: ISO string,
  input: "user's mood description",
  aura: { auraName, auraType, element, description, colors, etc },
  userId: user.id || null
}
```

## 🔐 OAuth Setup (Optional)

### GitHub
1. https://github.com/settings/developers
2. Create OAuth App, set callback to your domain
3. Add Client ID to `.env`: `VITE_GITHUB_CLIENT_ID`

### Google
1. https://console.cloud.google.com
2. Create OAuth Client ID
3. Add Client ID to `.env`: `VITE_GOOGLE_CLIENT_ID`

*Note: OAuth token exchange requires backend implementation*

## 📊 API Documentation

### POST /api/claude
Proxies requests to Claude API

**Request:**
```json
{ "input": "feeling anxious and overwhelmed today" }
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"auraName\": \"The Restless Current\", \"auraType\": \"Seeker\", ...}"
    }
  ]
}
```

## 🧪 Testing Checklist

- [ ] Generate aura reading
- [ ] Reload - readings persist
- [ ] Click past reading - replays
- [ ] Sign in - Profile updates
- [ ] Switch themes
- [ ] Mobile responsive
- [ ] Offline mode (fallback works)

## 📈 Performance

- **Bundle Size:** 52-53 KB gzipped
- **Load Time:** <500ms
- **Core Web Vitals:** A+ grade target

## 🛣️ Roadmap

**Phase 1** (Current)
- [x] Core aura generation
- [x] History persistence  
- [x] User accounts
- [x] Themes
- [x] OAuth UI

**Phase 2** (Planned)
- [ ] OAuth token exchange
- [ ] PostgreSQL/SQLite database
- [ ] Email verification
- [ ] Cross-device sync

**Phase 3** (Future)
- [ ] PWA (offline mode)
- [ ] Analytics dashboard
- [ ] Biometric auth
- [ ] Mobile app (React Native)

## 🐛 Troubleshooting

**"Server responded with 500"**
- Missing `ANTHROPIC_API_KEY` - app falls back to local generator ✓

**Readings not persisting**
- Check browser privacy settings
- localStorage only works in same domain

**OAuth doesn't work**
- Missing Client IDs in `.env`
- Backend token handlers not implemented

## 📄 License

MIT License

## 👤 Author

**Rishi Desai**  
- GitHub: [@RishiDesai15](https://github.com/RishiDesai15)
- Email: rishi@example.com

---

**Built with ❤️ and 🎨**  
*Your aura matters. Let's see what it says about you.*
