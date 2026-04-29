'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Calendar, ChevronRight, Loader2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { getHistory } from '@/services/api';
import { supabase } from '@/lib/supabaseClient';

export default function HistoryPage() {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!mounted) return;

        if (!user) {
          router.push('/auth');
          return;
        }
        setUser(user);
        const data = await getHistory(user.id);
        
        if (!mounted) return;
        
        setChats(data);
      } catch (err) {
        if (mounted) {
          console.error('History fetch failed:', err);
          setError('Failed to load your neural history.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();
    return () => { mounted = false; };
  }, [router]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  console.log("Chats:", chats);
  const safeChats = Array.isArray(chats) ? chats : [];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <header className="max-w-4xl mx-auto mb-12">
        <Link 
          href="/home" 
          className="inline-flex items-center gap-2 text-neon-blue mb-8 hover:underline group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
          BACK TO DASHBOARD
        </Link>
        
        <h1 className="text-4xl font-bold tracking-tighter mb-2">
          Neural <span className="text-neon-blue">History</span>
        </h1>
        <p className="text-white/40 text-sm font-mono tracking-widest uppercase">
          Accessing persistent memory logs...
        </p>
      </header>

      <main className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-neon-blue" />
            <p className="text-white/20 text-xs font-bold tracking-[0.3em] uppercase">Synchronizing Logs</p>
          </div>
        ) : error ? (
          <div className="glass-premium p-8 rounded-2xl border-red-500/30 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs font-bold tracking-widest uppercase bg-white/5 px-6 py-3 rounded-full hover:bg-white/10 transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : safeChats.length === 0 ? (
          <div className="glass p-12 rounded-3xl text-center border-dashed border-white/10">
            <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No chat history found</h3>
            <p className="text-white/40 text-sm mb-8">Start a new conversation to begin mapping your behavior.</p>
            <Link 
              href="/home"
              className="bg-neon-blue text-black px-8 py-3 rounded-full font-bold text-xs tracking-widest uppercase hover:scale-105 transition-all inline-block"
            >
              Initialize Chat
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {safeChats.map((chat, idx) => (
              <motion.div
                key={chat?.id || chat?.created_at || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  if (chat?.id) {
                    router.push(`/chat/${chat.id}`);
                  } else {
                    console.error("Invalid chat id:", chat);
                  }
                }}
                className="glass p-6 rounded-2xl border border-white/5 hover:border-neon-blue/30 hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-neon-blue/20 group-hover:text-neon-blue transition-colors">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-neon-blue transition-colors truncate max-w-[200px] md:max-w-md">
                        {chat?.preview || `Neural Session ${chat?.id?.slice(0, 8)}`}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(chat?.created_at)}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="flex items-center gap-1 uppercase tracking-tighter">
                          <Clock className="w-3 h-3" />
                          ID: {chat?.id?.slice(0, 12)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-neon-blue group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      
      <footer className="max-w-4xl mx-auto mt-20 text-center">
        <p className="text-[8px] text-white/20 uppercase tracking-[0.5em] font-black">
          Memory Archive System v1.0.2
        </p>
      </footer>
    </div>
  );
}
