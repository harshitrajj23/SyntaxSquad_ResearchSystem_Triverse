'use client';

import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Recommendations({ recommendations, onSelect, isLoading }) {
  // Ensure recommendations is an array
  const items = Array.isArray(recommendations) 
    ? recommendations 
    : recommendations?.recommendations || [];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full lg:w-80 flex flex-col gap-6 lg:border-l border-white/10 lg:pl-8 py-6 lg:py-12"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-neon-purple/20 rounded-lg flex items-center justify-center border border-neon-purple/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <Sparkles className="w-4 h-4 text-neon-purple" />
        </div>
        <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-white/60">
          Related Searches
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass p-4 rounded-2xl border border-white/5 animate-pulse"
              >
                <div className="h-3 w-3/4 bg-white/5 rounded-full" />
              </motion.div>
            ))
          ) : (
            items.map((item, index) => (
              <motion.button
                key={item}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelect(item)}
                className="glass group p-4 rounded-2xl border border-white/5 hover:border-neon-blue/30 text-left transition-all hover:bg-white/[0.05] active:scale-95 flex items-center justify-between"
              >
                <span className="text-xs font-medium text-white/60 group-hover:text-white transition-colors line-clamp-2">
                  {item}
                </span>
                <ArrowRight className="w-4 h-4 text-neon-blue opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>


      <div className="mt-auto lg:block hidden">
        <div className="p-4 rounded-2xl bg-neon-blue/5 border border-neon-blue/10">
          <p className="text-[9px] text-neon-blue/60 font-mono leading-relaxed">
            Neural mapping suggests these topics may be relevant to your current session context.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
