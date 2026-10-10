'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TermsModal } from '@/components/TermsModal';
import { getStoreSettings } from '@/lib/store';
import { StoreSettings } from '@/lib/types';
import { ChevronDown, HelpCircle, Shield, Clock, Key, Mail } from 'lucide-react';

const FAQS = [
  {
    q: 'How do I redeem my GAMIVO, G2A or Driffle key?',
    a: 'Simply visit the Home page of this delivery portal, enter your unique redeem code received from GAMIVO, G2A or Driffle in the code box (formatted like XXXX-XXXX-XXXX), accept the terms, and click "Redeem Code".',
  },
  {
    q: 'How long does account delivery take after redeeming?',
    a: 'Digital accounts and keys are usually prepared and delivered within 1 hour to 24 hours during merchant online hours.',
  },
  {
    q: 'Why does my status say "Order is being processed"?',
    a: 'When you redeem a code, an order is automatically generated and queued for our fulfillment team. Our team manually prepares the digital account email, password, and activation steps to ensure 100% validity.',
  },
  {
    q: 'How do I view my account email and password when ready?',
    a: 'Click on "Check Order Status" in the top navigation or main menu, enter your redeem code or Order ID (e.g. ORD-98241). Once marked "Completed", your account email and password will be displayed with quick copy buttons.',
  },
  {
    q: 'What should I do if I experience login issues?',
    a: 'Make sure you copy the exact email and password using the "Copy" buttons to avoid typos. If you still face issues, ensure you are following the provided step-by-step login instructions. You can also contact support with your Order Number.',
  },
];

export default function FAQPage() {
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'IMOSTRADA',
    merchantName: 'imostrada',
    isOnline: true,
    noticeText:
      'Delivery time starts after the redeem request is submitted. Products are typically delivered within 1 hour to 24 hours.',
  });

  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  useEffect(() => {
    getStoreSettings().then(setSettings);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100 font-sans">
      <Header settings={settings} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col items-center">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Find quick answers to common questions about code redemption & account delivery
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="w-full max-w-2xl space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg transition"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between font-semibold text-sm sm:text-base text-gray-200 hover:text-white transition"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-cyan-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-gray-300 border-t border-gray-800/80 pt-3 leading-relaxed bg-gray-950/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Footer Banner */}
        <div className="w-full max-w-2xl mt-10 bg-gradient-to-r from-gray-900 via-gray-900/90 to-gray-900 border border-cyan-500/30 rounded-2xl p-6 text-center space-y-3 shadow-xl">
          <Mail className="w-8 h-8 text-cyan-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Still need help with your order?</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Contact merchant support with your GAMIVO, G2A or Driffle order reference or unique redeem code.
          </p>
        </div>
      </main>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
      <Footer onOpenTerms={() => setIsTermsOpen(true)} />
    </div>
  );
}
