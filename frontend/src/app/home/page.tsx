"use client";

import Link from "next/link";
import {
  Cpu, Activity, User, LogOut, MessageSquare,
  Clock, Zap, Brain, Shield, TrendingUp, ChevronRight,
  Sparkles, BarChart3, Network, Eye
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { TypeWriter, Sparkline, NeuralChart } from "@/components/DashboardWidgets";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as any }
  })
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as any }
  })
};

export default function HomePage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState("");

  // ─── Parallax ───
  const { scrollY } = useScroll();
  const bgY1 = useTransform(scrollY, [0, 1200], [0, -180]);
  const bgY2 = useTransform(scrollY, [0, 1200], [0, -300]);
  const bgY3 = useTransform(scrollY, [0, 1200], [0, 120]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 0.96]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.5]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
      );
    };
    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const stats = [
    { icon: <Cpu className="w-5 h-5" />, label: "Neural Load", value: "98.4%", change: "+2.1%", color: "from-[#00AEEF] to-[#00F0FF]", hex: "#00AEEF", sparkData: [60,65,62,70,75,72,80,82,85,88,90,92,95,93,96,98] },
    { icon: <Activity className="w-5 h-5" />, label: "Learning Rate", value: "0.12ms", change: "-0.03ms", color: "from-[#9d00ff] to-[#FF006E]", hex: "#9d00ff", sparkData: [30,28,32,25,22,26,20,18,16,15,14,12,13,11,12,12] },
    { icon: <Zap className="w-5 h-5" />, label: "Response Speed", value: "47ms", change: "-12ms", color: "from-[#00FF94] to-[#00AEEF]", hex: "#00FF94", sparkData: [120,110,105,95,88,82,78,72,68,62,58,55,52,50,48,47] },
    { icon: <Shield className="w-5 h-5" />, label: "Accuracy", value: "99.7%", change: "+0.3%", color: "from-[#FF006E] to-[#9d00ff]", hex: "#FF006E", sparkData: [92,93,94,93,95,96,95,97,96,97,98,97,98,99,99,99.7] },
  ];

  const recentActivities = [
    { action: "Model behavior recalibrated", time: "2m ago", icon: <Brain className="w-4 h-4" /> },
    { action: "New preference pattern detected", time: "15m ago", icon: <Eye className="w-4 h-4" /> },
    { action: "Neural pathway optimized", time: "1h ago", icon: <Network className="w-4 h-4" /> },
    { action: "Style engine updated", time: "3h ago", icon: <Sparkles className="w-4 h-4" /> },
    { action: "Feedback loop synchronized", time: "6h ago", icon: <TrendingUp className="w-4 h-4" /> },
  ];

  const quickActions = [
    { title: "Neural Chat", desc: "Start a conversation with your AI", icon: <MessageSquare className="w-6 h-6" />, href: "/chat/new", gradient: "from-[#00AEEF] to-[#00F0FF]", primary: true },
    { title: "Chat History", desc: "Browse past conversations", icon: <Clock className="w-6 h-6" />, href: "/history", gradient: "from-[#9d00ff] to-[#FF006E]", primary: false },
    { title: "Evolution Logs", desc: "Track AI adaptation progress", icon: <BarChart3 className="w-6 h-6" />, href: "#", gradient: "from-[#00FF94] to-[#00AEEF]", primary: false },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">

      {/* ═══ Parallax Background Orbs ═══ */}
      <motion.div style={{ y: bgY1 }} className="fixed top-[-15%] left-[-10%] w-[55vw] h-[55vw] bg-[#00AEEF]/[0.04] blur-[180px] rounded-full pointer-events-none z-0" />
      <motion.div style={{ y: bgY2 }} className="fixed top-[20%] right-[-15%] w-[45vw] h-[45vw] bg-[#9d00ff]/[0.05] blur-[160px] rounded-full pointer-events-none z-0" />
      <motion.div style={{ y: bgY3 }} className="fixed bottom-[-25%] left-[20%] w-[50vw] h-[50vw] bg-[#FF006E]/[0.03] blur-[200px] rounded-full pointer-events-none z-0" />

      {/* Grid overlay */}
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none z-0" />

      {/* ═══ Navbar (Glassmorphism) ═══ */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/40 backdrop-blur-2xl backdrop-saturate-150">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#00AEEF] to-[#00F0FF] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,174,239,0.4)] animate-pulse-glow">
              <span className="font-black text-black text-[10px] tracking-widest">TL</span>
            </div>
            <span className="font-black text-lg tracking-tight">ThinkLoop</span>
            <span className="hidden md:inline-block text-[9px] text-white/20 bg-white/5 px-2 py-0.5 rounded-full font-bold tracking-widest border border-white/5 ml-1">v2.0 BETA</span>
          </div>

          <nav className="flex items-center gap-2 md:gap-3">
            <Link href="/chat/new" className="flex items-center gap-2 bg-gradient-to-r from-[#00AEEF] to-[#00F0FF] text-black px-5 py-2.5 rounded-xl font-bold text-[11px] tracking-widest uppercase hover:shadow-[0_0_30px_rgba(0,174,239,0.5)] hover:scale-[1.02] transition-all duration-300">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline">Neural Chat</span>
            </Link>
            <Link href="/history" className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] text-white/60 px-4 py-2.5 rounded-xl hover:bg-white/[0.08] hover:text-white transition-all text-[11px] font-bold tracking-widest uppercase">
              <Clock className="w-4 h-4" />
              <span className="hidden md:inline">History</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 rounded-xl hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all text-[11px] font-bold tracking-widest uppercase text-white/60">
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.1] flex items-center justify-center ml-1">
              <User className="w-5 h-5 text-neon-blue" />
            </div>
          </nav>
        </div>
      </header>

      {/* ═══ Main Content ═══ */}
      <main className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 relative z-10">

        {/* ─── Hero with Parallax + TypeWriter ─── */}
        <motion.section className="mb-14" style={{ scale: heroScale, opacity: heroOpacity }} initial="hidden" animate="visible">
          <motion.div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-2" variants={fadeUp} custom={0}>
            <div>
              <motion.div className="flex items-center gap-3 mb-4" variants={fadeUp} custom={0}>
                <div className="flex items-center gap-2 bg-[#00FF94]/10 border border-[#00FF94]/20 px-3 py-1 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF94] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF94]" />
                  </span>
                  <span className="text-[10px] text-[#00FF94] font-bold tracking-widest uppercase">All Systems Online</span>
                </div>
                <span className="text-[10px] text-white/20 font-mono">{currentTime}</span>
              </motion.div>

              <motion.h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95]" variants={fadeUp} custom={1}>
                Welcome to
                <br />
                <span className="bg-gradient-to-r from-[#00AEEF] via-[#00F0FF] to-[#9d00ff] bg-clip-text text-transparent animate-gradient">
                  <TypeWriter text="ThinkLoop" />
                </span>
              </motion.h1>

              <motion.p className="text-white/40 text-base mt-4 max-w-lg leading-relaxed" variants={fadeUp} custom={2}>
                Your AI is actively learning from every interaction. Watch it evolve
                in real-time as neural pathways strengthen and optimize.
              </motion.p>
            </div>

            <motion.div variants={fadeUp} custom={3} className="flex-shrink-0">
              <Link href="/chat/new" className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-[#00AEEF] to-[#00F0FF] text-black px-8 py-4 rounded-2xl font-bold text-sm tracking-wide hover:shadow-[0_0_50px_rgba(0,174,239,0.5)] hover:scale-[1.03] transition-all duration-300">
                <div className="absolute -inset-[1px] bg-gradient-to-r from-[#00AEEF] to-[#00F0FF] rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity" />
                <span className="relative flex items-center gap-3">
                  <Sparkles className="w-5 h-5" />
                  Start Neural Session
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ─── Stats Grid with Sparkline Charts ─── */}
        <motion.section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10" initial="hidden" animate="visible">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} variants={scaleIn} custom={i}
              className="glass-elevated rounded-2xl p-5 md:p-6 relative group hover:border-white/[0.15] transition-all duration-500 overflow-hidden cursor-default"
            >
              <div className={`absolute -top-10 -right-10 w-28 h-28 opacity-[0.07] blur-[45px] rounded-full group-hover:opacity-[0.15] transition-opacity duration-700`} style={{ background: stat.hex }} />

              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                <span className="text-black">{stat.icon}</span>
              </div>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mb-1">{stat.label}</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl md:text-3xl font-black tracking-tight">{stat.value}</p>
                <span className="text-[10px] font-bold mb-1 text-[#00FF94]">{stat.change}</span>
              </div>

              {/* SVG Sparkline replaces old bar chart */}
              <Sparkline data={stat.sparkData} color={stat.hex} id={stat.label.replace(/\s/g, "")} />
            </motion.div>
          ))}
        </motion.section>

        {/* ─── Neural Performance Graph ─── */}
        <motion.section className="mb-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}>
          <NeuralChart />
        </motion.section>

        {/* ─── Quick Actions + Activity Feed ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

          {/* Quick Actions */}
          <motion.section className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4" initial="hidden" animate="visible">
            {quickActions.map((action, i) => (
              <motion.div key={action.title} variants={fadeUp} custom={i + 4}>
                <Link href={action.href}
                  className={`block glass-elevated rounded-2xl p-6 md:p-8 relative group overflow-hidden transition-all duration-500 h-full ${action.primary ? "border-[#00AEEF]/20 hover:border-[#00AEEF]/40 hover:shadow-[0_0_40px_rgba(0,174,239,0.15)]" : "hover:border-white/[0.12]"}`}
                >
                  <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br ${action.gradient} opacity-[0.06] blur-[50px] rounded-full group-hover:opacity-[0.18] group-hover:scale-150 transition-all duration-700`} />
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    <span className="text-black">{action.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1 group-hover:text-white transition-colors">{action.title}</h3>
                  <p className="text-sm text-white/30 mb-6">{action.desc}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-white/20 group-hover:text-neon-blue transition-colors">
                    <span>Launch</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.section>

          {/* Activity Feed */}
          <motion.section className="glass-elevated rounded-2xl p-6 overflow-hidden relative" initial="hidden" animate="visible" variants={fadeUp} custom={7}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#9d00ff] opacity-[0.04] blur-[60px] rounded-full" />

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold tracking-widest uppercase text-white/60">Live Activity</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF94] animate-pulse" />
                <span className="text-[9px] text-white/30 font-mono">LIVE</span>
              </div>
            </div>

            <div className="space-y-1">
              {recentActivities.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0 group cursor-default"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/30 group-hover:text-neon-blue group-hover:bg-neon-blue/10 transition-all duration-300 flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/60 truncate group-hover:text-white/80 transition-colors">{item.action}</p>
                    <p className="text-[10px] text-white/20 font-mono">{item.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* ─── Evolution Progress ─── */}
        <motion.section className="glass-elevated rounded-2xl p-8 md:p-10 relative overflow-hidden mb-10" initial="hidden" animate="visible" variants={fadeUp} custom={8}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00AEEF]/[0.04] blur-[100px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#9d00ff]/[0.04] blur-[80px] rounded-full" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
              <div>
                <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2">Evolutionary Roadmap</h3>
                <p className="text-sm text-white/30 max-w-lg">
                  Your AI is currently in the <span className="text-neon-blue font-semibold">Learning Phase</span>.
                  New neural pathways are forming as you engage with the system.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-3xl font-black text-neon-blue">33%</p>
                  <p className="text-[10px] text-white/20 font-bold tracking-widest uppercase">Complete</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-[#00AEEF] to-[#00F0FF] rounded-full relative"
                  initial={{ width: 0 }} animate={{ width: "33%" }}
                  transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#00F0FF] rounded-full shadow-[0_0_15px_rgba(0,240,255,0.6)]" />
                </motion.div>
              </div>

              <div className="flex justify-between mt-5">
                {[
                  { label: "Generic AI", status: "done" },
                  { label: "Learning Phase", status: "active" },
                  { label: "Adaptive", status: "pending" },
                  { label: "Fully Personalized", status: "pending" },
                ].map((ms, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      ms.status === "done" ? "bg-[#00AEEF] border-[#00AEEF] shadow-[0_0_10px_rgba(0,174,239,0.5)]"
                        : ms.status === "active" ? "bg-transparent border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.3)] animate-pulse"
                        : "bg-transparent border-white/10"
                    }`} />
                    <span className={`text-[9px] font-bold tracking-widest uppercase ${
                      ms.status === "active" ? "text-neon-blue" : ms.status === "done" ? "text-white/50" : "text-white/20"
                    }`}>{ms.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ─── Footer ─── */}
        <motion.footer className="text-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <div className="flex items-center justify-center gap-6">
            <div className="flex gap-1.5">
              <div className="w-1 h-1 rounded-full bg-neon-blue shadow-[0_0_5px_#00AEEF]" />
              <div className="w-1 h-1 rounded-full bg-neon-blue shadow-[0_0_5px_#00AEEF]" />
              <div className="w-1 h-1 rounded-full bg-neon-blue shadow-[0_0_5px_#00AEEF]" />
            </div>
            <p className="text-[9px] text-white/15 uppercase tracking-[0.5em] font-black">
              ThinkLoop Neural Core v2.0
            </p>
            <div className="flex gap-1.5">
              <div className="w-1 h-1 rounded-full bg-neon-blue shadow-[0_0_5px_#00AEEF]" />
              <div className="w-1 h-1 rounded-full bg-neon-blue shadow-[0_0_5px_#00AEEF]" />
              <div className="w-1 h-1 rounded-full bg-neon-blue shadow-[0_0_5px_#00AEEF]" />
            </div>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}
