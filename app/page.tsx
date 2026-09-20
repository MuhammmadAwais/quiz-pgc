'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Swords, Lock, Mail, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // If user doesn't exist yet, try signing up for instant demo setup
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('admin@pgc.edu');
    setPassword('Admin@PGC2026!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-obsidian relative overflow-hidden">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-team-a-core/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-team-b-cyan/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-surface-carbon border border-team-a-bright/40 shadow-[0_0_32px_rgba(139,92,246,0.35)] mb-4">
            <Swords className="w-7 h-7 text-team-a-bright" />
          </div>
          <h1 className="text-3xl font-extrabold font-mono tracking-wider text-optic-white">
            PGC <span className="text-team-b-cyan">ARENA</span>
          </h1>
          <p className="mt-2 text-sm text-text-muted-slate font-sans">
            Collegiate Live Quiz Stage Control Console
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-carbon border border-white/15 rounded-xl p-8 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.95)]">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-md bg-state-warning-rose/15 border border-state-warning-rose/40 text-state-warning-rose text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <Input
                label="Admin Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pgc.edu"
                className="font-mono text-xs"
              />
            </div>

            <div>
              <Input
                label="Master Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="font-mono text-xs"
              />
            </div>

            <Button
              type="submit"
              variant="team-a"
              size="lg"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-surface-obsidian border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Enter Arena Console</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={handleDemoFill}
              className="inline-flex items-center gap-2 text-xs font-mono text-team-b-ice hover:text-optic-white transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Click to Autofill Demo Master Credentials</span>
            </button>
          </div>
        </div>

        {/* Projector System Notice */}
        <div className="mt-6 text-center text-xs font-mono text-text-muted-slate">
          Zero-Network Live Loop active • 1080p/4K Projector Optimized
        </div>
      </div>
    </div>
  );
}
