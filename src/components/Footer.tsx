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
        <div className="pt-6 border-t border-gray-800/60 flex flex-wrap justify-center items-center gap-6">
          <span className="text-lg font-black tracking-widest text-orange-500 opacity-90">GAMIVO</span>
          <span className="text-gray-700 font-bold">•</span>
          <span className="text-lg font-black tracking-widest text-red-400 opacity-90">G2A</span>
          <span className="text-gray-700 font-bold">•</span>
          <span className="text-lg font-black tracking-widest text-purple-400 opacity-90">Driffle</span>
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
