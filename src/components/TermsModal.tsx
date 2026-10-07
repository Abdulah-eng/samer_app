'use client';

import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full p-6 text-gray-200 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-cyan-400 font-bold text-lg mb-4 border-b border-gray-800 pb-3">
          <ShieldCheck className="w-6 h-6" />
          <span>Terms & Conditions</span>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-gray-300 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          <p>
            Welcome to our Digital Product Delivery Portal. By entering your GAMIVO / Kinguin redeem code and submitting a delivery request, you agree to the following terms:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>One-Time Code Usage:</strong> Each redeem code is unique and can only be submitted once. Upon submission, the code status updates to processing.
            </li>
            <li>
              <strong>Account Preparation:</strong> Digital accounts, subscriptions, and game credentials are manually prepared by our fulfillment team. Standard delivery duration is 15-30 minutes during online hours.
            </li>
            <li>
              <strong>Security & Access:</strong> Once completed credentials are provided, customer is responsible for following provided setup instructions.
            </li>
            <li>
              <strong>Refunds & Support:</strong> If any issue occurs with your account activation, contact merchant support via the FAQ page with your Order Number.
            </li>
          </ol>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs uppercase tracking-wider transition"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
