'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, ThumbsUp, ThumbsDown, Loader2, AlertCircle, 
  Bot, User, ArrowLeft, Sparkles, MessageSquare 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMessages, askQuestion, sendFeedback, getRecommendations } from '@/services/api';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import Recommendations from '@/components/Recommendations';

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

export default function ChatPage() {
  const { chat_id } = useParams();
  const router = useRouter();

  if (!chat_id || chat_id === 'undefined') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="glass p-12 rounded-3xl border-red-500/30 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Invalid Neural Session</h2>
          <p className="text-white/40 text-sm mb-8">The requested chat session is malformed or no longer exists.</p>
          <Link 
            href="/history"
            className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-xl font-bold text-xs tracking-widest uppercase hover:bg-white/10 transition-all inline-block"
          >
            Back to History
          </Link>
        </div>
      </div>
    );
  }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChatId, setActiveChatId] = useState(chat_id === 'new' ? null : chat_id);
  const [user, setUser] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isRecLoading, setIsRecLoading] = useState(false);
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

  // Load messages on mount
  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;
        if (user) {
          setUser(user);
        } else {
          router.push('/auth');
        }
      } catch (err) {
        console.error('Auth error in ChatPage:', err);
      }
    };

    const loadChat = async () => {
      if (!chat_id || chat_id === 'undefined') return;
      
      if (chat_id !== 'new') {
        try {
          setIsInitialLoading(true);
          const data = await getMessages(chat_id);
          if (!mounted) return;
          setMessages(data);
        } catch (err) {
          console.error('Failed to load chat:', err);
          if (mounted) setError('Failed to synchronize with Neural Core history.');
        } finally {
          if (mounted) setIsInitialLoading(false);
        }
      } else {
        if (mounted) setIsInitialLoading(false);
      }
    };

    getUser();
    loadChat();

    return () => { mounted = false; };
  }, [chat_id, router]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    const newUserMessage = { role: 'user', content: userQuery };
    
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Include system prompt if first message
      const payloadMessages = messages.length === 0 
        ? [{ role: 'system', content: 'You are the Neural Assistant for ThinkLoop. Be concise, technical, and helpful.' }, newUserMessage]
        : updatedMessages;

      if (!user) return;
      
      // Fetch recommendations in parallel with the question
      setIsRecLoading(true);
      const [data, recs] = await Promise.all([
        askQuestion(payloadMessages, user.id, activeChatId, selectedMode),
        getRecommendations(userQuery)
      ]);
      
      if (data.chat_id && !activeChatId) {
        setActiveChatId(data.chat_id);
        // Update URL without reloading
        window.history.replaceState(null, '', `/chat/${data.chat_id}`);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        type: data.type,
        mode: data.mode,
        papers: data.papers,
        query: userQuery
      }]);
      setRecommendations(recs);
    } catch (err) {
      setError('Connection to Neural Core lost. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRecLoading(false);
    }
  };

  const handleSelectRecommendation = (query) => {
    setInput(query);
    // Use a small timeout to ensure state update before triggering submit
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 0);
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

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-neon-blue" />
          <p className="text-white/20 text-xs font-bold tracking-[0.3em] uppercase">Initializing Session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col border-x border-white/5 shadow-2xl shadow-neon-blue/5">
      {/* Header */}
      <header className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-30">

        <div className="flex items-center gap-6">
          <Link href="/history" className="p-2 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neon-blue/20 rounded-xl flex items-center justify-center border border-neon-blue/30 shadow-[0_0_15px_rgba(0,174,239,0.2)]">
              <Bot className="w-6 h-6 text-neon-blue" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-[0.2em] uppercase">Neural Interface</h2>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[9px] text-white/40 uppercase font-mono tracking-widest">Active Link</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <p className="text-[10px] text-white/20 font-mono tracking-tighter">
            SESSION_ID: {activeChatId || 'NEW_SYNC'}
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1600px] mx-auto w-full">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Message Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 scrollbar-hide pb-20"
          >
            <AnimatePresence initial={false}>
              {messages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="h-full flex flex-col items-center justify-center text-center space-y-8 pt-20"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-neon-blue/20 blur-3xl rounded-full" />
                    <Sparkles className="w-20 h-20 text-neon-blue relative z-10 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-bold tracking-tight text-white">Quantum Core Online</h3>
                    <p className="text-sm text-white/40 leading-relaxed font-medium max-w-md">
                      Initializing behavioral mapping sequence. Your interactions will be archived for future optimization.
                    </p>
                  </div>
                </motion.div>
              )}
              
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] group ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                    <div className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest ${msg.role === 'user' ? 'text-neon-blue flex-row-reverse' : 'text-white/40'}`}>
                      {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      {msg.role === 'user' ? 'You' : 'Neural Core'}
                    </div>
                    
                    <div className={`p-5 rounded-3xl relative ${
                      msg.role === 'user' 
                        ? 'bg-neon-blue text-black font-semibold rounded-tr-none shadow-[0_10px_40px_rgba(0,174,239,0.15)]' 
                        : 'glass rounded-tl-none border border-white/10 backdrop-blur-md'
                    }`}>
                      <div className="prose prose-invert prose-sm max-w-none break-words leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({node, inline, className, children, ...props}) {
                              return (
                                <code className={`${className} bg-black/40 px-1.5 py-0.5 rounded font-mono text-[12px] text-neon-blue border border-neon-blue/20`} {...props}>
                                  {children}
                                </code>
                              )
                            },
                            pre({node, children, ...props}) {
                              return (
                                <div className="relative my-6">
                                  <pre className="bg-black/60 p-6 rounded-2xl overflow-x-auto border border-white/5 text-[12px] font-mono leading-relaxed" {...props}>
                                    {children}
                                  </pre>
                                </div>
                              )
                            },
                            table({node, ...props}) {
                              return (
                                <div className="my-6 overflow-x-auto rounded-xl border border-white/10">
                                  <table className="w-full border-collapse text-left text-xs" {...props} />
                                </div>
                              )
                            },
                            thead({node, ...props}) {
                              return <thead className="bg-white/5 border-b border-white/10" {...props} />
                            },
                            th({node, ...props}) {
                              return <th className="px-4 py-3 font-black uppercase tracking-widest text-neon-blue/80" {...props} />
                            },
                            td({node, ...props}) {
                              return <td className="px-4 py-3 border-b border-white/5 text-white/70" {...props} />
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
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex bg-white/5 rounded-full p-1 border border-white/5">
                          <button
                            onClick={() => handleFeedback(idx, true)}
                            disabled={msg.feedbackSent}
                            className={`p-2 rounded-full transition-all ${
                              msg.liked === true ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/10 text-white/20 hover:text-white'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFeedback(idx, false)}
                            disabled={msg.feedbackSent}
                            className={`p-2 rounded-full transition-all ${
                              msg.liked === false ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10 text-white/20 hover:text-white'
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                        {msg.type && (
                          <span className="text-[9px] px-3 py-1 rounded-full bg-neon-blue/5 border border-neon-blue/10 text-neon-blue uppercase tracking-widest font-black">
                            {msg.type}
                          </span>
                        )}
                        {(() => {
                          const modeKey = msg.mode && MODE_CONFIG[msg.mode] ? msg.mode : 'learning';
                          const cfg = MODE_CONFIG[modeKey];
                          return (
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${cfg.bg} ${cfg.border} border backdrop-blur-sm shadow-sm`}>
                              <span className={`w-1 h-1 rounded-full ${cfg.dot} animate-pulse`} />
                              <span className={`text-[9px] uppercase tracking-widest font-black ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
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
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="glass border border-white/10 p-5 rounded-3xl rounded-tl-none flex items-center gap-4">
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
                <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl flex items-center gap-3 text-red-400 text-xs uppercase tracking-widest font-black shadow-xl">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Section */}
          <div className="p-6 md:p-10 border-t border-white/10 bg-black/60 backdrop-blur-2xl sticky bottom-0 z-20">
            <div className="flex items-center gap-2 mb-4 max-w-4xl mx-auto flex-wrap">
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
                  className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black border backdrop-blur-sm transition-all duration-300 ${
                    selectedMode === m.key
                      ? m.activeColor
                      : 'border-white/5 bg-white/[0.02] text-white/30 hover:bg-white/5 hover:text-white/50 hover:border-white/10'
                  }`}
                >
                  <span className="mr-1.5">{m.emoji}</span>{m.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSend} className="relative group max-w-4xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-700" />
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Inject query into Neural Core..."
                  disabled={isLoading}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] py-6 pl-8 pr-20 text-base text-white placeholder-white/20 outline-none focus:border-neon-blue/40 focus:bg-white/[0.05] transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 w-14 h-14 bg-neon-blue rounded-2xl text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100 shadow-[0_0_30px_rgba(0,174,239,0.3)]"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                </button>
              </div>
            </form>
            <div className="flex justify-center items-center mt-6 gap-8">
              <p className="text-[8px] text-white/10 uppercase tracking-[0.4em] font-black">
                End-to-End Encryption Active
              </p>
              <div className="flex gap-1.5">
                <div className="w-1 h-1 rounded-full bg-neon-blue shadow-[0_0_5px_#00AEEF]" />
                <div className="w-1 h-1 rounded-full bg-neon-blue shadow-[0_0_5px_#00AEEF]" />
                <div className="w-1 h-1 rounded-full bg-neon-blue shadow-[0_0_5px_#00AEEF]" />
              </div>
              <p className="text-[8px] text-white/10 uppercase tracking-[0.4em] font-black">
                Protocol 9.2.0-TL
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: Recommendations */}
        <div className="p-6 lg:p-0">
          <Recommendations 
            recommendations={recommendations} 
            onSelect={handleSelectRecommendation}
            isLoading={isRecLoading}
          />
        </div>
      </div>

    </div>
  );
}
