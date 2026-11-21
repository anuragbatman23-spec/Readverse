'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetAll = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsForgotPasswordOpen(false);
    setResetSent(false);
    setResetEmail('');
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/' });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetSent(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (view === 'register') {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (view === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create account.');
        }

        setSuccessMessage('Account created! Signing you in...');

        const signInRes = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (signInRes?.error) {
          throw new Error(signInRes.error);
        }

        setTimeout(() => {
          onClose();
          resetAll();
          window.location.reload();
        }, 800);
      } else {
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        setSuccessMessage('Logged in successfully!');
        setTimeout(() => {
          onClose();
          resetAll();
          window.location.reload();
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        resetAll();
        onClose();
      }}
    >
      {/* Outer Glow / Modal Container */}
      <div
        className="relative w-full max-w-[430px] rounded-[24px] bg-[#121319] border border-white/[0.08] shadow-[0_0_60px_rgba(234,93,44,0.14),0_25px_50px_-12px_rgba(0,0,0,0.9)] p-7 sm:p-8 text-white overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Ambient Background Highlights */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-44 bg-gradient-to-b from-[#ea5d2c]/20 via-[#ea5d2c]/5 to-transparent blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            resetAll();
            onClose();
          }}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* ReadVerse Logo Badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative w-7 h-7 flex items-center justify-center">
              {/* Sharp geometric diamond/hexagon mark matching Otanox aesthetic */}
              <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none">
                <polygon
                  points="14,2 26,8 26,20 14,26 2,20 2,8"
                  className="fill-[#ea5d2c]/15 stroke-[#ea5d2c]"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 10L14 7L19 10M14 7V21M9 18L14 21L19 18"
                  stroke="#ea5d2c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-xl font-black tracking-wider uppercase leading-none font-sans">
              <span className="text-white">READ</span>
              <span className="text-[#ea5d2c]">VERSE</span>
            </h1>
          </div>

          {/* Title & Subtitle */}
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
            {view === 'login' ? 'Welcome back!' : 'Create an Account'}
          </h2>
          <p className="text-xs text-zinc-400">
            {view === 'login'
              ? 'Log in to pick up where you left off.'
              : 'Join ReadVerse to track and sync your reading.'}
          </p>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="leading-tight">{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'register' && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 pl-0.5">
                YOUR NAME
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#191b22] border border-[#272a35] focus:border-[#ea5d2c] focus:bg-[#1c1e27] text-white text-xs placeholder:text-zinc-500 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 pl-0.5">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#191b22] border border-[#272a35] focus:border-[#ea5d2c] focus:bg-[#1c1e27] text-white text-xs placeholder:text-zinc-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 pl-0.5">
              PASSWORD
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#191b22] border border-[#272a35] focus:border-[#ea5d2c] focus:bg-[#1c1e27] text-white text-xs placeholder:text-zinc-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {view === 'register' && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 pl-0.5">
                CONFIRM PASSWORD
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#191b22] border border-[#272a35] focus:border-[#ea5d2c] focus:bg-[#1c1e27] text-white text-xs placeholder:text-zinc-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Remember me & Forgot password row (Login view) */}
          {view === 'login' && (
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                    rememberMe
                      ? 'bg-[#ea5d2c] text-white'
                      : 'bg-[#191b22] border border-[#272a35] group-hover:border-zinc-500'
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-zinc-400 group-hover:text-zinc-300 text-xs">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(!isForgotPasswordOpen)}
                className="text-zinc-400 hover:text-[#ea5d2c] text-xs transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Inline Forgot Password Box (Exact match to screenshot 3) */}
          {view === 'login' && isForgotPasswordOpen && (
            <div className="p-4 rounded-xl bg-[#171921] border border-white/[0.08] space-y-3 animate-in fade-in duration-200">
              <p className="text-xs text-zinc-300">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              {resetSent ? (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs">
                  Password reset link sent to your email!
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@email.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#111318] border border-[#272a35] focus:border-[#ea5d2c] text-white text-xs placeholder:text-zinc-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="px-4 py-2 rounded-lg bg-[#ea5d2c] hover:bg-[#d55020] text-white text-xs font-semibold shadow-md shadow-[#ea5d2c]/20 transition-all active:scale-95"
                    >
                      Send reset link
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(false)}
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#ea5d2c] hover:bg-[#f06837] active:scale-[0.98] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#ea5d2c]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : view === 'login' ? (
              <span>Login</span>
            ) : (
              <span>Register</span>
            )}
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-white/[0.08] w-full" />
          <span className="bg-[#121319] px-3 text-[10px] font-bold text-zinc-500 tracking-wider uppercase shrink-0">
            OR
          </span>
          <div className="border-t border-white/[0.08] w-full" />
        </div>

        {/* Google 1-Click Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-[#191b22] hover:bg-[#222530] border border-white/[0.08] hover:border-white/20 text-white font-semibold text-xs transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Footer Switcher */}
        <div className="text-center text-xs text-zinc-400">
          {view === 'login' ? (
            <span>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setView('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setIsForgotPasswordOpen(false);
                }}
                className="font-bold text-[#ea5d2c] hover:underline transition-all"
              >
                Register
              </button>
            </span>
          ) : (
            <span>
              Have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="font-bold text-[#ea5d2c] hover:underline transition-all"
              >
                Login
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
