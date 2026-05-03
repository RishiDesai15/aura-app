import { useState, useEffect, useMemo } from "react";

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

export default function Aura() {
  const [phase, setPhase] = useState("idle");
  const [input, setInput] = useState("");
  const [aura, setAura] = useState(null);
  const [colors, setColors] = useState(["#1a1040", "#2d1b69", "#4c1d95"]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      @keyframes breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
      @keyframes pulse   { 0%,100%{transform:scale(0.96);opacity:0.7} 50%{transform:scale(1.06);opacity:1} }
      @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      @keyframes tw      { 0%,100%{opacity:0.15} 50%{opacity:0.9} }
      @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      .aura-root { background:#060911 !important; }
      .aura-input::placeholder { color:rgba(255,255,255,0.22); }
      .aura-input:focus { outline:none; border-color:rgba(255,255,255,0.22) !important; background:rgba(255,255,255,0.06) !important; }
      .aura-btn { transition: opacity .25s, transform .2s; }
      .aura-btn:hover:not(:disabled) { opacity:.8; transform:translateY(-2px); }
      .aura-btn:active:not(:disabled) { transform:translateY(0); }
      .aura-card { transition: transform .25s, border-color .25s; }
      .aura-card:hover { transform:translateY(-3px); border-color:rgba(255,255,255,0.18) !important; }
      .reset-btn:hover { color:rgba(255,255,255,0.65) !important; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);

  const readAura = async () => {
    if (!input.trim() || phase === "loading") return;
    setPhase("loading"); setErr(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          system: `You are a poetic aura reader. Respond ONLY with valid JSON, no markdown fences, no extra text:
{"auraName":"2-4 evocative words (e.g. The Quiet Storm)","auraType":"one of: Seeker Dreamer Warrior Sage Healer Creator Guardian Wanderer","element":"one of: Fire Water Earth Air Aether Storm Void Light","description":"Two rich poetic sentences addressing person with 'you'","colors":["#hex1","#hex2","#hex3"],"wordForToday":"one word","activity":"specific activity in 8-12 words","soundscape":"6-8 words describing the music/sound"}
Make colors vivid, emotionally expressive, and harmonious with each other.`,
          messages: [{ role: "user", content: input }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setAura(parsed);
      if (parsed.colors?.length === 3) setColors(parsed.colors);
      setPhase("result");
    } catch(e) {
      setErr("Couldn't read your aura. Try again.");
      setPhase("idle");
    }
  };

  const reset = () => { setPhase("idle"); setInput(""); setAura(null); setColors(["#1a1040","#2d1b69","#4c1d95"]); };

  const orbGlow = `0 0 60px ${colors[0]}70, 0 0 120px ${colors[1]}45, 0 0 220px ${colors[2]}25`;
  const serif = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
  const sans  = "'DM Sans', system-ui, sans-serif";

  return (
    <div className="aura-root" style={{
      minHeight:"100vh", background:"#060911", fontFamily:sans,
      color:"#ede9f8", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"48px 24px", position:"relative", overflow:"hidden",
    }}>
      <StarField />

      {/* Orb */}
      <div style={{ marginBottom:48, position:"relative", zIndex:1 }}>
        <div style={{
          width:260, height:260, borderRadius:"50%",
          background:`radial-gradient(circle at 38% 36%, ${colors[0]}, ${colors[1]} 55%, ${colors[2]})`,
          boxShadow: orbGlow,
          animation: phase === "loading" ? "pulse 1.3s ease-in-out infinite" : "breathe 5s ease-in-out infinite",
          transition:"background 1.8s ease, box-shadow 1.8s ease",
        }} />
        {phase === "loading" && (
          <div style={{
            position:"absolute", inset:0, borderRadius:"50%",
            border:"1.5px solid rgba(255,255,255,0.12)",
            borderTop:"1.5px solid rgba(255,255,255,0.45)",
            animation:"spin 1.6s linear infinite",
          }} />
        )}
      </div>

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:36, zIndex:1, animation:"fadeUp 0.8s ease both" }}>
        <h1 style={{ fontFamily:serif, fontSize:68, fontWeight:300, letterSpacing:"0.35em", margin:0, lineHeight:1, color:"#f0ecff" }}>
          AURA
        </h1>
        <p style={{ fontSize:11, fontWeight:400, letterSpacing:"0.28em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", margin:"8px 0 0" }}>
          Your energy, made visible
        </p>
      </div>

      {/* Input phase */}
      {phase !== "result" && (
        <div style={{ width:"100%", maxWidth:500, zIndex:1, animation:"fadeUp 0.8s ease 0.15s both" }}>
          <textarea
            className="aura-input"
            style={{
              width:"100%", background:"rgba(255,255,255,0.04)",
              border:"1px solid rgba(255,255,255,0.1)", borderRadius:14,
              padding:"16px 20px", fontSize:16, fontFamily:sans, fontWeight:300,
              color:"#ede9f8", resize:"none", lineHeight:1.65, display:"block",
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
                border:"1px solid rgba(255,255,255,0.15)",
                background:"rgba(255,255,255,0.07)", color:"#ede9f8",
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
          <h2 style={{ fontFamily:serif, fontSize:50, fontWeight:400, textAlign:"center", margin:"0 0 6px", color:"#f5f0ff", letterSpacing:"0.02em" }}>
            {aura.auraName}
          </h2>
          <p style={{ textAlign:"center", fontSize:11, letterSpacing:"0.28em", textTransform:"uppercase", color:"rgba(255,255,255,0.32)", margin:"0 0 20px" }}>
            {aura.auraType} · {aura.element}
          </p>

          {/* Color swatches */}
          <div style={{ display:"flex", justifyContent:"center", gap:14, marginBottom:28 }}>
            {colors.map((c,i) => <ColorSwatch key={i} color={c} />)}
          </div>

          <p style={{
            fontFamily:serif, fontSize:20, fontWeight:300, fontStyle:"italic",
            lineHeight:1.75, textAlign:"center", color:"rgba(255,255,255,0.72)",
            marginBottom:36, padding:"0 8px",
          }}>
            {aura.description}
          </p>

          {/* Divider */}
          <div style={{ width:48, height:1, background:"rgba(255,255,255,0.1)", margin:"0 auto 32px" }} />

          {/* Cards */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:32 }}>
            {[
              { label:"Word for today", value:aura.wordForToday, big:true },
              { label:"Try this",       value:aura.activity },
              { label:"Soundscape",     value:aura.soundscape },
            ].map(({label, value, big}) => (
              <div key={label} className="aura-card" style={{
                background:"rgba(255,255,255,0.04)",
                border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:14, padding:"18px 14px", textAlign:"center",
              }}>
                <span style={{ display:"block", fontSize:10, letterSpacing:"0.22em", textTransform:"uppercase", color:"rgba(255,255,255,0.28)", marginBottom:10 }}>
                  {label}
                </span>
                <span style={{
                  fontSize: big ? 26 : 14, fontWeight: big ? 400 : 300,
                  fontFamily: big ? serif : sans,
                  color:"rgba(255,255,255,0.85)", lineHeight:1.45,
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
              border:"1px solid rgba(255,255,255,0.08)", background:"transparent",
              color:"rgba(255,255,255,0.35)", fontFamily:sans,
              fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase",
              cursor:"pointer", transition:"color .2s",
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
