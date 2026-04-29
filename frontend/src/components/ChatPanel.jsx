'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, ThumbsUp, ThumbsDown, Loader2, AlertCircle, Bot, User, X, MessageSquare, Sparkles, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMessages, askQuestion, sendFeedback } from '@/services/api';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

const MODE_CONFIG = {
  learning: { label: 'Simple', color: 'text-green-400', dot: 'bg-green-400', bg: 'bg-green-500/5', border: 'border-green-500/10' },
  building: { label: 'Build', color: 'text-purple-400', dot: 'bg-purple-400', bg: 'bg-purple-500/5', border: 'border-purple-500/10' },
  exploring: { label: 'Explore', color: 'text-blue-400', dot: 'bg-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/10' },
  academic: { label: 'Research', color: 'text-yellow-400', dot: 'bg-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/10' },
};

const fakePapers = [
  {
    title: "Attention Is All You Need",
    citation: "Vaswani et al., NeurIPS, 2017",
    url: "https://arxiv.org/abs/1706.03762",
    rating: 4.8
  },
  {
    title: "BERT: Pre-training of Deep Bidirectional Transformers",
    citation: "Devlin et al., NAACL, 2018",
    url: "https://arxiv.org/abs/1810.04805",
    rating: 4.6
  },
  {
    title: "GPT: Improving Language Understanding",
    citation: "Radford et al., OpenAI, 2018",
    url: "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf",
    rating: 4.5
  }
];

const ChatPanel = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedMode, setSelectedMode] = useState('learning');
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    let mounted = true;
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted && user) {
          setUser(user);
        }
      } catch (err) {
        console.error('Auth error in ChatPanel:', err);
      }
    };
    getUser();
    return () => { mounted = false; };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    const newUserMessage = { role: 'user', content: userQuery };
    
    // Update local state with user message
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const payloadMessages = messages.length === 0 
        ? [{ role: 'system', content: 'You are the Neural Assistant for ThinkLoop. Be concise, technical, and helpful.' }, newUserMessage]
        : updatedMessages;

      if (!user) return;
      const data = await askQuestion(payloadMessages, user.id, chatId, selectedMode);
      
      if (data.chat_id && !chatId) {
        setChatId(data.chat_id);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        type: data.type,
        mode: data.mode,
        papers: data.papers,
        query: userQuery
      }]);
    } catch (err) {
      setError('Connection to Neural Core lost. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (index, liked) => {
    const msg = messages[index];
    if (msg.feedbackSent) return;

    try {
      if (!user) return;
      await sendFeedback(user.id, msg.query, liked, msg.type);
      const newMessages = [...messages];
      newMessages[index] = { ...msg, feedbackSent: true, liked };
      setMessages(newMessages);
    } catch (err) {
      console.error('Feedback failed:', err);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: isOpen ? 0 : '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-screen w-full md:w-[450px] bg-black/60 backdrop-blur-3xl border-l border-white/10 z-[100] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
    >
      {/* Premium Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 bg-neon-blue/20 rounded-xl flex items-center justify-center border border-neon-blue/30 shadow-[0_0_15px_rgba(0,174,239,0.2)]">
            <Bot className="w-6 h-6 text-neon-blue" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-[0.2em] uppercase text-white">Neural Assistant</h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest">Core Synchronized</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <Link 
            href="/history"
            className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-neon-blue group"
            title="View History"
          >
            <Clock className="w-5 h-5" />
          </Link>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide pb-10"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="h-full flex flex-col items-center justify-center text-center space-y-6 px-12"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-neon-blue/20 blur-2xl rounded-full" />
                <Sparkles className="w-16 h-16 text-neon-blue relative z-10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-white">Intelligence Ready</h3>
                <p className="text-xs text-white/40 leading-relaxed font-medium">
                  The Neural Core is prepared to process your queries with persistent memory. 
                  Experience a new level of AI assistance.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full pt-4">
                {['Explain quantum computing', 'Write a React hook', 'Optimize my code'].map((suggestion) => (
                  <button 
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-[10px] uppercase tracking-widest font-bold py-3 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-neon-blue/10 hover:border-neon-blue/20 transition-all text-white/40 hover:text-neon-blue"
                  >
                    "{suggestion}"
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] group ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`p-4 rounded-2xl relative ${
                  msg.role === 'user' 
                    ? 'bg-neon-blue text-black font-semibold rounded-tr-none shadow-[0_10px_30px_rgba(0,174,239,0.2)]' 
                    : 'bg-white/[0.03] border border-white/10 rounded-tl-none backdrop-blur-sm'
                }`}>
                  <div className="prose prose-invert prose-xs max-w-none break-words leading-relaxed text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({node, inline, className, children, ...props}) {
                          return (
                            <code className={`${className} bg-black/50 px-1.5 py-0.5 rounded font-mono text-[11px] text-neon-blue border border-neon-blue/20`} {...props}>
                              {children}
                            </code>
                          )
                        },
                        pre({node, children, ...props}) {
                          return (
                            <div className="relative my-4 group/code">
                              <pre className="bg-black/80 p-4 rounded-xl overflow-x-auto border border-white/10 text-[11px] font-mono leading-relaxed shadow-2xl" {...props}>
                                {children}
                              </pre>
                            </div>
                          )
                        },
                        table({node, ...props}) {
                          return (
                            <div className="my-4 overflow-x-auto rounded-xl border border-white/10">
                              <table className="w-full border-collapse text-left text-[10px]" {...props} />
                            </div>
                          )
                        },
                        thead({node, ...props}) {
                          return <thead className="bg-white/5 border-b border-white/10" {...props} />
                        },
                        th({node, ...props}) {
                          return <th className="px-3 py-2 font-black uppercase tracking-widest text-neon-blue/80" {...props} />
                        },
                        td({node, ...props}) {
                          return <td className="px-3 py-2 border-b border-white/5 text-white/70" {...props} />
                        },
                        tr({node, ...props}) {
                          return <tr className="hover:bg-white/[0.02] transition-colors" {...props} />
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>

                {msg.role === 'assistant' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-3 mt-3 ml-1 w-full"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                      <button
                        onClick={() => handleFeedback(idx, true)}
                        disabled={msg.feedbackSent}
                        className={`p-1.5 rounded-full transition-all ${
                          msg.liked === true ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/10 text-white/30 hover:text-white'
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-[1px] bg-white/10 mx-0.5" />
                      <button
                        onClick={() => handleFeedback(idx, false)}
                        disabled={msg.feedbackSent}
                        className={`p-1.5 rounded-full transition-all ${
                          msg.liked === false ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10 text-white/30 hover:text-white'
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {msg.type && (
                      <span className="text-[9px] px-2.5 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue uppercase tracking-[0.15em] font-black shadow-[0_0_10px_rgba(0,174,239,0.1)]">
                        {msg.type}
                      </span>
                    )}
                    {(() => {
                      const modeKey = msg.mode && MODE_CONFIG[msg.mode] ? msg.mode : 'learning';
                      const cfg = MODE_CONFIG[modeKey];
                      return (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.border} border backdrop-blur-sm shadow-sm`}>
                          <span className={`w-1 h-1 rounded-full ${cfg.dot} animate-pulse`} />
                          <span className={`text-[9px] uppercase tracking-[0.2em] font-black ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })()}
                    </div>
                    {(msg.mode === "academic" || selectedMode === "academic") && (
                      <div className="mt-4 space-y-3">
                        <p className="text-xs text-yellow-400 font-semibold">
                          📄 Research Papers
                        </p>
                        {fakePapers.map((paper, i) => (
                          <div key={i} className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
                            <a href={paper.url} target="_blank" className="text-sm font-semibold text-blue-400 hover:underline">
                              {paper.title}
                            </a>
                            <p className="text-xs text-gray-400 mt-1">
                              {paper.citation}
                            </p>
                            <p className="text-xs text-yellow-400 mt-1">
                              ⭐ {paper.rating} / 5
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
              <div className="relative">
                <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
                <div className="absolute inset-0 bg-neon-blue/20 blur-lg rounded-full" />
              </div>
              <span className="text-xs text-white/40 font-bold tracking-[0.2em] uppercase">Synthesizing...</span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center">
            <div className="bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl flex items-center gap-3 text-red-400 text-[10px] uppercase tracking-widest font-black shadow-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {[
            { key: 'learning', label: 'Simple', emoji: '🟢', activeColor: 'border-green-400/50 bg-green-500/10 text-green-300 shadow-[0_0_12px_rgba(74,222,128,0.15)]' },
            { key: 'building', label: 'Build', emoji: '🟣', activeColor: 'border-purple-400/50 bg-purple-500/10 text-purple-300 shadow-[0_0_12px_rgba(192,132,252,0.15)]' },
            { key: 'exploring', label: 'Explore', emoji: '🔵', activeColor: 'border-blue-400/50 bg-blue-500/10 text-blue-300 shadow-[0_0_12px_rgba(96,165,250,0.15)]' },
            { key: 'academic', label: 'Research', emoji: '🟡', activeColor: 'border-yellow-400/50 bg-yellow-500/10 text-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.15)]' },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelectedMode(m.key)}
              className={`px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-black border backdrop-blur-sm transition-all duration-300 ${
                selectedMode === m.key
                  ? m.activeColor
                  : 'border-white/5 bg-white/[0.02] text-white/30 hover:bg-white/5 hover:text-white/50 hover:border-white/10'
              }`}
            >
              <span className="mr-1">{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSend} className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query the Neural Core..."
              disabled={isLoading}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white placeholder-white/20 outline-none focus:border-neon-blue/40 focus:bg-white/10 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-neon-blue rounded-xl text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100 shadow-[0_0_20px_rgba(0,174,239,0.4)]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>
        <div className="flex justify-between items-center mt-4">
          <p className="text-[8px] text-white/20 uppercase tracking-[0.3em] font-black">
            System Protocol 7.4.1
          </p>
          <div className="flex gap-2">
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="w-1 h-1 rounded-full bg-neon-blue animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatPanel;

