# Database Migration Strategy

This guide outlines how to migrate from localStorage to a persistent database for Aura app.

## Current State (localStorage)

- ✅ All readings stored client-side
- ✅ User sessions in localStorage
- ❌ No cross-device sync
- ❌ No server-side backup
- ❌ Data lost on device reset

## Target State (Database)

- ✅ Readings synced across devices
- ✅ User data backed up on server
- ✅ Multi-user support
- ✅ Analytics and trends
- ✅ Private sharing capabilities

## Option 1: SQLite (Simplest - Local)

### Pros
- No external dependency
- Works with Node.js backend
- Lightweight data file
- Good for single-device sync

### Cons
- Limited concurrent users
- No built-in scaling
- Not ideal for mobile

### Implementation

**1. Setup:**
```bash
npm install better-sqlite3  # or sql.js for serverless
```

**2. Schema:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMP,
  oauth_provider TEXT,
  oauth_id TEXT
);

CREATE TABLE readings (
  id INTEGER PRIMARY KEY,
  user_id INTEGER FOREIGN KEY,
  input TEXT,
  aura_data JSON,
  colors JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_user_readings ON readings(user_id);
```

**3. Backend endpoints:**
```javascript
// GET /api/readings - fetch user's readings
app.get('/api/readings', authenticateToken, (req, res) => {
  const readings = db.prepare('SELECT * FROM readings WHERE user_id = ?')
    .all(req.user.id);
  res.json(readings);
});

// POST /api/readings - save new reading
app.post('/api/readings', authenticateToken, (req, res) => {
  const { input, aura, colors } = req.body;
  const result = db.prepare(`
    INSERT INTO readings (user_id, input, aura_data, colors, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, input, JSON.stringify(aura), JSON.stringify(colors), new Date());
  res.json({ id: result.lastID });
});
```

**4. Frontend migration:**
```javascript
// Replace localStorage.getItem() with API call
const loadReadings = async () => {
  try {
    const res = await fetch('/api/readings', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to load readings', err);
    return []; // Fallback to empty
  }
};

// Save reading to server
const saveReading = async (reading) => {
  const res = await fetch('/api/readings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(reading)
  });
  return await res.json();
};
```

## Option 2: PostgreSQL (Recommended - Production)

### Pros
- Scales to millions of users
- Cloud-ready (Heroku, Railway, etc.)
- Full ACID compliance
- Rich query language

### Cons
- Requires managed service
- More complex setup
- Costs money (but free tier available)

### Implementation

**1. Setup Vercel Postgres:**
```bash
npm install postgres  # or @vercel/postgres
```

**2. .env:**
```
POSTGRES_URL=postgres://user:password@host:5432/aura_db
```

**3. Migrations (using Drizzle ORM):**
```bash
npm install drizzle-orm
```

```javascript
// schema.ts
import { pgTable, serial, text, timestamp, json } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').unique(),
  created_at: timestamp('created_at').defaultNow(),
});

export const readings = pgTable('readings', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  input: text('input').notNull(),
  auraData: json('aura_data').notNull(),
  colors: json('colors').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

## Option 3: Firebase (Fastest Setup - Recommended for MVP)

### Pros
- No backend needed (fully serverless)
- Real-time sync
- Built-in authentication
- Free tier generous

### Cons
- Vendor lock-in
- Limited query flexibility
- Cost scales with usage

### Implementation

```bash
npm install firebase
```

```javascript
// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

```javascript
// readings.js
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';

export const saveReading = async (reading) => {
  await addDoc(collection(db, 'readings'), {
    userId: auth.currentUser.uid,
    ...reading,
    createdAt: new Date()
  });
};

export const loadReadings = async () => {
  const q = query(
    collection(db, 'readings'),
    where('userId', '==', auth.currentUser.uid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};
```

## Migration Path (Step-by-Step)

### Phase 1: Prepare Backend
- [ ] Add authentication (JWT or session-based)
- [ ] Create database schema
- [ ] Implement `/api/readings` endpoints
- [ ] Add rate limiting and validation

### Phase 2: Dual-Write (Hybrid)
- [ ] Update frontend to write to both localStorage AND server
- [ ] Implement sync/offline-first strategy
- [ ] Sync on app load, before closing

```javascript
// Dual write during migration
const saveReading = async (reading) => {
  // Always save locally
  const localReadings = loadReadings();
  localReadings.push(reading);
  localStorage.setItem('aura_readings', JSON.stringify(localReadings));
  
  // Try to sync to server
  try {
    await fetch('/api/readings', {
      method: 'POST',
      body: JSON.stringify(reading)
    });
  } catch (err) {
    console.warn('Server sync failed, using local storage');
  }
};
```

### Phase 3: Server-First
- [ ] Flip default to load from server
- [ ] Cache in localStorage for offline
- [ ] Deprecate direct localStorage usage

### Phase 4: Cleanup
- [ ] Remove localStorage code
- [ ] Add data export feature
- [ ] Migrate old users automatically

## Testing Checklist

- [ ] Create new reading - saves to DB
- [ ] Load readings on fresh browser - fetches from DB
- [ ] Offline mode - reads from cache, syncs later
- [ ] Deleted reading - removed from DB
- [ ] User switches device - same readings loaded
- [ ] Concurrent edits - last-write-wins or conflict resolution
- [ ] Performance - <200ms load time
- [ ] Security - no SQL injection, CORS proper, rate limited

## Security Considerations

1. **Authentication**
   - Use JWT tokens with short expiry
   - Refresh tokens in httpOnly cookies
   - Validate all requests server-side

2. **Data Privacy**
   - Hash passwords with bcrypt
   - Encrypt sensitive fields (optional)
   - Implement row-level security

3. **Rate Limiting**
   - 100 requests/hour per user
   - Burst limits for API spikes
   - Block obvious bot patterns

4. **Input Validation**
   - Sanitize all text inputs
   - Validate JSON structures
   - Reject oversized payloads

## Cost Estimates (Monthly)

| Option | Free Tier | Paid Tier |
|--------|-----------|-----------|
| SQLite | $0 (self-hosted) | N/A |
| PostgreSQL (Vercel) | $0 (limited) | $5-100+ |
| Firebase | $0-25 | $25-1000+ |
| Heroku Postgres | Deprecated | $9-50+ |

## Recommended Path

1. **For MVP/Hobby**: Firebase (fastest, no backend needed)
2. **For Production**: Vercel Postgres + Node backend
3. **For Scale**: PostgreSQL on managed service (Railway, Render, etc.)
4. **For Self-Hosted**: SQLite on personal server

## Next Steps

1. Choose your database based on use case
2. Implement Phase 1 (backend prep)
3. Set up authentication system
4. Begin Phase 2 (dual-write)
5. Monitor sync, then flip to Phase 3
6. Remove localStorage when ready

## References

- [Drizzle ORM](https://orm.drizzle.team/)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [PostgreSQL Guide](https://www.postgresql.org/docs/)
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3)

---

*Database migration is a journey, not a sprint. Start with localStorage MVP, scale gradually.*
