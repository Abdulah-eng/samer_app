'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { StoreSettings } from '@/lib/types';

interface HeaderProps {
  settings: StoreSettings;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

export const Header: React.FC<HeaderProps> = ({ settings }) => {
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [isLangOpen, setIsLangOpen] = useState(false);

  useEffect(() => {
    // Force dark theme permanently
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');

    // Check saved language code from cookie
    const match = document.cookie.match(/(?:^|; )googtrans=([^;]*)/);
    if (match) {
      const langCode = match[1].split('/')[2];
      const found = LANGUAGES.find((l) => l.code === langCode);
      if (found) setSelectedLang(found);
    }

    // Initialize Google Translate Script dynamically if needed
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      (window as any).googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,es,de,fr,tr,ar,it',
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
      };
    }
  }, []);

  const changeLanguage = (lang: (typeof LANGUAGES)[0]) => {
    setSelectedLang(lang);
    setIsLangOpen(false);

    // Set Google Translate cookie for full page translation
    if (lang.code === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
    } else {
      document.cookie = `googtrans=/en/${lang.code}; path=/;`;
      document.cookie = `googtrans=/en/${lang.code}; path=/; domain=${window.location.hostname}`;
    }

    // Trigger select combo if present
    const translateCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (translateCombo) {
      translateCombo.value = lang.code;
      translateCombo.dispatchEvent(new Event('change'));
    }

    window.location.reload();
  };

  return (
    <header className="w-full bg-[#080e1c]/95 backdrop-blur-md border-b border-white/[0.06] sticky top-0 z-50">
      {/* Hidden container for Google Translate widget */}
      <div id="google_translate_element" className="hidden" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">

        {/* LEFT: Shop Logo Image */}
        <Link href="/" className="flex items-center shrink-0 group py-1">
          <img
            src="/logo2.png"
            alt={settings.storeName || 'IMOSTRADA DIGITAL PRODUCTS'}
            className="h-6 sm:h-7 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* CENTER: Marketplace Partner Store Logos (GAMIVO, G2A, Driffle) - Hidden on mobile, visible on desktop */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          <img src="/img2.png" alt="GAMIVO" className="h-5 sm:h-6 w-auto object-contain opacity-90 hover:opacity-100 transition" />
          <img src="/img1.png" alt="G2A" className="h-5 sm:h-6 w-auto object-contain opacity-90 hover:opacity-100 transition" />
          <img src="/img3.png" alt="Driffle" className="h-5 sm:h-6 w-auto object-contain opacity-90 hover:opacity-100 transition" />
        </div>

        {/* RIGHT: Status + Language + Admin */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online status pill */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-gray-300 bg-[#0d1629] px-2.5 sm:px-3 py-1.5 rounded-full border border-white/10 shrink-0">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: settings.isOnline ? '#22c55e' : '#ef4444',
                boxShadow: settings.isOnline ? '0 0 6px #22c55e' : '0 0 6px #ef4444',
                animation: settings.isOnline ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span className="hidden xs:inline">
              We are currently:{' '}
            </span>
            <strong style={{ color: settings.isOnline ? '#22c55e' : '#ef4444' }}>
              {settings.isOnline ? 'ONLINE' : 'OFFLINE'}
            </strong>
          </div>

          {/* Language Translator Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1 sm:gap-1.5 text-[11px] font-medium text-gray-300 bg-[#0d1629] hover:bg-[#111e33] px-2.5 sm:px-3 py-1.5 rounded-full border border-white/10 cursor-pointer transition"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{selectedLang.flag} <span className="hidden sm:inline">{selectedLang.name}</span></span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-[#0d1629] border border-gray-700 rounded-xl shadow-2xl py-1 z-50 text-xs text-gray-200">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-800 flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    {selectedLang.code === lang.code && (
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
