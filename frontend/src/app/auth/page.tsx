"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/home");
      }
    };
    checkSession();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isLogin && !agreed) {
      setError("Please agree to the Terms of Service.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          // Optional: Create profile entry
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
          });
        }
      }
      
      router.push("/home");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col md:flex-row bg-black overflow-hidden">
      {/* Left Side: Visual (60%) */}
      <section className="relative w-full md:w-[60%] h-[40vh] md:h-screen overflow-hidden">
        <Image
          src="/images/auth-bg-v3.png"
          alt="AI Neural Network"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black opacity-40" />
        <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px]" />
      </section>

      {/* Right Side: Auth Form (40%) */}
      <section className="w-full md:w-[40%] flex flex-col items-center justify-center p-8 md:p-16 relative z-10">
        <Link 
          href="/" 
          className="absolute top-8 left-8 flex items-center gap-2 text-white/40 hover:text-neon-blue transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-mono tracking-widest">BACK</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
              {isLogin ? "Sign in" : "Sign up"}
            </h1>
            <p className="text-white/50 text-lg font-medium">
              {isLogin 
                ? "Welcome back to Think Loop. Sign in to continue your evolution." 
                : "Join Think Loop to experience personalized AI that adapts to your behavior."}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleAuth}>
            <div className="space-y-2">
              <label className="text-sm font-mono text-white/40 uppercase tracking-widest ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all backdrop-blur-md"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-mono text-white/40 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-neon-blue/50 transition-all backdrop-blur-md"
              />
            </div>

            {!isLogin && (
              <div className="flex items-center gap-3 py-2 cursor-pointer group" onClick={() => setAgreed(!agreed)}>
                <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${agreed ? 'bg-neon-blue border-neon-blue' : 'border-white/20 bg-white/5 group-hover:border-white/40'}`}>
                  {agreed && <Check className="w-3 h-3 text-black stroke-[4px]" />}
                </div>
                <span className="text-sm text-white/50">I agree to the Terms of Service</span>
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-500 text-sm font-medium bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            <button 
              disabled={loading}
              className="w-full group relative flex items-center justify-center gap-3 bg-neon-blue disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-5 rounded-full transition-all hover:scale-[1.02] neon-glow"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                isLogin ? "SIGN IN" : "CREATE ACCOUNT"
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-white/40">
              {isLogin ? "Don't have an account?" : "Already using Think Loop?"}{" "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-neon-blue hover:underline underline-offset-4 font-bold"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
