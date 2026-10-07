'use client';

import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

interface NoticeBannerProps {
  noticeText: string;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ noticeText }) => {
  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4">
      {/* Thank you title matching design screenshot 1 */}
      <div className="text-center mb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-wider uppercase mb-2 drop-shadow-lg">
          THANK YOU
        </h2>
        <p className="text-lg sm:text-xl font-medium text-gray-200 uppercase tracking-widest">
          FOR YOUR PURCHASE
        </p>
        <div className="w-16 h-1 bg-amber-400/80 mx-auto mt-3 rounded-full" />
        <p className="text-sm text-gray-300 mt-3 font-medium">
          Only <span className="text-amber-400 font-bold">one step</span> left before you can start enjoying your <span className="font-semibold text-white">Games & Subscription</span>
        </p>
      </div>

      {/* Important Notice Card */}
      <div className="bg-gradient-to-b from-gray-900/90 to-gray-900/70 border border-amber-500/40 rounded-xl p-5 shadow-xl shadow-amber-500/5 backdrop-blur-md">
        <div className="flex items-center justify-center space-x-2 text-amber-400 font-bold tracking-wider text-sm uppercase mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>IMPORTANT NOTICE</span>
        </div>
        <div className="flex items-start space-x-3 text-xs sm:text-sm text-gray-300 leading-relaxed bg-amber-950/20 p-3.5 rounded-lg border border-amber-500/20">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <span>{noticeText}</span>
        </div>
      </div>
    </div>
  );
};
