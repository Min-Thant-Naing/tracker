import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// --- PASTE YOUR ACTUAL KEYS HERE ---
const SUPABASE_URL = "https://lrpcrhhlfjkepnsfdamy.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_kz6i62zm_68PD714_sMlsg_5n2QFZgs";
// ------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CELL = 22;
const GAP = 3;
const STEP = CELL + GAP;

function toKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildYearGrid(year) {
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  const startDow = (jan1.getDay() + 6) % 7;
  const start = new Date(jan1);
  start.setDate(jan1.getDate() - startDow);
  const endDow = (dec31.getDay() + 6) % 7;
  const end = new Date(dec31);
  end.setDate(dec31.getDate() + (6 - endDow));
  const weeks = [];
  const cur = new Date(start);
  while (cur <= end) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function getMonthLabels(grid, year) {
  const labels = [];
  let last = null;
  grid.forEach((week, wi) => {
    const day = week.find(d => d.getFullYear() === year);
    if (!day) return;
    const m = day.getMonth();
    if (m !== last) {
      labels.push({ wi, label: day.toLocaleString("default", { month: "short" }) });
      last = m;
    }
  });
  return labels;
}

function getStreak(completions) {
  if (!completions) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let s = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (completions[toKey(d)]) s++;
    else break;
  }
  return s;
}

function Heatmap({ habitId, completions, onToggle, dark, year }) {
  const [tip, setTip] = useState(null);
  const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toKey(today);

  const sub = dark ? "#8b949e" : "#9ca3af";

  return (
    <div style={{ position: "relative" }}>
      {tip && (
        <div style={{
          position: "fixed", left: tip.x, top: tip.y - 38,
          transform: "translateX(-50%)",
          background: dark ? "#f0f6fc" : "#24292f",
          color: dark ? "#111" : "#fff",
          fontSize: 11, fontWeight: 500,
          padding: "4px 9px", borderRadius: 6,
          pointerEvents: "none", whiteSpace: "nowrap",
          zIndex: 9999, boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}>{tip.text}</div>
      )}
      
      {/* Container for the monthly grids */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", 
        gap: "20px",
        marginTop: "10px" 
      }}>
        {months.map(m => {
          const monthLabel = new Date(year, m).toLocaleString("default", { month: "short" });
          const grid = buildMonthGrid(year, m);
          
          return (
            <div key={m} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: 11, color: sub, fontWeight: 600, textAlign: "center" }}>{monthLabel}</div>
              <div style={{ display: "flex", gap: GAP }}>
                {/* Day Labels (M, W, F, S) inside the month if you want, but keeps it clean */}
                <div style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div key={i} style={{ height: 14, fontSize: 8, color: sub, display: "flex", alignItems: "center" }}>{d}</div>
                  ))}
                </div>
                
                <div style={{ display: "flex", gap: GAP }}>
                  {grid.map((week, wi) => (
                    <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                      {week.map((date, di) => {
                        if (!date) return <div key={di} style={{ width: 14, height: 14 }} />;
                        
                        const key = toKey(date);
                        const isToday = key === todayKey;
                        const isFuture = date > today;
                        const done = !!(completions && completions[key]);
                        const bg = done ? (dark ? "#39d353" : "#2da44e") : (dark ? "#21262d" : "#ebedf0");
                        
                        return (
                          <div
                            key={key}
                            onClick={() => { if (!isFuture) onToggle(habitId, key); }}
                            onMouseEnter={e => setTip({ x: e.clientX, y: e.clientY, text: (isToday ? "Today · " : "") + date.toLocaleDateString() })}
                            onMouseLeave={() => setTip(null)}
                            style={{
                              width: 14, height: 14, borderRadius: 3,
                              background: bg,
                              outline: isToday ? `1.5px solid ${dark ? "#58a6ff" : "#0969da"}` : "none",
                              outlineOffset: -1,
                              cursor: !isFuture ? "pointer" : "default",
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Add this helper function below your other helper functions
function buildMonthGrid(year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const weeks = [];
  let currentWeek = Array(7).fill(null);
  
  for (let d = 1; d <= end.getDate(); d++) {
    const date = new Date(year, month, d);
    const dayOfWeek = (date.getDay() + 6) % 7; // Adjust to Monday start
    currentWeek[dayOfWeek] = date;
    
    if (dayOfWeek === 6 || d === end.getDate()) {
      weeks.push(currentWeek);
      currentWeek = Array(7).fill(null);
    }
  }
  return weeks;
}


function HabitCard({ habit, onDelete, onToggle, dark, year }) {
  const streak = getStreak(habit.completions);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toKey(today);
  const doneToday = !!(habit.completions && habit.completions[todayKey]);
  const cardBg = dark ? "#161b22" : "#fff";
  const border = dark ? "1px solid #30363d" : "1px solid #e5e7eb";
  const textCol = dark ? "#e6edf3" : "#111827";
  const subCol = dark ? "#8b949e" : "#9ca3af";
  const green = dark ? "#39d353" : "#2da44e";

  return (
    <div style={{ background: cardBg, border, borderRadius: 12, padding: "16px 18px", marginBottom: 12, transition: "background 0.3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: textCol }}>{habit.name}</div>
          <div style={{ fontSize: 11, color: subCol, marginTop: 2 }}>{streak > 0 ? `🔥 ${streak} day streak` : "Start today"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            onClick={() => onToggle(habit.id, todayKey)}
            style={{
              width: 26, height: 26, borderRadius: "50%",
              border: `2px solid ${doneToday ? green : (dark ? "#30363d" : "#d1d5db")}`,
              background: doneToday ? green : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >{doneToday && <span style={{ color: "#fff", fontSize: 13 }}>✓</span>}</div>
          <div onClick={() => onDelete(habit.id)} style={{ color: subCol, cursor: "pointer", fontSize: 15 }}>✕</div>
        </div>
      </div>
      <Heatmap habitId={habit.id} completions={habit.completions} onToggle={onToggle} dark={dark} year={year} />
    </div>
  );
}

export default function App() {
  const currentYear = new Date().getFullYear();
  const [dark, setDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [year, setYear] = useState(currentYear);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetchHabits();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = e => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

async function fetchHabits() {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('inserted_at', { ascending: true }); // Use inserted_at to match your SQL
      
      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error("Error fetching habits:", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function addHabit() {
    const name = input.trim();
    if (!name) return;
    const { data, error } = await supabase.from('habits').insert([{ name, completions: {} }]).select();
    if (!error && data) {
      setHabits([...habits, data[0]]);
      setInput("");
    }
  }

  async function deleteHabit(id) {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (!error) setHabits(habits.filter(h => h.id !== id));
  }

  async function toggleDay(id, key) {
    const habit = habits.find(h => h.id === id);
    const newCompletions = { ...(habit.completions || {}) };
    newCompletions[key] ? delete newCompletions[key] : (newCompletions[key] = true);

    const { error } = await supabase.from('habits').update({ completions: newCompletions }).eq('id', id);
    if (!error) {
      setHabits(habits.map(h => h.id === id ? { ...h, completions: newCompletions } : h));
    }
  }

  const bg = dark ? "#0d1117" : "#f6f8fa";
  const textCol = dark ? "#e6edf3" : "#111827";
  const subCol = dark ? "#8b949e" : "#9ca3af";
  const inputBg = dark ? "#161b22" : "#fff";
  const inputBorder = dark ? "1px solid #30363d" : "1px solid #e5e7eb";

  if (loading) return <div style={{ background: bg, minHeight: "100vh", color: textCol, padding: 20 }}>Loading permanent habits...</div>;

return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", transition: "background 0.3s" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: dark ? "1px solid #21262d" : "1px solid #e5e7eb" }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: textCol, letterSpacing: "-0.3px" }}>Habit Tracker</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setYear(y => y - 1)} style={{ background: "none", border: "none", cursor: "pointer", color: subCol, fontSize: 18, padding: 0, lineHeight: 1 }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: textCol, minWidth: 36, textAlign: "center" }}>{year}</span>
          <button onClick={() => setYear(y => Math.min(y + 1, currentYear))} style={{ background: "none", border: "none", cursor: "pointer", color: year >= currentYear ? (dark ? "#30363d" : "#d1d5db") : subCol, fontSize: 18, padding: 0, lineHeight: 1 }}>›</button>
        </div>
      </div>

      {/* Habit List - Increased bottom padding to 180px so habits don't get stuck behind the bar */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 180px" }}>
        {habits.length === 0 && <div style={{ textAlign: "center", color: subCol, marginTop: 60, fontSize: 13 }}>No habits yet. Add one below 🌱</div>}
        {habits.map(h => <HabitCard key={h.id} habit={h} onDelete={deleteHabit} onToggle={toggleDay} dark={dark} year={year} />)}
      </div>

      {/* Floating Safari-Style Bar */}
      <div style={{
        position: "fixed",
        bottom: "40px", // Increased space from the very bottom
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "center",
        padding: "0 20px",
        pointerEvents: "none"
      }}>
        <div style={{
          pointerEvents: "auto",
          width: "100%",
          maxWidth: "450px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 8px 8px 20px",
          // Matches your dark background color #0d1117 exactly with a bit of glass transparency
          background: dark ? "rgba(13, 17, 23, 0.85)" : "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderRadius: "32px",
          border: dark ? "1px solid #30363d" : "1px solid #e5e7eb", // Uses your actual border colors
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addHabit()}
            placeholder="New habit..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              fontSize: "17px",
              color: textCol,
              outline: "none",
            }}
          />
          <button 
            onClick={addHabit} 
            style={{
              width: "40px",
              height: "40px",
              background: dark ? "#39d353" : "#2da44e", // Uses the green from your checkmarks
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "24px",
              fontWeight: "300",
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
