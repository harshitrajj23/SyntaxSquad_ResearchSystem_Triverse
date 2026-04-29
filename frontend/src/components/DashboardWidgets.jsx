"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// ─── TypeWriter Animation ───
export function TypeWriter({ text = "ThinkLoop" }) {
  const [display, setDisplay] = useState("");
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    let idx = 0;
    let deleting = false;
    let tid;

    const tick = () => {
      if (!deleting) {
        idx++;
        setDisplay(text.slice(0, idx));
        if (idx === text.length) {
          tid = setTimeout(() => { deleting = true; tick(); }, 2200);
          return;
        }
        tid = setTimeout(tick, 130);
      } else {
        idx--;
        setDisplay(text.slice(0, idx));
        if (idx === 0) {
          deleting = false;
          tid = setTimeout(tick, 600);
          return;
        }
        tid = setTimeout(tick, 65);
      }
    };

    tid = setTimeout(tick, 700);
    return () => clearTimeout(tid);
  }, [text]);

  useEffect(() => {
    const iv = setInterval(() => setCursorOn(p => !p), 530);
    return () => clearInterval(iv);
  }, []);

  return (
    <span>
      {display}
      <span className={`typewriter-caret inline-block w-[3px] h-[1em] bg-neon-blue ml-1 align-middle rounded-sm ${cursorOn ? "opacity-100" : "opacity-0"}`} />
    </span>
  );
}

// ─── Sparkline SVG ───
export function Sparkline({ data, color, id }) {
  const w = 140, h = 40;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 4 - ((v - min) / range) * (h - 8);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10 mt-3" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg-${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Neural Performance Chart ───
const PERF_DATA = [65,72,68,75,82,88,85,90,92,88,95,93,91,94,96,92,89,93,97,95,98,96,97,98];
const ACC_DATA  = [88,89,90,89,91,92,93,92,94,95,94,96,95,97,97,96,98,98,97,99,99,98,99,99.5];
const HOURS = ["00","02","04","06","08","10","12","14","16","18","20","22"];

function makePath(data, W, H, px, py) {
  const mn = 0, mx = 100, rng = mx - mn;
  const iw = W - px * 2, ih = H - py * 2;
  return data.map((v, i) => {
    const x = px + (i / (data.length - 1)) * iw;
    const y = py + (1 - (v - mn) / rng) * ih;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function makeArea(data, W, H, px, py) {
  const line = makePath(data, W, H, px, py);
  const iw = W - px * 2;
  const lastX = px + iw;
  const botY = H - py;
  return `${line} L${lastX},${botY} L${px},${botY} Z`;
}

export function NeuralChart() {
  const W = 800, H = 280, PX = 55, PY = 25;
  const gridYs = [0, 25, 50, 75, 100];

  const perfLine = makePath(PERF_DATA, W, H, PX, PY);
  const perfArea = makeArea(PERF_DATA, W, H, PX, PY);
  const accLine  = makePath(ACC_DATA, W, H, PX, PY);

  return (
    <div className="glass-elevated rounded-2xl p-6 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/[0.04] blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-neon-purple/[0.04] blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-lg font-black tracking-tight">Neural Performance</h3>
          <p className="text-[11px] text-white/30 font-mono tracking-wider mt-1">LAST 24 HOURS — REAL-TIME TELEMETRY</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-[3px] rounded-full bg-neon-blue" />
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Neural Load</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-[3px] rounded-full bg-neon-green" />
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Accuracy</span>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto relative z-10" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00AEEF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00AEEF" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {gridYs.map(v => {
          const y = PY + (1 - v / 100) * (H - PY * 2);
          return (
            <g key={v}>
              <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={PX - 10} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="10" fontFamily="monospace">{v}%</text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {HOURS.map((h, i) => {
          const x = PX + (i / (HOURS.length - 1)) * (W - PX * 2);
          return <text key={h} x={x} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="10" fontFamily="monospace">{h}:00</text>;
        })}

        {/* Area fill */}
        <motion.path d={perfArea} fill="url(#perfGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} />

        {/* Neural Load line */}
        <motion.path
          d={perfLine} fill="none" stroke="#00AEEF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeOut" }}
        />

        {/* Accuracy line */}
        <motion.path
          d={accLine} fill="none" stroke="#00FF94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, ease: "easeOut", delay: 0.3 }}
        />

        {/* Endpoint dots */}
        <motion.circle cx={W - PX} cy={PY + (1 - PERF_DATA[PERF_DATA.length-1] / 100) * (H - PY * 2)} r="5" fill="#00AEEF"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2 }}
        >
          <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
        </motion.circle>
      </svg>
    </div>
  );
}
