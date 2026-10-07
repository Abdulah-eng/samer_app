'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe, Moon, Sun, ShieldCheck, ShoppingCart } from 'lucide-react';
import { StoreSettings } from '@/lib/types';

interface HeaderProps {
  settings: StoreSettings;
}

export const Header: React.FC<HeaderProps> = ({ settings }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Check initial theme from localStorage or document class
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  };

  return (
    <header className="w-full bg-[#080e1c]/95 backdrop-blur-md border-b border-white/[0.06] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between gap-4">

        {/* LEFT: Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition"
            style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}
          >
            <ShoppingCart className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-black tracking-widest text-white uppercase">
              {(settings.storeName || 'IMOSTRADA').toUpperCase()}
            </span>
            <span className="text-[8px] font-bold text-cyan-400 tracking-widest uppercase mt-0.5">
              DIGITAL PRODUCTS
            </span>
          </div>
        </Link>

        {/* CENTER: Marketplace partner badges */}
        <div className="hidden md:flex items-center gap-6">
          <span className="text-sm font-black tracking-wider" style={{ color: '#ff6b35' }}>
            GAMIVO
          </span>

          <span className="text-base font-black tracking-wide italic" style={{ color: '#e63329' }}>
            G2A
          </span>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <span className="text-sm font-bold" style={{ color: '#a855f7' }}>
              Driffle
            </span>
          </div>
        </div>

        {/* RIGHT: Status + Language + Theme + Admin */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online status pill */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-300 bg-[#0d1629] px-3 py-1.5 rounded-full border border-white/10 shrink-0">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: settings.isOnline ? '#22c55e' : '#ef4444',
                boxShadow: settings.isOnline ? '0 0 6px #22c55e' : '0 0 6px #ef4444',
                animation: settings.isOnline ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span>
              We are currently:{' '}
              <strong style={{ color: settings.isOnline ? '#22c55e' : '#ef4444' }}>
                {settings.isOnline ? 'ONLINE' : 'OFFLINE'}
              </strong>
            </span>
          </div>

          {/* Language dropdown */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 bg-[#0d1629] hover:bg-[#111e33] px-3 py-1.5 rounded-full border border-white/10 cursor-pointer transition">
            <Globe className="w-3.5 h-3.5" />
            <span>English</span>
            <span className="text-[10px]">▾</span>
          </div>

          {/* Dark / Light mode toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark/light theme"
            className="w-8 h-8 rounded-full bg-[#0d1629] border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:scale-105 transition cursor-pointer"
          >
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-blue-300" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* Admin link */}
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 text-purple-300 hover:text-purple-200 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
