import { useState, useEffect, useMemo, useRef } from "react";

const DEFAULT_COLORS = ["#1a1040", "#2d1b69", "#4c1d95"];

// localStorage utilities
const STORAGE_KEYS = {
  readings: "aura_readings",
  user: "aura_user",
  theme: "aura_theme"
};

const saveReadings = (readings) => {
  try { localStorage.setItem(STORAGE_KEYS.readings, JSON.stringify(readings)); } catch (e) { console.error("Failed to save readings", e); }
};

const loadReadings = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.readings) || "[]"); } catch (e) { return []; }
};

const saveUser = (user) => {
  try { localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user)); } catch (e) { console.error("Failed to save user", e); }
};

const loadUser = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || "null"); } catch (e) { return null; }
};

const THEMES = {
  dark: {
    bg: "#060911",
    text: "#ede9f8",
    border: "rgba(255,255,255,0.1)",
    borderHover: "rgba(255,255,255,0.18)",
    placeholder: "rgba(255,255,255,0.22)",
    label: "rgba(255,255,255,0.28)",
    muted: "rgba(255,255,255,0.35)",
    card: "rgba(255,255,255,0.04)",
  },
  light: {
    bg: "#f5f3ff",
    text: "#1a1a2e",
    border: "rgba(0,0,0,0.1)",
    borderHover: "rgba(0,0,0,0.18)",
    placeholder: "rgba(0,0,0,0.22)",
    label: "rgba(0,0,0,0.28)",
    muted: "rgba(0,0,0,0.35)",
    card: "rgba(0,0,0,0.04)",
  },
  colorblind: {
    bg: "#0f0d1a",
    text: "#e8e4f3",
    border: "rgba(200,180,255,0.2)",
    borderHover: "rgba(200,180,255,0.3)",
    placeholder: "rgba(200,180,255,0.25)",
    label: "rgba(200,180,255,0.3)",
    muted: "rgba(200,180,255,0.4)",
    card: "rgba(200,180,255,0.08)",
  },
};

const MOOD_RULES = [
  { terms: ["sad", "down", "blue", "grief", "heavy", "heartbroken"], auraType: "Healer", element: "Water", auraName: "The Quiet Tide", wordForToday: "Breathe", activity: "Take a slow walk near water and notice the sky", soundscape: "Soft rain over distant piano and deep hums" },
  { terms: ["anxious", "worried", "nervous", "overwhelmed", "stressed"], auraType: "Seeker", element: "Air", auraName: "The Restless Current", wordForToday: "Soften", activity: "Clear one small surface and let your shoulders drop", soundscape: "Breathlike synths with drifting wind and chimes" },
  { terms: ["angry", "mad", "frustrated", "rage", "irritated"], auraType: "Warrior", element: "Fire", auraName: "Ember Rising", wordForToday: "Channel", activity: "Move your body hard for ten focused minutes", soundscape: "Low drums, crackling ember noise, and pulsing bass" },
  { terms: ["hopeful", "excited", "bright", "energized", "alive"], auraType: "Creator", element: "Light", auraName: "Radiant Bloom", wordForToday: "Expand", activity: "Write one thing you want more of this week", soundscape: "Warm pads, shimmering bells, and rising harmonics" },
  { terms: ["tired", "exhausted", "drained", "burnt out", "burned out"], auraType: "Guardian", element: "Earth", auraName: "The Quiet Hearth", wordForToday: "Restore", activity: "Cancel one nonessential thing and rest without guilt", soundscape: "Soft drone, night insects, and slow wooden textures" },
  { terms: ["calm", "peaceful", "steady", "grounded", "clear"], auraType: "Sage", element: "Earth", auraName: "Still Horizon", wordForToday: "Trust", activity: "Sit in silence for five minutes and breathe slowly", soundscape: "Gentle ambient tones with sparse bells and space" },
];

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function hslToHex(hue, saturation, lightness) {
  const normalize = number => number / 100;
  const normalizedHue = ((hue % 360) + 360) % 360 / 360;
  const s = normalize(saturation);
  const l = normalize(lightness);

  const hueToRgb = (p, q, t) => {
    let channel = t;
    if (channel < 0) channel += 1;
    if (channel > 1) channel -= 1;
    if (channel < 1 / 6) return p + (q - p) * 6 * channel;
    if (channel < 1 / 2) return q;
    if (channel < 2 / 3) return p + (q - p) * (2 / 3 - channel) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hueToRgb(p, q, normalizedHue + 1 / 3) * 255);
  const g = Math.round(hueToRgb(p, q, normalizedHue) * 255);
  const b = Math.round(hueToRgb(p, q, normalizedHue - 1 / 3) * 255);
  return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, "0")).join("")}`;
}

function buildFallbackAura(input) {
  const normalized = input.toLowerCase();
  const matchedRule = MOOD_RULES.find(rule => rule.terms.some(term => normalized.includes(term))) || null;
  const hash = hashString(normalized || "aura");
  const palette = matchedRule
    ? null
    : [0, 1, 2].map(offset => hslToHex((hash + offset * 37) % 360, 58 + ((hash >> (offset + 2)) % 18), 42 + ((hash >> (offset + 5)) % 14)));

  const auraName = matchedRule?.auraName || ["The", "Silent", "Ember", "Moonlit", "Wild", "Velvet", "Starlit", "Drift", "Pulse", "Wanderer"][hash % 10] + " " + ["Bloom", "Current", "Signal", "Halo", "Storm", "Thread", "Echo", "Fever", "Field", "Light"][Math.floor(hash / 10) % 10];
  const auraType = matchedRule?.auraType || ["Seeker", "Dreamer", "Warrior", "Sage", "Healer", "Creator", "Guardian", "Wanderer"][hash % 8];
  const element = matchedRule?.element || ["Fire", "Water", "Earth", "Air", "Aether", "Storm", "Void", "Light"][Math.floor(hash / 8) % 8];
  const wordForToday = matchedRule?.wordForToday || ["Move", "Listen", "Trust", "Begin", "Rest", "Expand", "Anchor", "Release"][Math.floor(hash / 13) % 8];
  const activity = matchedRule?.activity || `Spend ten minutes doing ${["a tidy reset", "slow breathing", "a short walk", "stretching", "free writing", "one small cleanup"][Math.floor(hash / 17) % 6]}.`;
  const soundscape = matchedRule?.soundscape || [
    "Soft ambient drones with distant chimes",
    "Warm synths and rainfall texture",
    "Low pulses with airy bells",
    "Quiet strings and night wind",
  ][Math.floor(hash / 19) % 4];

  const colors = matchedRule?.terms ? [0, 1, 2].map(offset => hslToHex((hash + offset * 24) % 360, 56 + ((hash >> (offset + 1)) % 18), 40 + ((hash >> (offset + 4)) % 12))) : palette;

  const description = matchedRule
    ? `You are carrying ${normalized.includes("sad") ? "a quiet ache" : "a weather system"} that asks for gentleness, not judgment. Your aura leans toward ${element.toLowerCase()}, where feeling becomes a guide instead of a weight.`
    : `You are holding a shifting current of feeling, and it wants to be seen without being fixed. Your aura moves through ${element.toLowerCase()} like a signal finding its way home.`;

  return { auraName, auraType, element, description, colors, wordForToday, activity, soundscape };
}

function StarField() {
  const stars = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 1.8 + 0.4,
    delay: Math.random() * 5, dur: Math.random() * 3 + 2.5,
  })), []);
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position:"absolute", left:`${s.x}%`, top:`${s.y}%`,
          width:s.size, height:s.size, borderRadius:"50%",
          background:"rgba(255,255,255,0.7)",
          animation:`tw ${s.dur}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

function ColorSwatch({ color }) {
  return (
    <div style={{
      width:32, height:32, borderRadius:"50%", background:color,
      boxShadow:`0 0 12px ${color}80`, border:"1px solid rgba(255,255,255,0.15)",
    }} />
  );
}

function ParticleField({ count = 12, colors }) {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2,
      distance: 180 + Math.random() * 60,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 2 + 3,
      delay: Math.random() * 0.5,
      color: colors[i % colors.length],
    })),
    [count, colors]
  );

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            opacity: 0.6,
            filter: `blur(0.5px) drop-shadow(0 0 ${p.size}px ${p.color})`,
            animation: `orbitParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
            "--orbit-angle": `${p.angle}rad`,
            "--orbit-distance": `${p.distance}px`,
          }}
        />
      ))}
    </div>
  );
}

function OrbWithReactivity({ colors, phase, mousePos }) {
  const orbRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!orbRef.current || phase !== "result") return;
    
    const orbRect = orbRef.current.getBoundingClientRect();
    const orbCenterX = orbRect.left + orbRect.width / 2;
    const orbCenterY = orbRect.top + orbRect.height / 2;
    
    const deltaX = mousePos.x - orbCenterX;
    const deltaY = mousePos.y - orbCenterY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < 300) {
      const angle = Math.atan2(deltaY, deltaX);
      setTilt({
        x: Math.sin(angle) * (1 - distance / 300) * 8,
        y: -Math.cos(angle) * (1 - distance / 300) * 8,
      });
    } else {
      setTilt({ x: 0, y: 0 });
    }
  }, [mousePos, phase]);

  const orbGlow = `0 0 60px ${colors[0]}70, 0 0 120px ${colors[1]}45, 0 0 220px ${colors[2]}25`;

  return (
    <div
      ref={orbRef}
      style={{
        marginBottom: 48,
        position: "relative",
        zIndex: 1,
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: "transform 0.2s ease-out",
      }}
    >
      <div style={{ position: "relative", width: 260, height: 260 }}>
        <ParticleField count={12} colors={colors} />
        <div
          style={{
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: `radial-gradient(circle at 38% 36%, ${colors[0]}, ${colors[1]} 55%, ${colors[2]})`,
            boxShadow: orbGlow,
            animation:
              phase === "loading"
                ? "pulse 1.3s ease-in-out infinite"
                : "breathe 5s ease-in-out infinite",
            transition: "background 1.8s ease, box-shadow 1.8s ease",
            position: "relative",
            zIndex: 2,
          }}
        />
        {phase === "loading" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.12)",
              borderTop: "1.5px solid rgba(255,255,255,0.45)",
              animation: "spin 1.6s linear infinite",
              zIndex: 3,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function Aura() {
  const [phase, setPhase] = useState("idle");
  const [input, setInput] = useState("");
  const [aura, setAura] = useState(null);
  const [colors, setColors] = useState(["#1a1040", "#2d1b69", "#4c1d95"]);
  const [err, setErr] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [readings, setReadings] = useState([]);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");

  useEffect(() => {
    setReadings(loadReadings());
    setUser(loadUser());
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap";
    document.head.appendChild(link);

    const t = THEMES[theme];
    const style = document.createElement("style");
    style.textContent = `
      @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
      @keyframes pulse   { 0%,100%{transform:scale(0.96);opacity:0.7} 50%{transform:scale(1.06);opacity:1} }
      @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      @keyframes tw      { 0%,100%{opacity:0.15} 50%{opacity:0.9} }
      @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes orbitParticle {
        0% { transform: translate(calc(cos(var(--orbit-angle)) * var(--orbit-distance)), calc(sin(var(--orbit-angle)) * var(--orbit-distance))); opacity: 0; }
        50% { opacity: 0.6; }
        100% { transform: translate(calc(cos(var(--orbit-angle) + 6.28) * var(--orbit-distance)), calc(sin(var(--orbit-angle) + 6.28) * var(--orbit-distance))); opacity: 0; }
      }
      .aura-root { background: ${t.bg} !important; }
      .aura-input::placeholder { color: ${t.placeholder}; }
      .aura-input:focus { outline:none; border-color: ${t.borderHover} !important; background: ${t.card} !important; }
      .aura-btn { transition: opacity .25s, transform .2s; }
      .aura-btn:hover:not(:disabled) { opacity:.8; transform:translateY(-2px); }
      .aura-btn:active:not(:disabled) { transform:translateY(0); }
      .aura-card { transition: transform .25s, border-color .25s; }
      .aura-card:hover { transform:translateY(-3px); border-color: ${t.borderHover} !important; }
      .reset-btn:hover { color: ${t.muted} !important; }
      .theme-btn { transition: opacity .2s, transform .15s; }
      .theme-btn:hover { opacity: 0.8; transform: scale(1.05); }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, [theme]);

  const readAura = async () => {
    if (!input.trim() || phase === "loading") return;
    setPhase("loading"); setErr(null);
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) throw new Error(`Server proxy failed: ${res.status}`);
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      const safeAura = {
        ...buildFallbackAura(input),
        ...parsed,
      };
      setAura(safeAura);
      if (safeAura.colors?.length === 3) setColors(safeAura.colors);
      const newReading = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        input,
        aura: safeAura,
        colors: safeAura.colors || DEFAULT_COLORS,
        userId: user?.id || null,
      };
      const updatedReadings = [newReading, ...readings];
      setReadings(updatedReadings);
      saveReadings(updatedReadings);
      setPhase("result");
    } catch (e) {
      const fallbackAura = buildFallbackAura(input);
      setAura(fallbackAura);
      setColors(fallbackAura.colors || DEFAULT_COLORS);
      const newReading = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        input,
        aura: fallbackAura,
        colors: fallbackAura.colors || DEFAULT_COLORS,
        userId: user?.id || null,
      };
      const updatedReadings = [newReading, ...readings];
      setReadings(updatedReadings);
      saveReadings(updatedReadings);
      setPhase("result");
    }
  };

  const reset = () => { setPhase("idle"); setInput(""); setAura(null); setColors(DEFAULT_COLORS); setErr(null); setView("home"); };

  const deleteReading = (id) => {
    const updated = readings.filter(r => r.id !== id);
    setReadings(updated);
    saveReadings(updated);
  };

  const clearAllReadings = () => {
    setReadings([]);
    saveReadings([]);
  };

  const loginUser = (username) => {
    const newUser = { id: Date.now(), name: username, loginDate: new Date().toISOString() };
    setUser(newUser);
    saveUser(newUser);
  };

  const logoutUser = () => {
    setUser(null);
    saveUser(null);
  }

  const t = THEMES[theme];
  const orbGlow = `0 0 60px ${colors[0]}70, 0 0 120px ${colors[1]}45, 0 0 220px ${colors[2]}25`;
  const serif = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
  const sans  = "'DM Sans', system-ui, sans-serif";

  return (
    <div className="aura-root" style={{
      minHeight:"100vh", background: t.bg, fontFamily:sans,
      color: t.text, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"48px 24px", position:"relative", overflow:"hidden",
    }}>
      <StarField />

      {/* Theme Switcher */}
      <div style={{ position: "absolute", top: 24, right: 24, display: "flex", gap: 8, zIndex: 10 }}>
        {["dark", "light", "colorblind"].map(themeName => (
          <button
            key={themeName}
            className="theme-btn"
            onClick={() => setTheme(themeName)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${theme === themeName ? t.borderHover : t.border}`,
              background: theme === themeName ? t.card : "transparent",
              color: t.text,
              fontFamily: sans,
              fontSize: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              opacity: theme === themeName ? 1 : 0.5,
            }}
          >
            {themeName}
          </button>
        ))}
      </div>

      {/* Orb */}
      <OrbWithReactivity colors={colors} phase={phase} mousePos={mousePos} />

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:36, zIndex:1, animation:"fadeUp 0.8s ease both" }}>
        <h1 style={{ fontFamily:serif, fontSize:68, fontWeight:300, letterSpacing:"0.35em", margin:0, lineHeight:1, color: t.text }}>
          AURA
        </h1>
        <p style={{ fontSize:11, fontWeight:400, letterSpacing:"0.28em", color: t.label, textTransform:"uppercase", margin:"8px 0 0" }}>
          Your energy, made visible
        </p>
      </div>

      {/* Input phase */}
      {phase !== "result" && (
        <div style={{ width:"100%", maxWidth:500, zIndex:1, animation:"fadeUp 0.8s ease 0.15s both" }}>
          <textarea
            className="aura-input"
            style={{
              width:"100%", background: t.card,
              border: `1px solid ${t.border}`, borderRadius:14,
              padding:"16px 20px", fontSize:16, fontFamily:sans, fontWeight:300,
              color: t.text, resize:"none", lineHeight:1.65, display:"block",
              marginBottom:16, boxSizing:"border-box", transition:"border-color .2s, background .2s",
            }}
            rows={3}
            placeholder="How are you feeling right now? Describe your state of mind..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) readAura(); }}
            disabled={phase === "loading"}
          />
          {err && <p style={{ textAlign:"center", color:"rgba(255,160,140,0.8)", fontSize:13, marginBottom:12 }}>{err}</p>}
          <div style={{ display:"flex", justifyContent:"center" }}>
            <button
              className="aura-btn"
              style={{
                padding:"13px 36px", borderRadius:100,
                border: `1px solid ${t.border}`,
                background: t.card, color: t.text,
                fontFamily:sans, fontSize:12, fontWeight:400,
                letterSpacing:"0.18em", textTransform:"uppercase", cursor:phase==="loading"?"default":"pointer",
                opacity: phase === "loading" ? 0.55 : 1,
              }}
              onClick={readAura}
              disabled={phase === "loading"}
            >
              {phase === "loading" ? "Reading your energy..." : "Read My Aura"}
            </button>
          </div>
        </div>
      )}

      {/* Result phase */}
      {phase === "result" && aura && (
        <div style={{ width:"100%", maxWidth:560, zIndex:1, animation:"fadeUp 0.65s ease both" }}>
          <h2 style={{ fontFamily:serif, fontSize:50, fontWeight:400, textAlign:"center", margin:"0 0 6px", color: t.text, letterSpacing:"0.02em", animation: "fadeUp 0.65s ease 0.1s both" }}>
            {aura.auraName}
          </h2>
          <p style={{ textAlign:"center", fontSize:11, letterSpacing:"0.28em", textTransform:"uppercase", color: t.label, margin:"0 0 20px", animation: "fadeUp 0.65s ease 0.15s both" }}>
            {aura.auraType} · {aura.element}
          </p>

          {/* Color swatches */}
          <div style={{ display:"flex", justifyContent:"center", gap:14, marginBottom:28, animation: "fadeUp 0.65s ease 0.2s both" }}>
            {colors.map((c,i) => <ColorSwatch key={i} color={c} />)}
          </div>

          <p style={{
            fontFamily:serif, fontSize:20, fontWeight:300, fontStyle:"italic",
            lineHeight:1.75, textAlign:"center", color: t.text,
            marginBottom:36, padding:"0 8px", animation: "fadeUp 0.65s ease 0.25s both",
          }}>
            {aura.description}
          </p>

          {/* Divider */}
          <div style={{ width:48, height:1, background: t.border, margin:"0 auto 32px", animation: "fadeUp 0.65s ease 0.3s both" }} />

          {/* Cards with staggered animations */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:32 }}>
            {[
              { label:"Word for today", value:aura.wordForToday, big:true, delay: 0.35 },
              { label:"Try this",       value:aura.activity, delay: 0.4 },
              { label:"Soundscape",     value:aura.soundscape, delay: 0.45 },
            ].map(({label, value, big, delay}) => (
              <div key={label} className="aura-card" style={{
                background: t.card,
                border: `1px solid ${t.border}`,
                borderRadius:14, padding:"18px 14px", textAlign:"center",
                animation: `fadeUp 0.65s ease ${delay}s both`,
              }}>
                <span style={{ display:"block", fontSize:10, letterSpacing:"0.22em", textTransform:"uppercase", color: t.label, marginBottom:10 }}>
                  {label}
                </span>
                <span style={{
                  fontSize: big ? 26 : 14, fontWeight: big ? 400 : 300,
                  fontFamily: big ? serif : sans,
                  color: t.text, lineHeight:1.45,
                  letterSpacing: big ? "0.06em" : "0",
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          <button
            className="reset-btn"
            style={{
              display:"block", margin:"0 auto",
              padding:"10px 28px", borderRadius:100,
              border: `1px solid ${t.border}`, background:"transparent",
              color: t.muted, fontFamily:sans,
              fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase",
              cursor:"pointer", transition:"color .2s", animation: "fadeUp 0.65s ease 0.5s both",
            }}
            onClick={reset}
          >
            Read again
          </button>
        </div>
      )}
    </div>
  );
}
