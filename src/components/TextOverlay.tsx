"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const TEXT_SEQUENCE = [
  "Static Intelligence. Same Output for Everyone.",
  "Observing Behavioral Patterns",
  "Learning Through Reinforcement Signals",
  "Adapting via Preference Optimization",
  "Intelligence That Evolves With You",
];

const GlassContainer = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass-premium rounded-2xl px-12 py-8 w-full max-w-[70vw] mx-auto backdrop-blur-xl ${className}`}>
    {children}
  </div>
);

const RevealText = ({ text, progress, index }: { text: string; progress: any; index: number }) => {
  const start = index * 0.18;
  const end = (index + 1) * 0.18;
  
  // Center focus animations
  const opacity = useTransform(progress, [start, start + 0.05, end - 0.05, end], [0, 1, 1, 0]);
  const y = useTransform(progress, [start, start + 0.05, end - 0.05, end], [30, 0, 0, -30]);
  const scale = useTransform(progress, [start, start + 0.05], [0.95, 1]);
  const blur = useTransform(progress, [start, start + 0.05, end - 0.05, end], ["blur(15px)", "blur(0px)", "blur(0px)", "blur(15px)"]);

  return (
    <motion.div
      style={{ opacity, y, scale, filter: blur }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <GlassContainer>
        <h2 className="text-4xl md:text-6xl font-bold tracking-wide text-white text-center leading-tight [text-shadow:0_0_25px_rgba(0,174,239,0.4)]">
          {text}
        </h2>
      </GlassContainer>
    </motion.div>
  );
};

export default function TextOverlay() {
  const { scrollYProgress } = useScroll();

  // Master UI transitions
  const isFinal = useTransform(scrollYProgress, [0.92, 0.96], [1, 0]);
  const finalOpacity = useTransform(scrollYProgress, [0.94, 0.98], [0, 1]);
  const finalY = useTransform(scrollYProgress, [0.94, 0.98], [40, 0]);

  return (
    <div className="relative z-10 w-full">
      {/* Main Sequence Layer */}
      <div className="h-[300vh] relative">
        <motion.div style={{ opacity: isFinal }} className="fixed inset-0 pointer-events-none">
          {/* Large Centered Text Interface */}
          <div className="absolute inset-0">
            {TEXT_SEQUENCE.map((text, i) => (
              <RevealText key={i} text={text} progress={scrollYProgress} index={i} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Final Section (Locked at bottom) */}
      <div className="h-screen relative">
        <motion.div
          style={{ opacity: finalOpacity, y: finalY }}
          className="sticky top-0 h-screen w-full flex flex-col items-center justify-center text-center gap-12 px-6 bg-black z-50"
        >
          <div className="space-y-8 w-full max-w-4xl mx-auto">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-neon-blue font-mono text-sm tracking-[0.8em] uppercase"
            >
              Evolution Complete
            </motion.div>
            
            <GlassContainer>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white mb-6 [text-shadow:0_0_30px_rgba(0,174,239,0.5)]">
                Get Started with Think Loop
              </h1>
              <p className="text-white/70 text-xl md:text-2xl font-medium leading-relaxed max-w-2xl mx-auto">
                An AI that continuously learns, adapts, and evolves with you.
              </p>
            </GlassContainer>
          </div>

          <div className="pointer-events-auto">
            <Link
              href="/auth"
              className="group relative flex items-center gap-6 bg-neon-blue text-white px-14 py-7 rounded-full font-bold text-3xl transition-all hover:scale-105 hover:-translate-y-2 neon-glow overflow-hidden"
            >
              <span className="relative z-10">ENTER THE LOOP</span>
              <ArrowRight className="relative z-10 w-8 h-8 transition-transform group-hover:translate-x-2" />
              
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
