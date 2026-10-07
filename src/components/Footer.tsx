'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Lock } from 'lucide-react';

interface FooterProps {
  onOpenTerms: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTerms }) => {
  const [year, setYear] = useState(2025);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full bg-[#05080f] border-t border-gray-800/80 text-gray-400 text-xs pt-12 pb-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Footer Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-3 md:col-span-2">
            <Link href="/" className="flex items-center shrink-0 group">
              <img
                src="/logo2.png"
                alt="IMOSTRADA DIGITAL PRODUCTS"
                className="h-11 sm:h-13 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
            <p className="text-xs text-gray-400 max-w-sm">
              Your trusted source for digital products. Fast, safe, and automated delivery portal.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-1.5 text-gray-400">
              <li>
                <Link href="/" className="hover:text-amber-400 transition">
                  Redeem Code
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-amber-400 transition">
                  Check Order Status
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-amber-400 transition">
                  FAQ
                </Link>
              </li>
              <li>
                <button onClick={onOpenTerms} className="hover:text-amber-400 transition text-left">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={onOpenTerms} className="hover:text-amber-400 transition text-left">
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Support */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Support</h4>
            <ul className="space-y-1.5 text-gray-400">
              <li>
                <Link href="/faq" className="hover:text-amber-400 transition">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-amber-400 transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-purple-400 transition flex items-center space-x-1 text-purple-400">
                  <Lock className="w-3 h-3" />
                  <span>Admin Portal</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Partner Logos Bar matching image.png */}
        <div className="pt-6 border-t border-gray-800/60 flex flex-wrap justify-center items-center gap-5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#ff6b35]/10 border border-[#ff6b35]/30">
            <div className="w-5 h-5 rounded bg-[#ff6b35] flex items-center justify-center font-black text-[10px] text-white">G</div>
            <span className="text-xs font-black tracking-wider text-[#ff6b35]">GAMIVO</span>
          </div>

          <span className="text-gray-700 font-bold">•</span>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#e63329]/10 border border-[#e63329]/30">
            <div className="w-5 h-5 rounded bg-[#e63329] flex items-center justify-center font-black italic text-[10px] text-white">G2</div>
            <span className="text-xs font-black tracking-wider italic text-[#e63329]">G2A</span>
          </div>

          <span className="text-gray-700 font-bold">•</span>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#a855f7]/10 border border-[#a855f7]/30">
            <div className="w-5 h-5 rounded-full bg-[#a855f7] flex items-center justify-center font-bold text-[10px] text-white">D</div>
            <span className="text-xs font-bold text-[#a855f7]">Driffle</span>
          </div>
        </div>

        {/* Bottom Bar matching image.png */}
        <div className="pt-4 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between text-gray-500 text-[11px] gap-2">
          <span>© {year} IMOSTRADA. All rights reserved.</span>
          <div className="flex items-center space-x-2">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>Secure • Fast • Reliable</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
